/* ============================================================
   gameRules.js — server-authoritative game logic.

   IMPORTANT PATTERN: every action that involves Math.random()
   (alchemy success, enhance success, gacha pulls, dungeon drops...)
   must be decided HERE, on the server, never trusted from the
   client. The client only sends "I want to do X", the server
   decides what happened and returns the new state + a log message.

   This file currently ports two representative actions (alchemy
   and equipment enhancement) from js/crafting.js as a template.
   Follow the same pattern to migrate gacha pulls, dungeon sweep,
   and combat rewards next.
   ============================================================ */

function getDefaultState(role) {
    const base = {
        player: {
            name: 'Knight of Light', level: 1, exp: 0, gold: 10000, gems: 0,
            statPoints: 0, ep: 0,
            baseStats: { maxHp: 0, atk: 0, matk: 0, def: 0, res: 0, spd: 0, mr: 0, cr: 0, cd: 0 },
            elementPoints: { fire: 0, water: 0, earth: 0, wind: 0, lightning: 0, light: 0, dark: 0 },
            unlockedSkills: [], dungeonAttempts: 30, pityCount: 0, lastDungeonReset: '', role
        },
        equipment: { weapon: null, helmet: null, armor: null, ring: null, gloves: null, necklace: null, pants: null, boots: null, belt: null },
        inventory: [],
        materials: { raw_iron: 5, fine_iron: 0, refined_iron: 0, philosopher_stone: 0, pet_soul: 0, comp_soul: 0 },
        pets: [], companions: [], activePetId: null, activeCompanionId: null,
        selectedZoneId: 1, towerFloor: 1
    };

    if (role === 'admin') {
        base.player.gold = 1000000; base.player.gems = 10000; base.player.level = 50;
        base.player.statPoints = 250; base.player.ep = 10;
        const SLOTS = ['weapon', 'helmet', 'armor', 'ring', 'gloves', 'necklace', 'pants', 'boots', 'belt'];
        SLOTS.forEach(slot => {
            base.equipment[slot] = {
                id: genId(), name: `Admin ${slot} UR +5`, slot, type: 'equip',
                rarity: 'ur', level: 50, enhanceLevel: 5,
                stats: { atk: 120, matk: 120, maxHp: 800, def: 45, spd: 30, res: 45, mr: 1, cr: 0.05, cd: 0.2 },
                value: 5000
            };
        });
    } else {
        const SLOTS = ['weapon', 'helmet', 'armor', 'ring', 'gloves', 'necklace', 'pants', 'boots', 'belt'];
        SLOTS.forEach(slot => {
            const item = {
                id: genId(), name: `Starter ${slot.toUpperCase()} Common +0`, slot, type: 'equip',
                rarity: 'common', level: 1, enhanceLevel: 0, stats: {}, value: 50
            };
            if (slot === 'weapon') { item.stats.atk = 8; item.stats.matk = 8; }
            else if (['helmet', 'pants', 'armor'].includes(slot)) { item.stats.maxHp = 40; item.stats.def = 1; }
            else if (slot === 'ring') item.stats.cr = 0.01;
            else if (slot === 'boots') item.stats.spd = 5;
            else item.stats.res = 2;
            base.equipment[slot] = item;
        });
        base.player.unlockedSkills = ['fire_basic'];
    }
    return base;
}

function genId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// --- Alchemy: ported 1:1 from js/crafting.js alchemyAction(), now
// the RNG happens server-side so the client cannot force a result. ---
const ALCHEMY_RECIPES = {
    common_to_uncommon: { cost: { raw_iron: 3 }, successRate: 0.85, gain: 'fine_iron', refund: { raw_iron: 1 } },
    uncommon_to_rare: { cost: { fine_iron: 3 }, successRate: 0.60, gain: 'refined_iron', refund: { fine_iron: 1 } },
    rare_to_legendary: { cost: { refined_iron: 3 }, successRate: 0.35, gain: 'philosopher_stone', refund: { raw_iron: 1 } }
};

function performAlchemy(state, recipeKey) {
    const recipe = ALCHEMY_RECIPES[recipeKey];
    if (!recipe) return { ok: false, message: 'Unknown recipe' };

    for (const mat in recipe.cost) {
        if ((state.materials[mat] || 0) < recipe.cost[mat]) {
            return { ok: false, message: `Not enough ${mat}!` };
        }
    }
    for (const mat in recipe.cost) state.materials[mat] -= recipe.cost[mat];

    const success = Math.random() < recipe.successRate;
    if (success) {
        state.materials[recipe.gain] = (state.materials[recipe.gain] || 0) + 1;
        return { ok: true, success: true, message: `${recipe.gain} alchemy success!`, state };
    } else {
        for (const mat in recipe.refund) state.materials[mat] = (state.materials[mat] || 0) + recipe.refund[mat];
        return { ok: true, success: false, message: 'Alchemy failed!', state };
    }
}

// --- Equipment enhancement: ported from js/crafting.js enhance() ---
function performEnhance(state, slot, useProtection) {
    const item = state.equipment[slot];
    if (!item) return { ok: false, message: 'No item equipped in that slot' };

    const cost = Math.floor(120 * Math.pow(1.5, item.enhanceLevel));
    const protectCost = 5000;
    const totalCost = cost + (useProtection ? protectCost : 0);

    if (state.player.gold < totalCost) return { ok: false, message: 'Not enough Gold!' };
    state.player.gold -= totalCost;

    let chance = 100;
    if (item.enhanceLevel >= 5) chance = 80;
    if (item.enhanceLevel >= 10) chance = 50;
    if (item.enhanceLevel >= 15) chance = 25;

    const success = Math.random() * 100 <= chance;
    if (success) {
        item.enhanceLevel++;
        item.name = item.name.replace(/\+\d+/, `+${item.enhanceLevel}`);
        for (const k in item.stats) {
            item.stats[k] = Math.floor(item.stats[k] * 1.06) || parseFloat((item.stats[k] * 1.06).toFixed(4));
        }
        return { ok: true, success: true, message: `Enhancement success: +${item.enhanceLevel}!`, state };
    } else {
        if (useProtection && item.enhanceLevel >= 10) {
            return { ok: true, success: false, protected: true, message: 'Protection Charm saved your star level!', state };
        }
        if (item.enhanceLevel >= 15) item.enhanceLevel = Math.max(0, item.enhanceLevel - 2);
        else if (item.enhanceLevel >= 10) item.enhanceLevel = Math.max(0, item.enhanceLevel - 1);
        item.name = item.name.replace(/\+\d+/, `+${item.enhanceLevel}`);
        return { ok: true, success: false, message: 'Forge failed!', state };
    }
}

module.exports = { getDefaultState, genId, performAlchemy, performEnhance, ALCHEMY_RECIPES };
