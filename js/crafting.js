const Crafting = {
    selectEnhanceTarget(slot) { CraftingState.targetSlot = slot; UI.updateForgeScreen(); },
    setCraftSlot(slot) { CraftingState.craftSlot = slot; UI.renderCraftSelector(); },
    triggerForgeAnimation(actionType) {
        const platform = document.getElementById('forge-platform');
        const loader = document.getElementById('forge-loader');
        if (!platform || !loader) return;
        loader.classList.remove('hidden');
        platform.classList.add('shake-element');

        setTimeout(() => {
            loader.classList.add('hidden'); platform.classList.remove('shake-element');
            if (actionType === 'enhance') this.enhance();
            else if (actionType === 'craft') this.craftGear();
        }, 1200);
    },
    enhance() {
        if(!CraftingState.targetSlot || !State.equipment[CraftingState.targetSlot]) return;
        const item = State.equipment[CraftingState.targetSlot];
        const cost = 120 * Math.pow(1.5, item.enhanceLevel);
        if(State.player.gold < cost) { UI.showDialogAlert("Failed", "Not enough Gold!"); return; }

        const protectCheckbox = document.getElementById('chk-protection');
        const useProtection = protectCheckbox && protectCheckbox.checked && item.enhanceLevel >= 10;
        const protectCost = 5000;

        if (useProtection) {
            if (State.player.gold < protectCost + cost) { UI.showDialogAlert("Failed", "Not enough Gold for the Protection Charm!"); return; }
            State.player.gold -= protectCost;
        }

        State.player.gold -= Math.floor(cost);
        UI.updateTopBar();

        let chance = 100;
        if(item.enhanceLevel >= 5) chance = 80;
        if(item.enhanceLevel >= 10) chance = 50;
        if(item.enhanceLevel >= 15) chance = 25;

        const platform = document.getElementById('forge-platform');
        if(Math.random() * 100 <= chance) {
            item.enhanceLevel++;
            item.name = item.name.replace(/\+\d+/, `+${item.enhanceLevel}`);
            for(let k in item.stats) {
                item.stats[k] = Math.floor(item.stats[k] * 1.06) || parseFloat((item.stats[k]*1.06).toFixed(4));
            }
            Utils.log(`Enhancement success: +${item.enhanceLevel}!`, "text-amber-400 font-bold");
            if (platform) {
                platform.classList.add('success-pulse');
                setTimeout(() => platform.classList.remove('success-pulse'), 800);
            }
        } else {
            if (useProtection) {
                Utils.log(`Forge failed! Protection Charm saved the star level of ${item.name}`, "text-cyan-400 font-bold");
            } else {
                if(item.enhanceLevel >= 15) {
                    item.enhanceLevel = Math.max(0, item.enhanceLevel - 2);
                } else if(item.enhanceLevel >= 10) {
                    item.enhanceLevel = Math.max(0, item.enhanceLevel - 1);
                }
            }
            item.name = item.name.replace(/\+\d+/, `+${item.enhanceLevel}`);
            Utils.log(`Forge failed!`, "text-rose-400");
        }
        PlayerObj.recalculateStats();
        UI.updateForgeScreen();
    },
    craftGear() {
        if (State.materials.fine_iron < 10) { UI.showDialogAlert("Craft Failed", "Need at least 10 Fine Iron to forge!"); return; }
        State.materials.fine_iron -= 10;

        let roll = Math.random() * 100;
        let rarity = 'uncommon';
        if (roll < 0.1) rarity = 'legendary';
        else if (roll < 1.0) rarity = 'ur';
        else if (roll < 5.0) rarity = 'ssr';
        else if (roll < 20.0) rarity = 'sr';
        else if (roll < 55.0) rarity = 'rare';

        let craftedItem = Inventory.generateItem(State.player.level, rarity);
        craftedItem.slot = CraftingState.craftSlot;
        craftedItem.name = Inventory.generateFantasyName(craftedItem.slot, rarity) + ' +0';

        if (Inventory.addItem(craftedItem)) {
            Utils.log(`Craft successful: <span class="${RARITIES[rarity].color} font-bold">[${craftedItem.name}]</span>!`, 'text-indigo-400');
        } else {
            State.materials.fine_iron += 10;
            UI.showDialogAlert("Bag Full", "No space left in your inventory!");
        }
        UI.updateForgeScreen();
    },
    alchemyAction(recipe) {
        if (recipe === 'common_to_uncommon') {
            if (State.materials.raw_iron >= 3) {
                State.materials.raw_iron -= 3;
                if (Math.random() < 0.85) { State.materials.fine_iron++; Utils.log("Fine Iron alchemy success!", "text-emerald-400"); }
                else { State.materials.raw_iron += 1; Utils.log("Alchemy failed, recovered 1 raw iron.", "text-rose-500"); }
            } else UI.showDialogAlert("Insufficient", "Not enough Raw Iron!");
        } else if (recipe === 'uncommon_to_rare') {
            if (State.materials.fine_iron >= 3) {
                State.materials.fine_iron -= 3;
                if (Math.random() < 0.60) { State.materials.refined_iron++; Utils.log("Refined Iron alchemy success!", "text-indigo-400"); }
                else { State.materials.fine_iron += 1; Utils.log("Alchemy failed!", "text-rose-500"); }
            } else UI.showDialogAlert("Insufficient", "Not enough Fine Iron!");
        } else if (recipe === 'rare_to_legendary') {
            if (State.materials.refined_iron >= 3) {
                State.materials.refined_iron -= 3;
                if (Math.random() < 0.35) { State.materials.philosopher_stone++; Utils.log("Philosopher's Stone transmutation success!", "text-rose-400 font-bold"); }
                else { State.materials.raw_iron += 1; Utils.log("Transmutation failed!", "text-red-500"); }
            } else UI.showDialogAlert("Insufficient", "Not enough Refined Iron!");
        }
        UI.updateForgeScreen();
    }
};

