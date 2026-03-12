'use strict';

// ============================================================
// SHATTERED REALMS — Game Engine
// ============================================================
// All game state lives in a single G object.
// Engine functions mutate G and never touch the DOM.
// ============================================================

window.Engine = (function () {

  // ── Unique ID counter ─────────────────────────────────────
  let _uidCounter = 1;
  function nextUid() { return 'c' + (_uidCounter++); }

  // ── Helpers ───────────────────────────────────────────────
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  // ── Card Instantiation ────────────────────────────────────
  function instantiateCard(defId, ownerIdx) {
    const def = window.CARD_DEFS[defId] || window.TOKEN_DEFS[defId];
    if (!def) throw new Error('Unknown card def: ' + defId);
    const inst = {
      uid: nextUid(),
      defId: defId,
      id: defId,
      hero: def.hero,
      name: def.name,
      type: def.type,
      cost: def.cost || 0,
      isToken: def.isToken || false,
      exileOnDeath: def.exileOnDeath || false,
      // Minion stats
      baseAtk: def.baseAtk || 0,
      baseHp: def.baseHp || 0,
      atk: def.baseAtk || 0,
      hp: def.baseHp || 0,
      maxHp: def.baseHp || 0,
      // Keywords
      kw: Object.assign({}, def.kw || {}),
      tempKw: {},
      silenced: false,
      // Battlefield state (minions only)
      owner: ownerIdx,
      tapped: false,  // minions enter untapped
      frozenTurns: 0,
      cannotBeBlockedThisTurn: false,
      enteredThisTurn: true,
      hasAttackedThisTurn: false,
      hasUsedAbilityThisTurn: false,
      frenzyCanAttackAgain: false,
      // Temp stats (cleared each turn)
      tempAtk: 0,
      tempHp: 0,      // temporary max hp increase until end of turn
      // Shield / Ward
      shieldCharges: def.kw && def.kw.shield ? def.kw.shield : 0,
      wardCharges: def.kw && def.kw.ward ? def.kw.ward : 0,
      // Extra abilities from upgrades
      extraAbilities: [],
      // Cost modifiers
      costModifier: 0,
      // Special flags
      returnToHandOnDeath: false,
      returnCostIncrease: 0,
      doubleEntryTap: def.specialAbility === 'doubleEntryTap',
      specialAbility: def.specialAbility || null,
      // Card text (effect description)
      text: def.text || '',
      // Tracking
      damageDealtThisCombat: 0,
      lostStealthThisTurn: false,
      // Upgrade tracking — persists through death/discard/hand
      upgrades: [],  // array of { defId, atkBuff, hpBuff, keywords: { key: value } }
    };
    // Double-entry tap (certain legendary minions)
    if (inst.doubleEntryTap) inst.frozenTurns = 1; // will stay tapped for 2 upkeeps
    return inst;
  }

  // ── Build Decks ───────────────────────────────────────────
  function buildDecks(hero) {
    const allDefs = Object.values(window.CARD_DEFS).filter(d => d.hero === hero);
    const starterIds = allDefs.filter(d => d.starter).map(d => d.id);
    const shopIds = allDefs.filter(d => !d.starter).map(d => d.id);
    return { starterIds, shopIds };
  }

  // ── Create Game State ─────────────────────────────────────
  function createGame(hero0, hero1, gameMode) {
    _uidCounter = 1;
    const decks0 = buildDecks(hero0);
    const decks1 = buildDecks(hero1);

    function makePlayer(idx, hero, decks) {
      // Build draw deck from starter cards
      const drawPile = shuffle(decks.starterIds.map(id => instantiateCard(id, idx)));
      // Build shop deck from shop cards
      const shopDeck = shuffle(decks.shopIds.map(id => instantiateCard(id, idx)));
      // Reveal first 3 shop cards
      const shopRow = shopDeck.splice(0, 3);
      return {
        idx,
        hero,
        health: 20,
        mana: { current: 5, max: 5 },
        insight: 0,
        hand: [],
        deck: drawPile,
        discard: [],
        shopDeck,
        shopRow,
        maxHandSize: 5,
        enchantments: [],    // active enchantment card instances on the field
        // Per-turn tracking
        hasInitiatedCombat: false,
        minionsDiedThisTurn: 0,
        spellsPlayedThisTurn: 0,
        instantsPlayedThisTurn: 0,
        // Misc
        altarUsedThisTurn: false,
        shieldsToRestoreNextUpkeep: [],
        handSizeBonus: 0,
        extraManaNextUpkeep: 0,
        arcaneSupremacyActive: false, // sorcery M077
        omniscienceActive: false,     // sorcery M078 cost reduction
        spellEchoAvailable: false,    // M082
        firstInstantDiscountUsed: false, // M082
      };
    }

    const G = {
      players: [
        makePlayer(0, hero0, decks0),
        makePlayer(1, hero1, decks1),
      ],
      battlefield: [],       // live minion instances (all players)
      attackers: [],         // UIDs of declared attackers
      blockers: {},          // { attackerUid: [blockerUid, ...] }
      damageOrder: {},       // { attackerUid: [blockerUid, ...] } player-assigned
      activePlayer: 0,
      turn: 1,
      phase: 'setup',        // setup | upkeep | action | combat | endTurn | draft | gameOver
      combatStep: null,
      stack: [],
      endOfTurnCleanup: [],  // { type, uid, keyword, value, stat, amount }
      winner: null,
      gameOver: false,
      log: [],
      gameMode: gameMode || 'singleplayer',
      aiPlayerIdx: 1,
      firstTurnFirstPlayer: true, // first player skips draft on turn 1
      // UI prompts
      pendingAction: null,   // { type, resolve } — waiting for user input
      nextStackId: 1,
      // Priority system
      priorityPlayer: null,
      waitingForPriority: false,
    };

    return G;
  }

  // ── Logging ───────────────────────────────────────────────
  function log(G, msg) {
    G.log.push(msg);
    if (G.log.length > 200) G.log.shift();
    if (window.UI && window.UI.appendLog) window.UI.appendLog(msg);
  }

  // ── Win Condition Check ───────────────────────────────────
  function checkWinConditions(G) {
    if (G.gameOver) return;
    for (let i = 0; i < 2; i++) {
      const p = G.players[i];
      const opp = G.players[1 - i];
      if (p.hero === 'archmage' && p.insight >= 50) {
        endGame(G, i, 'insight');
        return;
      }
    }
    for (let i = 0; i < 2; i++) {
      if (G.players[i].health <= 0) {
        endGame(G, 1 - i, 'health');
        return;
      }
    }
  }

  function endGame(G, winnerIdx, reason) {
    G.gameOver = true;
    G.winner = winnerIdx;
    G.phase = 'gameOver';
    const heroNames = { warden: 'The Warden', shadow: 'The Shadow', archmage: 'The Archmage' };
    const wn = heroNames[G.players[winnerIdx].hero];
    const msg = reason === 'insight'
      ? `${wn} achieves Arcane Transcendence with 50 Insight! VICTORY!`
      : `${wn} wins by reducing the enemy hero to 0 health!`;
    log(G, '🏆 ' + msg);
    // SFX: victory/defeat based on human player perspective
    if (window.SFX) {
      const humanWon = (window.UI && window.UI.getHumanIdx) ? winnerIdx === window.UI.getHumanIdx() : true;
      window.SFX.play(humanWon ? 'victory' : 'defeat');
    }
    if (window.UI && window.UI.onGameOver) window.UI.onGameOver(winnerIdx, msg);
  }

  // ── Phase: Setup (initial draw) ───────────────────────────
  function startGame(G) {
    if (window.SFX) window.SFX.play('game_start');
    log(G, '⚔️ Shattered Realms begins!');
    log(G, `Player 1: ${G.players[0].hero.toUpperCase()} vs Player 2: ${G.players[1].hero.toUpperCase()}`);
    // Draw starting hands (5 cards each)
    drawCards(G, 0, 5);
    drawCards(G, 1, 5);
    G.phase = 'upkeep';
    G.activePlayer = 0;
    doUpkeep(G);
  }

  // ── Phase: Upkeep ─────────────────────────────────────────
  function doUpkeep(G) {
    const idx = G.activePlayer;
    const p = G.players[idx];
    G.phase = 'upkeep';
    if (window.SFX) window.SFX.play('turn_start');
    log(G, `--- Turn ${G.turn} | ${heroName(G, idx)}'s Turn ---`);

    // Mana growth & replenish
    p.mana.max += 1;
    p.mana.current = p.mana.max + p.extraManaNextUpkeep;
    p.extraManaNextUpkeep = 0;
    log(G, `${heroName(G, idx)} mana: ${p.mana.current}/${p.mana.max}`);

    // Untap minions
    const friendly = getFriendlyMinions(G, idx);
    for (const m of friendly) {
      if (m.frozenTurns > 0) {
        m.frozenTurns--;
        if (m.frozenTurns === 0) {
          m.tapped = false;
          log(G, `${m.name} thaws out.`);
        }
      } else {
        m.tapped = false;
      }
    }

    // Reset per-turn flags
    p.hasInitiatedCombat = false;
    p.minionsDiedThisTurn = 0;
    p.spellsPlayedThisTurn = 0;
    p.instantsPlayedThisTurn = 0;
    p.altarUsedThisTurn = false;
    p.firstInstantDiscountUsed = false;
    for (const m of friendly) {
      m.hasAttackedThisTurn = false;
      m.hasUsedAbilityThisTurn = false;
      m.frenzyCanAttackAgain = false;
      m.enteredThisTurn = false;
      m.cannotBeBlockedThisTurn = false;
      m.lostStealthThisTurn = false;
      m.damageDealtThisCombat = 0;
    }

    // Shield restore (Heart of the Forest)
    for (const uid of p.shieldsToRestoreNextUpkeep) {
      const m = getMinion(G, uid);
      if (m) {
        const baseShield = (window.CARD_DEFS[m.defId] && window.CARD_DEFS[m.defId].kw && window.CARD_DEFS[m.defId].kw.shield) || 0;
        if (baseShield > 0) m.shieldCharges = baseShield;
      }
    }
    p.shieldsToRestoreNextUpkeep = [];

    // Regenerate
    for (const m of friendly) {
      const reg = getKw(m, 'regenerate');
      if (reg > 0) {
        if (window.SFX) window.SFX.play('regenerate');
        healMinion(G, m.uid, reg);
        if (reg > 0) log(G, `${m.name} regenerates ${reg} HP.`);
      }
    }

    // Inspire triggers: minions
    for (const m of friendly) {
      if (!m.silenced) {
        const def = window.CARD_DEFS[m.defId];
        if (def && def.inspire) def.inspire(G, m.uid, idx, []);
      }
    }

    // Inspire triggers: enchantments
    for (const ench of p.enchantments) {
      const def = window.CARD_DEFS[ench.defId];
      if (def && def.inspire) def.inspire(G, ench.uid, idx, []);
    }

    // Stasis Field (M089) - freeze highest ATK enemy minion at start of EACH upkeep
    checkStasisField(G, idx);

    // Library of Eternity (M083)
    for (const ench of p.enchantments) {
      if (ench.defId === 'M083') {
        const maxHand = p.maxHandSize + p.handSizeBonus;
        if (p.hand.length < maxHand) {
          drawCards(G, idx, 1);
        }
      }
    }

    checkWinConditions(G);
    if (!G.gameOver) {
      // Draft phase before action (first player skips draft on turn 1)
      const isFirstPlayerFirstTurn = idx === 0 && G.turn === 1 && G.firstTurnFirstPlayer;
      if (isFirstPlayerFirstTurn) {
        G.firstTurnFirstPlayer = false;
        log(G, `${heroName(G, idx)} skips draft on the first turn.`);
        G.phase = 'action';
        if (window.UI && window.UI.onPhaseChange) window.UI.onPhaseChange(G);
      } else {
        G.phase = 'draft';
        log(G, `${heroName(G, idx)} — Draft Phase (choose 1 of 3)`);
        if (window.UI && window.UI.onPhaseChange) window.UI.onPhaseChange(G);
      }
    }
  }

  function checkStasisField(G, activeIdx) {
    // Both players can have Stasis Field; it freezes the active player's highest ATK minion...
    // Actually from the doc: "at start of each Upkeep (yours and opponent's), Freeze enemy minion with highest ATK"
    // So during activeIdx's upkeep, any Stasis Field freezes activeIdx's highest ATK minion
    for (const p of G.players) {
      for (const ench of p.enchantments) {
        if (ench.defId === 'M089') {
          // This enchantment owner freezes the active player's highest ATK minion (enemy)
          const enemyMinions = getFriendlyMinions(G, activeIdx);
          if (enemyMinions.length > 0) {
            const highest = enemyMinions.reduce((a, b) => (getEffectiveAtk(a) >= getEffectiveAtk(b) ? a : b));
            freezeMinion(G, highest.uid, 1);
            log(G, `Stasis Field freezes ${highest.name}!`);
          }
        }
      }
    }
  }

  // ── Phase: Action ─────────────────────────────────────────
  function beginActionPhase(G) {
    G.phase = 'action';
    log(G, `${heroName(G, G.activePlayer)} — Action Phase`);
    if (window.UI && window.UI.onPhaseChange) window.UI.onPhaseChange(G);
  }

  // Play a card from hand
  function playCard(G, playerIdx, cardUid, targets) {
    if (G.gameOver) return false;
    const p = G.players[playerIdx];
    const cardIdx = p.hand.findIndex(c => c.uid === cardUid);
    if (cardIdx === -1) { log(G, 'Card not in hand!'); return false; }
    const card = p.hand[cardIdx];
    const def = window.CARD_DEFS[card.defId];
    if (!def) return false;

    // Check phase restrictions
    const isActivePlayer = G.activePlayer === playerIdx;
    if (card.type === 'sorcery' || card.type === 'enchantment' || card.type === 'upgrade') {
      if (!isActivePlayer || G.phase !== 'action' || G.stack.length > 0) {
        log(G, 'Can only play sorceries/enchantments/upgrades during your action phase when the stack is empty.');
        return false;
      }
    }
    if (card.type === 'instant') {
      if (!getKw(card, 'flash') && card.type !== 'instant') {
        // Instants can be played any time (they have instant type)
      }
    }
    if (card.type === 'minion') {
      if (!isActivePlayer && !getKw(card, 'flash')) {
        log(G, 'Can only play minions during your action phase (unless Flash).');
        return false;
      }
    }

    // Counter spells require something on the stack to target
    if (def.isCounter && G.stack.length === 0) {
      log(G, `${card.name} can only be played in response to another card.`);
      return false;
    }

    // Check mana cost
    let cost = getEffectiveCost(G, playerIdx, card);
    if (p.mana.current < cost) { log(G, 'Not enough mana!'); return false; }

    // Remove from hand
    p.hand.splice(cardIdx, 1);
    p.mana.current -= cost;

    // SFX: mana spend + card type
    if (window.SFX) {
      window.SFX.play('mana_spend');
      const sfxMap = { minion: 'card_play_minion', instant: 'card_play_instant', sorcery: 'card_play_spell', enchantment: 'card_play_enchantment', upgrade: 'card_play_upgrade' };
      window.SFX.play(sfxMap[card.type] || 'card_play_spell', { delay: 150 });
    }
    log(G, `${heroName(G, playerIdx)} plays ${card.name} (cost ${cost}).`);

    // Notify UI about card played (for animation)
    if (window.UI && window.UI.onCardPlayed) {
      window.UI.onCardPlayed(G, playerIdx, card);
    }

    // Push to stack instead of resolving immediately
    const stackType = card.type === 'instant' || card.type === 'sorcery' ? 'spell' : card.type;
    pushToStack(G, stackType, card, card.defId, playerIdx, targets);

    if (window.UI && window.UI.onStateChange) window.UI.onStateChange(G);
    return true;
  }

  function getEffectiveCost(G, playerIdx, card) {
    const p = G.players[playerIdx];
    let cost = card.cost + (card.costModifier || 0);

    // Tombstalker (S033) - costs 1 less per friendly minion that died this turn
    if (card.defId === 'S033') cost -= p.minionsDiedThisTurn;

    // Arcane Omnipotence (M090) - spells cost 2 less (min 1)
    if (card.type === 'instant' || card.type === 'sorcery') {
      for (const ench of p.enchantments) {
        if (ench.defId === 'M090') cost -= 2;
      }
    }

    // Omniscience (M078) active - all spells cost 0 this turn
    if (p.omniscienceActive && (card.type === 'instant' || card.type === 'sorcery')) cost = 0;

    // Spell Echo (M082) first instant costs 1 less
    if (card.type === 'instant' && !p.firstInstantDiscountUsed) {
      for (const ench of p.enchantments) {
        if (ench.defId === 'M082') { cost -= 1; break; }
      }
    }

    return Math.max(0, cost);
  }

  function playMinion(G, playerIdx, card, targets) {
    card.owner = playerIdx;
    card.enteredThisTurn = true;
    card.tapped = false;
    G.battlefield.push(card);

    // Shadows of Paranoia (S080) - enemy entering triggers 1 damage
    const opp = G.players[1 - playerIdx];
    for (const ench of opp.enchantments) {
      if (ench.defId === 'S080') {
        dealDamage(G, card.uid, 1, null);
        log(G, `Shadows of Paranoia deals 1 damage to ${card.name}!`);
      }
    }

    // Temporal Barrier (M086) - freeze enemy minion and deal 1 damage
    for (const ench of opp.enchantments) {
      if (ench.defId === 'M086') {
        freezeMinion(G, card.uid, 1);
        dealDamage(G, card.uid, 1, null);
        log(G, `Temporal Barrier freezes and damages ${card.name}!`);
      }
    }

    // Frozen Aura (M081) - owned by opponent, freeze the entering minion
    for (const ench of opp.enchantments) {
      if (ench.defId === 'M081') {
        freezeMinion(G, card.uid, 1);
        log(G, `Frozen Aura freezes ${card.name}!`);
      }
    }

    // Nature's Chosen (W083) - owner enchantment, give +1/+1 when minion played
    const myPlayer = G.players[playerIdx];
    for (const ench of myPlayer.enchantments) {
      if (ench.defId === 'W083') {
        const bonus = card.kw.regenerate ? 2 : 1;
        buffMinion(G, card.uid, bonus, bonus, true);
        log(G, `Nature's Chosen buffs ${card.name} +${bonus}/+${bonus}!`);
      }
    }

    // Battlecry — targeted battlecries are deferred (pushed to stack by resolveStackEntry)
    const def = window.CARD_DEFS[card.defId];
    if (def && def.battlecry && !card.silenced && !card._deferBattlecry) {
      if (window.SFX) window.SFX.play('battlecry');
      def.battlecry(G, card.uid, playerIdx, targets || []);
    }
    delete card._deferBattlecry;

    // Rally triggers on other friendly minions
    triggerRally(G, playerIdx, card.uid);

    if (window.SFX && getKw(card, 'stealth')) window.SFX.play('stealth_enter', { delay: 200 });
    log(G, `${card.name} enters the battlefield! (${getEffectiveAtk(card)}/${card.hp})`);
    checkWinConditions(G);
  }

  function playSpell(G, playerIdx, card, targets) {
    const def = window.CARD_DEFS[card.defId];
    if (def && def.onPlay) {
      def.onPlay(G, card.uid, playerIdx, targets || []);
    }
    // Move to discard
    G.players[playerIdx].discard.push(card);
    checkWinConditions(G);
  }

  function playEnchantment(G, playerIdx, card) {
    const p = G.players[playerIdx];
    card.exileOnDeath = true; // enchantments are removed from game, not discarded
    p.enchantments.push(card);
    log(G, `${card.name} enchantment is active.`);
    // Apply passive auras immediately
    applyEnchantmentAura(G, card, playerIdx);
    checkWinConditions(G);
  }

  function playUpgrade(G, playerIdx, card, targets) {
    const targetUid = targets && targets[0] ? toUid(targets[0]) : null;
    const m = targetUid ? getMinion(G, targetUid) : null;

    // Snapshot stats/keywords before upgrade is applied
    let beforeAtk = 0, beforeMaxHp = 0, beforeKw = {};
    if (m) {
      beforeAtk = m.atk;
      beforeMaxHp = m.maxHp;
      beforeKw = Object.assign({}, m.kw);
    }

    const def = window.CARD_DEFS[card.defId];
    if (def && def.onPlay) {
      def.onPlay(G, card.uid, playerIdx, targets || []);
    }

    // Record what the upgrade changed on the target minion
    if (m) {
      const atkDiff = m.atk - beforeAtk;
      const hpDiff = m.maxHp - beforeMaxHp;
      const kwDiff = {};
      for (const key of Object.keys(m.kw)) {
        if (m.kw[key] !== beforeKw[key]) {
          if (typeof m.kw[key] === 'number' && typeof beforeKw[key] === 'number') {
            kwDiff[key] = m.kw[key] - beforeKw[key]; // store the increment
          } else {
            kwDiff[key] = m.kw[key]; // boolean/new keyword — store the value
          }
        }
      }
      m.upgrades.push({ defId: card.defId, atkBuff: atkDiff, hpBuff: hpDiff, keywords: kwDiff });
    }

    // Upgrades are exiled (removed from game), not discarded
    checkWinConditions(G);
  }

  // Reapply all recorded upgrades to a minion (used when re-instantiated from scratch)
  function reapplyUpgrades(m) {
    if (!m.upgrades || m.upgrades.length === 0) return;
    for (const upg of m.upgrades) {
      // Reapply stat buffs
      if (upg.atkBuff) m.atk = Math.max(0, m.atk + upg.atkBuff);
      if (upg.hpBuff) {
        m.maxHp = Math.max(1, m.maxHp + upg.hpBuff);
        m.hp = Math.max(1, m.hp + upg.hpBuff);
      }
      // Reapply keywords
      for (const [kw, val] of Object.entries(upg.keywords || {})) {
        if (typeof val === 'number' && typeof m.kw[kw] === 'number') {
          m.kw[kw] = (m.kw[kw] || 0) + val;
        } else {
          m.kw[kw] = val;
        }
      }
    }
  }

  function applyEnchantmentAura(G, enchCard, playerIdx) {
    // Passive auras are re-evaluated when needed (getKw checks enchantments)
    // Some auras have immediate one-time effects handled here
  }

  // Check if a card's battlecry requires a player-chosen target
  function battlecryNeedsTarget(defId) {
    const def = window.CARD_DEFS[defId];
    if (!def || !def.battlecry) return false;
    // Check explicit targetType on the definition
    if (def.battlecryTargetType && def.battlecryTargetType !== 'none') return true;
    // Infer: if battlecry function accepts 4 params (G, uid, idx, targets) and text mentions target-like words
    if (def.battlecry.length >= 4) {
      const text = (def.text || '').toLowerCase();
      if (/\btarget\b|\bfriendly minion\b|\benemy minion\b|\ba minion\b|\bheal a\b|\bfreeze\b|\breturn\b|\bgive\b|\bbuff\b/.test(text)) {
        return true;
      }
    }
    return false;
  }

  // Infer battlecry target type from card text
  function getBattlecryTargetType(defId) {
    const def = window.CARD_DEFS[defId];
    if (!def) return 'any_minion';
    if (def.battlecryTargetType) return def.battlecryTargetType;
    const text = (def.text || '').toLowerCase();
    if (/\bfriendly\b/.test(text)) return 'friendly_minion';
    if (/\benemy\b/.test(text)) return 'enemy_minion';
    return 'any_minion';
  }

  // ── Stack System ────────────────────────────────────────
  function pushToStack(G, type, card, defId, ownerIdx, targets) {
    const entry = {
      id: G.nextStackId++,
      type,          // 'minion'|'spell'|'enchantment'|'upgrade'
      card,          // card instance
      defId,         // card definition ID
      cardName: card.name,
      ownerIdx,
      targets: targets || [],
      countered: false,
    };
    G.stack.push(entry);
    if (window.SFX) window.SFX.play('stack_resolve');
    log(G, `[Stack] ${card.name} added to the stack.`);
    if (window.UI && window.UI.renderStack) window.UI.renderStack(G);
    return entry.id;
  }

  function resolveStackEntry(G, entry) {
    if (entry.countered) {
      if (window.SFX) window.SFX.play('counterspell');
      log(G, `✖ ${entry.cardName} was countered!`);
      // Move card to discard (spells) or just discard (minions never entered)
      if (entry.card) {
        G.players[entry.ownerIdx].discard.push(entry.card);
      }
      if (window.UI && window.UI.onStackResolve) window.UI.onStackResolve(G, entry);
      checkWinConditions(G);
      return;
    }

    const playerIdx = entry.ownerIdx;
    const card = entry.card;
    const targets = entry.targets;

    // Track spell usage
    if (card.type === 'instant' || card.type === 'sorcery') {
      G.players[playerIdx].spellsPlayedThisTurn++;
      if (card.type === 'instant') G.players[playerIdx].instantsPlayedThisTurn++;
    }

    // Handle counter spells: mark target on stack as countered
    const def = window.CARD_DEFS[card.defId];
    if (def && def.isCounter && targets.length > 0) {
      const targetStackId = targets[0];
      const targetEntry = G.stack.find(s => s.id === targetStackId);
      if (targetEntry) {
        // Validate counter subtype restrictions
        let canCounter = true;
        if (def.counterSubtype === 'instant' && targetEntry.card.type !== 'instant') {
          log(G, `${card.name} can only counter instants — ${targetEntry.cardName} is not an instant.`);
          canCounter = false;
        }
        if (def.counterSubtype === 'minion' && targetEntry.card.type !== 'minion') {
          log(G, `${card.name} can only counter minions — ${targetEntry.cardName} is not a minion.`);
          canCounter = false;
        }
        // Mana Leak (M044) special case
        if (card.defId === 'M044' && canCounter) {
          const targetOwner = G.players[targetEntry.ownerIdx];
          if (targetOwner.mana.current >= 3) {
            targetOwner.mana.current -= 3;
            log(G, `${targetEntry.cardName}'s controller pays 3 mana — not countered!`);
            canCounter = false;
          }
        }
        if (canCounter) {
          counterSpell(G, targetStackId);
        }
      }
      // Call onPlay for bonus effects (insight, draw, discard, etc.)
      if (def.onPlay) def.onPlay(G, card.uid, playerIdx, targets);
      // Move counter spell to discard
      G.players[playerIdx].discard.push(card);
    } else if (entry.type === 'trigger') {
      // Triggered ability (e.g. battlecry) — fire the effect with resolved targets
      const sourceMinion = getMinion(G, entry.sourceUid);
      if (sourceMinion && !sourceMinion.silenced) {
        const srcDef = window.CARD_DEFS[sourceMinion.defId];
        if (srcDef && srcDef[entry.triggerType]) {
          srcDef[entry.triggerType](G, entry.sourceUid, playerIdx, targets);
        }
      }
    } else {
      // Resolve the effect normally
      if (card.type === 'minion') {
        // Defer targeted battlecry — it will be pushed as a separate trigger
        if (!card.silenced && battlecryNeedsTarget(card.defId)) {
          card._deferBattlecry = true;
        }
        playMinion(G, playerIdx, card, targets);
        // Push targeted battlecry as a trigger stack entry
        if (!card.silenced && battlecryNeedsTarget(card.defId)) {
          const triggerEntry = {
            id: G.nextStackId++,
            type: 'trigger',
            triggerType: 'battlecry',
            sourceUid: card.uid,
            card: card,
            defId: card.defId,
            cardName: card.name + ' (Battlecry)',
            ownerIdx: playerIdx,
            targets: [],      // to be filled by UI/AI before resolution
            needsTarget: true,
            targetType: getBattlecryTargetType(card.defId),
            countered: false,
          };
          G.stack.push(triggerEntry);
          log(G, `[Stack] ${card.name}'s Battlecry goes on the stack.`);
          if (window.UI && window.UI.renderStack) window.UI.renderStack(G);
        }
      } else if (card.type === 'instant' || card.type === 'sorcery') {
        playSpell(G, playerIdx, card, targets);
      } else if (card.type === 'enchantment') {
        playEnchantment(G, playerIdx, card);
      } else if (card.type === 'upgrade') {
        playUpgrade(G, playerIdx, card, targets);
      }
    }

    // Post-play triggers (enchantment synergies, surge, etc.)
    // Spell Echo (M082)
    if (card.type === 'instant' && !G.players[playerIdx].firstInstantDiscountUsed) {
      for (const ench of G.players[playerIdx].enchantments) {
        if (ench.defId === 'M082') { G.players[playerIdx].firstInstantDiscountUsed = true; break; }
      }
    }
    // Insight Engine (M084)
    if (card.type === 'instant') {
      for (const ench of G.players[playerIdx].enchantments) {
        if (ench.defId === 'M084') gainInsight(G, playerIdx, 1);
      }
    }
    // Arcane Omnipotence (M090)
    if (card.type === 'instant' || card.type === 'sorcery') {
      for (const ench of G.players[playerIdx].enchantments) {
        if (ench.defId === 'M090') gainInsight(G, playerIdx, 2);
      }
    }
    // Surge triggers
    if (card.type === 'instant' || card.type === 'sorcery') {
      triggerSurge(G, playerIdx);
    }
    // Dreamweaver Sphinx (M036)
    if (card.type === 'instant') {
      for (const m of getFriendlyMinions(G, playerIdx)) {
        if (m.defId === 'M036' && !m.silenced) {
          const enemies = getEnemyMinions(G, playerIdx);
          if (enemies.length > 0) {
            freezeMinion(G, rand(enemies).uid, 1);
            log(G, `Dreamweaver Sphinx freezes an enemy!`);
          }
        }
      }
    }

    if (window.UI && window.UI.onStackResolve) window.UI.onStackResolve(G, entry);
    checkWinConditions(G);
    if (window.UI && window.UI.onStateChange) window.UI.onStateChange(G);
  }

  // Check if a player can respond with an instant during a priority window
  function canRespondWithInstant(G, playerIdx) {
    const p = G.players[playerIdx];
    for (const card of p.hand) {
      if (card.type === 'instant' || getKw(card, 'flash')) {
        const cost = getEffectiveCost(G, playerIdx, card);
        if (p.mana.current >= cost) return true;
      }
    }
    return false;
  }

  async function openPriorityWindow(G, respondingPlayerIdx) {
    if (G.gameOver) return { action: 'pass' };
    // Auto-pass if player has no affordable instants/flash
    if (!canRespondWithInstant(G, respondingPlayerIdx)) return { action: 'pass' };

    if (window.SFX) window.SFX.play('priority_alert');
    G.priorityPlayer = respondingPlayerIdx;
    G.waitingForPriority = true;

    let response;
    try {
      if (window.UI && window.UI.requestPriority) {
        response = await window.UI.requestPriority(G, respondingPlayerIdx);
      } else {
        response = { action: 'pass' };
      }
    } catch (e) {
      response = { action: 'pass' };
    }

    G.priorityPlayer = null;
    G.waitingForPriority = false;
    return response;
  }

  async function resolveStack(G) {
    while (G.stack.length > 0 && !G.gameOver) {
      const topEntry = G.stack[G.stack.length - 1];

      // If this trigger needs a target, request it from UI/AI
      if (topEntry.needsTarget && topEntry.targets.length === 0) {
        const ownerIdx = topEntry.ownerIdx;
        let chosenTarget = null;
        if (window.UI && window.UI.requestTriggerTarget) {
          chosenTarget = await window.UI.requestTriggerTarget(G, topEntry);
        }
        if (chosenTarget) {
          topEntry.targets = [chosenTarget];
          topEntry.needsTarget = false;
        } else {
          // No valid target or player cancelled — remove trigger from stack
          G.stack.pop();
          if (window.SFX) window.SFX.play('spell_fizzle');
          log(G, `${topEntry.cardName} has no valid target — fizzles.`);
          if (window.UI && window.UI.renderStack) window.UI.renderStack(G);
          continue;
        }
      }

      const opponentIdx = 1 - topEntry.ownerIdx;

      // Give priority to opponent of top entry's owner
      const oppResponse = await openPriorityWindow(G, opponentIdx);
      if (oppResponse.action === 'play') continue; // new item on stack, restart

      // Opponent passed — resolve top of stack
      const entry = G.stack.pop();
      log(G, `[Stack] Resolving ${entry.cardName}...`);
      if (window.UI && window.UI.renderStack) window.UI.renderStack(G);
      resolveStackEntry(G, entry);

      // Brief pause for visual feedback
      if (window.UI) await new Promise(r => setTimeout(r, 400));
    }
  }

  // Open priority for both players (used at combat checkpoints where the stack may be empty)
  async function combatPriorityRound(G) {
    if (G.gameOver) return;
    const activeIdx = G.activePlayer;
    const defIdx = 1 - activeIdx;
    // Loop: give non-active player priority, then active player, until both pass
    let someonePlayed = true;
    while (someonePlayed && !G.gameOver) {
      someonePlayed = false;
      // Non-active player (defender) gets priority first
      const defResponse = await openPriorityWindow(G, defIdx);
      if (defResponse.action === 'play') { someonePlayed = true; await resolveStack(G); continue; }
      // Active player (attacker) gets priority
      const atkResponse = await openPriorityWindow(G, activeIdx);
      if (atkResponse.action === 'play') { someonePlayed = true; await resolveStack(G); continue; }
    }
  }

  async function playCardAndResolve(G, playerIdx, cardUid, targets) {
    const result = playCard(G, playerIdx, cardUid, targets);
    if (!result) return false;
    await resolveStack(G);
    return true;
  }

  // ── Rally Triggers ────────────────────────────────────────
  function triggerRally(G, playerIdx, newMinionUid) {
    const friendly = getFriendlyMinions(G, playerIdx).filter(m => m.uid !== newMinionUid);
    let rallied = false;
    for (const m of friendly) {
      if (!m.silenced) {
        const def = window.CARD_DEFS[m.defId];
        if (def && def.rally) { if (!rallied && window.SFX) { window.SFX.play('rally'); rallied = true; } def.rally(G, m.uid, playerIdx, newMinionUid); }
      }
    }
  }

  // ── Surge Triggers ────────────────────────────────────────
  function triggerSurge(G, playerIdx) {
    const friendly = getFriendlyMinions(G, playerIdx);
    for (const m of friendly) {
      if (!m.silenced) {
        const def = window.CARD_DEFS[m.defId];
        if (def && def.surge) def.surge(G, m.uid, playerIdx, []);
      }
    }
  }

  // ── Combat ────────────────────────────────────────────────
  function initiateCombat(G) {
    const idx = G.activePlayer;
    if (G.phase !== 'action') { log(G, 'Can only initiate combat during action phase.'); return false; }
    if (G.turn === 1) { log(G, 'Cannot attack on the first turn.'); return false; }
    if (G.players[idx].hasInitiatedCombat) { log(G, 'Already initiated combat this turn.'); return false; }
    G.players[idx].hasInitiatedCombat = true;
    G.phase = 'combat';
    G.combatStep = 'declareAttackers';
    G.attackers = [];
    G.blockers = {};
    G.damageOrder = {};
    if (window.SFX) window.SFX.play('combat_start');
    log(G, `${heroName(G, idx)} enters combat!`);
    for (const m of getFriendlyMinions(G, idx)) {
      m.damageDealtThisCombat = 0;
    }
    if (window.UI && window.UI.onPhaseChange) window.UI.onPhaseChange(G);
    return true;
  }

  async function declareAttackers(G, attackerUids) {
    if (G.combatStep !== 'declareAttackers') return false;
    const idx = G.activePlayer;
    G.attackers = [];
    for (const uid of attackerUids) {
      const m = getMinion(G, uid);
      if (!m || m.owner !== idx) continue;
      if (m.tapped && !getKw(m, 'vigilance')) { log(G, `${m.name} is tapped, can't attack.`); continue; }
      if (getKw(m, 'defender')) { log(G, `${m.name} has Defender and can't attack.`); continue; }
      G.attackers.push(uid);
      if (window.SFX) window.SFX.play('declare_attackers');
      log(G, `${m.name} attacks!`);
    }
    if (G.attackers.length === 0) {
      log(G, 'No attackers declared. Ending combat.');
      endCombat(G);
      return true;
    }
    // Priority window after declaring attackers
    await combatPriorityRound(G);
    if (G.gameOver) return true;

    G.combatStep = 'declareBlockers';
    if (window.UI && window.UI.onCombatStep) window.UI.onCombatStep(G);
    return true;
  }

  async function declareBlockers(G, blockingMap) {
    // blockingMap: { attackerUid: [blockerUid, ...] }
    if (G.combatStep !== 'declareBlockers') return false;
    const defIdx = 1 - G.activePlayer;
    G.blockers = {};
    G.damageOrder = {};

    // Validate Taunt: if any attacker is unblocked but there are taunt attackers that should be blocked first
    // Actually Taunt is a DEFENDER keyword: defending player must block taunt minions before others
    const tauntAttackers = G.attackers.filter(uid => {
      const m = getMinion(G, uid);
      return m && getKw(m, 'taunt');
    });
    const defenderMinions = getFriendlyMinions(G, defIdx).filter(m => !m.tapped);

    for (const attUid of G.attackers) {
      G.blockers[attUid] = [];
      G.damageOrder[attUid] = [];
    }

    for (const [attUid, blockerUids] of Object.entries(blockingMap)) {
      if (!G.attackers.includes(attUid)) continue;
      const attacker = getMinion(G, attUid);
      for (const bUid of blockerUids) {
        const blocker = getMinion(G, bUid);
        if (!blocker || blocker.owner !== defIdx) continue;
        if (blocker.tapped) continue;
        // Blocking restrictions
        if (getKwWithAura(G, attacker, 'flying') && !getKwWithAura(G, blocker, 'flying') && !getKwWithAura(G, blocker, 'reach')) {
          log(G, `${blocker.name} cannot block ${attacker.name} (Flying restriction).`);
          continue;
        }
        if (getKwWithAura(G, attacker, 'menace') && blockerUids.length < 2) {
          // Menace: can only be blocked by 2+ minions. Validated later.
        }
        if (getKwWithAura(G, attacker, 'stealth') && attacker.enteredThisTurn) {
          log(G, `${attacker.name} has Stealth and can't be blocked this turn.`);
          G.blockers[attUid] = [];
          break;
        }
        G.blockers[attUid].push(bUid);
      }
      // Menace validation: if blocked but fewer than 2 blockers, unblock
      if (getKwWithAura(G, attacker, 'menace') && G.blockers[attUid].length === 1) {
        log(G, `${attacker.name} has Menace — must be blocked by 2+ minions. Unblocking.`);
        G.blockers[attUid] = [];
      }
      G.damageOrder[attUid] = [...G.blockers[attUid]];
    }

    for (const [attUid, blockerList] of Object.entries(G.blockers)) {
      const att = getMinion(G, attUid);
      if (blockerList.length > 0) {
        if (window.SFX) window.SFX.play('declare_blockers');
        log(G, `${att.name} is blocked by ${blockerList.map(u => getMinion(G, u).name).join(', ')}.`);
      } else {
        log(G, `${att.name} is unblocked.`);
      }
    }

    // Priority window after declaring blockers, before damage
    await combatPriorityRound(G);
    if (G.gameOver) return true;

    G.combatStep = 'resolveDamage';
    // If the UI provides an animated damage handler, let it drive per-attacker resolution
    if (window.UI && window.UI.onCombatDamageStart) {
      window.UI.onCombatDamageStart(G);
    } else {
      resolveCombatDamage(G);
    }
    return true;
  }

  function resolveCombatDamage(G) {
    // First Strike step
    const firstStrikeAttackers = G.attackers.filter(uid => {
      const m = getMinion(G, uid);
      return m && (getKwWithAura(G, m, 'firstStrike') || getKwWithAura(G, m, 'doubleStrike'));
    });
    const firstStrikeBlockers = [];
    for (const attUid of G.attackers) {
      const blockerUids = G.blockers[attUid] || [];
      for (const bUid of blockerUids) {
        const b = getMinion(G, bUid);
        if (b && (getKwWithAura(G, b, 'firstStrike') || getKwWithAura(G, b, 'doubleStrike'))) {
          firstStrikeBlockers.push(bUid);
        }
      }
    }

    const hasFirstStrike = firstStrikeAttackers.length > 0 || firstStrikeBlockers.length > 0;

    if (hasFirstStrike) {
      if (window.SFX) window.SFX.play('first_strike');
      log(G, '⚡ First Strike damage step:');
      applyDamageStep(G, true);
      removeCombatDeadMinions(G);
    }

    log(G, '💥 Normal damage step:');
    applyDamageStep(G, false);
    removeCombatDeadMinions(G);

    // Frenzy — if a minion killed something this combat step, it can attack again
    // (For simplicity: mark frenzy minions that killed — UI handles re-attack)

    endCombat(G);
  }

  function applyDamageStep(G, firstStrikeStep) {
    const defIdx = 1 - G.activePlayer;

    for (const attUid of G.attackers) {
      const attacker = getMinion(G, attUid);
      if (!attacker) continue;

      const isFirstStrike = getKwWithAura(G, attacker, 'firstStrike') || getKwWithAura(G, attacker, 'doubleStrike');
      // In first strike step: only first strikers deal damage
      // In normal step: all minions that aren't first-strike-only deal damage
      // Double strikers deal in BOTH steps
      if (firstStrikeStep && !isFirstStrike) continue;
      if (!firstStrikeStep && getKwWithAura(G, attacker, 'firstStrike') && !getKwWithAura(G, attacker, 'doubleStrike')) continue;

      const blockerUids = G.blockers[attUid] || [];
      const damageOrder = G.damageOrder[attUid] || blockerUids;

      if (blockerUids.length === 0) {
        // Unblocked: hit hero
        const dmg = getEffectiveAtk(attacker);
        if (dmg > 0) {
          const heroName2 = heroName(G, defIdx);
          G.players[defIdx].health -= dmg;
          attacker.damageDealtThisCombat += dmg;
          log(G, `${attacker.name} deals ${dmg} damage to ${heroName2}!`);
          // Siphon
          if (getKwWithAura(G, attacker, 'siphon')) healMinion(G, attUid, dmg);
          // Insight Siphon (M094)
          if (attacker.extraAbilities && attacker.extraAbilities.includes('insightSiphon')) {
            gainInsight(G, attacker.owner, dmg);
          }
          // Thieves' Guild (S081)
          if (getKwWithAura(G, attacker, 'stealth')) {
            const owner = G.players[attacker.owner];
            for (const ench of owner.enchantments) {
              if (ench.defId === 'S081') drawCards(G, attacker.owner, 1);
            }
          }
          checkWinConditions(G);
          if (G.gameOver) return;
        }
      } else {
        // Distribute damage across blockers in damage order
        let remainingAtk = getEffectiveAtk(attacker);
        for (const bUid of damageOrder) {
          if (remainingAtk <= 0) break;
          const blocker = getMinion(G, bUid);
          if (!blocker) continue;
          // Check if already dead from first strike step
          if (blocker.hp <= 0) continue;
          const isDeathtouch = getKwWithAura(G, attacker, 'deathtouch');
          const dmgToBlocker = isDeathtouch ? Math.max(1, remainingAtk) : Math.min(remainingAtk, blocker.hp + blocker.shieldCharges);
          // Actually assign remainingAtk, need enough to kill before moving on
          const effectiveHp = blocker.hp + blocker.shieldCharges;
          let assignedDmg;
          if (remainingAtk >= effectiveHp || isDeathtouch) {
            // Assign lethal, excess goes to next blocker
            assignedDmg = remainingAtk; // assign all, will be capped by hp
            remainingAtk -= isDeathtouch ? blocker.hp : effectiveHp;
            if (remainingAtk < 0) remainingAtk = 0;
          } else {
            assignedDmg = remainingAtk;
            remainingAtk = 0;
          }
          assignedDmg = Math.min(assignedDmg, blocker.hp + blocker.shieldCharges + 100);
          dealDamageToMinion(G, blocker, assignedDmg, attacker);
          attacker.damageDealtThisCombat += Math.min(assignedDmg, blocker.hp + blocker.shieldCharges);
        }
        // Trample: excess damage to hero
        if (getKwWithAura(G, attacker, 'trample') && remainingAtk > 0) {
          G.players[defIdx].health -= remainingAtk;
          log(G, `${attacker.name} tramples for ${remainingAtk} damage to ${heroName(G, defIdx)}!`);
          checkWinConditions(G);
          if (G.gameOver) return;
        }
        // Piercing: deal X damage to hero when blocked
        const piercing = getKwWithAura(G, attacker, 'piercing');
        if (piercing) {
          G.players[defIdx].health -= piercing;
          log(G, `${attacker.name}'s Piercing deals ${piercing} damage to ${heroName(G, defIdx)}!`);
          checkWinConditions(G);
          if (G.gameOver) return;
        }
        // Siphon
        if (getKwWithAura(G, attacker, 'siphon') && attacker.damageDealtThisCombat > 0) {
          healMinion(G, attUid, attacker.damageDealtThisCombat);
        }
      }

      // Blockers deal damage back to attacker (simultaneous — even dead blockers fight back)
      for (const bUid of blockerUids) {
        const blocker = getMinion(G, bUid);
        if (!blocker) continue;
        const isBlkFirstStrike = getKwWithAura(G, blocker, 'firstStrike') || getKwWithAura(G, blocker, 'doubleStrike');
        if (firstStrikeStep && !isBlkFirstStrike) continue;
        if (!firstStrikeStep && getKwWithAura(G, blocker, 'firstStrike') && !getKwWithAura(G, blocker, 'doubleStrike')) continue;

        const blkDmg = getEffectiveAtk(blocker);
        if (blkDmg > 0) {
          dealDamageToMinion(G, attacker, blkDmg, blocker);
        }
        // Attacker thorns → blocker
        const attThorns = getKwWithAura(G, attacker, 'thorns');
        if (attThorns) {
          dealDamageToMinion(G, blocker, attThorns, attacker);
          log(G, `${attacker.name}'s Thorns deals ${attThorns} to ${blocker.name}!`);
        }
        // Blocker thorns → attacker
        const blkThorns = getKwWithAura(G, blocker, 'thorns');
        if (blkThorns) {
          dealDamageToMinion(G, attacker, blkThorns, blocker);
          log(G, `${blocker.name}'s Thorns deals ${blkThorns} to ${attacker.name}!`);
        }
      }
    }
  }

  /**
   * Resolve damage for a single attacker (both dealing and receiving).
   * Returns { deadUids: string[] } — uids of minions that died.
   */
  function resolveSingleAttackerDamage(G, attUid) {
    const attacker = getMinion(G, attUid);
    if (!attacker) return { deadUids: [] };
    const defIdx = 1 - G.activePlayer;
    const blockerUids = G.blockers[attUid] || [];
    const damageOrder = G.damageOrder[attUid] || blockerUids;

    if (blockerUids.length === 0) {
      // Unblocked: hit hero
      const dmg = getEffectiveAtk(attacker);
      const hits = getKwWithAura(G, attacker, 'doubleStrike') ? 2 : 1;
      const totalDmg = dmg * hits;
      if (totalDmg > 0) {
        if (window.SFX) {
          window.SFX.play('damage_hero');
          if (hits === 2) window.SFX.play('double_strike', { delay: 100 });
        }
        const heroName2 = heroName(G, defIdx);
        G.players[defIdx].health -= totalDmg;
        attacker.damageDealtThisCombat += totalDmg;
        if (hits === 2) {
          log(G, `${attacker.name} strikes twice for ${totalDmg} damage to ${heroName2}!`);
        } else {
          log(G, `${attacker.name} deals ${totalDmg} damage to ${heroName2}!`);
        }
        if (getKwWithAura(G, attacker, 'siphon')) healMinion(G, attUid, totalDmg);
        if (attacker.extraAbilities && attacker.extraAbilities.includes('insightSiphon')) {
          gainInsight(G, attacker.owner, totalDmg);
        }
        if (getKwWithAura(G, attacker, 'stealth')) {
          const owner = G.players[attacker.owner];
          for (const ench of owner.enchantments) {
            if (ench.defId === 'S081') drawCards(G, attacker.owner, 1);
          }
        }
        checkWinConditions(G);
      }
    } else {
      const attHasFS = getKwWithAura(G, attacker, 'firstStrike') || getKwWithAura(G, attacker, 'doubleStrike');
      const blockerFSMap = {};
      for (const bUid of blockerUids) {
        const b = getMinion(G, bUid);
        if (b) blockerFSMap[bUid] = getKwWithAura(G, b, 'firstStrike') || getKwWithAura(G, b, 'doubleStrike');
      }
      const anyFirstStrike = attHasFS || blockerUids.some(uid => blockerFSMap[uid]);

      // ── Helper: attacker distributes damage across blockers ──
      function attackerDealsDamage() {
        let remainingAtk = getEffectiveAtk(attacker);
        for (const bUid of damageOrder) {
          if (remainingAtk <= 0) break;
          const blocker = getMinion(G, bUid);
          if (!blocker || blocker.hp <= 0) continue;
          const isDeathtouch = getKwWithAura(G, attacker, 'deathtouch');
          const effectiveHp = blocker.hp + blocker.shieldCharges;
          let assignedDmg;
          if (remainingAtk >= effectiveHp || isDeathtouch) {
            assignedDmg = remainingAtk;
            remainingAtk -= isDeathtouch ? blocker.hp : effectiveHp;
            if (remainingAtk < 0) remainingAtk = 0;
          } else {
            assignedDmg = remainingAtk;
            remainingAtk = 0;
          }
          assignedDmg = Math.min(assignedDmg, blocker.hp + blocker.shieldCharges + 100);
          dealDamageToMinion(G, blocker, assignedDmg, attacker);
          attacker.damageDealtThisCombat += Math.min(assignedDmg, blocker.hp + blocker.shieldCharges);
        }
        // Trample
        if (getKwWithAura(G, attacker, 'trample') && remainingAtk > 0) {
          if (window.SFX) window.SFX.play('trample');
          G.players[defIdx].health -= remainingAtk;
          log(G, `${attacker.name} tramples for ${remainingAtk} damage to ${heroName(G, defIdx)}!`);
          checkWinConditions(G);
        }
        // Piercing
        const piercing = getKwWithAura(G, attacker, 'piercing');
        if (piercing) {
          G.players[defIdx].health -= piercing;
          log(G, `${attacker.name}'s Piercing deals ${piercing} damage to ${heroName(G, defIdx)}!`);
          checkWinConditions(G);
        }
      }

      // ── Helper: blockers deal damage back + thorns ──
      function blockersDealDamage(onlyFirstStrikers) {
        for (const bUid of blockerUids) {
          const blocker = getMinion(G, bUid);
          if (!blocker) continue;
          // In first-strike sub-step: only first-strike blockers act
          if (onlyFirstStrikers && !blockerFSMap[bUid]) continue;
          // In normal sub-step: skip first-strike-only blockers (they already acted)
          if (onlyFirstStrikers === false) {
            const isFS = getKwWithAura(G, blocker, 'firstStrike');
            const isDS = getKwWithAura(G, blocker, 'doubleStrike');
            if (isFS && !isDS) continue;
          }
          const blkDmg = getEffectiveAtk(blocker);
          if (blkDmg > 0) {
            dealDamageToMinion(G, attacker, blkDmg, blocker);
          }
          // Attacker thorns → blocker
          const attThorns = getKwWithAura(G, attacker, 'thorns');
          if (attThorns) {
            dealDamageToMinion(G, blocker, attThorns, attacker);
            log(G, `${attacker.name}'s Thorns deals ${attThorns} to ${blocker.name}!`);
          }
          // Blocker thorns → attacker
          const blkThorns = getKwWithAura(G, blocker, 'thorns');
          if (blkThorns) {
            dealDamageToMinion(G, attacker, blkThorns, blocker);
            log(G, `${blocker.name}'s Thorns deals ${blkThorns} to ${attacker.name}!`);
          }
        }
      }

      if (anyFirstStrike) {
        // ── First Strike sub-step ──
        log(G, '⚡ First Strike damage:');
        if (attHasFS) attackerDealsDamage();
        blockersDealDamage(true);
        // Remove minions killed by first strike
        const fsDeadUids = [];
        for (const m of G.battlefield.filter(bm => bm.hp <= 0 && !getKwWithAura(G, bm, 'indestructible'))) {
          fsDeadUids.push(m.uid);
          destroyMinion(G, m.uid);
        }
        // ── Normal sub-step ──
        // Skip if attacker died in first strike
        if (getMinion(G, attUid)) {
          log(G, '💥 Normal damage:');
          // Double strikers attack again; non-FS attackers attack for the first time
          if (!attHasFS || getKwWithAura(G, attacker, 'doubleStrike')) {
            attackerDealsDamage();
          }
          blockersDealDamage(false);
        }
        // Siphon after both steps
        if (getMinion(G, attUid) && getKwWithAura(G, attacker, 'siphon') && attacker.damageDealtThisCombat > 0) {
          healMinion(G, attUid, attacker.damageDealtThisCombat);
        }
        // Collect all dead (some may have died in FS step already)
        const normalDead = G.battlefield.filter(m => m.hp <= 0 && !getKwWithAura(G, m, 'indestructible'));
        const normalDeadUids = normalDead.map(m => m.uid);
        for (const m of normalDead) destroyMinion(G, m.uid);
        return { deadUids: [...fsDeadUids, ...normalDeadUids] };
      } else {
        // ── No first strike: simultaneous damage ──
        attackerDealsDamage();
        // Siphon
        if (getKwWithAura(G, attacker, 'siphon') && attacker.damageDealtThisCombat > 0) {
          healMinion(G, attUid, attacker.damageDealtThisCombat);
        }
        blockersDealDamage(null); // null = no first-strike filtering
      }
    }

    // Remove dead minions and return their uids
    const dead = G.battlefield.filter(m => m.hp <= 0 && !getKwWithAura(G, m, 'indestructible'));
    const deadUids = dead.map(m => m.uid);
    for (const m of dead) {
      destroyMinion(G, m.uid);
    }
    return { deadUids };
  }

  function removeCombatDeadMinions(G) {
    const dead = G.battlefield.filter(m => m.hp <= 0 && !getKwWithAura(G, m, 'indestructible'));
    for (const m of dead) {
      destroyMinion(G, m.uid);
    }
  }

  function endCombat(G) {
    // Tap attackers that don't have vigilance (deferred from declareAttackers)
    for (const uid of G.attackers) {
      const m = getMinion(G, uid);
      if (m && !getKw(m, 'vigilance')) m.tapped = true;
    }
    G.combatStep = null;
    G.phase = 'action';
    G.attackers = [];
    G.blockers = {};
    G.damageOrder = {};
    log(G, 'Combat ends.');
    checkWinConditions(G);
    if (!G.gameOver && window.UI && window.UI.onPhaseChange) window.UI.onPhaseChange(G);
  }

  // ── Phase: End Turn ───────────────────────────────────────
  function doEndTurn(G) {
    if (G.gameOver) return;
    const idx = G.activePlayer;
    const p = G.players[idx];
    G.phase = 'endTurn';

    // End-of-turn cleanup (remove temp effects)
    applyEndOfTurnCleanup(G);

    // Archmage Insight conversion: at END of OPPONENT'S turn, convert unspent mana
    const oppIdx = 1 - idx;
    const opp = G.players[oppIdx];
    if (opp.hero === 'archmage' && opp.mana.current > 0) {
      gainInsight(G, oppIdx, opp.mana.current);
      log(G, `${heroName(G, oppIdx)} converts ${opp.mana.current} unspent mana to Insight!`);
    }
    // Also convert active player's unspent mana if they are archmage (at end of OPPONENT's turn)
    // Actually per the doc: "at end of opponent's turn" means at the end of the OTHER player's turn
    // So if it's player 0's end turn, then player 1 (if archmage) gets insight from their unspent mana
    // That's exactly what we did above: convert opp's mana when it's the active player's end turn

    // Check arcane supremacy
    p.arcaneSupremacyActive = false;
    p.omniscienceActive = false;

    finishEndTurn(G);
  }

  function draftCard(G, playerIdx, shopCardUid) {
    const p = G.players[playerIdx];
    const cardIdx = p.shopRow.findIndex(c => c.uid === shopCardUid);
    if (cardIdx === -1) { log(G, 'Card not in shop row!'); return false; }
    const card = p.shopRow[cardIdx];
    if (window.SFX) window.SFX.play('draft_pick');
    log(G, `${heroName(G, playerIdx)} drafts ${card.name} into hand.`);
    p.hand.push(card);
    // Remove chosen card from shop row, then clear remaining
    p.shopRow.splice(cardIdx, 1);
    p.shopRow = [];
    // Reveal 3 new shop cards for next draft
    const newCards = p.shopDeck.splice(0, 3);
    p.shopRow = newCards;
    if (p.shopRow.length === 0 && p.shopDeck.length === 0) {
      log(G, `${heroName(G, playerIdx)}'s shop deck is empty!`);
    }
    // Transition to action phase
    G.phase = 'action';
    if (window.UI && window.UI.onPhaseChange) window.UI.onPhaseChange(G);
    return true;
  }

  function rerollShop(G, playerIdx) {
    const p = G.players[playerIdx];
    if (G.phase !== 'draft' || G.activePlayer !== playerIdx) return false;
    if (p.mana.current < 1) {
      log(G, `${heroName(G, playerIdx)} does not have enough mana to reroll.`);
      return false;
    }
    if (p.shopDeck.length === 0) {
      log(G, `${heroName(G, playerIdx)}'s shop deck is empty — cannot reroll.`);
      return false;
    }
    p.mana.current -= 1;
    // Return current shop cards to the bottom of the shop deck
    for (const card of p.shopRow) {
      p.shopDeck.push(card);
    }
    // Shuffle and draw 3 new
    p.shopDeck = shuffle(p.shopDeck);
    p.shopRow = p.shopDeck.splice(0, Math.min(3, p.shopDeck.length));
    if (window.SFX) window.SFX.play('shop_reroll');
    log(G, `${heroName(G, playerIdx)} rerolls the shop (1 mana).`);
    if (window.UI && window.UI.onStateChange) window.UI.onStateChange(G);
    return true;
  }

  function finishEndTurn(G) {
    const idx = G.activePlayer;
    const p = G.players[idx];

    // Draw up to max hand size minus 1 (keep one slot open)
    const maxHand = p.maxHandSize + p.handSizeBonus;
    const drawCount = Math.max(0, maxHand - 1 - p.hand.length);
    if (drawCount > 0) drawCards(G, idx, drawCount);

    // Death's Dominion (S078) cleanup
    // If any minions were resurrected by S078, sacrifice them now
    const s078Minions = getFriendlyMinions(G, idx).filter(m => m.extraAbilities && m.extraAbilities.includes('sacrificeAtEndOfTurn'));
    for (const m of s078Minions) {
      sacrificeMinion(G, m.uid, idx);
    }

    // Increment turn counter, then switch active player
    G.turn++;
    G.activePlayer = 1 - idx;

    checkWinConditions(G);
    if (!G.gameOver) {
      doUpkeep(G);
    }
  }

  function applyEndOfTurnCleanup(G) {
    // Remove temporary keyword/stat buffs
    for (const cleanup of G.endOfTurnCleanup) {
      const cuid = cleanup.uid || cleanup.cardId;
      const m = cuid ? getMinion(G, cuid) : null;
      if (cleanup.type === 'removeKeyword') {
        if (m) { delete m.kw[cleanup.keyword]; }
        continue;
      }
      if (!m) continue;
      if (cleanup.type === 'tempKw') {
        delete m.tempKw[cleanup.keyword];
        // cannotBlock
        if (cleanup.keyword === 'cannotBeBlocked') m.cannotBeBlockedThisTurn = false;
      } else if (cleanup.type === 'tempAtk') {
        m.tempAtk = Math.max(0, m.tempAtk - cleanup.amount);
      } else if (cleanup.type === 'tempHp') {
        m.tempHp = Math.max(0, m.tempHp - cleanup.amount);
      } else if (cleanup.type === 'tempSilence') {
        m.tempSilenced = false;
      }
    }
    G.endOfTurnCleanup = [];
    // Also clear global temp flags
    for (const p of G.players) {
      p.arcaneSupremacyActive = false;
    }
  }

  // ── Sacrifice ─────────────────────────────────────────────
  function sacrificeMinion(G, uid, playerIdx) {
    const m = getMinion(G, uid);
    if (!m) return;
    const atk = getEffectiveAtk(m);
    if (window.SFX) window.SFX.play('sacrifice');
    log(G, `${m.name} is sacrificed.`);
    // Remove from battlefield
    G.battlefield = G.battlefield.filter(c => c.uid !== uid);
    if (!m.isToken) G.players[playerIdx].discard.push(m);

    G.players[playerIdx].minionsDiedThisTurn++;

    // Shadow Dancer (S030) - deal 1 damage to random enemy
    for (const friendly of getFriendlyMinions(G, playerIdx)) {
      if (friendly.defId === 'S030' && !friendly.silenced) {
        const enemies = getEnemyMinions(G, playerIdx);
        if (enemies.length > 0) { dealDamage(G, rand(enemies).uid, 1, null); }
      }
    }

    // Feast of Souls (S086)
    for (const ench of G.players[playerIdx].enchantments) {
      if (ench.defId === 'S086') {
        const others = getFriendlyMinions(G, playerIdx);
        for (const other of others) buffMinion(G, other.uid, 1, 1, true);
        if (others.length > 0) log(G, 'Feast of Souls: all other friendly minions gain +1/+1!');
      }
    }

    // Bloodletting Ritual (S074) sets atk buff — this is handled at card play time
    // Altar of Sacrifice (S083) handled separately

    // Rite of the Blood Moon (S082)
    for (const ench of G.players[playerIdx].enchantments) {
      if (ench.defId === 'S082') {
        const enemies = getEnemyMinions(G, playerIdx);
        if (enemies.length > 0) dealDamage(G, rand(enemies).uid, 1, null);
      }
    }

    return atk;
  }

  // ── Destroy Minion ────────────────────────────────────────
  function destroyMinion(G, uid) {
    uid = toUid(uid);
    const m = getMinion(G, uid);
    if (!m) return;
    if (getKw(m, 'indestructible')) { if (window.SFX) window.SFX.play('indestructible'); log(G, `${m.name} is Indestructible!`); return; }
    const ownerIdx = m.owner;
    const p = G.players[ownerIdx];
    if (window.SFX) window.SFX.play('minion_death');
    log(G, `${m.name} is destroyed.`);

    // Last Breath
    if (!m.silenced) {
      const def = window.CARD_DEFS[m.defId];
      if (def && def.lastBreath) { if (window.SFX) window.SFX.play('last_breath'); def.lastBreath(G, m.uid, ownerIdx, []); }
    }

    // Return to hand on death (Lich's Bargain S098, Shadow Revenant S039)
    if (m.returnToHandOnDeath) {
      G.battlefield = G.battlefield.filter(c => c.uid !== uid);
      m.cost += m.returnCostIncrease;
      m.returnToHandOnDeath = false;
      p.hand.push(m);
      log(G, `${m.name} returns to hand (costs ${m.cost}).`);
      return;
    }

    // Remove from battlefield
    G.battlefield = G.battlefield.filter(c => c.uid !== uid);
    p.minionsDiedThisTurn++;

    if (m.exileOnDeath || m.isToken) {
      // Tokens are exiled (not put in discard)
    } else {
      p.discard.push(m);
    }

    // Carrion Feeder (S038) - any minion dies: gain +1/+0
    for (const friendly of getAllMinions(G)) {
      if (friendly.defId === 'S038' && !friendly.silenced) {
        buffMinion(G, friendly.uid, 1, 0, true);
      }
    }

    // Corpse Harvester (S021) - friendly minion dies
    if (true) { // scope
      for (const fm of getFriendlyMinions(G, ownerIdx)) {
        if (fm.defId === 'S021' && !fm.silenced) {
          buffMinion(G, fm.uid, 1, 0, true);
          log(G, `Corpse Harvester gains +1/+0!`);
        }
      }
    }

    // Ratcatcher (S023) - friendly token dies
    if (m.isToken) {
      for (const fm of getFriendlyMinions(G, ownerIdx)) {
        if (fm.defId === 'S023' && !fm.silenced) {
          buffMinion(G, fm.uid, 1, 0, true);
          log(G, `Ratcatcher gains +1/+0 (token died)!`);
        }
      }
      // Unending Horde (S085)
      for (const ench of p.enchantments) {
        if (ench.defId === 'S085') {
          G.endOfTurnCleanup.push({ type: 'summonToken', owner: ownerIdx, tokenId: 'TK_RAT' });
        }
      }
    }

    // Rite of Blood Moon (S082)
    for (const ench of p.enchantments) {
      if (ench.defId === 'S082') {
        const enemies = getEnemyMinions(G, ownerIdx);
        if (enemies.length > 0) dealDamage(G, rand(enemies).uid, 1, null);
      }
    }

    // Plague Spreader (S084)
    if (getKw(m, 'deathtouch')) {
      for (const ench of p.enchantments) {
        if (ench.defId === 'S084') {
          const noDT = getFriendlyMinions(G, ownerIdx).filter(fm => !getKw(fm, 'deathtouch'));
          if (noDT.length > 0) {
            const target = rand(noDT);
            giveKeyword(G, target.uid, 'deathtouch', true);
            log(G, `Plague Spreader: ${target.name} gains Deathtouch!`);
          }
        }
      }
    }

    // Law of the Jungle (W079) - handled in combat when killer minion destroys enemy
    checkWinConditions(G);
  }

  // ── Damage ────────────────────────────────────────────────
  function dealDamage(G, uid, amount, source) {
    uid = toUid(uid);
    const m = getMinion(G, uid);
    if (!m || amount <= 0) return 0;
    return dealDamageToMinion(G, m, amount, source);
  }

  function dealDamageToMinion(G, m, amount, source) {
    if (amount <= 0) return 0;
    if (getKw(m, 'indestructible')) {
      // Indestructible: still takes damage but won't die
    }

    // Ward check (targeted spells reduce ward, combat damage doesn't)
    // For combat damage, skip ward. For spell/ability damage, reduce ward.
    if (source === null || source === undefined) {
      // Spell/non-combat damage: check ward
      const ward = m.wardCharges;
      if (ward > 0) {
        m.wardCharges = Math.max(0, ward - 1);
        if (window.SFX) window.SFX.play('ward_absorb');
        log(G, `${m.name}'s Ward absorbs the effect! (${m.wardCharges} Ward remaining)`);
        return 0;
      }
    }

    // Shield absorbs damage
    if (m.shieldCharges > 0) {
      if (amount <= m.shieldCharges) {
        m.shieldCharges -= amount;
        if (window.SFX) window.SFX.play('shield_absorb');
        log(G, `${m.name}'s Shield absorbs ${amount} damage! (${m.shieldCharges} remaining)`);
        // Heart of the Forest restore
        if (m.shieldCharges === 0) {
          const owner = G.players[m.owner];
          for (const ench of owner.enchantments) {
            if (ench.defId === 'W087') {
              owner.shieldsToRestoreNextUpkeep.push(m.uid);
              log(G, `Heart of the Forest will restore ${m.name}'s Shield next upkeep.`);
            }
          }
        }
        return 0;
      } else {
        amount -= m.shieldCharges;
        m.shieldCharges = 0;
      }
    }

    m.hp -= amount;
    if (window.SFX) window.SFX.play('damage_minion');
    log(G, `${m.name} takes ${amount} damage. (${m.hp}/${m.maxHp + m.tempHp})`);

    // Feral Grizzly (W026) - when this takes damage, gain +0/+1
    if (m.defId === 'W026' && !m.silenced) {
      buffMinion(G, m.uid, 0, 1, true);
    }

    // Primal Bond (W086) - when a friendly minion heals (not here, but tracks healing)

    // Deathtouch on source minion: treat any damage as lethal
    if (source && getKwWithAura(G, source, 'deathtouch') && amount > 0) {
      if (window.SFX) window.SFX.play('deathtouch');
      m.hp = Math.min(m.hp, 0); // force to 0
    }

    if (m.hp <= 0 && !getKwWithAura(G, m, 'indestructible')) {
      // Will be cleaned up by removeCombatDeadMinions or checked immediately
      // For non-combat damage, destroy immediately
      if (G.phase !== 'combat') {
        destroyMinion(G, m.uid);
      }
    }

    return amount;
  }

  // ── Heal ─────────────────────────────────────────────────
  function healMinion(G, uid, amount) {
    uid = toUid(uid);
    const m = getMinion(G, uid);
    if (!m || amount <= 0) return;
    const before = m.hp;
    m.hp = Math.min(m.maxHp + m.tempHp, m.hp + amount);
    const healed = m.hp - before;
    if (healed > 0) {
      if (window.SFX) window.SFX.play('heal');
      // Wildwood Hydra (W033) on heal gains +1/+0
      if (m.defId === 'W033' && !m.silenced) {
        buffMinion(G, m.uid, 1, 0, true);
        log(G, `Wildwood Hydra gains +1/+0 from healing!`);
      }
      // Primal Bond (W086)
      const owner = G.players[m.owner];
      for (const ench of owner.enchantments) {
        if (ench.defId === 'W086') {
          buffMinion(G, m.uid, 1, 0, true);
          log(G, `Primal Bond: ${m.name} gains +1/+0 from healing!`);
        }
      }
    }
  }

  // ── Buff Minion ───────────────────────────────────────────
  function buffMinion(G, uid, atkBuff, hpBuff, permanent) {
    uid = toUid(uid);
    const m = getMinion(G, uid);
    if (!m) return;
    if (window.SFX) window.SFX.play('buff_apply');
    if (permanent) {
      m.atk = Math.max(0, m.atk + atkBuff);
      if (hpBuff !== 0) {
        m.maxHp = Math.max(1, m.maxHp + hpBuff);
        m.hp = Math.max(1, m.hp + hpBuff);
      }
    } else {
      m.tempAtk += atkBuff;
      if (hpBuff !== 0) {
        m.tempHp += hpBuff;
        // Add to end of turn cleanup
        G.endOfTurnCleanup.push({ type: 'tempAtk', uid, amount: atkBuff });
        G.endOfTurnCleanup.push({ type: 'tempHp', uid, amount: hpBuff });
      } else {
        G.endOfTurnCleanup.push({ type: 'tempAtk', uid, amount: atkBuff });
      }
    }
  }

  function getEffectiveAtk(m) {
    let atk = m.atk + m.tempAtk;
    // Assassin's Guild Master aura (S036)
    // This is checked in combat — for now we'll apply it dynamically
    return Math.max(0, atk);
  }

  // ── Keyword Management ────────────────────────────────────
  function getKw(m, keyword) {
    if (!m) return undefined;
    if (m.silenced || m.tempSilenced) {
      // Silenced minions lose all abilities
      // But basic stats remain
      return undefined;
    }
    // Check temp keyword
    const tempVal = m.tempKw && m.tempKw[keyword];
    const permVal = m.kw && m.kw[keyword];
    // Return the higher value (or true if boolean)
    if (tempVal !== undefined && permVal !== undefined) {
      if (typeof tempVal === 'number') return Math.max(tempVal, permVal);
      return tempVal || permVal;
    }
    return tempVal !== undefined ? tempVal : permVal;
  }

  function getKwWithAura(G, m, keyword) {
    const base = getKw(m, keyword);
    if (base) return base;
    // Check enchantment auras
    const owner = G.players[m.owner];
    for (const ench of owner.enchantments) {
      if (ench.defId === 'W080' && keyword === 'reach') return true; // Verdant Canopy
      if (ench.defId === 'W082' && keyword === 'thorns') return 1;  // Thorn Barrier
      if (ench.defId === 'W080' && keyword === 'reach') return true;
      if (ench.defId === 'M080' && keyword === 'ward') return 1;    // Arcane Ward
      if (ench.defId === 'S087' && keyword === 'menace') return true; // Shadow Dominion
    }
    // Beastmaster's Mark (W080)
    for (const ench of owner.enchantments) {
      if (ench.defId === 'W080' && keyword === 'trample' && m.atk >= 4) return true;
      if (ench.defId === 'W085' && keyword === 'piercing' && getKwWithAura(G, m, 'trample')) return 1; // Aspect of the Predator
    }
    return undefined;
  }

  function giveKeyword(G, uid, keyword, value) {
    uid = toUid(uid);
    const m = getMinion(G, uid);
    if (!m) return;
    if (typeof value === 'boolean' || value === true) {
      m.kw[keyword] = true;
    } else if (typeof value === 'number') {
      m.kw[keyword] = (m.kw[keyword] || 0) + value;
      if (keyword === 'shield') m.shieldCharges = (m.shieldCharges || 0) + value;
      if (keyword === 'ward') m.wardCharges = (m.wardCharges || 0) + value;
    }
  }

  function giveKeywordTemp(G, uid, keyword, value) {
    uid = toUid(uid);
    const m = getMinion(G, uid);
    if (!m) return;
    m.tempKw[keyword] = value === undefined ? true : value;
    G.endOfTurnCleanup.push({ type: 'tempKw', uid, keyword });
  }

  function removeKeyword(G, uid, keyword) {
    const m = getMinion(G, uid);
    if (!m) return;
    delete m.kw[keyword];
    delete m.tempKw[keyword];
    if (keyword === 'shield') m.shieldCharges = 0;
    if (keyword === 'ward') m.wardCharges = 0;
  }

  function silenceMinion(G, uid) {
    uid = toUid(uid);
    const m = getMinion(G, uid);
    if (!m) return;
    m.silenced = true;
    m.kw = {};
    m.tempKw = {};
    m.shieldCharges = 0;
    m.wardCharges = 0;
    if (window.SFX) window.SFX.play('silence');
    log(G, `${m.name} is silenced!`);
  }

  // ── Freeze ────────────────────────────────────────────────
  function freezeMinion(G, uid, turns) {
    uid = toUid(uid);
    const m = getMinion(G, uid);
    if (!m) return;
    m.frozenTurns = Math.max(m.frozenTurns, turns);
    m.tapped = true;
    if (window.SFX) window.SFX.play('freeze');
    log(G, `${m.name} is frozen for ${turns} upkeep(s).`);
  }

  function tapMinion(G, uid, turns) {
    uid = toUid(uid);
    const m = getMinion(G, uid);
    if (!m) return;
    m.tapped = true;
    m.frozenTurns = Math.max(m.frozenTurns, turns);
    log(G, `${m.name} is tapped for ${turns} turn(s).`);
  }

  // ── Draw ──────────────────────────────────────────────────
  function drawCards(G, playerIdx, count) {
    const p = G.players[playerIdx];
    for (let i = 0; i < count; i++) {
      if (p.deck.length === 0) {
        if (p.discard.length === 0) { log(G, `${heroName(G, playerIdx)} has no cards to draw!`); break; }
        p.deck = shuffle([...p.discard]);
        p.discard = [];
        log(G, `${heroName(G, playerIdx)} shuffles discard pile into deck.`);
      }
      const card = p.deck.shift();
      p.hand.push(card);
      if (window.SFX) window.SFX.play('card_draw');
      // Notify UI about each individual card drawn
      if (window.UI && window.UI.onCardDrawn) {
        window.UI.onCardDrawn(G, playerIdx, card);
      }
    }
  }

  // ── Mana ──────────────────────────────────────────────────
  function gainMana(G, playerIdx, amount) {
    const p = G.players[playerIdx];
    p.mana.current = Math.min(p.mana.current + amount, p.mana.max + 10); // allow some overflow
    log(G, `${heroName(G, playerIdx)} gains ${amount} mana (${p.mana.current}/${p.mana.max}).`);
  }

  // ── Insight ───────────────────────────────────────────────
  function gainInsight(G, playerIdx, amount) {
    if (amount <= 0) return;
    const p = G.players[playerIdx];
    p.insight += amount;
    if (window.SFX) window.SFX.play('insight_gain');
    log(G, `${heroName(G, playerIdx)} gains ${amount} Insight (total: ${p.insight}).`);
    checkWinConditions(G);
  }

  // ── Scout (scry) ──────────────────────────────────────────
  function scry(G, playerIdx, count) {
    // For simplicity: move top N cards to be visible (UI will handle showing them)
    // Just log it
    if (window.SFX) window.SFX.play('scry');
    log(G, `${heroName(G, playerIdx)} scouts ${count} cards.`);
    // In UI: show top N cards and let player reorder
    if (window.UI && window.UI.onScout) window.UI.onScout(G, playerIdx, count);
  }

  function extraDraft(G, playerIdx, count) {
    log(G, `${heroName(G, playerIdx)} gets an extra draft pick!`);
    // Handled at draft phase
    G.players[playerIdx]._extraDrafts = (G.players[playerIdx]._extraDrafts || 0) + count;
  }

  // ── Token Summoning ───────────────────────────────────────
  function summonToken(G, ownerIdx, tokenId) {
    const def = window.TOKEN_DEFS[tokenId];
    if (!def) { log(G, 'Unknown token: ' + tokenId); return null; }
    const token = instantiateCard(tokenId, ownerIdx);
    token.owner = ownerIdx;
    G.battlefield.push(token);
    if (window.SFX) window.SFX.play('token_summon');
    log(G, `${heroName(G, ownerIdx)} summons a ${token.name} token!`);
    triggerRally(G, ownerIdx, token.uid);
    // Shadows of Paranoia
    const opp = G.players[1 - ownerIdx];
    for (const ench of opp.enchantments) {
      if (ench.defId === 'S080') { dealDamage(G, token.uid, 1, null); }
    }
    // Temporal Barrier
    for (const ench of opp.enchantments) {
      if (ench.defId === 'M086') {
        freezeMinion(G, token.uid, 1);
        dealDamage(G, token.uid, 1, null);
      }
    }
    checkWinConditions(G);
    return token;
  }

  // ── Counter Spell ─────────────────────────────────────────
  function counterSpell(G, stackItemId) {
    // Find the target entry in the stack and mark it as countered
    const entry = G.stack.find(s => s.id === stackItemId);
    if (!entry) return false;
    entry.countered = true;
    log(G, `${entry.cardName || 'spell'} has been countered!`);
    return true;
  }

  // ── Transform ─────────────────────────────────────────────
  function transformMinion(G, cardId, newCardDefId) {
    const m = getMinion(G, cardId);
    if (!m) return;
    const newDef = window.CARD_DEFS[newCardDefId] || window.TOKEN_DEFS[newCardDefId];
    if (!newDef) return;
    const owner = m.owner;
    const tapped = m.tapped;
    // Replace stats
    m.defId = newCardDefId;
    m.id = newCardDefId;
    m.name = newDef.name;
    m.atk = newDef.baseAtk || 0;
    m.hp = newDef.baseHp || 0;
    m.maxHp = newDef.baseHp || 0;
    m.kw = Object.assign({}, newDef.kw || {});
    m.tempKw = {};
    m.shieldCharges = m.kw.shield || 0;
    m.wardCharges = m.kw.ward || 0;
    m.silenced = false;
    m.tapped = tapped;
    if (window.SFX) window.SFX.play('transform');
    log(G, `A minion is transformed into ${m.name}!`);
  }

  function returnToHand(G, uid) {
    uid = toUid(uid);
    const m = getMinion(G, uid);
    if (!m) return;
    const ownerIdx = m.owner;
    G.battlefield = G.battlefield.filter(c => c.uid !== uid);
    // Reset battlefield state
    m.tapped = false;
    m.frozenTurns = 0;
    m.tempAtk = 0;
    m.tempHp = 0;
    m.tempKw = {};
    m.hasAttackedThisTurn = false;
    m.enteredThisTurn = false;
    G.players[ownerIdx].hand.push(m);
    if (window.SFX) window.SFX.play('bounce');
    log(G, `${m.name} is returned to hand.`);
  }

  // ── Utility Getters ───────────────────────────────────────
  /** Normalize uid: accept either a uid string or a minion object with .uid */
  function toUid(uidOrObj) {
    return (uidOrObj && typeof uidOrObj === 'object' && uidOrObj.uid) ? uidOrObj.uid : uidOrObj;
  }

  function getMinion(G, uid) {
    uid = toUid(uid);
    return G.battlefield.find(m => m.uid === uid) || null;
  }
  function getMinionOwner(G, uid) {
    const m = getMinion(G, uid);
    return m ? m.owner : -1;
  }
  function getFriendlyMinions(G, playerIdx) {
    return G.battlefield.filter(m => m.owner === playerIdx);
  }
  function getEnemyMinions(G, playerIdx) {
    return G.battlefield.filter(m => m.owner !== playerIdx);
  }
  function getAllMinions(G) {
    return [...G.battlefield];
  }
  function getPlayer(G, playerIdx) {
    return G.players[playerIdx];
  }
  function getOpponentIdx(playerIdx) {
    return 1 - playerIdx;
  }
  function heroName(G, idx) {
    const names = { warden: 'The Warden', shadow: 'The Shadow', archmage: 'The Archmage' };
    return names[G.players[idx].hero] || 'Player ' + (idx + 1);
  }

  function addEndOfTurnCleanup(G, obj) {
    G.endOfTurnCleanup.push(obj);
  }

  // ── Frenzy: after killing in combat, can attack again ─────
  function checkFrenzyAfterCombat(G, attackerUid) {
    const m = getMinion(G, attackerUid);
    if (!m) return;
    if (getKw(m, 'frenzy') && m.damageDealtThisCombat > 0) {
      m.tapped = false;
      m.hasAttackedThisTurn = false;
      if (window.SFX) window.SFX.play('frenzy');
      log(G, `${m.name} has Frenzy and can attack again!`);
    }
  }

  // ── Expose public API ─────────────────────────────────────
  return {
    // Game lifecycle
    createGame,
    startGame,
    doUpkeep,
    doEndTurn,
    draftCard,
    rerollShop,
    // Actions
    playCard,
    playCardAndResolve,
    initiateCombat,
    declareAttackers,
    declareBlockers,
    endCombat,
    // Stack system
    pushToStack,
    resolveStack,
    resolveStackEntry,
    openPriorityWindow,
    canRespondWithInstant,
    // Effects (called by card defs)
    summonToken,
    destroyMinion,
    returnToHand,
    buffMinion,
    giveKeyword,
    giveKeywordTemp,
    removeKeyword,
    silenceMinion,
    healMinion,
    dealDamage,
    freezeMinion,
    tapMinion,
    drawCards,
    gainMana,
    gainInsight,
    scry,
    extraDraft,
    counterSpell,
    transformMinion,
    sacrificeMinion,
    addEndOfTurnCleanup,
    // Queries
    getMinion,
    getMinionOwner,
    getFriendlyMinions,
    getEnemyMinions,
    getAllMinions,
    getPlayer,
    getOpponentIdx,
    getKw,
    getKwWithAura,
    getEffectiveAtk,
    getEffectiveCost,
    heroName,
    instantiateCard,
    reapplyUpgrades,
    battlecryNeedsTarget,
    getBattlecryTargetType,
    // Logging
    log,
    // Combat helpers
    resolveSingleAttackerDamage,
    removeCombatDeadMinions,
    checkFrenzyAfterCombat,
    // Util
    rand,
    shuffle,
    checkWinConditions,
  };

})();
