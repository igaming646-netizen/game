const UI = {
    init() {
        this.switchTab('combat');
        this.switchForgeTab('enhance');
        this.renderZoneSelectors();
        this.updateTopBar();
        this.updateCharacterScreen();
        this.updateInventory();
        this.updateSkills();
        this.updatePartnersTab();
        this.applyMenuState();
    },
    toggleMasterMenu() { State.menuOpen = !State.menuOpen; this.applyMenuState(); },
    applyMenuState() {
        const header = document.getElementById('game-header');
        const sidebar = document.getElementById('game-sidebar');
        const menuBtnText = document.getElementById('master-menu-text');
        if (State.menuOpen) {
            header.classList.remove('hidden'); sidebar.classList.remove('hidden');
            menuBtnText.innerText = "System (Visible)";
        } else {
            header.classList.add('hidden'); sidebar.classList.add('hidden');
            menuBtnText.innerText = "System (Hidden)";
        }
    },
    toggleLogSidebar() {
        const sidebar = document.getElementById('combat-log-sidebar');
        const btnText = document.getElementById('toggle-log-btn-text');
        if (sidebar.classList.contains('hidden')) {
            sidebar.classList.remove('hidden'); btnText.innerText = 'Hide Log';
        } else {
            sidebar.classList.add('hidden'); btnText.innerText = 'Show Log';
        }
    },
    switchTab(tabId) {
        ['combat', 'character', 'companions', 'inventory', 'skills', 'forge', 'quests'].forEach(id => {
            const el = document.getElementById(`tab-${id}`);
            const btn = document.getElementById(`nav-${id}`);
            if (el) el.classList.add('hidden');
            if (btn) btn.className = "nav-btn text-gray-500 text-left p-3 rounded-xl flex items-center gap-4 transition-all";
        });
        const target = document.getElementById(`tab-${tabId}`);
        const targetBtn = document.getElementById(`nav-${tabId}`);
        if (target) target.classList.remove('hidden');
        if (targetBtn) targetBtn.className = "nav-btn bg-indigo-950/30 text-indigo-400 text-left p-3 rounded-xl flex items-center gap-4 border border-indigo-900/30 transition-all shadow-md";
        
        if (tabId === 'companions') this.updatePartnersTab();
        if (tabId === 'inventory') this.updateInventory();
        if (tabId === 'character') this.updateCharacterScreen();
        if (tabId === 'quests') this.renderQuestTab();
        this.hideItemDetails();
    },
    switchForgeTab(fTab) {
        CraftingState.forgeTab = fTab;
        ['enhance', 'craft', 'alchemy'].forEach(t => {
            document.getElementById(`subtab-${t}`).classList.add('hidden');
            document.getElementById(`subtab-${t}-btn`).className = "py-2.5 px-4 border-b-2 border-transparent text-gray-500 font-bold text-xs hover:text-white";
        });
        document.getElementById(`subtab-${fTab}`).classList.remove('hidden');
        document.getElementById(`subtab-${fTab}-btn`).className = "py-2.5 px-4 border-b-2 border-indigo-500 font-bold text-xs text-white";
        this.updateForgeScreen();
    },
    updateTopBar() {
        const goldEl = document.getElementById('ui-gold');
        const gemsEl = document.getElementById('ui-gems');
        const towerEl = document.getElementById('ui-tower-floor');
        const dungeonEl = document.getElementById('ui-dungeon-attempts');

        if (goldEl) goldEl.innerText = Utils.formatNumber(State.player.gold);
        if (gemsEl) gemsEl.innerText = Utils.formatNumber(State.player.gems);
        if (towerEl) towerEl.innerText = State.towerFloor;
        if (dungeonEl) dungeonEl.innerText = State.player.dungeonAttempts;

        const questBadge = document.getElementById('quest-badge');
        if (questBadge) questBadge.classList.toggle('hidden', !Quests.hasClaimable());
    },
    renderQuestTab() {
        const container = document.getElementById('quest-list');
        if (!container) return;

        let html = QUEST_DB.map(q => {
            const progress = Math.min(Quests.getProgress(q), q.target);
            const pct = Math.floor((progress / q.target) * 100);
            const complete = Quests.isComplete(q);
            const claimed = Quests.isClaimed(q);

            let rewardText = [];
            if (q.reward.gold) rewardText.push(`<i class="fas fa-coins text-amber-400"></i> ${Utils.formatNumber(q.reward.gold)}`);
            if (q.reward.gems) rewardText.push(`<i class="fas fa-gem text-indigo-400"></i> ${Utils.formatNumber(q.reward.gems)}`);

            let actionHtml;
            if (claimed) {
                actionHtml = `<span class="text-[10px] text-gray-600 font-bold uppercase flex items-center gap-1"><i class="fas fa-circle-check"></i> Claimed</span>`;
            } else if (complete) {
                actionHtml = `<button type="button" onclick="Quests.claim('${q.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg shadow-md animate-pulse">Claim</button>`;
            } else {
                actionHtml = `<span class="text-[10px] text-gray-500 font-mono">${progress}/${q.target}</span>`;
            }

            return `
                <div class="p-3 bg-gray-955 border ${claimed ? 'border-gray-850 opacity-50' : complete ? 'border-emerald-600/60' : 'border-gray-850'} rounded-2xl flex items-center gap-3 shadow-sm">
                    <div class="w-10 h-10 rounded-xl bg-gray-900 border border-gray-850 flex items-center justify-center text-emerald-400 flex-shrink-0">
                        <i class="fas ${q.icon}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2">
                            <span class="font-bold text-white text-xs truncate">${q.title}</span>
                            <div class="flex items-center gap-2 text-[10px] text-gray-400 font-bold flex-shrink-0">${rewardText.join(' &nbsp; ')}</div>
                        </div>
                        <p class="text-[10px] text-gray-500 mb-1.5">${q.desc}</p>
                        <div class="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                            <div class="h-full ${complete ? 'bg-emerald-500' : 'bg-indigo-600'} transition-all" style="width:${pct}%"></div>
                        </div>
                    </div>
                    <div class="flex-shrink-0">${actionHtml}</div>
                </div>`;
        }).join('');

        container.innerHTML = html;
    },
    renderZoneSelectors() {
        let container = document.getElementById('zone-selector-grid');
        if (!container) return;
        let html = '';
        FANTASY_ZONES.forEach(z => {
            let isSelected = State.selectedZoneId === z.id;
            let actClass = isSelected ? 'border-indigo-500 bg-indigo-950/45 text-indigo-300 shadow-md' : 'border-gray-800 bg-gray-955/20 text-gray-400 hover:border-gray-700';
            html += `
                <button onclick="Game.setZone(${z.id})" class="p-2 rounded-xl border text-left transition-all ${actClass} flex flex-col justify-between h-14">
                    <div>
                        <span class="text-[7px] text-gray-500 uppercase">Lv.${z.reqLevel}+</span>
                        <div class="text-[10px] font-bold truncate">${z.name}</div>
                    </div>
                </button>
            `;
        });
        container.innerHTML = html;
        this.applyZoneAtmosphere(State.selectedZoneId);
    },

    showAuthView(view) {
        const loginView = document.getElementById('login-form-view');
        const registerView = document.getElementById('register-form-view');
        const subtitle = document.getElementById('auth-screen-subtitle');
        if (view === 'register') {
            loginView.classList.add('hidden');
            registerView.classList.remove('hidden');
            subtitle.innerText = 'Create New Soul';
        } else {
            registerView.classList.add('hidden');
            loginView.classList.remove('hidden');
            subtitle.innerText = 'System Login Screen';
        }
    },

    applyZoneAtmosphere(zoneId) {
        const arena = document.getElementById('arena-box');
        if (!arena) return;
        for (let i = 1; i <= 5; i++) arena.classList.remove(`zone-bg-${i}`);
        arena.classList.add(`zone-bg-${zoneId}`);
        this.spawnAmbientParticles(zoneId);
    },

    spawnAmbientParticles(zoneId) {
        const layer = document.getElementById('arena-particles');
        if (!layer) return;
        layer.innerHTML = '';
        // Per-zone particle palette: [color, size range, count, speed range]
        const PALETTES = {
            1: { colors: ['#bae6fd', '#e0f2fe'], size: [2, 4], count: 14, dur: [9, 16] },   // sea mist
            2: { colors: ['#d8b4fe', '#a855f7'], size: [2, 4], count: 16, dur: [8, 14] },   // arcane motes
            3: { colors: ['#fb923c', '#fde047'], size: [2, 5], count: 18, dur: [5, 9] },    // embers
            4: { colors: ['#fca5a5', '#9ca3af'], size: [1, 3], count: 12, dur: [10, 18] },  // ash
            5: { colors: ['#fef9c3', '#fde68a'], size: [2, 4], count: 16, dur: [7, 13] },   // holy sparks
        };
        const p = PALETTES[zoneId] || PALETTES[1];
        for (let i = 0; i < p.count; i++) {
            const dot = document.createElement('div');
            const size = p.size[0] + Math.random() * (p.size[1] - p.size[0]);
            const dur = p.dur[0] + Math.random() * (p.dur[1] - p.dur[0]);
            const left = Math.random() * 100;
            const delay = Math.random() * dur;
            const color = p.colors[Math.floor(Math.random() * p.colors.length)];
            dot.className = 'ambient-particle';
            dot.style.cssText = `left:${left}%; width:${size}px; height:${size}px; background:${color};
                box-shadow:0 0 ${size * 2}px ${color}; animation-duration:${dur}s; animation-delay:-${delay}s;
                --drift:${(Math.random() * 40 - 20).toFixed(0)}px;`;
            layer.appendChild(dot);
        }
    },
    setAllocationBatch(val) {
        State.allocationBatch = val;
        ['1', '10', '100', 'max'].forEach(v => {
            let b = document.getElementById(`alloc-batch-${v}`);
            if (b) b.className = (v === val.toString()) ? "px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white" : "px-2 py-0.5 rounded text-[9px] font-bold text-gray-400 hover:text-white";
        });
    },
    setEPBatch(val) {
        State.epBatch = val;
        ['1', '5', 'max'].forEach(v => {
            let b = document.getElementById(`ep-batch-${v}`);
            if (b) b.className = (v === val.toString()) ? "px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white" : "px-2 py-0.5 rounded text-[9px] font-bold text-gray-400 hover:text-white";
        });
    },

    updateCharacterScreen() {
        document.getElementById('char-level').innerText = State.player.level;
        document.getElementById('char-exp').innerText = State.player.exp;
        let maxExp = Utils.calculateExpReq(State.player.level);
        document.getElementById('char-exp-max').innerText = maxExp;
        document.getElementById('char-exp-bar').style.width = `${(State.player.exp / maxExp) * 100}%`;
        document.getElementById('char-stat-points').innerText = State.player.statPoints;

        const statAllocContainer = document.getElementById('stat-allocation-buttons');
        if (statAllocContainer) {
            const statsMeta = {
                maxHp: { name: 'HP (Vitality)', desc: '+15 HP', color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-900/50' },
                atk: { name: 'ATK (Physical)', desc: '+3 ATK', color: 'text-rose-400', bg: 'bg-rose-950/30 border-rose-900/50' },
                matk: { name: 'MATK (Magic)', desc: '+3 MATK', color: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-900/50' },
                def: { name: 'DEF (Armor)', desc: '+1.5 DEF', color: 'text-amber-500', bg: 'bg-amber-950/30 border-amber-900/50' },
                res: { name: 'RES (Magic Resist)', desc: '+1.5 RES', color: 'text-indigo-400', bg: 'bg-indigo-950/30 border-indigo-900/50' },
                spd: { name: 'SPD (Speed)', desc: '+0.8 SPD', color: 'text-purple-400', bg: 'bg-purple-950/30 border-purple-900/50' },
                mr: { name: 'MR (Mana Regen)', desc: '+0.15 MP/t', color: 'text-cyan-400', bg: 'bg-cyan-950/30 border-cyan-900/50' },
                cr: { name: 'CR (Crit Rate)', desc: '+0.05% CR', color: 'text-orange-400', bg: 'bg-orange-950/30 border-orange-900/50' },
                cd: { name: 'CD (Crit Damage)', desc: '+0.2% CD', color: 'text-pink-400', bg: 'bg-pink-950/30 border-pink-900/50' }
            };
            let allocHtml = '';
            for (let [key, meta] of Object.entries(statsMeta)) {
                let currentVal = State.player.baseStats[key] || 0;
                allocHtml += `
                    <button onclick="PlayerObj.addStat('${key}')" class="${meta.bg} hover:brightness-125 border p-2 text-[10px] rounded-xl flex flex-col items-center justify-between min-h-[50px] shadow-sm">
                        <span class="${meta.color} font-bold">${meta.name}</span>
                        <span class="text-gray-400 text-[8px] font-mono">${meta.desc} (+${currentVal})</span>
                    </button>
                `;
            }
            statAllocContainer.innerHTML = allocHtml;
        }
        
        let st = PlayerObj.entity.stats;
        let cp = Math.floor(st.maxHp*0.6 + st.atk*2.2 + st.matk*2.2 + st.def*1.5 + st.res*1.5 + st.spd + st.mr*10 + st.cr*500 + st.cd*100);
        document.getElementById('char-cp').innerText = cp;

        const map = {
            'Vitality (HP)': st.maxHp, 'Attack (ATK)': st.atk, 'Magic Attack (MATK)': st.matk,
            'Physical Armor (DEF)': st.def, 'Magic Resist (RES)': st.res, 'Speed (SPD)': st.spd,
            'Mana Regen (MP/turn)': st.mr,
            'Crit Rate (CR)': `${(st.cr * 100).toFixed(2)}%`,
            'Crit Damage (CD)': `${(st.cd * 100).toFixed(1)}%`
        };
        let html = '';
        for(let [k, v] of Object.entries(map)) {
            html += `<div class="flex justify-between border-b border-gray-900/40 pb-1"><span class="text-gray-400 text-[10px]">${k}</span> <span class="font-bold text-gray-200 text-xs">${v}</span></div>`;
        }
        document.getElementById('char-stats-grid').innerHTML = html;

        let equipHtml = '';
        for(let slot of SLOTS) {
            let i = State.equipment[slot];
            if(i) {
                let glow = i.rarity === 'legendary' ? 'shadow-[0_0_12px_rgba(239,68,68,0.35)]' : '';
                equipHtml += `
                    <div class="h-16 p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${RARITIES[i.rarity].border} ${RARITIES[i.rarity].bg} ${glow} hover:scale-105 shadow-md" onclick="UI.showEquippedItemDetails('${slot}')">
                        <div class="flex justify-between items-center text-[7px] uppercase font-black">
                            <span class="text-gray-500">${slot}</span>
                            <span class="${RARITIES[i.rarity].color}">${i.rarity.toUpperCase()}</span>
                        </div>
                        <span class="text-[10px] font-bold ${RARITIES[i.rarity].color} truncate w-full">${i.name}</span>
                    </div>`;
            } else {
                equipHtml += `
                    <div class="h-16 p-2 rounded-xl border border-dashed border-gray-850 bg-gray-955/20 text-gray-600 flex flex-col items-center justify-center opacity-80 cursor-pointer hover:border-indigo-500/50 hover:text-indigo-400 transition-all shadow-inner" onclick="UI.showEmptySlotOptions('${slot}')">
                        <i class="fas fa-plus text-[10px] mb-0.5 animate-pulse"></i><span class="text-[8px] uppercase tracking-widest font-bold">${slot}</span>
                    </div>`;
            }
        }
        document.getElementById('equipment-slots').innerHTML = equipHtml;
    },

    showEmptySlotOptions(slot) {
        const content = document.getElementById('item-details-content');
        const actions = document.getElementById('item-details-actions');
        if(!content || !actions) return;

        let matchingItems = [];
        State.inventory.forEach((item, index) => {
            if(item.type === 'equip' && item.slot === slot) {
                matchingItems.push({ item, index });
            }
        });

        if(matchingItems.length === 0) {
            content.innerHTML = `
                <h4 class="font-black text-xs text-rose-400 mb-1">No compatible gear found in inventory</h4>
                <p class="text-[10px] text-gray-500">You don't currently own any spare <span class="text-white uppercase font-bold">${slot}</span>.</p>
            `;
            actions.innerHTML = `
                <button onclick="UI.switchTab('forge')" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3 rounded-xl text-xs transition-all w-full shadow-md">Go to Forge to Craft</button>
            `;
        } else {
            content.innerHTML = `
                <h4 class="font-black text-xs text-indigo-400 mb-1">Equip gear to slot ${slot.toUpperCase()}</h4>
                <p class="text-[9px] text-gray-500 mb-2">Select an available piece from your inventory to equip instantly:</p>
                <div class="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto pr-1 shadow-inner">
                    ${matchingItems.map(obj => {
                        let item = obj.item;
                        let idx = obj.index;
                        let statsDesc = Object.entries(item.stats).map(([k,v]) => `${k.toUpperCase()}+${v}`).join(', ');
                        return `
                            <div class="bg-gray-900 border border-gray-850 p-2 rounded-xl flex justify-between items-center text-xs shadow-sm">
                                <div class="truncate max-w-[200px]">
                                    <span class="${RARITIES[item.rarity].color} font-bold">${item.name}</span>
                                    <div class="text-[8px] text-gray-500 truncate">${statsDesc}</div>
                                </div>
                                <button onclick="Inventory.equip(${idx})" class="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded-lg transition-all flex-shrink-0 shadow-md">Equip</button>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            actions.innerHTML = `
                <button onclick="UI.hideItemDetails()" class="bg-gray-800 hover:bg-gray-750 text-gray-300 font-bold py-2 px-4 rounded-xl text-xs transition-all w-full shadow-md">Close</button>
            `;
        }
        document.getElementById('item-details').classList.remove('hidden');
    },

    updateInventory() {
        let equipCount = State.inventory.filter(i => i.type === 'equip').length;
        let chestsCount = State.inventory.filter(i => i.type === 'chest' || i.type === 'potion' || i.type === 'gold_bag').length;
        document.getElementById('inv-count').innerText = State.inventory.length;
        let html = '';

        if (State.inventorySubTab === 'equip') {
            State.inventory.forEach((item, index) => {
                if (item.type === 'equip') {
                    html += `
                        <div class="h-12 flex flex-col items-center justify-center rounded-xl border cursor-pointer transition-all ${RARITIES[item.rarity].border} ${RARITIES[item.rarity].bg} hover:scale-105 shadow-sm" 
                             onclick="UI.showItemDetails(${index})">
                            <span class="text-[8px] font-black ${RARITIES[item.rarity].color}">${item.slot.substring(0,3).toUpperCase()}</span>
                            <span class="text-[7px] text-gray-400 font-bold truncate max-w-[42px]">${item.name.split(' ')[0]}</span>
                        </div>`;
                }
            });
            if (equipCount === 0) html = `<div class="col-span-full py-8 text-center text-xs text-gray-500">Equipment vault is empty.</div>`;
        } else if (State.inventorySubTab === 'chests') {
            State.inventory.forEach((item, index) => {
                if (item.type === 'chest' || item.type === 'potion' || item.type === 'gold_bag') {
                    let chestColor = item.type === 'chest' ? 'text-indigo-400 border-indigo-900/60 bg-indigo-950/30' : item.type === 'potion' ? 'text-cyan-400 border-cyan-900/60 bg-cyan-950/30' : 'text-amber-400 border-amber-900/60 bg-amber-950/30';
                    let icon = item.type === 'chest' ? 'fa-box-open' : item.type === 'potion' ? 'fa-flask' : 'fa-sack-dollar';
                    let stackBadge = (item.qty && item.qty > 1) ? `<div class="item-stack-badge">x${item.qty}</div>` : '';
                    html += `
                        <div class="h-12 flex flex-col items-center justify-center rounded-xl border cursor-pointer transition-all ${chestColor} hover:scale-105 relative shadow-sm" 
                             onclick="UI.showItemDetails(${index})">
                            <i class="fas ${icon} text-sm"></i>
                            <span class="text-[7px] font-bold mt-0.5 truncate max-w-full px-1">${item.name.replace('EXP Potion ', '').replace('Dark Treasure Chest ', '').replace('Gold Bag ', '').replace('Ancient Gear Chest ', '')}</span>
                            ${stackBadge}
                        </div>`;
                }
            });
            if (chestsCount === 0) html = `<div class="col-span-full py-8 text-center text-xs text-gray-500">No chests or consumables in bag.</div>`;
        } else {
            let mats = [
                { name: 'Raw Iron Fragment', qty: State.materials.raw_iron, color: 'text-gray-400', desc: 'Crude forging iron' },
                { name: 'Fine Iron', qty: State.materials.fine_iron, color: 'text-emerald-400', desc: 'Revelation gear blank' },
                { name: 'Refined Iron', qty: State.materials.refined_iron, color: 'text-blue-400', desc: 'Supreme alchemy material' },
                { name: "Philosopher's Stone", qty: State.materials.philosopher_stone, color: 'text-rose-400', desc: 'Ultra-rare catalyst' }
            ];
            mats.forEach(m => {
                html += `
                    <div class="p-3 bg-gray-955 border border-gray-800 rounded-xl flex flex-col justify-between col-span-5 shadow-sm">
                        <span class="text-[10px] font-bold ${m.color}">${m.name}</span>
                        <div class="flex justify-between items-center mt-1 text-[9px]">
                            <span class="text-gray-500">${m.desc}</span>
                            <span class="font-mono font-bold text-white">${m.qty}</span>
                        </div>
                    </div>`;
            });
        }
        document.getElementById('inventory-grid').innerHTML = html;
    },

    showItemDetails(index) {
        const item = State.inventory[index];
        if (!item) return;

        const content = document.getElementById('item-details-content');
        const actions = document.getElementById('item-details-actions');
        
        if (item.type === 'equip') {
            let statsStr = Object.entries(item.stats).map(([k,v]) => `<span class="bg-gray-955 border border-gray-850 px-2 py-1 rounded text-emerald-400 text-[9px] font-mono shadow-inner">${k.toUpperCase()}: +${v}</span>`).join(' ');
            content.innerHTML = `
                <h4 class="font-black text-sm ${RARITIES[item.rarity].color} mb-0.5">${item.name}</h4>
                <p class="text-[9px] text-gray-500 mb-2">Requires: Lv. ${item.level} | Value: ${item.value} Gold</p>
                <div class="flex flex-wrap gap-1 mt-1">${statsStr}</div>
            `;
            actions.innerHTML = `
                <button onclick="Inventory.equip(${index})" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs shadow-md">Equip Now</button>
                <button onclick="Inventory.sell(${index})" class="bg-rose-950/60 border border-rose-900 text-rose-300 font-bold py-1.5 px-3 rounded-xl text-xs shadow-md">Discard</button>
            `;
        } else {
            let usageDesc = '';
            if (item.type === 'chest') {
                usageDesc = item.name.includes('Dark') 
                    ? `Open for a chance to receive randomly: EXP Potion, Gold Bag, Raw Iron, or Soul Stones!`
                    : `Releases random gear scaled to level ${(item.level * 15)}!`;
            } else if (item.type === 'potion') {
                usageDesc = `Unlock spiritual power, directly gain +${item.xpVal} EXP for your character!`;
            } else if (item.type === 'gold_bag') {
                usageDesc = `Release treasury funds, directly add +${item.goldVal} Gold to your vault!`;
            }

            content.innerHTML = `
                <h4 class="font-black text-sm text-white mb-0.5"><i class="fas fa-gift text-amber-500 mr-1.5"></i>${item.name} <span class="text-xs text-indigo-400 font-mono font-bold">(x${item.qty})</span></h4>
                <p class="text-[9px] text-gray-500 max-w-md">${usageDesc}</p>
            `;
            let bulkOptions = `
                <div class="flex gap-1 mb-1 justify-center shadow-inner p-1 rounded bg-gray-900">
                    <button onclick="Inventory.openChestBulk(${index}, 1)" class="bg-gray-800 text-[9px] font-bold px-2 py-1 border border-gray-700 rounded text-gray-300">x1</button>
                    <button onclick="Inventory.openChestBulk(${index}, 5)" class="bg-gray-800 text-[9px] font-bold px-2 py-1 border border-gray-700 rounded text-gray-300">x5</button>
                    <button onclick="Inventory.openChestBulk(${index}, 10)" class="bg-gray-800 text-[9px] font-bold px-2 py-1 border border-gray-700 rounded text-gray-300">x10</button>
                    <button onclick="Inventory.openChestBulk(${index}, ${item.qty})" class="bg-indigo-950/45 text-[9px] font-bold px-2 py-1 border border-indigo-900/80 text-indigo-300 rounded">MAX</button>
                </div>
            `;
            actions.innerHTML = `
                ${bulkOptions}
                <button onclick="Inventory.sell(${index})" class="bg-rose-950/60 border border-rose-900 text-rose-300 font-bold py-1 px-3 rounded text-[10px] shadow-md">Sell</button>
            `;
        }
        document.getElementById('item-details').classList.remove('hidden');
    },
    showEquippedItemDetails(slot) {
        const item = State.equipment[slot];
        if (!item) return;
        const content = document.getElementById('item-details-content');
        const actions = document.getElementById('item-details-actions');
        let statsStr = Object.entries(item.stats).map(([k,v]) => `<span class="bg-gray-955 border border-gray-850 px-2 py-1 rounded text-amber-400 text-[9px] font-mono shadow-inner">${k.toUpperCase()}: +${v}</span>`).join(' ');
        content.innerHTML = `
            <div class="text-[8px] bg-indigo-950 text-indigo-300 font-bold px-2 py-0.5 rounded uppercase mb-1 inline-block">Currently Equipped</div>
            <h4 class="font-black text-sm ${RARITIES[item.rarity].color} mb-0.5">${item.name}</h4>
            <p class="text-[9px] text-gray-500 mb-1 font-mono">Enhancement: +${item.enhanceLevel} | Slot: ${slot.toUpperCase()}</p>
            <div class="flex flex-wrap gap-1 mt-1">${statsStr}</div>
        `;
        actions.innerHTML = `
            <button onclick="Inventory.unequip('${slot}')" class="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all w-full shadow-md">Unequip Gear</button>
        `;
        document.getElementById('item-details').classList.remove('hidden');
    },
    hideItemDetails() { document.getElementById('item-details').classList.add('hidden'); },

    updateSkills() {
        document.getElementById('char-ep-field').innerText = State.player.ep;
        let html = '';
        for(let el in SKILL_DB) {
            let elData = ELEMENTS[el];
            html += `
                <div class="bg-gray-900 p-3 rounded-2xl border border-gray-850 shadow-md">
                    <h4 class="font-bold text-xs ${elData.color} border-b border-gray-850 pb-1 mb-2 flex items-center gap-1.5">
                        <div class="w-2.5 h-2.5 rounded-full ${elData.bg} border ${elData.border}"></div> ${elData.name} (EP Invested: ${State.player.elementPoints[el] || 0})
                    </h4>`;
            for(let tier in SKILL_DB[el]) {
                let skill = SKILL_DB[el][tier];
                let isUnlocked = State.player.unlockedSkills.find(s => s.id === skill.id);
                let dynamicMult = Combat.getSkillMultiplier(el, tier);
                html += `
                    <div class="flex justify-between items-center bg-gray-955 p-2 rounded-xl mb-1.5 border ${isUnlocked ? 'border-indigo-900/40' : 'border-gray-900'} shadow-sm">
                        <div>
                            <div class="text-[11px] font-bold text-gray-200">${skill.name} <span class="text-indigo-400 text-[8px] uppercase font-black">[${skill.tierName}]</span></div>
                            <div class="text-[8px] text-gray-500 font-mono mt-0.5">MP: ${skill.cost} | Multiplier x${dynamicMult} | Requires: ${skill.epReq} EP</div>
                        </div>
                        ${!isUnlocked ? 
                            `<button onclick="Game.unlockSkill('${el}', '${tier}')" class="bg-indigo-950 hover:bg-indigo-900 border border-indigo-900 text-indigo-300 text-[8px] font-bold px-2 py-1 rounded transition-all shadow-md">Unlock</button>` 
                            : '<i class="fas fa-check-circle text-emerald-400 text-xs"></i>'}
                    </div>`;
            }
            html += `</div>`;
        }
        document.getElementById('skill-trees-container').innerHTML = html;
    },

    updateForgeScreen() {
        let html = '';
        for(let slot of SLOTS) {
            let item = State.equipment[slot];
            if(item) {
                let isSel = CraftingState.targetSlot === slot;
                html += `
                    <div class="item-slot text-[9px] font-bold p-1.5 text-center border rounded-xl cursor-pointer truncate ${isSel ? 'border-amber-500 bg-amber-950/20' : 'border-gray-800 bg-gray-955/10'} ${RARITIES[item.rarity].color} shadow-sm" 
                          onclick="Crafting.selectEnhanceTarget('${slot}')">
                        ${item.name}
                    </div>`;
            }
        }
        document.getElementById('enhance-equip-list').innerHTML = html;

        let target = document.getElementById('enhance-target');
        let info = document.getElementById('enhance-info');
        
        if(CraftingState.targetSlot && State.equipment[CraftingState.targetSlot]) {
            let item = State.equipment[CraftingState.targetSlot];
            let cost = 120 * Math.pow(1.5, item.enhanceLevel);
            let chance = item.enhanceLevel >= 15 ? 25 : item.enhanceLevel >= 10 ? 50 : item.enhanceLevel >= 5 ? 80 : 100;
            target.innerHTML = `
                <div class="text-xs font-black ${RARITIES[item.rarity].color}">${item.name}</div>
                <div class="text-[8px] text-gray-500 uppercase font-bold">Forge enhancement adds +6% base stat per star</div>`;
            info.innerHTML = `Forge Cost: <span class="${State.player.gold >= cost ? 'text-amber-400' : 'text-rose-500'} font-bold">${Math.floor(cost)} Gold</span> | Success Rate: <span class="text-emerald-400 font-bold">${chance}%</span>`;
        } else {
            target.innerHTML = `<span class="text-gray-500 text-xs">Select gear from the tray above to place on the forge</span>`;
            info.innerHTML = '';
        }

        this.renderCraftSelector();
        document.getElementById('ui-alchemy-mats-raw').innerText = State.materials.raw_iron;
        document.getElementById('ui-alchemy-mats-fine').innerText = State.materials.fine_iron;
        document.getElementById('ui-alchemy-mats-refined').innerText = State.materials.refined_iron;
        
        document.getElementById('ui-forge-materials').innerHTML = `
            <div class="p-2 bg-gray-900 rounded-xl border border-gray-850 flex justify-between shadow-inner"><span>Raw Iron:</span> <span class="text-white font-bold">${State.materials.raw_iron}</span></div>
            <div class="p-2 bg-gray-900 rounded-xl border border-gray-850 flex justify-between shadow-inner"><span>Fine Iron:</span> <span class="text-emerald-400 font-bold">${State.materials.fine_iron}</span></div>
            <div class="p-2 bg-gray-900 rounded-xl border border-gray-850 flex justify-between shadow-inner"><span>Refined Iron:</span> <span class="text-blue-400 font-bold">${State.materials.refined_iron}</span></div>
            <div class="p-2 bg-gray-900 rounded-xl border border-gray-850 flex justify-between shadow-inner"><span>Philosopher's Stone:</span> <span class="text-rose-400 font-bold">${State.materials.philosopher_stone}</span></div>
        `;
    },
    renderCraftSelector() {
        let craftGrid = '';
        SLOTS.forEach(slot => {
            let isSel = CraftingState.craftSlot === slot;
            craftGrid += `
                <button onclick="Crafting.setCraftSlot('${slot}')" class="p-1.5 text-[9px] font-bold border rounded-xl transition-all shadow-sm ${isSel ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300' : 'border-gray-850 text-gray-500 hover:text-white hover:border-gray-700'}">
                    ${slot.toUpperCase()}
                </button>`;
        });
        document.getElementById('craft-slot-selector').innerHTML = craftGrid;
        document.getElementById('ui-current-craft-mats').innerText = `${State.materials.fine_iron} Fine Iron`;
    },

    updatePartnersTab() {
        document.getElementById('ui-pet-soul').innerText = State.materials.pet_soul;
        document.getElementById('ui-comp-soul').innerText = State.materials.comp_soul;
        document.getElementById('ui-pity-count').innerText = State.player.pityCount;
        document.getElementById('ui-pity-bar').style.width = `${(State.player.pityCount / 150) * 100}%`;

        const petPityBtn = document.getElementById('btn-pity-pet');
        const compPityBtn = document.getElementById('btn-pity-comp');
        if (State.player.pityCount >= 150) {
            petPityBtn.disabled = false; petPityBtn.className = "bg-emerald-600 border border-emerald-500 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg glow-active shadow-md";
            compPityBtn.disabled = false; compPityBtn.className = "bg-indigo-600 border border-indigo-500 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg glow-active shadow-md";
        } else {
            petPityBtn.disabled = true; petPityBtn.className = "bg-emerald-900/40 border border-emerald-700/50 text-emerald-300 text-[9px] font-bold px-3 py-1.5 rounded-lg opacity-50 cursor-not-allowed";
            compPityBtn.disabled = true; compPityBtn.className = "bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 text-[9px] font-bold px-3 py-1.5 rounded-lg opacity-50 cursor-not-allowed";
        }

        let pCont = document.getElementById('pets-list-container');
        if (State.pets.length === 0) pCont.innerHTML = `<div class="text-center text-xs text-gray-600 py-4">No Spirit Beasts yet.</div>`;
        else {
            pCont.innerHTML = State.pets.map(p => {
                let isAct = State.activePetId === p.id;
                let tMeta = SUMMON_TIERS[p.tier] || SUMMON_TIERS.C;
                
                let st = p.stats;
                let statBrief = `HP:${st.maxHp} | ATK:${st.atk} | MATK:${st.matk} | DEF:${st.def} | RES:${st.res} | SPD:${st.spd} | CR:${(st.cr*100).toFixed(2)}% | CD:${(st.cd*100).toFixed(1)}%`;
                
                let mutations = [];
                for (let k in p.bonusStats) {
                    if (p.bonusStats[k] > 0) mutations.push(`+${p.bonusStats[k]} ${k.toUpperCase()}`);
                }
                let mutStr = mutations.length > 0 ? `<span class="text-emerald-400 font-bold ml-1">[Soul Bonus: ${mutations.join(', ')}]</span>` : '';

                let curExp = p.exp || 0;
                let reqExp = p.level * 1000;
                let expPct = (curExp / reqExp) * 100;

                return `
                    <div class="p-2.5 bg-gray-955 border ${isAct ? 'border-emerald-500 animate-[pulse_2s_infinite]' : 'border-gray-800'} rounded-xl flex flex-col gap-2 text-xs shadow-sm">
                        <div class="flex justify-between items-center">
                            <div class="w-12 h-12 flex-shrink-0 mr-2 flex items-center justify-center bg-gray-900/60 rounded-lg border border-gray-850 overflow-hidden">
                                <div class="scale-[0.55]">${Sprites.get(p)}</div>
                            </div>
                            <div class="flex-1 min-w-0 pr-2">
                                <div class="font-bold text-white flex items-center gap-1.5 truncate">
                                    <span>${p.name}</span>
                                    <span class="${tMeta.color} font-black text-[9px]">(${p.tier})</span>
                                    <span class="text-emerald-400 font-bold font-mono">Lv.${p.level}</span>
                                </div>
                <div class="text-[9px] text-amber-400 font-black truncate mt-0.5">Skill: ${p.skillName}</div>
                                <div class="text-[8px] text-gray-500 font-mono mt-0.5 leading-tight truncate" title="${statBrief}">${statBrief}</div>
                                <div class="text-[8px] font-bold leading-tight mt-0.5 truncate">${mutStr}</div>
                            </div>
                            <div class="flex flex-col gap-1 text-[9px] flex-shrink-0">
                                <div class="flex gap-1">
                                    <button onclick="Partners.setActive('pet', '${p.id}')" class="font-bold px-2 py-1 rounded-lg transition-all shadow-md ${isAct ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-600/50' : 'bg-gray-800 text-gray-300'}">${isAct ? 'Stand Down' : 'Deploy'}</button>
                                    <button onclick="Partners.releasePartner('pet', '${p.id}')" class="font-bold bg-rose-955 border border-rose-900 text-rose-300 px-2 py-1 rounded-lg shadow-md">Release</button>
                                </div>
                                <div class="flex gap-1 shadow-inner p-0.5 rounded bg-gray-900 justify-end">
                                    <button onclick="Partners.upgradePartner('pet', '${p.id}', 1)" class="font-bold bg-amber-600 hover:bg-amber-500 text-white px-1.5 py-0.5 rounded text-[8px] shadow">+1 Soul</button>
                                    <button onclick="Partners.upgradePartner('pet', '${p.id}', 10)" class="font-bold bg-amber-700 hover:bg-amber-600 text-white px-1.5 py-0.5 rounded text-[8px] shadow">+10 Soul</button>
                                    <button onclick="Partners.upgradePartner('pet', '${p.id}', 'max')" class="font-bold bg-amber-800 hover:bg-amber-700 text-white px-1.5 py-0.5 rounded text-[8px] shadow">Feed All</button>
                                </div>
                            </div>
                        </div>
                        <div class="w-full bg-gray-900 h-1 rounded overflow-hidden" title="EXP: ${curExp}/${reqExp} (Each soul gives 1000 EXP)">
                            <div class="bg-emerald-500 h-full transition-all duration-300" style="width: ${expPct}%"></div>
                        </div>
                    </div>`;
            }).join('');
        }

        let cCont = document.getElementById('comps-list-container');
        if (State.companions.length === 0) cCont.innerHTML = `<div class="text-center text-xs text-gray-600 py-4">No companions recruited yet.</div>`;
        else {
            cCont.innerHTML = State.companions.map(c => {
                let isAct = State.activeCompanionId === c.id;
                let tMeta = SUMMON_TIERS[c.tier] || SUMMON_TIERS.C;

                let st = c.stats;
                let statBrief = `HP:${st.maxHp} | ATK:${st.atk} | MATK:${st.matk} | DEF:${st.def} | RES:${st.res} | SPD:${st.spd} | CR:${(st.cr*100).toFixed(2)}% | CD:${(st.cd*100).toFixed(1)}%`;

                let mutations = [];
                for (let k in c.bonusStats) {
                    if (c.bonusStats[k] > 0) mutations.push(`+${c.bonusStats[k]} ${k.toUpperCase()}`);
                }
                let mutStr = mutations.length > 0 ? `<span class="text-indigo-400 font-bold ml-1">[Soul Bonus: ${mutations.join(', ')}]</span>` : '';

                let curExp = c.exp || 0;
                let reqExp = c.level * 1000;
                let expPct = (curExp / reqExp) * 100;

                return `
                    <div class="p-2.5 bg-gray-955 border ${isAct ? 'border-indigo-500 animate-[pulse_2s_infinite]' : 'border-gray-800'} rounded-xl flex flex-col gap-2 text-xs shadow-sm">
                        <div class="flex justify-between items-center">
                            <div class="w-12 h-12 flex-shrink-0 mr-2 flex items-center justify-center bg-gray-900/60 rounded-lg border border-gray-850 overflow-hidden">
                                <div class="scale-[0.55]">${Sprites.get(c)}</div>
                            </div>
                            <div class="flex-1 min-w-0 pr-2">
                                <div class="font-bold text-white flex items-center gap-1.5 truncate">
                                    <span>${c.name}</span>
                                    <span class="${tMeta.color} font-black text-[9px]">(${c.tier})</span>
                                    <span class="text-indigo-400 font-bold font-mono">Lv.${c.level}</span>
                                </div>
                                <div class="text-[9px] text-indigo-400 font-black truncate mt-0.5">Art: ${c.skillName}</div>
                                <div class="text-[8px] text-gray-500 font-mono mt-0.5 leading-tight truncate" title="${statBrief}">${statBrief}</div>
                                <div class="text-[8px] font-bold leading-tight mt-0.5 truncate">${mutStr}</div>
                            </div>
                            <div class="flex flex-col gap-1 text-[9px] flex-shrink-0">
                                <div class="flex gap-1">
                                    <button onclick="Partners.setActive('companion', '${c.id}')" class="font-bold px-2 py-1 rounded-lg transition-all shadow-md ${isAct ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-600/50' : 'bg-gray-800 text-gray-300'}">${isAct ? 'Stand Down' : 'Deploy'}</button>
                                    <button onclick="Partners.releasePartner('companion', '${c.id}')" class="font-bold bg-rose-955 border border-rose-900 text-rose-300 px-2 py-1 rounded-lg shadow-md">Dismiss</button>
                                </div>
                                <div class="flex gap-1 shadow-inner p-0.5 rounded bg-gray-900 justify-end">
                                    <button onclick="Partners.upgradePartner('companion', '${c.id}', 1)" class="font-bold bg-amber-600 hover:bg-amber-500 text-white px-1.5 py-0.5 rounded text-[8px] shadow">+1 Stone</button>
                                    <button onclick="Partners.upgradePartner('companion', '${c.id}', 10)" class="font-bold bg-amber-700 hover:bg-amber-600 text-white px-1.5 py-0.5 rounded text-[8px] shadow">+10 Stone</button>
                                    <button onclick="Partners.upgradePartner('companion', '${c.id}', 'max')" class="font-bold bg-amber-800 hover:bg-amber-700 text-white px-1.5 py-0.5 rounded text-[8px] shadow">Feed All</button>
                                </div>
                            </div>
                        </div>
                        <div class="w-full bg-gray-900 h-1 rounded overflow-hidden" title="EXP: ${curExp}/${curExp} (Each oath stone gives 1000 EXP)">
                            <div class="bg-indigo-500 h-full transition-all duration-300" style="width: ${expPct}%"></div>
                        </div>
                    </div>`;
            }).join('');
        }
    },

    renderCombatField() {
        const battleScene = document.getElementById('battle-scene');
        if (!battleScene) return;
        battleScene.innerHTML = `
            <div id="entity-pet" style="position:absolute; top:12%; left:4%; z-index:10; transform: scale(0.85);"></div>
            <div id="entity-companion" style="position:absolute; top:42%; left:12%; z-index:20; transform: scale(0.95);"></div>
            <div id="entity-player" style="position:absolute; top:68%; left:22%; z-index:30;"></div>
            <div id="enemy-container" class="w-full h-full absolute inset-0"></div>
        `;
        this.renderEntity(PlayerObj.entity, 'entity-player');
        State.combatState.allies.forEach(ally => {
            if (ally.isCompanion) this.renderEntity(ally, 'entity-companion');
            if (ally.isPet) this.renderEntity(ally, 'entity-pet');
        });
        let enemiesHtml = '';
        let enemyCount = State.combatState.enemies.length;
        State.combatState.enemies.forEach((e, i) => {
            let t = 22 + (i * 24); let r = 16 + ((i % 2) * 12);
            if(enemyCount === 1) { t = 42; r = 18; }
            enemiesHtml += `<div id="enemy-${i}" class="pointer-events-none animate-fade" style="position:absolute; top:${t}%; right:${r}%; z-index:${15 + i};"></div>`;
        });
        document.getElementById('enemy-container').innerHTML = enemiesHtml;
        State.combatState.enemies.forEach((e, i) => {
            this.renderEntity(e, `enemy-${i}`);
        });
        this.renderTimeline();
    },
    renderEntity(entity, containerId) {
        const container = document.getElementById(containerId);
        if(!container) return;
        let hpPct = Math.max(0, (entity.stats.hp / entity.stats.maxHp) * 100);
        let manaPct = Math.max(0, (entity.stats.mana / entity.stats.maxMana) * 100);
        let gaugePct = Math.min(100, (entity.actionGauge / MAX_GAUGE) * 100);
        let rot = (entity.isPlayer || entity.isCompanion || entity.isPet) ? 'transform: scaleX(1);' : 'transform: scaleX(-1);';
        let customSvgStr = `<div style="${rot}">${Sprites.get(entity)}</div>`;

        container.innerHTML = `
            <div id="card-${entity.id}" class="relative flex flex-col items-center justify-end w-28 transition-all duration-300 ${!entity.alive ? 'opacity-20 grayscale' : ''}">
                <div id="float-${entity.id}" class="absolute -top-12 left-1/2 transform -translate-x-1/2 font-black text-xl pointer-events-none z-50 whitespace-nowrap"></div>
                <div class="relative w-28 h-28 mb-1 flex items-end justify-center character-sprite-idle">
                    <div class="absolute bottom-1 w-14 h-4 rounded-[100%] blur-md opacity-40 ${ELEMENTS[entity.element].bg}"></div>
                    <div class="relative z-10 flex items-end justify-center">${customSvgStr}</div>
                </div>
                <div class="bg-gray-955/95 border border-gray-800 rounded px-1.5 py-0.5 mb-1 w-full text-center shadow-lg relative z-20">
                    <div class="text-[9px] font-bold text-gray-200 truncate" title="${entity.name}">${entity.name}</div>
                </div>
                <div class="w-full space-y-1 relative z-20 bg-gray-900/90 p-1.5 rounded-lg border border-gray-800 shadow-xl">
                    <div class="w-full bg-gray-955 h-1.5 rounded relative overflow-hidden" title="HP: ${entity.stats.hp}/${entity.stats.maxHp}">
                        <div id="hpbar-${entity.id}" class="stat-bar bg-rose-600 h-full" style="width: ${hpPct}%"></div>
                    </div>
                    <div class="w-full bg-gray-955 h-1 rounded relative overflow-hidden">
                        <div id="manabar-${entity.id}" class="stat-bar bg-blue-500 h-full" style="width: ${manaPct}%"></div>
                    </div>
                    <div class="w-full bg-gray-955 h-0.5 rounded overflow-hidden">
                        <div id="gauge-${entity.id}" class="gauge-bar bg-amber-400 h-full" style="width: ${gaugePct}%"></div>
                    </div>
                </div>
            </div>
        `;
    },
    updateEntity(entity, floatVal = null, floatType = null) {
        const hpBar = document.getElementById(`hpbar-${entity.id}`);
        const manaBar = document.getElementById(`manabar-${entity.id}`);
        if(hpBar) hpBar.style.width = `${(entity.stats.hp / entity.stats.maxHp) * 100}%`;
        if(manaBar) manaBar.style.width = `${(entity.stats.mana / entity.stats.maxMana) * 100}%`;

        if(!entity.alive) {
            if(entity.isPlayer) this.renderEntity(entity, 'entity-player');
            else if (entity.isCompanion) this.renderEntity(entity, 'entity-companion');
            else if (entity.isPet) this.renderEntity(entity, 'entity-pet');
            else {
                let idx = State.combatState.enemies.findIndex(e => e.id === entity.id);
                if(idx > -1) this.renderEntity(entity, `enemy-${idx}`);
            }
        }
        if(floatVal !== null) {
            const floatBox = document.getElementById(`float-${entity.id}`);
            if(floatBox) {
                if (floatType === 'crit') {
                    floatBox.innerHTML = `<span class="text-amber-400 font-extrabold text-2xl tracking-wider animate-crit block filter drop-shadow-[0_0_8px_#f59e0b]">⚡ CRIT! ${floatVal} ⚡</span>`;
                } else if (floatType === 'dmg') {
                    floatBox.innerHTML = `<span class="text-rose-500 font-extrabold text-lg animate-[fadeIn_0.5s_ease-out_forwards] block">-${floatVal}</span>`;
                } else {
                    floatBox.innerHTML = `<span class="text-emerald-400 font-extrabold text-lg animate-[fadeIn_0.5s_ease-out_forwards] block">+${floatVal}</span>`;
                }
                setTimeout(() => { if(floatBox) floatBox.innerHTML = ''; }, 1100);
            }
        }
    },
    updateEntityGauge(entity) {
        const gauge = document.getElementById(`gauge-${entity.id}`);
        if(gauge) gauge.style.width = `${Math.min(100, (entity.actionGauge / MAX_GAUGE) * 100)}%`;
    },
    triggerVisualEffect(entityId, effectClass) {
        const el = document.getElementById(`card-${entityId}`);
        if (el) { el.classList.add(effectClass); setTimeout(() => el.classList.remove(effectClass), 500); }
    },

    spawnVfx(targetId, type) {
        const card = document.getElementById(`card-${targetId}`);
        if (!card) return;
        const container = card.querySelector('.relative.w-28.h-28') || card;
        const vfx = document.createElement('div');
        vfx.className = `absolute inset-0 pointer-events-none z-40 flex items-center justify-center overflow-visible`;
        let innerHtml = '';
        if (type === 'slash') innerHtml = `<div class="vfx-slash"></div>`;
        else if (type === 'fire') innerHtml = `<div class="vfx-fire"></div>`;
        else if (type === 'water') innerHtml = `<div class="vfx-water"></div>`;
        else if (type === 'earth') innerHtml = `<div class="vfx-earth"></div>`;
        else if (type === 'wind') innerHtml = `<div class="vfx-wind"></div>`;
        else if (type === 'lightning') innerHtml = `<div class="vfx-lightning"></div>`;
        else if (type === 'light' || type === 'heal') innerHtml = `<div class="vfx-light"></div>`;
        else if (type === 'dark') innerHtml = `<div class="vfx-dark"></div>`;
        vfx.innerHTML = innerHtml; container.appendChild(vfx);
        setTimeout(() => vfx.remove(), 600);
    },
    renderTimeline() {
        const queueContainer = document.getElementById('timeline-queue');
        if (!queueContainer) return;
        let all = [...State.combatState.allies, ...State.combatState.enemies].filter(e => e.alive).sort((a, b) => b.actionGauge - a.actionGauge);
        let html = '';
        all.slice(0, 5).forEach((e, i) => {
            let isAlly = e.isPlayer || e.isCompanion || e.isPet;
            let sideBorder = isAlly ? 'border-indigo-500/60 bg-indigo-950/40' : 'border-rose-950 bg-rose-950/40';
            html += `
                <div class="w-8 h-8 rounded-xl border flex items-center justify-center relative ${sideBorder} text-xs shadow-md overflow-hidden" title="${e.name}">
                    <div class="w-10 h-10 flex items-center justify-center scale-[0.4] origin-center">${Sprites.get(e)}</div>
                </div>`;
        });
        queueContainer.innerHTML = html;
    },

    showResultModal(isVictory, lootList, expGained) {
        const modal = document.getElementById('modal-result');
        const icon = document.getElementById('modal-result-icon');
        const title = document.getElementById('modal-result-title');
        const subtitle = document.getElementById('modal-result-subtitle');
        const rewardsContainer = document.getElementById('modal-result-rewards');
        const btnAction = document.getElementById('modal-btn-action');
        if (!modal) return;

        if (isVictory) {
            icon.className = "w-14 h-14 rounded-full flex items-center justify-center text-xl mx-auto mb-4 bg-emerald-950 text-emerald-400 border border-emerald-500/40 glow-active animate-bounce";
            icon.innerHTML = '<i class="fas fa-trophy"></i>';
            title.innerText = "VICTORY!"; title.className = "text-xl font-black mb-1 text-emerald-400";
            subtitle.innerText = "Triumph secured! Rare treasure chests collected!";

            let lootHtml = expGained > 0 ? `
                <div class="flex justify-between items-center bg-gray-900 p-2 rounded-xl border border-gray-850 shadow-inner">
                    <span class="text-gray-400">EXP Earned:</span>
                    <span class="text-cyan-400 font-bold font-mono">+${expGained} EXP</span>
                </div>` : '';

            if (lootList.length === 0) lootHtml += `<div class="text-center py-2 text-gray-500">No loot dropped in this battle.</div>`;
            else {
                lootList.forEach(loot => {
                    let textClass = loot.type === 'gold' ? 'text-amber-400' : loot.type === 'gems' ? 'text-cyan-400 font-bold' : 'text-indigo-400';
                    lootHtml += `
                        <div class="flex justify-between items-center bg-gray-900 p-2 rounded-xl border border-gray-850 animate-fade shadow-inner">
                            <span class="text-gray-400 flex items-center"><i class="fas fa-box-open mr-2 text-indigo-400"></i>Battle Loot:</span>
                            <span class="${textClass}">${loot.text}</span>
                        </div>`;
                });
            }
            rewardsContainer.innerHTML = lootHtml;
            btnAction.innerText = "Continue to Next Stage";
            btnAction.onclick = () => { UI.closeResultModal(); Combat.start(); };
        } else {
            icon.className = "w-14 h-14 rounded-full flex items-center justify-center text-xl mx-auto mb-4 bg-rose-955 text-rose-400 border border-rose-500/40 animate-pulse";
            icon.innerHTML = '<i class="fas fa-skull"></i>';
            title.innerText = "DEFEATED!"; title.className = "text-xl font-black mb-1 text-rose-500";
            subtitle.innerText = "Enhance your gear at the Forge to improve your survival chances!";
            rewardsContainer.innerHTML = `<div class="text-center py-4 text-gray-500">Tactical retreat — current loot preserved.</div>`;
            btnAction.innerText = "Retry Battle";
            btnAction.onclick = () => { UI.closeResultModal(); Combat.start(); };
        }
        modal.classList.remove('hidden');
    },
    closeResultModal() { const modal = document.getElementById('modal-result'); if (modal) modal.classList.add('hidden'); },
    showLootModal(chestName, qtyOpened, summary) {
        const modal = document.getElementById('modal-loot');
        const container = document.getElementById('loot-modal-content');
        if (!modal || !container) return;
        let html = `<div class="font-bold text-gray-400 border-b border-gray-800 pb-2 mb-2 text-center uppercase text-[10px]">Opening ${qtyOpened}x ${chestName}</div>`;
        Object.entries(summary).forEach(([key, val]) => {
            let color = key.includes('EXP') ? 'text-cyan-400' : key.includes('Gold') ? 'text-amber-400' : 'text-white';
            html += `
                <div class="flex justify-between items-center py-1 border-b border-gray-900/40">
                    <span class="text-gray-400">${key}</span>
                    <span class="${color} font-bold">+${val}</span>
                </div>`;
        });
        container.innerHTML = html; modal.classList.remove('hidden');
    },
    closeLootModal() { const modal = document.getElementById('modal-loot'); if (modal) modal.classList.add('hidden'); },
    
    showSummonSummaryModal(list, isPremium) {
        const modal = document.getElementById('modal-loot');
        const container = document.getElementById('loot-modal-content');
        if (!modal || !container) return;

        let html = `<div class="font-bold text-gray-400 border-b border-gray-800 pb-2 mb-2 text-center uppercase text-[10px]">SUMMON RESULTS (${isPremium ? 'PREMIUM' : 'STANDARD'})</div>`;
        list.forEach(item => {
            let tMeta = SUMMON_TIERS[item.tier];
            html += `
                <div class="flex justify-between items-center py-1.5 border-b border-gray-900/40">
                    <span class="text-white flex items-center font-bold">
                        <i class="fas ${item.stats.matk > item.stats.atk ? 'fa-paw text-emerald-400' : 'fa-user-ninja text-indigo-400'} mr-2"></i>
                        ${item.name}
                    </span>
                    <span class="${tMeta.color} font-black">${item.tier}</span>
                </div>`;
        });
        container.innerHTML = html;
        modal.classList.remove('hidden');
    },

    showDialogAlert(title, text) {
        const modal = document.getElementById('modal-dialog'); if (!modal) return;
        document.getElementById('dialog-title').innerText = title;
        document.getElementById('dialog-text').innerText = text;
        let confirmBtn = document.getElementById('dialog-btn-confirm'); confirmBtn.innerText = "Confirm";
        confirmBtn.onclick = () => this.closeDialog();
        modal.classList.remove('hidden');
    },
    showResetConfirm() {
        const modal = document.getElementById('modal-dialog'); if (!modal) return;
        document.getElementById('dialog-title').innerText = "Log Out";
        document.getElementById('dialog-text').innerText = "Return to the account login screen?";
        let confirmBtn = document.getElementById('dialog-btn-confirm'); confirmBtn.innerText = "Confirm";
        confirmBtn.onclick = () => {
            Game.save();
            localStorage.removeItem('ec_token');
            location.reload();
        };
        modal.classList.remove('hidden');
    },
    closeDialog() { const modal = document.getElementById('modal-dialog'); if (modal) modal.classList.add('hidden'); }
};

