interface GameLocation {
	id: string;
	title: string;
	description: string;
	img_url: string;
}

type GameCategory =
	| "mixed"
	| "dark"
	| "light"
	| "nature"
	| "scifi"
	| "fantasy"
	| "horror"
	| "urban"
	| "historical";

interface GamePack {
	id: string;
	title: string;
	locations: GameLocation[];
	category: GameCategory;
}

const standard_pack: GamePack = {
	id: "standard_pack",
	title: "Standard Pack",
  category: "mixed",
	locations: [
		{
			id: "cruise_ship_1",
			title: "Cruise Ship",
			description: "A cruise ship sailing in the ocean.",
			img_url:
				"https://images.unsplash.com/photo-1568045374121-f59eb61c7c8d",
		},
	],
};

export const gamePacks: GamePack[] = [standard_pack];
