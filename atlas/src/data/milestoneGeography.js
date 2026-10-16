// A connection is an evidenced role in an event, not a claim that the whole
// event happened at the marker. Omitted dates inherit the event's inclusive bounds.
const at = (placeId, role, sourceIds, from, to) => ({ placeId, role, sourceIds, from, to });
const local = (...connections) => ({ scope: 'place', note: 'Markers locate the named place approximately; consult the evidence for the actual site.', connections });
const broad = (scope, note) => ({ scope, note, connections: [] });

export const milestoneGeography = {
  'point-comfort-1619': local(at('point-comfort', 'Landing at Point Comfort.', ['arrival'])),
  'virginia-hereditary-slavery': broad('regional', 'A law of the Virginia colony; its reach is not represented by a single city pin.'),
  'stono-rebellion': local(at('charleston', 'Charleston-area reference for the uprising near the Stono River, outside the city.', ['stono'])),
  'wheatley-poems': { ...local(at('boston', 'Wheatley lived in Boston; the book was published in London.', ['wheatley'])), note: 'Boston marks the author’s home context. London, the publication city, lies outside this U.S. map.' },
  'free-african-society': local(at('philadelphia', 'The mutual aid society was organized in Philadelphia.', ['free-african-society'])),
  'freedoms-journal': local(at('new-york', 'The newspaper was published in New York City.', ['freedoms-journal'])),
  'nat-turner-rebellion': broad('regional', 'The rebellion took place across Southampton County, Virginia. It is retained as a county-wide event rather than assigned to an unsupported city location.'),
  'tubman-escape': local(at('eastern-shore', 'Regional context for Tubman’s escape from enslavement in Maryland.', ['tubman'])),
  'dred-scott-decision': local(at('st-louis', 'The Scotts’ freedom suits began in St. Louis.', ['dred-scott']), at('washington', 'The Supreme Court delivered the federal decision.', ['dred-scott'])),
  'harpers-ferry-raid': local(at('harpers-ferry', 'The raid targeted the federal armory at Harpers Ferry.', ['harpers-ferry'])),
  'smalls-planter': local(at('charleston', 'Smalls took the Planter from Charleston Harbor.', ['smalls'])),
  'emancipation-proclamation': broad('national', 'A federal proclamation concerning designated areas in rebellion; a single city cannot represent its geographic scope.'),
  'juneteenth-1865': local(at('galveston', 'General Order No. 3 was issued in Galveston.', ['juneteenth'])),
  'thirteenth-amendment': broad('national', 'Ratification involved the states and changed the national Constitution.'),
  'fourteenth-amendment': broad('national', 'Ratification involved the states and established national constitutional protections.'),
  'fifteenth-amendment': broad('national', 'A national constitutional change ratified by the states.'),
  'hiram-revels': local(at('washington', 'Revels took his seat in the U.S. Senate as a senator from Mississippi.', ['revels'])),
  'wells-antilynching': local(at('memphis', 'Lynchings and the destruction of Wells’s newspaper shaped her campaign.', ['wells']), at('new-york', 'Wells continued her reporting and organizing after leaving Memphis.', ['wells'])),
  'plessy-ferguson': local(at('new-orleans', 'Plessy challenged railroad segregation in New Orleans.', ['plessy']), at('washington', 'The Supreme Court delivered its decision in the case.', ['plessy'])),
  'naacp-founded': broad('national', 'This founding entry covers a national organization; detailed local founding connections remain to be researched.'),
  'great-migration': { scope: 'multiple', note: 'Selected destinations, not a complete migration network. Ranges describe broad phases, not precise local arrival dates.', connections: [
    at('chicago', 'A destination in the northern and midwestern migration.', ['migration'], 1910, 1970),
    at('new-york', 'A northern destination in the first migration phase.', ['migration'], 1910, 1940),
    at('los-angeles', 'A western destination in the World War II and postwar phase.', ['migration'], 1940, 1970),
    at('oakland', 'A western destination in the World War II and postwar phase.', ['migration'], 1940, 1970),
  ] },
  'harlem-renaissance': { ...local(at('new-york', 'Harlem was a center of this cultural movement.', ['harlem'])), note: 'Harlem is represented within New York City. The movement also reached other places.' },
  'tulsa-massacre': local(at('tulsa', 'The violence devastated Tulsa’s Greenwood community.', ['tulsa'])),
  'negro-history-week': broad('national', 'An educational observance promoted across communities; no single city represents its reach.'),
  'anderson-lincoln-memorial': local(at('washington', 'Anderson performed at the Lincoln Memorial.', ['anderson'])),
  'executive-order-8802': broad('national', 'Federal action covering defense employment; retained at national scale.'),
  'jackie-robinson-debut': local(at('new-york', 'Robinson made his Dodgers debut at Ebbets Field in Brooklyn.', ['robinson'])),
  'executive-order-9981': broad('national', 'Federal policy for the armed forces, whose installations and service members extended beyond one city.'),
  'brown-board': { ...local(at('topeka', 'The Kansas case arose from segregated schooling in Topeka.', ['brown']), at('washington', 'The Supreme Court decided the consolidated cases.', ['brown'])), note: 'Topeka is one case location. The litigation also included cases from South Carolina, Virginia, and Delaware; a companion case concerned D.C.' },
  'emmett-till': { ...local(at('chicago', 'Mamie Till-Mobley held an open-casket funeral for her son in Chicago.', ['till'])), note: 'Chicago marks the funeral and public response, not the killing. Till was abducted and murdered in Mississippi; those rural sites are not yet pinned.' },
  'montgomery-boycott': local(at('montgomery', 'The boycott challenged segregation on Montgomery’s buses.', ['boycott'])),
  'little-rock-nine': local(at('little-rock', 'Nine Black students integrated Central High School.', ['little-rock'])),
  'greensboro-sit-in': local(at('greensboro', 'The students began their sit-in at the Woolworth’s lunch counter.', ['greensboro'])),
  'sncc-founded': local(at('raleigh', 'Students gathered at Shaw University to form SNCC.', ['sncc'])),
  'freedom-rides': { scope: 'multiple', note: 'Selected locations in a wider campaign; pins are not a complete bus route.', connections: [
    at('washington', 'The first 1961 riders departed from Washington.', ['freedom-rides']),
    at('birmingham', 'Riders faced violence and arrests in Birmingham.', ['freedom-rides']),
    at('montgomery', 'Riders faced a mob attack; supporters organized in the city.', ['freedom-rides']),
    at('jackson', 'Riders challenged segregation and were jailed in Jackson.', ['freedom-rides']),
  ] },
  'march-washington': local(at('washington', 'The march and rally brought participants to the National Mall.', ['march'])),
  'civil-rights-act': broad('national', 'Federal civil rights legislation with nationwide effects; retained at national scale.'),
  'selma-marches': local(at('selma', 'Selma was the starting point of the voting-rights marches.', ['selma']), at('montgomery', 'The successful march reached Alabama’s capital.', ['selma'])),
  'voting-rights-act': broad('national', 'A national law with enforcement provisions affecting multiple jurisdictions.'),
  'black-panther-party': local(at('oakland', 'Newton and Seale founded the party in Oakland.', ['panthers'])),
  'thurgood-marshall': local(at('washington', 'Senate confirmation and service on the Supreme Court.', ['marshall'])),
  'king-assassination': local(at('memphis', 'King was assassinated at the Lorraine Motel during the sanitation strike.', ['king'])),
  'fair-housing-act': broad('national', 'National housing protections; a city pin would not represent the statute’s scope.'),
  'shirley-chisholm': local(at('new-york', 'Chisholm won election from a Brooklyn congressional district.', ['chisholm'])),
  'black-history-month': broad('national', 'An observance supported by communities and institutions nationwide.'),
  'mae-jemison': { ...local(at('kennedy-space-center', 'STS-47 launched from Kennedy Space Center’s Pad 39B.', ['jemison', 'sts47-launch'])), note: 'The pin marks the launch site. The mission continued in Earth orbit.' },
  'obama-election': broad('national', 'A presidential election conducted across the country; this entry records the election, not the later inauguration in Washington.'),
  'shelby-county': broad('national', 'The ruling affected voting oversight across jurisdictions. This entry uses national coverage rather than treating the case name as an event coordinate.'),
  'black-lives-matter': broad('national', 'The movement emerged through online communication and organizing across places; it has no single origin pin here.'),
  'nmaahc-opens': local(at('washington', 'The museum opened on the National Mall.', ['museum'])),
  'kamala-harris': local(at('washington', 'Harris took the oath of office at the Capitol.', ['harris'])),
  'juneteenth-federal-holiday': broad('national', 'The 2021 law established a federal holiday. Galveston’s 1865 event is a separate milestone.'),
  'ketanji-brown-jackson': local(at('washington', 'Jackson took the Supreme Court oaths of office.', ['jackson-oath'])),
};

export function geographyFor(record) {
  const geography = milestoneGeography[record.id];
  if (!geography) return undefined;
  return { ...geography, reviewedAt: '2026-10-15', connections: geography.connections.map(connection => ({
    ...connection, from: connection.from ?? record.year, to: connection.to ?? record.endYear ?? record.year,
  })) };
}
