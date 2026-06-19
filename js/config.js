
const GAME_SPEED = 450; 
const TICK_RATE = 100; 
const MAX_GAUGE = 1000; 

let CraftingState = {
    targetSlot: null,
    craftSlot: 'weapon',
    forgeTab: 'enhance'
};

const ELEMENTS = {
    fire: { name: 'Fire', color: 'text-red-500', border: 'border-red-500', bg: 'bg-red-950/40' },
    water: { name: 'Water', color: 'text-sky-400', border: 'border-sky-400', bg: 'bg-sky-950/40' },
    earth: { name: 'Earth', color: 'text-amber-600', border: 'border-amber-600', bg: 'bg-amber-950/40' },
    wind: { name: 'Wind', color: 'text-emerald-400', border: 'border-emerald-400', bg: 'bg-emerald-950/40' },
    lightning: { name: 'Lightning', color: 'text-purple-400', border: 'border-purple-400', bg: 'bg-purple-950/40' },
    light: { name: 'Light', color: 'text-yellow-200', border: 'border-yellow-200', bg: 'bg-yellow-950/40' },
    dark: { name: 'Dark', color: 'text-fuchsia-400', border: 'border-fuchsia-400', bg: 'bg-fuchsia-950/40' }
};

const ELEMENT_COUNTERS = {
    'fire': 'earth', 'earth': 'wind', 'wind': 'lightning', 'lightning': 'water', 'water': 'fire'
};

const RARITIES = {
    common: { name: 'Common', statMult: 1.0, color: 'text-gray-400', border: 'border-gray-800', bg: 'bg-gray-900/50', dropWeight: 100, costMult: 1 },
    uncommon: { name: 'Uncommon', statMult: 1.2, color: 'text-emerald-400', border: 'border-emerald-900/50', bg: 'bg-emerald-950/10', dropWeight: 38, costMult: 2 },
    rare: { name: 'Rare', statMult: 1.5, color: 'text-blue-400', border: 'border-blue-900/50', bg: 'bg-blue-950/10', dropWeight: 14, costMult: 5 },
    sr: { name: 'SR', statMult: 2.0, color: 'text-purple-400', border: 'border-purple-900/50', bg: 'bg-purple-950/10', dropWeight: 4.5, costMult: 12 },
    ssr: { name: 'SSR', statMult: 3.0, color: 'text-amber-500', border: 'border-amber-900/50', bg: 'bg-amber-950/15', dropWeight: 1.2, costMult: 40 },
    ur: { name: 'UR', statMult: 10.0, color: 'text-rose-400', border: 'border-rose-900/50', bg: 'bg-rose-950/15', dropWeight: 0.0, costMult: 150 }, 
    legendary: { name: 'Legendary', statMult: 22.0, color: 'text-red-500', border: 'border-red-900/80', bg: 'bg-red-950/20', dropWeight: 0.02, costMult: 800 }
};

const SLOTS = ['weapon', 'helmet', 'armor', 'ring', 'gloves', 'necklace', 'pants', 'boots', 'belt'];

const FANTASY_ZONES = [
    { id: 1, name: 'Stormhaven Port', reqLevel: 1, mult: 1.0, rewardMult: 1.0 },
    { id: 2, name: 'Aethelgard Altar', reqLevel: 15, mult: 2.3, rewardMult: 2.1 },
    { id: 3, name: 'Muspelheim Abyss', reqLevel: 30, mult: 4.8, rewardMult: 3.8 },
    { id: 4, name: 'Ashen Citadel', reqLevel: 45, mult: 8.5, rewardMult: 6.5 },
    { id: 5, name: 'Elysium Sanctum', reqLevel: 60, mult: 16.0, rewardMult: 13.0 }
];

const SUMMON_TIERS = {
    C: { name: 'Common', statMult: 1.0, color: 'text-gray-400', bg: 'bg-gray-900/50', weight: 7000 },
    R: { name: 'Rare', statMult: 1.5, color: 'text-blue-400', bg: 'bg-blue-950/20', weight: 2200 },
    SR: { name: 'SR', statMult: 2.8, color: 'text-purple-400', bg: 'bg-purple-950/20', weight: 650 },
    SSR: { name: 'SSR', statMult: 5.5, color: 'text-amber-500', bg: 'bg-amber-950/20', weight: 150 },
    UR: { name: 'UR', statMult: 10.0, color: 'text-rose-400', bg: 'bg-rose-950/20', weight: 0 } 
};

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

const PET_SKILL_POOLS = {
    basic: [
        { name: 'Mini Thunderbolt', type: 'damage', mult: 1.0 },
        { name: 'Minor Heal', type: 'heal', mult: 1.1 },
        { name: 'Aqua Shadow', type: 'damage', mult: 0.9 },
        { name: 'Wind Breath', type: 'damage', mult: 1.0 }
    ],
    intermediate: [
        { name: 'Spirit Rain', type: 'heal', mult: 1.6 },
        { name: 'Great Fireball', type: 'damage', mult: 1.7 },
        { name: 'Stone Armor', type: 'heal', mult: 1.4 },
        { name: 'Raging Thunder', type: 'damage', mult: 1.8 }
    ],
    advanced: [
        { name: 'Phoenix Rebirth', type: 'heal', mult: 2.4 },
        { name: 'Dragon Wrath Annihilation', type: 'damage', mult: 2.6 },
        { name: 'Void Divine Shield', type: 'heal', mult: 2.0 },
        { name: 'Holy Light World Breaker', type: 'damage', mult: 2.5 }
    ]
};

const COMP_SKILL_POOLS = {
    basic: [
        { name: 'Normal Slash', type: 'attack', mult: 1.1 },
        { name: 'Wind Blade Slash', type: 'attack', mult: 1.2 },
        { name: 'Meteor Strike', type: 'attack', mult: 1.1 }
    ],
    intermediate: [
        { name: 'Cyclone Slash', type: 'attack', mult: 1.6 },
        { name: 'Thunder Shock Strike', type: 'attack', mult: 1.7 },
        { name: 'Flame Cleave', type: 'attack', mult: 1.6 },
        { name: 'Blood Dragon Strike', type: 'lifesteal', mult: 1.4 }
    ],
    advanced: [
        { name: 'Shadowless God Sword', type: 'attack', mult: 2.5 },
        { name: 'Dragon God Great Slash', type: 'attack', mult: 2.6 },
        { name: 'Annihilation Divine Strike', type: 'attack', mult: 2.7 },
        { name: 'Dark Night Soul Drain', type: 'lifesteal', mult: 2.0 }
    ]
};

const ENEMY_TEMPLATES = [
    { name: 'Colossal Golem', baseStats: { hp: 130, atk: 14, def: 12, res: 6, spd: 75, matk: 0 }, element: 'earth' },
    { name: 'Wind Demon Griffin', baseStats: { hp: 85, atk: 16, def: 5, res: 5, spd: 130, matk: 4 }, element: 'wind' },
    { name: 'Water Dragon Hatchling', baseStats: { hp: 105, atk: 10, def: 7, res: 11, spd: 90, matk: 12 }, element: 'water' },
    { name: 'Pyro Golem Demon', baseStats: { hp: 110, atk: 12, def: 8, res: 8, spd: 95, matk: 15 }, element: 'fire' },
    { name: 'Thunder Dragon God Lance', baseStats: { hp: 100, atk: 20, def: 8, res: 8, spd: 120, matk: 14 }, element: 'lightning' }
];

let State = {
    menuOpen: false, allocationBatch: 1, epBatch: 1,
    player: {
        name: 'Knight of Light', level: 1, exp: 0, gold: 10000, gems: 0,
        statPoints: 0, ep: 0,
        baseStats: { maxHp: 0, atk: 0, matk: 0, def: 0, res: 0, spd: 0, mr: 0, cr: 0, cd: 0 },
        elementPoints: { fire: 0, water: 0, earth: 0, wind: 0, lightning: 0, light: 0, dark: 0 },
        unlockedSkills: [], dungeonAttempts: 30, pityCount: 0, lastDungeonReset: "", role: 'guest'
    },
    equipment: { weapon: null, helmet: null, armor: null, ring: null, gloves: null, necklace: null, pants: null, boots: null, belt: null },
    inventory: [],
    materials: { raw_iron: 5, fine_iron: 0, refined_iron: 0, philosopher_stone: 0, pet_soul: 0, comp_soul: 0 },
    pets: [], companions: [], activePetId: null, activeCompanionId: null,
    mode: 'farm', selectedDungeonType: 'exp', selectedZoneId: 1, towerFloor: 1,
    inventorySubTab: 'equip',
    combatState: { active: false, turn: null, allies: [], enemies: [], tickInterval: null }
};

