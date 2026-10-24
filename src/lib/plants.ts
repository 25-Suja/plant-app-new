// Shared plant reference data: the confirmed-invasive list (ported from the
// original desktop app) and the species-specific disposal guides.

export type Hazard = 'thorns' | 'sap' | 'severe' | 'ticks' | 'none'

export type DisposalGuide = {
  slug: string
  commonName: string
  scientificName: string
  growthForm: 'Shrub' | 'Vine' | 'Tree' | 'Herb'
  difficulty: 1 | 2 | 3
  hazard: Hazard
  bestTime: string
  identifyTip: string
  remove: string[]
  dispose: string[]
  followUp: string
  warning?: string
}

export const DISPOSAL_GUIDES: DisposalGuide[] = [
  {
    slug: 'japanese-barberry',
    commonName: 'Japanese barberry',
    scientificName: 'Berberis thunbergii',
    growthForm: 'Shrub',
    difficulty: 2,
    hazard: 'ticks',
    bestTime: 'Early spring — it leafs out before native shrubs, so it is easy to spot.',
    identifyTip:
      'Arching thorny stems, small spoon-shaped leaves, bright red oval berries that hang on into winter. Cut stems are bright yellow inside.',
    remove: [
      'Wear thick gloves, long sleeves and tick repellent — barberry thickets hold high numbers of deer ticks.',
      'Pull small plants by hand when the soil is moist.',
      'For larger shrubs, use a weed wrench or a shrub remover tool to lever out the whole root crown.',
      'Shake soil off the roots so the plant dries out and cannot re-root.',
    ],
    dispose: [
      'Bag any stems carrying berries and put them out with the trash — birds spread the seeds.',
      'Berry-free shrubs can be left upside-down on a rock or tarp with roots in the air to dry out.',
      'Never compost berries or root crowns.',
    ],
    followUp: 'Return the next spring to pull seedlings — seeds in the soil keep sprouting for a few years.',
  },
  {
    slug: 'garlic-mustard',
    commonName: 'Garlic mustard',
    scientificName: 'Alliaria petiolata',
    growthForm: 'Herb',
    difficulty: 1,
    hazard: 'none',
    bestTime: 'April–May, while it is flowering and before seed pods ripen.',
    identifyTip:
      'Heart-shaped, toothed leaves that smell like garlic when crushed; small white four-petaled flowers.',
    remove: [
      'Grip at the base and pull slowly to get the white S-shaped taproot.',
      'Pull before seed pods form — pulled plants can still ripen seeds on the ground.',
    ],
    dispose: [
      'Bag every pulled plant and put it out with the trash.',
      'Do not compost — seeds survive home compost piles and stay viable for about 10 years.',
    ],
    followUp: 'Repeat every year at the same site until no new rosettes appear.',
  },
  {
    slug: 'japanese-knotweed',
    commonName: 'Japanese knotweed',
    scientificName: 'Reynoutria japonica',
    growthForm: 'Herb',
    difficulty: 3,
    hazard: 'none',
    bestTime: 'Cut from late spring through summer; herbicide work is done in late summer–fall.',
    identifyTip:
      'Hollow, bamboo-like stems with reddish speckles, large flat-based leaves, and zig-zag growth.',
    remove: [
      'Cut stems to the ground every 2–3 weeks through the growing season to starve the rhizomes.',
      'Small new patches can be dug out, but every piece of rhizome must come out.',
      'Large patches need a professional — herbicide use must follow the label and local law.',
    ],
    dispose: [
      'Never compost or dump knotweed: a fingernail-sized piece of stem or root can grow a new plant.',
      'Dry cut stems completely on a tarp or pavement, or bag them for trash pickup.',
      'Brush off boots, tools and tires before leaving the site.',
    ],
    followUp: 'Expect regrowth for several seasons — keep cutting and monitoring.',
  },
  {
    slug: 'tree-of-heaven',
    commonName: 'Tree of heaven',
    scientificName: 'Ailanthus altissima',
    growthForm: 'Tree',
    difficulty: 3,
    hazard: 'sap',
    bestTime: 'July–September, when the tree is moving sugars down to its roots.',
    identifyTip:
      'Long compound leaves with a small gland-tipped lobe near each leaflet base; crushed leaves smell like burnt peanut butter.',
    remove: [
      'Pull seedlings when small, getting all of the root.',
      'Do not simply cut large trees — they respond with dozens of root suckers.',
      'Large trees are treated by a licensed applicator ("hack-and-squirt"), then cut once dead.',
    ],
    dispose: [
      'Bag seed clusters for trash pickup.',
      'Dead wood can be chipped or used as firewood locally.',
    ],
    followUp: 'Pull new suckers and seedlings for two to three years.',
    warning:
      'Sap can irritate skin — wear gloves. It is also the main host of the spotted lanternfly; report egg masses.',
  },
  {
    slug: 'oriental-bittersweet',
    commonName: 'Oriental bittersweet',
    scientificName: 'Celastrus orbiculatus',
    growthForm: 'Vine',
    difficulty: 2,
    hazard: 'none',
    bestTime: 'Any time; fall is easiest because of the bright orange-and-red berries.',
    identifyTip:
      'Twining vine with round, finely toothed leaves; yellow capsules split to show red-orange berries along the stem.',
    remove: [
      'Pull seedlings and young vines, getting the bright orange roots.',
      'Cut thick vines at the base and again at head height so the tree can recover.',
      'Cut stumps resprout — dig them out or have them treated by a licensed applicator.',
    ],
    dispose: [
      'Bag all berries for trash pickup — never use the vines in wreaths or decorations.',
      'Berry-free vines can be left to dry where they cannot touch soil.',
    ],
    followUp: 'Check for resprouts every few months for the next two years.',
  },
  {
    slug: 'multiflora-rose',
    commonName: 'Multiflora rose',
    scientificName: 'Rosa multiflora',
    growthForm: 'Shrub',
    difficulty: 2,
    hazard: 'thorns',
    bestTime: 'Spring through early summer, before the hips ripen.',
    identifyTip:
      'Arching canes with curved thorns, clusters of small white flowers, and fringed stipules at each leaf base.',
    remove: [
      'Wear heavy gloves and eye protection — canes snap back.',
      'Cut canes back to reach the crown, then dig out the crown and main roots.',
      'Repeated mowing works on large open patches.',
    ],
    dispose: [
      'Bag flowering or fruiting canes for trash pickup.',
      'Pile thorny canes off the ground to dry, away from trails.',
    ],
    followUp: 'Seeds stay viable for 10–20 years — keep watching for seedlings.',
  },
  {
    slug: 'purple-loosestrife',
    commonName: 'Purple loosestrife',
    scientificName: 'Lythrum salicaria',
    growthForm: 'Herb',
    difficulty: 2,
    hazard: 'none',
    bestTime: 'July–August, when the magenta flower spikes are easy to see.',
    identifyTip: 'Tall square stems with spikes of magenta-purple flowers in wet areas.',
    remove: [
      'Pull or dig small plants, removing the whole root mass.',
      'On larger plants, cut and bag the flower spikes before they set seed.',
      'Work in wetlands may need a permit — check with your state environmental agency.',
    ],
    dispose: [
      'Bag flower spikes and roots and put them in the trash — one plant can make over 2 million seeds.',
      'Never compost or leave plants near water.',
    ],
    followUp: 'Some states release leaf-eating beetles for large infestations — ask your extension office.',
  },
  {
    slug: 'autumn-olive',
    commonName: 'Autumn olive',
    scientificName: 'Elaeagnus umbellata',
    growthForm: 'Shrub',
    difficulty: 2,
    hazard: 'none',
    bestTime: 'Spring or summer, before the speckled red berries ripen in fall.',
    identifyTip: 'Leaves are green on top and silvery-scaled underneath; red berries with silver dots.',
    remove: [
      'Pull seedlings and small shrubs, roots and all.',
      'Use a weed wrench or shrub remover on stems up to about 2 inches thick.',
      'Do not just cut larger shrubs — they resprout heavily. Dig them out or use a licensed applicator.',
    ],
    dispose: [
      'Bag fruiting branches for trash pickup.',
      'Pulled shrubs can dry on site with roots off the ground.',
    ],
    followUp: 'Re-check the site each year for resprouts.',
  },
  {
    slug: 'english-ivy',
    commonName: 'English ivy',
    scientificName: 'Hedera helix',
    growthForm: 'Vine',
    difficulty: 1,
    hazard: 'sap',
    bestTime: 'Any time of year; it stays green in winter.',
    identifyTip: 'Evergreen vine with glossy, 3–5 lobed leaves that climbs with hair-like rootlets.',
    remove: [
      'On trees, cut every vine at shoulder height and again at the base.',
      'Pull ivy from the ground in a 3–6 foot ring around the tree ("survival ring").',
      'Leave the upper vines on the tree — they die and fall on their own.',
    ],
    dispose: [
      'Roll up pulled ivy and bag it, or pile it on a tarp to dry so it cannot re-root.',
      'Bag any black berries for trash pickup.',
    ],
    followUp: 'Pull new sprouts in the survival ring a few times a year.',
    warning: 'Sap can irritate skin — wear gloves and long sleeves.',
  },
  {
    slug: 'glossy-buckthorn',
    commonName: 'Glossy buckthorn',
    scientificName: 'Frangula alnus',
    growthForm: 'Shrub',
    difficulty: 2,
    hazard: 'none',
    bestTime: 'Late fall — it keeps green leaves after native shrubs drop theirs.',
    identifyTip: 'Shiny oval leaves with smooth edges, speckled bark, berries ripening red to black.',
    remove: [
      'Pull seedlings by hand; use a weed wrench or shrub remover on larger stems.',
      'If you cut a stem, cover the stump with a black plastic bag or tin can for a year to stop resprouts.',
    ],
    dispose: [
      'Bag berries for trash pickup.',
      'Stems can be left to dry or chipped.',
    ],
    followUp: 'Pull seedlings each fall for several years.',
  },
  {
    slug: 'common-buckthorn',
    commonName: 'Common buckthorn',
    scientificName: 'Rhamnus cathartica',
    growthForm: 'Shrub',
    difficulty: 2,
    hazard: 'thorns',
    bestTime: 'Late fall, when it is still green and natives are bare.',
    identifyTip:
      'Finely toothed oval leaves with curving veins, a small thorn at many branch tips, orange inner bark.',
    remove: [
      'Pull small plants; lever out larger ones with a weed wrench or shrub remover.',
      'Cover cut stumps with a black bag or can ("bucking") to prevent resprouting.',
    ],
    dispose: [
      'Bag berries — they spread by birds.',
      'Brush can be chipped or left to dry.',
    ],
    followUp: 'Seeds sprout for up to 5 years — keep checking.',
  },
  {
    slug: 'spotted-knapweed',
    commonName: 'Spotted knapweed',
    scientificName: 'Centaurea stoebe',
    growthForm: 'Herb',
    difficulty: 1,
    hazard: 'sap',
    bestTime: 'Early summer, before it flowers.',
    identifyTip:
      'Grey-green deeply lobed leaves and pink-purple thistle-like flowers with dark-tipped bracts.',
    remove: [
      'Wear gloves — the plant contains a compound that can irritate skin.',
      'Pull or dig, getting as much taproot as possible.',
    ],
    dispose: ['Bag flower heads and plants for trash pickup. Do not compost.'],
    followUp: 'Revisit the site every summer for new rosettes.',
  },
  {
    slug: 'bush-honeysuckle',
    commonName: 'Bush honeysuckle (Amur)',
    scientificName: 'Lonicera maackii',
    growthForm: 'Shrub',
    difficulty: 2,
    hazard: 'none',
    bestTime: 'Early spring or late fall — it is green before and after native shrubs.',
    identifyTip: 'Opposite pointed leaves, hollow brown pith in the stems, paired red berries.',
    remove: [
      'Pull seedlings; use a weed wrench or shrub remover on larger shrubs.',
      'Cut stumps resprout — dig out the root or cover the stump.',
    ],
    dispose: ['Bag berries for trash pickup.', 'Brush can be chipped or left to dry.'],
    followUp: 'Pull seedlings for a few years after removal.',
  },
  {
    slug: 'kudzu',
    commonName: 'Kudzu',
    scientificName: 'Pueraria montana',
    growthForm: 'Vine',
    difficulty: 3,
    hazard: 'none',
    bestTime: 'Summer, when the vine is actively growing.',
    identifyTip: 'Fast vine with three large leaflets, hairy stems, and purple grape-scented flowers.',
    remove: [
      'Cut vines at ground level and follow them to the root crown.',
      'Dig out the root crown — killing the crown is what kills the plant.',
      'Large patches need professional treatment.',
    ],
    dispose: [
      'Bag root crowns for trash pickup.',
      'Vines without crowns can be left to dry on site.',
    ],
    followUp: 'Monitor monthly for the first season.',
  },
  {
    slug: 'giant-hogweed',
    commonName: 'Giant hogweed',
    scientificName: 'Heracleum mantegazzianum',
    growthForm: 'Herb',
    difficulty: 3,
    hazard: 'severe',
    bestTime: 'Do not remove it yourself — report it.',
    identifyTip:
      'Can reach 8–14 ft tall, with purple-blotched stems, coarse white hairs, and white flower umbrellas up to 2.5 ft wide.',
    remove: [
      'Do NOT touch, cut or mow it. Keep children and pets away.',
      'Take a photo from a distance and report it to your state agriculture or environmental agency.',
      'Removal must be done by trained crews in full protective gear.',
    ],
    dispose: ['Leave disposal to the removal crew.'],
    followUp: 'The agency will follow up — let them know if it comes back.',
    warning:
      'Its sap plus sunlight causes severe burns and blisters. If sap touches skin, wash with soap and cold water right away, keep it out of sunlight, and see a doctor.',
  },
]

export const CONFIRMED_INVASIVE_SCIENTIFIC_NAMES = new Set(
  DISPOSAL_GUIDES.map((g) => g.scientificName.toLowerCase()),
)

export function isConfirmedInvasive(scientificName: string) {
  return CONFIRMED_INVASIVE_SCIENTIFIC_NAMES.has(scientificName.trim().toLowerCase())
}

export function findGuide(scientificName: string): DisposalGuide | undefined {
  const key = scientificName.trim().toLowerCase()
  return DISPOSAL_GUIDES.find((g) => g.scientificName.toLowerCase() === key)
}

export type DisposalMethod = {
  title: string
  icon: 'bag' | 'sun' | 'dry' | 'nocompost' | 'boots' | 'law'
  body: string
}

export const GENERAL_METHODS: DisposalMethod[] = [
  {
    title: 'Bag and trash',
    icon: 'bag',
    body: 'Anything with seeds, berries, flowers or root fragments goes in heavy contractor bags for regular trash pickup — not yard waste.',
  },
  {
    title: 'Solarize the bag',
    icon: 'sun',
    body: 'Leave sealed clear or black bags in full sun for 2–4 weeks to cook seeds and roots before they go out.',
  },
  {
    title: 'Dry it out on site',
    icon: 'dry',
    body: 'Woody shrubs with no seeds can dry on a rock, stump or tarp with roots in the air, so they cannot re-root.',
  },
  {
    title: 'Never compost invasives',
    icon: 'nocompost',
    body: 'Home compost rarely gets hot enough to kill seeds and root fragments. Do not dump plants in the woods or near water.',
  },
  {
    title: 'Clean boots and tools',
    icon: 'boots',
    body: 'Brush off soil, seeds and plant bits before you leave the site so you do not carry invasives to a new place.',
  },
  {
    title: 'Follow local rules',
    icon: 'law',
    body: 'Herbicides must follow the label and are best left to licensed applicators. Wetland work and burning often need a permit.',
  },
]
