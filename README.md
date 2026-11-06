# Kritesh Dhungel — Portfolio

Full-stack and AI systems engineer. Live at **[kritesh2006.github.io/This-is-Me](https://kritesh2006.github.io/This-is-Me/)**.

## Selected work

| Project | What it is | Stack |
|---|---|---|
| [ARIA](https://github.com/Kritesh2006/Personal-Ai) | Multi-model AI reasoning engine: Claude, Gemini and DeepSeek analyse in parallel, GPT-4o judges | Node.js, Express, OpenAI, Anthropic, Gemini |
| [Price Lookup](https://github.com/Kritesh2006/Inventory) | Production search tool used daily across seven store locations; deterministic ranked search with whole-token model matching | JavaScript |
| [HIMVEDA](https://github.com/Kritesh2006/HIMVEDA) | Marketplace and producer-to-buyer traceability platform with audit log and two-person approvals | Next.js, TypeScript, PostgreSQL, Drizzle |
| [NxtLevelOS](https://github.com/Kritesh2006/NxtLevelOS) | Local-first desktop app with a hardened IPC boundary and indexed SQLite schema | Electron, React, SQLite |
| [Timesheet](https://github.com/Kritesh2006/Pay-Report) | Offline shift-logging and summary tool in active use | HTML, CSS, JavaScript |

## Site structure

The page builds itself live: a swarm of agent cursors drags in wireframes, types the text and tours each section, then hands control to the visitor with **Start**.

```
index.html     all content (fully present in HTML — readable without JS)
css/site.css   styles (charcoal, crimson, forest-green builder chrome)
js/build.js    live-build engine + interactions (filters, copy email)
```

Every element tagged `data-b="box|type|sweep|img|pop"` is a build layer. Add the attribute to new content and it joins the build automatically.

- `?skip` or any `#section` link shows the finished site instantly
- Visitors with reduced motion enabled get the finished site
- Skip / 1×–4× speed controls live in the bottom HUD

No build step and no dependencies.

## Contact

kriteshdhungel07@gmail.com · [LinkedIn](https://www.linkedin.com/in/kritesh-dhungel-0aa2ab31a/)
