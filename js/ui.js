/* ═══════════════════════════════════════════════════════════════════
   SHATTERED REALMS — ui.js
   Complete UI controller. Attached to window.UI.
   Callbacks consumed by Engine: onPhaseChange, onStateChange,
   onGameOver, appendLog, onScout.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Internal state ────────────────────────────────────────────── */
  let _G             = null;
  let _humanIdx      = 0;
  let _gameMode      = 'singleplayer';
  let _selectedCard  = null;
  let _selectedBlocker = null;
  let _pendingTargetCard = null;
  let _spellAnimPromise = Promise.resolve();  // spell targeting arrow animation
  let _spellGhost = null;  // ghost element for spell in activation zone
  let _spellAnimating = false;  // true during spell arrow animation
  let _skipNextCardPlayAnim = false;  // suppress card-play animation after spell target arrow
  // Trigger targeting state (for battlecry etc.)
  let _pendingTriggerEntry = null;   // stack entry awaiting target
  let _triggerTargetResolve = null;  // Promise resolve callback
  let _triggerGhost = null;          // ghost element for trigger minion
  let _aiRunning     = false;
  let _passDismiss   = null;

  /* ── Tap animation tracking ────────────────────────────────── */
  let _prevTapState  = {};   // uid → boolean (tapped state from last render)

  /* ── Blocker declaration state ──────────────────────────────── */
  let _blockerArrowState = null;  // { blockerUid, startEl, lineEl, startX, startY }
  let _blockersResolve   = null;  // resolve fn for waitForBlockers promise

  /* ── Priority / Stack state ─────────────────────────────────── */
  let _inPriorityWindow = false;
  let _priorityResolve  = null;  // resolve fn for requestPriority promise
  let _priorityTimerId  = null;
  let _priorityCountdown = 15;

  /* ── Drag-and-drop state ────────────────────────────────────── */
  let _dragState     = null;   // { card, originEl, ghostEl, startX, startY, originRect }

  /* ── Hero emoji map ──────────────────────────────────────────── */
  const HERO_EMOJI = {
    warden:   '\u{1F33F}',
    shadow:   '\u{1F311}',
    archmage: '\u2728',
  };

  /* ── Keyword display map ───────────────────────────────────────── */
  const KW_LABELS = {
    flying:        '\u{1F98B} Flying',
    trample:       '\u{1F43E} Trample',
    deathtouch:    '\u2620\uFE0F Deathtouch',
    taunt:         '\u{1F6E1}\uFE0F Taunt',
    menace:        '\u{1F479} Menace',
    stealth:       '\u{1F464} Stealth',
    firstStrike:   '\u26A1 First Strike',
    doubleStrike:  '\u26A1\u26A1 Double Strike',
    defender:      '\u{1F3F0} Defender',
    vigilance:     '\u{1F441}\uFE0F Vigilance',
    reach:         '\u{1F3AF} Reach',
    flash:         '\u26A1 Flash',
    hexproof:      '\u{1F52E} Hexproof',
    indestructible:'\u{1F48E} Indestructible',
    frenzy:        '\u{1F525} Frenzy',
    siphon:        '\u{1F9DB} Siphon',
  };

  /* ── Helpers ────────────────────────────────────────────────── */
  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* ── Keyword description map ─────────────────────────────────── */
  const KW_DESC = {
    flying:        'Can only be blocked by Flying or Reach.',
    reach:         'Can block Flying minions.',
    taunt:         'Enemies must attack this minion first.',
    menace:        'Must be blocked by 2 or more minions.',
    defender:      'Cannot attack.',
    vigilance:     'Does not tap when attacking.',
    trample:       'Excess combat damage hits the enemy hero.',
    piercing:      'Deals bonus damage to the enemy hero when attacking.',
    firstStrike:   'Deals combat damage before minions without First Strike.',
    doubleStrike:  'Deals damage in both First Strike and normal combat phases.',
    stealth:       'Cannot be blocked the turn it enters the battlefield.',
    flash:         'Can be played during the combat phase.',
    deathtouch:    'Destroys any minion it deals damage to.',
    regenerate:    'Heals this amount of HP at the start of your turn.',
    shield:        'Absorbs this many instances of damage before breaking.',
    ward:          'Negates the first targeted spells cast on this minion.',
    hexproof:      'Cannot be targeted by enemy spells or abilities.',
    indestructible:'Cannot be destroyed by damage or destroy effects.',
    siphon:        'Heals your hero for the combat damage this deals.',
    frenzy:        'Gains +1 ATK each time it attacks.',
    thorns:        'Deals this damage back to any minion that attacks it.',
  };

  /* Ability trigger descriptions */
  const ABILITY_TRIGGERS = {
    battlecry:  { label: '\u2694\uFE0F Battlecry',  desc: 'Triggers when this minion is played from hand.' },
    rally:      { label: '\u{1F6E1}\uFE0F Rally',   desc: 'Triggers when another friendly minion is played.' },
    inspire:    { label: '\u2728 Inspire',           desc: 'Triggers when you cast a spell.' },
    lastBreath: { label: '\u{1F480} Last Breath',    desc: 'Triggers when this minion dies.' },
    surge:      { label: '\u26A1 Surge',             desc: 'Triggers at the start of your turn.' },
  };

  /* ── Text keyword glossary (keyword as it appears in card text → description) ── */
  const TEXT_KW_GLOSSARY = [
    { pattern: /\bFreeze\b/i,          label: 'Freeze',          desc: 'Taps the minion and skips its next untap.' },
    { pattern: /\bSilence[ds]?\b/i,    label: 'Silence',         desc: 'Removes all keywords, abilities, and enchantments from a minion.' },
    { pattern: /\bTrample\b/i,         label: 'Trample',         desc: KW_DESC.trample },
    { pattern: /\bFlying\b/i,          label: 'Flying',          desc: KW_DESC.flying },
    { pattern: /\bTaunt\b/i,           label: 'Taunt',           desc: KW_DESC.taunt },
    { pattern: /\bMenace\b/i,          label: 'Menace',          desc: KW_DESC.menace },
    { pattern: /\bStealth\b/i,         label: 'Stealth',         desc: KW_DESC.stealth },
    { pattern: /\bDeathtouch\b/i,      label: 'Deathtouch',      desc: KW_DESC.deathtouch },
    { pattern: /\bFirst Strike\b/i,    label: 'First Strike',    desc: KW_DESC.firstStrike },
    { pattern: /\bDouble Strike\b/i,   label: 'Double Strike',   desc: KW_DESC.doubleStrike },
    { pattern: /\bVigilance\b/i,       label: 'Vigilance',       desc: KW_DESC.vigilance },
    { pattern: /\bReach\b/i,           label: 'Reach',           desc: KW_DESC.reach },
    { pattern: /\bHexproof\b/i,        label: 'Hexproof',        desc: KW_DESC.hexproof },
    { pattern: /\bIndestructible\b/i,  label: 'Indestructible',  desc: KW_DESC.indestructible },
    { pattern: /\bFrenzy\b/i,          label: 'Frenzy',          desc: KW_DESC.frenzy },
    { pattern: /\bSiphon\b/i,          label: 'Siphon',          desc: KW_DESC.siphon },
    { pattern: /\bRegenerate\b/i,      label: 'Regenerate',      desc: KW_DESC.regenerate },
    { pattern: /\bShield\b/i,          label: 'Shield',          desc: KW_DESC.shield },
    { pattern: /\bWard\b/i,            label: 'Ward',            desc: KW_DESC.ward },
    { pattern: /\bThorns\b/i,          label: 'Thorns',          desc: KW_DESC.thorns },
    { pattern: /\bPiercing\b/i,        label: 'Piercing',        desc: KW_DESC.piercing },
    { pattern: /\bDefender\b/i,        label: 'Defender',        desc: KW_DESC.defender },
    { pattern: /\bFlash\b/i,           label: 'Flash',           desc: KW_DESC.flash },
  ];

  /** Given card text, return an array of keyword explanation strings found in it */
  function getTextKeywordNotes(text) {
    if (!text) return [];
    const notes = [];
    for (const entry of TEXT_KW_GLOSSARY) {
      if (entry.pattern.test(text)) {
        notes.push(entry.label + ': ' + entry.desc);
      }
    }
    return notes;
  }

  /** Strip leading keyword phrases from minion text (already shown as kw chips) */
  const KW_TEXT_PATTERNS = [
    /\bFlying\.\s*/gi,
    /\bTrample\.\s*/gi,
    /\bDeathtouch\.\s*/gi,
    /\bTaunt\.\s*/gi,
    /\bMenace\.\s*/gi,
    /\bStealth\.\s*/gi,
    /\bFirst Strike\.\s*/gi,
    /\bDouble Strike\.\s*/gi,
    /\bDefender\.\s*/gi,
    /\bVigilance\.\s*/gi,
    /\bReach\.\s*/gi,
    /\bFlash\.\s*/gi,
    /\bHexproof\.\s*/gi,
    /\bIndestructible\.\s*/gi,
    /\bFrenzy\.\s*/gi,
    /\bSiphon\.\s*/gi,
    /\bRegenerate\s*\d*\.\s*/gi,
    /\bShield\s*\d*\.\s*/gi,
    /\bWard\s*\d*\.\s*/gi,
    /\bThorns\s*\d*\.\s*/gi,
    /\bPiercing\s*\d*\.\s*/gi,
  ];

  function stripKeywordsFromText(text) {
    if (!text) return '';
    let result = text;
    for (const pat of KW_TEXT_PATTERNS) {
      result = result.replace(pat, '');
    }
    return result.trim();
  }

  function kwLabel(key, val) {
    if (key === 'regenerate') return `\u{1F49A} Regen ${val}`;
    if (key === 'shield')     return `\u{1F6E1} Shield ${val}`;
    if (key === 'thorns')     return `\u{1F335} Thorns ${val}`;
    if (key === 'piercing')   return `\u{1F5E1}\uFE0F Pierce ${val}`;
    if (key === 'ward')       return `\u{1F52E} Ward ${val}`;
    return KW_LABELS[key] || key;
  }

  /** Look up the card definition to check for ability triggers */
  function getCardDef(card) {
    if (card.defId && window.CARD_DEFS) return window.CARD_DEFS[card.defId];
    if (card.id && window.CARD_DEFS) return window.CARD_DEFS[card.id];
    return card;  // card might be the def itself (e.g. in shop)
  }

  /** Build keyword chips with short descriptions for card body */
  function buildKeywordsWithDescHtml(card) {
    const allKw = Object.assign({}, card.kw || {}, card.tempKw || {});
    const parts = [];
    for (const [k, v] of Object.entries(allKw)) {
      if (!v) continue;
      const label = kwLabel(k, v);
      const desc = KW_DESC[k] || '';
      parts.push(`<div class="kw-line"><span class="kw-chip">${label}</span><span class="kw-desc">${desc}</span></div>`);
    }
    // Ability triggers
    const def = getCardDef(card);
    if (def) {
      for (const [key, info] of Object.entries(ABILITY_TRIGGERS)) {
        if (typeof def[key] === 'function') {
          parts.push(`<div class="kw-line"><span class="kw-chip">${info.label}</span><span class="kw-desc">${info.desc}</span></div>`);
        }
      }
    }
    return parts.join('');
  }

  /** Build keyword descriptions for tooltip/preview (full text) */
  function buildKeywordsTooltipHtml(card) {
    const allKw = Object.assign({}, card.kw || {}, card.tempKw || {});
    const lines = [];
    for (const [k, v] of Object.entries(allKw)) {
      if (!v) continue;
      const label = kwLabel(k, v);
      const desc = KW_DESC[k] || '';
      lines.push(`<div class="tooltip-kw-line"><strong>${label}</strong> \u2014 ${desc}</div>`);
    }
    // Ability triggers
    const def = getCardDef(card);
    if (def) {
      for (const [key, info] of Object.entries(ABILITY_TRIGGERS)) {
        if (typeof def[key] === 'function') {
          lines.push(`<div class="tooltip-kw-line"><strong>${info.label}</strong> \u2014 ${info.desc}</div>`);
        }
      }
    }
    return lines.join('');
  }

  /* ─────────────────────────────────────────────────────────────────
     DOM HELPERS
  ───────────────────────────────────────────────────────────────── */
  function $(id)  { return document.getElementById(id); }
  function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }
  function show(id) { const e = $(id); if (e) e.classList.remove('hidden'); }
  function hide(id) { const e = $(id); if (e) e.classList.add('hidden'); }

  function switchScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + name);
    if (target) target.classList.add('active');
  }

  /* ─────────────────────────────────────────────────────────────────
     CARD BUILDING
  ───────────────────────────────────────────────────────────────── */
  function buildKeywordsHtml(card) {
    const allKw = Object.assign({}, card.kw || {}, card.tempKw || {});
    const parts = [];
    for (const [k, v] of Object.entries(allKw)) {
      if (v) parts.push(`<span class="kw-chip">${kwLabel(k, v)}</span>`);
    }
    return parts.join('');
  }

  function effectiveHp(card) {
    return (card.hp || 0) + (card.tempHp || 0);
  }
  function effectiveAtk(card) {
    if (typeof Engine !== 'undefined' && Engine.getEffectiveAtk) {
      try { return Engine.getEffectiveAtk(card); } catch(e) {}
    }
    return (card.atk || 0) + (card.tempAtk || 0);
  }

  function buildCardEl(card, role, opts) {
    opts = opts || {};
    const isMinion = card.type === 'minion';
    const div = el('div', 'card');

    if (card.hero) div.classList.add('hero-' + card.hero);

    if (opts.faceDown) {
      div.classList.add('face-down');
      div.dataset.uid = card.uid;
      return div;
    }

    div.dataset.uid = card.uid;

    // Tapped class on battlefield — may be deferred for animation (see renderBattlefield)
    if (role === 'battlefield' && card.tapped) {
      const wasTapped = _prevTapState[card.uid];
      if (wasTapped === false) {
        // Was untapped last frame → animate tap: start without class, add after a frame
        div.dataset.animateTap = 'tap';
      } else {
        div.classList.add('tapped');
      }
    } else if (role === 'battlefield' && !card.tapped) {
      const wasTapped = _prevTapState[card.uid];
      if (wasTapped === true) {
        // Was tapped last frame → animate untap: start with class, remove after a frame
        div.classList.add('tapped');
        div.dataset.animateTap = 'untap';
      }
    }
    if (card.frozenTurns > 0)   div.classList.add('frozen');
    if (card.silenced)          div.classList.add('silenced');
    if (role === 'shop' || opts.isDraft) div.classList.add('shop-card');

    const header = el('div', 'card-header');
    const costEl = el('div', 'card-cost');
    costEl.textContent = card.cost;
    const nameEl = el('div', 'card-name');
    nameEl.textContent = card.name;
    header.appendChild(costEl);
    header.appendChild(nameEl);
    div.appendChild(header);

    div.appendChild(el('div', 'card-divider'));

    const body = el('div', 'card-body');
    const typeEl = el('div', `card-type-label type-${card.type}`);
    typeEl.textContent = card.type ? card.type.toUpperCase() : '';
    body.appendChild(typeEl);

    const kwDescHtml = buildKeywordsWithDescHtml(card);
    if (kwDescHtml) {
      const kwDiv = el('div', 'card-keywords');
      kwDiv.innerHTML = kwDescHtml;
      body.appendChild(kwDiv);
    }

    // Always show effect/desc text on cards (strip redundant kw phrases for minions)
    const rawCardText = card.text || card.effect || card.desc || '';
    const cardText = isMinion ? stripKeywordsFromText(rawCardText) : rawCardText;
    if (cardText) {
      const eff = el('div', 'card-effect');
      eff.textContent = cardText;
      body.appendChild(eff);
      // Append keyword explanations for non-minion cards
      if (!isMinion) {
        const notes = getTextKeywordNotes(cardText);
        for (const note of notes) {
          const noteEl = el('div', 'card-effect-note');
          noteEl.textContent = note;
          body.appendChild(noteEl);
        }
      }
    }

    div.appendChild(body);

    if (isMinion) {
      const maxHp = card.maxHp || card.hp || 1;
      const curHp = role === 'discard' ? maxHp : effectiveHp(card);
      const pct   = Math.max(0, Math.min(100, (curHp / maxHp) * 100));
      const hpBar = el('div', 'hp-bar');
      const hpFill = el('div', 'hp-bar-fill');
      hpFill.style.width = pct + '%';
      hpBar.appendChild(hpFill);
      div.appendChild(hpBar);

      const footer = el('div', 'card-footer');
      const atkHp = el('div', 'card-atk-hp');
      const atk   = el('span', 'atk-val');
      atk.textContent = effectiveAtk(card);
      const sep = el('span', 'hp-sep');
      sep.textContent = ' / ';
      const hpVal = el('span', 'hp-val');
      hpVal.textContent = '\u2764\uFE0F' + curHp;
      atkHp.appendChild(atk);
      atkHp.appendChild(sep);
      atkHp.appendChild(hpVal);
      footer.appendChild(atkHp);

      const extras = el('div', 'card-extras');
      if (card.shieldCharges > 0) extras.textContent += `\u{1F6E1}${card.shieldCharges} `;
      if (card.wardCharges > 0)   extras.textContent += `\u{1F52E}${card.wardCharges}`;
      if (extras.textContent) footer.appendChild(extras);

      div.appendChild(footer);
    }

    if (card.frozenTurns > 0) {
      const fi = el('span', 'frozen-indicator');
      fi.textContent = '\u2744\uFE0F';
      fi.title = `Frozen for ${card.frozenTurns} more turn(s)`;
      div.appendChild(fi);
    }

    // Upgrade indicator
    if (card.upgrades && card.upgrades.length > 0) {
      div.classList.add('upgraded');
      const badge = el('div', 'upgrade-badge');
      const upgNames = card.upgrades.map(u => {
        const d = window.CARD_DEFS[u.defId];
        return d ? d.name : u.defId;
      });
      badge.textContent = '\u2B06' + card.upgrades.length;
      badge.title = 'Upgrades: ' + upgNames.join(', ');
      div.appendChild(badge);
    }

    if (role === 'shop' || opts.isDraft) {
      const dl = el('div', 'draft-label');
      dl.textContent = 'DRAFT';
      div.appendChild(dl);
    }

    div.addEventListener('mouseenter', (e) => {
      showTooltip(e, card);
      updatePreviewPanel(card);
    });
    div.addEventListener('mousemove',  (e) => moveTooltip(e));
    div.addEventListener('mouseleave', ()  => hideTooltip());

    return div;
  }

  /* ─────────────────────────────────────────────────────────────────
     CARD PREVIEW PANEL
  ───────────────────────────────────────────────────────────────── */
  function updatePreviewPanel(card) {
    const imgEl = $('card-preview-image');
    const nameEl = $('preview-name');
    const typeEl = $('preview-type');
    const statsEl = $('preview-stats');
    const kwEl = $('preview-keywords');
    const effEl = $('preview-effect');
    if (!nameEl) return;

    if (imgEl) {
      const heroEmoji = HERO_EMOJI[card.hero] || '\u{1F0CF}';
      const typeIcon = card.type === 'minion' ? '\u2694\uFE0F' :
                       card.type === 'instant' ? '\u26A1' :
                       card.type === 'sorcery' ? '\u{1F52E}' :
                       card.type === 'enchantment' ? '\u{1F4DC}' :
                       card.type === 'upgrade' ? '\u2B06\uFE0F' : '\u{1F0CF}';
      imgEl.innerHTML = `<div style="font-size:48px;line-height:1">${typeIcon}</div>
        <div style="font-size:24px;margin-top:4px;color:#888">${heroEmoji}</div>`;
    }

    nameEl.textContent = card.name || '';
    typeEl.textContent = (card.type || '').toUpperCase() + '  |  Cost: ' + (card.cost || 0);

    if (card.type === 'minion') {
      statsEl.textContent = `\u2694\uFE0F ${effectiveAtk(card)}   \u2764\uFE0F ${effectiveHp(card)}/${card.maxHp || card.hp}`;
    } else {
      statsEl.textContent = '';
    }

    kwEl.innerHTML = buildKeywordsTooltipHtml(card) || '';
    const rawPrevText = card.text || card.effect || card.desc || '';
    const prevText = card.type === 'minion' ? stripKeywordsFromText(rawPrevText) : rawPrevText;
    if (prevText && card.type !== 'minion') {
      const notes = getTextKeywordNotes(prevText);
      effEl.innerHTML = '';
      effEl.textContent = prevText;
      for (const note of notes) {
        const noteEl = document.createElement('div');
        noteEl.className = 'preview-effect-note';
        noteEl.textContent = note;
        effEl.appendChild(noteEl);
      }
    } else {
      effEl.textContent = prevText;
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     TOOLTIP
  ───────────────────────────────────────────────────────────────── */
  const _tooltip = document.getElementById('card-tooltip');

  function showTooltip(e, card) {
    if (!_tooltip) return;
    if (window.SFX) window.SFX.play('card_hover');
    const isMinion = card.type === 'minion';
    let html = `<div class="tooltip-name">${card.name}</div>`;
    html += `<div class="tooltip-type">${card.type || ''} | Cost: ${card.cost}</div>`;
    if (isMinion) {
      html += `<div class="tooltip-stats">\u2694\uFE0F ${effectiveAtk(card)} &nbsp; \u2764\uFE0F ${effectiveHp(card)}/${card.maxHp || card.hp}</div>`;
    }
    const kwTooltipHtml = buildKeywordsTooltipHtml(card);
    if (kwTooltipHtml) html += `<div class="tooltip-kw">${kwTooltipHtml}</div>`;
    const rawTtText = card.text || card.effect || card.desc || '';
    const ttText = isMinion ? stripKeywordsFromText(rawTtText) : rawTtText;
    if (ttText) {
      html += `<div class="tooltip-body">${ttText}</div>`;
      if (!isMinion) {
        const notes = getTextKeywordNotes(ttText);
        for (const note of notes) {
          html += `<div class="tooltip-body tooltip-kw-note">${note}</div>`;
        }
      }
    }
    if (card.shieldCharges > 0) html += `<div class="tooltip-body">\u{1F6E1} Shield ${card.shieldCharges}</div>`;
    if (card.wardCharges > 0)   html += `<div class="tooltip-body">\u{1F52E} Ward ${card.wardCharges}</div>`;
    _tooltip.innerHTML = html;
    _tooltip.classList.remove('hidden');
    moveTooltip(e);
  }
  function moveTooltip(e) {
    if (!_tooltip || _tooltip.classList.contains('hidden')) return;
    const tw = _tooltip.offsetWidth;
    const th = _tooltip.offsetHeight;
    let x = e.clientX + 14;
    let y = e.clientY - 10;
    if (x + tw > window.innerWidth)  x = e.clientX - tw - 14;
    if (y + th > window.innerHeight) y = e.clientY - th - 10;
    _tooltip.style.left = x + 'px';
    _tooltip.style.top  = y + 'px';
  }
  function hideTooltip() {
    if (_tooltip) _tooltip.classList.add('hidden');
  }

  /* ─────────────────────────────────────────────────────────────────
     LOG
  ───────────────────────────────────────────────────────────────── */
  const MAX_LOG = 20;
  const _logEntries = [];

  function appendLog(msg) {
    _logEntries.push(msg);
    if (_logEntries.length > MAX_LOG) _logEntries.shift();
    const box = $('log-box');
    if (!box) return;
    box.innerHTML = '';
    _logEntries.forEach(m => {
      const span = el('span', 'log-entry');
      span.textContent = m;
      box.appendChild(span);
      box.appendChild(document.createTextNode('\n'));
    });
    box.scrollTop = box.scrollHeight;
  }

  /* ─────────────────────────────────────────────────────────────────
     INFO BARS / BANNERS with resource bars
  ───────────────────────────────────────────────────────────────── */
  function updateInfoBars(G) {
    if (!G) return;
    const p  = G.players[_humanIdx];
    const opp= G.players[1 - _humanIdx];

    // Player banner
    setInner('player-health', p.health);
    setInner('player-mana',   p.mana.current);
    setInner('player-mana-max', p.mana.max);

    // Health bar (max 20 at start, but can vary)
    const pMaxHp = 20; // base max
    setBarWidth('player-health-bar', p.health, pMaxHp);
    setBarWidth('player-mana-bar', p.mana.current, p.mana.max);

    // Deck/discard pile boxes
    setInner('player-deck-box-count', p.deck.length);
    setInner('player-discard-box-count', p.discard.length);
    renderDiscardTopCard('player-discard-top-card', p.discard);

    // Insight
    const pInsight = $('player-insight-block');
    if (pInsight) {
      if (p.hero === 'archmage') {
        pInsight.classList.remove('hidden');
        setInner('player-insight', p.insight || 0);
        setBarWidth('player-insight-bar', p.insight || 0, 50);
      } else {
        pInsight.classList.add('hidden');
      }
    }

    // Hero label + avatar
    const pHeroLabel = $('player-hero-label');
    if (pHeroLabel) pHeroLabel.textContent = heroDisplayName(G, _humanIdx);
    const pAvatar = $('player-avatar');
    if (pAvatar) pAvatar.textContent = HERO_EMOJI[p.hero] || '\u{1F9D9}';

    // Opponent banner
    setInner('opp-health', opp.health);
    setInner('opp-mana',   opp.mana.current);
    setInner('opp-mana-max', opp.mana.max);

    const oMaxHp = 20;
    setBarWidth('opp-health-bar', opp.health, oMaxHp);
    setBarWidth('opp-mana-bar', opp.mana.current, opp.mana.max);

    setInner('opp-hand-count', opp.hand.length);
    setInner('opp-deck-box-count', opp.deck.length);
    setInner('opp-discard-box-count', opp.discard.length);
    renderDiscardTopCard('opp-discard-top-card', opp.discard);

    const oInsight = $('opp-insight-block');
    if (oInsight) {
      if (opp.hero === 'archmage') {
        oInsight.classList.remove('hidden');
        setInner('opp-insight', opp.insight || 0);
        setBarWidth('opp-insight-bar', opp.insight || 0, 50);
      } else {
        oInsight.classList.add('hidden');
      }
    }
    const oHeroLabel = $('opp-hero-label');
    if (oHeroLabel) oHeroLabel.textContent = heroDisplayName(G, 1 - _humanIdx);
    const oAvatar = $('opp-avatar');
    if (oAvatar) oAvatar.textContent = HERO_EMOJI[opp.hero] || '\u{1F9D9}';

    // Turn / Phase
    setInner('turn-indicator', `Turn ${G.turn}`);
    updatePhaseIndicator(G);

    // Hand count labels
    setInner('player-hand-count-label', `[${p.hand.length}/${p.maxHandSize}]`);
    setInner('opp-hand-count-label', `[${opp.hand.length}/${opp.maxHandSize}]`);

    // Hidden compat elements
    setInner('player-hand-label-count', `[${p.hand.length}/${p.maxHandSize}]`);
    setInner('opp-hand-label-count', `[${opp.hand.length}/${opp.maxHandSize}]`);

    // Shop deck count
    setInner('shop-deck-count', `(${p.shopDeck ? p.shopDeck.length : 0} left)`);
  }

  function setInner(id, val) {
    const e = $(id);
    if (e) e.textContent = val;
  }

  function setBarWidth(id, current, max) {
    const e = $(id);
    if (!e) return;
    const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
    e.style.width = pct + '%';
  }

  function renderDiscardTopCard(containerId, discard) {
    const container = $(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (discard.length === 0) return;
    const topCard = discard[discard.length - 1];
    const cardEl = buildCardEl(topCard, 'discard');
    // Hide top card if it's currently being animated to the discard pile
    if (_animatingCard && (_animatingCard.type === 'instant' || _animatingCard.type === 'sorcery') && _animatingCard.uid === topCard.uid) {
      cardEl.style.visibility = 'hidden';
    }
    container.appendChild(cardEl);
  }

  function heroDisplayName(G, idx) {
    if (typeof Engine !== 'undefined' && Engine.heroName) {
      try { return Engine.heroName(G, idx); } catch(e) {}
    }
    const h = G.players[idx].hero;
    return h ? h.charAt(0).toUpperCase() + h.slice(1) : 'Unknown';
  }

  function updatePhaseIndicator(G) {
    const el = $('phase-indicator');
    if (!el) return;
    const phase = G.phase;
    const step  = G.combatStep;
    let label = phase;
    if (phase === 'combat' && step) label = step;
    el.textContent = label.replace(/([A-Z])/g, ' $1').trim();
    el.className = 'phase-indicator';
    if (phase === 'combat')   el.classList.add('phase-combat');
    if (phase === 'draft')    el.classList.add('phase-draft');
    if (phase === 'gameOver') el.classList.add('phase-gameOver');
  }

  /* ─────────────────────────────────────────────────────────────────
     ENCHANTMENT ROWS
  ───────────────────────────────────────────────────────────────── */
  function renderEnchantments(G) {
    const p   = G.players[_humanIdx];
    const opp = G.players[1 - _humanIdx];
    renderEnchantRow('player-enchant-cards', p.enchantments || []);
    renderEnchantRow('opp-enchant-cards',    opp.enchantments || []);
  }

  function renderEnchantRow(containerId, enchants) {
    const c = $(containerId);
    if (!c) return;
    c.innerHTML = '';
    enchants.forEach(enc => {
      const chip = el('div', 'enchant-chip');
      chip.textContent = enc.name;
      chip.addEventListener('mouseenter', (e) => {
        showTooltip(e, enc);
        updatePreviewPanel(enc);
      });
      chip.addEventListener('mousemove', (e) => moveTooltip(e));
      chip.addEventListener('mouseleave', () => hideTooltip());
      c.appendChild(chip);
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     OPPONENT HAND (face-down)
  ───────────────────────────────────────────────────────────────── */
  function renderOpponentHand(G) {
    const opp = G.players[1 - _humanIdx];
    const c   = $('opp-hand-cards');
    if (!c) return;
    c.innerHTML = '';
    for (let i = 0; i < opp.hand.length; i++) {
      const back = el('div', 'card-back');
      // Hide card if it's being animated into hand
      if (_drawAnimatingUids.has(opp.hand[i].uid)) {
        back.style.visibility = 'hidden';
      }
      c.appendChild(back);
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     PLAYER HAND
  ───────────────────────────────────────────────────────────────── */
  function renderPlayerHand(G) {
    const p = G.players[_humanIdx];
    const c = $('player-hand-cards');
    if (!c) return;
    c.innerHTML = '';
    p.hand.forEach(card => {
      const cardEl = buildCardEl(card, 'hand', { humanOwned: true });
      const effCost = getEffectiveCost(G, _humanIdx, card);
      if (effCost > p.mana.current) cardEl.classList.add('unaffordable');

      if (_selectedCard && _selectedCard.uid === card.uid) {
        cardEl.classList.add('selected');
      }
      if (_pendingTargetCard && isValidHandTarget(G, card)) {
        cardEl.classList.add('valid-target');
      }

      // Priority mode: highlight playable instants, gray out everything else
      if (_inPriorityWindow) {
        const isPlayable = (card.type === 'instant' || Engine.getKw(card, 'flash'))
                         && effCost <= p.mana.current;
        if (isPlayable) {
          cardEl.classList.add('priority-playable');
        } else {
          cardEl.classList.add('priority-disabled');
        }
      }

      // Hide card if it's being animated into hand
      if (_drawAnimatingUids.has(card.uid)) {
        cardEl.style.visibility = 'hidden';
      }
      // Hide card if it's a spell shown in the activation zone awaiting target
      if (_spellGhost && _pendingTargetCard && _pendingTargetCard.uid === card.uid) {
        cardEl.style.visibility = 'hidden';
      }

      // Drag-and-drop to play cards (replaces click)
      cardEl.addEventListener('mousedown', (e) => startDrag(e, G, card, cardEl));
      cardEl.addEventListener('touchstart', (e) => startDrag(e, G, card, cardEl), { passive: false });
      c.appendChild(cardEl);
    });
  }

  function getEffectiveCost(G, idx, card) {
    if (typeof Engine !== 'undefined' && Engine.getEffectiveCost) {
      try { return Engine.getEffectiveCost(G, idx, card); } catch(e) {}
    }
    return card.cost;
  }

  function isValidHandTarget(G, card) {
    return false;
  }

  /* ─────────────────────────────────────────────────────────────────
     BATTLEFIELD
  ───────────────────────────────────────────────────────────────── */
  function renderBattlefield(G) {
    const playerMinionsEl = $('player-minions');
    const oppMinionsEl    = $('opp-minions');
    if (!playerMinionsEl || !oppMinionsEl) return;
    playerMinionsEl.innerHTML = '';
    oppMinionsEl.innerHTML    = '';

    const isBlockerStep = G.phase === 'combat' && G.combatStep === 'declareBlockers'
                       && (1 - G.activePlayer) === _humanIdx
                       && !_inPriorityWindow && !_pendingTargetCard;

    // During blocker declaration, reorder opponent minions: attackers first, ordered by
    // attacker uid, so blockers can be visually placed below their attacker.
    // Also reorder player minions: assigned blockers grouped under their attacker.
    let playerMinions = G.battlefield.filter(m => m.owner === _humanIdx);
    let oppMinions    = G.battlefield.filter(m => m.owner !== _humanIdx);

    if (isBlockerStep && G.attackers && G.blockers) {
      // Reorder opponent side: attackers in declared order, then non-attackers
      const attackerSet = new Set(G.attackers);
      const orderedOpp = [];
      for (const uid of G.attackers) {
        const m = oppMinions.find(o => o.uid === uid);
        if (m) orderedOpp.push(m);
      }
      for (const m of oppMinions) {
        if (!attackerSet.has(m.uid)) orderedOpp.push(m);
      }
      oppMinions = orderedOpp;

      // Reorder player side: for each attacker, place its assigned blockers in order,
      // then any unassigned minions at the end
      const assignedUids = new Set();
      const orderedPlayer = [];
      for (const uid of G.attackers) {
        const blockerUids = G.blockers[uid] || [];
        for (const bUid of blockerUids) {
          const m = playerMinions.find(p => p.uid === bUid);
          if (m) { orderedPlayer.push(m); assignedUids.add(bUid); }
        }
        // Insert a spacer placeholder to visually separate blocker groups
        if (blockerUids.length > 0 && G.attackers.indexOf(uid) < G.attackers.length - 1) {
          orderedPlayer.push(null); // spacer marker
        }
      }
      for (const m of playerMinions) {
        if (!assignedUids.has(m.uid)) orderedPlayer.push(m);
      }
      playerMinions = orderedPlayer;
    }

    // Render opponent minions
    for (const minion of oppMinions) {
      const cardEl = buildMinionCardEl(G, minion, false, isBlockerStep);
      oppMinionsEl.appendChild(cardEl);
    }

    // Render player minions (with spacers)
    for (const minion of playerMinions) {
      if (minion === null) {
        // Spacer between blocker groups
        const spacer = el('div', 'blocker-spacer');
        playerMinionsEl.appendChild(spacer);
        continue;
      }
      const cardEl = buildMinionCardEl(G, minion, true, isBlockerStep);
      playerMinionsEl.appendChild(cardEl);
    }

    // Animate tap/untap transitions after DOM insertion
    requestAnimationFrame(() => {
      const containers = [playerMinionsEl, oppMinionsEl];
      for (const container of containers) {
        for (const cardEl of container.querySelectorAll('[data-animate-tap]')) {
          const action = cardEl.dataset.animateTap;
          delete cardEl.dataset.animateTap;
          if (action === 'tap') {
            cardEl.classList.add('tapped');
          } else if (action === 'untap') {
            cardEl.classList.remove('tapped');
          }
        }
      }
    });

    // Save current tap states for next render
    _prevTapState = {};
    for (const m of G.battlefield) {
      _prevTapState[m.uid] = !!m.tapped;
    }
  }

  /** Build a single minion card element for the battlefield */
  function buildMinionCardEl(G, minion, isPlayerOwned, isBlockerStep) {
    const cardEl = buildCardEl(minion, 'battlefield', {});

    if (G.attackers && G.attackers.includes(minion.uid)) {
      cardEl.classList.add('attacker');
    }

    if (_selectedBlocker === minion.uid) {
      cardEl.classList.add('blocker-selected');
    }
    if (G.blockers) {
      for (const [atkUid, bArr] of Object.entries(G.blockers)) {
        if (bArr.includes(minion.uid)) {
          const lbl = el('div', 'blocker-label');
          lbl.textContent = 'Blocks ' + (getCardByUid(G, atkUid) || {name:'?'}).name;
          cardEl.appendChild(lbl);
          cardEl.classList.add('blocker-selected');
        }
      }
    }

    if (_pendingTargetCard && isBattlefieldTarget(G, minion, _pendingTargetCard)) {
      cardEl.classList.add('valid-target');
    }
    // Highlight valid trigger targets (battlecry etc.)
    if (_pendingTriggerEntry) {
      const tt = _pendingTriggerEntry.targetType || 'any_minion';
      const srcUid = _pendingTriggerEntry.sourceUid;
      const ownerIdx = _pendingTriggerEntry.ownerIdx;
      let isValid = minion.uid !== srcUid;
      if (tt === 'friendly_minion' && minion.owner !== ownerIdx) isValid = false;
      if (tt === 'enemy_minion' && minion.owner === ownerIdx) isValid = false;
      if (isValid) cardEl.classList.add('valid-target');
    }

    cardEl.addEventListener('click', () => onBattlefieldCardClick(G, minion, cardEl));

    // During blocker step, allow dragging arrow from untapped player minions
    if (isBlockerStep && isPlayerOwned && !minion.tapped) {
      cardEl.style.cursor = 'crosshair';
      cardEl.addEventListener('mousedown', (e) => startBlockerArrow(e, G, minion, cardEl));
      cardEl.addEventListener('touchstart', (e) => startBlockerArrow(e, G, minion, cardEl), { passive: false });
    }

    // Highlight valid attacker targets during blocker step
    if (isBlockerStep && !isPlayerOwned && G.attackers && G.attackers.includes(minion.uid)) {
      cardEl.classList.add('valid-block-target');
    }

    // Hide minion if it's currently being animated into position
    if (_animatingCard && _animatingCard.type === 'minion' && _animatingCard.uid === minion.uid) {
      cardEl.style.visibility = 'hidden';
    }

    return cardEl;
  }

  function getCardByUid(G, uid) {
    return G.battlefield.find(c => c.uid === uid) ||
           G.players[0].hand.find(c => c.uid === uid) ||
           G.players[1].hand.find(c => c.uid === uid) || null;
  }

  function isBattlefieldTarget(G, minion, sourceCard) {
    if (!sourceCard) return false;
    if (sourceCard.type === 'upgrade') return minion.owner === _humanIdx;
    const tt = getSpellTargetType(sourceCard);
    if (tt === 'friendly_minion') return minion.owner === _humanIdx;
    if (tt === 'enemy_minion') return minion.owner !== _humanIdx;
    return true; // any_minion
  }

  /* ─────────────────────────────────────────────────────────────────
     SHOP (overlay — only visible during draft phase)
  ───────────────────────────────────────────────────────────────── */
  function renderShop(G) {
    const overlay = $('shop-overlay');
    const c = $('shop-cards');
    const actions = $('shop-actions');
    if (!overlay || !c) return;

    const p = G.players[_humanIdx];
    const isDraftPhase = G.phase === 'draft' && G.activePlayer === _humanIdx;

    if (!isDraftPhase) {
      overlay.classList.add('hidden');
      return;
    }

    // Show the shop overlay
    overlay.classList.remove('hidden');
    c.innerHTML = '';

    (p.shopRow || []).forEach(card => {
      const cardEl = buildCardEl(card, 'shop', { isDraft: true });
      cardEl.classList.add('draft-active');
      cardEl.addEventListener('click', () => onShopCardClick(G, card, cardEl));
      c.appendChild(cardEl);
    });

    // Reroll button
    if (actions) {
      actions.innerHTML = '';
      const rerollBtn = document.createElement('button');
      rerollBtn.className = 'btn btn-reroll';
      rerollBtn.textContent = `Reroll (1 mana)`;
      if (p.mana.current < 1 || p.shopDeck.length === 0) {
        rerollBtn.disabled = true;
        rerollBtn.classList.add('btn-disabled');
      }
      rerollBtn.addEventListener('click', () => {
        const success = Engine.rerollShop(G, _humanIdx);
        if (success) renderShop(G);
      });
      actions.appendChild(rerollBtn);
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     CONTROLS
  ───────────────────────────────────────────────────────────────── */
  function renderControls(G) {
    const area = $('controls-area');
    if (!area) return;
    area.innerHTML = '';

    const phase    = G.phase;
    const step     = G.combatStep;
    const isActive = G.activePlayer === _humanIdx;

    if (G.gameOver) return;
    if (_pendingTriggerEntry) {
      addBtn(area, '\u2716\uFE0F Cancel', 'btn', () => {
        const resolve = _triggerTargetResolve;
        cleanupTriggerTarget();
        if (resolve) resolve(null);
      });
      return;
    }
    if (_aiRunning)  { renderAiControls(area); return; }

    if (phase === 'action' && isActive) {
      const isFirstTurn = G.turn === 1;
      const atkBtn = addBtn(area, '\u2694\uFE0F Attack', 'btn btn-danger', isFirstTurn ? null : onAttackClick);
      if (isFirstTurn) {
        atkBtn.disabled = true;
        atkBtn.classList.add('btn-disabled');
        atkBtn.addEventListener('mouseenter', () => showFirstTurnHint());
        atkBtn.addEventListener('mouseleave', () => hideFirstTurnHint());
      }
      addBtn(area, '\u2714\uFE0F End Turn', 'btn btn-primary', () => onEndTurnClick(G));
      if (_selectedCard || _pendingTargetCard) {
        addBtn(area, '\u2716\uFE0F Cancel', 'btn', clearSelection);
      }
    }

    if (phase === 'combat') {
      if (step === 'declareAttackers' && isActive) {
        const hint = el('div', 'combat-hint');
        hint.textContent = 'Click your untapped minions to declare attackers.';
        area.appendChild(hint);
        addBtn(area, '\u2714\uFE0F Confirm Attackers', 'btn btn-success', onConfirmAttackers);
        addBtn(area, '\u2716\uFE0F Cancel Combat',     'btn btn-danger',  onCancelCombat);
      }
      if (step === 'declareBlockers') {
        const defender = 1 - G.activePlayer;
        if (defender === _humanIdx) {
          const hint = el('div', 'combat-hint');
          hint.textContent = 'DEFENDING: Drag from one of your untapped minions to an attacker to assign a blocker.';
          area.appendChild(hint);
          addBtn(area, '\u2714\uFE0F Confirm Blockers', 'btn btn-success', onConfirmBlockers);
        }
      }
    }

    if (phase === 'draft') {
      const hint = el('div', 'combat-hint');
      if (isActive) {
        hint.textContent = 'Draft phase: pick a card from the shop overlay.';
      } else {
        hint.textContent = 'Waiting for other player to draft...';
      }
      area.appendChild(hint);
    }

    if (phase === 'upkeep' && isActive) {
      const hint = el('div', 'combat-hint');
      hint.textContent = 'Upkeep...';
      area.appendChild(hint);
    }
  }

  function renderAiControls(area) {
    const hint = el('div', 'combat-hint');
    hint.textContent = '\u{1F916} AI is thinking...';
    area.appendChild(hint);
  }

  function addBtn(parent, text, cls, handler) {
    const b = document.createElement('button');
    b.className = cls;
    b.textContent = text;
    b.addEventListener('click', handler);
    parent.appendChild(b);
    return b;
  }

  /* ─────────────────────────────────────────────────────────────────
     DISCARD PILE VIEWER
  ───────────────────────────────────────────────────────────────── */
  function openDiscardViewer(cards, title) {
    const overlay = $('discard-overlay');
    const header  = $('discard-overlay-header');
    const container = $('discard-overlay-cards');
    if (!overlay || !container) return;
    if (!cards || cards.length === 0) return;

    header.textContent = title || 'Discard Pile';
    container.innerHTML = '';
    cards.forEach(card => {
      const cardEl = buildCardEl(card, 'discard');
      container.appendChild(cardEl);
    });
    overlay.classList.remove('hidden');
  }

  function closeDiscardViewer() {
    const overlay = $('discard-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // Close on clicking the overlay background (not the cards)
  (function () {
    const overlay = document.getElementById('discard-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDiscardViewer();
      });
    }
  })();

  // Wire up discard box clicks
  function wireDiscardBoxes() {
    const playerBox = $('player-discard-box');
    const oppBox    = $('opp-discard-box');
    if (playerBox) {
      playerBox.style.cursor = 'pointer';
      playerBox.addEventListener('click', () => {
        if (!_G) return;
        const p = _G.players[_humanIdx];
        if (p.discard.length > 0) openDiscardViewer(p.discard, 'Your Discard Pile');
      });
    }
    if (oppBox) {
      oppBox.style.cursor = 'pointer';
      oppBox.addEventListener('click', () => {
        if (!_G) return;
        const opp = _G.players[1 - _humanIdx];
        if (opp.discard.length > 0) openDiscardViewer(opp.discard, "Opponent's Discard Pile");
      });
    }
  }
  wireDiscardBoxes();

  /* ─────────────────────────────────────────────────────────────────
     FULL RE-RENDER
  ───────────────────────────────────────────────────────────────── */
  function fullRender(G) {
    if (!G) return;
    _G = G;
    updateInfoBars(G);
    renderEnchantments(G);
    renderOpponentHand(G);
    renderPlayerHand(G);
    renderBattlefield(G);
    renderShop(G);
    renderControls(G);
    renderStack(G);
    // Redraw persistent blocker arrows after DOM update
    if (G.combatStep === 'declareBlockers' && (1 - G.activePlayer) === _humanIdx) {
      drawPersistentBlockerArrows(G);
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     SELECTION STATE
  ───────────────────────────────────────────────────────────────── */
  function clearSelection() {
    _selectedCard        = null;
    _pendingTargetCard   = null;
    _selectedBlocker     = null;
    removeSpellGhost();
    if (_G) fullRender(_G);
  }

  function cardNeedsTarget(G, card) {
    if (card.type === 'upgrade') return true;
    // Minions with targeted battlecry: targeting is deferred to trigger resolution
    if (card.type === 'minion') return false;
    const def = window.CARD_DEFS[card.defId];
    const tt = (card.targetType) || (def && def.targetType) || null;
    if (tt === 'none') return false;
    if (tt && tt !== 'self') return true;
    // Infer from onPlay: if it accepts 4+ params (G, cardId, ownerIdx, targets), it needs a target
    if (def && def.onPlay && def.onPlay.length >= 4) return true;
    return false;
  }

  /** Infer target type from card text: 'friendly_minion', 'enemy_minion', or 'any_minion' */
  function getSpellTargetType(card) {
    const def = window.CARD_DEFS[card.defId];
    const tt = card.targetType || (def && def.targetType) || null;
    if (tt && tt !== 'none') return tt;
    const text = (card.text || '').toLowerCase();
    if (/\bfriendly\b/.test(text)) return 'friendly_minion';
    if (/\benemy\b/.test(text) && /\btarget\b/.test(text)) return 'enemy_minion';
    return 'any_minion';
  }

  function tryPlayCard(G, card, targetUid) {
    // During priority window: only instants/flash are allowed
    if (_inPriorityWindow) {
      if (card.type !== 'instant' && !Engine.getKw(card, 'flash')) {
        appendLog('Only Instants and Flash cards can be played now.');
        return;
      }
      // For counter spells during priority, auto-target top of stack
      let targets = targetUid ? [targetUid] : [];
      const def = window.CARD_DEFS[card.defId];
      const isCounterSpell = def && def.isCounter;
      if (isCounterSpell && G.stack.length > 0 && targets.length === 0) {
        targets = [G.stack[G.stack.length - 1].id];
      }

      const success = Engine.playCard(G, _humanIdx, card.uid, targets);
      if (!success) {
        appendLog(`Could not play ${card.name}.`);
        return;
      }

      // Resolve the priority window — card was played
      renderStack(G);
      if (_priorityResolve) {
        const resolve = _priorityResolve;
        cleanupPriority();
        resolve({ action: 'play' });
      }
      return;
    }

    const targets = targetUid ? [targetUid] : [];
    const isTargetedSpell = targetUid && (card.type === 'instant' || card.type === 'sorcery');

    if (isTargetedSpell) {
      // Show arrow from spell in activation zone to target, wait 1s, then resolve
      _spellAnimPromise = runSpellTargetAnimation(G, card, targetUid, _humanIdx).then(async () => {
        // Suppress the normal card-play animation (we already showed the ghost)
        _skipNextCardPlayAnim = true;
        const success = Engine.playCard(G, _humanIdx, card.uid, targets);
        if (!success) { appendLog(`Could not play ${card.name}.`); }
        _skipNextCardPlayAnim = false;
        _pendingTargetCard = null;
        _selectedCard = null;
        _spellGhost = null;
        fullRender(_G);
        // Resolve the stack (gives opponent priority to respond)
        if (success) await Engine.resolveStack(G);
      });
      return;
    }

    const success = Engine.playCard(G, _humanIdx, card.uid, targets);
    if (!success) {
      appendLog(`Could not play ${card.name}.`);
    }
    clearSelection();
    // Resolve the stack (gives opponent priority to respond)
    if (success) Engine.resolveStack(G);
  }

  /* ─────────────────────────────────────────────────────────────────
     CARD DRAW ANIMATION
  ───────────────────────────────────────────────────────────────── */
  let _drawQueue = [];          // [{ card, playerIdx }]
  let _drawAnimRunning = false;
  // Cards currently being animated into hand — render hides them
  let _drawAnimatingUids = new Set();

  function onCardDrawn(G, playerIdx, card) {
    _drawQueue.push({ card, playerIdx });
  }

  /** Play queued draw animations sequentially, then do a final render */
  function runDrawAnimations() {
    if (_drawQueue.length === 0) return Promise.resolve();
    const queue = _drawQueue.slice();
    _drawQueue = [];
    _drawAnimRunning = true;

    // Mark all drawn cards so the render hides them in hand
    for (const item of queue) _drawAnimatingUids.add(item.card.uid);
    fullRender(_G);

    let chain = Promise.resolve();
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      chain = chain.then(() => animateSingleDraw(item.card, item.playerIdx));
    }
    return chain.then(() => {
      _drawAnimatingUids.clear();
      _drawAnimRunning = false;
      fullRender(_G);
    });
  }

  function animateSingleDraw(card, playerIdx) {
    const isHuman = playerIdx === _humanIdx;
    const deckBoxId = isHuman ? 'player-deck-box' : 'opp-deck-box';
    const handId = isHuman ? 'player-hand-cards' : 'opp-hand-cards';
    const deckBox = $(deckBoxId);
    const handContainer = $(handId);
    if (!deckBox || !handContainer) {
      _drawAnimatingUids.delete(card.uid);
      return Promise.resolve();
    }

    const srcRect = deckBox.getBoundingClientRect();

    // Build ghost card (face-down for opponent, face-up for human)
    let ghost;
    if (isHuman) {
      ghost = buildCardEl(card, 'animation');
    } else {
      ghost = document.createElement('div');
      ghost.className = 'card card-back';
    }
    ghost.classList.add('card-anim');
    ghost.style.width = 'var(--card-w)';
    ghost.style.height = 'var(--card-h)';
    ghost.style.left = (srcRect.left + srcRect.width / 2 - 55) + 'px';
    ghost.style.top = (srcRect.top + srcRect.height / 2 - 75) + 'px';
    ghost.style.transition = 'none';
    document.body.appendChild(ghost);

    // Target: center of the hand container
    const handRect = handContainer.getBoundingClientRect();
    const destX = handRect.left + handRect.width / 2 - 55;
    const destY = handRect.top + handRect.height / 2 - 75;

    return new Promise(resolve => {
      ghost.getBoundingClientRect();
      ghost.style.transition = 'left 0.2s ease-out, top 0.2s ease-out, transform 0.2s ease-out';
      requestAnimationFrame(() => {
        ghost.style.left = destX + 'px';
        ghost.style.top = destY + 'px';
      });

      setTimeout(() => {
        ghost.remove();
        // Reveal this card in hand
        _drawAnimatingUids.delete(card.uid);
        fullRender(_G);
        // Small delay before next draw
        setTimeout(resolve, 50);
      }, 220);
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     CARD PLAY ANIMATION
  ───────────────────────────────────────────────────────────────── */
  // Store the last played card info for animation
  let _pendingAnimCard = null;
  let _animPromise = Promise.resolve();
  // Card currently being animated — render functions check this to hide the destination element
  let _animatingCard = null;  // { uid, type, playerIdx }

  function onCardPlayed(G, playerIdx, card) {
    // Skip animation if we already showed a spell target arrow
    if (_skipNextCardPlayAnim) {
      _pendingAnimCard = null;
      return;
    }
    // Find the card element in hand before it gets re-rendered
    const isHuman = playerIdx === _humanIdx;
    const handContainer = isHuman ? $('player-hand-cards') : $('opp-hand-cards');
    let sourceRect = null;

    if (handContainer) {
      // Try to find the specific card element by uid
      const cardEls = handContainer.querySelectorAll('.card, .card-back');
      if (isHuman) {
        for (const cel of cardEls) {
          if (cel.dataset.uid === card.uid) {
            sourceRect = cel.getBoundingClientRect();
            break;
          }
        }
      }
      // For opponent, pick the first card-back
      if (!sourceRect && !isHuman && cardEls.length > 0) {
        sourceRect = cardEls[0].getBoundingClientRect();
      }
      // Fallback: center of hand
      if (!sourceRect) {
        sourceRect = handContainer.getBoundingClientRect();
      }
    }

    _pendingAnimCard = { card, playerIdx, sourceRect };
  }

  function runCardPlayAnimation() {
    if (!_pendingAnimCard) return Promise.resolve();
    const { card, playerIdx, sourceRect } = _pendingAnimCard;
    _pendingAnimCard = null;

    if (!sourceRect) return Promise.resolve();

    const activationArea = $('activation-area');
    if (!activationArea) return Promise.resolve();

    const isHuman = playerIdx === _humanIdx;
    const type = card.type;

    // Mark this card as animating so render functions hide it at destination
    _animatingCard = { uid: card.uid, type: type, playerIdx: playerIdx };
    // Re-render so the destination element is hidden immediately
    fullRender(_G);

    // Build a visual card clone
    const ghost = buildCardEl(card, 'animation');
    ghost.classList.add('card-anim');
    ghost.style.width = 'var(--card-w)';
    ghost.style.height = 'var(--card-h)';
    ghost.style.left = sourceRect.left + 'px';
    ghost.style.top = sourceRect.top + 'px';
    ghost.style.transition = 'none';
    document.body.appendChild(ghost);

    // Phase 1: Animate to activation area
    const actRect = activationArea.getBoundingClientRect();
    const actX = actRect.left + (actRect.width - sourceRect.width) / 2;
    const actY = actRect.top + (actRect.height - sourceRect.height) / 2;

    const finish = () => {
      _animatingCard = null;
      ghost.remove();
      fullRender(_G);
    };

    return new Promise(resolve => {
      ghost.getBoundingClientRect();
      ghost.style.transition = 'left 0.2s ease, top 0.2s ease, opacity 0.2s ease, transform 0.2s ease';
      requestAnimationFrame(() => {
        ghost.style.left = actX + 'px';
        ghost.style.top = actY + 'px';
        ghost.style.transform = 'scale(3)';
      });

      // Phase 2: After arriving at activation area (0.2s), hold 1s, then move to final destination
      setTimeout(() => {
        if (type === 'minion') {
          const bfId = isHuman ? 'player-minions' : 'opp-minions';
          const bf = $(bfId);
          if (bf) {
            const target = bf.querySelector(`.card[data-uid="${card.uid}"]`);
            if (target) {
              const tRect = target.getBoundingClientRect();
              ghost.style.left = (tRect.left + tRect.width / 2 - sourceRect.width / 2) + 'px';
              ghost.style.top = (tRect.top + tRect.height / 2 - sourceRect.height / 2) + 'px';
            } else {
              const bfRect = bf.getBoundingClientRect();
              ghost.style.left = (bfRect.left + bfRect.width / 2 - sourceRect.width / 2) + 'px';
              ghost.style.top = (bfRect.top + bfRect.height / 2 - sourceRect.height / 2) + 'px';
            }
            ghost.style.transform = 'scale(1)';
          }
          setTimeout(() => { finish(); resolve(); }, 225);

        } else if (type === 'instant' || type === 'sorcery') {
          const discardId = isHuman ? 'player-discard-box' : 'opp-discard-box';
          const discard = $(discardId);
          if (discard) {
            const dRect = discard.getBoundingClientRect();
            ghost.style.left = (dRect.left + dRect.width / 2 - sourceRect.width / 2) + 'px';
            ghost.style.top = (dRect.top + dRect.height / 2 - sourceRect.height / 2) + 'px';
            ghost.style.transform = 'scale(1)';
          }
          setTimeout(() => { finish(); resolve(); }, 225);

        } else {
          ghost.classList.add('fade-out');
          setTimeout(() => { finish(); resolve(); }, 225);
        }
      }, 1200);
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     SPELL TARGET ARROW ANIMATION
  ───────────────────────────────────────────────────────────────── */

  /** Show a spell card ghost in the activation zone while awaiting target selection */
  function showSpellGhostInActivation(card) {
    removeSpellGhost();
    const activationArea = $('activation-area');
    if (!activationArea) return;
    const ghost = buildCardEl(card, 'animation');
    ghost.classList.add('card-anim', 'spell-ghost');
    ghost.style.position = 'fixed';
    ghost.style.zIndex = '9000';
    ghost.style.pointerEvents = 'none';
    ghost.style.transform = 'scale(3)';
    document.body.appendChild(ghost);
    // Center in activation area
    const actRect = activationArea.getBoundingClientRect();
    const w = ghost.offsetWidth || 110;
    const h = ghost.offsetHeight || 150;
    ghost.style.left = (actRect.left + (actRect.width - w) / 2) + 'px';
    ghost.style.top = (actRect.top + (actRect.height - h) / 2) + 'px';
    _spellGhost = ghost;
  }

  function removeSpellGhost() {
    if (_spellGhost) {
      _spellGhost.remove();
      _spellGhost = null;
    }
    removeSpellArrowSvg();
  }

  /* ─────────────────────────────────────────────────────────────────
     TRIGGER TARGET SELECTION (Battlecry, etc.)
  ───────────────────────────────────────────────────────────────── */

  /** Called by engine when a trigger stack entry needs a target (human or AI).
      Returns a Promise that resolves with the chosen target UID, or null. */
  function requestTriggerTarget(G, entry) {
    const ownerIdx = entry.ownerIdx;

    // AI: auto-select target
    if (ownerIdx !== _humanIdx) {
      return aiSelectTriggerTarget(G, entry);
    }

    // Human: show ghost, wait for click
    return new Promise(resolve => {
      _pendingTriggerEntry = entry;
      _triggerTargetResolve = resolve;

      // Animate ghost from minion's battlefield position to activation area
      const minionEl = getCardElByUid(entry.sourceUid);
      const activationArea = $('activation-area');
      if (!activationArea) { cleanupTriggerTarget(); resolve(null); return; }

      const ghost = buildCardEl(entry.card, 'animation');
      ghost.classList.add('card-anim', 'trigger-ghost');
      ghost.style.position = 'fixed';
      ghost.style.zIndex = '9000';
      ghost.style.pointerEvents = 'none';
      document.body.appendChild(ghost);

      // Start at minion's position (or center of battlefield)
      let startLeft, startTop;
      if (minionEl) {
        const srcRect = minionEl.getBoundingClientRect();
        startLeft = srcRect.left;
        startTop = srcRect.top;
      } else {
        const actRect = activationArea.getBoundingClientRect();
        startLeft = actRect.left + actRect.width / 2 - 55;
        startTop = actRect.top + actRect.height / 2 - 75;
      }
      ghost.style.left = startLeft + 'px';
      ghost.style.top = startTop + 'px';
      ghost.style.transform = 'scale(1)';
      ghost.style.transition = 'none';

      // Animate to activation area at scale(3)
      const actRect = activationArea.getBoundingClientRect();
      const w = ghost.offsetWidth || 110;
      const h = ghost.offsetHeight || 150;
      const destLeft = actRect.left + (actRect.width - w) / 2;
      const destTop = actRect.top + (actRect.height - h) / 2;

      ghost.getBoundingClientRect(); // force layout
      ghost.style.transition = 'left 0.25s ease, top 0.25s ease, transform 0.25s ease';
      requestAnimationFrame(() => {
        ghost.style.left = destLeft + 'px';
        ghost.style.top = destTop + 'px';
        ghost.style.transform = 'scale(3)';
      });

      _triggerGhost = ghost;
      appendLog(`Select a target for ${entry.cardName}.`);
      fullRender(G);
    });
  }

  /** AI selects a target for a triggered ability — show brief ghost + arrow */
  async function aiSelectTriggerTarget(G, entry) {
    const ownerIdx = entry.ownerIdx;
    const targetType = entry.targetType || 'any_minion';
    const friendly = Engine.getFriendlyMinions(G, ownerIdx);
    const enemies = Engine.getEnemyMinions(G, ownerIdx);
    let candidates = [];
    if (targetType === 'friendly_minion') candidates = friendly;
    else if (targetType === 'enemy_minion') candidates = enemies;
    else candidates = [...friendly, ...enemies];

    if (candidates.length === 0) return null;
    let target;
    if (targetType === 'friendly_minion') target = candidates[0];
    else if (targetType === 'enemy_minion') target = Engine.rand(candidates);
    else target = candidates[0];

    // Brief visual: ghost flies to activation area, arrow to target, hold, clean up
    const minionEl = getCardElByUid(entry.sourceUid);
    const activationArea = $('activation-area');
    if (activationArea) {
      const ghost = buildCardEl(entry.card, 'animation');
      ghost.classList.add('card-anim', 'trigger-ghost');
      ghost.style.position = 'fixed';
      ghost.style.zIndex = '9000';
      ghost.style.pointerEvents = 'none';
      let startLeft, startTop;
      if (minionEl) {
        const srcRect = minionEl.getBoundingClientRect();
        startLeft = srcRect.left;
        startTop = srcRect.top;
      } else {
        const actRect = activationArea.getBoundingClientRect();
        startLeft = actRect.left + actRect.width / 2 - 55;
        startTop = actRect.top + actRect.height / 2 - 75;
      }
      ghost.style.left = startLeft + 'px';
      ghost.style.top = startTop + 'px';
      ghost.style.transform = 'scale(1)';
      ghost.style.transition = 'none';
      document.body.appendChild(ghost);

      const actRect = activationArea.getBoundingClientRect();
      const w = ghost.offsetWidth || 110;
      const h = ghost.offsetHeight || 150;
      ghost.getBoundingClientRect();
      ghost.style.transition = 'left 0.25s ease, top 0.25s ease, transform 0.25s ease';
      requestAnimationFrame(() => {
        ghost.style.left = (actRect.left + (actRect.width - w) / 2) + 'px';
        ghost.style.top = (actRect.top + (actRect.height - h) / 2) + 'px';
        ghost.style.transform = 'scale(3)';
      });
      await delay(300);

      // Draw arrow to target
      const targetEl = getCardElByUid(target.uid);
      if (targetEl) {
        const ghostRect = ghost.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const svg = ensureSpellArrowSvg();
        svg.innerHTML = '';
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'spell-arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '10');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', '#ffaa00');
        marker.appendChild(polygon);
        defs.appendChild(marker);
        svg.appendChild(defs);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', ghostRect.left + ghostRect.width / 2);
        line.setAttribute('y1', ghostRect.top + ghostRect.height / 2);
        line.setAttribute('x2', targetRect.left + targetRect.width / 2);
        line.setAttribute('y2', targetRect.top + targetRect.height / 2);
        line.setAttribute('stroke', '#ffaa00');
        line.setAttribute('stroke-width', '3');
        line.setAttribute('marker-end', 'url(#spell-arrowhead)');
        svg.appendChild(line);
        targetEl.classList.add('spell-target-highlight');
        await delay(800);
        targetEl.classList.remove('spell-target-highlight');
      }
      ghost.remove();
      removeSpellArrowSvg();
    }

    return target.uid;
  }

  /** Called when a battlefield card is clicked while a trigger needs a target */
  function onTriggerTargetClick(G, minion) {
    if (!_pendingTriggerEntry || !_triggerTargetResolve) return false;

    const entry = _pendingTriggerEntry;
    const targetType = entry.targetType || 'any_minion';
    const ownerIdx = entry.ownerIdx;

    // Validate target type
    let valid = false;
    if (targetType === 'friendly_minion' && minion.owner === ownerIdx) valid = true;
    else if (targetType === 'enemy_minion' && minion.owner !== ownerIdx) valid = true;
    else if (targetType === 'any_minion') valid = true;
    // Don't target self (the trigger source)
    if (minion.uid === entry.sourceUid) valid = false;

    if (!valid) {
      appendLog('Invalid target.');
      return true; // consumed the click
    }

    // Draw arrow from ghost to target, hold briefly, then resolve
    const targetEl = getCardElByUid(minion.uid);
    if (_triggerGhost && targetEl) {
      const ghostRect = _triggerGhost.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const svg = ensureSpellArrowSvg();
      svg.innerHTML = '';
      // Arrowhead
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', 'spell-arrowhead');
      marker.setAttribute('markerWidth', '10');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('refX', '10');
      marker.setAttribute('refY', '3.5');
      marker.setAttribute('orient', 'auto');
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
      polygon.setAttribute('fill', '#ffaa00');
      marker.appendChild(polygon);
      defs.appendChild(marker);
      svg.appendChild(defs);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', ghostRect.left + ghostRect.width / 2);
      line.setAttribute('y1', ghostRect.top + ghostRect.height / 2);
      line.setAttribute('x2', targetRect.left + targetRect.width / 2);
      line.setAttribute('y2', targetRect.top + targetRect.height / 2);
      line.setAttribute('stroke', '#ffaa00');
      line.setAttribute('stroke-width', '3');
      line.setAttribute('marker-end', 'url(#spell-arrowhead)');
      svg.appendChild(line);
      targetEl.classList.add('spell-target-highlight');
    }

    const resolve = _triggerTargetResolve;
    const targetUid = minion.uid;

    // Hold the arrow briefly, then clean up and resolve
    setTimeout(() => {
      if (targetEl) targetEl.classList.remove('spell-target-highlight');
      cleanupTriggerTarget();
      resolve(targetUid);
    }, 800);

    return true; // consumed the click
  }

  function cleanupTriggerTarget() {
    _pendingTriggerEntry = null;
    _triggerTargetResolve = null;
    if (_triggerGhost) {
      _triggerGhost.remove();
      _triggerGhost = null;
    }
    removeSpellArrowSvg();
  }

  function ensureSpellArrowSvg() {
    let svg = document.getElementById('spell-arrow-svg');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'spell-arrow-svg';
      svg.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9500;';
      document.body.appendChild(svg);
    }
    return svg;
  }

  function removeSpellArrowSvg() {
    const svg = document.getElementById('spell-arrow-svg');
    if (svg) svg.remove();
  }

  /** Draw arrow from spell ghost (activation zone) to target card/hero, wait 1s, then resolve */
  function runSpellTargetAnimation(G, card, targetUid, playerIdx) {
    _spellAnimating = true;
    return new Promise(resolve => {
      // Find the ghost element (already shown in activation zone for human, or create one for AI)
      let ghost = _spellGhost;

      if (!ghost) {
        // AI path: create a ghost for the spell
        showSpellGhostInActivation(card);
        ghost = _spellGhost;
      }
      if (!ghost) { _spellAnimating = false; resolve(); return; }

      // Find target element position
      let targetRect = null;
      const targetEl = getCardElByUid(targetUid);
      if (targetEl) {
        targetRect = targetEl.getBoundingClientRect();
      }
      if (!targetRect) { removeSpellGhost(); _spellAnimating = false; resolve(); return; }

      // Draw arrow from ghost center to target center
      const ghostRect = ghost.getBoundingClientRect();
      const sx = ghostRect.left + ghostRect.width / 2;
      const sy = ghostRect.top + ghostRect.height / 2;
      const tx = targetRect.left + targetRect.width / 2;
      const ty = targetRect.top + targetRect.height / 2;

      const svg = ensureSpellArrowSvg();
      svg.innerHTML = '';

      // Arrowhead marker
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', 'spell-arrowhead');
      marker.setAttribute('markerWidth', '10');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('refX', '10');
      marker.setAttribute('refY', '3.5');
      marker.setAttribute('orient', 'auto');
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
      polygon.setAttribute('fill', '#ff4444');
      marker.appendChild(polygon);
      defs.appendChild(marker);
      svg.appendChild(defs);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', sx);
      line.setAttribute('y1', sy);
      line.setAttribute('x2', tx);
      line.setAttribute('y2', ty);
      line.setAttribute('stroke', '#ff4444');
      line.setAttribute('stroke-width', '3');
      line.setAttribute('marker-end', 'url(#spell-arrowhead)');
      svg.appendChild(line);

      // Highlight target card
      if (targetEl) targetEl.classList.add('spell-target-highlight');

      // Wait 1 second, then clean up and resolve
      setTimeout(() => {
        if (targetEl) targetEl.classList.remove('spell-target-highlight');
        removeSpellGhost();
        _spellAnimating = false;
        resolve();
      }, 1000);
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     DRAG-AND-DROP FROM HAND
  ───────────────────────────────────────────────────────────────── */
  function startDrag(e, G, card, cardEl) {
    // Allow dragging during priority windows even when AI is running or in combat
    if (_inPriorityWindow) {
      if (card.type !== 'instant' && !Engine.getKw(card, 'flash')) return;
      if (_dragState) return;
      // Continue with drag setup
    } else {
      if (_aiRunning || G.phase === 'gameOver' || G.phase === 'combat' || _dragState) return;
    }
    if (_animatingCard || _drawAnimRunning || _combatAnimating || _spellAnimating) return;
    e.preventDefault();
    hideTooltip();

    const pt = e.touches ? e.touches[0] : e;
    const rect = cardEl.getBoundingClientRect();

    // Create a floating ghost clone
    const ghost = cardEl.cloneNode(true);
    ghost.classList.add('drag-ghost');
    ghost.style.width  = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.left   = rect.left + 'px';
    ghost.style.top    = rect.top + 'px';
    document.body.appendChild(ghost);

    // Dim the original card in hand
    cardEl.classList.add('drag-origin');

    _dragState = {
      card: card,
      G: G,
      originEl: cardEl,
      ghostEl: ghost,
      offsetX: pt.clientX - rect.left,
      offsetY: pt.clientY - rect.top,
      originRect: rect,
      moved: false,
    };

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
  }

  function onDragMove(e) {
    if (!_dragState) return;
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    const ghost = _dragState.ghostEl;
    ghost.style.left = (pt.clientX - _dragState.offsetX) + 'px';
    ghost.style.top  = (pt.clientY - _dragState.offsetY) + 'px';
    _dragState.moved = true;

    // Highlight the drop zone
    const bf = document.getElementById('player-battlefield');
    if (bf) {
      const bfRect = bf.getBoundingClientRect();
      if (pt.clientX >= bfRect.left && pt.clientX <= bfRect.right &&
          pt.clientY >= bfRect.top  && pt.clientY <= bfRect.bottom) {
        bf.classList.add('drop-highlight');
      } else {
        bf.classList.remove('drop-highlight');
      }
    }
  }

  function onDragEnd(e) {
    if (!_dragState) return;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);

    const ds = _dragState;
    _dragState = null;

    // Remove drop highlight
    const bf = document.getElementById('player-battlefield');
    if (bf) bf.classList.remove('drop-highlight');

    const pt = e.changedTouches ? e.changedTouches[0] : e;

    // Check if dropped on player battlefield
    let droppedOnBattlefield = false;
    if (bf && ds.moved) {
      const bfRect = bf.getBoundingClientRect();
      if (pt.clientX >= bfRect.left && pt.clientX <= bfRect.right &&
          pt.clientY >= bfRect.top  && pt.clientY <= bfRect.bottom) {
        droppedOnBattlefield = true;
      }
    }

    if (droppedOnBattlefield) {
      const canPlay = canPlayFromHand(ds.G, ds.card);
      if (canPlay) {
        // Remove ghost immediately and play the card
        ds.ghostEl.remove();
        ds.originEl.classList.remove('drag-origin');
        if (cardNeedsTarget(ds.G, ds.card)) {
          _selectedCard      = { uid: ds.card.uid, source: 'hand', el: ds.originEl };
          _pendingTargetCard = ds.card;
          appendLog(`Select a target for ${ds.card.name}.`);
          // Show spell/upgrade in activation zone while awaiting target
          if (ds.card.type === 'instant' || ds.card.type === 'sorcery') {
            showSpellGhostInActivation(ds.card);
          }
          fullRender(ds.G);
        } else {
          tryPlayCard(ds.G, ds.card, null);
        }
        return;
      } else {
        appendLog(`Cannot play ${ds.card.name}.`);
      }
    }

    // Animate ghost back to origin position
    animateBack(ds);
  }

  function canPlayFromHand(G, card) {
    if (_aiRunning && !_inPriorityWindow) return false;
    const p = G.players[_humanIdx];
    const isActive = G.activePlayer === _humanIdx;

    // During a priority window, only instants and flash cards are playable
    if (_inPriorityWindow) {
      if (card.type !== 'instant' && !Engine.getKw(card, 'flash')) return false;
      const effCost = getEffectiveCost(G, _humanIdx, card);
      return effCost <= p.mana.current;
    }

    if (!isActive && G.phase !== 'combat') return false;
    if (G.phase !== 'action' && G.phase !== 'combat') return false;
    const effCost = getEffectiveCost(G, _humanIdx, card);
    if (effCost > p.mana.current) return false;
    return true;
  }

  function animateBack(ds) {
    const ghost = ds.ghostEl;
    const or    = ds.originRect;
    ghost.style.transition = 'left 0.25s ease, top 0.25s ease';
    ghost.style.left = or.left + 'px';
    ghost.style.top  = or.top + 'px';
    ghost.addEventListener('transitionend', function cleanup() {
      ghost.removeEventListener('transitionend', cleanup);
      ghost.remove();
      ds.originEl.classList.remove('drag-origin');
    });
    // Fallback cleanup in case transitionend doesn't fire
    setTimeout(() => {
      if (ghost.parentNode) ghost.remove();
      ds.originEl.classList.remove('drag-origin');
    }, 350);
  }

  /* ─────────────────────────────────────────────────────────────────
     BATTLEFIELD CARD CLICK
  ───────────────────────────────────────────────────────────────── */
  function onBattlefieldCardClick(G, minion, cardEl) {
    if (_aiRunning && !_pendingTriggerEntry) return;
    if (G.phase === 'gameOver') return;
    if (_spellAnimating) return;

    // Trigger target selection (battlecry etc.)
    if (_pendingTriggerEntry) {
      onTriggerTargetClick(G, minion);
      return;
    }

    const phase = G.phase;
    const step  = G.combatStep;
    const isPlayerOwned = minion.owner === _humanIdx;

    if (_pendingTargetCard) {
      if (isBattlefieldTarget(G, minion, _pendingTargetCard)) {
        tryPlayCard(G, _pendingTargetCard, minion.uid);
      } else {
        appendLog('Invalid target.');
      }
      return;
    }

    if (phase === 'combat' && step === 'declareAttackers' && isPlayerOwned) {
      if (minion.tapped || minion.frozenTurns > 0) {
        appendLog(`${minion.name} cannot attack (tapped or frozen).`);
        return;
      }
      if (Engine.getKw && Engine.getKw(minion, 'defender')) {
        appendLog(`${minion.name} has Defender and cannot attack.`);
        return;
      }
      const idx = G.attackers.indexOf(minion.uid);
      if (idx === -1) {
        G.attackers.push(minion.uid);
        cardEl.classList.add('attacker');
      } else {
        G.attackers.splice(idx, 1);
        cardEl.classList.remove('attacker');
      }
      return;
    }

    if (phase === 'combat' && step === 'declareBlockers' && _gameMode === 'multiplayer') {
      const defender = 1 - G.activePlayer;
      if (defender !== _humanIdx) return;

      if (isPlayerOwned) {
        if (_selectedBlocker === minion.uid) {
          _selectedBlocker = null;
          appendLog(`Deselected ${minion.name} as blocker.`);
        } else {
          _selectedBlocker = minion.uid;
          appendLog(`Selected ${minion.name} as blocker. Now click an attacker.`);
        }
        fullRender(G);
        return;
      } else {
        if (_selectedBlocker) {
          const attackerUid = minion.uid;
          if (!G.attackers.includes(attackerUid)) {
            appendLog('That minion is not attacking.');
            return;
          }
          if (!G.blockers) G.blockers = {};
          if (!G.blockers[attackerUid]) G.blockers[attackerUid] = [];
          for (const [aUid, bArr] of Object.entries(G.blockers)) {
            const i = bArr.indexOf(_selectedBlocker);
            if (i !== -1) bArr.splice(i, 1);
          }
          G.blockers[attackerUid].push(_selectedBlocker);
          appendLog(`Assigned ${getCardByUid(G, _selectedBlocker).name} to block ${minion.name}.`);
          _selectedBlocker = null;
          fullRender(G);
        } else {
          appendLog('First click one of your minions to select it as a blocker.');
        }
        return;
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     SHOP CARD CLICK
  ───────────────────────────────────────────────────────────────── */
  function onShopCardClick(G, card, cardEl) {
    if (_aiRunning) return;
    if (G.phase !== 'draft') return;
    if (G.activePlayer !== _humanIdx) return;

    const success = Engine.draftCard(G, _humanIdx, card.uid);
    if (!success) {
      appendLog(`Could not draft ${card.name}.`);
    }
    // draftCard calls finishEndTurn which triggers onPhaseChange
    // That will hide the shop overlay and re-render
  }

  /* ─────────────────────────────────────────────────────────────────
     FIRST TURN HINT
  ───────────────────────────────────────────────────────────────── */
  function showFirstTurnHint() {
    const hint = $('first-turn-hint');
    if (hint) hint.classList.remove('hidden');
  }
  function hideFirstTurnHint() {
    const hint = $('first-turn-hint');
    if (hint) hint.classList.add('hidden');
  }

  /* ─────────────────────────────────────────────────────────────────
     COMBAT BUTTONS
  ───────────────────────────────────────────────────────────────── */
  function onAttackClick() {
    if (!_G) return;
    const success = Engine.initiateCombat(_G);
    if (!success) appendLog('Cannot initiate combat now.');
  }

  function onConfirmAttackers() {
    if (!_G) return;
    if (!_G.attackers || _G.attackers.length === 0) {
      appendLog('Select at least one attacker, or cancel combat.');
      return;
    }
    const success = Engine.declareAttackers(_G, _G.attackers.slice());
    if (!success) appendLog('Could not confirm attackers.');
  }

  function onCancelCombat() {
    if (!_G) return;
    _G.attackers = [];
    _G.phase     = 'action';
    _G.combatStep= null;
    appendLog('Combat cancelled.');
    fullRender(_G);
  }

  async function onConfirmBlockers() {
    if (!_G) return;
    _selectedBlocker = null;
    removeBlockerArrows();

    // declareBlockers is async (has priority windows before damage)
    const success = await Engine.declareBlockers(_G, _G.blockers || {});
    if (!success) appendLog('Could not confirm blockers.');

    // Re-enable AI overlay since AI turn resumes
    _aiRunning = true;
    show('ai-overlay');
    fullRender(_G);
    // Resolve the waitForBlockers promise so the AI turn can continue
    if (_blockersResolve) {
      const resolve = _blockersResolve;
      _blockersResolve = null;
      resolve();
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     COMBAT DAMAGE ANIMATION
  ───────────────────────────────────────────────────────────────── */
  let _combatAnimating = false;
  let _combatAnimPromise = Promise.resolve();

  function onCombatDamageStart(G) {
    _G = G;
    _combatAnimating = true;
    fullRender(G);  // show battlefield in resolveDamage state

    const attackerUids = [...G.attackers];
    const defIdx = 1 - G.activePlayer;

    _combatAnimPromise = (async () => {
      for (const attUid of attackerUids) {
        const attacker = Engine.getMinion(G, attUid);
        if (!attacker) continue;

        const blockerUids = G.blockers[attUid] || [];
        // Determine target element for animation
        const targetEl = blockerUids.length > 0
          ? getCardElByUid(blockerUids[0])    // move to first blocker
          : getHeroBannerEl(defIdx);           // move to defending hero

        const attackerEl = getCardElByUid(attUid);
        if (!attackerEl || !targetEl) {
          // Can't animate — just resolve damage
          Engine.resolveSingleAttackerDamage(G, attUid);
          fullRender(G);
          continue;
        }

        // Phase 1: slingshot attack animation
        const srcRect = attackerEl.getBoundingClientRect();
        const destRect = targetEl.getBoundingClientRect();

        const ghost = buildCardEl(attacker, 'animation');
        ghost.classList.add('card-anim');
        ghost.style.width = srcRect.width + 'px';
        ghost.style.height = srcRect.height + 'px';
        ghost.style.left = srcRect.left + 'px';
        ghost.style.top = srcRect.top + 'px';
        ghost.style.transition = 'none';
        ghost.style.zIndex = '8000';
        document.body.appendChild(ghost);
        attackerEl.style.visibility = 'hidden';

        // Slingshot parameters scaled by power
        const power = Engine.getEffectiveAtk(attacker);
        const powerFactor = Math.min(power / 10, 1); // 0..1, capped at 10 ATK
        const windupDur   = 120 + powerFactor * 180;  // 120ms..300ms
        const lungeDur    = 150 + powerFactor * 200;   // 150ms..350ms
        const impactPause = 80 + powerFactor * 170;    // 80ms..250ms

        const dx = destRect.left + destRect.width / 2 - srcRect.width / 2 - srcRect.left;
        const dy = destRect.top + destRect.height / 2 - srcRect.height / 2 - srcRect.top;
        // Wind-up: pull back ~12-18% opposite direction
        const windupPct = 0.12 + powerFactor * 0.06;
        const wxOff = -dx * windupPct;
        const wyOff = -dy * windupPct;

        // Phase 1a: wind-up (pull back) — slow ease-out
        ghost.animate([
          { transform: 'translate(0, 0)' },
          { transform: `translate(${wxOff}px, ${wyOff}px)` }
        ], { duration: windupDur, easing: 'cubic-bezier(0.2, 0, 0.4, 1)', fill: 'forwards' });
        await delay(windupDur);

        // Phase 1b: lunge to target — fast start, hard stop
        ghost.animate([
          { transform: `translate(${wxOff}px, ${wyOff}px)` },
          { transform: `translate(${dx}px, ${dy}px)` }
        ], { duration: lungeDur, easing: 'cubic-bezier(0.2, 0, 0.1, 1)', fill: 'forwards' });
        await delay(lungeDur);

        // Impact pause — longer for heavier hits
        await delay(impactPause);

        // Snapshot positions/owners of all involved minions before damage
        const involvedUids = [attUid, ...blockerUids];
        const preSnapshot = {};
        for (const uid of involvedUids) {
          const el = getCardElByUid(uid);
          const m = Engine.getMinion(G, uid);
          if (el && m) {
            preSnapshot[uid] = { rect: el.getBoundingClientRect(), owner: m.owner };
          }
        }

        // Phase 2: resolve damage for this attacker
        const { deadUids } = Engine.resolveSingleAttackerDamage(G, attUid);

        // Brief pause to show impact
        await delay(150);

        // Phase 3: animate dead minions to discard pile (skip attacker — handled separately)
        const deadBlockers = deadUids.filter(uid => uid !== attUid);
        if (deadBlockers.length > 0) {
          const deathPromises = deadBlockers.map(dUid => animateToDiscardFromSnapshot(dUid, preSnapshot[dUid]));
          await Promise.all(deathPromises);
        }

        // Phase 4: animate attacker back (if still alive) — fast start, gradual slowdown
        const stillAlive = !deadUids.includes(attUid);
        const returnDur = 200 + powerFactor * 150; // 200ms..350ms
        if (stillAlive) {
          fullRender(G);
          // Find the attacker's new position after re-render
          const newAttEl = getCardElByUid(attUid);
          if (newAttEl) {
            const backRect = newAttEl.getBoundingClientRect();
            newAttEl.style.visibility = 'hidden';
            // Get ghost's current position for return animation
            const ghostRect = ghost.getBoundingClientRect();
            const retDx = backRect.left - ghostRect.left;
            const retDy = backRect.top - ghostRect.top;
            ghost.animate([
              { transform: ghost.style.transform || `translate(${dx}px, ${dy}px)` },
              { transform: `translate(${dx + retDx}px, ${dy + retDy}px)` }
            ], { duration: returnDur, easing: 'cubic-bezier(0, 0, 0.2, 1)', fill: 'forwards' });
            await delay(returnDur);
            newAttEl.style.visibility = '';
          }
          ghost.remove();
        } else {
          // Attacker died — animate ghost to discard then remove
          const ownerIdx = preSnapshot[attUid] ? preSnapshot[attUid].owner : attacker.owner;
          const discardBoxId = ownerIdx === _humanIdx ? 'player-discard-box' : 'opp-discard-box';
          const discardBox = $(discardBoxId);
          if (discardBox) {
            const dRect = discardBox.getBoundingClientRect();
            const ghostRect = ghost.getBoundingClientRect();
            const toDx = dRect.left + dRect.width / 2 - srcRect.width / 2 - ghostRect.left + dx;
            const toDy = dRect.top + dRect.height / 2 - srcRect.height / 2 - ghostRect.top + dy;
            ghost.animate([
              { transform: `translate(${dx}px, ${dy}px)`, opacity: 1 },
              { transform: `translate(${toDx}px, ${toDy}px)`, opacity: 0.3 }
            ], { duration: 250, easing: 'ease-in-out', fill: 'forwards' });
            await delay(270);
          }
          ghost.remove();
          fullRender(G);
        }

        // Small gap before next attacker
        await delay(100);
        if (G.gameOver) break;
      }

      // All attackers resolved — end combat
      _combatAnimating = false;
      Engine.endCombat(G);
    })();
  }

  /** Find a card element on the battlefield by uid */
  function getCardElByUid(uid) {
    return document.querySelector(`.card[data-uid="${uid}"]`);
  }

  /** Get the hero banner element for a player index */
  function getHeroBannerEl(playerIdx) {
    return playerIdx === _humanIdx
      ? $('player-banner')
      : $('opponent-banner');
  }

  /** Animate a dead minion from its snapshot position to the discard pile */
  function animateToDiscardFromSnapshot(uid, snapshot) {
    if (!snapshot) return Promise.resolve();

    const cardEl = getCardElByUid(uid);
    const srcRect = snapshot.rect;
    const discardBoxId = snapshot.owner === _humanIdx ? 'player-discard-box' : 'opp-discard-box';
    const discardBox = $(discardBoxId);
    if (!discardBox) return Promise.resolve();

    const destRect = discardBox.getBoundingClientRect();

    // Create ghost at card's pre-damage position
    let ghost;
    if (cardEl) {
      ghost = cardEl.cloneNode(true);
      cardEl.style.visibility = 'hidden';
    } else {
      ghost = document.createElement('div');
      ghost.className = 'card';
    }
    ghost.classList.add('card-anim');
    ghost.style.width = srcRect.width + 'px';
    ghost.style.height = srcRect.height + 'px';
    ghost.style.left = srcRect.left + 'px';
    ghost.style.top = srcRect.top + 'px';
    ghost.style.transition = 'none';
    ghost.style.zIndex = '7500';
    document.body.appendChild(ghost);

    ghost.getBoundingClientRect();
    ghost.style.transition = 'left 0.25s ease-in-out, top 0.25s ease-in-out, opacity 0.25s ease-in-out';
    requestAnimationFrame(() => {
      ghost.style.left = (destRect.left + destRect.width / 2 - srcRect.width / 2) + 'px';
      ghost.style.top = (destRect.top + destRect.height / 2 - srcRect.height / 2) + 'px';
      ghost.style.opacity = '0.3';
    });

    return new Promise(resolve => {
      setTimeout(() => {
        ghost.remove();
        resolve();
      }, 270);
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     PRIORITY / STACK SYSTEM
  ───────────────────────────────────────────────────────────────── */

  function requestPriority(G, playerIdx) {
    _G = G;

    // AI player delegates to AI module
    if (G.gameMode === 'singleplayer' && playerIdx === G.aiPlayerIdx) {
      if (window.AI && window.AI.respondToPriority) {
        return window.AI.respondToPriority(G, playerIdx);
      }
      return Promise.resolve({ action: 'pass' });
    }

    // Human player: show priority bar and wait for response
    return new Promise(resolve => {
      _inPriorityWindow = true;
      _priorityResolve = resolve;
      _priorityCountdown = 15;

      // Hide AI overlay so human can interact
      hide('ai-overlay');

      // Show priority bar
      const bar = $('priority-bar');
      const msgEl = $('priority-msg');
      const timerText = $('priority-timer-text');
      const timerFill = $('priority-timer-fill');
      const passBtn = $('btn-priority-pass');

      if (G.stack.length > 0) {
        const topEntry = G.stack[G.stack.length - 1];
        msgEl.textContent = `${topEntry.cardName} on the stack — Respond?`;
      } else if (G.phase === 'combat' && G.combatStep === 'declareAttackers') {
        msgEl.textContent = 'Attackers declared. Respond with an Instant?';
      } else if (G.phase === 'combat' && G.combatStep === 'declareBlockers') {
        msgEl.textContent = 'Blockers declared. Respond with an Instant?';
      } else if (G.phase === 'combat' && G.combatStep === 'resolveDamage') {
        msgEl.textContent = 'Before combat damage. Respond with an Instant?';
      } else {
        msgEl.textContent = 'Respond with an Instant?';
      }

      timerText.textContent = '15';
      timerFill.style.transition = 'none';
      timerFill.style.width = '100%';
      // Force reflow then animate
      timerFill.getBoundingClientRect();
      timerFill.style.transition = 'width 15s linear';
      timerFill.style.width = '0%';

      bar.classList.remove('hidden');

      // Re-render hand to show playable instants
      renderPlayerHand(G);
      renderStack(G);

      // Pass button handler
      const onPass = () => {
        cleanupPriority();
        resolve({ action: 'pass' });
      };
      passBtn.onclick = onPass;

      // Countdown timer
      _priorityTimerId = setInterval(() => {
        _priorityCountdown--;
        timerText.textContent = String(Math.max(0, _priorityCountdown));
        if (_priorityCountdown <= 0) {
          cleanupPriority();
          resolve({ action: 'pass' });
        }
      }, 1000);
    });
  }

  function cleanupPriority() {
    _inPriorityWindow = false;
    _priorityResolve = null;
    if (_priorityTimerId) {
      clearInterval(_priorityTimerId);
      _priorityTimerId = null;
    }
    const bar = $('priority-bar');
    if (bar) bar.classList.add('hidden');
    // Restore AI overlay if AI turn is still running
    if (_aiRunning) show('ai-overlay');
    if (_G) renderPlayerHand(_G);
  }

  /** Render stack entries in the activation area */
  function renderStack(G) {
    const container = $('stack-cards');
    if (!container) return;
    container.innerHTML = '';

    if (G.stack.length === 0) return;

    // Show stacked cards, newest on top (visually)
    for (let i = 0; i < G.stack.length; i++) {
      const entry = G.stack[i];
      const wrapper = document.createElement('div');
      wrapper.className = 'stack-card-wrapper';
      if (entry.countered) wrapper.classList.add('countered');

      // Scale down older entries, offset them slightly
      const depth = G.stack.length - 1 - i;
      const scale = 1 - depth * 0.08;
      const offsetY = depth * -6;
      wrapper.style.transform = `translateY(${offsetY}px) scale(${Math.max(0.7, scale)})`;
      wrapper.style.zIndex = String(i + 1);

      const cardEl = buildCardEl(entry.card, 'animation');
      wrapper.appendChild(cardEl);

      if (entry.countered) {
        const xMark = document.createElement('div');
        xMark.className = 'stack-counter-x';
        xMark.textContent = '✖';
        wrapper.appendChild(xMark);
      }

      container.appendChild(wrapper);
    }
  }

  /** Called when a stack entry resolves */
  function onStackResolve(G, entry) {
    _G = G;
    renderStack(G);
    fullRender(G);
  }

  /* ─────────────────────────────────────────────────────────────────
     BLOCKER DECLARATION SYSTEM
  ───────────────────────────────────────────────────────────────── */

  /** Check if the defending human has any valid blockers for any attacker */
  function canAnyoneBlock(G) {
    const defIdx = 1 - G.activePlayer;
    const defenders = Engine.getFriendlyMinions(G, defIdx).filter(m => !m.tapped);
    if (defenders.length === 0) return false;
    // Check if at least one defender can legally block at least one attacker
    for (const attUid of G.attackers) {
      const att = Engine.getMinion(G, attUid);
      if (!att) continue;
      // Stealth minions that just entered can't be blocked
      if (Engine.getKw(att, 'stealth') && att.enteredThisTurn) continue;
      for (const def of defenders) {
        // Flying restriction
        if (Engine.getKw(att, 'flying') && !Engine.getKw(def, 'flying') && !Engine.getKw(def, 'reach')) continue;
        return true;  // Found at least one valid block
      }
    }
    return false;
  }

  /** Returns a Promise that resolves when the human finishes declaring blockers */
  function waitForBlockers() {
    return new Promise(resolve => {
      _blockersResolve = resolve;
    });
  }

  /** Called by engine when combatStep changes (e.g. to declareBlockers) */
  function onCombatStep(G) {
    _G = G;
    if (G.combatStep === 'declareBlockers') {
      const defender = 1 - G.activePlayer;
      if (defender === _humanIdx) {
        // Initialize blocker map
        if (!G.blockers) G.blockers = {};
        for (const attUid of G.attackers) {
          if (!G.blockers[attUid]) G.blockers[attUid] = [];
        }
        // Check if blocking is possible
        if (!canAnyoneBlock(G)) {
          appendLog('No valid blockers available — skipping to damage.');
          Engine.declareBlockers(G, G.blockers).then(() => {
            if (_blockersResolve) {
              const resolve = _blockersResolve;
              _blockersResolve = null;
              resolve();
            }
          });
          return;
        }
        // Pause AI overlay so the human can interact
        _aiRunning = false;
        hide('ai-overlay');
        // Show blocker UI
        fullRender(G);
        return;
      }
      // Defender is the AI — auto-block and continue
      if (typeof AI !== 'undefined' && AI.autoBlock) {
        AI.autoBlock(G, defender);
      } else {
        // No AI module — just skip with empty blockers
        Engine.declareBlockers(G, {});
      }
      return;
    }
    fullRender(G);
  }

  /** Check if a specific blocker can legally block a specific attacker */
  function canBlockAttacker(G, blocker, attacker) {
    if (blocker.tapped) return false;
    if (blocker.owner === attacker.owner) return false;
    if (Engine.getKw(attacker, 'stealth') && attacker.enteredThisTurn) return false;
    if (Engine.getKw(attacker, 'flying') && !Engine.getKw(blocker, 'flying') && !Engine.getKw(blocker, 'reach')) return false;
    return true;
  }

  /* ── Arrow drag for blocker assignment ─────────────────────── */

  /** Check if a minion is already assigned as a blocker */
  function getBlockerAssignment(G, blockerUid) {
    if (!G.blockers) return null;
    for (const [attUid, bArr] of Object.entries(G.blockers)) {
      if (bArr.includes(blockerUid)) return attUid;
    }
    return null;
  }

  /** Remove a blocker from all assignments */
  function unassignBlocker(G, blockerUid) {
    if (!G.blockers) return;
    for (const [attUid, bArr] of Object.entries(G.blockers)) {
      const i = bArr.indexOf(blockerUid);
      if (i !== -1) bArr.splice(i, 1);
    }
  }

  function startBlockerArrow(e, G, minion, cardEl) {
    if (G.combatStep !== 'declareBlockers') return;
    if (_inPriorityWindow || _pendingTargetCard) return;
    const defender = 1 - G.activePlayer;
    if (defender !== _humanIdx) return;
    if (minion.owner !== _humanIdx) return;
    if (minion.tapped) { appendLog(`${minion.name} is tapped and cannot block.`); return; }

    // If already assigned, unassign on click (mousedown+mouseup without drag)
    const existingAssignment = getBlockerAssignment(G, minion.uid);
    if (existingAssignment) {
      // Track for click detection — only unassign if mouse doesn't move much
      _blockerArrowState = { blockerUid: minion.uid, startEl: cardEl, lineEl: null, isReassign: true, startPt: e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY } };
      e.preventDefault();
      document.addEventListener('mousemove', onBlockerArrowMove);
      document.addEventListener('mouseup', onBlockerArrowEnd);
      document.addEventListener('touchmove', onBlockerArrowMove, { passive: false });
      document.addEventListener('touchend', onBlockerArrowEnd);
      return;
    }

    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    const rect = cardEl.getBoundingClientRect();

    // Create SVG drag line (persistent arrows are handled separately)
    ensureBlockerSvg();
    const svg = document.getElementById('blocker-arrow-svg');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', '#ffcc00');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-dasharray', '6,4');
    line.classList.add('drag-line');
    const sx = rect.left + rect.width / 2;
    const sy = rect.top + rect.height / 2;
    line.setAttribute('x1', sx);
    line.setAttribute('y1', sy);
    line.setAttribute('x2', sx);
    line.setAttribute('y2', sy);
    svg.appendChild(line);

    _blockerArrowState = { blockerUid: minion.uid, startEl: cardEl, lineEl: line, startX: sx, startY: sy };
    cardEl.classList.add('blocker-dragging');

    document.addEventListener('mousemove', onBlockerArrowMove);
    document.addEventListener('mouseup', onBlockerArrowEnd);
    document.addEventListener('touchmove', onBlockerArrowMove, { passive: false });
    document.addEventListener('touchend', onBlockerArrowEnd);
  }

  function onBlockerArrowMove(e) {
    if (!_blockerArrowState) return;
    if (_blockerArrowState.isReassign) {
      // If dragging far enough from start, convert to a new arrow drag
      const pt = e.touches ? e.touches[0] : e;
      const dx = pt.clientX - _blockerArrowState.startPt.x;
      const dy = pt.clientY - _blockerArrowState.startPt.y;
      if (Math.abs(dx) + Math.abs(dy) > 10) {
        // Unassign the old one and start a new drag
        const blocker = Engine.getMinion(_G, _blockerArrowState.blockerUid);
        unassignBlocker(_G, _blockerArrowState.blockerUid);
        // Set up drag line
        const cardEl = _blockerArrowState.startEl;
        const rect = cardEl.getBoundingClientRect();
        ensureBlockerSvg();
        const svg = document.getElementById('blocker-arrow-svg');
        // Redraw persistent arrows (removes the old one)
        drawPersistentBlockerArrows(_G);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('stroke', '#ffcc00');
        line.setAttribute('stroke-width', '3');
        line.setAttribute('stroke-dasharray', '6,4');
        line.classList.add('drag-line');
        const sx = rect.left + rect.width / 2;
        const sy = rect.top + rect.height / 2;
        line.setAttribute('x1', sx);
        line.setAttribute('y1', sy);
        line.setAttribute('x2', pt.clientX);
        line.setAttribute('y2', pt.clientY);
        svg.appendChild(line);
        _blockerArrowState = { blockerUid: _blockerArrowState.blockerUid, startEl: cardEl, lineEl: line, startX: sx, startY: sy };
        cardEl.classList.add('blocker-dragging');
      }
      return;
    }
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    _blockerArrowState.lineEl.setAttribute('x2', pt.clientX);
    _blockerArrowState.lineEl.setAttribute('y2', pt.clientY);
  }

  function onBlockerArrowEnd(e) {
    document.removeEventListener('mousemove', onBlockerArrowMove);
    document.removeEventListener('mouseup', onBlockerArrowEnd);
    document.removeEventListener('touchmove', onBlockerArrowMove);
    document.removeEventListener('touchend', onBlockerArrowEnd);

    if (!_blockerArrowState || !_G) { cleanupDragLine(); return; }

    const bas = _blockerArrowState;

    // Handle click-to-unassign (no significant drag)
    if (bas.isReassign) {
      const blocker = Engine.getMinion(_G, bas.blockerUid);
      unassignBlocker(_G, bas.blockerUid);
      appendLog(`${blocker ? blocker.name : 'Minion'} unassigned from blocking.`);
      _blockerArrowState = null;
      fullRender(_G);
      drawPersistentBlockerArrows(_G);
      return;
    }

    const pt = e.changedTouches ? e.changedTouches[0] : e;
    bas.startEl.classList.remove('blocker-dragging');

    // Find which attacker card was dropped on
    const oppMinionsEl = $('opp-minions');
    let assigned = false;
    if (oppMinionsEl) {
      const attackerCards = oppMinionsEl.querySelectorAll('.card');
      for (const cardEl of attackerCards) {
        const r = cardEl.getBoundingClientRect();
        if (pt.clientX >= r.left && pt.clientX <= r.right && pt.clientY >= r.top && pt.clientY <= r.bottom) {
          const attUid = cardEl.dataset.uid;
          if (attUid && _G.attackers.includes(attUid)) {
            const blocker = Engine.getMinion(_G, bas.blockerUid);
            const attacker = Engine.getMinion(_G, attUid);
            if (blocker && attacker && canBlockAttacker(_G, blocker, attacker)) {
              // Remove this blocker from any previous assignment
              unassignBlocker(_G, bas.blockerUid);
              if (!_G.blockers[attUid]) _G.blockers[attUid] = [];
              _G.blockers[attUid].push(bas.blockerUid);
              appendLog(`${blocker.name} assigned to block ${attacker.name}.`);
              assigned = true;
              fullRender(_G);
              drawPersistentBlockerArrows(_G);
            } else {
              appendLog(`${blocker ? blocker.name : 'Minion'} cannot block ${attacker ? attacker.name : 'that'}.`);
            }
          }
          break;
        }
      }
    }

    // Remove drag line (persistent arrows stay)
    cleanupDragLine();
    if (!assigned) {
      // Redraw persistent arrows in case drag line overlapped
      drawPersistentBlockerArrows(_G);
    }
  }

  /** Ensure the SVG overlay exists */
  function ensureBlockerSvg() {
    let svg = document.getElementById('blocker-arrow-svg');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'blocker-arrow-svg';
      svg.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:7000;pointer-events:none;';
      document.body.appendChild(svg);
    }
    return svg;
  }

  /** Draw persistent arrows for all current blocker assignments */
  function drawPersistentBlockerArrows(G) {
    const svg = ensureBlockerSvg();
    // Remove all existing persistent lines (keep drag lines)
    svg.querySelectorAll('line:not(.drag-line)').forEach(l => l.remove());

    if (!G.blockers) return;
    for (const [attUid, blockerUids] of Object.entries(G.blockers)) {
      const attEl = getCardElByUid(attUid);
      if (!attEl) continue;
      const attRect = attEl.getBoundingClientRect();
      const ax = attRect.left + attRect.width / 2;
      const ay = attRect.top + attRect.height / 2;

      for (const bUid of blockerUids) {
        const bEl = getCardElByUid(bUid);
        if (!bEl) continue;
        const bRect = bEl.getBoundingClientRect();
        const bx = bRect.left + bRect.width / 2;
        const by = bRect.top + bRect.height / 2;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('stroke', '#44ff44');
        line.setAttribute('stroke-width', '3');
        line.setAttribute('x1', bx);
        line.setAttribute('y1', by);
        line.setAttribute('x2', ax);
        line.setAttribute('y2', ay);
        svg.appendChild(line);
      }
    }
  }

  /** Remove only the drag line, not persistent arrows */
  function cleanupDragLine() {
    _blockerArrowState = null;
    const svg = document.getElementById('blocker-arrow-svg');
    if (svg) svg.querySelectorAll('.drag-line').forEach(l => l.remove());
  }

  function removeBlockerArrows() {
    _blockerArrowState = null;
    const svg = document.getElementById('blocker-arrow-svg');
    if (svg) svg.remove();
  }

  /* ─────────────────────────────────────────────────────────────────
     END TURN
  ───────────────────────────────────────────────────────────────── */
  function onEndTurnClick(G) {
    if (_aiRunning) return;
    clearSelection();
    Engine.doEndTurn(G);
  }

  /* ─────────────────────────────────────────────────────────────────
     PASS OVERLAY (multiplayer)
  ───────────────────────────────────────────────────────────────── */
  function showPassOverlay(playerIdx) {
    return new Promise(resolve => {
      const overlay = $('pass-overlay');
      const msg     = $('pass-overlay-msg');
      if (!overlay || !msg) { resolve(); return; }
      msg.textContent = `Pass to Player ${playerIdx + 1}`;
      overlay.classList.remove('hidden');
      _passDismiss = () => {
        overlay.classList.add('hidden');
        _passDismiss = null;
        resolve();
      };
    });
  }

  $('btn-pass-dismiss') && $('btn-pass-dismiss').addEventListener('click', () => {
    if (_passDismiss) _passDismiss();
  });

  /* ─────────────────────────────────────────────────────────────────
     AI TURN
  ───────────────────────────────────────────────────────────────── */
  function runAiTurn(G) {
    if (_aiRunning) return;
    _aiRunning = true;
    show('ai-overlay');
    renderControls(G);

    const finishAi = () => {
      _aiRunning = false;
      hide('ai-overlay');
      fullRender(G);
    };

    if (typeof AI !== 'undefined' && AI.takeTurn) {
      const result = AI.takeTurn(G, G.aiPlayerIdx);
      if (result && typeof result.then === 'function') {
        result.then(finishAi).catch(e => {
          console.error('AI error:', e);
          appendLog('[AI] Error during AI turn.');
          try { Engine.doEndTurn(G); } catch(e2) {}
          finishAi();
        });
      } else {
        finishAi();
      }
    } else {
      appendLog('[AI] AI module not available.');
      Engine.doEndTurn(G);
      finishAi();
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     PHASE / STATE CHANGE CALLBACKS (called by Engine)
  ───────────────────────────────────────────────────────────────── */
  function onPhaseChange(G) {
    _G = G;
    if (window.SFX) window.SFX.play('phase_transition');
    clearSelection();
    // Clean up blocker arrows when leaving combat
    if (G.phase !== 'combat') removeBlockerArrows();
    updatePhaseIndicator(G);
    renderControls(G);
    renderBattlefield(G);
    renderShop(G); // show/hide shop overlay based on phase

    const phase    = G.phase;
    const isActive = G.activePlayer === _humanIdx;

    // Run any pending draw animations before proceeding
    if (_drawQueue.length > 0) {
      const drawPromise = runDrawAnimations();
      // Defer phase-dependent actions until draw animations complete
      drawPromise.then(() => onPhaseChangeAfterDraw(G, phase, isActive));
      return;
    }

    onPhaseChangeAfterDraw(G, phase, isActive);
  }

  function onPhaseChangeAfterDraw(G, phase, isActive) {
    if (phase === 'draft' && _gameMode === 'singleplayer' && G.activePlayer === G.aiPlayerIdx) {
      setTimeout(() => {
        try {
          if (typeof AI !== 'undefined' && AI.pickDraftCard) {
            AI.pickDraftCard(G, G.aiPlayerIdx);
          }
        } catch(e) { console.error('AI draft error:', e); }
        fullRender(G);
      }, 400);
    }

    if (phase === 'action' || phase === 'upkeep') {
      if (_gameMode === 'multiplayer' && !isActive) {
        showPassOverlay(G.activePlayer).then(() => {
          _humanIdx = G.activePlayer;
          fullRender(G);
        });
      }
      if (_gameMode === 'singleplayer' && G.activePlayer === G.aiPlayerIdx && !_aiRunning) {
        setTimeout(() => runAiTurn(G), 400);
      }
    }

    if (phase === 'combat' && G.combatStep === 'declareBlockers' && _gameMode === 'singleplayer') {
      const defender = 1 - G.activePlayer;
      if (defender === G.aiPlayerIdx) {
        setTimeout(() => {
          try {
            if (typeof AI !== 'undefined' && AI.autoBlock) AI.autoBlock(G, G.aiPlayerIdx);
          } catch(e) { console.error('AI block error:', e); }
          fullRender(G);
        }, 300);
      }
    }
  }

  function onStateChange(G) {
    _G = G;
    // If a card play animation is pending, defer the full render until after it completes
    // This prevents battlecry results (summoned tokens, etc.) from appearing before the
    // card has finished animating to the activation area and its destination.
    if (_pendingAnimCard) {
      _animPromise = runCardPlayAnimation();
      _animPromise.then(() => fullRender(_G));
      return;
    }
    if (_animatingCard) return;
    fullRender(G);
  }

  function onGameOver(winnerIdx, message) {
    const overlay = $('gameover-overlay');
    const title   = $('gameover-title');
    const msg     = $('gameover-msg');
    if (!overlay) return;

    // Hide shop overlay if still open
    hide('shop-overlay');

    if (title) {
      if (_gameMode === 'singleplayer') {
        title.textContent = winnerIdx === _humanIdx ? '\u{1F3C6} Victory!' : '\u{1F480} Defeat';
      } else {
        title.textContent = `Player ${winnerIdx + 1} Wins!`;
      }
    }
    if (msg) msg.textContent = message || '';
    overlay.classList.remove('hidden');
  }

  function onScout(G, playerIdx, count) {
    appendLog(`Player ${playerIdx + 1} scouts ${count} card(s).`);
  }

  /* ─────────────────────────────────────────────────────────────────
     MAIN MENU
  ───────────────────────────────────────────────────────────────── */
  function initMenu() {
    const btnSP = $('btn-singleplayer');
    const btnMP = $('btn-multiplayer');
    const btnHTP = $('btn-how-to-play');
    if (btnSP) btnSP.addEventListener('click', () => startHeroSelect('singleplayer'));
    if (btnMP) btnMP.addEventListener('click', () => startHeroSelect('multiplayer'));
    if (btnHTP) btnHTP.addEventListener('click', () => switchScreen('how-to-play'));

    const btnRulesBack = $('btn-rules-back');
    if (btnRulesBack) btnRulesBack.addEventListener('click', () => switchScreen('menu'));
  }

  /* ─────────────────────────────────────────────────────────────────
     HERO SELECT
  ───────────────────────────────────────────────────────────────── */
  let _heroSelectMode  = 'singleplayer';
  let _heroSelectStep  = 1;
  let _hero1           = null;
  let _hero2           = null;

  const HERO_IDS = ['warden', 'shadow', 'archmage'];

  function startHeroSelect(mode) {
    _heroSelectMode = mode;
    _heroSelectStep = 1;
    _hero1 = null;
    _hero2 = null;
    setInner('hero-select-title', 'Player 1 \u2014 Choose Your Hero:');
    resetHeroHighlights();
    switchScreen('hero-select');
  }

  function resetHeroHighlights() {
    document.querySelectorAll('.hero-card').forEach(c => {
      c.style.opacity = '';
      c.style.pointerEvents = '';
    });
  }

  function initHeroSelect() {
    document.querySelectorAll('.hero-card').forEach(card => {
      card.addEventListener('click', () => onHeroCardClick(card.dataset.hero));
    });
  }

  function onHeroCardClick(heroId) {
    if (_heroSelectStep === 1) {
      _hero1 = heroId;
      if (_heroSelectMode === 'singleplayer') {
        const others = HERO_IDS.filter(h => h !== heroId);
        _hero2 = others[Math.floor(Math.random() * others.length)];
        launchGame(_hero1, _hero2, 'singleplayer');
      } else {
        _heroSelectStep = 2;
        setInner('hero-select-title', 'Player 2 \u2014 Choose Your Hero:');
        document.querySelectorAll('.hero-card').forEach(c => {
          if (c.dataset.hero === heroId) {
            c.style.opacity = '0.35';
            c.style.pointerEvents = 'none';
          }
        });
      }
    } else if (_heroSelectStep === 2) {
      if (heroId === _hero1) {
        appendLog('Player 2 must choose a different hero.');
        return;
      }
      _hero2 = heroId;
      launchGame(_hero1, _hero2, 'multiplayer');
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     DECK VIEWER
  ───────────────────────────────────────────────────────────────── */
  let _deckViewerReturnScreen = 'hero-select';

  function initDeckViewer() {
    // "View Deck" buttons on hero cards
    document.querySelectorAll('.btn-view-deck').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent hero card click
        openDeckViewer(btn.dataset.hero);
      });
    });
    // Back button
    const backBtn = $('btn-deck-back');
    if (backBtn) backBtn.addEventListener('click', () => {
      switchScreen(_deckViewerReturnScreen);
    });
  }

  function openDeckViewer(heroId) {
    _deckViewerReturnScreen = 'hero-select';

    const heroNames = { warden: 'The Warden', shadow: 'The Shadow', archmage: 'The Archmage' };
    setInner('deck-viewer-title', (heroNames[heroId] || heroId) + ' — Deck');

    const allDefs = Object.values(window.CARD_DEFS).filter(d => d.hero === heroId);
    const starterDefs = allDefs.filter(d => d.starter);
    const shopDefs = allDefs.filter(d => !d.starter);

    // Sort by cost then name
    const sortCards = (a, b) => (a.cost - b.cost) || a.name.localeCompare(b.name);
    starterDefs.sort(sortCards);
    shopDefs.sort(sortCards);

    setInner('deck-starter-count', starterDefs.length);
    setInner('deck-shop-count', shopDefs.length);

    renderDeckGrid('deck-starter-grid', starterDefs);
    renderDeckGrid('deck-shop-grid', shopDefs);

    switchScreen('deck-viewer');
  }

  function renderDeckGrid(containerId, defs) {
    const container = $(containerId);
    container.innerHTML = '';
    for (const def of defs) {
      // Build a lightweight card instance for display
      const card = {
        uid: 'view-' + def.id,
        defId: def.id,
        id: def.id,
        hero: def.hero,
        name: def.name,
        type: def.type,
        cost: def.cost || 0,
        baseAtk: def.baseAtk || 0,
        baseHp: def.baseHp || 0,
        atk: def.baseAtk || 0,
        hp: def.baseHp || 0,
        maxHp: def.baseHp || 0,
        kw: Object.assign({}, def.kw || {}),
        tempKw: {},
        silenced: false,
        tempAtk: 0,
        tempHp: 0,
        text: def.text || '',
        frozenTurns: 0,
        shieldCharges: 0,
        wardCharges: (def.kw && def.kw.ward) || 0,
        upgrades: [],
      };
      const cardEl = buildCardEl(card, 'discard');
      container.appendChild(cardEl);
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     GAME LAUNCH
  ───────────────────────────────────────────────────────────────── */
  function launchGame(hero0, hero1, mode) {
    _gameMode      = mode;
    _humanIdx      = 0;
    _aiRunning     = false;
    _selectedCard  = null;
    _pendingTargetCard = null;
    _selectedBlocker   = null;
    _logEntries.length = 0;

    // Hide shop overlay on fresh game start
    hide('shop-overlay');

    const G = Engine.createGame(hero0, hero1, mode);
    _G      = G;

    window.UI = window.UI || {};
    window.UI.onPhaseChange = onPhaseChange;
    window.UI.onStateChange = onStateChange;
    window.UI.onGameOver    = onGameOver;
    window.UI.appendLog     = appendLog;
    window.UI.onScout       = onScout;
    window.UI.onCardPlayed  = onCardPlayed;
    window.UI.onCardDrawn   = onCardDrawn;
    window.UI.waitForAnimation = () => _animPromise;
    window.UI.onCombatStep  = onCombatStep;
    window.UI.onCombatDamageStart = onCombatDamageStart;
    window.UI.waitForCombatAnimation = () => _combatAnimPromise;
    window.UI.waitForBlockers = waitForBlockers;
    window.UI.showSpellTargetArrow = runSpellTargetAnimation;
    window.UI.waitForSpellAnimation = () => _spellAnimPromise;
    window.UI.skipNextCardPlayAnim = (v) => { _skipNextCardPlayAnim = v; };
    window.UI.getHumanIdx = () => _humanIdx;
    window.UI.requestPriority = requestPriority;
    window.UI.requestTriggerTarget = requestTriggerTarget;
    window.UI.renderStack = renderStack;
    window.UI.onStackResolve = onStackResolve;

    switchScreen('game');

    Engine.startGame(G);
    _drawQueue = [];  // Don't animate initial draw
    fullRender(G);
  }

  /* ─────────────────────────────────────────────────────────────────
     GAME OVER / PLAY AGAIN
  ───────────────────────────────────────────────────────────────── */
  function initGameOver() {
    const btn = $('btn-play-again');
    if (btn) btn.addEventListener('click', () => {
      $('gameover-overlay').classList.add('hidden');
      hide('shop-overlay');
      _G = null;
      switchScreen('menu');
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     GLOBAL KEYBOARD
  ───────────────────────────────────────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearSelection();
      if (_passDismiss) _passDismiss();
    }
  });

  /* ─────────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────────── */
  function init() {
    // Global button click sound
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn') && window.SFX) window.SFX.play('button_click');
    });

    // SFX volume/mute controls
    const muteBtn = $('btn-sfx-mute');
    const volSlider = $('sfx-volume');
    if (muteBtn && window.SFX) {
      if (window.SFX.isMuted()) muteBtn.classList.add('muted');
      muteBtn.textContent = window.SFX.isMuted() ? '\u{1F507}' : '\u{1F509}';
      muteBtn.addEventListener('click', () => {
        const muted = window.SFX.toggleMute();
        muteBtn.classList.toggle('muted', muted);
        muteBtn.textContent = muted ? '\u{1F507}' : '\u{1F509}';
      });
    }
    if (volSlider && window.SFX) {
      volSlider.value = Math.round(window.SFX.getVolume() * 100);
      volSlider.addEventListener('input', () => {
        window.SFX.setVolume(parseInt(volSlider.value) / 100);
      });
    }

    initMenu();
    initHeroSelect();
    initDeckViewer();
    initGameOver();

    window.UI = {
      onPhaseChange,
      onStateChange,
      onGameOver,
      appendLog,
      onScout,
      onCardPlayed,
      onCardDrawn,
      waitForAnimation: () => _animPromise,
      onCombatStep,
      onCombatDamageStart,
      waitForCombatAnimation: () => _combatAnimPromise,
      waitForBlockers,
      showSpellTargetArrow: runSpellTargetAnimation,
      waitForSpellAnimation: () => _spellAnimPromise,
      skipNextCardPlayAnim: (v) => { _skipNextCardPlayAnim = v; },
      requestPriority,
      requestTriggerTarget,
      renderStack,
      onStackResolve,
      getHumanIdx: () => _humanIdx,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
