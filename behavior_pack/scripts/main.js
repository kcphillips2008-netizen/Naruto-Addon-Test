import { world, system } from "@minecraft/server";

const CHAKRA_OBJECTIVE = "chakra";
const XP_OBJECTIVE = "ninja_xp";
const MAX_CHAKRA = 100;
const CHAKRA_REGEN_PER_INTERVAL = 2;
const REGEN_INTERVAL_TICKS = 20;

function getOrCreateObjective(id, displayName) {
  return world.scoreboard.getObjective(id) ??
    world.scoreboard.addObjective(id, displayName);
}

function scoreFor(objective, player, fallback = 0) {
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
  const identity = player.scoreboardIdentity;
  if (!identity) return;

  try { chakra.getScore(identity); }
  catch { chakra.setScore(identity, MAX_CHAKRA); }

  try { xp.getScore(identity); }
  catch { xp.setScore(identity, 0); }
}

world.afterEvents.playerSpawn.subscribe(({ player }) => {
  system.run(() => {
    try { setupPlayer(player); }
    catch (error) { console.warn(`[Naruto Addon] Player setup failed: ${error}`); }
  });
});

system.runInterval(() => {
  let chakraObjective;
  let xpObjective;
  try {
    chakraObjective = getOrCreateObjective(CHAKRA_OBJECTIVE, "Chakra");
    xpObjective = getOrCreateObjective(XP_OBJECTIVE, "Ninja XP");
  } catch (error) {
    console.warn(`[Naruto Addon] Scoreboard setup failed: ${error}`);
    return;
  }

  for (const player of world.getPlayers()) {
    const identity = player.scoreboardIdentity;
    if (!identity) continue;
    try {
      const current = scoreFor(chakraObjective, player, MAX_CHAKRA);
      const chakra = Math.min(MAX_CHAKRA, current + CHAKRA_REGEN_PER_INTERVAL);
      chakraObjective.setScore(identity, chakra);
      const xp = scoreFor(xpObjective, player, 0);
      const level = Math.floor(xp / 100) + 1;
      player.onScreenDisplay.setActionBar(
        `§bChakra: §f${chakra}/${MAX_CHAKRA}   §eNinja Lv. ${level} §7(XP: ${xp})`
      );
    } catch (error) {
      console.warn(`[Naruto Addon] Player update failed: ${error}`);
    }
  }
}, REGEN_INTERVAL_TICKS);

console.warn("[Naruto Addon] Chakra foundation loaded.");
