const Inventory = {
    generateFantasyName(slot, rarityKey) {
        const prefixes = { common: 'Crude', uncommon: 'Fine', rare: 'Azure Sea', sr: 'Dark Iron', ssr: 'Crimson Dragon', ur: 'Divine Radiance', legendary: 'Infinite Chaos' };
        const suffixes = {
            weapon: ['Slayer Sword', 'Demon Blade', 'Divine Staff', 'Scripture'],
            helmet: ['Crown', 'Heavy Helm', 'Night Cap', 'Sun God Fusion'], armor: ['Plate', 'Heavy Armor', 'Wood Guard'],
            ring: ['Band', 'Ancient Ring', 'Bone Ring'], gloves: ['Gauntlets', 'Divine Hand'], necklace: ['Necklace', 'Jade Pendant'],
            pants: ['Armored Pants', 'Steel Greaves'], boots: ['War Boots', 'Divine Treads'], belt: ['Waistband', 'Ancient Girdle']
        };
        let prefix = prefixes[rarityKey];
        let list = suffixes[slot];
        let suffix = list[Utils.randomInt(0, list.length - 1)];
        return `${prefix} ${suffix}`;
    },
    generateItem(levelDrop = State.player.level, fixedRarity = null) {
        const slot = SLOTS[Utils.randomInt(0, SLOTS.length - 1)];
        let rarityKey = 'common';
        if(fixedRarity) rarityKey = fixedRarity;
        else {
            let roll = Math.random() * 100;
            let weight = 0;
            for(const [key, data] of Object.entries(RARITIES)) {
                weight += data.dropWeight;
                if(roll <= weight) { rarityKey = key; break; }
            }
        }
        const rarity = RARITIES[rarityKey];
        const itemLevel = Math.max(1, levelDrop + Utils.randomInt(-2, 2));
        let stats = {};
        const bv = itemLevel * rarity.statMult;
        let slotName = this.generateFantasyName(slot, rarityKey);

        if(slot === 'weapon') { stats.atk = Math.floor(bv * 3.5); stats.matk = Math.floor(bv * 3.5); }
        if(slot === 'helmet' || slot === 'pants') { stats.maxHp = Math.floor(bv * 16); stats.def = Math.floor(bv * 1.6); }
        if(slot === 'armor') { stats.maxHp = Math.floor(bv * 22); stats.def = Math.floor(bv * 2.8); }
        if(slot === 'ring') { stats.cr = parseFloat((bv * 0.0002).toFixed(4)); stats.cd = parseFloat((bv * 0.002).toFixed(3)); }
        if(slot === 'boots') { stats.spd = Math.floor(bv * 2.2); }
        if(slot === 'necklace' || slot === 'belt') { stats.res = Math.floor(bv * 1.6); stats.mr = parseFloat((bv * 0.05).toFixed(2)); }
        if(slot === 'gloves') { stats.atk = Math.floor(bv); stats.spd = Math.floor(bv * 0.6); }

        return {
            id: Utils.generateId(), name: `${slotName} +0`, slot: slot, type: 'equip',
            rarity: rarityKey, level: itemLevel, enhanceLevel: 0, stats: stats, value: Math.floor(bv * rarity.costMult * 12)
        };
    },
    addItem(item) {
        if(item.type !== 'equip') {
            let existing = State.inventory.find(i => i.type === item.type && i.name === item.name && i.level === item.level);
            if(existing) { existing.qty += (item.qty || 1); UI.updateInventory(); return true; }
        }
        if(State.inventory.length < 100) {
            item.qty = item.qty || 1;
            State.inventory.push(item);
            UI.updateInventory();
            return true;
        }
        return false;
    },
    equip(invIndex) {
        const item = State.inventory[invIndex];
        if (!item || item.type !== 'equip') return;
        const current = State.equipment[item.slot];
        State.equipment[item.slot] = item;
        State.inventory.splice(invIndex, 1);
        if(current) this.addItem(current);
        PlayerObj.recalculateStats();
        UI.updateInventory();
        UI.updateCharacterScreen();
        UI.updateForgeScreen();
        UI.hideItemDetails();
    },
    unequip(slot) {
        const item = State.equipment[slot];
        if (!item) return;
        if (State.inventory.length >= 100) { UI.showDialogAlert("Bag Full", "Please clear your bag to unequip gear!"); return; }
        State.equipment[slot] = null;
        this.addItem(item);
        PlayerObj.recalculateStats();
        UI.updateInventory();
        UI.updateCharacterScreen();
        UI.updateForgeScreen();
        UI.hideItemDetails();
        Utils.log(`Unequipped slot ${slot.toUpperCase()}`, "text-cyan-400");
    },
    sell(invIndex) {
        const item = State.inventory[invIndex];
        if(!item) return;
        let qtyToSell = item.qty || 1;
        State.player.gold += (item.value || 10) * qtyToSell;
        State.inventory.splice(invIndex, 1);
        UI.updateTopBar();
        UI.updateInventory();
        UI.hideItemDetails();
    },
    sellCommon() {
        let gained = 0;
        State.inventory = State.inventory.filter(i => {
            if(i.type === 'equip' && i.rarity === 'common') { gained += i.value; return false; }
            return true;
        });
        if(gained > 0) { State.player.gold += gained; UI.updateTopBar(); UI.updateInventory(); }
    },
    setSubTab(subTab) {
        State.inventorySubTab = subTab;
        ['equip', 'chests', 'mats'].forEach(t => {
            const btn = document.getElementById(`inv-sub-${t}-btn`);
            if(btn) btn.className = "px-3 py-1 rounded-lg text-[10px] font-bold border border-gray-800 text-gray-400 hover:text-white";
        });
        const activeBtn = document.getElementById(`inv-sub-${subTab}-btn`);
        if(activeBtn) activeBtn.className = "px-3 py-1 rounded-lg text-[10px] font-bold border border-indigo-700/60 bg-indigo-950/40 text-indigo-300";
        UI.updateInventory();
        UI.hideItemDetails();
    },

    openChestBulk(invIndex, amountToOpen) {
        const item = State.inventory[invIndex];
        if (!item || item.qty <= 0) return;

        amountToOpen = Math.min(item.qty, amountToOpen);
        let lootSummary = {};
        let rewardsList = [];

        for (let i = 0; i < amountToOpen; i++) {
            if (item.type === 'chest') {
                let chestLvl = item.level || 1;
                if (item.name.includes('Dark')) {
                    let roll = Math.random();
                    if (roll < 0.35) {
                        rewardsList.push({ type: 'potion', name: `EXP Potion Lv.${chestLvl}`, xpVal: chestLvl * 200, value: chestLvl * 50 });
                    } else if (roll < 0.70) {
                        rewardsList.push({ type: 'gold_bag', name: `Gold Bag Lv.${chestLvl}`, goldVal: chestLvl * 500, value: chestLvl * 50 });
                    } else if (roll < 0.85) {
                        rewardsList.push({ type: 'material', name: 'Raw Iron Fragment', matKey: 'raw_iron', qty: Utils.randomInt(1, 3) });
                    } else {
                        let amt = Utils.randomInt(1, 2);
                        let rollSoul = Math.random();
                        if(rollSoul < 0.5) rewardsList.push({ type: 'material', name: 'Beast Soul', matKey: 'pet_soul', qty: amt });
                        else rewardsList.push({ type: 'material', name: 'Knight Soul', matKey: 'comp_soul', qty: amt });
                    }
                } else if (item.name.includes('Ancient')) {
                    let calculatedEquipLevel = Math.max(1, (chestLvl * 15) - Utils.randomInt(0, 10));
                    let rollsRarity = Math.random() * 100;
                    let chosenRarity = 'uncommon';
                    if (rollsRarity < 1) chosenRarity = 'ur';
                    else if (rollsRarity < 5) chosenRarity = 'ssr';
                    else if (rollsRarity < 20) chosenRarity = 'sr';
                    else if (rollsRarity < 50) chosenRarity = 'rare';

                    let crafted = Inventory.generateItem(calculatedEquipLevel, chosenRarity);
                    rewardsList.push({ type: 'equip', name: crafted.name, data: crafted });
                }
            } else if (item.type === 'potion') {
                rewardsList.push({ type: 'exp_direct', name: 'Character EXP', xp: item.xpVal });
            } else if (item.type === 'gold_bag') {
                rewardsList.push({ type: 'gold_direct', name: 'Pure Gold', gold: item.goldVal });
            }
        }

        rewardsList.forEach(r => {
            if (r.type === 'exp_direct') {
                PlayerObj.gainExp(r.xp); lootSummary['Accumulated EXP'] = (lootSummary['Accumulated EXP'] || 0) + r.xp;
            } else if (r.type === 'gold_direct') {
                State.player.gold += r.gold; lootSummary['Pure Gold'] = (lootSummary['Pure Gold'] || 0) + r.gold;
            } else if (r.type === 'potion') {
                this.addItem({ id: Utils.generateId(), name: r.name, type: 'potion', level: item.level, xpVal: r.xpVal, value: r.value, qty: 1 });
                lootSummary[r.name] = (lootSummary[r.name] || 0) + 1;
            } else if (r.type === 'gold_bag') {
                this.addItem({ id: Utils.generateId(), name: r.name, type: 'gold_bag', level: item.level, goldVal: r.goldVal, value: r.value, qty: 1 });
                lootSummary[r.name] = (lootSummary[r.name] || 0) + 1;
            } else if (r.type === 'material') {
                State.materials[r.matKey] += r.qty; lootSummary[r.name] = (lootSummary[r.name] || 0) + r.qty;
            } else if (r.type === 'equip') {
                this.addItem(r.data); lootSummary[r.name] = (lootSummary[r.name] || 0) + 1;
            }
        });

        item.qty -= amountToOpen;
        if (item.qty <= 0) State.inventory.splice(invIndex, 1);

        UI.updateTopBar(); UI.updateInventory(); UI.hideItemDetails();
        UI.showLootModal(item.name, amountToOpen, lootSummary);
    },
    sort() {
        const ro = { 'legendary': 7, 'ur': 6, 'ssr': 5, 'sr': 4, 'rare': 3, 'uncommon': 2, 'common': 1 };
        State.inventory.sort((a, b) => {
            if (a.type === 'equip' && b.type === 'equip') return ro[b.rarity] - ro[a.rarity];
            return 0;
        });
        UI.updateInventory();
    }
};

