#!/bin/sh
# Rebuilds vendor/three.min.js from tools/three-entry.js.
# Needs: npm i -D three esbuild (run in a scratch folder or here).
npx esbuild tools/three-entry.js --bundle --format=esm --minify --legal-comments=none --outfile=vendor/three.min.js
