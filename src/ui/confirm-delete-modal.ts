import {App, Modal, TFile} from 'obsidian';

/** Delay in ms before focusing the modal button (allows animation to complete) */
const MODAL_FOCUS_DELAY_MS = 50;

/**
 * Modal dialog for confirming file note deletion.
 * Displays a scrollable list of files to be deleted with Cancel and Delete buttons.
 * Delete button is focused on open for easy keyboard confirmation.
 */
export class ConfirmDeleteModal extends Modal {
	private files: TFile[];
	private onConfirm: () => void;

	constructor(app: App, files: TFile[], onConfirm: () => void) {
		super(app);
		this.files = files;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();

		// Header
		contentEl.createEl('h2', {text: 'Confirm deletion'});
		contentEl.createEl('p', {
			text: `This will delete ${this.files.length} file note${this.files.length === 1 ? '' : 's'}:`
		});

		// Scrollable file list
		const listContainer = contentEl.createDiv({cls: 'file-note-delete-list'});
		const list = listContainer.createEl('ul');

		for (const file of this.files) {
			list.createEl('li', {text: file.path});
		}

		// Action buttons
		const buttonContainer = contentEl.createDiv({cls: 'file-note-button-container'});

		const cancelButton = buttonContainer.createEl('button', {text: 'Cancel'});
		cancelButton.addEventListener('click', () => this.close());

		const confirmButton = buttonContainer.createEl('button', {
			text: 'Delete',
			cls: 'mod-warning'
		});
		confirmButton.addEventListener('click', () => {
			this.close();
			this.onConfirm();
		});

		// Focus the delete button so user can press Enter/Space to confirm
		// Use setTimeout to ensure focus happens after modal animation completes
		setTimeout(() => {
			confirmButton.focus();
		}, MODAL_FOCUS_DELAY_MS);
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
