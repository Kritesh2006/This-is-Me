/* data.js — single source of truth for portfolio content. */

export const PERSON = {
  name: 'Kritesh Dhungel',
  role: 'Full-stack developer and AI systems builder',
  location: 'Greensboro, North Carolina',
  email: 'kriteshdhungel07@gmail.com',
  github: 'https://github.com/Kritesh2006',
  linkedin: 'https://www.linkedin.com/in/kritesh-dhungel-0aa2ab31a/',
};

/* ------------------------------------------------------------
   PROJECTS
    Links only point at repositories / sites that were verified
   to exist. Private work gets no link instead of a fake one.
   ------------------------------------------------------------ */
export const PROJECTS = [
  {
    id: 'aria', plate: 'forest',
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
  },
  {
    id: 'inventory', plate: 'char',
    name: 'Price Lookup',
    kind: 'Internal production tool',
    year: '2025–26',
    status: 'In daily use',
    summary: 'A production search tool staff use across seven store locations to find parts and prices in seconds. It replaced scrolling a spreadsheet while a customer waited.',
    detail: 'Deterministic ranked search: it classifies how specific a query is and matches model numbers as whole tokens, so a search for one model does not surface a different one first. Includes a small rule-based assistant named RON.',
    stack: ['JavaScript', 'HTML', 'CSS'],
    links: [{ label: 'Source', href: 'https://github.com/Kritesh2006/Inventory' }],
    featured: true,
  },
  {
    id: 'himveda', plate: 'red',
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
  },
  {
    id: 'payreport', plate: 'red',
    name: 'Timesheet',
    kind: 'Timesheet web app',
    year: '2025',
    status: 'In use',
    summary: 'Staff log shifts by location and it produces a clean, checkable summary for management, replacing hand-counted totals.',
    detail: 'One HTML file, no backend, works offline. Detects the current period, handles month lengths and leap years, prints or copies the summary.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    links: [
      { label: 'Open tool', href: 'http://ifixtimesheet.online/' },
      { label: 'Source', href: 'https://github.com/Kritesh2006/Pay-Report' },
    ],
  },
  {
    id: 'nxtlevelos', plate: 'char',
    name: 'NxtLevelOS',
    kind: 'Local-first desktop app',
    year: '2026',
    status: 'Active',
    summary: 'A private desktop app for memories, goals, journal, tasks, habits, money and files, all in one local database with one search bar across everything.',
    detail: 'Electron and React with better-sqlite3. The renderer never touches the database directly; everything goes through a contextBridge boundary. WAL mode, indexed schema, and a file vault with collision-proof naming.',
    stack: ['Electron', 'React', 'SQLite', 'Vite'],
    links: [{ label: 'Source', href: 'https://github.com/Kritesh2006/NxtLevelOS' }],
  },
  {
    id: 'airos', plate: 'forest',
    name: 'AIR OS',
    kind: 'Hands-free computer control',
    year: '2025–26',
    status: 'Private build',
    summary: 'Control a laptop with hand gestures and voice. Version 2 added a wake word, voice-composed email, a small heads-up overlay and a resource monitor that closes runaway processes safely.',
    detail: 'Python and MediaPipe hand tracking with a speech layer. Rebuilt for version 2 after an upstream MediaPipe API change broke tracking.',
    stack: ['Python', 'MediaPipe', 'Speech'],
    links: [],
  },
  {
    id: 'witness', plate: 'red',
    name: 'Witness',
    kind: 'Physical-state engine',
    year: '2026',
    status: 'Early stage',
    summary: 'An overhead camera watches a breadboard, keeps a replayable record of what was actually wired, and checks it against the target circuit. Version zero is architecture and the core truth layer; the camera rig comes next.',
    detail: 'Run as a long-term engineering project rather than a demo. Not public yet.',
    stack: ['Python', 'Computer vision'],
    links: [],
  },
];

export const SKILLS = [
  { group: 'Languages', items: ['JavaScript', 'TypeScript', 'Python', 'SQL', 'HTML and CSS'] },
  { group: 'Building', items: ['React', 'Next.js', 'Node.js and Express', 'Electron', 'REST APIs', 'Three.js'] },
  { group: 'Data', items: ['PostgreSQL', 'SQLite', 'Drizzle ORM', 'MongoDB'] },
  { group: 'AI', items: ['Multi-model orchestration', 'OpenAI, Anthropic, Gemini APIs', 'MediaPipe', 'Prompt design'] },
  { group: 'Practice', items: ['Git and GitHub', 'Playwright and Vitest', 'Systems debugging'] },
];
