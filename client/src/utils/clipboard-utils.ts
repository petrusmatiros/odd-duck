export async function copyToClipboard(text: string): Promise<void> {
	if (!navigator.clipboard) {
		console.warn("Clipboard API not supported");
		return;
	}

	try {
		navigator.clipboard
			.writeText(text)
			.then(() => {})
			.catch((err) => {
				console.error("Failed to write to clipboard:", err);
			});
	} catch (err) {
		console.error("Failed to copy text to clipboard:", err);
	}
}
