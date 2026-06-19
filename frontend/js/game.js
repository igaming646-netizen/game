const Game = {
    // Change this if your backend runs somewhere other than localhost:3001
    // ⚠️ CHANGE THIS before deploying! 'localhost' only works on YOUR
    // own machine, while testing locally with the backend also running
    // locally. Once you deploy the backend (Railway/Render/Fly.io/VPS),
    // replace this with that server's public URL, e.g.:
    //   API_BASE: 'https://your-app.up.railway.app/api',
    API_BASE: 'http://localhost:3001/api',

    async init() {
        const token = localStorage.getItem('ec_token');
        if (token) {
            try {
                const data = await this.apiFetch('/player/me', { method: 'GET' });
                this.applyState(data.state);
                this.checkDailyReset();
                PlayerObj.recalculateStats();
                UI.init();
                Combat.start();
                document.getElementById('login-overlay').classList.add('hidden');
            } catch (e) {
                // token invalid/expired — fall back to login screen
                localStorage.removeItem('ec_token');
                UI.init();
            }
        } else {
            UI.init();
        }
        setInterval(() => this.save(), 20000);
    },

    // Thin wrapper around fetch(): attaches JWT, throws on non-2xx so
    // callers can use try/catch instead of checking res.ok everywhere.
    async apiFetch(path, options = {}) {
        const token = localStorage.getItem('ec_token');
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let res;
        try {
            res = await fetch(this.API_BASE + path, { ...options, headers });
        } catch (e) {
            // fetch() itself throws (server down, wrong URL, CORS, offline...)
            throw new Error('Cannot reach the game server. Make sure the backend is running (see README) and try again.');
        }
        let data = {};
        try { data = await res.json(); } catch (e) { /* no body */ }
        if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
        return data;
    },

    // Toggles a submit button between its normal label and a disabled
    // "Connecting..." state, so double-clicks can't fire duplicate requests
    // and the player gets feedback while waiting on the server.
    setButtonLoading(btnId, loading, label) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        if (loading) {
            btn.dataset.originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.classList.add('opacity-60', 'cursor-not-allowed');
            btn.innerHTML = `<i class="fas fa-circle-notch fa-spin mr-1.5"></i> ${label}`;
        } else {
            btn.disabled = false;
            btn.classList.remove('opacity-60', 'cursor-not-allowed');
            if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
        }
    },

    // Copies a state object returned by the server into the live State
    // object in place (keeps every other module's reference valid).
    applyState(d) {
        resetState();
        State.player = { ...State.player, ...d.player };
        State.inventory = d.inventory || [];
        State.equipment = d.equipment || State.equipment;
        State.materials = { ...State.materials, ...d.materials };
        State.pets = d.pets || [];
        State.companions = d.companions || [];
        State.activePetId = d.activePetId || null;
        State.activeCompanionId = d.activeCompanionId || null;
        State.selectedZoneId = d.selectedZoneId || 1;
        State.towerFloor = d.towerFloor || 1;
        State.claimedQuests = d.claimedQuests || [];
    },

    async handleRegister() {
        const username = document.getElementById('register-username').value.trim().toLowerCase();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-password-confirm').value;

        if (!username || !password || !confirmPassword) { UI.showDialogAlert("Error", "Please fill in all fields!"); return; }
        if (password !== confirmPassword) { UI.showDialogAlert("Error", "Passwords do not match!"); return; }

        this.setButtonLoading('btn-register-submit', true, 'Connecting...');
        try {
            const data = await this.apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, password, confirmPassword })
            });
            localStorage.setItem('ec_token', data.token);
            this.applyState(data.state);
            this.checkDailyReset();
            document.getElementById('login-overlay').classList.add('hidden');
            Utils.log(`New Soul registered and connected: [${username.toUpperCase()}]!`, 'text-emerald-400 font-bold');
            PlayerObj.recalculateStats(); UI.init(); Combat.start(); this.save();
        } catch (e) {
            UI.showDialogAlert("Registration Failed", e.message);
        } finally {
            this.setButtonLoading('btn-register-submit', false);
        }
    },

    async handleLogin() {
        const username = document.getElementById('login-username').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value.trim();

        if (!username || !password) { UI.showDialogAlert("Error", "Please enter both username and password!"); return; }

        this.setButtonLoading('btn-login-submit', true, 'Connecting...');
        try {
            const data = await this.apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            localStorage.setItem('ec_token', data.token);
            this.applyState(data.state);
            this.checkDailyReset();
            document.getElementById('login-overlay').classList.add('hidden');
            Utils.log(`Connected successfully as [${username.toUpperCase()}]!`, 'text-indigo-400 font-bold');
            PlayerObj.recalculateStats(); UI.init(); Combat.start(); this.save();
        } catch (e) {
            UI.showDialogAlert("Login Failed", e.message || "Incorrect username or password!");
        } finally {
            this.setButtonLoading('btn-login-submit', false);
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
        // pre-login default State.
        if (!State.player.role || !localStorage.getItem('ec_token')) return;
        let s = JSON.parse(JSON.stringify(State)); delete s.combatState;
        this.apiFetch('/player/me', { method: 'PUT', body: JSON.stringify({ state: s }) })
            .catch(e => console.warn('Save failed:', e.message));
    }
};

window.onload = function () { Game.init(); }

