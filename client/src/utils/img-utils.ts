export default function unsplashImageUrl(url: string, quality?: 50): string {
	// Ensure the URL is a valid Unsplash image URL
	if (!url) {
		throw new Error("Invalid Unsplash image URL");
	}
	const params = {
		auto: "compress",
		fm: "webp",
		q: (quality ?? 50).toString(),
		fit: "fill",
		w: "1920",
		h: "1080",
	};
	const queryString = new URLSearchParams(params).toString();
	return `${url}?${queryString}`;
}
