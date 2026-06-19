/* ============================================================
   quests.js — light milestone quest chain.
   Progress is derived from existing player stats (no separate
   tracking needed for level-based quests); kill/alchemy/enhance
   counters are incremented by combat.js / crafting.js.
   ============================================================ */
const Quests = {
    getProgress(quest) {
        switch (quest.type) {
            case 'level': return State.player.level;
            case 'kill': return State.player.enemiesDefeated || 0;
            case 'alchemy': return State.player.totalAlchemySuccess || 0;
            case 'enhance': return State.player.totalEnhanceSuccess || 0;
            default: return 0;
        }
    },
    isComplete(quest) { return this.getProgress(quest) >= quest.target; },
    isClaimed(quest) { return (State.claimedQuests || []).includes(quest.id); },
    hasClaimable() {
        return QUEST_DB.some(q => this.isComplete(q) && !this.isClaimed(q));
    },
    claim(questId) {
        const quest = QUEST_DB.find(q => q.id === questId);
        if (!quest) return;
        if (!this.isComplete(quest) || this.isClaimed(quest)) return;

        if (!State.claimedQuests) State.claimedQuests = [];
        State.claimedQuests.push(quest.id);
        State.player.gold += quest.reward.gold || 0;
        State.player.gems += quest.reward.gems || 0;

        let rewardText = [];
        if (quest.reward.gold) rewardText.push(`+${quest.reward.gold} Gold`);
        if (quest.reward.gems) rewardText.push(`+${quest.reward.gems} Gems`);
        Utils.log(`Quest complete: "${quest.title}" — ${rewardText.join(', ')}!`, 'text-emerald-400 font-bold');

        UI.updateTopBar();
        UI.renderQuestTab();
        Game.save();
    }
};
