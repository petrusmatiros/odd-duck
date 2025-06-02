export async function copyToClipboard(text: string): Promise<void> {
	if (!navigator.clipboard) {
		console.warn("Clipboard API not supported");
		return;
	}

	if (!document.hasFocus()) {
		console.warn("Document is not focused. Clipboard access denied.");
		return;
	}

	try {
		navigator.clipboard
			.writeText(text)
			.then(() => {})
			.catch((err) => {
				console.warn("Failed to write to clipboard:", err);
			});
	} catch (err) {
		console.warn("Failed to copy text to clipboard:", err);
	}
}
