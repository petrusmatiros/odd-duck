export function getCookie(key: string): string | null {
	if (!key) return null;

	const cookies = document.cookie ? document.cookie.split("; ") : [];

	for (let i = 0; i < cookies.length; i++) {
		const cookie = cookies[i];

		if (!cookie) continue;
		if (cookie === key) {
			return cookie.split("=")[1];
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

		let cookieString = `${key}=${value};`;

		if (options?.secure) {
			cookieString += "secure;";
		}

		if (options?.sameSite) {
			cookieString += `SameSite=${options.sameSite};`;
		}

		if (options?.maxAge) {
			cookieString += `Max-Age=${options.maxAge};`;
		}

		if (options?.path) {
			cookieString += `Path=${options.path};`;
		}

    // Set the cookie
		document.cookie = cookieString;
	}
