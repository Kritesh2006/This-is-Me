/* ============================================================
   data.js — single source of truth for content.
   Both the road (game) and the portfolio read from here, so a
   project or chapter only ever needs to be edited once.
   ============================================================ */

export const PERSON = {
  name: 'Kritesh Dhungel',
  born: new Date(2006, 5, 7), // June 7, 2006
  role: 'Full-stack developer and AI systems builder',
  location: 'Greensboro, North Carolina',
  email: 'kriteshdhungel07@gmail.com',
  github: 'https://github.com/Kritesh2006',
  linkedin: 'https://www.linkedin.com/in/kritesh-dhungel-0aa2ab31a/',
  instagram: 'https://www.instagram.com/4.kiorr_/',
  x: 'https://x.com/KriteshDhungel',
};

export function currentAge(now = new Date()) {
  const b = PERSON.born;
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
  return age;
}

/* ------------------------------------------------------------
   PROJECTS
   `unlock` ties a real project to a real in-game effect.
   Links only point at repositories / sites that were verified
   to exist. Private work gets no link instead of a fake one.
   ------------------------------------------------------------ */
export const PROJECTS = [
  {
    id: 'aria',
    name: 'ARIA',
    kind: 'AI reasoning system',
    year: '2025–26',
    status: 'Active',
    summary: 'Ask one question, get four models arguing about it. Claude, Gemini and DeepSeek each analyse in parallel; GPT-4o reads all three and writes the final judgment. Also has a direct chat mode for any single model.',
    detail: 'Node.js and Express backend that fans a prompt out to four providers, collects the answers and passes them to a judge model. Built for strategy questions where one model\'s confident answer is not enough. A separate desktop branch, ARIA Computer Operator, experiments with local automation through Electron and Python.',
    stack: ['Node.js', 'Express', 'OpenAI', 'Anthropic', 'Gemini', 'DeepSeek'],
    links: [
      { label: 'Open demo', href: 'https://kritesh2006.github.io/Personal-Ai/' },
      { label: 'Source', href: 'https://github.com/Kritesh2006/Personal-Ai' },
    ],
    featured: true,
    unlock: { id: 'copilot', title: 'Co-driver', text: 'ARIA now reads the road ahead and calls the clear lane.' },
  },
  {
    id: 'himveda',
    name: 'HIMVEDA',
    kind: 'Marketplace and traceability platform',
    year: '2026',
    status: 'In progress',
    summary: 'Rebuilding the platform for an herbal produce business in Nepal. Every batch is weighed, inspected and traceable from producer to buyer, and the owner runs products, pricing and orders from his own studio without touching code.',
    detail: 'Next.js 15 with server components and server actions, strict TypeScript, PostgreSQL through Drizzle ORM, Vitest and Playwright. Modular monolith with an audit log, two-person approval for procurement rates, and local-currency pricing.',
    stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Drizzle', 'Playwright'],
    links: [
      { label: 'Source', href: 'https://github.com/Kritesh2006/HIMVEDA' },
      { label: 'himvedanepal.com', href: 'https://himvedanepal.com' },
    ],
    featured: true,
    unlock: { id: 'paint-himalaya', title: 'Himalaya paint', text: 'A new paint is waiting in the garage.' },
  },
  {
    id: 'inventory',
    name: 'Price Lookup',
    kind: 'Internal production tool',
    year: '2025–26',
    status: 'In daily use',
    summary: 'The search tool staff at the phone repair shop where I work use to find parts and prices in seconds. Built because the old way was scrolling a spreadsheet while a customer waited.',
    detail: 'Deterministic ranked search: it classifies how specific a query is and matches model numbers as whole tokens, so a search for one model does not surface a different one first. Includes a small rule-based assistant named RON — where this site gets its name.',
    stack: ['JavaScript', 'HTML', 'CSS'],
    links: [{ label: 'Source', href: 'https://github.com/Kritesh2006/Inventory' }],
    featured: true,
    unlock: { id: 'magnet', title: 'Lane assist', text: 'Fragments in the next lane now drift toward you.' },
  },
  {
    id: 'payreport',
    name: 'Pay Report',
    kind: 'Timesheet web app',
    year: '2025',
    status: 'In use',
    summary: 'The first thing I built that other people relied on. Coworkers log hours by store and pay period, and it produces a summary their manager can check, instead of hand-counted totals.',
    detail: 'One HTML file, no backend, works offline. Detects the current pay period, handles month lengths and leap years, prints or copies the summary.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    links: [
      { label: 'Open tool', href: 'http://ifixtimesheet.online/' },
      { label: 'Source', href: 'https://github.com/Kritesh2006/Pay-Report' },
    ],
    unlock: { id: 'tune', title: 'Engine tune', text: 'First shipped software. Top speed raised.' },
  },
  {
    id: 'nxtlevelos',
    name: 'NxtLevelOS',
    kind: 'Local-first desktop app',
    year: '2026',
    status: 'Active',
    summary: 'A private desktop app for memories, goals, journal, tasks, habits, money and files, all in one local database with one search bar across everything.',
    detail: 'Electron and React with better-sqlite3. The renderer never touches the database directly; everything goes through a contextBridge boundary. WAL mode, indexed schema, and a file vault with collision-proof naming.',
    stack: ['Electron', 'React', 'SQLite', 'Vite'],
    links: [{ label: 'Source', href: 'https://github.com/Kritesh2006/NxtLevelOS' }],
    unlock: null,
  },
  {
    id: 'airos',
    name: 'AIR OS',
    kind: 'Hands-free computer control',
    year: '2025–26',
    status: 'Private build',
    summary: 'Control a laptop with hand gestures and voice. Version 2 added a wake word, voice-composed email, a small heads-up overlay and a resource monitor that closes runaway processes safely.',
    detail: 'Python and MediaPipe. Version 2 started with a real debugging session after a MediaPipe API change broke tracking. Not public yet.',
    stack: ['Python', 'MediaPipe', 'Speech'],
    links: [],
    unlock: { id: 'scan', title: 'Scanner', text: 'A sweep now outlines what is ahead before you reach it.' },
  },
  {
    id: 'witness',
    name: 'Witness',
    kind: 'Physical-state engine',
    year: '2026',
    status: 'Early stage',
    summary: 'An overhead camera watches a breadboard, keeps a replayable record of what was actually wired, and checks it against the target circuit. Version zero is architecture and the core truth layer; the camera rig comes next.',
    detail: 'Run as a long-term engineering project rather than a demo. Not public yet.',
    stack: ['Python', 'Computer vision'],
    links: [],
    unlock: { id: 'trail', title: 'Memory trail', text: 'Your path is now recorded behind you.' },
  },
  {
    id: 'ifix',
    name: 'Repair booking site',
    kind: 'Web design',
    year: '2025',
    status: 'Demo',
    summary: 'A booking site concept for a local phone repair business: services, prices, hours and an appointment form.',
    detail: 'Plain HTML, CSS and JavaScript on GitHub Pages.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    links: [
      { label: 'Open demo', href: 'https://kritesh2006.github.io/iFixandrepair/' },
      { label: 'Source', href: 'https://github.com/Kritesh2006/iFixandrepair' },
    ],
    unlock: null,
  },
];

/* ------------------------------------------------------------
   CHAPTERS — the road.
   len: metres of road. env: look of the world.
   lines: [fractionOfChapter, text] radio messages.
   gates: project billboards that unlock upgrades (by project id).
   ------------------------------------------------------------ */
export const CHAPTERS = [
  {
    id: 'origin', title: 'Nepal', sub: '2006', len: 620,
    env: { fog: 0x0a1410, fogNear: 30, fogFar: 230, ground: 0x07110c, sky: 0x0b1a13, props: 'mountain', light: 0.9 },
    lines: [
      [0.12, 'Born June 7, 2006.'],
      [0.36, 'Always taking things apart to see how they worked.'],
      [0.6, 'Music. Language. Machines.'],
      [0.84, '2022. A repair counter in Kathmandu. First real job.'],
    ],
  },
  {
    id: 'leaving', title: 'Leaving home', sub: 'Age 18', len: 520,
    env: { fog: 0x050806, fogNear: 14, fogFar: 140, ground: 0x040605, sky: 0x050806, props: 'sparse', light: 0.55 },
    lines: [
      [0.18, 'Leaving Nepal at eighteen.'],
      [0.48, 'The road doesn\'t tell you where it ends.'],
      [0.72, 'You drive anyway.'],
    ],
  },
  {
    id: 'usa', title: 'United States', sub: 'January 2025', len: 520,
    env: { fog: 0x0b0d0f, fogNear: 30, fogFar: 260, ground: 0x0b0c0c, sky: 0x0c0f12, props: 'interstate', light: 1 },
    lines: [
      [0.15, 'New country. New rules.'],
      [0.45, 'Bank accounts, leases, credit. Learn it all at once.'],
      [0.75, 'Nobody here knows your name yet.'],
    ],
  },
  {
    id: 'ohio', title: 'Ohio', sub: 'Dayton', len: 560,
    env: { fog: 0x12151a, fogNear: 22, fogFar: 200, ground: 0x15181c, sky: 0x13161b, props: 'winter', light: 1, snow: true },
    lines: [
      [0.15, 'Wright State University.'],
      [0.42, 'First dorm. First winter.'],
      [0.7, 'Figuring out how everything here works, alone.'],
    ],
  },
  {
    id: 'california', title: 'California', sub: 'May 2025', len: 560,
    env: { fog: 0x1d0f0c, fogNear: 30, fogFar: 260, ground: 0x140b08, sky: 0x24110c, props: 'palms', light: 1.1 },
    lines: [
      [0.15, 'Bakersfield. Fresno. Visalia.'],
      [0.45, 'Three months, five cities.'],
      [0.75, 'Different landscape. Same question: what now?'],
    ],
  },
  {
    id: 'dark', title: '', sub: '', len: 620, dark: true,
    env: { fog: 0x000000, fogNear: 4, fogFar: 40, ground: 0x010101, sky: 0x000000, props: 'none', light: 0.15 },
    lines: [
      [0.06, 'Working shifts. Building at night.'],
      [0.2, 'Ideas that didn\'t work.'],
      [0.4, 'No map.'],
      [0.56, 'No guarantee.'],
      [0.74, 'Keep going.'],
    ],
  },
  {
    id: 'nc', title: 'North Carolina', sub: 'Now', len: 1150,
    env: { fog: 0x06110c, fogNear: 30, fogFar: 260, ground: 0x06100b, sky: 0x08160f, props: 'city', light: 1.1 },
    lines: [
      [0.04, 'Greensboro. Forsyth Tech. Repair shifts.'],
      [0.9, 'Studying. Working. Building.'],
    ],
    gates: [
      [0.14, 'payreport'],
      [0.3, 'inventory'],
      [0.46, 'aria'],
      [0.6, 'airos'],
      [0.72, 'himveda'],
      [0.82, 'witness'],
    ],
  },
];

/* Hidden lines found by collecting the rare gold fragments. */
export const SECRETS = [
  'Speaks four languages.',
  'Taught himself web development before any class did.',
  'Also a musician.',
  'Has rebuilt the ARIA interface more than once.',
  'The first app anyone used was a timesheet. Not glamorous. Real.',
  'Still fixes phones.',
];

/* Owner's note — shown as a presentation easter egg, not a login.
   Nothing here is secret; everything shipped to a browser is public. */
export const OWNER_NOTE = [
  'Kritesh,',
  'You crossed continents alone.',
  'Nepal. Ohio. California. North Carolina.',
  'Confidence grew after action, not before it.',
  'The version of you that arrived knew less, had less, and kept moving.',
  'Keep building.',
];

export const SKILLS = [
  { group: 'Languages', items: ['JavaScript', 'TypeScript', 'Python', 'SQL', 'HTML and CSS', 'C++ (learning)'] },
  { group: 'Building', items: ['React', 'Next.js', 'Node.js and Express', 'Electron', 'REST APIs', 'Three.js'] },
  { group: 'Data', items: ['PostgreSQL', 'SQLite', 'Drizzle ORM', 'MongoDB'] },
  { group: 'AI', items: ['Multi-model orchestration', 'OpenAI, Anthropic, Gemini APIs', 'MediaPipe', 'Prompt design'] },
  { group: 'Practice', items: ['Git and GitHub', 'Playwright and Vitest', 'Hardware repair and diagnostics'] },
];
