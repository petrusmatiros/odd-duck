export function getCookie(key: string): string | null {
	if (!key) return null;

	// Array of cookie strings
	const cookies = document.cookie ? document.cookie.split("; ") : [];

	for (let i = 0; i < cookies.length; i++) {
		const cookie = cookies[i];

		if (!cookie) continue;
		// Cookie pair is in the format "key=value"
		const [cookieKey, cookieValue] = cookie.split("=");
		if (!cookieKey) continue;
		if (cookieKey === key) {
			return cookieValue;
		}
	}
	return null;
}

type CookieOptions = {
	key: string;
	value: string;
	options: {
		secure?: boolean;
		sameSite?: "Strict" | "Lax" | "None";
		maxAge?: number;
		path?: string;
	};
};

export const defaultCookieOptions: CookieOptions["options"] = {
	secure: true,
	sameSite: "Strict",
	maxAge: 60 * 60 * 24, // 1 day
	path: "/",
};

export function setCookie(cookieOptions: CookieOptions): void {
	if (!cookieOptions.key || !cookieOptions.value) return;

	const cookieStringBuilder: string[] = [];

	// Ensure the key and value are properly encoded
	const cookieString = `${cookieOptions.key}=${cookieOptions.value};`;
	cookieStringBuilder.push(cookieString);

	if (cookieOptions.options?.secure) {
		cookieStringBuilder.push("Secure;");
	}

	if (cookieOptions.options?.sameSite) {
		cookieStringBuilder.push(`SameSite=${cookieOptions.options.sameSite};`);
	}

	if (cookieOptions.options?.maxAge) {
		cookieStringBuilder.push(`Max-Age=${cookieOptions.options.maxAge};`);
	}

	if (cookieOptions.options?.path) {
		cookieStringBuilder.push(`Path=${cookieOptions.options.path};`);
	}

	// Set the cookie
	document.cookie = cookieStringBuilder.join(" ").trim();
}
