#!/usr/bin/env node
// Rebuilds every artifact that embeds the viewer template, so the Kiro brand
// layer (the KIRO BRAND style block in viewer/template.source.html) reaches
// all of them. Run after merging upstream; see KIRO.md.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skill = path.join(root, 'archify');
const run = (cwd, ...args) => execFileSync(process.execPath, args, { cwd, stdio: 'inherit' });

run(root, 'scripts/generate-viewer.mjs');
run(skill, 'scripts/render-examples.mjs');
run(skill, 'scripts/render-examples.mjs', '../examples');
run(skill, 'bin/archify.mjs', 'compare', 'architecture',
  'examples/checkout-platform.base.architecture.json',
  'examples/checkout-platform.head.architecture.json',
  '../examples/checkout-platform-delta.html',
  '--receipt', '../examples/checkout-platform-delta.receipt.json',
  '--quality', 'showcase', '--json');

// examples/web-app.html is hand-authored around the template: carry over the
// template's own style/script blocks and the ghost element.
const template = fs.readFileSync(path.join(skill, 'assets/template.html'), 'utf8');
const webAppPath = path.join(root, 'examples/web-app.html');
let webApp = fs.readFileSync(webAppPath, 'utf8');
const brandStyle = template.match(/  <style>\n    \/\* =+\n       KIRO BRAND[\s\S]*?<\/style>\n/)?.[0];
if (!brandStyle) throw new Error('The template has no KIRO BRAND style block.');
if (!/  <style>\n    \/\* =+\n       KIRO BRAND/.test(webApp)) webApp = webApp.replace('</head>', `${brandStyle}</head>`);
for (const tag of ['style', 'script']) {
  const pattern = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, 'g');
  const templateOwned = (block) => !block.includes('type="application/json"');
  const fresh = (template.match(pattern) || []).filter((b) => !b.includes('[PROJECT NAME]') && templateOwned(b));
  const stale = [...webApp.matchAll(pattern)].filter((m) => !m[0].includes('Sample Web App') && templateOwned(m[0]));
  if (fresh.length !== stale.length) throw new Error(`examples/web-app.html has ${stale.length} ${tag} blocks; template has ${fresh.length}.`);
  // Blocks are paired by position, so refuse to write if their openings disagree.
  const opening = (block) => block.slice(0, block.indexOf('\n', block.indexOf('>')) + 1);
  stale.forEach((m, i) => {
    if (opening(m[0]) !== opening(fresh[i])) throw new Error(`examples/web-app.html ${tag} block ${i + 1} no longer lines up with the template.`);
  });
  for (let i = stale.length - 1; i >= 0; i -= 1) {
    const { index } = stale[i];
    webApp = webApp.slice(0, index) + fresh[i] + webApp.slice(index + stale[i][0].length);
  }
}
if (!webApp.includes('class="kiro-ghost"')) {
  const container = webApp.indexOf('class="diagram-container"');
  const svgClose = container < 0 ? -1 : webApp.indexOf('</svg>\n', container);
  if (svgClose < 0) throw new Error('examples/web-app.html has no diagram svg to place the Kiro ghost after.');
  const svgEnd = svgClose + '</svg>\n'.length;
  webApp = webApp.slice(0, svgEnd) + '      <span class="kiro-ghost" aria-hidden="true"></span>\n' + webApp.slice(svgEnd);
}
fs.writeFileSync(webAppPath, webApp);

run(root, 'scripts/build-gallery.mjs', 'docs');
run(root, 'scripts/build-guide.mjs', 'docs/guide.html');
run(root, 'scripts/build-start.mjs', 'docs/start.html');
// Needs ffmpeg and Chrome; set ARCHIFY_CHROME if Chrome is not found.
run(root, 'scripts/build-readme-showcase.mjs');
