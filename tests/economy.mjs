import assert from "node:assert/strict";
import model from "../game-model.js";

assert.equal(model.WORKSHOPS.length, 9, "neuf ateliers sont attendus");
assert.deepEqual(model.WORKSHOPS.map(item => item.id), [
  "proportions", "evolutions", "units", "algebra", "functions",
  "sequences", "derivatives", "statistics", "probability"
]);

for (const workshop of model.WORKSHOPS) {
  assert.ok(model.workshopCost(workshop.id, 1) > model.workshopCost(workshop.id, 0), `${workshop.id}: le coût doit croître`);
  assert.ok(model.workshopProduction(workshop.id, 2, 0) > model.workshopProduction(workshop.id, 1, 0), `${workshop.id}: la production doit croître`);
  assert.ok(model.workshopProduction(workshop.id, 1, 10) > model.workshopProduction(workshop.id, 1, 0), `${workshop.id}: la maîtrise doit renforcer la production`);
}

assert.equal(model.milestoneMultiplier(9), 1);
assert.equal(model.milestoneMultiplier(10), 2);
assert.equal(model.milestoneMultiplier(25), 4);
assert.equal(model.nextMilestone(25), 50);

const quote = model.purchaseQuote("proportions", 0, 10, 100);
assert.ok(quote.quantity > 1 && quote.quantity < 10, "l'achat groupé doit prendre la quantité abordable");
assert.ok(quote.cost <= 100, "l'achat groupé ne doit jamais dépasser le flux disponible");

const workshops = Object.fromEntries(model.WORKSHOPS.map(item => [item.id, 0]));
workshops.proportions = 10;
assert.ok(model.baseProduction(workshops, {}) > 3, "le premier palier doit doubler la production");
assert.ok(model.clickGain(250, workshops, 1) > model.clickGain(0, {}, 0), "les clics, le réseau et l'étalonnage doivent renforcer le noyau");

assert.equal(model.cycleGain(model.cycleTarget(1), 1), 1);
assert.equal(model.cycleGain(model.cycleTarget(1) * 4, 1), 2);
assert.equal(model.permanentMultiplier(5), 2);

console.log("Économie, paliers, clics et cycles validés.");
