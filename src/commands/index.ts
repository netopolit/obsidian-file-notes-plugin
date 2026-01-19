import type FileNotePlugin from "../main";

/**
 * Registers all plugin commands.
 * @param plugin - The plugin instance to register commands on
 */
export function registerCommands(plugin: FileNotePlugin) {
	plugin.addCommand({
		id: 'create-all',
		name: 'Create notes for all files',
		callback: () => plugin.createAllFileNotes(),
	});

	plugin.addCommand({
		id: 'remove-all',
		name: 'Remove notes from all files',
		callback: () => plugin.removeAllFileNotes(),
	});

	plugin.addCommand({
		id: 'toggle-files-with-notes-visibility',
		name: 'Toggle files with notes visibility',
		callback: () => plugin.toggleFilesWithNotesVisibility(),
	});
}
