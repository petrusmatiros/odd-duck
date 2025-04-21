type GameSupportedLanguages = "en" | "sv";

export interface GameLocation {
	id: Lowercase<string>;
	img_url: string;
	translations: Record<GameSupportedLanguages, GameTranslation>;
}

type GameTranslation = {
	title: string;
	description: string;
	roles: Lowercase<string>[];
};

type GameCategory =
	| "mixed"
	| "dark"
	| "light"
	| "nature"
	| "scifi"
	| "fantasy"
	| "horror"
	| "urban"
	| "historical"
	| "mythology"
	| "mystery"
	| "supernatural"
	| "adventure"
	| "entertainment"

/**
 * GamePack is a collection of game locations, each with its own translations and images.
 * Should have 20 locations, where each location has atleast 10 roles.
 */
export interface GamePack {
	id: string;
	title: string;
	locations: GameLocation[];
	category: GameCategory;
}

