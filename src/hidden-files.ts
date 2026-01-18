import {App, debounce} from 'obsidian';
import {FileNoteSettings} from './settings';
import {FileExplorerView} from './types';

/** Delay in ms before updating hidden files after vault changes (debounce) */
const HIDDEN_FILES_UPDATE_DELAY_MS = 100;

/**
 * Manages visibility of source files in the file explorer.
 * Hides files that have corresponding file notes when the setting is enabled.
 */
export class HiddenFilesManager {
	private app: App;
	private settings: FileNoteSettings;
	private hasHiddenFiles = false;

	/** Debounced version of update to prevent excessive updates during bulk operations */
	readonly debouncedUpdate = debounce(
		() => this.update(),
		HIDDEN_FILES_UPDATE_DELAY_MS,
		true
	);

	constructor(app: App, settings: FileNoteSettings) {
		this.app = app;
		this.settings = settings;
	}

	/**
	 * Updates the settings reference.
	 * Call this after settings are reloaded.
	 * @param settings - The new settings object
	 */
	updateSettings(settings: FileNoteSettings) {
		this.settings = settings;
	}

	/**
	 * Updates visibility of source files in the file explorer.
	 * Hides any non-md file that has a corresponding .md note when setting is enabled.
	 */
	update() {
		// Early return if setting is off and no files need unhiding
		if (!this.settings.hideFilesWithNotes && !this.hasHiddenFiles) {
			return;
		}

		// Find file explorer leaf
		const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
		if (!fileExplorer) return;

		const fileExplorerView = fileExplorer.view as unknown as FileExplorerView;
		if (!fileExplorerView.fileItems) return;

		let hiddenCount = 0;

		// Process each item in the file explorer
		for (const [path, item] of Object.entries(fileExplorerView.fileItems)) {
			// Check if a corresponding .md note exists for this path
			const notePath = path.replace(/\.[^.]+$/, '.md');

			// Skip if this is already an md file or has no extension (path unchanged by regex)
			if (path === notePath) {
				continue;
			}

			const noteExists = this.app.vault.getAbstractFileByPath(notePath);

			// Hide the source file if setting is enabled and note exists
			if (this.settings.hideFilesWithNotes && noteExists) {
				item.el.addClass('file-note-hidden');
				hiddenCount++;
			} else {
				item.el.removeClass('file-note-hidden');
			}
		}

		this.hasHiddenFiles = hiddenCount > 0;
	}

	/**
	 * Cancels any pending debounced update calls.
	 * Call this on plugin unload.
	 */
	cancelPendingUpdate() {
		this.debouncedUpdate.cancel();
	}
}
