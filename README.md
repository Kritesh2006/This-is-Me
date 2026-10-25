# RON // The Road

Personal site of Kritesh Dhungel. Two ways in:

- **The drive** — pick and customize a car in a 3D garage, then drive about three minutes through the story: Nepal, leaving home, Ohio, California, a dark stretch, North Carolina. Real projects appear as road gates and unlock real in-game upgrades.
- **The portfolio** — the same content as a fast, plain page. Always one click away (`Portfolio` button, `Esc`, or `?portfolio` / `#work` links skip the intro entirely).

## Structure

```
index.html            all markup (portfolio works without WebGL or JS-heavy parts)
css/site.css          one stylesheet for both modes
js/data.js            single source of truth: projects, chapters, story lines, skills
js/app.js             flow: boot → entry → garage/drive or portfolio
js/portfolio.js       renders projects, journey, skills; nav behaviour
js/audio.js           WebAudio synth (no audio files); starts muted
js/store.js           guarded localStorage/sessionStorage
js/xp/                3D experience, lazy-loaded on Enter
  index.js            renderer, loop, garage ⇄ road switching
  quality.js          automatic LOW/MEDIUM/HIGH + runtime pixel-ratio governor
  car.js              procedural lofted car + options
  garage.js           showroom scene and customizer
  drive.js            the road: pooled props, obstacles, fragments, chapters, unlocks
  tex.js              canvas-drawn textures (no image downloads for 3D)
vendor/three.min.js   three.js subset (only the classes used); rebuild with tools/build-three.sh
assets/               photos (webp) and self-hosted fonts (OFL)
```

## Editing content

Change `js/data.js`. A project with an `unlock` field becomes a gate on the road; `links` only
show if present, so private projects stay link-free.

## Controls

Desktop: `A`/`D` or `←`/`→` change lane, `W` faster, `S` brake, `M` sound, `Esc` portfolio.
Phone: tap left/right half (or swipe), or the on-screen arrows.

The "owner" note is an easter egg (tap RON five times, or type `owner` on the entry screen).
It is not protected — nothing shipped to a browser can be.
