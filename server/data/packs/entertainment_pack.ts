import type { GamePack } from "../types";

export  const entertainment_pack: GamePack = {
  id: "entertainment_pack",
  title: "Entertainment Pack",
  category: "entertainment",
  locations: [
    {
      id: "cruise_ship_1",
      img_url: "https://images.unsplash.com/photo-1568045374121-f59eb61c7c8d",
      translations: {
        en: {
          title: "Cruise Ship",
          description: "A cruise ship sailing in the ocean.",
          roles: [
            "captain",
            "economy class passenger",
            "first class passenger",
            "kitchen staff",
            "waiter",
            "cleaning staff",
            "entertainer",
            "security",
            "engineer",
            "doctor",
            "nurse",
            "mechanic",
            "second captain"
          ]
        },
        sv: {
          title: "Kryssningsfartyg",
          description: "Ett kryssningsfartyg som seglar i havet.",
          roles: [
            "kapten",
            "ekonomi klass passagerare",
            "första klass passagerare",
            "kök personal",
            "servitör",
            "städpersonal",
            "underhållare",
            "väktare",
            "ingenjör",
            "läkare",
            "sjuksköterska",
            "mekaniker",
            "andra kapten"
          ]
        }
      }
    },
    {
      id: "graveyard_1",
      img_url: "https://images.unsplash.com/photo-1695671516947-961b52fe1e06",
      translations: {
        en: {
          title: "Graveyard",
          description: "A quiet place with tombstones where the dead are buried.",
          roles: [
            "priest",
            "mourner",
            "gravedigger",
            "ghost",
            "caretaker",
            "detective",
            "photographer",
            "historian",
            "gardener",
            "funeral director"
          ]
        },
        sv: {
          title: "Kyrkogård",
          description: "En stillsam plats med gravstenar där de döda är begravda.",
          roles: [
            "präst",
            "sörjande",
            "gravgrävare",
            "spöke",
            "vaktmästare",
            "detektiv",
            "fotograf",
            "historiker",
            "trädgårdsmästare",
            "begravningsentreprenör"
          ]
        }
      }
    },
    {
      id: "soccer_stadium_1",
      img_url: "https://images.unsplash.com/photo-1629217855633-79a6925d6c47",
      translations: {
        en: {
          title: "Soccer Stadium",
          description: "A large venue where soccer matches are held and fans gather to watch.",
          roles: [
            "player",
            "coach",
            "referee",
            "fan",
            "security guard",
            "vendor",
            "groundskeeper",
            "announcer",
            "mascot",
            "team medic"
          ]
        },
        sv: {
          title: "Fotbollsstadion",
          description: "En stor arena där fotbollsmatcher hålls och fans samlas för att titta.",
          roles: [
            "spelare",
            "tränare",
            "domare",
            "fan",
            "säkerhetsvakt",
            "försäljare",
            "planvårdare",
            "speaker",
            "maskot",
            "lagläkare"
          ]
        }
      }
    },
    {
      id: "music_concert_1",
      img_url: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b",
      translations: {
        en: {
          title: "Music Concert",
          description: "A lively event where musicians perform for an audience.",
          roles: [
            "lead singer",
            "guitarist",
            "drummer",
            "bassist",
            "fan",
            "security",
            "stage manager",
            "sound technician",
            "roadie",
            "photographer"
          ]
        },
        sv: {
          title: "Musikkonsert",
          description: "Ett livligt evenemang där musiker uppträder för en publik.",
          roles: [
            "sångare",
            "gitarrist",
            "trummis",
            "bassist",
            "fan",
            "säkerhetsvakt",
            "scenchef",
            "ljudtekniker",
            "scenarbetare",
            "fotograf"
          ]
        }
      }
    },
    {
      id: "amusement_park_1",
      img_url: "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b",
      translations: {
        en: {
          title: "Amusement Park",
          description: "A fun park with rides, games, and attractions for all ages.",
          roles: [
            "ride operator",
            "visitor",
            "mascot",
            "food vendor",
            "security",
            "cleaner",
            "technician",
            "ticket seller",
            "entertainer",
            "photographer"
          ]
        },
        sv: {
          title: "Nöjespark",
          description: "En rolig park med åkattraktioner, spel och attraktioner för alla åldrar.",
          roles: [
            "åkattraktionsoperatör",
            "besökare",
            "maskot",
            "matförsäljare",
            "säkerhetsvakt",
            "städare",
            "tekniker",
            "biljettförsäljare",
            "underhållare",
            "fotograf"
          ]
        }
      }
    },
    {
      id: "circus_1",
      img_url: "https://images.unsplash.com/photo-1678270852355-7f2bbbe8811e",
      translations: {
        en: {
          title: "Circus",
          description: "A traveling show with acrobats, clowns, and trained animals.",
          roles: [
            "ringmaster",
            "clown",
            "acrobat",
            "tightrope walker",
            "animal trainer",
            "audience member",
            "stagehand",
            "vendor",
            "juggler",
            "magician"
          ]
        },
        sv: {
          title: "Cirkus",
          description: "En kringresande show med akrobater, clowner och dresserade djur.",
          roles: [
            "cirkusdirektör",
            "clown",
            "akrobat",
            "lindansare",
            "djurtränare",
            "publik",
            "scenarbetare",
            "försäljare",
            "jonglör",
            "magiker"
          ]
        }
      }
    },
    {
      id: "theater_1",
      img_url: "https://images.unsplash.com/photo-1562329265-95a6d7a83440",
      translations: {
        en: {
          title: "Theater",
          description: "A venue where live stage performances are presented.",
          roles: [
            "actor",
            "director",
            "stagehand",
            "audience member",
            "usher",
            "costume designer",
            "lighting technician",
            "makeup artist",
            "ticket seller",
            "critic"
          ]
        },
        sv: {
          title: "Teater",
          description: "En plats där scenföreställningar uppförs live.",
          roles: [
            "skådespelare",
            "regissör",
            "scenarbetare",
            "publik",
            "vaktmästare",
            "kostymdesigner",
            "ljustekniker",
            "makeupartist",
            "biljettförsäljare",
            "kritiker"
          ]
        }
      }
    },
    {
			id: "opera_1",
			img_url: "https://images.unsplash.com/photo-1580809361436-42a7ec204889",
			translations: {
				en: {
					title: "Opera",
					description: "A grand venue featuring dramatic musical performances.",
					roles: [
						"opera singer",
						"conductor",
						"orchestra musician",
						"audience member",
						"costume designer",
						"stage director",
						"ticket checker",
						"lighting technician",
						"usher",
						"critic",
					],
				},
				sv: {
					title: "Opera",
					description: "En pampig plats med dramatiska musikföreställningar.",
					roles: [
						"operasångare",
						"dirigent",
						"orkestermusiker",
						"publik",
						"kostymdesigner",
						"scenregissör",
						"biljettkontrollant",
						"ljustekniker",
						"vaktmästare",
						"kritiker",
					],
				},
			},
		},
    {
			id: "kindergarten_1",
			img_url: "https://images.unsplash.com/photo-1564429238817-393bd4286b2d",
			translations: {
				en: {
					title: "Kindergarten",
					description: "A place where young children play and learn.",
					roles: [
						"teacher",
						"child",
						"parent",
						"assistant",
						"principal",
						"cleaner",
						"cook",
						"nurse",
						"caretaker",
						"storyteller",
					],
				},
				sv: {
					title: "Förskola",
					description: "En plats där små barn leker och lär sig.",
					roles: [
						"lärare",
						"barn",
						"förälder",
						"assistent",
						"rektor",
						"städare",
						"kock",
						"sjuksköterska",
						"vaktmästare",
						"sagoberättare",
					],
				},
			},
		},
    {
			id: "beach_1",
			img_url: "https://images.unsplash.com/photo-1519046904884-53103b34b206",
			translations: {
				en: {
					title: "Beach",
					description:
						"A sunny stretch of sand by the water, perfect for relaxing.",
					roles: [
						"lifeguard",
						"sunbather",
						"swimmer",
						"ice cream vendor",
						"surfer",
						"beach volleyball player",
						"child",
						"parent",
						"fisherman",
						"sand sculptor",
					],
				},
				sv: {
					title: "Strand",
					description:
						"En solig sandstrand vid vattnet, perfekt för avkoppling.",
					roles: [
						"livräddare",
						"solbadare",
						"simmare",
						"glassförsäljare",
						"surfare",
						"beachvolleyspelare",
						"barn",
						"förälder",
						"fiskare",
						"sandskulptör",
					],
				},
			},
		},
    {
			id: "retirement_home_1",
			img_url: "https://images.unsplash.com/photo-1496938461470-aaa34930e2d7",
			translations: {
				en: {
					title: "Retirement Home",
					description: "A residence for elderly people with support staff.",
					roles: [
						"nurse",
						"caretaker",
						"resident",
						"doctor",
						"cook",
						"cleaner",
						"receptionist",
						"family visitor",
						"activity coordinator",
						"therapist",
					],
				},
				sv: {
					title: "Äldreboende",
					description: "Ett boende för äldre med stödpersonal.",
					roles: [
						"sjuksköterska",
						"vårdare",
						"boende",
						"läkare",
						"kock",
						"städare",
						"receptionist",
						"familjebesökare",
						"aktivitetsledare",
						"terapeut",
					],
				},
			},
		},
    {
			id: "space_ship_1",
			img_url: "https://images.unsplash.com/photo-1451187863213-d1bcbaae3fa3",
			translations: {
				en: {
					title: "Space Ship",
					description: "A futuristic vessel traveling through outer space.",
					roles: [
						"captain",
						"pilot",
						"engineer",
						"scientist",
						"medic",
						"navigator",
						"technician",
						"security officer",
						"robot",
						"alien",
					],
				},
				sv: {
					title: "Rymdskepp",
					description: "Ett futuristiskt fartyg som färdas i rymden.",
					roles: [
						"kapten",
						"pilot",
						"ingenjör",
						"forskare",
						"läkare",
						"navigatör",
						"tekniker",
						"säkerhetsofficer",
						"robot",
						"utomjording",
					],
				},
			},
		},
    {
			id: "submarine_1",
			img_url: "https://images.unsplash.com/photo-1600119330210-e7a3f5a0d079",
			translations: {
				en: {
					title: "Submarine",
					description:
						"A watercraft that operates beneath the surface of the sea.",
					roles: [
						"captain",
						"navigator",
						"engineer",
						"submarine officer",
						"crew member",
						"scientist",
						"chef",
						"doctor",
						"mechanic",
						"security",
					],
				},
				sv: {
					title: "U-båt",
					description: "Ett fartyg som opererar under havsytan.",
					roles: [
						"kapten",
						"navigator",
						"ingenjör",
						"ubåtsbefäl",
						"besättningsmedlem",
						"forskare",
						"kock",
						"läkare",
						"mekaniker",
						"säkerhet",
					],
				},
			},
		},
    {
			id: "mountain_resort_1",
			img_url: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99",
			translations: {
				en: {
					title: "Mountain Resort",
					description: "A resort high up the mountains to relax and enjoy nature.",
					roles: [
						"receptionist",
            "guest",
            "tourist",
            "hiker",
            "mountain guide",
            "chef",
            "cleaner",
            "security guard",
            "maintenance worker",
            "outdoor instructor",
            "resort manager",
					],
				},
				sv: {
					title: "Bergsanläggning",
					description: "En anläggning högt uppe i bergen för att koppla av och njuta av naturen.",
					roles: [
						"receptionist",
            "gäst",
            "turist",
            "vandrare",
            "bergsguide",
            "kock",
            "städare",
            "säkerhetsvakt",
            "underhållsarbetare",
            "utomhusinstruktör",
            "anläggningschef",
					],
				},
			},
		},
    {
			id: "archeological_site_1",
			img_url: "https://images.unsplash.com/photo-1736840317847-ebf3ba37f8a4",
			translations: {
				en: {
					title: "Archaeological Site",
					description:
						"A location where artifacts and ruins from past civilizations are uncovered.",
					roles: [
						"archaeologist",
						"excavator",
						"tourist",
						"historian",
						"research assistant",
						"museum curator",
						"field worker",
						"local guide",
						"photographer",
						"conservator",
					],
				},
				sv: {
					title: "Arkeologisk plats",
					description:
						"En plats där artefakter och ruiner från tidigare civilisationer grävs fram.",
					roles: [
						"arkeolog",
						"grävare",
						"turist",
						"historiker",
						"forskningsassistent",
						"museichef",
						"fältarbetare",
						"lokal guide",
						"fotograf",
						"konservator",
					],
				},
			},
		},
    {
			id: "harbour_1",
			img_url: "https://images.unsplash.com/photo-1727205723792-674c5e6e1389",
			translations: {
				en: {
					title: "Harbour",
					description:
						"A place where ships dock and unload cargo or passengers.",
					roles: [
						"dock worker",
						"captain",
						"cargo handler",
						"fisherman",
						"security guard",
						"port manager",
						"tourist",
						"mechanic",
						"boatman",
						"cleaner",
					],
				},
				sv: {
					title: "Hamn",
					description:
						"En plats där fartyg lägger till och lossar last eller passagerare.",
					roles: [
						"hamnarbetare",
						"kapten",
						"lastbärare",
						"fiskare",
						"säkerhetsvakt",
						"hamnchef",
						"turist",
						"mekaniker",
						"båtman",
						"städare",
					],
				},
			},
		},
    {
			id: "renfaire_1",
			img_url: "https://images.unsplash.com/photo-1699500325700-761e52eb8625",
			translations: {
				en: {
					title: "Renfaire",
					description:
						"A medieval-themed festival with historical reenactments and performances.",
					roles: [
						"knight",
						"merchant",
						"bard",
						"jester",
						"historian",
						"blacksmith",
						"farmer",
						"queen",
						"king",
						"peasant",
					],
				},
				sv: {
					title: "Renässansmässa",
					description:
						"En medeltidsinspirerad festival med historiska återuppföranden och föreställningar.",
					roles: [
						"riddare",
						"handlare",
						"bard",
						"skämtare",
						"historiker",
						"smed",
						"bonde",
						"drottning",
						"kung",
						"bödel",
					],
				},
			},
		},
    {
			id: "park_1",
			img_url: "https://images.unsplash.com/photo-1585938389612-a552a28d6914",
			translations: {
				en: {
					title: "Park",
					description:
						"A green public space for relaxation, recreation, and nature walks.",
					roles: [
						"visitor",
						"jogger",
						"dog walker",
						"picnicker",
						"gardener",
						"security guard",
						"park ranger",
						"musician",
						"artist",
						"cyclist",
					],
				},
				sv: {
					title: "Park",
					description:
						"Ett grönt offentligt område för avkoppling, rekreation och naturpromenader.",
					roles: [
						"besökare",
						"joggare",
						"hundägare",
						"picknickare",
						"trädgårdsmästare",
						"säkerhetsvakt",
						"parkvakt",
						"musiker",
						"konstnär",
						"cyklist",
					],
				},
			},
		},
    {
			id: "veterinary_clinic_1",
			img_url: "https://images.unsplash.com/photo-1725409796872-8b41e8eca929",
			translations: {
				en: {
					title: "Veterinary Clinic",
					description:
						"A medical facility for treating animals, typically for pets.",
					roles: [
						"veterinarian",
						"nurse",
						"pet owner",
						"receptionist",
						"cleaner",
						"assistant",
						"technician",
						"security guard",
						"animal trainer",
						"customer",
					],
				},
				sv: {
					title: "Veterinärklinik",
					description:
						"En medicinsk anläggning för behandling av djur, vanligtvis för husdjur.",
					roles: [
						"veterinär",
						"sjuksköterska",
						"djurägare",
						"receptionist",
						"städare",
						"assistent",
						"tekniker",
						"säkerhetsvakt",
						"djurtränare",
						"kund",
					],
				},
			},
		},
    {
			id: "zoo_1",
			img_url: "https://images.unsplash.com/photo-1592803883394-eeaa36f92a70",
			translations: {
				en: {
					title: "Zoo",
					description:
						"A facility where animals are kept for public viewing and education.",
					roles: [
						"zookeeper",
						"visitor",
						"trainer",
						"biologist",
						"security guard",
						"vet",
						"guide",
						"researcher",
						"photographer",
						"maintenance worker",
					],
				},
				sv: {
					title: "Djurpark",
					description:
						"En anläggning där djur hålls för allmän visning och utbildning.",
					roles: [
						"djurvårdare",
						"besökare",
						"tränare",
						"biolog",
						"säkerhetsvakt",
						"veterinär",
						"guide",
						"forskare",
						"fotograf",
						"underhållsarbete",
					],
				},
			},
		},
  ],
};