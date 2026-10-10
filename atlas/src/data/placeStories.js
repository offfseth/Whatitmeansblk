import { archive } from "./archive.js";
import { locations } from "./locations.js";

// Base essays are resolved into dated chapters below.
// Add locally stored, sourced photographs by listing their archive src in images.
const records = {
  "point-comfort": {
    "theme": "Origins & endurance",
    "title": "A shoreline that holds a long memory.",
    "dek": "At Point Comfort, the history of enslavement and the pursuit of freedom meet on the same Virginia shore.",
    "period": "1619 · 1861",
    "sections": [
      {
        "title": "An arrival recorded in 1619",
        "paragraphs": [
          "In August 1619, captive Africans were brought to Point Comfort in the English colony of Virginia. Taken from a slave ship by English privateers, they were traded to colonists for supplies. Many had been taken from the kingdom of Ndongo, in present-day Angola.",
          "This was a documented beginning for Africans in colonial Virginia, not the beginning of African presence in the Americas. Reading the place carefully means holding that distinction alongside the lives obscured by colonial records."
        ],
        "source": 0
      },
      {
        "title": "The same shore, another struggle",
        "paragraphs": [
          "During the Civil War, Fort Monroe became a refuge for people escaping slavery. The site brings the history of forced arrival into conversation with the actions of people who sought their own freedom."
        ],
        "source": 1
      }
    ],
    "dates": [
      [
        "1619",
        "Captive Africans arrive at Point Comfort in colonial Virginia."
      ],
      [
        "1861",
        "Fort Monroe becomes a refuge for people escaping slavery."
      ]
    ],
    "sources": [
      [
        "National Park Service",
        "Arrival of the First Africans in 1619",
        "https://home.nps.gov/articles/000/arrival-of-the-first-africans-in-1619.htm"
      ],
      [
        "National Park Service",
        "Freedom’s Fortress",
        "https://www.nps.gov/articles/featured_stories_fomr.htm"
      ]
    ]
  },
  "charleston": {
    "theme": "Resistance & freedom",
    "title": "Freedom, carried out of the harbor.",
    "dek": "The story of Robert Smalls and the Planter reveals a city shaped by enslavement—and by people determined to escape it.",
    "period": "1862",
    "sections": [
      {
        "title": "A route to freedom",
        "paragraphs": [
          "Before dawn on May 13, 1862, Robert Smalls and fellow freedom seekers took the Confederate steamer Planter out of Charleston harbor. Smalls knew the harbor and the ship’s signals. That knowledge helped the group pass Confederate defenses and reach the Union blockade.",
          "The escape was a collective act. Family members joined the people aboard, and the risk belonged to everyone making the journey. A working vessel became their means of reaching freedom."
        ],
        "source": 0
      },
      {
        "title": "From the harbor to public life",
        "paragraphs": [
          "Smalls went on to serve the Union and became an influential political figure during Reconstruction. His story connects the waterfront’s skilled labor to the struggle over citizenship and political power after slavery."
        ],
        "source": 1
      }
    ],
    "dates": [
      [
        "May 13, 1862",
        "The Planter reaches Union forces with freedom seekers aboard."
      ],
      [
        "Reconstruction",
        "Smalls becomes a prominent figure in South Carolina political life."
      ]
    ],
    "sources": [
      [
        "National Park Service",
        "The Planter: A Strike for Freedom",
        "https://www.nps.gov/reer/learn/historyculture/the-planter-a-strike-for-freedom.htm"
      ],
      [
        "National Park Service",
        "Reconstruction Era: Presidential Proclamation",
        "https://www.nps.gov/reer/learn/proclamation.htm"
      ]
    ]
  },
  "philadelphia": {
    "theme": "Community & self-determination",
    "title": "Building freedom into everyday life.",
    "dek": "In Philadelphia, Black churches and mutual-aid networks made independence a practice of caring for one another.",
    "period": "1787 · 1794",
    "sections": [
      {
        "title": "A community organized around care",
        "paragraphs": [
          "Richard Allen and Absalom Jones helped establish the Free African Society in 1787. Members pooled resources to support people who were sick, assist bereaved families, and arrange apprenticeships for children.",
          "These forms of mutual aid gave practical meaning to freedom. In a city associated with the nation’s founding ideals, Black Philadelphians built institutions to meet needs that those ideals alone did not answer."
        ],
        "source": 0
      },
      {
        "title": "A place of their own",
        "paragraphs": [
          "Allen established Bethel African Methodist Episcopal Church in 1794. The church became a center of Black religious and community life and a place connected to the Underground Railroad. Today, Mother Bethel’s history links worship, organizing, and the pursuit of freedom in the city."
        ],
        "source": 1
      }
    ],
    "dates": [
      [
        "1787",
        "The Free African Society is established."
      ],
      [
        "1794",
        "Richard Allen establishes Bethel AME Church."
      ]
    ],
    "sources": [
      [
        "National Park Service",
        "Preamble and Articles of Association for the Free African Society",
        "https://www.nps.gov/articles/000/inde-preamble-and-articles-of-association-for-the-free-african-society.htm"
      ],
      [
        "National Park Service",
        "Independence National Historical Park: National Register Amendment",
        "https://www.nps.gov/inde/national-register-amendment.htm"
      ]
    ]
  },
  "new-orleans": {
    "theme": "Music & cultural memory",
    "title": "A city that carries history in its sound.",
    "dek": "African and Caribbean traditions, public gathering, and neighborhood life helped shape the musical world of New Orleans.",
    "period": "19th century · early jazz",
    "sections": [
      {
        "title": "The memory of Congo Square",
        "paragraphs": [
          "In nineteenth-century New Orleans, Congo Square was a gathering place associated with African dance and music. These gatherings preserved cultural practices under the conditions of slavery and became part of the city’s distinctive musical history.",
          "The story of jazz has many sources. African American traditions, Caribbean influences, brass bands, ragtime, and the city’s changing social life all contributed to the environment in which it developed."
        ],
        "source": 0
      },
      {
        "title": "Music made in community",
        "paragraphs": [
          "Music moved through neighborhoods, processions, and celebrations. Brass-band traditions and the drumming and call-and-response of Black masking traditions belonged to the soundscape encountered by early jazz musicians. Following these connections reveals music as part of everyday life, as well as performance."
        ],
        "source": 0
      }
    ],
    "dates": [
      [
        "19th century",
        "Congo Square is known for gatherings preserving African music and dance."
      ],
      [
        "Late 1800s",
        "Brass bands and syncopated musical styles help shape the city’s musical life."
      ]
    ],
    "sources": [
      [
        "National Park Service",
        "Jazz Origins in New Orleans",
        "https://www.nps.gov/jazz/learn/historyculture/history_early.htm"
      ]
    ]
  },
  "washington": {
    "theme": "Civil rights & collective action",
    "title": "A movement makes itself heard.",
    "dek": "On the National Mall, a demand for jobs and freedom became an image—and a gathering—the nation could not ignore.",
    "period": "1963 · 1964",
    "images": [
      "/archive/1963-march-on-washington-leaders.webp",
      "/archive/1964-civil-rights-act-signing.webp"
    ],
    "sections": [
      {
        "title": "More than a single speech",
        "paragraphs": [
          "On August 28, 1963, an estimated 250,000 people gathered in Washington for the March on Washington for Jobs and Freedom. They traveled from across the country to bring demands for civil rights and economic opportunity to the nation’s capital.",
          "The gathering brought together civil rights groups, labor organizations, religious communities, and individuals. Martin Luther King Jr.’s speech became its most familiar expression, but the march also made employment discrimination and economic justice central to the national conversation."
        ],
        "source": 0
      },
      {
        "title": "A gathering made by many",
        "paragraphs": [
          "The march was the product of years of organizing. Its songs, signs, and speeches expressed different experiences joined in a shared demand for change. The photographs preserve both the leaders at the front and the collective action that gave the event its force."
        ],
        "source": 1
      }
    ],
    "dates": [
      [
        "August 28, 1963",
        "The March on Washington for Jobs and Freedom gathers on the National Mall."
      ],
      [
        "July 2, 1964",
        "President Lyndon B. Johnson signs the Civil Rights Act."
      ]
    ],
    "sources": [
      [
        "National Park Service",
        "March on Washington for Jobs and Freedom",
        "https://home.nps.gov/articles/march-on-washington.htm"
      ],
      [
        "Smithsonian · National Museum of American History",
        "The March on Washington",
        "https://www.americanhistory.si.edu/explore/exhibitions/changing-america/online/1963/march-on-washington"
      ]
    ]
  },
  "chicago": {
    "theme": "Migration & belonging",
    "title": "A new home. A world of possibility.",
    "dek": "On Chicago’s South Side, the Great Migration helped build a Black metropolis of businesses, institutions, and cultural life.",
    "period": "The Great Migration",
    "sections": [
      {
        "title": "Making a life in the North",
        "paragraphs": [
          "During the Great Migration, Black Southerners moved to Chicago seeking work and greater freedom from racial violence and discrimination. Industrial demand during World War I helped draw newcomers north.",
          "Arrival did not mean an end to segregation. Within those constraints, residents built businesses and institutions that supported a growing community. The South Side became a center of Black urban life with influence far beyond Chicago."
        ],
        "source": 0
      },
      {
        "title": "The Black Metropolis",
        "paragraphs": [
          "Bronzeville’s history connects enterprise, music, the arts, and political organizing. Its buildings and streets preserve the story of a community making space for ambition, cultural expression, and collective action. The Great Migration changed both the people who arrived and the city they helped create."
        ],
        "source": 1
      }
    ],
    "dates": [
      [
        "World War I",
        "Industrial jobs help draw Black migrants to Chicago."
      ],
      [
        "20th century",
        "Bronzeville becomes widely known as the Black Metropolis."
      ]
    ],
    "sources": [
      [
        "National Park Service",
        "Chicago’s Black Metropolis: Understanding History Through a Historic Place",
        "https://home.nps.gov/articles/chicago-s-black-metropolis-understanding-history-through-a-historic-place-teaching-with-historic-places.htm"
      ],
      [
        "National Park Service",
        "Bronzeville–Black Metropolis National Heritage Area",
        "https://www.nps.gov/places/bronzeville-black-metropolis-national-heritage-area.htm"
      ]
    ]
  },
  "montgomery": {
    "theme": "Civil rights & everyday courage",
    "title": "The city that walked toward change.",
    "dek": "A bus boycott turned everyday journeys into a sustained challenge to segregation—and helped reshape a movement.",
    "period": "1955–1956 · 1965",
    "images": [
      "/archive/1965-selma-to-montgomery.webp"
    ],
    "sections": [
      {
        "title": "Organizing an everyday refusal",
        "paragraphs": [
          "Rosa Parks was arrested in Montgomery on December 1, 1955, after refusing to give up her bus seat. Her resistance drew on a longer history of challenges to segregation, including Claudette Colvin’s refusal earlier that year.",
          "Beginning on December 5, Black residents withheld their fares. The Montgomery Improvement Association helped organize a campaign sustained through walking, shared rides, and community support. The boycott made ordinary travel a powerful form of collective action."
        ],
        "source": 0
      },
      {
        "title": "A movement sustained together",
        "paragraphs": [
          "The boycott lasted 381 days. Its strength came from the people who kept it going despite harassment and hardship. The Supreme Court’s rejection of bus segregation helped bring the campaign to an end in December 1956.",
          "The photograph in this story shows a later campaign: the 1965 march from Selma to Montgomery. It belongs to the continuing struggle for voting rights, not to the bus boycott."
        ],
        "source": 1
      }
    ],
    "dates": [
      [
        "December 1, 1955",
        "Rosa Parks is arrested after resisting bus segregation."
      ],
      [
        "December 5, 1955",
        "The organized bus boycott begins."
      ],
      [
        "December 20, 1956",
        "The boycott ends after 381 days."
      ]
    ],
    "sources": [
      [
        "National Park Service",
        "The Montgomery Bus Boycott",
        "https://www.nps.gov/articles/montgomery-bus-boycott.htm"
      ],
      [
        "National Park Service",
        "Bricklayers Hall and the Montgomery Improvement Association",
        "https://www.nps.gov/places/bricklayers-hall.htm"
      ],
      [
        "National Park Service",
        "Montgomery Bus Boycott Speech",
        "https://www.nps.gov/places/quote-from-montgomery-bus-boycott-speech.htm"
      ]
    ]
  },
  "los-angeles": {
    "theme": "Culture & community",
    "title": "A place to gather on Central Avenue.",
    "dek": "The Dunbar Hotel offered Black travelers more than a room. It helped make Central Avenue a center of community and music.",
    "period": "1928 · the Central Avenue years",
    "sections": [
      {
        "title": "A landmark built by its community",
        "paragraphs": [
          "The Dunbar Hotel opened as the Hotel Somerville in 1928. Dr. John Somerville built it for the first West Coast convention of the NAACP. Financed and built by African Americans, it offered accommodations to Black guests excluded from comparable hotels in segregated Los Angeles.",
          "The hotel became a gathering place for community leaders, writers, and performers. Its importance grew from both the hospitality it provided and the wider world of Black life along Central Avenue."
        ],
        "source": 0
      },
      {
        "title": "At the center of the music",
        "paragraphs": [
          "Louis Armstrong, Duke Ellington, Count Basie, and Bessie Smith were among the musicians associated with the hotel. The Dunbar’s history connects the Central Avenue jazz scene with the struggle to create welcoming spaces in a segregated city."
        ],
        "source": 0
      }
    ],
    "dates": [
      [
        "1928",
        "The Hotel Somerville opens for the NAACP’s first West Coast convention."
      ],
      [
        "Central Avenue era",
        "The hotel becomes a gathering place for musicians and community leaders."
      ]
    ],
    "sources": [
      [
        "Los Angeles Conservancy",
        "Dunbar Hotel",
        "https://www.laconservancy.org/learn/historic-places/dunbar-hotel/"
      ]
    ]
  }
};

export const placeStories = locations.map(location => {
  const base = records[location.id];
  const chapters = location.periods.map(period => {
    const record = { ...base, ...period };
    const sections = period.sections ?? (period.sectionIndices ? period.sectionIndices.map(i => base.sections[i]) : base.sections);
    const dates = period.dates ?? (period.dateIndices ? period.dateIndices.map(i => base.dates[i]) : base.dates);
    return {
      ...record, sections, dates,
      period: period.from === period.to ? String(period.from) : period.from + '–' + period.to,
      images: (record.images ?? []).map(src => archive.find(plate => plate.src === src))
        .filter(plate => plate && !plate.placeholder && plate.rights === 'cleared'),
    };
  });
  return { ...location, ...chapters[0], id: location.id, chapters };
});

/** No fallback here: map/story consumers must explicitly resolve uncovered years. */
export function getPlaceStory(id, year) {
  const place = placeStories.find(story => story.id === id);
  if (!place) return undefined;
  if (year === undefined) return place;
  const chapter = place.chapters.find(chapter => year >= chapter.from && year <= chapter.to);
  return chapter ? { ...place, ...chapter, id: place.id, chapterId: chapter.id } : undefined;
}
/** Old links and related-place navigation land on the nearest published year. */
export function nearestStoryYear(id, year) {
  const place = getPlaceStory(id);
  if (!place) return null;
  const target = Number.isFinite(Number(year)) ? Number(year) : place.chapters[0].from;
  return place.chapters.map(p => Math.max(p.from, Math.min(p.to, Math.round(target))))
    .sort((a, b) => Math.abs(a - target) - Math.abs(b - target) || a - b)[0];
}
