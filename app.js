(function () {
  "use strict";

  const Engine = window.QuestionEngine;
  const SAVE_KEY = "nexus-sti2d-v1";
  const CYCLE_THRESHOLD = 45;

  const WORLDS = {
    energy: {
      name: "Réseau solaire", number: "01", icon: "☀", color: "#5df0bd",
      subtitle: "Évolutions · fonctions", unlock: 0,
      skills: ["evolutions", "functions"],
      upgrades: [
        { id: "sensor", name: "Capteur solaire", icon: "◫", baseCost: 35, rate: 0.8 },
        { id: "battery", name: "Batterie tampon", icon: "▣", baseCost: 130, rate: 3.2 },
        { id: "grid", name: "Micro-réseau", icon: "⌁", baseCost: 520, rate: 12 }
      ]
    },
    factory: {
      name: "Usine autonome", number: "02", icon: "⚙", color: "#48b7ff",
      subtitle: "Algèbre · suites · dérivation", unlock: 12,
      skills: ["algebra", "functions", "sequences", "derivatives"],
      upgrades: [
        { id: "arm", name: "Bras robotisé", icon: "⌁", baseCost: 220, rate: 5 },
        { id: "line", name: "Ligne adaptative", icon: "▤", baseCost: 820, rate: 19 },
        { id: "twin", name: "Jumeau numérique", icon: "◇", baseCost: 3200, rate: 70 }
      ]
    },
    data: {
      name: "Station de données", number: "03", icon: "◉", color: "#c48cff",
      subtitle: "Statistiques · probabilités", unlock: 30,
      skills: ["statistics", "probability"],
      upgrades: [
        { id: "probe", name: "Sonde connectée", icon: "⌖", baseCost: 1100, rate: 26 },
        { id: "cluster", name: "Grappe de calcul", icon: "▦", baseCost: 4100, rate: 98 },
        { id: "oracle", name: "Moteur prédictif", icon: "✦", baseCost: 16000, rate: 360 }
      ]
    }
  };

  const defaultState = () => ({
    version: 1,
    flux: 0,
    totalFlux: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    streak: 0,
    cycle: 1,
    patents: 0,
    currentWorld: "energy",
    mastery: Object.fromEntries(Object.keys(Engine.SKILLS).map(id => [id, 0])),
    upgrades: {},
    boostMultiplier: 1,
    boostUntil: 0,
    recentQuestionKeys: {},
    recentQuestionKinds: {},
    missionProgress: 0,
    missionTarget: 5,
    lastSeen: Date.now(),
    tutorialSeen: false
  });

  let state = loadState();
  let currentQuestion = null;
  let questionStartedAt = 0;
  let questionTimer = 0;
  let nextQuestionTimer = 0;
  let confirmMode = null;

  const $ = id => document.getElementById(id);
  const refs = {
    flux: $("flux-value"), production: $("production-value"), mastery: $("mastery-value"), streak: $("streak-value"),
    worldList: $("world-list"), worldKicker: $("world-kicker"), challengeTitle: $("challenge-title"), boost: $("boost-pill"),
    questionText: $("question-text"), questionVisual: $("question-visual"), answers: $("answers"), skillChip: $("skill-chip"),
    timerLabel: $("timer-label"), timerBar: $("timer-bar"), startButton: $("start-button"), feedback: $("feedback"),
    upgradeList: $("upgrade-list"), worldOutput: $("world-output"), worldMastery: $("world-mastery"), skillList: $("skill-list"),
    missionTitle: $("mission-title"), missionBar: $("mission-bar"), missionCount: $("mission-count"),
    cycle: $("cycle-value"), patent: $("patent-value"), cycleButton: $("cycle-button"), helpDialog: $("help-dialog"),
    confirmDialog: $("confirm-dialog"), confirmTitle: $("confirm-title"), confirmText: $("confirm-text"), confirmAction: $("confirm-action")
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!saved || saved.version !== 1) return defaultState();
      const merged = { ...defaultState(), ...saved };
      merged.mastery = { ...defaultState().mastery, ...(saved.mastery || {}) };
      merged.upgrades = saved.upgrades || {};
      merged.recentQuestionKeys = saved.recentQuestionKeys || {};
      merged.recentQuestionKinds = saved.recentQuestionKinds || {};
      const elapsed = Math.min(7200, Math.max(0, (Date.now() - Number(saved.lastSeen || Date.now())) / 1000));
      const offlineRate = calculateProduction(merged, false);
      const offlineGain = elapsed * offlineRate;
      merged.flux += offlineGain;
      merged.totalFlux += offlineGain;
      merged.offlineGain = offlineGain;
      return merged;
    } catch (_) {
      return defaultState();
    }
  }

  function saveState() {
    state.lastSeen = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function format(value, digits = 1) {
    if (value < 1000) return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(value);
    const units = [[1e9, "Md"], [1e6, "M"], [1e3, "k"]];
    const unit = units.find(([n]) => value >= n);
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value / unit[0])} ${unit[1]}`;
  }

  function boostMultiplier() {
    if (Date.now() >= state.boostUntil) {
      state.boostMultiplier = 1;
      return 1;
    }
    return state.boostMultiplier;
  }

  function calculateProduction(targetState = state, includeBoost = true) {
    let base = 0;
    Object.values(WORLDS).forEach(world => {
      world.upgrades.forEach(item => {
        const level = Number(targetState.upgrades[item.id] || 0);
        base += level * item.rate;
      });
    });
    const patentBonus = 1 + Number(targetState.patents || 0) * 0.1;
    const activeBoost = includeBoost && Date.now() < Number(targetState.boostUntil || 0) ? Number(targetState.boostMultiplier || 1) : 1;
    return base * patentBonus * activeBoost;
  }

  function worldProduction(worldId) {
    return WORLDS[worldId].upgrades.reduce((sum, item) => sum + Number(state.upgrades[item.id] || 0) * item.rate, 0) * (1 + state.patents * 0.1) * boostMultiplier();
  }

  function worldMastery(worldId) {
    return WORLDS[worldId].skills.reduce((sum, skill) => sum + Number(state.mastery[skill] || 0), 0);
  }

  function isUnlocked(worldId) {
    return state.totalCorrect >= WORLDS[worldId].unlock;
  }

  function upgradeCost(item) {
    const level = Number(state.upgrades[item.id] || 0);
    return Math.round(item.baseCost * Math.pow(1.72, level));
  }

  function renderWorlds() {
    refs.worldList.innerHTML = "";
    Object.entries(WORLDS).forEach(([id, world]) => {
      const unlocked = isUnlocked(id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `world-button${state.currentWorld === id ? " active" : ""}`;
      button.style.setProperty("--world-color", world.color);
      button.disabled = !unlocked;
      button.innerHTML = `<span class="world-icon">${world.icon}</span><span><span class="world-name">${world.name}</span><span class="world-sub">${world.subtitle}</span></span><span class="world-lock">${unlocked ? `${worldMastery(id)} pts` : `${world.unlock} ✓`}</span>`;
      button.addEventListener("click", () => selectWorld(id));
      refs.worldList.appendChild(button);
    });
  }

  function renderUpgrades() {
    const world = WORLDS[state.currentWorld];
    refs.upgradeList.innerHTML = "";
    world.upgrades.forEach(item => {
      const level = Number(state.upgrades[item.id] || 0);
      const cost = upgradeCost(item);
      const card = document.createElement("article");
      card.className = "upgrade-card";
      card.innerHTML = `<div class="upgrade-top"><span class="upgrade-symbol">${item.icon}</span><span><span class="upgrade-name">${item.name}</span><span class="upgrade-rate">+${format(item.rate)} flux/s par niveau</span></span><span class="upgrade-level">niv. ${level}</span></div><button class="buy-button" type="button" ${state.flux < cost ? "disabled" : ""}>Installer · ${format(cost, 0)} flux</button>`;
      card.querySelector("button").addEventListener("click", () => buyUpgrade(item));
      refs.upgradeList.appendChild(card);
    });
  }

  function renderSkills() {
    const world = WORLDS[state.currentWorld];
    refs.skillList.innerHTML = "";
    world.skills.forEach(skill => {
      const value = Number(state.mastery[skill] || 0);
      const row = document.createElement("div");
      row.className = "skill-row";
      row.innerHTML = `<span>${Engine.SKILLS[skill]}</span><b>${value}</b><div class="skill-progress"><i style="width:${Math.min(100, value * 10)}%"></i></div>`;
      refs.skillList.appendChild(row);
    });
    refs.worldMastery.textContent = `${worldMastery(state.currentWorld)} pts`;
  }

  function renderMission() {
    const target = state.missionTarget;
    const progress = Math.min(target, state.missionProgress);
    refs.missionTitle.textContent = `Réussir ${target} défis justes`;
    refs.missionCount.textContent = `${progress}/${target}`;
    refs.missionBar.style.width = `${progress / target * 100}%`;
  }

  function renderStatic() {
    const world = WORLDS[state.currentWorld];
    document.documentElement.style.setProperty("--accent", world.color);
    refs.worldKicker.textContent = `Monde ${world.number} · ${world.name}`;
    refs.challengeTitle.textContent = currentQuestion ? "Stabilise le système" : "Active le réseau";
    refs.cycle.textContent = state.cycle;
    refs.patent.textContent = state.patents;
    const threshold = CYCLE_THRESHOLD + (state.cycle - 1) * 25;
    refs.cycleButton.disabled = state.totalCorrect < threshold;
    refs.cycleButton.textContent = state.totalCorrect < threshold ? `Cycle à ${threshold} réussites` : "Nouveau cycle · +1 brevet";
    renderWorlds();
    renderUpgrades();
    renderSkills();
    renderMission();
  }

  function renderLive() {
    const production = calculateProduction();
    refs.flux.textContent = format(state.flux);
    refs.production.textContent = `${format(production)}/s`;
    refs.worldOutput.textContent = `${format(worldProduction(state.currentWorld))}/s`;
    refs.mastery.textContent = Object.values(state.mastery).reduce((a, b) => a + Number(b || 0), 0);
    refs.streak.textContent = state.streak;
    const boost = boostMultiplier();
    const remaining = Math.max(0, Math.ceil((state.boostUntil - Date.now()) / 1000));
    refs.boost.classList.toggle("active", boost > 1);
    refs.boost.querySelector("span:last-child").textContent = boost > 1 ? `Élan ×${boost} · ${remaining}s` : "Élan ×1";
    document.querySelectorAll(".buy-button").forEach((button, index) => {
      const item = WORLDS[state.currentWorld].upgrades[index];
      if (item) button.disabled = state.flux < upgradeCost(item);
    });
  }

  function selectWorld(id) {
    if (!isUnlocked(id) || id === state.currentWorld) return;
    state.currentWorld = id;
    clearTimeout(nextQuestionTimer);
    currentQuestion = null;
    resetQuestionView();
    renderStatic();
    saveState();
  }

  function buyUpgrade(item) {
    const cost = upgradeCost(item);
    if (state.flux < cost) return;
    state.flux -= cost;
    state.upgrades[item.id] = Number(state.upgrades[item.id] || 0) + 1;
    renderUpgrades();
    renderLive();
    saveState();
  }

  function startQuestion() {
    clearTimeout(nextQuestionTimer);
    const worldId = state.currentWorld;
    const recentKeys = state.recentQuestionKeys[worldId] || [];
    const recentKinds = state.recentQuestionKinds[worldId] || [];
    let questionKey = "";
    let attempts = 0;
    do {
      currentQuestion = Engine.generate(worldId, state.mastery, Math.random, {
        keys: recentKeys,
        kinds: recentKinds.slice(-2)
      });
      questionKey = Engine.fingerprint(currentQuestion);
      attempts += 1;
    } while (recentKeys.includes(questionKey) && attempts < 20);

    state.recentQuestionKeys[worldId] = [...recentKeys, questionKey].slice(-12);
    state.recentQuestionKinds[worldId] = [...recentKinds, currentQuestion.kind].slice(-2);
    saveState();
    questionStartedAt = performance.now();
    refs.skillChip.textContent = Engine.SKILLS[currentQuestion.skill];
    refs.questionText.textContent = currentQuestion.prompt;
    refs.questionVisual.hidden = !currentQuestion.visual;
    refs.questionVisual.innerHTML = currentQuestion.visual || "";
    refs.feedback.hidden = true;
    refs.feedback.className = "feedback";
    refs.startButton.hidden = true;
    refs.answers.innerHTML = "";
    currentQuestion.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.textContent = choice;
      button.addEventListener("click", () => answerQuestion(index));
      refs.answers.appendChild(button);
    });
    refs.challengeTitle.textContent = "Stabilise le système";
    updateQuestionTimer();
  }

  function updateQuestionTimer() {
    clearInterval(questionTimer);
    questionTimer = setInterval(() => {
      if (!currentQuestion) return;
      const elapsed = (performance.now() - questionStartedAt) / 1000;
      refs.timerLabel.textContent = `${elapsed.toFixed(1).replace(".", ",")} s`;
      refs.timerBar.style.transform = `scaleX(${Math.max(0, 1 - elapsed / 20)})`;
    }, 100);
  }

  function answerQuestion(index) {
    if (!currentQuestion) return;
    clearInterval(questionTimer);
    const elapsed = (performance.now() - questionStartedAt) / 1000;
    const correct = index === currentQuestion.answer;
    const buttons = [...refs.answers.querySelectorAll("button")];
    buttons.forEach((button, i) => {
      button.disabled = true;
      if (i === currentQuestion.answer) button.classList.add("correct");
      if (i === index && !correct) button.classList.add("wrong");
    });
    state.totalAnswered += 1;

    if (correct) {
      state.totalCorrect += 1;
      state.streak += 1;
      state.mastery[currentQuestion.skill] = Number(state.mastery[currentQuestion.skill] || 0) + 1;
      state.missionProgress += 1;
      const base = 12 + Math.min(18, state.streak * 2);
      let speedLabel = "Réponse validée";
      if (elapsed < 4) {
        state.boostMultiplier = Math.max(state.boostMultiplier, 2);
        state.boostUntil = Date.now() + 35000;
        speedLabel = "Réponse éclair · Élan ×2 pendant 35 s";
      } else if (elapsed < 8) {
        state.boostMultiplier = Math.max(state.boostMultiplier, 1.5);
        state.boostUntil = Date.now() + 25000;
        speedLabel = "Automatisme rapide · Élan ×1,5 pendant 25 s";
      }
      const reward = base * (1 + state.patents * 0.1);
      state.flux += reward;
      state.totalFlux += reward;
      refs.feedback.className = "feedback good";
      refs.feedback.innerHTML = `<strong>${speedLabel} · +${format(reward, 0)} flux</strong>${currentQuestion.explanation}`;
      if (state.missionProgress >= state.missionTarget) completeMission();
    } else {
      state.streak = 0;
      refs.feedback.className = "feedback bad";
      refs.feedback.innerHTML = `<strong>Pas encore — aucune ressource perdue.</strong>${currentQuestion.explanation} Une variante de cette notion reviendra bientôt.`;
    }
    refs.feedback.hidden = false;
    refs.timerLabel.textContent = `${elapsed.toFixed(1).replace(".", ",")} s`;
    refs.timerBar.style.transform = "scaleX(0)";
    currentQuestion = null;
    renderStatic();
    renderLive();
    saveState();
    nextQuestionTimer = setTimeout(startQuestion, 2500);
  }

  function completeMission() {
    const bonus = state.missionTarget * 18;
    state.flux += bonus;
    state.totalFlux += bonus;
    state.missionProgress = 0;
    state.missionTarget = Math.min(20, state.missionTarget + 2);
  }

  function resetQuestionView() {
    clearInterval(questionTimer);
    refs.skillChip.textContent = "Automatismes";
    refs.timerLabel.textContent = "Prêt";
    refs.timerBar.style.transform = "scaleX(1)";
    refs.questionVisual.hidden = true;
    refs.questionVisual.innerHTML = "";
    refs.questionText.textContent = "Une réponse juste alimente le réseau. Une réponse rapide déclenche un multiplicateur temporaire.";
    refs.answers.innerHTML = "";
    refs.feedback.hidden = true;
    refs.startButton.hidden = false;
    refs.startButton.textContent = "Lancer un défi";
  }

  function requestCycle() {
    const threshold = CYCLE_THRESHOLD + (state.cycle - 1) * 25;
    if (state.totalCorrect < threshold) return;
    confirmMode = "cycle";
    refs.confirmTitle.textContent = "Lancer un nouveau cycle ?";
    refs.confirmText.textContent = "Tes installations et ton flux seront réinitialisés. Ta maîtrise mathématique et les mondes débloqués restent acquis. Tu obtiendras un brevet : +10 % de production permanente.";
    refs.confirmAction.textContent = "Lancer le cycle";
    refs.confirmDialog.showModal();
  }

  function requestReset() {
    confirmMode = "reset";
    refs.confirmTitle.textContent = "Effacer toute la partie ?";
    refs.confirmText.textContent = "Cette action supprime le flux, les installations, la maîtrise et les brevets enregistrés sur cet appareil.";
    refs.confirmAction.textContent = "Tout effacer";
    refs.confirmDialog.showModal();
  }

  function confirmAction() {
    if (confirmMode === "cycle") {
      state.flux = 0;
      state.upgrades = {};
      state.cycle += 1;
      state.patents += 1;
      state.streak = 0;
      state.boostMultiplier = 1;
      state.boostUntil = 0;
    } else if (confirmMode === "reset") {
      state = defaultState();
      currentQuestion = null;
      resetQuestionView();
    }
    confirmMode = null;
    renderStatic();
    renderLive();
    saveState();
  }

  function setupEvents() {
    refs.startButton.addEventListener("click", startQuestion);
    $("help-button").addEventListener("click", () => refs.helpDialog.showModal());
    refs.cycleButton.addEventListener("click", requestCycle);
    $("reset-button").addEventListener("click", requestReset);
    refs.confirmAction.addEventListener("click", confirmAction);
  }

  function gameLoop() {
    const now = performance.now();
    let previous = now;
    function tick(time) {
      const seconds = Math.min(0.25, (time - previous) / 1000);
      previous = time;
      const gain = calculateProduction() * seconds;
      state.flux += gain;
      state.totalFlux += gain;
      renderLive();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  setupEvents();
  resetQuestionView();
  renderStatic();
  renderLive();
  gameLoop();
  setInterval(saveState, 3000);
  window.addEventListener("pagehide", saveState);

  if (state.offlineGain > 1) {
    refs.feedback.hidden = false;
    refs.feedback.className = "feedback good";
    refs.feedback.innerHTML = `<strong>Le réseau a continué à produire.</strong>+${format(state.offlineGain, 0)} flux depuis ta dernière visite.`;
    delete state.offlineGain;
  }
  if (!state.tutorialSeen) {
    refs.helpDialog.showModal();
    state.tutorialSeen = true;
    saveState();
  }
})();
