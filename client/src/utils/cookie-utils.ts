export function getCookie(key: string): string | null {
	if (!key) return null;

	const cookies = document.cookie ? document.cookie.split("; ") : [];
	console.log("Cookies", cookies);

	for (let i = 0; i < cookies.length; i++) {
		const cookie = cookies[i];

		if (!cookie) continue;
		const [cookieKey, cookieValue] = cookie.split("=");
		if (!cookieKey) continue;
		if (cookieKey === key) {
			return cookieValue;
		}
	}
	return null;
}

export function setCookie(
	key: string,
	value: string,
	options: {
		secure?: boolean;
		sameSite?: "Strict" | "Lax" | "None";
		maxAge?: number;
		path?: string;
	} = {},
): void {
		if (!key || !value) return;

		const cookieStringBuilder: string[] = [];

		// Ensure the key and value are properly encoded
		const cookieString = `${key}=${value};`;
		cookieStringBuilder.push(cookieString);

		if (options?.secure) {
			cookieStringBuilder.push("Secure;");
		}

		if (options?.sameSite) {
			cookieStringBuilder.push(`SameSite=${options.sameSite};`);
		}

		if (options?.maxAge) {
			cookieStringBuilder.push(`Max-Age=${options.maxAge};`);
		}

		if (options?.path) {
			cookieStringBuilder.push(`Path=${options.path || "/"};`);
		}

    // Set the cookie
		document.cookie = cookieStringBuilder.join(" ").trim();
	}
