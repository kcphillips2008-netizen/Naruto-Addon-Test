import { world, system } from "@minecraft/server";

const CHAKRA_OBJECTIVE = "chakra";
const XP_OBJECTIVE = "ninja_xp";
const MAX_CHAKRA = 100;
const CHAKRA_REGEN_PER_INTERVAL = 2;
const REGEN_INTERVAL_TICKS = 20;

function getOrCreateObjective(id, displayName) {
  let objective = world.scoreboard.getObjective(id);
  if (!objective) {
    objective = world.scoreboard.addObjective(id, displayName);
  }
  return objective;
}

function setScoreIfMissing(objective, player, value) {
  const identity = player.scoreboardIdentity;
  if (!identity) return;
  try {
    objective.getScore(identity);
  } catch {
    objective.setScore(identity, value);
  }
}

function getScore(objective, player, fallback = 0) {
  const identity = player.scoreboardIdentity;
  if (!identity) return fallback;
  try {
    return objective.getScore(identity);
  } catch {
    return fallback;
  }
}

function setupPlayer(player) {
  const chakra = getOrCreateObjective(CHAKRA_OBJECTIVE, "Chakra");
  const xp = getOrCreateObjective(XP_OBJECTIVE, "Ninja XP");
  setScoreIfMissing(chakra, player, MAX_CHAKRA);
  setScoreIfMissing(xp, player, 0);
}

world.afterEvents.playerSpawn.subscribe(({ player }) => {
  system.run(() => setupPlayer(player));
});

system.runInterval(() => {
  let chakraObjective;
  let xpObjective;
  try {
    chakraObjective = getOrCreateObjective(CHAKRA_OBJECTIVE, "Chakra");
    xpObjective = getOrCreateObjective(XP_OBJECTIVE, "Ninja XP");
  } catch (error) {
    console.warn(`[Naruto Addon] Could not initialize scoreboard: ${error}`);
    return;
  }

  for (const player of world.getPlayers()) {
    const identity = player.scoreboardIdentity;
    if (!identity) continue;

    const current = getScore(chakraObjective, player, MAX_CHAKRA);
    const chakra = Math.min(MAX_CHAKRA, current + CHAKRA_REGEN_PER_INTERVAL);
    try {
      chakraObjective.setScore(identity, chakra);
      const xp = getScore(xpObjective, player, 0);
      const level = Math.floor(xp / 100) + 1;
      player.onScreenDisplay.setActionBar(
        `§bChakra: §f${chakra}/${MAX_CHAKRA}   §eNinja Lv. ${level} §7(XP: ${xp})`
      );
    } catch (error) {
      console.warn(`[Naruto Addon] Player update failed: ${error}`);
    }
  }
}, REGEN_INTERVAL_TICKS);

console.warn("[Naruto Addon] Chakra and ninja progression foundation loaded.");
