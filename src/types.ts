/**
 * Internal Obsidian file explorer view structure.
 * Used to access file items for hiding/showing in the explorer.
 */
export interface FileExplorerView {
	fileItems: Record<string, { el: HTMLElement }>;
}
