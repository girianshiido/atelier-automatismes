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
  }
}

console.log("900 questions générées et validées.");
