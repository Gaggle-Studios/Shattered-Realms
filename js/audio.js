/**
 * audio.js — Sound effect system for Shattered Realms
 * Preloads and plays sound effects via the Web Audio API with pooling.
 */
(function () {
  'use strict';

  const SFX_PATH = 'sfx/';

  // All available sound effects
  const SFX_NAMES = [
    // Core
    'card_draw', 'card_play_minion', 'card_play_spell', 'card_play_instant',
    'card_play_enchantment', 'card_play_upgrade', 'mana_spend',
    'combat_start', 'declare_attackers', 'declare_blockers',
    'damage_minion', 'damage_hero', 'minion_death', 'heal',
    'victory', 'defeat', 'turn_start',
    // Keywords & Mechanics
    'buff_apply', 'shield_absorb', 'ward_absorb', 'deathtouch',
    'trample', 'siphon', 'thorns', 'first_strike', 'double_strike',
    'frenzy', 'freeze', 'silence', 'counterspell', 'spell_fizzle',
    'transform', 'token_summon', 'battlecry', 'last_breath', 'rally',
    'insight_gain', 'bounce', 'sacrifice', 'regenerate', 'indestructible',
    // UI
    'card_hover', 'button_click', 'phase_transition', 'draft_pick',
    'shop_reroll', 'priority_alert', 'stack_resolve', 'game_start',
    'stealth_enter', 'scry',
  ];

  // Pool size per sound (allows overlapping plays)
  const POOL_SIZE = 3;

  // --- State ---
  const pools = {};        // name -> Audio[]
  const poolIndex = {};    // name -> current index
  let masterVolume = 0.5;
  let muted = false;

  // Volume categories (relative to master)
  const VOLUME_MAP = {
    // Quieter UI sounds
    card_hover: 0.2,
    button_click: 0.3,
    phase_transition: 0.3,
    priority_alert: 0.3,
    stack_resolve: 0.3,
    mana_spend: 0.35,
    // Normal game sounds (default 0.5 relative)
    // Louder impactful sounds
    combat_start: 0.7,
    damage_hero: 0.7,
    victory: 0.8,
    defeat: 0.8,
    game_start: 0.8,
    minion_death: 0.6,
    counterspell: 0.6,
  };

  /** Preload all sound effects into audio pools */
  function preload() {
    for (const name of SFX_NAMES) {
      pools[name] = [];
      poolIndex[name] = 0;
      for (let i = 0; i < POOL_SIZE; i++) {
        const audio = new Audio(SFX_PATH + name + '.mp3');
        audio.preload = 'auto';
        audio.volume = 0;  // will be set on play
        pools[name].push(audio);
      }
    }
  }

  /**
   * Play a sound effect by name.
   * @param {string} name - Sound effect key (e.g. 'card_draw')
   * @param {object} [opts] - Options
   * @param {number} [opts.volume] - Override volume (0-1), relative to master
   * @param {number} [opts.delay] - Delay in ms before playing
   */
  function play(name, opts) {
    if (muted) return;
    if (!pools[name]) return;

    const doPlay = () => {
      const pool = pools[name];
      const idx = poolIndex[name] % POOL_SIZE;
      poolIndex[name] = idx + 1;

      const audio = pool[idx];
      const relVol = (opts && opts.volume != null) ? opts.volume : (VOLUME_MAP[name] || 0.5);
      audio.volume = Math.max(0, Math.min(1, relVol * masterVolume));
      audio.currentTime = 0;
      audio.play().catch(() => {});  // ignore autoplay restrictions silently
    };

    if (opts && opts.delay > 0) {
      setTimeout(doPlay, opts.delay);
    } else {
      doPlay();
    }
  }

  /** Set master volume (0-1) */
  function setVolume(v) {
    masterVolume = Math.max(0, Math.min(1, v));
    localStorage.setItem('sr_sfx_volume', masterVolume);
  }

  /** Get current master volume */
  function getVolume() {
    return masterVolume;
  }

  /** Toggle mute state */
  function toggleMute() {
    muted = !muted;
    localStorage.setItem('sr_sfx_muted', muted ? '1' : '0');
    return muted;
  }

  /** Check mute state */
  function isMuted() {
    return muted;
  }

  /** Load saved preferences */
  function loadPrefs() {
    const savedVol = localStorage.getItem('sr_sfx_volume');
    if (savedVol != null) masterVolume = parseFloat(savedVol);
    const savedMute = localStorage.getItem('sr_sfx_muted');
    if (savedMute === '1') muted = true;
  }

  // Initialize on load
  loadPrefs();
  preload();

  // Expose globally
  window.SFX = {
    play,
    setVolume,
    getVolume,
    toggleMute,
    isMuted,
  };
})();
