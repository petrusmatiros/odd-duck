import type { GamePack } from "../types";

export const dark_pack: GamePack = {
	id: "dark_pack",
	title: "Dark Pack",
	category: "dark",
	locations: [
		{
			id: "haunted_house_1",
			img_url: "https://images.unsplash.com/photo-1481018085669-2bc6e4f00eed",
			translations: {
				en: {
					title: "Haunted House",
					description: "A spooky house filled with ghosts and eerie sounds.",
					roles: [
						"ghost",
						"medium",
						"victim",
						"investigator",
						"caretaker",
						"spirit",
						"exorcist",
						"photographer",
						"paranormal expert",
						"treasure hunter",
					],
				},
				sv: {
					title: "Spökhus",
					description: "Ett hemsökt hus fullt med spöken och kusliga ljud.",
					roles: [
						"spöke",
						"medium",
						"offer",
						"utredare",
						"vaktmästare",
						"ande",
						"exorcist",
						"fotograf",
						"paranormal expert",
						"skattjägare",
					],
				},
			},
		},
		{
			id: "abandoned_asylum_1",
			img_url: "https://images.unsplash.com/photo-1484608577325-c7540cc6794d",
			translations: {
				en: {
					title: "Abandoned Asylum",
					description: "A desolate mental asylum left to decay with dark secrets.",
					roles: [
						"patient",
						"doctor",
						"nurse",
						"guard",
						"psychiatrist",
						"ghost",
						"detective",
						"escapee",
						"historian",
						"survivor",
					],
				},
				sv: {
					title: "Övergivet Asyl",
					description: "Ett övergivet mentalsjukhus som lämnas att förfalla med mörka hemligheter.",
					roles: [
						"patient",
						"läkare",
						"sjuksköterska",
						"väktare",
						"psykolog",
						"spöke",
						"detektiv",
						"flykting",
						"historiker",
						"överlevande",
					],
				},
			},
		},
		{
			id: "dark_forest_1",
			img_url: "https://images.unsplash.com/photo-1483982258113-b72862e6cff6",
			translations: {
				en: {
					title: "Dark Forest",
					description: "A dense, mist-filled forest that holds untold dangers.",
					roles: [
						"hunter",
						"lost traveler",
						"forest spirit",
						"tracker",
						"mystic",
						"survivalist",
						"shadow figure",
						"herbalist",
						"beast",
						"ghostly wanderer",
					],
				},
				sv: {
					title: "Mörk Skog",
					description: "En tät, dimmig skog som håller osagda faror.",
					roles: [
						"jägare",
						"vilseförd resenär",
						"skogens ande",
						"spårhund",
						"mystiker",
						"överlevnadsexpert",
						"skuggfigur",
						"örtterapeut",
						"odjur",
						"spöklik vandrare",
					],
				},
			},
		},
		{
			id: "abandoned_castle_1",
			img_url: "https://images.unsplash.com/photo-1580677616212-2fa929e9c2cd",
			translations: {
				en: {
					title: "Abandoned Castle",
					description: "A ruined, desolate castle that whispers ancient secrets.",
					roles: [
						"knight",
						"ghost",
						"prisoner",
						"warlord",
						"historian",
						"treasure hunter",
						"castle keeper",
						"haunted lord",
						"explorer",
						"betrayer",
					],
				},
				sv: {
					title: "Övergivet Slott",
					description: "Ett ruinerat, övergivet slott som viskar gamla hemligheter.",
					roles: [
						"riddare",
						"spöke",
						"fånge",
						"krigsherr",
						"historiker",
						"skattjägare",
						"slottvakt",
						"hemsökt herre",
						"utforskare",
						"förrädare",
					],
				},
			},
		},
		{
			id: "vampire_lair_1",
			img_url: "https://images.unsplash.com/photo-1734967640286-f8835c3209fd",
			translations: {
				en: {
					title: "Vampire Lair",
					description: "A dark underground lair where vampires rest in their coffins.",
					roles: [
						"vampire",
						"hunter",
						"victim",
						"witch",
						"guardian",
						"servant",
						"survivor",
						"researcher",
						"vampire lord",
						"ghost",
					],
				},
				sv: {
					title: "Vampyrhåla",
					description: "En mörk underjordisk håla där vampyrer vilar i sina kistor.",
					roles: [
						"vampyr",
						"jägare",
						"offer",
						"häxa",
						"väktare",
						"tjänare",
						"överlevande",
						"forskare",
						"vampyrherre",
						"spöke",
					],
				},
			},
		},
		{
			id: "crypt_1",
			img_url: "https://images.unsplash.com/photo-1667078573958-e57723df2542",
			translations: {
				en: {
					title: "Crypt",
					description: "A dark underground tomb for the forgotten dead.",
					roles: [
						"grave robber",
						"crypt keeper",
						"mourners",
						"spirit",
						"necromancer",
						"priest",
						"cursed soul",
						"explorer",
						"witness",
						"guardian",
					],
				},
				sv: {
					title: "Krypta",
					description: "En mörk underjordisk gravkammare för de bortglömda döda.",
					roles: [
						"gravrövare",
						"kryptvakt",
						"sörjande",
						"ande",
						"nekromantiker",
						"präst",
						"förbannad själ",
						"utforskare",
						"vittne",
						"väktare",
					],
				},
			},
		},
		{
			id: "dark_alley_1",
			img_url: "https://images.unsplash.com/photo-1508840582138-f2e8452373d9",
			translations: {
				en: {
					title: "Dark Alley",
					description: "A narrow, shadowy alley where danger lurks at every corner.",
					roles: [
						"thief",
						"victim",
						"street performer",
						"gang leader",
						"detective",
						"bouncer",
						"shadowy figure",
						"wanderer",
						"vigilante",
						"police officer",
					],
				},
				sv: {
					title: "Mörk Gränd",
					description: "En smal, skuggig gränd där faror lurar bakom varje hörn.",
					roles: [
						"tjuv",
						"offer",
						"gatuföreställare",
						"gangledare",
						"detektiv",
						"vakt",
						"skuggfigur",
						"vandrare",
						"självutnämnd hämnare",
						"polis",
					],
				},
			},
		},
	],
};
