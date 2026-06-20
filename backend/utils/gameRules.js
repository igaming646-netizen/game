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

// Mirrors frontend/js/config.js SKILL_DB — used only to grant the admin
// account every skill in the game on creation.
const SKILL_DB = {
    fire: {
        basic: { id: 'f1', name: 'Fireball', cost: 20, mult: 1.2, type: 'damage', epReq: 1, tierName: 'Basic' },
        intermediate: { id: 'f2', name: 'Incinerate', cost: 35, mult: 1.7, type: 'damage', epReq: 5, tierName: 'Intermediate' },
        advanced: { id: 'f3', name: 'Inferno', cost: 50, mult: 2.3, type: 'damage', epReq: 12, tierName: 'Advanced' }
    },
    water: {
        basic: { id: 'w1', name: 'Aqua Arrow', cost: 20, mult: 1.2, type: 'damage', epReq: 1, tierName: 'Basic' },
        intermediate: { id: 'w2', name: 'Ice Storm', cost: 35, mult: 1.7, type: 'damage', epReq: 5, tierName: 'Intermediate' },
        advanced: { id: 'w3', name: 'Avalanche', cost: 50, mult: 2.3, type: 'damage', epReq: 12, tierName: 'Advanced' }
    },
    earth: {
        basic: { id: 'e1', name: 'Earthquake', cost: 20, mult: 1.2, type: 'damage', epReq: 1, tierName: 'Basic' },
        intermediate: { id: 'e2', name: 'Stone Wall', cost: 35, mult: 1.7, type: 'damage', epReq: 5, tierName: 'Intermediate' },
        advanced: { id: 'e3', name: 'Boulder Crush', cost: 50, mult: 2.3, type: 'damage', epReq: 12, tierName: 'Advanced' }
    },
    wind: {
        basic: { id: 'wi1', name: 'Wind Blade', cost: 20, mult: 1.2, type: 'damage', epReq: 1, tierName: 'Basic' },
        intermediate: { id: 'wi2', name: 'Gale Step', cost: 35, mult: 1.7, type: 'damage', epReq: 5, tierName: 'Intermediate' },
        advanced: { id: 'wi3', name: 'Cyclone Slash', cost: 50, mult: 2.3, type: 'damage', epReq: 12, tierName: 'Advanced' }
    },
    lightning: {
        basic: { id: 'li1', name: 'Thunderbolt', cost: 20, mult: 1.2, type: 'damage', epReq: 1, tierName: 'Basic' },
        intermediate: { id: 'li2', name: 'Chain Lightning', cost: 35, mult: 1.7, type: 'damage', epReq: 5, tierName: 'Intermediate' },
        advanced: { id: 'li3', name: 'Thunder Strike', cost: 50, mult: 2.3, type: 'damage', epReq: 12, tierName: 'Advanced' }
    },
    light: {
        basic: { id: 'l1', name: 'Holy Heal', cost: 25, mult: 1.3, type: 'heal', epReq: 1, tierName: 'Basic' },
        intermediate: { id: 'l2', name: 'Radiant Shield', cost: 40, mult: 1.8, type: 'heal', epReq: 5, tierName: 'Intermediate' },
        advanced: { id: 'l3', name: 'Salvation', cost: 55, mult: 2.4, type: 'heal', epReq: 12, tierName: 'Advanced' }
    },
    dark: {
        basic: { id: 'd1', name: 'Soul Drain', cost: 25, mult: 1.1, type: 'lifesteal', epReq: 1, tierName: 'Basic' },
        intermediate: { id: 'd2', name: 'Shadow Bind', cost: 40, mult: 1.6, type: 'damage', epReq: 5, tierName: 'Intermediate' },
        advanced: { id: 'd3', name: 'Nightmare Curse', cost: 55, mult: 2.2, type: 'damage', epReq: 12, tierName: 'Advanced' }
    }
};

function getDefaultState(role) {
    const base = {
        player: {
            name: 'Knight of Light', level: 1, exp: 0, gold: 10000, gems: 0,
            statPoints: 0, ep: 0,
            baseStats: { maxHp: 0, atk: 0, matk: 0, def: 0, res: 0, spd: 0, mr: 0, cr: 0, cd: 0 },
            elementPoints: { fire: 0, water: 0, earth: 0, wind: 0, lightning: 0, light: 0, dark: 0 },
            unlockedSkills: [], dungeonAttempts: 30, pityCount: 0, lastDungeonReset: '', role,
            enemiesDefeated: 0, totalAlchemySuccess: 0, totalEnhanceSuccess: 0
        },
        claimedQuests: [],
        equipment: { weapon: null, helmet: null, armor: null, ring: null, gloves: null, necklace: null, pants: null, boots: null, belt: null },
        inventory: [],
        materials: { raw_iron: 5, fine_iron: 0, refined_iron: 0, philosopher_stone: 0, pet_soul: 0, comp_soul: 0 },
        pets: [], companions: [], activePetId: null, activeCompanionId: null,
        selectedZoneId: 1, towerFloor: 1
    };

    if (role === 'admin') {
        // Admin is a sandbox/dev account — it does NOT follow normal
        // progression rules. Effectively maxed out across the board.
        base.player.gold = 999999999; base.player.gems = 999999; base.player.level = 99;
        base.player.statPoints = 9999; base.player.ep = 9999;
        base.player.dungeonAttempts = 999999; // never runs out, and checkDailyReset() skips resetting this for admin
        base.player.elementPoints = { fire: 999, water: 999, earth: 999, wind: 999, lightning: 999, light: 999, dark: 999 };
        // Every skill in the game, across every element, fully unlocked.
        base.player.unlockedSkills = Object.values(SKILL_DB).flatMap(el => Object.values(el));

        const SLOTS = ['weapon', 'helmet', 'armor', 'ring', 'gloves', 'necklace', 'pants', 'boots', 'belt'];
        SLOTS.forEach(slot => {
            base.equipment[slot] = {
                id: genId(), name: `Admin ${slot} UR +10`, slot, type: 'equip',
                rarity: 'ur', level: 99, enhanceLevel: 10,
                stats: { atk: 400, matk: 400, maxHp: 3000, def: 150, spd: 80, res: 150, mr: 2, cr: 0.3, cd: 0.6 },
                value: 50000
            };
        });

        base.materials = { raw_iron: 999, fine_iron: 999, refined_iron: 999, philosopher_stone: 999, pet_soul: 999, comp_soul: 999 };

        // Pre-owned max-tier pet & companion, already leveled, set active.
        const phoenix = {
            id: genId(), name: 'Phoenix UR', level: 50, exp: 0, tier: 'UR', element: 'light',
            stats: { maxHp: 1000, atk: 100, matk: 150, def: 40, res: 40, spd: 950, mr: 10, cr: 0.1, cd: 11 },
            bonusStats: { maxHp: 0, atk: 0, matk: 0, def: 0, res: 0, spd: 0, mr: 0, cr: 0, cd: 0 },
            skillName: 'Phoenix Rebirth', skillType: 'heal', skillMult: 2.0
        };
        const thunderGod = {
            id: genId(), name: 'Thunder God Sentinel UR', level: 50, exp: 0, tier: 'UR', element: 'fire',
            stats: { maxHp: 2000, atk: 300, matk: 50, def: 80, res: 80, spd: 1050, mr: 10, cr: 0.2, cd: 12 },
            bonusStats: { maxHp: 0, atk: 0, matk: 0, def: 0, res: 0, spd: 0, mr: 0, cr: 0, cd: 0 },
            skillName: 'Judgment Bolt', skillType: 'damage', skillMult: 2.5
        };
        base.pets = [phoenix];
        base.companions = [thunderGod];
        base.activePetId = phoenix.id;
        base.activeCompanionId = thunderGod.id;
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