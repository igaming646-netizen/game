const Game = {
    init() {
        const activeAccount = localStorage.getItem('ec_active_account');
        if (activeAccount === 'admin' || activeAccount === 'guest') {
            this.loadAccount(activeAccount);
            this.checkDailyReset();
            PlayerObj.recalculateStats();
            UI.init();
            Combat.start();
            document.getElementById('login-overlay').classList.add('hidden');
        } else {
            UI.init();
        }
        setInterval(() => this.save(), 20000);
    },
    // --- Simple local account registry (username -> password) ---
    // Stored separately from gameplay saves. 'admin' is reserved and
    // never goes through this registry — it's a fixed demo account.
    getAccounts() {
        try { return JSON.parse(localStorage.getItem('ec_accounts') || '{}'); }
        catch (e) { return {}; }
    },
    saveAccounts(accounts) {
        localStorage.setItem('ec_accounts', JSON.stringify(accounts));
    },
    handleRegister() {
        const user = document.getElementById('register-username').value.trim().toLowerCase();
        const pass = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-password-confirm').value;

        if (!user || !pass) { UI.showDialogAlert("Error", "Please fill in both username and password!"); return; }
        if (!/^[a-z0-9_]{3,16}$/.test(user)) { UI.showDialogAlert("Error", "Username must be 3-16 characters: letters, numbers, underscore only!"); return; }
        if (user === 'admin') { UI.showDialogAlert("Error", "This username is reserved!"); return; }
        if (pass.length < 4) { UI.showDialogAlert("Error", "Password must be at least 4 characters!"); return; }
        if (pass !== confirm) { UI.showDialogAlert("Error", "Passwords do not match!"); return; }

        const accounts = this.getAccounts();
        if (accounts[user]) { UI.showDialogAlert("Error", "This username is already taken!"); return; }

        accounts[user] = pass;
        this.saveAccounts(accounts);

        this.loadAccount(user);
        this.checkDailyReset();
        localStorage.setItem('ec_active_account', user);
        document.getElementById('login-overlay').classList.add('hidden');
        Utils.log(`New Soul registered and connected: [${user.toUpperCase()}]!`, 'text-emerald-400 font-bold');
        PlayerObj.recalculateStats(); UI.init(); Combat.start(); this.save();
    },
    handleLogin() {
        const user = document.getElementById('login-username').value.trim().toLowerCase();
        const pass = document.getElementById('login-password').value.trim();

        let valid = false;
        if (user === 'admin') {
            valid = (pass === 'admin123');
        } else {
            const accounts = this.getAccounts();
            valid = !!user && accounts[user] === pass;
        }

        if (valid) {
            this.loadAccount(user);
            this.checkDailyReset();
            localStorage.setItem('ec_active_account', user);
            document.getElementById('login-overlay').classList.add('hidden');
            Utils.log(`Connected successfully as [${user.toUpperCase()}]!`, 'text-indigo-400 font-bold');
            PlayerObj.recalculateStats(); UI.init(); Combat.start(); this.save();
        } else UI.showDialogAlert("Error", "Incorrect username or password!");
    },
    // Loads the named account's isolated save if one exists; otherwise
    // wipes State back to a clean slate and provisions fresh starter data
    // for that account. Admin and Guest NEVER share progress.
    loadAccount(user) {
        resetState();
        const saved = localStorage.getItem(`ec_save_${user}`);
        if (saved) {
            let d = JSON.parse(saved);
            State.player = {...State.player, ...d.player};
            State.inventory = d.inventory || [];
            State.equipment = d.equipment || State.equipment;
            State.materials = {...State.materials, ...d.materials};
            State.pets = d.pets || [];
            State.companions = d.companions || [];
            State.activePetId = d.activePetId || null;
            State.activeCompanionId = d.activeCompanionId || null;
            State.selectedZoneId = d.selectedZoneId || 1;
            State.towerFloor = d.towerFloor || 1;
            State.player.role = user;
            return;
        }
        // Brand new account — provision starting resources.
        State.player.role = user;
        if (user === 'admin') {
            State.player.gold = 1000000; State.player.gems = 10000; State.player.level = 50;
            State.player.statPoints = 250; State.player.ep = 10;
            SLOTS.forEach(slot => {
                let superItem = {
                    id: Utils.generateId(), name: Inventory.generateFantasyName(slot, 'ur') + ' +5', slot: slot, type: 'equip',
                    rarity: 'ur', level: 50, enhanceLevel: 5, stats: { atk: 120, matk: 120, maxHp: 800, def: 45, spd: 30, res: 45, mr: 1, cr: 0.05, cd: 0.2 }, value: 5000
                };
                State.equipment[slot] = superItem;
            });
            State.player.unlockedSkills = [SKILL_DB.fire.basic, SKILL_DB.fire.intermediate];
        } else {
            State.player.gold = 10000; State.player.gems = 0; State.player.level = 1;
            State.player.statPoints = 0; State.player.ep = 0;
            this.setupStarterItems();
        }
    },
    setupStarterItems() {
        if (!State.player.unlockedSkills || State.player.unlockedSkills.length === 0) {
            State.player.unlockedSkills = [SKILL_DB.fire.basic];
        }
        let isEquipped = Object.values(State.equipment).some(e => e !== null);
        if (!isEquipped && State.inventory.length === 0) {
            SLOTS.forEach(slot => {
                let starterItem = {
                    id: Utils.generateId(), name: `Starter ${slot.toUpperCase()} Common +0`, slot: slot, type: 'equip',
                    rarity: 'common', level: 1, enhanceLevel: 0, stats: {}, value: 50
                };
                if (slot === 'weapon') { starterItem.stats.atk = 8; starterItem.stats.matk = 8; }
                else if (slot === 'helmet' || slot === 'pants' || slot === 'armor') { starterItem.stats.maxHp = 40; starterItem.stats.def = 1; }
                else if (slot === 'ring') starterItem.stats.cr = 0.01;
                else if (slot === 'boots') starterItem.stats.spd = 5;
                else starterItem.stats.res = 2;
                State.equipment[slot] = starterItem;
            });
            Inventory.addItem({ id: Utils.generateId(), name: 'Dark Treasure Chest Lv.1', type: 'chest', level: 1, rarity: 'rare', value: 15, qty: 5 });
            if (State.player.role !== 'admin') { State.player.gems = 0; State.player.gold = 10000; }
            State.player.pityCount = 0;
            Utils.log("[SYSTEM] Starter Lv.1 gear set received, 5x Dark Chest Lv.1, and 10,000 Gold!", "text-yellow-400 font-bold");
        }
    },
    resetStats() {
        if (State.player.gold < 10000) { UI.showDialogAlert("Error", "Not enough Gold!"); return; }
        State.player.gold -= 10000;
        let totalSpent = Object.values(State.player.baseStats).reduce((a, b) => a + b, 0);
        State.player.statPoints += totalSpent;
        State.player.baseStats = { maxHp: 0, atk: 0, matk: 0, def: 0, res: 0, spd: 0, mr: 0, cr: 0, cd: 0 };
        PlayerObj.recalculateStats(); UI.updateTopBar();
        Utils.log("Stats reset successfully!");
    },
    resetEP() {
        if (State.player.gold < 10000) { UI.showDialogAlert("Error", "Not enough Gold!"); return; }
        State.player.gold -= 10000;
        let spentEP = 0;
        for (let el in State.player.elementPoints) {
            spentEP += State.player.elementPoints[el]; State.player.elementPoints[el] = 0;
        }
        State.player.ep += spentEP; State.player.unlockedSkills = [SKILL_DB.fire.basic];
        UI.updateSkills(); UI.updateTopBar();
        Utils.log("All EP points reset successfully!");
    },
    setZone(zoneId) {
        let zone = FANTASY_ZONES.find(z => z.id === zoneId); if (!zone) return;
        State.selectedZoneId = zoneId; UI.renderZoneSelectors();
    },
    selectDungeonType(type) {
        State.selectedDungeonType = type;
        ['exp', 'gold', 'material', 'soul'].forEach(t => {
            let btn = document.getElementById(`btn-dg-${t}`);
            if (btn) btn.className = (t === type) ? "p-2.5 rounded-xl border border-indigo-500/50 bg-indigo-950/30 text-indigo-300 font-bold text-xs text-left" : "p-2.5 rounded-xl border border-gray-850 bg-gray-900/50 text-gray-400 font-bold text-xs text-left";
        });
    },

    confirmChallenge() {
        State.mode = 'dungeon';
        Combat.stop();
        Combat.start();
        Utils.log(`[EXPEDITION] Dungeon expedition launched!`);
    },

    sweepDungeon() {
        let selectVal = parseInt(document.getElementById('sweep-count-select').value);
        let runsToSweep = Math.min(State.player.dungeonAttempts, selectVal);
        if (runsToSweep <= 0) { UI.showDialogAlert("Error", "No dungeon attempts remaining today!"); return; }

        State.player.dungeonAttempts -= runsToSweep;
        let totalGold = 0; let totalExp = 0;
        let lootSummary = {};

        let zone = FANTASY_ZONES.find(z => z.id === State.selectedZoneId) || FANTASY_ZONES[0];
        let rMult = zone.rewardMult;
        let zoneLvl = zone.id;

        for (let run = 0; run < runsToSweep; run++) {
            let expMult = State.selectedDungeonType === 'exp' ? 5.0 : 1.0;
            let expGain = Math.floor(Utils.randomInt(20, 45) * State.player.level * rMult * expMult);
            totalExp += expGain;

            if (State.selectedDungeonType === 'gold') {
                totalGold += Math.floor(Utils.randomInt(200, 500) * rMult);
            } else if (State.selectedDungeonType === 'material') {
                let amt = Utils.randomInt(1, Math.max(1, zone.id));
                let randMat = Math.random();
                let matKey = 'raw_iron'; let matName = 'Raw Iron Fragment';
                if (randMat > 0.8) { matKey = 'refined_iron'; matName = 'Refined Iron'; }
                else if (randMat > 0.4) { matKey = 'fine_iron'; matName = 'Fine Iron'; }
                State.materials[matKey] += amt;
                lootSummary[matName] = (lootSummary[matName] || 0) + amt;
            } else if (State.selectedDungeonType === 'soul') {
                let amt = Utils.randomInt(1, Math.max(1, zone.id));
                let matKey = Math.random() < 0.5 ? 'pet_soul' : 'comp_soul';
                let matName = matKey === 'pet_soul' ? 'Beast Soul' : 'Knight Soul';
                State.materials[matKey] += amt;
                lootSummary[matName] = (lootSummary[matName] || 0) + amt;
            }

            for (let lvl = 1; lvl <= zoneLvl; lvl++) {
                let baseRate = 0.04;
                if (zoneLvl > lvl) baseRate += (zoneLvl - lvl) * 0.02;

                if (Math.random() < baseRate) {
                    let chestName = `Dark Treasure Chest Lv.${lvl}`;
                    Inventory.addItem({ id: Utils.generateId(), name: chestName, type: 'chest', level: lvl, rarity: 'rare', value: lvl * 15, qty: 1 });
                    lootSummary[chestName] = (lootSummary[chestName] || 0) + 1;
                }
                if (Math.random() < baseRate) {
                    let chestName = `Ancient Gear Chest Lv.${lvl}`;
                    Inventory.addItem({ id: Utils.generateId(), name: chestName, type: 'chest', level: lvl, rarity: 'sr', value: lvl * 20, qty: 1 });
                    lootSummary[chestName] = (lootSummary[chestName] || 0) + 1;
                }
            }
        }

        State.player.gold += totalGold; PlayerObj.gainExp(totalExp);
        UI.updateTopBar(); UI.updateInventory();

        let summaryHtml = `
            <div class="space-y-1 text-left text-xs text-gray-300 font-mono shadow-inner p-2 rounded bg-gray-955">
                <div class="flex justify-between"><span>Sweep runs:</span> <span class="text-white font-bold">${runsToSweep}</span></div>
                <div class="flex justify-between border-b border-gray-900 pb-1"><span>Zone:</span> <span class="text-cyan-400 font-bold">${zone.name}</span></div>
                <div class="flex justify-between pt-1"><span>EXP Earned:</span> <span class="text-cyan-400 font-bold">+${totalExp} EXP</span></div>
                <div class="flex justify-between"><span>Gold Harvested:</span> <span class="text-amber-400 font-bold">+${totalGold} Gold</span></div>
                <div class="border-t border-gray-900 my-2 pt-2 text-[10px] uppercase font-black text-indigo-400">Treasure Dropped:</div>`;
        if (Object.keys(lootSummary).length === 0) summaryHtml += `<div class="text-center py-1 text-gray-500 italic">No items dropped</div>`;
        else {
            Object.entries(lootSummary).forEach(([k, v]) => {
                summaryHtml += `<div class="flex justify-between"><span>${k}:</span> <span class="text-indigo-400 font-bold">+${v}</span></div>`;
            });
        }
        summaryHtml += `</div>`;

        const modal = document.getElementById('modal-result');
        const icon = document.getElementById('modal-result-icon');
        const title = document.getElementById('modal-result-title');
        const subtitle = document.getElementById('modal-result-subtitle');
        const rewardsContainer = document.getElementById('modal-result-rewards');
        const btnAction = document.getElementById('modal-btn-action');

        icon.className = "w-14 h-14 rounded-full flex items-center justify-center text-xl mx-auto mb-4 bg-cyan-950 text-cyan-400 border border-cyan-500/40 glow-active animate-pulse";
        icon.innerHTML = '<i class="fas fa-bolt"></i>';
        title.innerText = "SWEEP COMPLETE!"; title.className = "text-xl font-black mb-1 text-cyan-400";
        subtitle.innerText = "Quick dungeon clear done!";
        rewardsContainer.innerHTML = summaryHtml;
        btnAction.innerText = "Confirm"; btnAction.onclick = () => UI.closeResultModal();
        modal.classList.remove('hidden');

        Utils.log(`Quick sweep complete: ${runsToSweep} runs!`);
    },
    setMode(mode) {
        if (mode === 'dungeon') {
            this.checkDailyReset();
            if (State.player.dungeonAttempts <= 0) { UI.showDialogAlert("Error", "Daily dungeon attempts exhausted!"); return; }
        }
        if (mode === 'tower' && State.player.level < 30) {
            UI.showDialogAlert("Locked", "Babel Tower requires minimum Level 30!"); return;
        }
        State.mode = mode;
        const zoneContainer = document.getElementById('dungeon-hub-container');
        if (mode === 'dungeon') zoneContainer.classList.remove('hidden');
        else zoneContainer.classList.add('hidden');

        ['farm', 'dungeon', 'tower'].forEach(m => {
            const btn = document.getElementById(`btn-mode-${m}`);
            if (btn) {
                btn.className = (m === mode) ? "btn-action flex-1 py-3 px-4 font-bold text-xs uppercase bg-indigo-950/60 border border-indigo-700 text-indigo-300 rounded-xl transition-all shadow-md" : "btn-action flex-1 py-3 px-4 font-bold text-xs uppercase bg-gray-900/50 border border-gray-800 text-gray-400 rounded-xl transition-all";
            }
        });
        document.getElementById('ui-current-mode').innerText = mode === 'farm' ? 'AUTO FARM' : mode === 'dungeon' ? 'DUNGEON EXPEDITION' : 'AUTO TOWER';
        
        if (mode !== 'dungeon') {
            Combat.stop(); Combat.start();
        } else {
            Combat.stop();
            document.getElementById('battle-scene').innerHTML = `<div class="text-center text-gray-500 py-12 text-xs font-mono uppercase">Configure settings and press BEGIN EXPEDITION above...</div>`;
        }
    },
    checkDailyReset() {
        const today = new Date().toDateString();
        if (State.player.lastDungeonReset !== today) {
            State.player.dungeonAttempts = 30; State.player.lastDungeonReset = today;
            UI.updateTopBar();
        }
    },
    unlockSkill(el, tier) {
        let skill = SKILL_DB[el][tier];
        let currentEP = State.player.elementPoints[el] || 0;
        if(currentEP >= skill.epReq) {
            State.player.unlockedSkills.push(skill); UI.updateSkills();
            Utils.log(`Arcane art absorbed: ${skill.name}!`, 'text-indigo-400 font-bold');
        } else {
            let pts = State.player.ep;
            if (pts <= 0) { UI.showDialogAlert("Insufficient EP", "Skill upgrades require EP points earned every 5 levels!"); return; }
            let amt = State.epBatch === 'max' ? pts : State.epBatch;
            amt = Math.min(pts, amt);

            State.player.ep -= amt;
            State.player.elementPoints[el] = (State.player.elementPoints[el] || 0) + amt;
            Utils.log(`Invested ${amt} EP into ${ELEMENTS[el].name} element!`, 'text-amber-400');
            UI.updateSkills();
            
            if (State.player.elementPoints[el] >= skill.epReq && !State.player.unlockedSkills.some(s => s.id === skill.id)) {
                State.player.unlockedSkills.push(skill);
                Utils.log(`New arcane art unlocked: ${skill.name}!`, 'text-indigo-400 font-bold');
            }
        }
    },
    save() {
        // Only persist if a real account session is active — never write
        // pre-login default State, and never let accounts cross-save.
        if (!State.player.role) return;
        let s = JSON.parse(JSON.stringify(State)); delete s.combatState;
        localStorage.setItem(`ec_save_${State.player.role}`, JSON.stringify(s));
    }
};

window.onload = function () { Game.init(); }