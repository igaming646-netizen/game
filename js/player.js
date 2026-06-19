const PlayerObj = {
    entity: null,
    recalculateStats() {
        if(!this.entity) this.entity = new Entity({ name: State.player.name, isPlayer: true, element: 'light' });
        const b = State.player.baseStats;
        let s = {
            maxHp: 150 + State.player.level * 15 + (b.maxHp || 0) * 15,
            atk: 20 + State.player.level * 3 + (b.atk || 0) * 3,
            matk: 20 + State.player.level * 3 + (b.matk || 0) * 3,
            def: 5 + (b.def || 0) * 1.5,
            res: 5 + (b.res || 0) * 1.5,
            spd: 100 + (b.spd || 0) * 0.8,
            mr: 4 + (b.mr || 0) * 0.15, // REDUCED: stat gain per point 1.2 -> 0.15
            cr: 0.05 + (b.cr || 0) * 0.0005, // REDUCED: crit rate per point 0.002 -> 0.0005 (0.05% each)
            cd: 1.50 + (b.cd || 0) * 0.002, // REDUCED: crit dmg per point 0.01 -> 0.002 (0.2% each)
            mana: this.entity.stats.mana || 0,
            maxMana: 100
        };
        const weaponItem = State.equipment['weapon'];
        if (weaponItem) {
            if (weaponItem.name.includes('Sword') || weaponItem.name.includes('Blade') || weaponItem.name.includes('Slayer')) s.atk = Math.floor(s.atk * 1.20);
            else if (weaponItem.name.includes('Staff') || weaponItem.name.includes('Scripture')) { s.mr += 1; s.matk = Math.floor(s.matk * 1.15); }
        }
        for(let slot of SLOTS) {
            const item = State.equipment[slot];
            if(item && item.stats) {
                for(let key in item.stats) if(s[key] !== undefined) s[key] += item.stats[key];
            }
        }
        let hpRatio = this.entity.stats.maxHp > 0 ? this.entity.stats.hp / this.entity.stats.maxHp : 1;
        this.entity.stats = s;
        this.entity.stats.hp = Math.max(1, Math.floor(s.maxHp * hpRatio));
        if(this.entity.stats.hp === 1 && hpRatio === 1) this.entity.stats.hp = s.maxHp;
        UI.updateCharacterScreen();
    },
    addStat(type) {
        let pts = State.player.statPoints;
        if (pts <= 0) return;
        let amt = State.allocationBatch === 'max' ? pts : State.allocationBatch;
        amt = Math.min(pts, amt);

        if (State.player.baseStats[type] === undefined) State.player.baseStats[type] = 0;
        State.player.baseStats[type] += amt;
        State.player.statPoints -= amt;
        this.recalculateStats();
    },
    gainExp(amount) {
        State.player.exp += amount;
        let req = Utils.calculateExpReq(State.player.level);
        let leveledUp = false;
        while(State.player.exp >= req) {
            State.player.exp -= req;
            State.player.level++;
            State.player.statPoints += 5;
            if(State.player.level % 5 === 0) State.player.ep += 1;
            req = Utils.calculateExpReq(State.player.level);
            leveledUp = true;
        }
        if(leveledUp) {
            Utils.log(`LEVEL UP! You reached level ${State.player.level}`, 'text-yellow-400 font-bold text-sm');
            this.recalculateStats();
            this.entity.stats.hp = this.entity.stats.maxHp;
            UI.updateSkills();
        }
        UI.updateCharacterScreen();
    }
};

