const Utils = {
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    generateId: () => Math.random().toString(36).substr(2, 9),
    calculateExpReq: (level) => Math.floor(100 * Math.pow(level, 1.55)),
    log: (msg, color = 'text-gray-400') => {
        const logBox = document.getElementById('combat-log');
        if (!logBox) return;
        const entry = document.createElement('div');
        entry.className = `py-1 border-b border-gray-900/40 ${color} animate-fade`;
        entry.innerHTML = msg;
        logBox.prepend(entry);
        if(logBox.children.length > 50) logBox.lastChild.remove();
    },
    formatNumber: (num) => num >= 1000000 ? (num/1000000).toFixed(1) + 'M' : (num >= 1000 ? (num/1000).toFixed(1) + 'k' : num)
};

class Entity {
    constructor(data) {
        this.id = data.id || Utils.generateId();
        this.name = data.name;
        this.isPlayer = data.isPlayer || false;
        this.isCompanion = data.isCompanion || false;
        this.isPet = data.isPet || false;
        this.element = data.element || 'water';
        this.stats = { hp: 0, maxHp: 0, atk: 0, matk: 0, def: 0, res: 0, spd: 0, mr: 4, cr: 0.05, cd: 1.5, mana: 0, maxMana: 100 };
        this.actionGauge = 0;
        this.alive = true;
    }
    takeDamage(amount, isCrit) {
        this.stats.hp -= amount;
        if(this.stats.hp <= 0) { this.stats.hp = 0; this.alive = false; }
        UI.updateEntity(this, amount, isCrit ? 'crit' : 'dmg');
    }
    heal(amount) {
        if(!this.alive) return;
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
        UI.updateEntity(this, amount, 'heal');
    }
    gainMana(amount) {
        this.stats.mana = Math.min(this.stats.maxMana, this.stats.mana + amount);
        UI.updateEntity(this);
    }
}

