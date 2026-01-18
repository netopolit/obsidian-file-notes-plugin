import {App, Notice, TFile} from 'obsidian';
import {FileNoteSettings} from './settings';

/** Result of a batch file note operation */
export interface BatchOperationResult {
	/** Number of notes successfully processed */
	success: number;
	/** Number of notes skipped (already exist or don't exist) */
	skipped: number;
	/** Number of operations that failed */
	failed: number;
}

/**
 * Builds a notice message for a batch operation result.
 * @param result - The batch operation result
 * @param action - The action verb (e.g., 'Created', 'Removed')
 * @param includeSkipped - Whether to include skipped count in the message
 * @returns Formatted message string
 */
export function formatBatchResultMessage(
	result: BatchOperationResult,
	action: string,
	includeSkipped = true
): string {
	let message = `${action} ${result.success} notes`;
	if (includeSkipped) {
		message += `, skipped ${result.skipped} existing`;
	}
	if (result.failed > 0) {
		message += `, ${result.failed} failed`;
	}
	return message;
}

/**
 * Handles file note CRUD operations.
 * Provides methods for creating, removing, and querying file notes.
 */
export class FileNoteOperations {
	private app: App;
	private settings: FileNoteSettings;

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
	 * Returns the path for the file note corresponding to a source file.
	 * @param file - The source file
	 * @returns The path with the file extension replaced with .md
	 */
	getNotePath(file: TFile): string {
		return file.path.replace(/\.[^.]+$/, '.md');
	}

	/**
	 * Generates note content from the template, replacing {{filename}} with the actual file name.
	 * @param file - The source file to generate content for
	 * @returns The note content with placeholders replaced
	 */
	getNoteContent(file: TFile): string {
		return this.settings.noteTemplate.replace(/\{\{filename\}\}/g, file.name);
	}

	/**
	 * Creates a file note for a single file.
	 * The note content is generated from the configured template.
	 * @param file - The source file to create a note for
	 * @param showNotice - Whether to show a notice on success/failure
	 */
	async createFileNote(file: TFile, showNotice = true) {
		const mdPath = this.getNotePath(file);
		const exists = this.app.vault.getAbstractFileByPath(mdPath);

		if (exists) {
			if (showNotice) new Notice('File note already exists');
			return;
		}

		try {
			const content = this.getNoteContent(file);
			await this.app.vault.create(mdPath, content);
			if (showNotice) new Notice('Created File note');
		} catch (error) {
			console.error('Failed to create file note:', error);
			new Notice(`Failed to create file note: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Creates file notes for multiple files.
	 * @param files - Array of source files to create notes for
	 * @returns Count of created, skipped (already existing), and failed notes
	 */
	async createFileNotes(files: TFile[]): Promise<BatchOperationResult> {
		let success = 0;
		let skipped = 0;
		let failed = 0;

		for (const file of files) {
			const mdPath = this.getNotePath(file);
			const exists = this.app.vault.getAbstractFileByPath(mdPath);

			if (exists) {
				skipped++;
				continue;
			}

			try {
				const content = this.getNoteContent(file);
				await this.app.vault.create(mdPath, content);
				success++;
			} catch (error) {
				console.error(`Failed to create note for ${file.path}:`, error);
				failed++;
			}
		}

		return {success, skipped, failed};
	}

	/**
	 * Removes the file note for a single file.
	 * @param file - The source file whose note should be removed
	 * @param showNotice - Whether to show a notice on success/failure
	 */
	async removeFileNote(file: TFile, showNotice = true) {
		const mdPath = this.getNotePath(file);
		const mdFile = this.app.vault.getAbstractFileByPath(mdPath);

		if (!mdFile || !(mdFile instanceof TFile)) {
			if (showNotice) new Notice('File note does not exist');
			return;
		}

		try {
			await this.app.vault.delete(mdFile);
			if (showNotice) new Notice('Removed File note');
		} catch (error) {
			console.error('Failed to remove file note:', error);
			new Notice(`Failed to remove file note: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Removes file notes for multiple files.
	 * @param files - Array of source files whose notes should be removed
	 * @returns Count of removed, skipped (non-existing), and failed notes
	 */
	async removeFileNotes(files: TFile[]): Promise<BatchOperationResult> {
		let success = 0;
		let skipped = 0;
		let failed = 0;

		for (const file of files) {
			const mdPath = this.getNotePath(file);
			const mdFile = this.app.vault.getAbstractFileByPath(mdPath);

			if (!mdFile || !(mdFile instanceof TFile)) {
				skipped++;
				continue;
			}

			try {
				await this.app.vault.delete(mdFile);
				success++;
			} catch (error) {
				console.error(`Failed to remove note for ${file.path}:`, error);
				failed++;
			}
		}

		return {success, skipped, failed};
	}

	/**
	 * Returns existing file notes for the given source files.
	 * @param files - Array of source files to check for existing notes
	 * @returns Array of TFile objects for notes that exist
	 */
	getExistingNotes(files: TFile[]): TFile[] {
		return files
			.map(f => this.app.vault.getAbstractFileByPath(this.getNotePath(f)))
			.filter((f): f is TFile => f instanceof TFile);
	}
}
