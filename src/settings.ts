import {App, PluginSettingTab, Setting} from "obsidian";
import FileNotePlugin from "./main";

/**
 * Plugin settings interface.
 */
export interface FileNoteSettings {
	/** Comma-separated list of file extensions to create notes for */
	fileExtensions: string;
	/** Whether to automatically create notes when matching files are added */
	autoCreate: boolean;
	/** List of file paths excluded from note creation */
	excludedFiles: string[];
	/** List of folder paths excluded from note creation (includes subfolders) */
	excludedFolders: string[];
	/** Whether to hide source files that have a corresponding file note */
	hideFilesWithNotes: boolean;
	/** Template for note content. Use {{filename}} as placeholder for the source file name */
	noteTemplate: string;
}

/** Default settings values */
export const DEFAULT_SETTINGS: FileNoteSettings = {
	fileExtensions: 'mp4',
	autoCreate: false,
	excludedFiles: [],
	excludedFolders: [],
	hideFilesWithNotes: false,
	noteTemplate: '![[{{filename}}]]'
};

/**
 * Settings tab for the File Note plugin.
 * Allows users to configure file extensions and auto-create behavior.
 */
export class FileNoteSettingTab extends PluginSettingTab {
	plugin: FileNotePlugin;

	constructor(app: App, plugin: FileNotePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		// File extensions setting
		new Setting(containerEl)
			.setName('File extensions')
			.setDesc('Comma-separated list of file extensions to create notes for (e.g., mp4, pdf, png)')
			.addText(text => text
				.setPlaceholder('mp4, pdf, png')
				.setValue(this.plugin.settings.fileExtensions)
				.onChange(async (value) => {
					this.plugin.settings.fileExtensions = value;
					await this.plugin.saveSettings();
				}));

		// Auto-create toggle
		new Setting(containerEl)
			.setName('Auto-create notes')
			.setDesc('Automatically create a file note when a file with a matching extension is added')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoCreate)
				.onChange(async (value) => {
					this.plugin.settings.autoCreate = value;
					await this.plugin.saveSettings();
				}));

		// Hide files with notes toggle
		new Setting(containerEl)
			.setName('Hide files with notes')
			.setDesc('Hide source files in the file explorer when they have a corresponding file note')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideFilesWithNotes)
				.onChange(async (value) => {
					this.plugin.settings.hideFilesWithNotes = value;
					await this.plugin.saveSettings();
					this.plugin.updateHiddenFiles();
				}));

		// Note template setting - custom layout for better UX
		const templateSetting = new Setting(containerEl)
			.setName('Note template')
			.setDesc(createFragment(frag => {
				frag.appendText('Template for the content of created notes. Use ');
				frag.createEl('code', {text: '{{filename}}'});
				frag.appendText(' as a placeholder for the source file name (e.g., video.mp4).');
			}));

		// Create textarea container for custom positioning
		const textareaContainer = templateSetting.settingEl.createDiv({cls: 'file-note-template-container'});
		const textarea = textareaContainer.createEl('textarea', {
			cls: 'file-note-template-textarea',
			attr: {placeholder: '![[{{filename}}]]'}
		});
		textarea.value = this.plugin.settings.noteTemplate;
		textarea.addEventListener('input', async () => {
			this.plugin.settings.noteTemplate = textarea.value;
			await this.plugin.saveSettings();
		});

		// Add examples below textarea
		const examplesEl = templateSetting.settingEl.createDiv({cls: 'file-note-template-examples'});
		examplesEl.appendText('Examples: ');
		examplesEl.createEl('code', {text: '![[{{filename}}]]'});
		examplesEl.appendText(' embeds the file, ');
		examplesEl.createEl('code', {text: '[[{{filename}}]]'});
		examplesEl.appendText(' links to the file, ');
		examplesEl.createEl('code', {text: '# {{filename}}'});
		examplesEl.appendText(' heading with file name');
	}
}
