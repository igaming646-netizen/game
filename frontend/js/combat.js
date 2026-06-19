const Combat = {
    start() {
        if(State.combatState.active) return;
        if (State.mode === 'dungeon') {
            Game.checkDailyReset();
            if (State.player.dungeonAttempts <= 0) {
                Utils.log("[SYSTEM] Dungeon attempts exhausted! Auto-switching to Auto Farm.", "text-amber-400");
                Game.setMode('farm'); return;
            }
        }
        if (State.mode === 'tower') {
            if (State.player.level < 30) {
                UI.showDialogAlert("Locked", "Babel Tower requires minimum Level 30!");
                Game.setMode('farm'); return;
            }
        }

        State.combatState.active = true;
        State.combatState.turn = null;

        PlayerObj.entity.stats.hp = PlayerObj.entity.stats.maxHp;
        PlayerObj.entity.alive = true;
        PlayerObj.entity.stats.mana = 0;

        State.combatState.allies = [PlayerObj.entity];

        if (State.mode !== 'dungeon') {
            if (State.activePetId) {
                let pData = State.pets.find(p => p.id === State.activePetId);
                if (pData) {
                    let petEntity = new Entity({ name: pData.name, isPet: true, element: pData.element });
                    petEntity.stats = {
                        maxHp: pData.stats.maxHp, hp: pData.stats.maxHp,
                        atk: pData.stats.atk, matk: pData.stats.matk,
                        def: pData.stats.def, res: pData.stats.res,
                        spd: pData.stats.spd, cr: pData.stats.cr, cd: pData.stats.cd,
                        mana: 0, maxMana: 100, mr: pData.stats.mr
                    };
                    State.combatState.allies.push(petEntity);
                }
            }
            if (State.activeCompanionId) {
                let cData = State.companions.find(c => c.id === State.activeCompanionId);
                if (cData) {
                    let compEntity = new Entity({ name: cData.name, isCompanion: true, element: cData.element });
                    compEntity.stats = {
                        maxHp: cData.stats.maxHp, hp: cData.stats.maxHp,
                        atk: cData.stats.atk, matk: cData.stats.matk,
                        def: cData.stats.def, res: cData.stats.res,
                        spd: cData.stats.spd, cr: cData.stats.cr, cd: cData.stats.cd,
                        mana: 0, maxMana: 100, mr: cData.stats.mr
                    };
                    State.combatState.allies.push(compEntity);
                }
            }
        }

        State.combatState.enemies = this.generateEnemies();

        State.combatState.allies.forEach(e => e.actionGauge = 0);
        State.combatState.enemies.forEach(e => { e.actionGauge = 0; e.stats.mana = 0; });

        UI.renderCombatField();
        this.runTick();
    },
    stop() { State.combatState.active = false; clearTimeout(State.combatState.tickInterval); },
    generateEnemies() {
        let count = State.mode === 'tower' ? Utils.randomInt(1, 3) : Utils.randomInt(1, 2);
        let enemies = [];
        let level = State.player.level;

        let zone = FANTASY_ZONES.find(z => z.id === State.selectedZoneId) || FANTASY_ZONES[0];
        let zoneMult = 1.0;
        let activeZoneId = zone.id;

        if (State.mode === 'dungeon') {
            level = zone.reqLevel;
            zoneMult = zone.mult * 1.5;
        } else if (State.mode === 'farm') {
            let autoIdx = Math.min(FANTASY_ZONES.length - 1, Math.floor((State.player.level - 1) / 15));
            zoneMult = FANTASY_ZONES[autoIdx].mult;
            level = State.player.level;
            activeZoneId = FANTASY_ZONES[autoIdx].id; // farm mode auto-scales zone by player level
        } else if (State.mode === 'tower') {
            level = State.towerFloor * 2;
            zoneMult = Math.pow(1.22, State.towerFloor);
        }

        // Tower mode mixes every monster in the game; farm/dungeon use
        // that specific zone's themed roster.
        let enemyPool = State.mode === 'tower' ? ENEMY_TEMPLATES : (ZONE_ENEMY_POOLS[activeZoneId] || ENEMY_TEMPLATES);

        for(let i=0; i<count; i++) {
            let tpl = enemyPool[Utils.randomInt(0, enemyPool.length - 1)];
            let mult = (1 + (level * 0.16)) * zoneMult;

            let e = new Entity({ name: `Lv.${level} ${tpl.name}`, isPlayer: false, element: tpl.element });
            e.stats = {
                maxHp: Math.floor(tpl.baseStats.hp * mult), hp: Math.floor(tpl.baseStats.hp * mult),
                atk: Math.floor(tpl.baseStats.atk * mult * 0.9), matk: Math.floor(tpl.baseStats.matk * mult * 0.9),
                def: Math.floor(tpl.baseStats.def * mult * 0.5), res: Math.floor(tpl.baseStats.res * mult * 0.5),
                spd: tpl.baseStats.spd + Utils.randomInt(-5, 5), cr: 0.05, cd: 1.5, mana: 0, maxMana: 100, mr: 5
            };
            enemies.push(e);
        }
        return enemies;
    },
    runTick() {
        if(!State.combatState.active) return;
        if(State.combatState.turn !== null) return;

        let all = [...State.combatState.allies, ...State.combatState.enemies].filter(e => e.alive);
        let alliesAlive = State.combatState.allies.some(e => e.alive && !e.isPet);
        let enemiesAlive = State.combatState.enemies.some(e => e.alive);

        if(!alliesAlive || !enemiesAlive) { this.endCombat(alliesAlive); return; }

        let actor = null;
        for(let e of all) {
            e.actionGauge += (e.stats.spd / 100) * TICK_RATE;
            UI.updateEntityGauge(e);
            if(e.actionGauge >= MAX_GAUGE) {
                if(!actor || e.actionGauge > actor.actionGauge) actor = e;
            }
        }

        if(actor) {
            actor.actionGauge -= MAX_GAUGE;
            if (actor.stats.mr > 0) actor.gainMana(Math.floor(actor.stats.mr * 10));
            this.executeAutoTurn(actor);
            State.combatState.tickInterval = setTimeout(() => this.runTick(), GAME_SPEED);
        } else {
            State.combatState.tickInterval = setTimeout(() => this.runTick(), 50);
        }
        UI.renderTimeline();
    },

    getBestPhysicalTarget(enemies) {
        let alive = enemies.filter(e => e.alive);
        if (alive.length === 0) return null;
        let lowHp = alive.find(e => (e.stats.hp / e.stats.maxHp) < 0.25);
        if (lowHp) return lowHp;
        return alive.reduce((prev, curr) => (prev.stats.def < curr.stats.def) ? prev : curr);
    },
    getBestMagicalTarget(enemies) {
        let alive = enemies.filter(e => e.alive);
        if (alive.length === 0) return null;
        return alive.reduce((prev, curr) => (prev.stats.res < curr.stats.res) ? prev : curr);
    },
    getLowestHpAlly(allies) {
        let alive = allies.filter(a => a.alive);
        if (alive.length === 0) return null;
        return alive.reduce((prev, curr) => ((prev.stats.hp / prev.stats.maxHp) < (curr.stats.hp / curr.stats.maxHp)) ? prev : curr);
    },

    executeAutoTurn(actor) {
        if (actor.isPet) {
            let weakest = this.getLowestHpAlly(State.combatState.allies);
            if (weakest) {
                let petData = State.pets.find(p => p.name === actor.name.split(' (')[0] || p.name === actor.name);
                let mult = (petData && petData.skillMult) ? petData.skillMult : 1.5;
                let type = (petData && petData.skillType) ? petData.skillType : 'heal';
                
                if (type === 'heal') {
                    let healAmt = Math.floor(actor.stats.matk * mult);
                    weakest.heal(healAmt);
                    UI.spawnVfx(weakest.id, 'heal');
                    Utils.log(`[SUPPORT] ${actor.name} unleashes <span class="text-emerald-400 font-bold">${petData ? petData.skillName : 'Restore'}</span> healing ${healAmt} HP to ${weakest.name}!`, 'text-emerald-400');
                } else {
                    let target = this.getBestMagicalTarget(State.combatState.enemies);
                    if (target) {
                        let isCrit = Math.random() < actor.stats.cr;
                        let baseDmg = Math.max(1, (actor.stats.matk * mult - target.stats.res));
                        let finalDmg = isCrit ? Math.round(baseDmg * actor.stats.cd) : baseDmg;
                        target.takeDamage(finalDmg, isCrit);
                        UI.spawnVfx(target.id, 'fire');
                        Utils.log(`[SUPPORT] ${actor.name} roars <span class="text-red-400 font-bold">${petData ? petData.skillName : 'Strike'}</span> dealing ${finalDmg} HP to ${target.name}!`, 'text-red-400');
                    }
                }
            }
            return;
        }
        if (actor.isCompanion) {
            let target = this.getBestPhysicalTarget(State.combatState.enemies);
            if (target) {
                let compData = State.companions.find(c => c.name === actor.name || c.name === actor.name.split(' (')[0]);
                let mult = (compData && compData.skillMult) ? compData.skillMult : 1.5;
                let type = (compData && compData.skillType) ? compData.skillType : 'attack';

                if (Math.random() < 0.45) { 
                    let isCrit = Math.random() < actor.stats.cr;
                    let baseDmg = Math.max(1, Math.floor(actor.stats.atk * mult) - target.stats.def);
                    let finalDmg = isCrit ? Math.round(baseDmg * actor.stats.cd) : baseDmg;
                    target.takeDamage(finalDmg, isCrit);
                    UI.spawnVfx(target.id, 'slash');
                    if (type === 'lifesteal') {
                        actor.heal(Math.floor(finalDmg * 0.4));
                        UI.spawnVfx(actor.id, 'dark');
                    }
                    Utils.log(`[ALLY] ${actor.name} unleashes <span class="text-indigo-400 font-bold">${compData ? compData.skillName : 'Slash'}</span> dealing ${finalDmg} damage! ${isCrit ? '<span class="text-amber-400 font-bold">[CRITICAL]</span>' : ''}`);
                } else this.basicAttack(actor, target);
            }
            return;
        }
        if (!actor.isPlayer) {
            let target = this.getLowestHpAlly(State.combatState.allies.filter(a => !a.isPet));
            if (target) this.basicAttack(actor, target);
            return;
        }
        if (actor.isPlayer) {
            let availableSkills = State.player.unlockedSkills.filter(s => actor.stats.mana >= s.cost);
            if(availableSkills.length > 0) {
                let skill = availableSkills[availableSkills.length - 1]; 
                let target = (skill.type === 'heal') ? this.getLowestHpAlly(State.combatState.allies) : this.getBestMagicalTarget(State.combatState.enemies);
                if (target) {
                    this.castSkill(actor, target, skill);
                } else {
                    let fallbackEnemy = this.getBestPhysicalTarget(State.combatState.enemies);
                    if (fallbackEnemy) this.basicAttack(actor, fallbackEnemy);
                }
            } else {
                let target = this.getBestPhysicalTarget(State.combatState.enemies);
                if (target) this.basicAttack(actor, target);
            }
        }
    },
    basicAttack(attacker, defender) {
        UI.triggerVisualEffect(attacker.id, attacker.isPlayer || attacker.isCompanion ? 'animate-attack-left' : 'animate-attack-right');
        UI.triggerVisualEffect(defender.id, 'animate-hurt');

        let mod = this.getElementMod(attacker.element, defender.element);
        let isCrit = Math.random() < attacker.stats.cr;

        let baseDmg = Math.max(1, (attacker.stats.atk - defender.stats.def));
        let dmg = isCrit ? Math.round(baseDmg * attacker.stats.cd) : baseDmg;
        dmg = Math.max(1, Math.round(dmg * (1 + mod)));

        defender.takeDamage(dmg, isCrit);
        UI.spawnVfx(defender.id, 'slash');
        attacker.gainMana(15);

        Utils.log(`[ATTACK] ${attacker.name} → ${defender.name} dealt ${dmg} HP! ${isCrit ? '<span class="text-amber-400 font-extrabold">[CRITICAL]</span>' : ''}`);
    },
    getSkillMultiplier(element, tierKey) {
        const skill = SKILL_DB[element][tierKey];
        const ep = State.player.elementPoints[element] || 0;
        return parseFloat((skill.mult + (ep * 0.02)).toFixed(2));
    },
    castSkill(attacker, defender, skill) {
        UI.triggerVisualEffect(attacker.id, 'animate-attack-left');
        attacker.stats.mana -= skill.cost;
        UI.updateEntity(attacker);

        let el = 'fire';
        for (let eKey in SKILL_DB) {
            for (let tKey in SKILL_DB[eKey]) {
                if (SKILL_DB[eKey][tKey].id === skill.id) { el = eKey; break; }
            }
        }
        let mult = skill.mult;
        for (let tKey in SKILL_DB[el]) {
            if (SKILL_DB[el][tKey].id === skill.id) { mult = this.getSkillMultiplier(el, tKey); break; }
        }

        if(skill.type === 'heal') {
            let heal = Math.floor(attacker.stats.matk * mult); 
            defender.heal(heal);
            UI.spawnVfx(defender.id, 'light');
            Utils.log(`[ARCANE] ${attacker.name} casts ${skill.name} restoring ${heal} HP to ${defender.name}!`, 'text-emerald-400');
            return;
        }

        UI.triggerVisualEffect(defender.id, 'animate-hurt');
        let mod = this.getElementMod(attacker.element, defender.element);
        let isCrit = Math.random() < attacker.stats.cr;

        let baseDmg = Math.max(1, (attacker.stats.matk * mult - defender.stats.res));
        let dmg = isCrit ? Math.round(baseDmg * attacker.stats.cd) : baseDmg;
        dmg = Math.max(1, Math.round(dmg * (1 + mod)));

        defender.takeDamage(dmg, isCrit); UI.spawnVfx(defender.id, el);
        if (skill.type === 'lifesteal') { attacker.heal(Math.floor(dmg * 0.4)); UI.spawnVfx(attacker.id, 'dark'); }

        Utils.log(`[ARCANE] ${attacker.name} chants ${skill.name} striking ${defender.name} for ${dmg} damage! ${isCrit ? '<span class="text-amber-400 font-extrabold">[CRITICAL]</span>' : ''}`);
    },
    getElementMod(att, def) {
        if(ELEMENT_COUNTERS[att] === def) return 0.3;
        if(ELEMENT_COUNTERS[def] === att) return -0.3;
        if((att === 'light' && def === 'dark') || (att === 'dark' && def === 'light')) return 0.5;
        return 0;
    },

    handleLoot() {
        let zone = FANTASY_ZONES.find(z => z.id === State.selectedZoneId) || FANTASY_ZONES[0];
        let rMult = State.mode === 'dungeon' ? zone.rewardMult : 1.0;

        if (State.mode === 'farm') {
            let autoIdx = Math.min(FANTASY_ZONES.length - 1, Math.floor((State.player.level - 1) / 15));
            rMult = FANTASY_ZONES[autoIdx].rewardMult * 0.5;
        }

        let rewards = [];

        if (State.mode === 'farm') {
            let goldGain = Math.floor(Utils.randomInt(5, 15) * State.player.level * rMult);
            State.player.gold += goldGain;
            rewards.push({ type: 'gold', val: goldGain, text: `+${goldGain} Gold` });
        } else if (State.mode === 'dungeon') {
            if (State.selectedDungeonType === 'gold') {
                let goldGain = Math.floor(Utils.randomInt(200, 500) * rMult);
                State.player.gold += goldGain;
                rewards.push({ type: 'gold', val: goldGain, text: `+${goldGain} Dungeon Gold` });
            } else if (State.selectedDungeonType === 'material') {
                let amt = Utils.randomInt(1, Math.max(1, zone.id));
                let randMat = Math.random();
                let matKey = 'raw_iron';
                let matName = 'Raw Iron Fragment';
                if (randMat > 0.8) { matKey = 'refined_iron'; matName = 'Refined Iron'; }
                else if (randMat > 0.4) { matKey = 'fine_iron'; matName = 'Fine Iron'; }
                State.materials[matKey] += amt;
                rewards.push({ type: 'material', val: matKey, text: `+${amt}x ${matName}` });
            } else if (State.selectedDungeonType === 'soul') {
                let amt = Utils.randomInt(1, Math.max(1, zone.id));
                let matKey = Math.random() < 0.5 ? 'pet_soul' : 'comp_soul';
                let matName = matKey === 'pet_soul' ? 'Beast Soul' : 'Knight Soul';
                State.materials[matKey] += amt;
                rewards.push({ type: 'material', val: matKey, text: `+${amt}x ${matName}` });
            }

            let zoneLvl = zone.id;
            for (let lvl = 1; lvl <= zoneLvl; lvl++) {
                let baseRate = 0.04;
                if (zoneLvl > lvl) baseRate += (zoneLvl - lvl) * 0.02;

                if (Math.random() < baseRate) {
                    let chestObj = { id: Utils.generateId(), name: `Dark Treasure Chest Lv.${lvl}`, type: 'chest', level: lvl, rarity: 'rare', value: lvl * 15, qty: 1 };
                    Inventory.addItem(chestObj);
                    rewards.push({ type: 'item', val: 'chest', text: `[Dark Treasure Chest Lv.${lvl}]` });
                }
                if (Math.random() < baseRate) {
                    let chestObj = { id: Utils.generateId(), name: `Ancient Gear Chest Lv.${lvl}`, type: 'chest', level: lvl, rarity: 'sr', value: lvl * 20, qty: 1 };
                    Inventory.addItem(chestObj);
                    rewards.push({ type: 'item', val: 'equip_chest', text: `[Ancient Gear Chest Lv.${lvl}]` });
                }
            }
        }
        UI.updateTopBar();
        return rewards;
    },
    endCombat(victory) {
        this.stop();
        let zone = FANTASY_ZONES.find(z => z.id === State.selectedZoneId) || FANTASY_ZONES[0];
        let rMult = State.mode === 'dungeon' ? zone.rewardMult : 1.0;

        if (State.mode === 'farm') {
            let autoIdx = Math.min(FANTASY_ZONES.length - 1, Math.floor((State.player.level - 1) / 15));
            rMult = FANTASY_ZONES[autoIdx].rewardMult * 0.5;
        }

        if(victory) {
            let lootList = this.handleLoot();
            State.player.enemiesDefeated = (State.player.enemiesDefeated || 0) + State.combatState.enemies.length;
            UI.updateTopBar();
            let expMult = (State.mode === 'dungeon' && State.selectedDungeonType === 'exp') ? 5.0 : 1.0;
            
            // GIẢM: Kinh nghiệm tích lũy khi Auto Farm từ 20-45 xuống 3-8 để tạo độ thử thách
            let expMin = State.mode === 'farm' ? 3 : 20;
            let expMax = State.mode === 'farm' ? 8 : 45;
            let expGain = Math.floor(Utils.randomInt(expMin, expMax) * State.player.level * rMult * expMult);
            PlayerObj.gainExp(expGain);

            if(State.mode === 'tower') {
                let gemBonus = 10 + Math.floor(State.towerFloor / 5) * 5;
                State.player.gems += gemBonus;
                lootList.push({ type: 'gems', val: gemBonus, text: `+${gemBonus} Gems` });
                State.towerFloor++;
                UI.updateTopBar();
            }

            if (State.mode === 'dungeon') {
                State.player.dungeonAttempts = Math.max(0, State.player.dungeonAttempts - 1);
                UI.updateTopBar();
            }

            if (State.mode === 'farm' || State.mode === 'tower') {
                setTimeout(() => { if (!State.combatState.active) Combat.start(); }, 1500);
            } else UI.showResultModal(true, lootList, expGain);
        } else {
            setTimeout(() => { if (!State.combatState.active) Combat.start(); }, 3000);
        }
    }
};

