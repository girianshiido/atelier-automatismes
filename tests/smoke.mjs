import assert from "node:assert/strict";
import engine from "../question-engine.js";

const worlds = ["energy", "factory", "data"];

for (const world of worlds) {
  for (let i = 0; i < 300; i += 1) {
    const question = engine.generate(world, {});
    assert.ok(question.prompt.length > 10, `${world}: énoncé manquant`);
    assert.equal(question.choices.length, 4, `${world}: quatre choix attendus`);
    assert.equal(new Set(question.choices).size, 4, `${world}: choix dupliqués`);
    assert.ok(question.answer >= 0 && question.answer < 4, `${world}: index de réponse invalide`);
    assert.ok(question.explanation.length > 10, `${world}: correction manquante`);
    assert.ok(engine.SKILLS[question.skill], `${world}: compétence inconnue`);
    assert.ok(question.kind, `${world}: format de question manquant`);
  }
}

assert.equal(engine.affineExpression(-2, 0), "-2x", "le terme constant nul doit être omis");
assert.equal(engine.affineExpression(3, 5), "3x + 5", "le terme constant non nul doit rester visible");
assert.equal(engine.linearFactor(0), "x", "le facteur x + 0 doit être simplifié en x");
assert.equal(engine.linearFactor(5), "(x + 5)", "un facteur non nul doit rester entre parenthèses");

const affineRandomValues = [0, 0.5, 0.5];
const affineWithZero = engine.GENERATORS.energy[3](() => affineRandomValues.shift() ?? 0.5);
assert.match(affineWithZero.prompt, /f\(x\) = -4x\./, "la fonction affine ne doit pas afficher + 0");

const productRandomValues = [0.86, 0.5];
const productWithZero = engine.GENERATORS.factory[0](() => productRandomValues.shift() ?? 0.5);
assert.match(productWithZero.prompt, /Résoudre x\(x \+ 5\) = 0\./, "le facteur x + 0 doit être écrit x et placé en premier");

for (const world of worlds) {
  const recentKeys = [];
  const recentKinds = [];
  for (let i = 0; i < 150; i += 1) {
    const question = engine.generate(world, {}, Math.random, {
      keys: recentKeys,
      kinds: recentKinds
    });
    const key = engine.fingerprint(question);
    assert.ok(!recentKeys.includes(key), `${world}: répétition stricte dans la fenêtre récente`);
    assert.ok(!recentKinds.includes(question.kind), `${world}: format répété trop tôt`);
    recentKeys.push(key);
    recentKinds.push(question.kind);
    if (recentKeys.length > 12) recentKeys.shift();
    if (recentKinds.length > 2) recentKinds.shift();
  }
}

console.log("900 questions générées et validées.");
