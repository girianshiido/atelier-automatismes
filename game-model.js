(function (root, factory) {
  const model = factory();
  if (typeof module === "object" && module.exports) module.exports = model;
  else root.NexusModel = model;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const WORKSHOPS = [
    { id: "proportions", name: "Répartiteur de proportions", icon: "∷", baseCost: 15, baseRate: 0.18, tier: 1, description: "Proportionnalité, ratios et part d'un total." },
    { id: "evolutions", name: "Convertisseur de pourcentages", icon: "%", baseCost: 80, baseRate: 0.9, tier: 2, description: "Pourcentages et évolutions successives." },
    { id: "units", name: "Calibrateur d'unités", icon: "↔", baseCost: 420, baseRate: 4.2, tier: 3, description: "Longueurs, durées et conversions." },
    { id: "algebra", name: "Forge algébrique", icon: "x", baseCost: 2200, baseRate: 19, tier: 4, description: "Développer et résoudre des équations produits." },
    { id: "functions", name: "Traceur de fonctions", icon: "ƒ", baseCost: 12000, baseRate: 86, tier: 5, description: "Images, coefficients directeurs et fonctions affines." },
    { id: "sequences", name: "Séquenceur numérique", icon: "uₙ", baseCost: 68000, baseRate: 390, tier: 6, description: "Suites arithmétiques et géométriques." },
    { id: "derivatives", name: "Dérivateur cinétique", icon: "f′", baseCost: 390000, baseRate: 1750, tier: 7, description: "Dérivation et variations." },
    { id: "statistics", name: "Analyseur statistique", icon: "x̄", baseCost: 2300000, baseRate: 7900, tier: 8, description: "Moyennes et séries statistiques." },
    { id: "probability", name: "Simulateur probabiliste", icon: "P", baseCost: 14000000, baseRate: 36000, tier: 9, description: "Probabilités conditionnelles et indépendance." }
  ];

  const MILESTONES = [10, 25, 50, 100, 200];

  function workshopById(id) {
    return WORKSHOPS.find(workshop => workshop.id === id);
  }

  function workshopCost(id, owned) {
    const workshop = workshopById(id);
    if (!workshop) return Infinity;
    return Math.ceil(workshop.baseCost * Math.pow(1.16, Math.max(0, owned)));
  }

  function purchaseQuote(id, owned, requested, available = Infinity) {
    const limit = requested === "max" ? 10000 : Math.max(0, Number(requested) || 0);
    let quantity = 0;
    let cost = 0;
    while (quantity < limit) {
      const next = workshopCost(id, owned + quantity);
      if (cost + next > available || !Number.isFinite(next)) break;
      cost += next;
      quantity += 1;
    }
    return { quantity, cost };
  }

  function milestoneMultiplier(count) {
    return Math.pow(2, MILESTONES.filter(milestone => count >= milestone).length);
  }

  function nextMilestone(count) {
    return MILESTONES.find(milestone => count < milestone) || null;
  }

  function workshopProduction(id, count, mastery = 0) {
    const workshop = workshopById(id);
    if (!workshop || count <= 0) return 0;
    const masteryMultiplier = 1 + Math.sqrt(Math.max(0, mastery)) * 0.06;
    return workshop.baseRate * count * milestoneMultiplier(count) * masteryMultiplier;
  }

  function baseProduction(workshops = {}, mastery = {}) {
    return WORKSHOPS.reduce((total, workshop) => total + workshopProduction(
      workshop.id,
      workshops[workshop.id] || 0,
      mastery[workshop.id] || 0
    ), 0);
  }

  function permanentMultiplier(calibration = 0) {
    return 1 + Math.max(0, calibration) * 0.2;
  }

  function totalOwned(workshops = {}) {
    return WORKSHOPS.reduce((total, workshop) => total + (workshops[workshop.id] || 0), 0);
  }

  function clickGain(totalClicks = 0, workshops = {}, calibration = 0) {
    const practicePower = 1 + Math.floor(Math.max(0, totalClicks) / 250);
    const networkPower = 1 + Math.floor(totalOwned(workshops) / 10);
    return practicePower * networkPower * permanentMultiplier(calibration);
  }

  function cycleTarget(cycle = 1) {
    return 50000 * Math.pow(6, Math.max(0, cycle - 1));
  }

  function cycleGain(cycleFlux = 0, cycle = 1) {
    return Math.floor(Math.sqrt(Math.max(0, cycleFlux) / cycleTarget(cycle)));
  }

  return {
    WORKSHOPS,
    MILESTONES,
    workshopById,
    workshopCost,
    purchaseQuote,
    milestoneMultiplier,
    nextMilestone,
    workshopProduction,
    baseProduction,
    permanentMultiplier,
    totalOwned,
    clickGain,
    cycleTarget,
    cycleGain
  };
});
