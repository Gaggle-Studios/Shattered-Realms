'use strict';

// ============================================================
// SHATTERED REALMS — AI Player
// ============================================================
// Simple but strategic AI for single-player mode.
// The AI plays as player index 1 (G.aiPlayerIdx).
// ============================================================

window.AI = (function () {

  const E = () => window.Engine;

  // ── Evaluate board state ──────────────────────────────────
  function evalMinion(m) {
    if (!m) return 0;
    const atk = E().getEffectiveAtk(m);
    const hp = m.hp;
    let score = atk * 1.5 + hp;
    const kw = m.kw || {};
    if (kw.trample) score += 2;

    if (kw.deathtouch) score += 3;
    if (kw.taunt) score += 1;
    if (kw.menace) score += 1.5;
    if (kw.doubleStrike || kw.firstStrike) score += 2;
    if (kw.regenerate) score += kw.regenerate;
    if (kw.shield) score += kw.shield;
    if (kw.ward) score += kw.ward;
    if (kw.stealth) score += 1.5;
    if (kw.indestructible) score += 10;
    if (m.silenced) score = atk + hp; // silenced = vanilla
    return score;
  }

  function evalBoardState(G, playerIdx) {
    const myMinions = E().getFriendlyMinions(G, playerIdx);
    const oppMinions = E().getEnemyMinions(G, playerIdx);
    const myScore = myMinions.reduce((s, m) => s + evalMinion(m), 0);
    const oppScore = oppMinions.reduce((s, m) => s + evalMinion(m), 0);
    return myScore - oppScore;
  }

  // ── Card Play Evaluation ──────────────────────────────────
  function evalCardPlay(G, playerIdx, card, targets) {
    const p = G.players[playerIdx];
    const opp = G.players[1 - playerIdx];
    const myMinions = E().getFriendlyMinions(G, playerIdx);
    const oppMinions = E().getEnemyMinions(G, playerIdx);

    if (card.type === 'minion') {
      let score = card.baseAtk * 1.5 + card.baseHp;
      const kw = card.kw || {};
  
      if (kw.trample) score += 1;
      if (kw.deathtouch) score += 3;
      if (kw.taunt) score += myMinions.length > 0 ? 2 : 1;
      // Prefer playing higher-cost cards when we can afford them
      score += card.cost * 0.5;
      // Prefer playing when board is empty
      if (myMinions.length === 0) score += 1;
      return score;
    }

    if (card.type === 'instant' || card.type === 'sorcery') {
      // Evaluate spells based on situation
      const def = window.CARD_DEFS[card.defId];
      // Cards that deal damage are better when opponent has minions
      const damageSpells = ['W049','W054','W056','W059','W060','S006','S007','S053','S054','S058','S059','S061','S063','S064','S065','M008','M039','M046','M047','M062','M066','M071'];
      if (damageSpells.includes(card.defId) && oppMinions.length > 0) return 8;
      if (damageSpells.includes(card.defId) && oppMinions.length === 0) return 1;

      // Draw cards: always valuable
      const drawSpells = ['S009','S010','S060','M009','M039','M063','M064','M067','M075'];
      if (drawSpells.includes(card.defId)) return 7 + p.hand.length < 3 ? 2 : 0;

      // Buff spells: better when we have minions
      const buffSpells = ['W008','W010','W052','W056','W059','W062','W064','W068','W072','W075'];
      if (buffSpells.includes(card.defId) && myMinions.length > 0) return 6;
      if (buffSpells.includes(card.defId)) return 2;

      // Heal spells: better when our minions are damaged
      const healSpells = ['W006','W007','W053','W061','W065'];
      const damagedFriendly = myMinions.filter(m => m.hp < m.maxHp);
      if (healSpells.includes(card.defId) && damagedFriendly.length > 0) return 5;
      if (healSpells.includes(card.defId)) return 1;

      return 4; // Default spell value
    }

    if (card.type === 'enchantment') {
      // Enchantments are always somewhat valuable
      return 5 + myMinions.length * 0.5;
    }

    if (card.type === 'upgrade') {
      // Upgrades need a target minion
      if (myMinions.length === 0) return 0;
      return 5;
    }

    if (card.type === 'curse') {
      // Curses need an enemy target with keywords to strip
      if (oppMinions.length === 0) return 0;
      const withKw = oppMinions.filter(m => Object.keys(m.kw || {}).some(k => m.kw[k]));
      if (withKw.length === 0) return 2; // still has secondary effects
      return 6;
    }

    return 3;
  }

  // ── Target Selection ──────────────────────────────────────
  function selectTargets(G, playerIdx, card) {
    const def = window.CARD_DEFS[card.defId];
    // Counter spells can only be played reactively during priority — skip in normal turn
    if (def && def.isCounter) return null;

    const myMinions = E().getFriendlyMinions(G, playerIdx);
    const oppMinions = E().getEnemyMinions(G, playerIdx);

    // Damage spells: target highest-HP enemy, or tapped enemy for Backstab
    const damageInstants = ['S006','S007','S053','S054','S058','S063','M008','M039','M046','W049','W054','W060'];
    if (damageInstants.includes(card.defId)) {
      if (card.defId === 'S007') {
        // Backstab: target tapped enemy
        const tapped = oppMinions.filter(m => m.tapped);
        if (tapped.length === 0) return null;
        return [tapped.sort((a,b) => b.hp - a.hp)[0].uid];
      }
      if (oppMinions.length === 0) return null;
      const target = oppMinions.sort((a,b) => b.hp - a.hp)[0];
      return [target.uid];
    }

    // Buff/heal spells: target our best/most damaged minion
    const buffInstants = ['W007','W008','W051','W052','W055','W058','W059','W062','W064','W068','W072'];
    if (buffInstants.includes(card.defId)) {
      if (myMinions.length === 0) return null;
      // Pick highest-attack minion for buffs
      const target = myMinions.sort((a,b) => E().getEffectiveAtk(b) - E().getEffectiveAtk(a))[0];
      return [target.uid];
    }

    const healInstants = ['W006','W007','W053','W061','W065'];
    if (healInstants.includes(card.defId)) {
      const damaged = myMinions.filter(m => m.hp < m.maxHp);
      if (damaged.length === 0) return myMinions.length > 0 ? [myMinions[0].uid] : null;
      const target = damaged.sort((a,b) => (a.hp/a.maxHp) - (b.hp/b.maxHp))[0]; // most damaged
      return [target.uid];
    }

    // Upgrades: target best minion
    if (card.type === 'upgrade') {
      if (myMinions.length === 0) return null;
      const target = myMinions.sort((a,b) => evalMinion(b) - evalMinion(a))[0];
      return [target.uid];
    }

    // Curses: target enemy minion with most keywords (prefer high-value targets)
    if (card.type === 'curse') {
      if (oppMinions.length === 0) return null;
      const scored = oppMinions.map(m => {
        const kwCount = Object.keys(m.kw || {}).filter(k => m.kw[k]).length;
        return { m, score: kwCount * 3 + evalMinion(m) };
      });
      scored.sort((a,b) => b.score - a.score);
      return [scored[0].m.uid];
    }

    // Return to hand: target our own weakest (to redeploy with battlecry, or to save from death)
    if (card.defId === 'S015' || card.defId === 'S055' || card.defId === 'M007' || card.defId === 'M045') {
      // Return enemy minion with M007/M045
      if (card.defId === 'M007' || card.defId === 'M045') {
        if (oppMinions.length === 0) return null;
        const target = oppMinions.sort((a,b) => evalMinion(b) - evalMinion(a))[0];
        return [target.uid];
      }
      if (myMinions.length === 0) return null;
      const target = myMinions.sort((a,b) => a.hp - b.hp)[0]; // weakest
      return [target.uid];
    }

    // Sacrifice spells
    const sacrificeSpells = ['S010','S059','S060','S070','S074'];
    if (sacrificeSpells.includes(card.defId)) {
      const tokens = myMinions.filter(m => m.isToken);
      if (tokens.length > 0) return [tokens[0].uid];
      if (myMinions.length === 0) return null;
      // Sacrifice weakest
      return [myMinions.sort((a,b) => evalMinion(a) - evalMinion(b))[0].uid];
    }

    // Freeze spells
    if (card.defId === 'M008' || card.defId === 'M041' || card.defId === 'M047' || card.defId === 'M052' || card.defId === 'M066') {
      if (oppMinions.length === 0) return null;
      // Freeze highest ATK enemy
      return [oppMinions.sort((a,b) => E().getEffectiveAtk(b) - E().getEffectiveAtk(a))[0].uid];
    }

    // Destroy spells
    if (card.defId === 'S063') {
      if (oppMinions.length === 0) return null;
      return [oppMinions.sort((a,b) => evalMinion(b) - evalMinion(a))[0].uid];
    }
    if (card.defId === 'W069') {
      // Return to Earth: only targets minions with cost 4+
      const expensive = oppMinions.filter(m => (m.cost || 0) >= 4);
      if (expensive.length === 0) return null;
      return [expensive.sort((a,b) => evalMinion(b) - evalMinion(a))[0].uid];
    }

    // Generic fallback for targeted spells not in specific lists
    const fallbackDef = window.CARD_DEFS && window.CARD_DEFS[card.defId];
    if (fallbackDef && fallbackDef.onPlay && fallbackDef.onPlay.length >= 4 && (fallbackDef.targetType || '') !== 'none') {
      // Infer target type from card text
      const text = (card.text || '').toLowerCase();
      if (/\bfriendly\b/.test(text)) {
        if (myMinions.length === 0) return null;
        return [myMinions.sort((a,b) => evalMinion(b) - evalMinion(a))[0].uid];
      }
      if (oppMinions.length === 0) return null;
      return [oppMinions.sort((a,b) => evalMinion(b) - evalMinion(a))[0].uid];
    }

    return [];
  }

  // ── Main AI Turn Logic ────────────────────────────────────
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function takeTurn(G, aiIdx) {
    if (G.gameOver) return;
    if (G.phase !== 'action') return;
    const p = G.players[aiIdx];
    log(G, `🤖 AI (${E().heroName(G, aiIdx)}) is thinking...`);
    if (window.UI && window.UI.onStateChange) window.UI.onStateChange(G);
    await delay(1000);

    // Play cards from hand (prioritized)
    let played = true;
    let iterations = 0;
    while (played && iterations < 20) {
      if (G.gameOver) return;
      played = false;
      iterations++;

      // Sort hand by playability and value
      const playable = p.hand
        .filter(c => E().getEffectiveCost(G, aiIdx, c) <= p.mana.current)
        .map(c => ({ card: c, targets: selectTargets(G, aiIdx, c), score: evalCardPlay(G, aiIdx, c, []) }))
        .filter(entry => {
          // Skip if targeting required but no targets available
          if (entry.targets === null) return false;
          return entry.score > 0;
        })
        .sort((a, b) => b.score - a.score);

      if (playable.length === 0) break;

      const best = playable[0];
      const isTargetedSpell = best.targets && best.targets.length > 0 &&
        (best.card.type === 'instant' || best.card.type === 'sorcery');

      if (isTargetedSpell && window.UI && window.UI.showSpellTargetArrow) {
        // Show spell arrow animation before playing (1s delay)
        await window.UI.showSpellTargetArrow(G, best.card, best.targets[0], aiIdx);
        // Suppress normal card-play animation since we already showed the spell ghost
        if (window.UI.skipNextCardPlayAnim) window.UI.skipNextCardPlayAnim(true);
      }

      const success = await E().playCardAndResolve(G, aiIdx, best.card.uid, best.targets || []);
      if (isTargetedSpell && window.UI && window.UI.skipNextCardPlayAnim) {
        window.UI.skipNextCardPlayAnim(false);
      }
      if (success) {
        played = true;
        if (window.UI && window.UI.onStateChange) window.UI.onStateChange(G);
        // Wait for card play animation to finish before next action
        if (window.UI && window.UI.waitForAnimation) await window.UI.waitForAnimation();
        await delay(500);
      }
    }

    if (G.gameOver) return;

    // Initiate combat if we have attackers
    await aiAttack(G, aiIdx);
    if (window.UI && window.UI.onStateChange) window.UI.onStateChange(G);
    if (G.phase === 'combat' || G.players[aiIdx].hasInitiatedCombat) {
      await delay(1000);
    }

    // If combat is waiting for human to declare blockers, wait for that to finish
    if (G.combatStep === 'declareBlockers' && window.UI && window.UI.waitForBlockers) {
      await window.UI.waitForBlockers();
    }

    // Wait for combat damage animation to finish
    if (window.UI && window.UI.waitForCombatAnimation) {
      await window.UI.waitForCombatAnimation();
    }

    // End turn
    if (!G.gameOver) {
      E().doEndTurn(G);
    }
  }

  async function aiAttack(G, aiIdx) {
    if (G.gameOver) return;
    if (G.players[aiIdx].hasInitiatedCombat) return;

    const myMinions = E().getFriendlyMinions(G, aiIdx).filter(m =>
      !m.tapped && !E().getKw(m, 'defender')
    );
    if (myMinions.length === 0) return;

    const oppMinions = E().getEnemyMinions(G, aiIdx);
    const oppHero = G.players[1 - aiIdx];

    // Decide which minions to attack with
    const attackers = [];

    // If we can lethal the hero, attack all
    const totalAtk = myMinions.reduce((s, m) => {
      if (!E().getKw(m, 'defender')) return s + E().getEffectiveAtk(m);
      return s;
    }, 0);

    let canTrample = false;
    for (const m of myMinions) {
      if (E().getKwWithAura(G, m, 'trample')) canTrample = true;
    }

    // Simple strategy: attack with all non-defender minions
    for (const m of myMinions) {
      attackers.push(m.uid);
    }

    if (attackers.length === 0) return;

    E().initiateCombat(G);
    if (G.phase !== 'combat') return;

    await E().declareAttackers(G, attackers);
    if (G.combatStep !== 'declareBlockers') return;

    // AI blocking will be done by opponent (human or AI)
    // For AI vs AI this would need blocking logic too, but for now
    // In singleplayer, the AI is player 1 attacking player 0 who defends
    // So we just pass empty blockers if AI is blocking its own attack (nonsensical)
    // The UI will prompt the human player to block when AI attacks

    // If the defender is also AI, auto-block immediately.
    // If the defender is human, the UI will handle blocking and call declareBlockers.
    const defIdx = 1 - aiIdx;
    if (defIdx === G.aiPlayerIdx) {
      autoBlock(G, defIdx);
    }
    // Otherwise, the UI onCombatStep callback handles the human blocker step
  }

  // ── Auto-blocking logic (for AI defense or testing) ───────
  function autoBlock(G, defIdx) {
    const defenders = E().getFriendlyMinions(G, defIdx).filter(m => !m.tapped);
    const attackerUids = G.attackers;
    const oppMinions = E().getFriendlyMinions(G, G.activePlayer);
    const blockingMap = {};

    // Initialize empty
    for (const uid of attackerUids) blockingMap[uid] = [];

    // Must block taunt minions first
    const tauntAttackers = attackerUids.filter(uid => {
      const m = E().getMinion(G, uid);
      return m && E().getKw(m, 'taunt');
    });
    const available = [...defenders];

    // Optimal blocking: try to trade favorably or protect hero
    const heroHp = G.players[defIdx].health;
    const totalUnblockedDmg = attackerUids.reduce((s, uid) => {
      const m = E().getMinion(G, uid);
      return s + (m ? E().getEffectiveAtk(m) : 0);
    }, 0);

    // Simple blocking: assign defenders to attackers starting with strongest attackers
    const sortedAttackers = [...attackerUids].sort((a, b) => {
      const ma = E().getMinion(G, a);
      const mb = E().getMinion(G, b);
      return E().getEffectiveAtk(mb) - E().getEffectiveAtk(ma);
    });

    for (const attUid of sortedAttackers) {
      const attacker = E().getMinion(G, attUid);
      if (!attacker) continue;

      // Skip if attacker has stealth and just entered
      if (E().getKw(attacker, 'stealth') && attacker.enteredThisTurn) continue;

      const atkVal = E().getEffectiveAtk(attacker);

      // Find a good blocker
      let bestBlocker = null;
      let bestScore = -999;

      const candidateBlockers = available.filter(b => {
        // Menace: need 2, but we pick 1 at a time (will skip menace for now)
        return true;
      });

      for (const blocker of candidateBlockers) {
        const blkAtk = E().getEffectiveAtk(blocker);
        const blkHp = blocker.hp;
        const attHp = attacker.hp;

        // Can we kill the attacker without dying?
        const weKillIt = E().getKw(blocker, 'deathtouch') ? true : blkAtk >= attHp;
        const weDie = E().getKw(attacker, 'deathtouch') ? true : atkVal >= blkHp;

        let score = 0;
        if (weKillIt && !weDie) score = 10; // Favorable trade
        else if (weKillIt && weDie) score = evalMinion(attacker) - evalMinion(blocker); // Compare values
        else if (!weKillIt && !weDie) score = -2; // Chump block (prevent damage)
        else score = -5; // We die and don't kill it (bad)

        // Prefer blocking if hero health is low
        if (heroHp <= atkVal * 2) score += 5;

        if (score > bestScore) {
          bestScore = score;
          bestBlocker = blocker;
        }
      }

      // Only block if it's advantageous or hero health is at risk
      if (bestBlocker && (bestScore > 0 || heroHp <= atkVal * 2 || (tauntAttackers.includes(attUid) && available.length > 0))) {
        blockingMap[attUid] = [bestBlocker.uid];
        const bidx = available.findIndex(b => b.uid === bestBlocker.uid);
        if (bidx !== -1) available.splice(bidx, 1);

        // Menace: need a second blocker
        if (E().getKw(attacker, 'menace') && available.length > 0) {
          // Find cheapest additional blocker
          const extra = available[0];
          blockingMap[attUid].push(extra.uid);
          available.splice(0, 1);
        }
      }
    }

    E().declareBlockers(G, blockingMap);
  }

  // ── Priority Response (Stack / Instant speed) ─────────────
  async function respondToPriority(G, aiIdx) {
    await delay(800); // "thinking" pause
    if (G.gameOver) return { action: 'pass' };

    const p = G.players[aiIdx];
    const affordableInstants = p.hand.filter(c => {
      if (c.type !== 'instant' && !E().getKw(c, 'flash')) return false;
      return E().getEffectiveCost(G, aiIdx, c) <= p.mana.current;
    });

    if (affordableInstants.length === 0) return { action: 'pass' };

    let bestCard = null;
    let bestScore = 0;
    let bestTargets = [];

    for (const card of affordableInstants) {
      const def = window.CARD_DEFS[card.defId];
      let score = 0;
      let targets = [];

      // Counter spells: evaluate threat of top stack entry
      if (def && def.isCounter && G.stack.length > 0) {
        const topEntry = G.stack[G.stack.length - 1];
        if (topEntry.ownerIdx !== aiIdx) {
          score = evalStackThreat(G, aiIdx, topEntry);
          // Validate counter subtype restrictions
          if (card.defId === 'M043' && topEntry.card.type !== 'instant') score = 0; // Negate = instants only
          if (card.defId === 'M048' && topEntry.card.type !== 'minion') score = 0; // Essence Scatter = minions only
          targets = [topEntry.id];
        }
      } else {
        // Non-counter instants: evaluate reactively
        const evalTargets = selectTargets(G, aiIdx, card);
        if (evalTargets === null) continue;
        targets = evalTargets;

        // Combat tricks are good during combat
        if (G.phase === 'combat') {
          score = evalCardPlay(G, aiIdx, card, targets) * 0.8;
        } else {
          // During opponent's action phase, damage/buff instants are situational
          score = evalCardPlay(G, aiIdx, card, targets) * 0.5;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestCard = card;
        bestTargets = targets;
      }
    }

    // Only play if the score is high enough to warrant reacting
    if (bestCard && bestScore >= 5) {
      log(G, `🤖 AI responds with ${bestCard.name}!`);
      const success = E().playCard(G, aiIdx, bestCard.uid, bestTargets);
      if (success) {
        if (window.UI && window.UI.onStateChange) window.UI.onStateChange(G);
        return { action: 'play' };
      }
    }

    return { action: 'pass' };
  }

  function evalStackThreat(G, aiIdx, stackEntry) {
    const card = stackEntry.card;
    if (!card) return 0;
    let threat = card.cost * 1.5; // Higher cost = higher threat

    if (card.type === 'minion') {
      threat += (card.baseAtk || 0) * 1.2 + (card.baseHp || 0) * 0.8;
      const kw = card.kw || {};
      if (kw.deathtouch) threat += 4;
      if (kw.indestructible) threat += 8;
    }

    if (card.type === 'instant' || card.type === 'sorcery') {
      // Damage spells targeting AI minions are high threat
      const text = (card.text || '').toLowerCase();
      if (/deal.*damage/i.test(text)) threat += 4;
      if (/destroy/i.test(text)) threat += 6;
    }

    return threat;
  }

  // ── Draft Logic ───────────────────────────────────────────
  function pickDraftCard(G, aiIdx) {
    const p = G.players[aiIdx];
    if (p.shopRow.length === 0) return false;

    // Score each available card
    const scored = p.shopRow.map(card => {
      let score = evalCardPlay(G, aiIdx, card, []);
      // Prefer cards we can play next few turns
      const turnDiff = card.cost - p.mana.max;
      score -= Math.max(0, turnDiff - 1) * 0.5;
      return { card, score };
    }).sort((a, b) => b.score - a.score);

    const best = scored[0].card;
    E().draftCard(G, aiIdx, best.uid);
    return true;
  }

  function log(G, msg) {
    E().log(G, msg);
  }

  // ── Expose public API ─────────────────────────────────────
  return {
    takeTurn,
    autoBlock,
    pickDraftCard,
    evalMinion,
    evalBoardState,
    selectTargets,
    respondToPriority,
  };

})();
