import { world, system } from "@minecraft/server";

const TAG = "[Naruto Test v0.1.3]";
const CHAKRA_OBJECTIVE = "chakra";
const XP_OBJECTIVE = "ninja_xp";
const MAX_CHAKRA = 100;
const REGEN_PER_SECOND = 2;

function objective(id, name) {
  let obj = world.scoreboard.getObjective(id);
  if (!obj) obj = world.scoreboard.addObjective(id, name);
  return obj;
}

function ensurePlayer(player) {
  try {
    const chakra = objective(CHAKRA_OBJECTIVE, "Chakra");
    const xp = objective(XP_OBJECTIVE, "Ninja XP");
    chakra.setScore(player, safeScore(chakra, player, MAX_CHAKRA));
    xp.setScore(player, safeScore(xp, player, 0));
    player.sendMessage("§b[Naruto Test] Script loaded. Chakra system initialized.");
  } catch (error) {
    console.warn(`${TAG} Player initialization error: ${error}`);
    try { player.sendMessage("§c[Naruto Test] Initialization failed. Check Content Log."); } catch {}
  }
}

function safeScore(obj, player, fallback) {
  try {
    const score = obj.getScore(player);
    return typeof score === "number" ? score : fallback;
  } catch {
    return fallback;
  }
}

console.warn(`${TAG} SCRIPT ENTRY RAN`);
world.sendMessage("§a[Naruto Test] Script is running.");

world.afterEvents.playerSpawn.subscribe((event) => {
  system.run(() => ensurePlayer(event.player));
});

system.runInterval(() => {
  try {
    const chakra = objective(CHAKRA_OBJECTIVE, "Chakra");
    const xp = objective(XP_OBJECTIVE, "Ninja XP");
    for (const player of world.getPlayers()) {
      const current = safeScore(chakra, player, MAX_CHAKRA);
      const next = Math.min(MAX_CHAKRA, current + REGEN_PER_SECOND);
      chakra.setScore(player, next);
      const points = safeScore(xp, player, 0);
      const level = Math.floor(points / 100) + 1;
      player.onScreenDisplay.setActionBar(`§bChakra: §f${next}/${MAX_CHAKRA}   §eNinja Lv. ${level} §7(XP: ${points})`);
    }
  } catch (error) {
    console.warn(`${TAG} Tick error: ${error}`);
  }
}, 20);
