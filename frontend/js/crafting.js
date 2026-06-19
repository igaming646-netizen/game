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
        const slot = CraftingState.targetSlot;
        const protectCheckbox = document.getElementById('chk-protection');
        const useProtection = !!(protectCheckbox && protectCheckbox.checked && State.equipment[slot].enhanceLevel >= 10);
        const platform = document.getElementById('forge-platform');

        Game.apiFetch('/player/enhance', { method: 'POST', body: JSON.stringify({ slot, useProtection }) })
            .then(res => {
                State.player.gold = res.state.player.gold;
                State.equipment = res.state.equipment;
                if (res.success) {
                    Utils.log(res.message, "text-amber-400 font-bold");
                    if (platform) { platform.classList.add('success-pulse'); setTimeout(() => platform.classList.remove('success-pulse'), 800); }
                } else {
                    Utils.log(res.message, res.protected ? "text-cyan-400 font-bold" : "text-rose-400");
                }
                PlayerObj.recalculateStats();
                UI.updateForgeScreen();
                UI.updateTopBar();
            })
            .catch(e => UI.showDialogAlert("Failed", e.message));
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
        const needMat = { common_to_uncommon: ['raw_iron', 3], uncommon_to_rare: ['fine_iron', 3], rare_to_legendary: ['refined_iron', 3] }[recipe];
        if (needMat && State.materials[needMat[0]] < needMat[1]) {
            UI.showDialogAlert("Insufficient", `Not enough ${needMat[0].replace('_', ' ')}!`); return;
        }
        Game.apiFetch('/player/alchemy', { method: 'POST', body: JSON.stringify({ recipe }) })
            .then(res => {
                State.materials = res.state.materials;
                Utils.log(res.message, res.success ? "text-emerald-400" : "text-rose-500");
                UI.updateForgeScreen();
            })
            .catch(e => UI.showDialogAlert("Failed", e.message));
    }
};

