# RON — Kritesh Dhungel

Personal site with two equal ways in, chosen on the first screen:

- **Play my story** — an interactive, illustrated story (~3–5 min). Nepal, leaving home, the flight, the United States, the car, Ohio, the reroute into California, North Carolina, building projects, the road, today. Each chapter uses a different mechanic (explore, pack and hold, drag, walk, customize, drive, recalculate, build). Projects built in the story unlock real effects on the final drive.
- **Read my portfolio** — an editorial portfolio (forest green / off-white / charcoal / crimson) that stands on its own. It never downloads the story code.

Direct links: `?portfolio` or any `#section` opens the portfolio, `#story` starts the story.

## Structure

```
index.html            opening chooser + portfolio markup
css/site.css          opening + portfolio
css/story.css         story only (loaded on PLAY)
js/app.js             routing: chooser · story (dynamic import) · portfolio
js/data.js            single source of truth: projects, journey, skills
js/portfolio.js       renders projects, skills, journey
js/plates.js          one honest diagram per project (no fake screenshots)
js/char/character.js  the 2D character rig (turnable head, joint body, expressions, outfits)
js/story/             story engine, chapters, car, audio (WebAudio synth, no files)
character.html        character master sheet (front, 3/4, side, back, expressions)
```

## The character

One rig, drawn in SVG. The head is generated from a single "turn" value, so front, 3/4 and side views share the same proportions and the face cannot drift between scenes. Proportions, hair, brows, eyes, nose, lips, facial hair, earring, mole and skin tone were taken from reference photos; skin colours were sampled across several photos rather than copied from one.

## Editing

Change `js/data.js`. Projects appear in the portfolio automatically; the story's build board uses the same names.

Controls in the story: tap / click, hold anywhere (or →, W, Space) to walk and drive, Esc leaves. Reduced-motion preferences are respected.
