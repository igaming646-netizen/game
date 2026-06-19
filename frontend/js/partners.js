const Partners = {
    summon(type, premium = false, count = 1) {
        let goldCost = 10000 * count;
        let gemCost = 100 * count;
        if (premium) {
            if (State.player.gems < gemCost) { UI.showDialogAlert("Failed", "Not enough Gems!"); return; }
            State.player.gems -= gemCost;
        } else {
            if (State.player.gold < goldCost) { UI.showDialogAlert("Failed", "Not enough Gold!"); return; }
            State.player.gold -= goldCost;
            State.player.pityCount = Math.min(150, State.player.pityCount + count);
        }
        UI.updateTopBar();

        let summonedList = [];
        for (let i = 0; i < count; i++) {
            let chosenTierKey = 'C';
            if (premium) {
                chosenTierKey = Math.random() < 0.10 ? 'UR' : 'SSR';
            } else {
                let roll = Utils.randomInt(1, 10000);
                let cum = 0;
                for (let [tk, tData] of Object.entries(SUMMON_TIERS)) {
                    cum += tData.weight;
                    if (roll <= cum) { chosenTierKey = tk; break; }
                }
            }

            let tMeta = SUMMON_TIERS[chosenTierKey];
            let mult = tMeta.statMult;

            let skillPool = 'basic';
            if (chosenTierKey === 'SR' || chosenTierKey === 'SSR') skillPool = 'intermediate';
            else if (chosenTierKey === 'UR') skillPool = 'advanced';

            if (type === 'pet') {
                const petNames = { C: 'Fire Cat C', R: 'Water Dragon Spirit R', SR: 'Wood Spirit Ginseng SR', SSR: 'Light Kirin SSR', UR: 'Phoenix UR' };
                let chosenElement = (chosenTierKey === 'UR' || chosenTierKey === 'SSR') ? 'light' : 'fire';
                
                let pool = PET_SKILL_POOLS[skillPool];
                let randSkill = pool[Utils.randomInt(0, pool.length - 1)];

                let pet = {
                    id: Utils.generateId(), name: petNames[chosenTierKey], level: 1, exp: 0, tier: chosenTierKey, element: chosenElement,
                    stats: {
                        maxHp: Math.floor(100 * mult), atk: Math.floor(10 * mult), matk: Math.floor(15 * mult),
                        def: Math.floor(4 * mult), res: Math.floor(4 * mult), spd: Math.floor(95 * mult),
                        mr: parseFloat((1.0 * mult).toFixed(2)), cr: parseFloat((0.01 * mult).toFixed(3)), cd: parseFloat((1.10 * mult).toFixed(2))
                    },
                    bonusStats: { maxHp: 0, atk: 0, matk: 0, def: 0, res: 0, spd: 0, mr: 0, cr: 0, cd: 0 },
                    skillName: randSkill.name, skillType: randSkill.type, skillMult: randSkill.mult
                };
                State.pets.push(pet);
                summonedList.push(pet);
                Utils.log(`Tamed: <span class="${tMeta.color} font-bold">${pet.name} [Unlocked: ${pet.skillName}]</span>!`, 'text-emerald-300');
            } else {
                const compNames = { C: 'Swordsman C', R: 'Mage R', SR: 'Guardian SR', SSR: 'Assassin SSR', UR: 'Thunder God Sentinel UR' };
                
                let pool = COMP_SKILL_POOLS[skillPool];
                let randSkill = pool[Utils.randomInt(0, pool.length - 1)];

                let comp = {
                    id: Utils.generateId(), name: compNames[chosenTierKey], level: 1, exp: 0, tier: chosenTierKey, element: 'fire',
                    stats: {
                        maxHp: Math.floor(200 * mult), atk: Math.floor(30 * mult), matk: Math.floor(5 * mult),
                        def: Math.floor(8 * mult), res: Math.floor(8 * mult), spd: Math.floor(105 * mult),
                        mr: parseFloat((1.0 * mult).toFixed(2)), cr: parseFloat((0.02 * mult).toFixed(3)), cd: parseFloat((1.20 * mult).toFixed(2))
                    },
                    bonusStats: { maxHp: 0, atk: 0, matk: 0, def: 0, res: 0, spd: 0, mr: 0, cr: 0, cd: 0 },
                    skillName: randSkill.name, skillType: randSkill.type, skillMult: randSkill.mult
                };
                State.companions.push(comp);
                summonedList.push(comp);
                Utils.log(`Contract signed: <span class="${tMeta.color} font-bold">${comp.name} [Unlocked: ${comp.skillName}]</span>!`, 'text-indigo-300');
            }
        }

        UI.updatePartnersTab();
        UI.showSummonSummaryModal(summonedList, premium);
    },
    claimPity(type) {
        if (State.player.pityCount < 150) return;
        
        let chosenTierKey = 'UR';
        let tMeta = SUMMON_TIERS[chosenTierKey];
        let mult = tMeta.statMult;

        if (type === 'pet') {
            let pool = PET_SKILL_POOLS.advanced;
            let randSkill = pool[Utils.randomInt(0, pool.length - 1)];

            let pet = {
                id: Utils.generateId(), name: 'Pity Phoenix UR', level: 1, exp: 0, tier: chosenTierKey, element: 'light',
                stats: {
                    maxHp: Math.floor(100 * mult), atk: Math.floor(10 * mult), matk: Math.floor(15 * mult),
                    def: Math.floor(4 * mult), res: Math.floor(4 * mult), spd: Math.floor(95 * mult),
                    mr: parseFloat((1.0 * mult).toFixed(2)), cr: parseFloat((0.01 * mult).toFixed(3)), cd: parseFloat((1.10 * mult).toFixed(2))
                },
                bonusStats: { maxHp: 0, atk: 0, matk: 0, def: 0, res: 0, spd: 0, mr: 0, cr: 0, cd: 0 },
                skillName: randSkill.name, skillType: randSkill.type, skillMult: randSkill.mult
            };
            State.pets.push(pet);
        } else {
            let pool = COMP_SKILL_POOLS.advanced;
            let randSkill = pool[Utils.randomInt(0, pool.length - 1)];

            let comp = {
                id: Utils.generateId(), name: 'Pity Thunder God UR', level: 1, exp: 0, tier: chosenTierKey, element: 'fire',
                stats: {
                    maxHp: Math.floor(200 * mult), atk: Math.floor(30 * mult), matk: Math.floor(5 * mult),
                    def: Math.floor(8 * mult), res: Math.floor(8 * mult), spd: Math.floor(105 * mult),
                    mr: parseFloat((1.0 * mult).toFixed(2)), cr: parseFloat((0.02 * mult).toFixed(3)), cd: parseFloat((1.20 * mult).toFixed(2))
                },
                bonusStats: { maxHp: 0, atk: 0, matk: 0, def: 0, res: 0, spd: 0, mr: 0, cr: 0, cd: 0 },
                skillName: randSkill.name, skillType: randSkill.type, skillMult: randSkill.mult
            };
            State.companions.push(comp);
        }

        State.player.pityCount = 0;
        UI.updatePartnersTab();
        UI.showDialogAlert("Pity Success", `A mighty UR soul has joined the battle!`);
    },
    setActive(type, id) {
        if (type === 'pet') State.activePetId = State.activePetId === id ? null : id;
        else State.activeCompanionId = State.activeCompanionId === id ? null : id;
        UI.updatePartnersTab();
        Utils.log("Battle formation updated!", "text-cyan-400");
    },
    releasePartner(type, id) {
        let list = (type === 'pet') ? State.pets : State.companions;
        let found = list.find(x => x.id === id);
        if (!found) return;

        let compensations = this.calculateReleaseReward(found);

        if (type === 'pet') {
            State.pets = State.pets.filter(p => p.id !== id);
            if (State.activePetId === id) State.activePetId = null;
            State.materials.pet_soul += compensations.souls;
        } else {
            State.companions = State.companions.filter(c => c.id !== id);
            if (State.activeCompanionId === id) State.activeCompanionId = null;
            State.materials.comp_soul += compensations.souls;
        }
        State.player.gold += compensations.gold;

        UI.updatePartnersTab();
        UI.updateTopBar();
        UI.showDialogAlert("Released", `Successfully released the ally. Compensation received: +${compensations.souls} Souls and +${compensations.gold} Gold.`);
    },
    bulkRelease(type) {
        let maxTier = document.getElementById('bulk-release-tier').value;
        let list = (type === 'pet') ? State.pets : State.companions;
        
        const tierWeights = { 'C': 1, 'R': 2, 'SR': 3, 'SSR': 4, 'UR': 5 };
        let targetWeight = tierWeights[maxTier] || 2; 

        let targets = list.filter(x => {
            let weight = tierWeights[x.tier] || 1;
            return weight <= targetWeight;
        });

        if (targets.length === 0) {
            UI.showDialogAlert("Notice", "No compatible allies found for auto-release.");
            return;
        }

        let totalSouls = 0;
        let totalGold = 0;

        targets.forEach(found => {
            let compensations = this.calculateReleaseReward(found);
            totalSouls += compensations.souls;
            totalGold += compensations.gold;

            if (type === 'pet') {
                State.pets = State.pets.filter(p => p.id !== found.id);
                if (State.activePetId === found.id) State.activePetId = null;
            } else {
                State.companions = State.companions.filter(c => c.id !== found.id);
                if (State.activeCompanionId === found.id) State.activeCompanionId = null;
            }
        });

        if (type === 'pet') {
            State.materials.pet_soul += totalSouls;
        } else {
            State.materials.comp_soul += totalSouls;
        }
        State.player.gold += totalGold;

        UI.updatePartnersTab();
        UI.updateTopBar();
        UI.showDialogAlert("Bulk Release", `Successfully released ${targets.length} allies. Total compensation: +${totalSouls} Souls and +${totalGold} Gold.`);
    },
    calculateReleaseReward(partner) {
        let tierBaseSouls = { C: 1, R: 3, SR: 10, SSR: 30, UR: 100 };
        let tierBaseGold = { C: 1000, R: 3000, SR: 10000, SSR: 30000, UR: 100000 };

        let baseS = tierBaseSouls[partner.tier] || 1;
        let baseG = tierBaseGold[partner.tier] || 1000;

        let levelBonusSouls = (partner.level - 1) * 2; 
        let levelBonusGold = (partner.level - 1) * 1000;

        return {
            souls: baseS + levelBonusSouls,
            gold: baseG + levelBonusGold
        };
    },
    upgradePartner(type, id, mode = 1) {
        let list = (type === 'pet') ? State.pets : State.companions;
        let partner = list.find(p => p.id === id);
        if (!partner) return;

        let availableSouls = (type === 'pet') ? State.materials.pet_soul : State.materials.comp_soul;
        let soulsUsed = 1;
        if (mode === 10) soulsUsed = 10;
        if (mode === 'max') soulsUsed = availableSouls;

        soulsUsed = Math.min(soulsUsed, availableSouls);

        if (soulsUsed >= 1) {
            if (type === 'pet') State.materials.pet_soul -= soulsUsed;
            else State.materials.comp_soul -= soulsUsed;

            let expGained = soulsUsed * 1000;
            partner.exp = (partner.exp || 0) + expGained;

            let leveledUp = 0;
            while (partner.exp >= (partner.level * 1000)) {
                partner.exp -= (partner.level * 1000);
                partner.level++;
                leveledUp++;

                for (let key in partner.stats) {
                    partner.stats[key] = partner.stats[key] * 1.15;
                    if (key === 'cr' || key === 'cd') {
                        partner.stats[key] = parseFloat(partner.stats[key].toFixed(3));
                    } else {
                        partner.stats[key] = Math.floor(partner.stats[key]);
                    }
                }

                let statKeys = Object.keys(partner.stats);
                let randKey = statKeys[Utils.randomInt(0, statKeys.length - 1)];
                let mutValue = 1;
                if (randKey === 'maxHp') mutValue = 15;
                else if (randKey === 'atk' || randKey === 'matk') mutValue = 3;
                else if (randKey === 'def' || randKey === 'res') mutValue = 1;
                else if (randKey === 'spd') mutValue = 2;
                else if (randKey === 'mr') mutValue = 0.05; // REDUCED: MP/t mutation amount
                else if (randKey === 'cr') mutValue = 0.0002; // REDUCED: crit rate mutation amount
                else if (randKey === 'cd') mutValue = 0.001; // REDUCED: crit dmg mutation amount

                partner.stats[randKey] += mutValue;
                if (!partner.bonusStats) partner.bonusStats = { maxHp: 0, atk: 0, matk: 0, def: 0, res: 0, spd: 0, mr: 0, cr: 0, cd: 0 };
                partner.bonusStats[randKey] += mutValue;
            }

            if (leveledUp > 0) {
                Utils.log(`${partner.name} broke through +${leveledUp} Level(s)! (Gained a mutation bonus stat)`, 'text-indigo-400');
            } else {
                Utils.log(`${partner.name} absorbed energy crystals: +${expGained} EXP!`, 'text-gray-400');
            }
        } else {
            UI.showDialogAlert("Insufficient Souls", "Not enough Soul Stones for breakthrough!");
        }
        UI.updatePartnersTab();
    }
};

