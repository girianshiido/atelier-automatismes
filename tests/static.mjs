import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, app] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8")
]);

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
assert.equal(ids.size, [...html.matchAll(/\bid="([^"]+)"/g)].length, "les identifiants HTML doivent être uniques");

const requiredIds = [...app.matchAll(/\$\("#([^"]+)"\)/g)].map(match => match[1]);
for (const id of requiredIds) assert.ok(ids.has(id), `élément #${id} manquant dans index.html`);

assert.match(html, /question-engine\.js[^]*game-model\.js[^]*app\.js/, "les scripts doivent être chargés dans le bon ordre");
assert.match(html, /viewport-fit=cover/, "la vue mobile doit être configurée");

console.log(`${requiredIds.length} liaisons d'interface et la structure statique validées.`);
