'use strict';

// ============================================================
// SHATTERED REALMS — Card Definitions
// ============================================================

window.CARD_DEFS = {};
window.TOKEN_DEFS = {};

window.cloneCard = function(defId) {
  const def = window.CARD_DEFS[defId];
  if (!def) return null;
  const clone = Object.assign({}, def);
  clone.kw = Object.assign({}, def.kw || {});
  return clone;
};

// ============================================================
// WARDEN STARTER DECK
// ============================================================

CARD_DEFS['W001'] = {
  id: 'W001', hero: 'warden', name: 'Forest Hound',
  type: 'minion', cost: 2, starter: true, isToken: false,
  baseAtk: 2, baseHp: 3, kw: {}, text: '',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W002'] = {
  id: 'W002', hero: 'warden', name: 'Thornback Boar',
  type: 'minion', cost: 3, starter: true, isToken: false,
  baseAtk: 2, baseHp: 4, kw: { thorns: 1 }, text: 'Thorns 1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W003'] = {
  id: 'W003', hero: 'warden', name: 'Grove Watcher',
  type: 'minion', cost: 3, starter: true, isToken: false,
  baseAtk: 1, baseHp: 5, kw: { defender: true, regenerate: 1 }, text: 'Defender. Regenerate 1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W004'] = {
  id: 'W004', hero: 'warden', name: 'Wildseed Sprout',
  type: 'minion', cost: 1, starter: true, isToken: false,
  baseAtk: 1, baseHp: 2, kw: {}, text: 'Rally: Gain +0/+1.',
  battlecry: null, lastBreath: null, inspire: null,
  rally: (G, cardId, ownerIdx) => {
    window.Engine.buffMinion(G, cardId, 0, 1, true);
  },
  surge: null, onPlay: null,
};

CARD_DEFS['W005'] = {
  id: 'W005', hero: 'warden', name: 'Ironbark Elk',
  type: 'minion', cost: 4, starter: true, isToken: false,
  baseAtk: 3, baseHp: 4, kw: { trample: true }, text: 'Trample.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W006'] = {
  id: 'W006', hero: 'warden', name: "Nature's Mend",
  type: 'sorcery', cost: 2, starter: true, isToken: false,
  kw: {}, text: 'Heal a friendly minion for 3 HP.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.healMinion(G, targets[0], 3);
  },
};

CARD_DEFS['W007'] = {
  id: 'W007', hero: 'warden', name: 'Bark Skin',
  type: 'instant', cost: 1, starter: true, isToken: false,
  kw: {}, text: 'Give a friendly minion +0/+3 until end of turn.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) {
      window.Engine.buffMinion(G, targets[0], 0, 3, false);
    }
  },
};

CARD_DEFS['W008'] = {
  id: 'W008', hero: 'warden', name: 'Overgrowth',
  type: 'sorcery', cost: 2, starter: true, isToken: false,
  kw: {}, text: 'Give a friendly minion +1/+1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.buffMinion(G, targets[0], 1, 1, true);
  },
};

CARD_DEFS['W009'] = {
  id: 'W009', hero: 'warden', name: 'Wild Instinct',
  type: 'instant', cost: 2, starter: true, isToken: false,
  kw: {}, text: 'Target friendly minion gains Trample until end of turn. If it already has Trample, also gain +2/+0 until end of turn.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    const target = targets[0];
    const minion = window.Engine.getMinion(G, target);
    const hadTrample = minion && minion.kw && minion.kw.trample;
    window.Engine.giveKeyword(G, target, 'trample', true);
    window.Engine.addEndOfTurnCleanup(G, { type: 'removeKeyword', cardId: target, keyword: 'trample' });
    if (hadTrample) {
      window.Engine.buffMinion(G, target, 2, 0, false);
    }
  },
};

CARD_DEFS['W010'] = {
  id: 'W010', hero: 'warden', name: 'Primal Roar',
  type: 'sorcery', cost: 3, starter: true, isToken: false,
  kw: {}, text: 'All friendly minions gain +1/+0 until end of turn.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    const minions = window.Engine.getFriendlyMinions(G, ownerIdx);
    minions.forEach(id => window.Engine.buffMinion(G, id, 1, 0, false));
  },
};

// ============================================================
// WARDEN SHOP MINIONS
// ============================================================

CARD_DEFS['W011'] = {
  id: 'W011', hero: 'warden', name: 'Mossback Turtle',
  type: 'minion', cost: 1, starter: false, isToken: false,
  baseAtk: 0, baseHp: 4, kw: { defender: true, thorns: 1 }, text: 'Defender. Thorns 1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W012'] = {
  id: 'W012', hero: 'warden', name: 'Briarwood Fox',
  type: 'minion', cost: 1, starter: false, isToken: false,
  baseAtk: 1, baseHp: 3, kw: { thorns: 1 }, text: 'Thorns 1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W013'] = {
  id: 'W013', hero: 'warden', name: 'Seedling Dryad',
  type: 'minion', cost: 1, starter: false, isToken: false,
  baseAtk: 0, baseHp: 3, kw: {}, text: 'Inspire: Heal all friendly minions for 1 HP.',
  battlecry: null, lastBreath: null,
  inspire: (G, cardId, ownerIdx) => {
    const minions = window.Engine.getFriendlyMinions(G, ownerIdx);
    minions.forEach(id => window.Engine.healMinion(G, id, 1));
  },
  rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W014'] = {
  id: 'W014', hero: 'warden', name: 'Vinegrasp Creeper',
  type: 'minion', cost: 2, starter: false, isToken: false,
  baseAtk: 1, baseHp: 5, kw: { defender: true, thorns: 1 }, text: 'Defender. Thorns 1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W015'] = {
  id: 'W015', hero: 'warden', name: 'Amber Lynx',
  type: 'minion', cost: 2, starter: false, isToken: false,
  baseAtk: 2, baseHp: 2, kw: { stealth: true }, text: 'Stealth. Battlecry: Scout 1.',
  battlecry: (G, cardId, ownerIdx) => {
    window.Engine.scry(G, ownerIdx, 1);
  },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W016'] = {
  id: 'W016', hero: 'warden', name: 'Root Snapper',
  type: 'minion', cost: 2, starter: false, isToken: false,
  baseAtk: 2, baseHp: 3, kw: { regenerate: 1 }, text: 'Regenerate 1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W017'] = {
  id: 'W017', hero: 'warden', name: 'Ridgeback Wolf',
  type: 'minion', cost: 2, starter: false, isToken: false,
  baseAtk: 3, baseHp: 2, kw: {}, text: '',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W018'] = {
  id: 'W018', hero: 'warden', name: 'Greenmantle Shaman',
  type: 'minion', cost: 3, starter: false, isToken: false,
  baseAtk: 1, baseHp: 3, kw: {}, text: 'Battlecry: Heal a friendly minion for 2 HP.',
  battlecry: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.healMinion(G, targets[0], 2);
  },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W019'] = {
  id: 'W019', hero: 'warden', name: 'Bramble Stalker',
  type: 'minion', cost: 3, starter: false, isToken: false,
  baseAtk: 2, baseHp: 3, kw: { thorns: 1, frenzy: true }, text: 'Thorns 1. Frenzy.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W020'] = {
  id: 'W020', hero: 'warden', name: 'Staghorn Sentinel',
  type: 'minion', cost: 3, starter: false, isToken: false,
  baseAtk: 2, baseHp: 5, kw: { taunt: true }, text: 'Taunt.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W021'] = {
  id: 'W021', hero: 'warden', name: 'Oakshield Guardian',
  type: 'minion', cost: 3, starter: false, isToken: false,
  baseAtk: 1, baseHp: 6, kw: { defender: true, shield: 2 }, text: 'Defender. Shield 2.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W022'] = {
  id: 'W022', hero: 'warden', name: 'Moss Elemental',
  type: 'minion', cost: 3, starter: false, isToken: false,
  baseAtk: 3, baseHp: 3, kw: { regenerate: 1 }, text: 'Regenerate 1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W023'] = {
  id: 'W023', hero: 'warden', name: 'Verdant Prowler',
  type: 'minion', cost: 3, starter: false, isToken: false,
  baseAtk: 3, baseHp: 2, kw: { trample: true }, text: 'Trample. Battlecry: Gain +1/+0 for each other friendly minion.',
  battlecry: (G, cardId, ownerIdx) => {
    const minions = window.Engine.getFriendlyMinions(G, ownerIdx).filter(id => id !== cardId);
    if (minions.length > 0) window.Engine.buffMinion(G, cardId, minions.length, 0, true);
  },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W024'] = {
  id: 'W024', hero: 'warden', name: 'Deeproot Tender',
  type: 'minion', cost: 4, starter: false, isToken: false,
  baseAtk: 1, baseHp: 4, kw: {}, text: 'Inspire: Give another random friendly minion +0/+1.',
  battlecry: null, lastBreath: null,
  inspire: (G, cardId, ownerIdx) => {
    const others = window.Engine.getFriendlyMinions(G, ownerIdx).filter(id => id !== cardId);
    if (others.length > 0) {
      const target = others[Math.floor(Math.random() * others.length)];
      window.Engine.buffMinion(G, target, 0, 1, true);
    }
  },
  rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W025'] = {
  id: 'W025', hero: 'warden', name: 'Mistwood Strider',
  type: 'minion', cost: 4, starter: false, isToken: false,
  baseAtk: 3, baseHp: 4, kw: { trample: true, regenerate: 1 }, text: 'Trample. Regenerate 1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W026'] = {
  id: 'W026', hero: 'warden', name: 'Feral Grizzly',
  type: 'minion', cost: 4, starter: false, isToken: false,
  baseAtk: 4, baseHp: 3, kw: { frenzy: true },
  text: 'Frenzy. Whenever this takes damage, gain +0/+1.',
  specialAbility: 'onDamageTaken_gainHp',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W027'] = {
  id: 'W027', hero: 'warden', name: 'Hollowbark Ancient',
  type: 'minion', cost: 4, starter: false, isToken: false,
  baseAtk: 2, baseHp: 6, kw: { taunt: true, thorns: 2 }, text: 'Taunt. Thorns 2.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W028'] = {
  id: 'W028', hero: 'warden', name: 'Canopy Drake',
  type: 'minion', cost: 4, starter: false, isToken: false,
  baseAtk: 3, baseHp: 4, kw: { trample: true, thorns: 2 }, text: 'Trample. Thorns 2.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W029'] = {
  id: 'W029', hero: 'warden', name: 'Ironwood Golem',
  type: 'minion', cost: 5, starter: false, isToken: false,
  baseAtk: 3, baseHp: 7, kw: { defender: true, regenerate: 2 }, text: 'Defender. Regenerate 2.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W030'] = {
  id: 'W030', hero: 'warden', name: 'Thundermane Charger',
  type: 'minion', cost: 5, starter: false, isToken: false,
  baseAtk: 5, baseHp: 4, kw: { trample: true, vigilance: true }, text: 'Trample. Vigilance.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W031'] = {
  id: 'W031', hero: 'warden', name: 'Rootmother Dryad',
  type: 'minion', cost: 5, starter: false, isToken: false,
  baseAtk: 2, baseHp: 5, kw: {}, text: 'Inspire: Heal all friendly minions for 2 HP.',
  battlecry: null, lastBreath: null,
  inspire: (G, cardId, ownerIdx) => {
    const minions = window.Engine.getFriendlyMinions(G, ownerIdx);
    minions.forEach(id => window.Engine.healMinion(G, id, 2));
  },
  rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W032'] = {
  id: 'W032', hero: 'warden', name: 'Stonehide Basilisk',
  type: 'minion', cost: 5, starter: false, isToken: false,
  baseAtk: 3, baseHp: 5, kw: { deathtouch: true, regenerate: 1 }, text: 'Deathtouch. Regenerate 1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W033'] = {
  id: 'W033', hero: 'warden', name: 'Wildwood Hydra',
  type: 'minion', cost: 5, starter: false, isToken: false,
  baseAtk: 3, baseHp: 6, kw: { frenzy: true, regenerate: 1 },
  text: 'Frenzy. Regenerate 1. Whenever this minion heals, gain +1/+0.',
  specialAbility: 'onHealGainAtk',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W034'] = {
  id: 'W034', hero: 'warden', name: 'Elder Treefolk',
  type: 'minion', cost: 6, starter: false, isToken: false,
  baseAtk: 2, baseHp: 8, kw: { taunt: true, regenerate: 2, thorns: 2 }, text: 'Taunt. Regenerate 2. Thorns 2.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W035'] = {
  id: 'W035', hero: 'warden', name: 'Glade Titan',
  type: 'minion', cost: 6, starter: false, isToken: false,
  baseAtk: 5, baseHp: 6, kw: { trample: true }, text: 'Trample. Battlecry: Give another friendly minion +0/+2.',
  battlecry: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.buffMinion(G, targets[0], 0, 2, true);
  },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W036'] = {
  id: 'W036', hero: 'warden', name: 'Beastcaller Alpha',
  type: 'minion', cost: 6, starter: false, isToken: false,
  baseAtk: 4, baseHp: 4, kw: {}, text: 'Battlecry: Summon two 2/2 Wolf tokens. Rally: Give the new minion +1/+1.',
  battlecry: (G, cardId, ownerIdx) => {
    window.Engine.summonToken(G, ownerIdx, 'TK_WOLF');
    window.Engine.summonToken(G, ownerIdx, 'TK_WOLF');
  },
  lastBreath: null, inspire: null,
  rally: (G, cardId, ownerIdx, newCardId) => {
    if (newCardId) window.Engine.buffMinion(G, newCardId, 1, 1, true);
  },
  surge: null, onPlay: null,
};

CARD_DEFS['W037'] = {
  id: 'W037', hero: 'warden', name: 'Thornweaver Matriarch',
  type: 'minion', cost: 6, starter: false, isToken: false,
  baseAtk: 3, baseHp: 7, kw: { thorns: 3 }, text: 'Thorns 3. Inspire: Give all friendly minions thorns:1 until end of turn.',
  battlecry: null, lastBreath: null,
  inspire: (G, cardId, ownerIdx) => {
    const minions = window.Engine.getFriendlyMinions(G, ownerIdx);
    minions.forEach(id => {
      window.Engine.giveKeyword(G, id, 'thorns', 1);
      window.Engine.addEndOfTurnCleanup(G, { type: 'removeKeyword', cardId: id, keyword: 'thorns' });
    });
  },
  rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W038'] = {
  id: 'W038', hero: 'warden', name: 'Mossheart Behemoth',
  type: 'minion', cost: 7, starter: false, isToken: false,
  baseAtk: 5, baseHp: 7, kw: { trample: true, regenerate: 2 }, text: 'Trample. Regenerate 2.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W039'] = {
  id: 'W039', hero: 'warden', name: 'Ancient Treant',
  type: 'minion', cost: 7, starter: false, isToken: false,
  baseAtk: 4, baseHp: 9, kw: { taunt: true, defender: true, regenerate: 3, thorns: 2 }, text: 'Taunt. Defender. Regenerate 3. Thorns 2.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W040'] = {
  id: 'W040', hero: 'warden', name: 'Alpha Worg',
  type: 'minion', cost: 7, starter: false, isToken: false,
  baseAtk: 6, baseHp: 5, kw: { trample: true, vigilance: true }, text: 'Trample. Vigilance. Battlecry: All friendly minions gain +1/+0.',
  battlecry: (G, cardId, ownerIdx) => {
    const minions = window.Engine.getFriendlyMinions(G, ownerIdx).filter(id => id !== cardId);
    minions.forEach(id => window.Engine.buffMinion(G, id, 1, 0, true));
  },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W041'] = {
  id: 'W041', hero: 'warden', name: 'Primordial Wurm',
  type: 'minion', cost: 8, starter: false, isToken: false,
  baseAtk: 7, baseHp: 7, kw: { trample: true, frenzy: true, piercing: 2 }, text: 'Trample. Frenzy. Piercing 2.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W042'] = {
  id: 'W042', hero: 'warden', name: 'Verdant Colossus',
  type: 'minion', cost: 8, starter: false, isToken: false,
  baseAtk: 5, baseHp: 10, kw: { taunt: true, regenerate: 3, shield: 3 }, text: 'Taunt. Regenerate 3. Shield 3.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W043'] = {
  id: 'W043', hero: 'warden', name: 'World Tree Seedling',
  type: 'minion', cost: 8, starter: false, isToken: false,
  baseAtk: 3, baseHp: 8, kw: { regenerate: 2 }, text: 'Regenerate 2. Inspire: Summon a 2/2 Treant token with Taunt.',
  battlecry: null, lastBreath: null,
  inspire: (G, cardId, ownerIdx) => {
    window.Engine.summonToken(G, ownerIdx, 'TK_TREANT');
  },
  rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W044'] = {
  id: 'W044', hero: 'warden', name: 'Apex Predator',
  type: 'minion', cost: 9, starter: false, isToken: false,
  baseAtk: 8, baseHp: 7, kw: { trample: true, deathtouch: true }, text: 'Trample. Deathtouch.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W045'] = {
  id: 'W045', hero: 'warden', name: 'Earthshaker Mammoth',
  type: 'minion', cost: 9, starter: false, isToken: false,
  baseAtk: 6, baseHp: 9, kw: { trample: true }, text: 'Trample. Battlecry: All enemy minions lose -2 ATK.',
  battlecry: (G, cardId, ownerIdx) => {
    const enemies = window.Engine.getEnemyMinions(G, ownerIdx);
    enemies.forEach(id => window.Engine.buffMinion(G, id, -2, 0, true));
  },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W046'] = {
  id: 'W046', hero: 'warden', name: 'Eldergrove Titan',
  type: 'minion', cost: 10, starter: false, isToken: false,
  baseAtk: 7, baseHp: 12, kw: { trample: true, regenerate: 3, taunt: true }, text: 'Trample. Regenerate 3. Taunt. Inspire: Give all friendly minions +0/+1.',
  battlecry: null, lastBreath: null,
  inspire: (G, cardId, ownerIdx) => {
    const minions = window.Engine.getFriendlyMinions(G, ownerIdx);
    minions.forEach(id => window.Engine.buffMinion(G, id, 0, 1, true));
  },
  rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W047'] = {
  id: 'W047', hero: 'warden', name: 'Worldbreaker Hydra',
  type: 'minion', cost: 11, starter: false, isToken: false,
  baseAtk: 8, baseHp: 8, kw: { trample: true, frenzy: true, regenerate: 2 },
  text: 'Trample. Frenzy. Regenerate 2. Whenever this destroys a minion in combat, gain +2/+2.',
  specialAbility: 'onKillGainStats',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W048'] = {
  id: 'W048', hero: 'warden', name: "Gaia's Avatar",
  type: 'minion', cost: 12, starter: false, isToken: false,
  baseAtk: 10, baseHp: 15, kw: { trample: true, regenerate: 4, taunt: true, indestructible: true },
  text: 'Trample. Regenerate 4. Taunt. Indestructible. Enters tapped for 2 turns.',
  specialAbility: 'doubleEntryTap',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

// ============================================================
// WARDEN SHOP INSTANTS
// ============================================================

CARD_DEFS['W049'] = {
  id: 'W049', hero: 'warden', name: 'Thorn Lash',
  type: 'instant', cost: 1, starter: false, isToken: false,
  kw: {}, text: 'Deal 1 damage to target minion. Give it thorns:1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.dealDamage(G, targets[0], 1, cardId);
    window.Engine.giveKeyword(G, targets[0], 'thorns', 1);
  },
};

CARD_DEFS['W050'] = {
  id: 'W050', hero: 'warden', name: 'Root Grip',
  type: 'instant', cost: 1, starter: false, isToken: false,
  kw: {}, text: 'Tap target minion for 1 extra upkeep.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.tapMinion(G, targets[0], 2);
  },
};

CARD_DEFS['W051'] = {
  id: 'W051', hero: 'warden', name: 'Verdant Shield',
  type: 'instant', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion shield:3.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.giveKeyword(G, targets[0], 'shield', 3);
  },
};

CARD_DEFS['W052'] = {
  id: 'W052', hero: 'warden', name: 'Bestial Reflexes',
  type: 'instant', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Target friendly minion gains +2/+2 and trample until end of turn.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.buffMinion(G, targets[0], 2, 2, false);
    window.Engine.giveKeyword(G, targets[0], 'trample', true);
    window.Engine.addEndOfTurnCleanup(G, { type: 'removeKeyword', cardId: targets[0], keyword: 'trample' });
  },
};

CARD_DEFS['W053'] = {
  id: 'W053', hero: 'warden', name: 'Regrowth Pulse',
  type: 'instant', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Heal a friendly minion for 4 HP. If it has regenerate, heal for 6 instead.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    const minion = window.Engine.getMinion(G, targets[0]);
    const amount = (minion && minion.kw && minion.kw.regenerate) ? 6 : 4;
    window.Engine.healMinion(G, targets[0], amount);
  },
};

CARD_DEFS['W054'] = {
  id: 'W054', hero: 'warden', name: "Nature's Rebuke",
  type: 'instant', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Deal 4 damage to target minion.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.dealDamage(G, targets[0], 4, cardId);
  },
};

CARD_DEFS['W055'] = {
  id: 'W055', hero: 'warden', name: 'Thick Hide',
  type: 'instant', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +0/+4 and regenerate:1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.buffMinion(G, targets[0], 0, 4, true);
    window.Engine.giveKeyword(G, targets[0], 'regenerate', 1);
  },
};

CARD_DEFS['W056'] = {
  id: 'W056', hero: 'warden', name: 'Primal Surge',
  type: 'instant', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'All friendly minions gain +2/+0 until end of turn.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    const minions = window.Engine.getFriendlyMinions(G, ownerIdx);
    minions.forEach(id => window.Engine.buffMinion(G, id, 2, 0, false));
  },
};

CARD_DEFS['W057'] = {
  id: 'W057', hero: 'warden', name: 'Entangling Vines',
  type: 'instant', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Tap all enemy minions with ATK ≤ 3 for 1 extra upkeep.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    const enemies = window.Engine.getEnemyMinions(G, ownerIdx);
    enemies.forEach(id => {
      const m = window.Engine.getMinion(G, id);
      if (m && m.atk <= 3) window.Engine.tapMinion(G, id, 2);
    });
  },
};

CARD_DEFS['W058'] = {
  id: 'W058', hero: 'warden', name: 'Wild Resilience',
  type: 'instant', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion indestructible until end of turn.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.giveKeyword(G, targets[0], 'indestructible', true);
    window.Engine.addEndOfTurnCleanup(G, { type: 'removeKeyword', cardId: targets[0], keyword: 'indestructible' });
  },
};

CARD_DEFS['W059'] = {
  id: 'W059', hero: 'warden', name: 'Stampede Rush',
  type: 'instant', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'All friendly minions gain trample and +1/+0 until end of turn.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    const minions = window.Engine.getFriendlyMinions(G, ownerIdx);
    minions.forEach(id => {
      window.Engine.buffMinion(G, id, 1, 0, false);
      window.Engine.giveKeyword(G, id, 'trample', true);
      window.Engine.addEndOfTurnCleanup(G, { type: 'removeKeyword', cardId: id, keyword: 'trample' });
    });
  },
};

CARD_DEFS['W060'] = {
  id: 'W060', hero: 'warden', name: "Nature's Wrath",
  type: 'instant', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'Deal damage equal to highest friendly ATK to target minion.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    const friendlies = window.Engine.getFriendlyMinions(G, ownerIdx);
    let maxAtk = 0;
    friendlies.forEach(id => {
      const m = window.Engine.getMinion(G, id);
      if (m && m.atk > maxAtk) maxAtk = m.atk;
    });
    if (maxAtk > 0) window.Engine.dealDamage(G, targets[0], maxAtk, cardId);
  },
};

CARD_DEFS['W061'] = {
  id: 'W061', hero: 'warden', name: 'Lifebloom Burst',
  type: 'instant', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'Heal all friendly minions to full HP.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    const minions = window.Engine.getFriendlyMinions(G, ownerIdx);
    minions.forEach(id => window.Engine.healMinion(G, id, 9999));
  },
};

CARD_DEFS['W062'] = {
  id: 'W062', hero: 'warden', name: "Ancient's Blessing",
  type: 'instant', cost: 6, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +3/+3, trample, and regenerate:2.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.buffMinion(G, targets[0], 3, 3, true);
    window.Engine.giveKeyword(G, targets[0], 'trample', true);
    window.Engine.giveKeyword(G, targets[0], 'regenerate', 2);
  },
};

// ============================================================
// WARDEN SHOP SORCERIES
// ============================================================

CARD_DEFS['W063'] = {
  id: 'W063', hero: 'warden', name: 'Cultivate',
  type: 'sorcery', cost: 1, starter: false, isToken: false,
  kw: {}, text: 'Scout 3.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    window.Engine.scry(G, ownerIdx, 3);
  },
};

CARD_DEFS['W064'] = {
  id: 'W064', hero: 'warden', name: 'Wild Growth',
  type: 'sorcery', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +2/+2.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.buffMinion(G, targets[0], 2, 2, true);
  },
};

CARD_DEFS['W065'] = {
  id: 'W065', hero: 'warden', name: "Nature's Bounty",
  type: 'sorcery', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Heal a friendly minion for 3 HP. Draw a card.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.healMinion(G, targets[0], 3);
    window.Engine.drawCards(G, ownerIdx, 1);
  },
};

CARD_DEFS['W066'] = {
  id: 'W066', hero: 'warden', name: 'Pack Call',
  type: 'sorcery', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Summon two 2/2 Wolf tokens.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    window.Engine.summonToken(G, ownerIdx, 'TK_WOLF');
    window.Engine.summonToken(G, ownerIdx, 'TK_WOLF');
  },
};

CARD_DEFS['W067'] = {
  id: 'W067', hero: 'warden', name: 'Hibernate',
  type: 'sorcery', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Tap a friendly minion. Heal it to full HP. It doesn\'t untap for 1 extra upkeep. Give it shield:3.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.tapMinion(G, targets[0], 2);
    window.Engine.healMinion(G, targets[0], 9999);
    window.Engine.giveKeyword(G, targets[0], 'shield', 3);
  },
};

CARD_DEFS['W068'] = {
  id: 'W068', hero: 'warden', name: 'Feral Command',
  type: 'sorcery', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +3/+0 and trample.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.buffMinion(G, targets[0], 3, 0, true);
    window.Engine.giveKeyword(G, targets[0], 'trample', true);
  },
};

CARD_DEFS['W069'] = {
  id: 'W069', hero: 'warden', name: 'Return to Earth',
  type: 'sorcery', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'Destroy target minion with cost 4 or more.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) {
      const m = window.Engine.getMinion(G, targets[0]);
      if (m && (m.cost || 0) >= 4) window.Engine.destroyMinion(G, targets[0]);
      else window.Engine.log(G, 'Return to Earth fizzles — target costs less than 4.');
    }
  },
};

CARD_DEFS['W070'] = {
  id: 'W070', hero: 'warden', name: 'Verdant Dominion',
  type: 'sorcery', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'Give all friendly minions +1/+0 and +0/+1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    const minions = window.Engine.getFriendlyMinions(G, ownerIdx);
    minions.forEach(id => window.Engine.buffMinion(G, id, 1, 1, true));
  },
};

CARD_DEFS['W071'] = {
  id: 'W071', hero: 'warden', name: 'Summon the Pack',
  type: 'sorcery', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'Summon three 2/2 Wolf tokens.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    window.Engine.summonToken(G, ownerIdx, 'TK_WOLF');
    window.Engine.summonToken(G, ownerIdx, 'TK_WOLF');
    window.Engine.summonToken(G, ownerIdx, 'TK_WOLF');
  },
};

CARD_DEFS['W072'] = {
  id: 'W072', hero: 'warden', name: 'Titanic Growth',
  type: 'sorcery', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +4/+4 and trample.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.buffMinion(G, targets[0], 4, 4, true);
    window.Engine.giveKeyword(G, targets[0], 'trample', true);
  },
};

CARD_DEFS['W073'] = {
  id: 'W073', hero: 'warden', name: 'Natural Order',
  type: 'sorcery', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'Sacrifice a friendly minion. Scout 5. Give player an extra draft pick.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.destroyMinion(G, targets[0]);
    window.Engine.scry(G, ownerIdx, 5);
    window.Engine.extraDraft(G, ownerIdx, 1);
  },
};

CARD_DEFS['W074'] = {
  id: 'W074', hero: 'warden', name: 'Earthquake',
  type: 'sorcery', cost: 6, starter: false, isToken: false,
  kw: {}, text: 'Deal 3 damage to ALL minions. After damage, heal friendly minions with regenerate for 2.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    const all = window.Engine.getAllMinions(G);
    all.forEach(id => window.Engine.dealDamage(G, id, 3, cardId));
    const friendlies = window.Engine.getFriendlyMinions(G, ownerIdx);
    friendlies.forEach(id => {
      const m = window.Engine.getMinion(G, id);
      if (m && m.kw && m.kw.regenerate) window.Engine.healMinion(G, id, 2);
    });
  },
};

CARD_DEFS['W075'] = {
  id: 'W075', hero: 'warden', name: 'Overrun',
  type: 'sorcery', cost: 7, starter: false, isToken: false,
  kw: {}, text: 'All friendly minions gain +3/+3 and trample.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    const minions = window.Engine.getFriendlyMinions(G, ownerIdx);
    minions.forEach(id => {
      window.Engine.buffMinion(G, id, 3, 3, true);
      window.Engine.giveKeyword(G, id, 'trample', true);
    });
  },
};

CARD_DEFS['W076'] = {
  id: 'W076', hero: 'warden', name: 'Genesis Wave',
  type: 'sorcery', cost: 9, starter: false, isToken: false,
  kw: {}, text: 'Reveal top 5 cards of deck. Play all minions revealed for free. Put rest into hand.',
  specialAbility: 'genesisWave',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    // Engine handles complex deck manipulation via specialAbility
  },
};

CARD_DEFS['W077'] = {
  id: 'W077', hero: 'warden', name: 'Primal Cataclysm',
  type: 'sorcery', cost: 10, starter: false, isToken: false,
  kw: {}, text: 'Destroy all minions. For each friendly minion destroyed, summon a 3/3 Elemental token with trample.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    const friendlies = window.Engine.getFriendlyMinions(G, ownerIdx);
    const friendlyCount = friendlies.length;
    const all = window.Engine.getAllMinions(G);
    all.forEach(id => window.Engine.destroyMinion(G, id));
    for (let i = 0; i < friendlyCount; i++) {
      window.Engine.summonToken(G, ownerIdx, 'TK_ELEMENTAL');
    }
  },
};

// ============================================================
// WARDEN SHOP ENCHANTMENTS
// ============================================================

CARD_DEFS['W078'] = {
  id: 'W078', hero: 'warden', name: 'Fertile Ground',
  type: 'enchantment', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Inspire: Heal all friendly minions for 1 HP.',
  battlecry: null, lastBreath: null,
  inspire: (G, cardId, ownerIdx) => {
    const minions = window.Engine.getFriendlyMinions(G, ownerIdx);
    minions.forEach(id => window.Engine.healMinion(G, id, 1));
  },
  rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W079'] = {
  id: 'W079', hero: 'warden', name: 'Law of the Jungle',
  type: 'enchantment', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'When a friendly minion destroys an enemy in combat, it gains +1/+1.',
  specialAbility: 'onKillGainStats',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W080'] = {
  id: 'W080', hero: 'warden', name: "Beastmaster's Mark",
  type: 'enchantment', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'All friendly minions with 4+ ATK have trample.',
  specialAbility: 'aura_trampleIfHighAtk',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W081'] = {
  id: 'W081', hero: 'warden', name: 'Verdant Canopy',
  type: 'enchantment', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'All friendly minions have Thorns 1. When played, give all friendly minions +0/+1.',
  specialAbility: 'aura_thornsAndHpBonus',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    window.Engine.getFriendlyMinions(G, ownerIdx).forEach(m => window.Engine.buffMinion(G, m.uid, 0, 1, true));
  },
};

CARD_DEFS['W082'] = {
  id: 'W082', hero: 'warden', name: 'Thorn Barrier',
  type: 'enchantment', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'All friendly minions have thorns:1.',
  specialAbility: 'aura_thorns1',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W083'] = {
  id: 'W083', hero: 'warden', name: "Nature's Chosen",
  type: 'enchantment', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'When you play a minion, give it +1/+1 (+2/+2 if it has regenerate).',
  specialAbility: 'onFriendlyMinionPlayed',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W084'] = {
  id: 'W084', hero: 'warden', name: 'Wildgrowth Aura',
  type: 'enchantment', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'Inspire: Give all friendly minions +0/+1.',
  battlecry: null, lastBreath: null,
  inspire: (G, cardId, ownerIdx) => {
    const minions = window.Engine.getFriendlyMinions(G, ownerIdx);
    minions.forEach(id => window.Engine.buffMinion(G, id, 0, 1, true));
  },
  rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W085'] = {
  id: 'W085', hero: 'warden', name: 'Aspect of the Predator',
  type: 'enchantment', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'All friendly minions with trample also have piercing:1.',
  specialAbility: 'aura_piercingIfTrample',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W086'] = {
  id: 'W086', hero: 'warden', name: 'Primal Bond',
  type: 'enchantment', cost: 6, starter: false, isToken: false,
  kw: {}, text: 'Whenever a friendly minion heals, give it +1/+0.',
  specialAbility: 'onFriendlyHeal',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['W087'] = {
  id: 'W087', hero: 'warden', name: 'Heart of the Forest',
  type: 'enchantment', cost: 7, starter: false, isToken: false,
  kw: {}, text: 'All friendly minions have regenerate:2 and shield:2. When a shield is consumed, restore it next upkeep.',
  specialAbility: 'aura_regenAndShield_shieldRestoreOnUpkeep',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

// ============================================================
// WARDEN SHOP UPGRADES
// ============================================================

CARD_DEFS['W088'] = {
  id: 'W088', hero: 'warden', name: 'Ironwood Bark',
  type: 'upgrade', cost: 1, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +0/+2 permanently.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.buffMinion(G, targets[0], 0, 2, true);
  },
};

CARD_DEFS['W089'] = {
  id: 'W089', hero: 'warden', name: 'Sharpened Tusks',
  type: 'upgrade', cost: 1, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +1/+0. If it has trample, give +2/+0 instead.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    const m = window.Engine.getMinion(G, targets[0]);
    const bonus = (m && m.kw && m.kw.trample) ? 2 : 1;
    window.Engine.buffMinion(G, targets[0], bonus, 0, true);
  },
};

CARD_DEFS['W090'] = {
  id: 'W090', hero: 'warden', name: 'Regenerative Moss',
  type: 'upgrade', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion regenerate:1. If it already has regenerate, increase by 1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.giveKeyword(G, targets[0], 'regenerate', 1);
  },
};

CARD_DEFS['W091'] = {
  id: 'W091', hero: 'warden', name: 'Thornmail',
  type: 'upgrade', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion thorns:2.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.giveKeyword(G, targets[0], 'thorns', 2);
  },
};

CARD_DEFS['W092'] = {
  id: 'W092', hero: 'warden', name: "Beast's Vigor",
  type: 'upgrade', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +1/+2 permanently.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.buffMinion(G, targets[0], 1, 2, true);
  },
};

CARD_DEFS['W093'] = {
  id: 'W093', hero: 'warden', name: 'Primal Infusion',
  type: 'upgrade', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +2/+2 and frenzy permanently.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.buffMinion(G, targets[0], 2, 2, true);
    window.Engine.giveKeyword(G, targets[0], 'frenzy', true);
  },
};

CARD_DEFS['W094'] = {
  id: 'W094', hero: 'warden', name: 'Trampling Hooves',
  type: 'upgrade', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion trample. If it already has trample, also +2/+0 and piercing:1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    const m = window.Engine.getMinion(G, targets[0]);
    const hadTrample = m && m.kw && m.kw.trample;
    window.Engine.giveKeyword(G, targets[0], 'trample', true);
    if (hadTrample) {
      window.Engine.buffMinion(G, targets[0], 2, 0, true);
      window.Engine.giveKeyword(G, targets[0], 'piercing', 1);
    }
  },
};

CARD_DEFS['W095'] = {
  id: 'W095', hero: 'warden', name: 'Ancient Carapace',
  type: 'upgrade', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion shield:4 and +0/+3 permanently.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.giveKeyword(G, targets[0], 'shield', 4);
    window.Engine.buffMinion(G, targets[0], 0, 3, true);
  },
};

CARD_DEFS['W096'] = {
  id: 'W096', hero: 'warden', name: "Alpha's Mantle",
  type: 'upgrade', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +2/+2 and rally ability.',
  specialAbility: 'grantRally',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.buffMinion(G, targets[0], 2, 2, true);
    // Engine applies rally via specialAbility
  },
};

CARD_DEFS['W097'] = {
  id: 'W097', hero: 'warden', name: 'Heartwood Core',
  type: 'upgrade', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +1/+4 and regenerate:2 permanently.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.buffMinion(G, targets[0], 1, 4, true);
    window.Engine.giveKeyword(G, targets[0], 'regenerate', 2);
  },
};

CARD_DEFS['W098'] = {
  id: 'W098', hero: 'warden', name: 'Elderwood Crown',
  type: 'upgrade', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +3/+3, taunt, and regenerate:1 permanently.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.buffMinion(G, targets[0], 3, 3, true);
    window.Engine.giveKeyword(G, targets[0], 'taunt', true);
    window.Engine.giveKeyword(G, targets[0], 'regenerate', 1);
  },
};

CARD_DEFS['W099'] = {
  id: 'W099', hero: 'warden', name: 'Titanic Endowment',
  type: 'upgrade', cost: 6, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +4/+4, trample, and indestructible permanently. Remove stealth if it has it.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.buffMinion(G, targets[0], 4, 4, true);
    window.Engine.giveKeyword(G, targets[0], 'trample', true);
    window.Engine.giveKeyword(G, targets[0], 'indestructible', true);
    window.Engine.removeKeyword(G, targets[0], 'stealth');
  },
};

CARD_DEFS['W100'] = {
  id: 'W100', hero: 'warden', name: 'Worldsoul Blessing',
  type: 'upgrade', cost: 8, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +5/+5, regenerate:3, trample, and piercing:2 permanently.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.buffMinion(G, targets[0], 5, 5, true);
    window.Engine.giveKeyword(G, targets[0], 'regenerate', 3);
    window.Engine.giveKeyword(G, targets[0], 'trample', true);
    window.Engine.giveKeyword(G, targets[0], 'piercing', 2);
  },
};

// ============================================================
// WARDEN CURSES
// ============================================================

CARD_DEFS['W101'] = {
  id: 'W101', hero: 'warden', name: 'Vine Shackle',
  type: 'curse', cost: 1, starter: false, isToken: false,
  kw: {}, text: 'Target enemy minion loses a random keyword and is tapped.',
  targetType: 'enemy_minion',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.removeRandomKeyword(G, targets[0]);
    window.Engine.tapMinion(G, targets[0]);
  },
};

CARD_DEFS['W102'] = {
  id: 'W102', hero: 'warden', name: 'Briar Hex',
  type: 'curse', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Target enemy minion loses a random keyword. Deal 2 damage to it.',
  targetType: 'enemy_minion',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.removeRandomKeyword(G, targets[0]);
    window.Engine.dealDamage(G, targets[0], 2, null);
  },
};

CARD_DEFS['W103'] = {
  id: 'W103', hero: 'warden', name: 'Nature\'s Judgement',
  type: 'curse', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Choose a keyword. Target enemy minion loses that keyword. Give a friendly minion +1/+1.',
  targetType: 'enemy_minion',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    // keyword choice is handled by the second target (keyword name stored in targets[1])
    if (targets[1]) {
      window.Engine.removeKeyword(G, targets[0], targets[1]);
      const m = window.Engine.getMinion(G, targets[0]);
      if (m) window.Engine.log(G, m.name + ' loses ' + targets[1] + '!');
    } else {
      window.Engine.removeRandomKeyword(G, targets[0]);
    }
    const friendly = window.Engine.getFriendlyMinions(G, ownerIdx);
    if (friendly.length > 0) {
      const r = window.Engine.rand(friendly);
      window.Engine.buffMinion(G, r.uid, 1, 1, true);
    }
  },
};

CARD_DEFS['W104'] = {
  id: 'W104', hero: 'warden', name: 'Overgrowth Curse',
  type: 'curse', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'Target enemy minion loses all keywords. Give it -2/-0.',
  targetType: 'enemy_minion',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.silenceMinion(G, targets[0]);
    window.Engine.buffMinion(G, targets[0], -2, 0, true);
  },
};

CARD_DEFS['W105'] = {
  id: 'W105', hero: 'warden', name: 'Primal Unraveling',
  type: 'curse', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'Target enemy minion loses all keywords. Deal 3 damage to it. Give a random friendly minion +2/+2.',
  targetType: 'enemy_minion',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.silenceMinion(G, targets[0]);
    window.Engine.dealDamage(G, targets[0], 3, null);
    const friendly = G.players[ownerIdx].battlefield.filter(m => m.hp > 0);
    if (friendly.length > 0) {
      const pick = friendly[Math.floor(Math.random() * friendly.length)];
      window.Engine.buffMinion(G, pick.uid, 2, 2, true);
      window.Engine.log(G, pick.name + ' gains +2/+2!');
    }
  },
};

// ============================================================
// SHADOW STARTER DECK
// ============================================================

CARD_DEFS['S001'] = {
  id: 'S001', hero: 'shadow', name: 'Alley Cutpurse',
  type: 'minion', cost: 1, starter: true, isToken: false,
  baseAtk: 2, baseHp: 1, kw: { stealth: true }, text: 'Stealth.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S002'] = {
  id: 'S002', hero: 'shadow', name: 'Gutter Rat',
  type: 'minion', cost: 1, starter: true, isToken: false,
  baseAtk: 1, baseHp: 1, kw: {}, text: 'Last Breath: Summon a 1/1 Rat token.',
  battlecry: null,
  lastBreath: (G, cardId, ownerIdx) => { window.Engine.summonToken(G, ownerIdx, 'TK_RAT'); },
  inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S003'] = {
  id: 'S003', hero: 'shadow', name: 'Goblin Skulker',
  type: 'minion', cost: 2, starter: true, isToken: false,
  baseAtk: 2, baseHp: 2, kw: { stealth: true }, text: 'Stealth.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S004'] = {
  id: 'S004', hero: 'shadow', name: 'Shadow Fang',
  type: 'minion', cost: 2, starter: true, isToken: false,
  baseAtk: 1, baseHp: 2, kw: { deathtouch: true }, text: 'Deathtouch.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S005'] = {
  id: 'S005', hero: 'shadow', name: 'Sewer Pack Leader',
  type: 'minion', cost: 3, starter: true, isToken: false,
  baseAtk: 2, baseHp: 3, kw: {}, text: 'Rally: Give the new minion +1/+0 until end of turn.',
  battlecry: null, lastBreath: null, inspire: null,
  rally: (G, cardId, ownerIdx, newCardId) => {
    if (newCardId) window.Engine.buffMinion(G, newCardId, 1, 0, false);
  },
  surge: null, onPlay: null,
};

CARD_DEFS['S006'] = {
  id: 'S006', hero: 'shadow', name: 'Shiv',
  type: 'instant', cost: 1, starter: true, isToken: false,
  kw: {}, text: 'Deal 2 damage to target minion.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.dealDamage(G, targets[0], 2, cardId);
  },
};

CARD_DEFS['S007'] = {
  id: 'S007', hero: 'shadow', name: 'Backstab',
  type: 'instant', cost: 0, starter: true, isToken: false,
  kw: {}, text: 'Deal 3 damage to a tapped minion.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.dealDamage(G, targets[0], 3, cardId);
  },
};

CARD_DEFS['S008'] = {
  id: 'S008', hero: 'shadow', name: 'From the Shadows',
  type: 'sorcery', cost: 2, starter: true, isToken: false,
  kw: {}, text: 'Summon two 1/1 Goblin tokens.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    window.Engine.summonToken(G, ownerIdx, 'TK_GOBLIN');
    window.Engine.summonToken(G, ownerIdx, 'TK_GOBLIN');
  },
};

CARD_DEFS['S009'] = {
  id: 'S009', hero: 'shadow', name: 'Cheap Shot',
  type: 'instant', cost: 2, starter: true, isToken: false,
  kw: {}, text: 'Deal 1 damage to target minion. Draw a card.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.dealDamage(G, targets[0], 1, cardId);
    window.Engine.drawCards(G, ownerIdx, 1);
  },
};

CARD_DEFS['S010'] = {
  id: 'S010', hero: 'shadow', name: 'Blood Pact',
  type: 'sorcery', cost: 2, starter: true, isToken: false,
  kw: {}, text: 'Sacrifice a friendly minion. Draw 2 cards.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.destroyMinion(G, targets[0]);
    window.Engine.drawCards(G, ownerIdx, 2);
  },
};

// ============================================================
// SHADOW SHOP MINIONS
// ============================================================

CARD_DEFS['S011'] = {
  id: 'S011', hero: 'shadow', name: 'Goblin Arsonist',
  type: 'minion', cost: 1, starter: false, isToken: false,
  baseAtk: 1, baseHp: 1, kw: {}, text: 'Last Breath: Deal 1 damage to a random enemy minion.',
  battlecry: null,
  lastBreath: (G, cardId, ownerIdx) => {
    const enemies = window.Engine.getEnemyMinions(G, ownerIdx);
    if (enemies.length > 0) window.Engine.dealDamage(G, enemies[Math.floor(Math.random() * enemies.length)], 1, cardId);
  },
  inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S012'] = {
  id: 'S012', hero: 'shadow', name: 'Plague Rat',
  type: 'minion', cost: 1, starter: false, isToken: false,
  baseAtk: 1, baseHp: 1, kw: { deathtouch: true }, text: 'Deathtouch.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S013'] = {
  id: 'S013', hero: 'shadow', name: 'Cutthroat Initiate',
  type: 'minion', cost: 1, starter: false, isToken: false,
  baseAtk: 2, baseHp: 1, kw: { stealth: true }, text: 'Stealth.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S014'] = {
  id: 'S014', hero: 'shadow', name: 'Expendable Grunt',
  type: 'minion', cost: 1, starter: false, isToken: false,
  baseAtk: 1, baseHp: 1, kw: {}, text: 'Last Breath: Draw a card.',
  battlecry: null,
  lastBreath: (G, cardId, ownerIdx) => { window.Engine.drawCards(G, ownerIdx, 1); },
  inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S015'] = {
  id: 'S015', hero: 'shadow', name: 'Shadowstep Adept',
  type: 'minion', cost: 1, starter: false, isToken: false,
  baseAtk: 1, baseHp: 2, kw: {}, text: 'Battlecry: Return a friendly minion to hand.',
  battlecry: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.returnToHand(G, targets[0]);
  },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S016'] = {
  id: 'S016', hero: 'shadow', name: 'Goblin Lookout',
  type: 'minion', cost: 1, starter: false, isToken: false,
  baseAtk: 1, baseHp: 2, kw: {}, text: 'Battlecry: Scout 2.',
  battlecry: (G, cardId, ownerIdx) => { window.Engine.scry(G, ownerIdx, 2); },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S017'] = {
  id: 'S017', hero: 'shadow', name: 'Venomtip Assassin',
  type: 'minion', cost: 2, starter: false, isToken: false,
  baseAtk: 2, baseHp: 1, kw: { deathtouch: true, stealth: true }, text: 'Deathtouch. Stealth.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S018'] = {
  id: 'S018', hero: 'shadow', name: 'Sewer Scavenger',
  type: 'minion', cost: 2, starter: false, isToken: false,
  baseAtk: 2, baseHp: 2, kw: {}, text: 'Battlecry: If a friendly minion died this turn, draw a card.',
  battlecry: (G, cardId, ownerIdx) => {
    if (G.turnDeaths && G.turnDeaths[ownerIdx] && G.turnDeaths[ownerIdx] > 0)
      window.Engine.drawCards(G, ownerIdx, 1);
  },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S019'] = {
  id: 'S019', hero: 'shadow', name: 'Twin Blade Rogue',
  type: 'minion', cost: 2, starter: false, isToken: false,
  baseAtk: 3, baseHp: 1, kw: { doubleStrike: true }, text: 'Double Strike.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S020'] = {
  id: 'S020', hero: 'shadow', name: 'Goblin War Drummer',
  type: 'minion', cost: 2, starter: false, isToken: false,
  baseAtk: 1, baseHp: 2, kw: {}, text: 'Rally: Give the new minion +1/+0.',
  battlecry: null, lastBreath: null, inspire: null,
  rally: (G, cardId, ownerIdx, newCardId) => {
    if (newCardId) window.Engine.buffMinion(G, newCardId, 1, 0, false);
  },
  surge: null, onPlay: null,
};

CARD_DEFS['S021'] = {
  id: 'S021', hero: 'shadow', name: 'Corpse Harvester',
  type: 'minion', cost: 2, starter: false, isToken: false,
  baseAtk: 1, baseHp: 3, kw: {}, text: 'Whenever a friendly minion is destroyed, gain +1/+0.',
  specialAbility: 'onFriendlyDeath_gainAtk',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S022'] = {
  id: 'S022', hero: 'shadow', name: 'Lurking Ambusher',
  type: 'minion', cost: 2, starter: false, isToken: false,
  baseAtk: 2, baseHp: 2, kw: { flash: true }, text: 'Flash. Battlecry: Deal 1 damage to target attacking minion.',
  battlecry: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.dealDamage(G, targets[0], 1, cardId);
  },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S023'] = {
  id: 'S023', hero: 'shadow', name: 'Ratcatcher',
  type: 'minion', cost: 2, starter: false, isToken: false,
  baseAtk: 2, baseHp: 3, kw: {}, text: 'Whenever a friendly token is destroyed, gain +1/+0.',
  specialAbility: 'onFriendlyTokenDeath_gainAtk',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S024'] = {
  id: 'S024', hero: 'shadow', name: 'Grave Robber',
  type: 'minion', cost: 3, starter: false, isToken: false,
  baseAtk: 2, baseHp: 2, kw: {}, text: 'Battlecry: Return a random minion from discard pile to hand.',
  specialAbility: 'battlecry_returnFromDiscard',
  battlecry: (G, cardId, ownerIdx) => { /* Engine handles via specialAbility */ },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S025'] = {
  id: 'S025', hero: 'shadow', name: 'Goblin Sapper',
  type: 'minion', cost: 3, starter: false, isToken: false,
  baseAtk: 3, baseHp: 2, kw: {}, text: 'Last Breath: Deal 2 damage to a random enemy minion.',
  battlecry: null,
  lastBreath: (G, cardId, ownerIdx) => {
    const enemies = window.Engine.getEnemyMinions(G, ownerIdx);
    if (enemies.length > 0) window.Engine.dealDamage(G, enemies[Math.floor(Math.random() * enemies.length)], 2, cardId);
  },
  inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S026'] = {
  id: 'S026', hero: 'shadow', name: 'Nightblade Phantom',
  type: 'minion', cost: 3, starter: false, isToken: false,
  baseAtk: 3, baseHp: 2, kw: { stealth: true, menace: true }, text: 'Stealth. Menace.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S027'] = {
  id: 'S027', hero: 'shadow', name: 'Sacrificial Cultist',
  type: 'minion', cost: 3, starter: false, isToken: false,
  baseAtk: 2, baseHp: 3, kw: {}, text: 'Activate: Sacrifice a friendly minion to gain +2/+1. Once per turn.',
  specialAbility: 'activateSacrificeForBuff',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S028'] = {
  id: 'S028', hero: 'shadow', name: 'Swarm Commander',
  type: 'minion', cost: 3, starter: false, isToken: false,
  baseAtk: 1, baseHp: 3, kw: {}, text: 'Rally: Summon a 1/1 Goblin token.',
  battlecry: null, lastBreath: null, inspire: null,
  rally: (G, cardId, ownerIdx) => { window.Engine.summonToken(G, ownerIdx, 'TK_GOBLIN'); },
  surge: null, onPlay: null,
};

CARD_DEFS['S029'] = {
  id: 'S029', hero: 'shadow', name: 'Poison Brewer',
  type: 'minion', cost: 3, starter: false, isToken: false,
  baseAtk: 2, baseHp: 2, kw: {}, text: 'Battlecry: Give a friendly minion deathtouch.',
  battlecry: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.giveKeyword(G, targets[0], 'deathtouch', true);
  },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S030'] = {
  id: 'S030', hero: 'shadow', name: 'Shadow Dancer',
  type: 'minion', cost: 3, starter: false, isToken: false,
  baseAtk: 2, baseHp: 3, kw: {}, text: 'Whenever you sacrifice a friendly minion, deal 1 damage to a random enemy minion.',
  specialAbility: 'onSacrifice_damageEnemy',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S031'] = {
  id: 'S031', hero: 'shadow', name: 'Goblin Berserker',
  type: 'minion', cost: 3, starter: false, isToken: false,
  baseAtk: 4, baseHp: 1, kw: { frenzy: true }, text: 'Frenzy.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S032'] = {
  id: 'S032', hero: 'shadow', name: 'Underboss',
  type: 'minion', cost: 4, starter: false, isToken: false,
  baseAtk: 3, baseHp: 4, kw: {}, text: 'Battlecry: Give all friendly Goblin tokens +1/+1.',
  battlecry: (G, cardId, ownerIdx) => {
    window.Engine.getFriendlyMinions(G, ownerIdx).forEach(id => {
      const m = window.Engine.getMinion(G, id);
      if (m && m.isToken && m.name && m.name.toLowerCase().includes('goblin'))
        window.Engine.buffMinion(G, id, 1, 1, true);
    });
  },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S033'] = {
  id: 'S033', hero: 'shadow', name: 'Tombstalker',
  type: 'minion', cost: 4, starter: false, isToken: false,
  baseAtk: 3, baseHp: 4, kw: {}, text: 'Costs 1 less for each friendly minion that died this turn.',
  specialAbility: 'costReduceOnDeath',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S034'] = {
  id: 'S034', hero: 'shadow', name: 'Blade Dancer',
  type: 'minion', cost: 4, starter: false, isToken: false,
  baseAtk: 3, baseHp: 2, kw: { doubleStrike: true, stealth: true }, text: 'Double Strike. Stealth.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S035'] = {
  id: 'S035', hero: 'shadow', name: 'Soul Leech',
  type: 'minion', cost: 4, starter: false, isToken: false,
  baseAtk: 2, baseHp: 3, kw: { siphon: true, deathtouch: true }, text: 'Siphon. Deathtouch.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S036'] = {
  id: 'S036', hero: 'shadow', name: "Assassin's Guild Master",
  type: 'minion', cost: 4, starter: false, isToken: false,
  baseAtk: 2, baseHp: 4, kw: { stealth: true }, text: 'Stealth. All other friendly minions with stealth gain +1/+0.',
  specialAbility: 'aura_stealthGainAtk',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S037'] = {
  id: 'S037', hero: 'shadow', name: 'Goblin King',
  type: 'minion', cost: 4, starter: false, isToken: false,
  baseAtk: 2, baseHp: 3, kw: {}, text: 'Battlecry: Summon two 1/1 Goblin tokens. Rally: All Goblin tokens gain +1/+0 until end of turn.',
  battlecry: (G, cardId, ownerIdx) => {
    window.Engine.summonToken(G, ownerIdx, 'TK_GOBLIN');
    window.Engine.summonToken(G, ownerIdx, 'TK_GOBLIN');
  },
  lastBreath: null, inspire: null,
  rally: (G, cardId, ownerIdx) => {
    window.Engine.getFriendlyMinions(G, ownerIdx).forEach(id => {
      const m = window.Engine.getMinion(G, id);
      if (m && m.isToken && m.name && m.name.toLowerCase().includes('goblin'))
        window.Engine.buffMinion(G, id, 1, 0, false);
    });
  },
  surge: null, onPlay: null,
};

CARD_DEFS['S038'] = {
  id: 'S038', hero: 'shadow', name: 'Carrion Feeder',
  type: 'minion', cost: 4, starter: false, isToken: false,
  baseAtk: 3, baseHp: 3, kw: {}, text: 'Whenever any minion is destroyed, gain +1/+0.',
  specialAbility: 'onAnyDeath_gainAtk',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S039'] = {
  id: 'S039', hero: 'shadow', name: 'Shadow Revenant',
  type: 'minion', cost: 5, starter: false, isToken: false,
  baseAtk: 4, baseHp: 3, kw: { stealth: true, menace: true }, text: 'Stealth. Menace. Last Breath: Return this card to hand (costs 2 more).',
  specialAbility: 'lastBreathReturnCostIncrease',
  battlecry: null,
  lastBreath: (G, cardId, ownerIdx) => { window.Engine.returnToHand(G, cardId); },
  inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S040'] = {
  id: 'S040', hero: 'shadow', name: 'Reaper of the Fallen',
  type: 'minion', cost: 5, starter: false, isToken: false,
  baseAtk: 3, baseHp: 4, kw: { deathtouch: true }, text: 'Deathtouch. Whenever this destroys a minion, draw a card.',
  specialAbility: 'onKillDraw',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S041'] = {
  id: 'S041', hero: 'shadow', name: 'Blood Ritualist',
  type: 'minion', cost: 5, starter: false, isToken: false,
  baseAtk: 2, baseHp: 4, kw: {}, text: 'Activate: Sacrifice a friendly minion. Draw 2 cards. Once per turn.',
  specialAbility: 'activateSacrificeDraw2',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S042'] = {
  id: 'S042', hero: 'shadow', name: 'Shadowlord',
  type: 'minion', cost: 5, starter: false, isToken: false,
  baseAtk: 4, baseHp: 4, kw: { stealth: true, menace: true }, text: 'Stealth. Menace. Battlecry: Summon a 2/1 Shadow token with stealth.',
  battlecry: (G, cardId, ownerIdx) => { window.Engine.summonToken(G, ownerIdx, 'TK_SHADOW'); },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S043'] = {
  id: 'S043', hero: 'shadow', name: 'Goblin Warlord',
  type: 'minion', cost: 5, starter: false, isToken: false,
  baseAtk: 3, baseHp: 4, kw: {}, text: 'All friendly Goblin tokens have +2/+1 and menace.',
  specialAbility: 'aura_goblinTokenBuff',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S044'] = {
  id: 'S044', hero: 'shadow', name: 'Blightfang Matriarch',
  type: 'minion', cost: 6, starter: false, isToken: false,
  baseAtk: 3, baseHp: 5, kw: { deathtouch: true, menace: true }, text: 'Deathtouch. Menace. Last Breath: Summon three 1/1 Spider tokens with deathtouch.',
  battlecry: null,
  lastBreath: (G, cardId, ownerIdx) => {
    window.Engine.summonToken(G, ownerIdx, 'TK_SPIDER');
    window.Engine.summonToken(G, ownerIdx, 'TK_SPIDER');
    window.Engine.summonToken(G, ownerIdx, 'TK_SPIDER');
  },
  inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S045'] = {
  id: 'S045', hero: 'shadow', name: 'Phantom Executioner',
  type: 'minion', cost: 6, starter: false, isToken: false,
  baseAtk: 5, baseHp: 3, kw: { stealth: true, doubleStrike: true }, text: 'Stealth. Double Strike.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S046'] = {
  id: 'S046', hero: 'shadow', name: 'Relentless Horde',
  type: 'minion', cost: 6, starter: false, isToken: false,
  baseAtk: 4, baseHp: 5, kw: {}, text: 'Battlecry: Summon two 2/2 Goblin Warrior tokens.',
  battlecry: (G, cardId, ownerIdx) => {
    window.Engine.summonToken(G, ownerIdx, 'TK_GOBLIN_WARRIOR');
    window.Engine.summonToken(G, ownerIdx, 'TK_GOBLIN_WARRIOR');
  },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S047'] = {
  id: 'S047', hero: 'shadow', name: "Death's Embrace",
  type: 'minion', cost: 7, starter: false, isToken: false,
  baseAtk: 5, baseHp: 5, kw: { menace: true, siphon: true }, text: 'Menace. Siphon. Whenever this destroys a minion, summon a 1/1 Shade token.',
  specialAbility: 'onKillSummonShade',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S048'] = {
  id: 'S048', hero: 'shadow', name: 'Voidborn Assassin',
  type: 'minion', cost: 7, starter: false, isToken: false,
  baseAtk: 6, baseHp: 5, kw: { stealth: true, deathtouch: true, doubleStrike: true }, text: 'Stealth. Deathtouch. Double Strike.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S049'] = {
  id: 'S049', hero: 'shadow', name: 'Tide of Vermin',
  type: 'minion', cost: 8, starter: false, isToken: false,
  baseAtk: 4, baseHp: 4, kw: {}, text: 'Battlecry: Summon four 2/1 Rat Swarm tokens.',
  battlecry: (G, cardId, ownerIdx) => {
    window.Engine.summonToken(G, ownerIdx, 'TK_RATSWARM');
    window.Engine.summonToken(G, ownerIdx, 'TK_RATSWARM');
    window.Engine.summonToken(G, ownerIdx, 'TK_RATSWARM');
    window.Engine.summonToken(G, ownerIdx, 'TK_RATSWARM');
  },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S050'] = {
  id: 'S050', hero: 'shadow', name: 'The Unseen Hand',
  type: 'minion', cost: 10, starter: false, isToken: false,
  baseAtk: 8, baseHp: 6, kw: { stealth: true, menace: true, doubleStrike: true, piercing: 3 }, text: 'Stealth. Menace. Double Strike. Piercing 3. Battlecry: Destroy target tapped enemy minion.',
  battlecry: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.destroyMinion(G, targets[0]);
  },
  lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

// ============================================================
// SHADOW SHOP INSTANTS
// ============================================================

CARD_DEFS['S051'] = {
  id: 'S051', hero: 'shadow', name: 'Poisoned Blade',
  type: 'instant', cost: 1, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion deathtouch until end of turn.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.giveKeyword(G, targets[0], 'deathtouch', true);
    window.Engine.addEndOfTurnCleanup(G, { type: 'removeKeyword', cardId: targets[0], keyword: 'deathtouch' });
  },
};

CARD_DEFS['S052'] = {
  id: 'S052', hero: 'shadow', name: 'Smoke Bomb',
  type: 'instant', cost: 1, starter: false, isToken: false,
  kw: {}, text: 'Target friendly minion gains stealth until end of turn.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.giveKeyword(G, targets[0], 'stealth', true);
    window.Engine.addEndOfTurnCleanup(G, { type: 'removeKeyword', cardId: targets[0], keyword: 'stealth' });
  },
};

CARD_DEFS['S053'] = {
  id: 'S053', hero: 'shadow', name: 'Deadly Riposte',
  type: 'instant', cost: 1, starter: false, isToken: false,
  kw: {}, text: 'Deal 2 damage to target attacking minion.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.dealDamage(G, targets[0], 2, cardId);
  },
};

CARD_DEFS['S054'] = {
  id: 'S054', hero: 'shadow', name: 'Gut Punch',
  type: 'instant', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Deal 3 damage to target minion. If destroyed, draw a card.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.dealDamage(G, targets[0], 3, cardId);
    if (!window.Engine.getMinion(G, targets[0])) window.Engine.drawCards(G, ownerIdx, 1);
  },
};

CARD_DEFS['S055'] = {
  id: 'S055', hero: 'shadow', name: 'Vanish',
  type: 'instant', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Return a friendly minion to hand. Draw a card.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.returnToHand(G, targets[0]);
    window.Engine.drawCards(G, ownerIdx, 1);
  },
};

CARD_DEFS['S056'] = {
  id: 'S056', hero: 'shadow', name: 'Mark for Death',
  type: 'instant', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Target minion loses all keywords until end of turn. Deal 1 damage to it.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.silenceMinion(G, targets[0]);
    window.Engine.dealDamage(G, targets[0], 1, cardId);
  },
};

CARD_DEFS['S057'] = {
  id: 'S057', hero: 'shadow', name: 'Crimson Vial',
  type: 'instant', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Heal a friendly minion for 3 HP. It gains +1/+0 until end of turn.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.healMinion(G, targets[0], 3);
    window.Engine.buffMinion(G, targets[0], 1, 0, false);
  },
};

CARD_DEFS['S058'] = {
  id: 'S058', hero: 'shadow', name: 'Shadow Strike',
  type: 'instant', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Deal 5 damage to an undamaged minion (at full HP).',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.dealDamage(G, targets[0], 5, cardId);
  },
};

CARD_DEFS['S059'] = {
  id: 'S059', hero: 'shadow', name: 'Feeding Frenzy',
  type: 'instant', cost: 3, starter: false, isToken: false,
  targetType: 'none', // multi-target spell, not single-target
  kw: {}, text: 'Sacrifice any number of friendly minions. Deal 1 damage to target minion per sacrifice.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || targets.length < 2) return;
    const damageTarget = targets[0];
    const sacrifices = targets.slice(1);
    sacrifices.forEach(id => window.Engine.destroyMinion(G, id));
    window.Engine.dealDamage(G, damageTarget, sacrifices.length, cardId);
  },
};

CARD_DEFS['S060'] = {
  id: 'S060', hero: 'shadow', name: 'Dark Pact',
  type: 'instant', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Sacrifice a friendly minion. Draw 3 cards.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.destroyMinion(G, targets[0]);
    window.Engine.drawCards(G, ownerIdx, 3);
  },
};

CARD_DEFS['S061'] = {
  id: 'S061', hero: 'shadow', name: 'Blade Flurry',
  type: 'instant', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'Deal 2 damage to all enemy minions.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    window.Engine.getEnemyMinions(G, ownerIdx).forEach(id => window.Engine.dealDamage(G, id, 2, cardId));
  },
};

CARD_DEFS['S062'] = {
  id: 'S062', hero: 'shadow', name: 'Cloak of Shadows',
  type: 'instant', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'All friendly minions gain stealth and hexproof until end of turn.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    window.Engine.getFriendlyMinions(G, ownerIdx).forEach(id => {
      window.Engine.giveKeyword(G, id, 'stealth', true);
      window.Engine.giveKeyword(G, id, 'hexproof', true);
      window.Engine.addEndOfTurnCleanup(G, { type: 'removeKeyword', cardId: id, keyword: 'stealth' });
      window.Engine.addEndOfTurnCleanup(G, { type: 'removeKeyword', cardId: id, keyword: 'hexproof' });
    });
  },
};

CARD_DEFS['S063'] = {
  id: 'S063', hero: 'shadow', name: 'Assassinate',
  type: 'instant', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'Destroy target minion.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.destroyMinion(G, targets[0]);
  },
};

CARD_DEFS['S064'] = {
  id: 'S064', hero: 'shadow', name: 'Mass Hysteria',
  type: 'instant', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'Each enemy minion deals damage equal to its ATK to another random enemy minion.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    const enemies = window.Engine.getEnemyMinions(G, ownerIdx);
    if (enemies.length < 2) return;
    enemies.forEach(id => {
      const m = window.Engine.getMinion(G, id);
      if (!m) return;
      const others = enemies.filter(o => o !== id);
      if (others.length) window.Engine.dealDamage(G, others[Math.floor(Math.random() * others.length)], m.atk, id);
    });
  },
};

CARD_DEFS['S065'] = {
  id: 'S065', hero: 'shadow', name: 'Lethal Toxin',
  type: 'instant', cost: 6, starter: false, isToken: false,
  kw: {}, text: 'Destroy all enemy minions with 3 or less HP. Draw a card for each destroyed.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    let count = 0;
    window.Engine.getEnemyMinions(G, ownerIdx).forEach(id => {
      const m = window.Engine.getMinion(G, id);
      if (m && m.hp <= 3) { window.Engine.destroyMinion(G, id); count++; }
    });
    if (count > 0) window.Engine.drawCards(G, ownerIdx, count);
  },
};

// ============================================================
// SHADOW SHOP SORCERIES
// ============================================================

CARD_DEFS['S066'] = {
  id: 'S066', hero: 'shadow', name: 'Call the Swarm',
  type: 'sorcery', cost: 1, starter: false, isToken: false,
  kw: {}, text: 'Summon two 1/1 Rat tokens.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    window.Engine.summonToken(G, ownerIdx, 'TK_RAT');
    window.Engine.summonToken(G, ownerIdx, 'TK_RAT');
  },
};

CARD_DEFS['S067'] = {
  id: 'S067', hero: 'shadow', name: 'Graveyard Shift',
  type: 'sorcery', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Return up to 2 minions from discard pile to hand.',
  specialAbility: 'returnFromDiscard_2',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => { /* Engine handles discard access */ },
};

CARD_DEFS['S068'] = {
  id: 'S068', hero: 'shadow', name: 'Shallow Graves',
  type: 'sorcery', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Summon 1/1 copies of all friendly minions that died this turn. They are exiled when destroyed.',
  specialAbility: 'shallowGraves',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => { /* Engine handles via specialAbility */ },
};

CARD_DEFS['S069'] = {
  id: 'S069', hero: 'shadow', name: 'Goblin Conscription',
  type: 'sorcery', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Summon three 1/1 Goblin tokens.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    window.Engine.summonToken(G, ownerIdx, 'TK_GOBLIN');
    window.Engine.summonToken(G, ownerIdx, 'TK_GOBLIN');
    window.Engine.summonToken(G, ownerIdx, 'TK_GOBLIN');
  },
};

CARD_DEFS['S070'] = {
  id: 'S070', hero: 'shadow', name: 'Dark Harvest',
  type: 'sorcery', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Sacrifice all friendly tokens. Draw a card for each sacrificed.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    let count = 0;
    window.Engine.getFriendlyMinions(G, ownerIdx).forEach(id => {
      const m = window.Engine.getMinion(G, id);
      if (m && m.isToken) { window.Engine.destroyMinion(G, id); count++; }
    });
    if (count > 0) window.Engine.drawCards(G, ownerIdx, count);
  },
};

CARD_DEFS['S071'] = {
  id: 'S071', hero: 'shadow', name: 'Shadow Network',
  type: 'sorcery', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'Draw a card for each friendly stealth minion. Give all friendly minions stealth until end of turn.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    const friendlies = window.Engine.getFriendlyMinions(G, ownerIdx);
    let stealthCount = 0;
    friendlies.forEach(id => {
      const m = window.Engine.getMinion(G, id);
      if (m && m.kw && m.kw.stealth) stealthCount++;
    });
    if (stealthCount > 0) window.Engine.drawCards(G, ownerIdx, stealthCount);
    friendlies.forEach(id => {
      window.Engine.giveKeyword(G, id, 'stealth', true);
      window.Engine.addEndOfTurnCleanup(G, { type: 'removeKeyword', cardId: id, keyword: 'stealth' });
    });
  },
};

CARD_DEFS['S072'] = {
  id: 'S072', hero: 'shadow', name: 'Restock the Arsenal',
  type: 'sorcery', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'Shuffle all cards removed from game back into shop. Scout 3. Draw a card.',
  specialAbility: 'restockShop',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    window.Engine.scry(G, ownerIdx, 3);
    window.Engine.drawCards(G, ownerIdx, 1);
  },
};

CARD_DEFS['S073'] = {
  id: 'S073', hero: 'shadow', name: 'Army of the Damned',
  type: 'sorcery', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'Summon five 1/1 Skeleton tokens. If you control 5+ minions, they gain +1/+1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    const hasFive = window.Engine.getFriendlyMinions(G, ownerIdx).length >= 5;
    for (let i = 0; i < 5; i++) window.Engine.summonToken(G, ownerIdx, 'TK_SKELETON');
    if (hasFive) {
      const post = window.Engine.getFriendlyMinions(G, ownerIdx);
      post.slice(-5).forEach(id => window.Engine.buffMinion(G, id, 1, 1, true));
    }
  },
};

CARD_DEFS['S074'] = {
  id: 'S074', hero: 'shadow', name: 'Bloodletting Ritual',
  type: 'sorcery', cost: 5, starter: false, isToken: false,
  kw: {}, text: "Sacrifice a friendly minion. Give all other friendly minions +ATK/+0 (ATK = sacrificed minion's ATK).",
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    const m = window.Engine.getMinion(G, targets[0]);
    const atk = m ? m.atk : 0;
    window.Engine.destroyMinion(G, targets[0]);
    if (atk > 0) window.Engine.getFriendlyMinions(G, ownerIdx).forEach(id => window.Engine.buffMinion(G, id, atk, 0, true));
  },
};

CARD_DEFS['S075'] = {
  id: 'S075', hero: 'shadow', name: 'Reign of Chaos',
  type: 'sorcery', cost: 6, starter: false, isToken: false,
  kw: {}, text: 'Deal 2 damage to all enemy minions. Summon a 1/1 Goblin token for each enemy minion destroyed.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    let destroyed = 0;
    window.Engine.getEnemyMinions(G, ownerIdx).forEach(id => {
      const before = window.Engine.getMinion(G, id);
      window.Engine.dealDamage(G, id, 2, cardId);
      if (before && !window.Engine.getMinion(G, id)) destroyed++;
    });
    for (let i = 0; i < destroyed; i++) window.Engine.summonToken(G, ownerIdx, 'TK_GOBLIN');
  },
};

CARD_DEFS['S076'] = {
  id: 'S076', hero: 'shadow', name: 'Coup de Grace',
  type: 'sorcery', cost: 6, starter: false, isToken: false,
  kw: {}, text: 'Destroy target minion. Summon a 4/4 Phantom token with stealth and menace.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.destroyMinion(G, targets[0]);
    window.Engine.summonToken(G, ownerIdx, 'TK_PHANTOM');
  },
};

CARD_DEFS['S077'] = {
  id: 'S077', hero: 'shadow', name: 'Apocalypse Swarm',
  type: 'sorcery', cost: 8, starter: false, isToken: false,
  kw: {}, text: 'Destroy ALL minions. Summon a 1/1 Rat token for each destroyed.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => {
    const all = window.Engine.getAllMinions(G);
    const count = all.length;
    all.forEach(id => window.Engine.destroyMinion(G, id));
    for (let i = 0; i < count; i++) window.Engine.summonToken(G, ownerIdx, 'TK_RAT');
  },
};

CARD_DEFS['S078'] = {
  id: 'S078', hero: 'shadow', name: "Death's Dominion",
  type: 'sorcery', cost: 10, starter: false, isToken: false,
  kw: {}, text: 'Return all minions from your discard pile to battlefield. At end of turn, sacrifice them all.',
  specialAbility: 'deathsDominion',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx) => { /* Engine handles via specialAbility */ },
};

// ============================================================
// SHADOW SHOP ENCHANTMENTS
// ============================================================

CARD_DEFS['S079'] = {
  id: 'S079', hero: 'shadow', name: 'Goblin Warcamp',
  type: 'enchantment', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'All friendly Goblin tokens gain +1/+0.',
  specialAbility: 'aura_goblinToken_atkBuff',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S080'] = {
  id: 'S080', hero: 'shadow', name: 'Shadows of Paranoia',
  type: 'enchantment', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Whenever an enemy minion enters the battlefield, deal 1 damage to it.',
  specialAbility: 'onEnemyEnter_damage1',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S081'] = {
  id: 'S081', hero: 'shadow', name: "Thieves' Guild",
  type: 'enchantment', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Whenever a friendly stealth minion deals combat damage to the enemy hero, draw a card.',
  specialAbility: 'onStealthDamageHero_draw',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S082'] = {
  id: 'S082', hero: 'shadow', name: 'Rite of the Blood Moon',
  type: 'enchantment', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Whenever a friendly minion is destroyed, deal 1 damage to a random enemy minion.',
  specialAbility: 'onFriendlyDeath_damageEnemy',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S083'] = {
  id: 'S083', hero: 'shadow', name: 'Altar of Sacrifice',
  type: 'enchantment', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'Once per turn, sacrifice a friendly minion to draw 2 cards.',
  specialAbility: 'activateAltarSacrifice',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S084'] = {
  id: 'S084', hero: 'shadow', name: 'Plague Spreader',
  type: 'enchantment', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'When a friendly deathtouch minion is destroyed, give deathtouch to a random friendly minion without it.',
  specialAbility: 'onDeathtouchDeath_spread',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S085'] = {
  id: 'S085', hero: 'shadow', name: 'Unending Horde',
  type: 'enchantment', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'Whenever a friendly token is destroyed, summon a 1/1 Rat token at end of turn.',
  specialAbility: 'onTokenDeath_summonRat',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S086'] = {
  id: 'S086', hero: 'shadow', name: 'Feast of Souls',
  type: 'enchantment', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'When you sacrifice a friendly minion, give all other friendly minions +1/+1.',
  specialAbility: 'onSacrifice_buffOthers',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

CARD_DEFS['S087'] = {
  id: 'S087', hero: 'shadow', name: 'Shadow Dominion',
  type: 'enchantment', cost: 6, starter: false, isToken: false,
  kw: {}, text: 'All friendly minions have menace. Friendly stealth minions have first strike on the turn they enter.',
  specialAbility: 'aura_menace_stealthFirstStrike',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null, onPlay: null,
};

// ============================================================
// SHADOW SHOP UPGRADES
// ============================================================

CARD_DEFS['S088'] = {
  id: 'S088', hero: 'shadow', name: 'Envenom',
  type: 'upgrade', cost: 1, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion deathtouch.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.giveKeyword(G, targets[0], 'deathtouch', true);
  },
};

CARD_DEFS['S089'] = {
  id: 'S089', hero: 'shadow', name: 'Shadowed Cloak',
  type: 'upgrade', cost: 1, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion stealth.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.giveKeyword(G, targets[0], 'stealth', true);
  },
};

CARD_DEFS['S090'] = {
  id: 'S090', hero: 'shadow', name: 'Serrated Edge',
  type: 'upgrade', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +2/+0 permanently.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.buffMinion(G, targets[0], 2, 0, true);
  },
};

CARD_DEFS['S091'] = {
  id: 'S091', hero: 'shadow', name: "Assassin's Training",
  type: 'upgrade', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +1/+1, menace, and stealth permanently.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.buffMinion(G, targets[0], 1, 1, true);
    window.Engine.giveKeyword(G, targets[0], 'menace', true);
    window.Engine.giveKeyword(G, targets[0], 'stealth', true);
  },
};

CARD_DEFS['S092'] = {
  id: 'S092', hero: 'shadow', name: 'Soul Siphon Blade',
  type: 'upgrade', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion siphon and +1/+0 permanently.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.giveKeyword(G, targets[0], 'siphon', true);
    window.Engine.buffMinion(G, targets[0], 1, 0, true);
  },
};

CARD_DEFS['S093'] = {
  id: 'S093', hero: 'shadow', name: 'Goblin Engineering',
  type: 'upgrade', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +1/+2 and Last Breath: Summon two 1/1 Goblin tokens.',
  specialAbility: 'grantLastBreath_goblinTokens',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.buffMinion(G, targets[0], 1, 2, true);
  },
};

CARD_DEFS['S094'] = {
  id: 'S094', hero: 'shadow', name: 'Twin Blades',
  type: 'upgrade', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion doubleStrike. Reduce its HP by 1.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.giveKeyword(G, targets[0], 'doubleStrike', true);
    window.Engine.buffMinion(G, targets[0], 0, -1, true);
  },
};

CARD_DEFS['S095'] = {
  id: 'S095', hero: 'shadow', name: 'Death Mark',
  type: 'upgrade', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion deathtouch and menace permanently.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.giveKeyword(G, targets[0], 'deathtouch', true);
    window.Engine.giveKeyword(G, targets[0], 'menace', true);
  },
};

CARD_DEFS['S096'] = {
  id: 'S096', hero: 'shadow', name: 'Shadowmeld Armor',
  type: 'upgrade', cost: 3, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +0/+3, stealth, and "When this loses stealth, gain +2/+0 until end of turn."',
  specialAbility: 'onStealthLost_gainAtk',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.buffMinion(G, targets[0], 0, 3, true);
    window.Engine.giveKeyword(G, targets[0], 'stealth', true);
  },
};

CARD_DEFS['S097'] = {
  id: 'S097', hero: 'shadow', name: 'Blood Frenzy',
  type: 'upgrade', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +2/+1 and frenzy permanently.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.buffMinion(G, targets[0], 2, 1, true);
    window.Engine.giveKeyword(G, targets[0], 'frenzy', true);
  },
};

CARD_DEFS['S098'] = {
  id: 'S098', hero: 'shadow', name: "Lich's Bargain",
  type: 'upgrade', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +3/+3 and Last Breath: Return this minion to hand.',
  specialAbility: 'grantLastBreath_returnToHand',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (targets && targets[0]) window.Engine.buffMinion(G, targets[0], 3, 3, true);
  },
};

CARD_DEFS['S099'] = {
  id: 'S099', hero: 'shadow', name: 'Phantom Shroud',
  type: 'upgrade', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +2/+2, stealth, doubleStrike, and menace permanently.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.buffMinion(G, targets[0], 2, 2, true);
    window.Engine.giveKeyword(G, targets[0], 'stealth', true);
    window.Engine.giveKeyword(G, targets[0], 'doubleStrike', true);
    window.Engine.giveKeyword(G, targets[0], 'menace', true);
  },
};

CARD_DEFS['S100'] = {
  id: 'S100', hero: 'shadow', name: "Kingslayer's Edge",
  type: 'upgrade', cost: 7, starter: false, isToken: false,
  kw: {}, text: 'Give a friendly minion +4/+2, doubleStrike, piercing:3, and deathtouch permanently.',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.buffMinion(G, targets[0], 4, 2, true);
    window.Engine.giveKeyword(G, targets[0], 'doubleStrike', true);
    window.Engine.giveKeyword(G, targets[0], 'piercing', 3);
    window.Engine.giveKeyword(G, targets[0], 'deathtouch', true);
  },
};

// ============================================================
// SHADOW CURSES
// ============================================================

CARD_DEFS['S101'] = {
  id: 'S101', hero: 'shadow', name: 'Poison Dart',
  type: 'curse', cost: 1, starter: false, isToken: false,
  kw: {}, text: 'Target enemy minion loses a random keyword. Deal 1 damage to it.',
  targetType: 'enemy_minion',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.removeRandomKeyword(G, targets[0]);
    window.Engine.dealDamage(G, targets[0], 1, null);
  },
};

CARD_DEFS['S102'] = {
  id: 'S102', hero: 'shadow', name: 'Hex of Frailty',
  type: 'curse', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Target enemy minion loses a random keyword and gets -1/-1.',
  targetType: 'enemy_minion',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.removeRandomKeyword(G, targets[0]);
    window.Engine.buffMinion(G, targets[0], -1, -1, true);
  },
};

CARD_DEFS['S103'] = {
  id: 'S103', hero: 'shadow', name: 'Shadow Mark',
  type: 'curse', cost: 2, starter: false, isToken: false,
  kw: {}, text: 'Choose a keyword. Target enemy minion loses that keyword. Draw a card.',
  targetType: 'enemy_minion',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    if (targets[1]) {
      window.Engine.removeKeyword(G, targets[0], targets[1]);
      const m = window.Engine.getMinion(G, targets[0]);
      if (m) window.Engine.log(G, m.name + ' loses ' + targets[1] + '!');
    } else {
      window.Engine.removeRandomKeyword(G, targets[0]);
    }
    window.Engine.drawCards(G, ownerIdx, 1);
  },
};

CARD_DEFS['S104'] = {
  id: 'S104', hero: 'shadow', name: 'Unmaking',
  type: 'curse', cost: 4, starter: false, isToken: false,
  kw: {}, text: 'Target enemy minion loses all keywords and gets -2/-2.',
  targetType: 'enemy_minion',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    window.Engine.silenceMinion(G, targets[0]);
    window.Engine.buffMinion(G, targets[0], -2, -2, true);
  },
};

CARD_DEFS['S105'] = {
  id: 'S105', hero: 'shadow', name: 'Soul Shred',
  type: 'curse', cost: 5, starter: false, isToken: false,
  kw: {}, text: 'Target enemy minion loses all keywords. Deal damage to it equal to its attack.',
  targetType: 'enemy_minion',
  battlecry: null, lastBreath: null, inspire: null, rally: null, surge: null,
  onPlay: (G, cardId, ownerIdx, targets) => {
    if (!targets || !targets[0]) return;
    const m = window.Engine.getMinion(G, targets[0]);
    if (!m) return;
    const atk = window.Engine.getEffectiveAtk(m);
    window.Engine.silenceMinion(G, targets[0]);
    if (atk > 0) window.Engine.dealDamage(G, targets[0], atk, null);
  },
};
