// ASHWOOD Universe content registry.
//
// To publish a new public thread, add one object below. Keep every claim and
// destination public, approved, and already represented by a real route or
// artifact. `href: null` deliberately represents work that is not public yet.

export const universeGroups = Object.freeze([
  { id: 'all', label: 'Everything', note: 'A selected public index.' },
  { id: 'creative', label: 'Creative practice', note: 'Image, sound, performance, and presence.' },
  { id: 'writing', label: 'Writing / ideas', note: 'Thinking in public, without turning it into a product log.' },
  { id: 'builds', label: 'Build journal', note: 'What was built, changed, or verified.' },
  { id: 'archive', label: 'Archive forming', note: 'Work held until its public record is ready.' }
]);

export const universeEntries = Object.freeze([
  {
    id: 'modeling', group: 'creative', x: 44, y: 39, kind: 'practice',
    label: '01 / image', title: 'Modeling',
    summary: 'Campaign, editorial, runway, and selected image-led work.',
    href: '/modeling/', status: 'Current', related: ['striped-attire', 'barelysain', 'modeling-archive', 'runway']
  },
  {
    id: 'striped-attire', group: 'creative', x: 20, y: 16, kind: 'campaign',
    label: 'current campaign', title: 'Striped Attire',
    summary: 'A current campaign chapter in the modeling book.',
    href: '/modeling/#striped-attire', status: 'Current', related: ['modeling']
  },
  {
    id: 'barelysain', group: 'creative', x: 12, y: 46, kind: 'campaign',
    label: 'selected work', title: 'BarelySain',
    summary: 'A campaign story held inside the modeling practice.',
    href: '/modeling/#barelysain', status: 'Selected', related: ['modeling']
  },
  {
    id: 'modeling-archive', group: 'creative', x: 28, y: 70, kind: 'archive',
    label: 'selected archive', title: 'Modeling archive',
    summary: 'Earlier image work, held as an archive rather than a claim of completeness.',
    href: '/modeling/#work', status: 'Selected', related: ['modeling', 'runway']
  },
  {
    id: 'runway', group: 'creative', x: 45, y: 84, kind: 'archive',
    label: 'live image', title: 'Runway',
    summary: 'Runway work and its credits live within the modeling archive.',
    href: '/modeling/#runway', status: 'Selected', related: ['modeling', 'modeling-archive']
  },
  {
    id: 'performance', group: 'creative', x: 68, y: 16, kind: 'practice',
    label: '02 / presence', title: 'Performance',
    summary: 'Voice and on-camera work, with its own public frame.',
    href: '/performance/', status: 'Current', related: ['modeling', 'music']
  },
  {
    id: 'music', group: 'creative', x: 84, y: 34, kind: 'practice',
    label: '03 / sound', title: 'Music',
    summary: 'Released work, works becoming, and a live preview of the demoDanceR listening-room entrance.',
    href: '/music/', status: 'Current', related: ['performance', 'writing'],
    previewHref: 'https://ashwood-ia34rz8l9-alvira2.vercel.app/music',
    previewLabel: 'demoDanceR listening room'
  },
  {
    id: 'writing', group: 'writing', x: 84, y: 65, kind: 'thinking',
    label: '04 / words', title: 'Writing / ideas',
    summary: 'Dispatches and field notes: observation, argument, and authored point of view.',
    href: '/dispatch/', status: 'Open', related: ['music', 'build-journal']
  },
  {
    id: 'build-journal', group: 'builds', x: 65, y: 84, kind: 'build',
    label: '05 / evidence', title: 'Build journal',
    summary: 'The record of what was attempted, what changed, and what can be verified.',
    href: '/journal/', status: 'Open', related: ['writing', 'alvira', 'ailhat', 'ledgato']
  },
  {
    id: 'alvira', group: 'builds', x: 38, y: 62, kind: 'build',
    label: 'context thread', title: 'ALVIRA',
    summary: 'A public journal thread about context, not a generic product pitch.',
    href: '/journal/alvira/', status: 'Journal', related: ['build-journal', 'ailhat']
  },
  {
    id: 'ailhat', group: 'builds', x: 55, y: 55, kind: 'build',
    label: 'intelligence thread', title: 'ailhat',
    summary: 'A public journal thread about portfolio intelligence and evidence.',
    href: '/journal/ailhat/', status: 'Journal', related: ['build-journal', 'alvira', 'ledgato']
  },
  {
    id: 'ledgato', group: 'builds', x: 69, y: 55, kind: 'build',
    label: 'governance thread', title: 'LEDGATo',
    summary: 'A public journal thread about boundaries, authority, and receipts.',
    href: '/journal/ledgato/', status: 'Journal', related: ['build-journal', 'ailhat']
  },
  {
    id: 'showroom', group: 'archive', x: 21, y: 28, kind: 'forming',
    label: 'archive forming', title: 'Physical works / showroom',
    summary: 'Objects, studies, and visual-art material stay off the public map until the record is ready.',
    href: null, status: 'Held for review', related: ['writing', 'modeling-archive']
  }
].map(Object.freeze));

export const universePublicationGuide = Object.freeze({
  source: 'universe/content.mjs',
  requiredFields: ['id', 'group', 'x', 'y', 'kind', 'label', 'title', 'summary', 'href', 'status', 'related'],
  safety: 'Only use a public, approved route or artifact. Use href: null when a body of work is still held for review.'
});
