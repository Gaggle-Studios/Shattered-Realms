# SHATTERED REALMS — Game Design Document

---

## 1. Game Overview

**Genre:** 2-Player Fantasy Card Battler
**Inspiration:** Dominion (deckbuilding) × Magic: The Gathering (combat, combos, instant-speed interaction)
**Target Game Length:** 15–25 turns
**Core Fantasy:** Two rival heroes clash on a fractured battlefield, drafting powerful cards from their unique arsenals while commanding minions in tactical combat.

### Design Pillars

- **Tactical Combat** — MTG-style attacking and blocking with persistent damage, first strike, and a full priority/stack system for instant-speed interaction.
- **Meaningful Drafting** — Every turn begins with a draft pick from three unique cards that go directly to hand. No duplicates exist in the shop, so each game tells a different story based on what appears and what you choose.
- **Asymmetric Heroes** — Each hero has a completely unique card pool of 100 cards, distinct mechanics, and a different path to victory. Mirror matches play out differently each time due to the draft.

---

## 2. Win Conditions

**Primary Win Condition:** Reduce the opposing hero's health to 0 through combat damage. Only minion combat damage can hit heroes — no spells or abilities can deal direct damage to a hero.

**Alternate Win Conditions:** Some heroes possess unique alternate win conditions tied to their identity. These are clearly stated on the hero card at the start of the game.

- **The Archmage (Mage):** Accumulate 50 Insight to achieve arcane transcendence. Insight is gained by converting unspent mana at the end of the opponent's turn.

---

## 3. Resources

### Health (Hero)

- Each hero starts with 20 health.
- Hero health cannot be replenished by any means once lost.
- Damage is dealt to heroes only through unblocked minion combat damage (and effects like Trample/Piercing that deal combat damage through blockers).

### Mana

- Each player starts with 5 maximum mana.
- During the Upkeep Phase, the player's maximum mana increases by 1 and their mana pool is refilled to maximum.
- There is no mana cap — mana grows indefinitely as the game progresses.
- Mana is spent to play cards (minions, spells, enchantments) from hand.
- Unspent mana does not carry over between turns (except as Insight for the Mage).

### Health (Minion)

- Minions have a health stat that represents how much damage they can sustain.
- Damage persists on minions between turns — it does not heal automatically.
- When a minion's health reaches 0, it is destroyed and placed in its owner's discard pile.
- Minion health can be restored by healing spells, effects, and the Regenerate keyword.

### Insight (Mage Only)

- A resource unique to the Archmage hero.
- At the end of the opponent's turn, any mana the Mage has not spent (during their own turn and as instants during the opponent's turn) is converted into Insight.
- Reaching 50 Insight wins the game immediately.
- Insight is tracked publicly — both players can see the current total.

---

## 4. Card Types

### Minion

- Permanent cards that enter the battlefield when played.
- Have two primary stats: Attack (ATK) and Health (HP).
- Displayed as ATK/HP (e.g., a 3/4 minion has 3 Attack and 4 Health).
- May have keywords and/or triggered abilities.
- Minions enter the battlefield tapped (cannot attack or block until untapped during the next Upkeep) unless they have Haste.
- When destroyed, minions go to the owner's discard pile.
- There is no limit to the number of minions a player can have on the battlefield.

### Instant

- One-shot spell cards that can be played at any time you have priority, including during the opponent's turn.
- After resolving, instants go to the owner's discard pile.
- Cannot deal direct damage to heroes.

### Sorcery

- One-shot spell cards that can only be played during your own Action Phase when the stack is empty.
- After resolving, sorceries go to the owner's discard pile.
- Cannot deal direct damage to heroes.

### Enchantment

- Persistent non-minion cards that remain on the battlefield after being played.
- Provide ongoing effects, triggered abilities, or static bonuses.
- Can only be played during your own Action Phase when the stack is empty (unless they have Flash).
- Enchantments are not minions — they cannot attack, block, or be dealt combat damage.
- Enchantments can be removed by specific spells and abilities that target enchantments.

### Upgrade

- Shop-only cards — Upgrades do not appear in starter decks.
- When played, an Upgrade **permanently** modifies a target minion on the battlefield. Only Upgrade cards grant permanent stat/keyword modifications.
- Upgrades can increase a minion's ATK, HP, or the numeric value of a keyword (e.g., Regenerate 1 becomes Regenerate 2).
- After resolving, the Upgrade card goes to the owner's discard pile (the effect persists on the minion).
- Upgrades can only be played during your own Action Phase.
- Non-Upgrade cards (instants, sorceries, battlecries) that grant buffs apply them only for as long as the target minion remains on the battlefield, unless the effect text explicitly says "until end of turn."

---

## 5. Turn Structure

Each player's turn consists of four phases executed in order.

### Phase 1: Upkeep

- **Mana Growth** — The player's maximum mana increases by 1.
- **Mana Replenish** — The player's mana pool is refilled to its new maximum.
- **Untap** — All tapped minions the player controls are untapped.
- **Upkeep Triggers** — All "at the start of your upkeep" effects trigger (e.g., Regenerate, Inspire abilities). These are placed on the stack and resolved in the order the controlling player chooses.

### Phase 2: Draft

- The active player selects one card from the three face-up cards in their shop row. The selected card is **placed in the player's hand**.
- The remaining two cards are placed at the bottom of the shop deck in a random order.
- Three new cards are revealed from the top of the shop deck for the next draft.
- The player may spend **1 mana to reroll** the shop, returning the current 3 face-up cards to the shop deck, shuffling it, and revealing 3 new cards. Rerolls may be performed multiple times as long as the player has mana and the shop deck is not empty.
- See Section 8 for full shop rules.

### Phase 3: Action

The Action Phase is the main phase where the bulk of gameplay occurs. During this phase, the active player may perform the following actions in any order and any number of times (unless specified):

- Play cards from hand by paying their mana cost (minions, sorceries, enchantments, upgrades).
- Activate abilities on minions or enchantments that have activated abilities.
- **Initiate Combat** — The player may enter the Combat Step once per turn. See Section 6 for detailed combat rules.

The non-active player may play Instants whenever they have priority (see Priority System below).

After combat concludes (or if combat was not initiated), the active player may continue playing cards and activating abilities until they choose to end their turn.

### Phase 4: End Turn

- **Hand Replenish** — The player draws cards until their hand reaches its maximum capacity (5 by default). If the player already has 5 or more cards in hand, they do not draw. Hand capacity can be increased by card effects and enchantments.
- **Deck Recycling** — If the player's draw pile is empty and they need to draw, their discard pile is shuffled to form a new draw pile, then drawing continues.
- **End-of-Turn Triggers** — All "at end of turn" effects resolve.
- **Insight Conversion (Mage only)** — At the end of the opponent's turn (not the Mage's own turn), any mana the Mage has remaining is converted to Insight.

### First Turn Rules

- The player who goes first skips their Draft Phase on turn 1 (to offset the tempo advantage of going first).
- The starting player is determined randomly.

---

## 6. Combat System

### 6.1 Initiating Combat

Once per turn during the Action Phase, the active player may declare they are entering the Combat Step. No cards can be bought during combat, but instants and abilities can still be played.

### 6.2 Declare Attackers

The active player selects any number of their untapped minions to attack. Declared attackers are immediately tapped. Minions with Vigilance attack without tapping.

### 6.3 Priority Window (Post-Attackers)

After attackers are declared, both players receive priority. Either player may play instants or activate abilities. Effects resolve via the stack (see Priority System).

### 6.4 Declare Blockers

The defending player assigns their untapped minions as blockers. Each blocker is assigned to one attacking minion. Multiple blockers can be assigned to a single attacker. A minion cannot block if it is tapped.

**Blocking Restrictions:**

- Minions with **Flying** can only be blocked by minions with Flying or Reach.
- Minions with **Menace** can only be blocked by two or more minions.
- Minions with **Stealth** cannot be blocked the turn they enter the battlefield.
- Minions with **Taunt** must be blocked if the defending player has any eligible untapped minions (at least one blocker must be assigned to each Taunt minion before any other attacker can be left unblocked).

If the defending player has no untapped minions or none of the attackers can be legally blocked, the Declare Blockers step is skipped automatically.

### 6.5 Priority Window (Post-Blockers)

After blockers are declared, both players receive priority again.

### 6.6 Damage Assignment (Attacker)

For each attacking minion that is blocked by multiple minions, the attacking player assigns a damage order to the blockers. The attacker's combat damage is distributed across blockers in the chosen order — enough damage must be assigned to destroy each blocker before excess can be assigned to the next.

### 6.7 Damage Resolution

**First Strike Damage Step:**

- Minions with First Strike or Double Strike deal their combat damage first.
- If a minion is destroyed during this step, it does not deal damage in the normal step.
- After First Strike damage, priority is granted to both players.

**Normal Damage Step:**

- All remaining minions (and Double Strike minions again) deal their combat damage simultaneously.
- Blocked minions deal damage to their blockers (per the assigned damage order).
- Unblocked attacking minions deal their full ATK as damage to the defending hero.
- Blocking minions deal their ATK as damage to the attacking minion they blocked.
- **Trample:** If a blocked attacker with Trample assigns lethal damage to all its blockers, excess damage is dealt to the defending hero.
- **Piercing X:** A blocked attacker with Piercing X deals X damage to the defending hero in addition to normal combat damage to its blockers.
- **Siphon:** A minion with Siphon heals itself for the amount of combat damage it dealt.
- **Deathtouch:** Any amount of combat damage from a Deathtouch minion is considered lethal damage, regardless of the target's remaining health.

### 6.8 Post-Combat

Destroyed minions are placed in their owners' discard piles. Last Breath effects trigger. The active player returns to the Action Phase and may continue playing cards.

---

## 7. Priority System & The Stack

This game uses a priority/stack system similar to Magic: The Gathering to enable instant-speed interaction.

### Priority

- The active player (the player whose turn it is) receives priority first whenever the game state changes.
- When a player has priority, they may: play an instant, activate an ability, or pass priority.
- When both players pass priority in succession without adding anything to the stack, the top item on the stack resolves (or the game advances to the next step if the stack is empty).

### The Stack

- When a spell is cast or an ability is activated, it is placed on the stack.
- Both players may respond by adding more items to the stack.
- The stack resolves last in, first out (LIFO) — the most recently added item resolves first.
- A spell or ability on the stack can be countered or responded to before it resolves.

### Targeting

- If a spell or ability targets a minion/enchantment and that target is no longer valid when it resolves (e.g., it was destroyed or bounced), the spell fizzles (goes to the discard pile with no effect).
- Minions with Hexproof cannot be targeted by the opponent's spells or abilities.
- Minions with Ward X require the opponent to pay X additional mana when targeting them.

---

## 8. Shop & Deckbuilding

### Shop Structure

- Each hero has a unique shop deck of 90 cards (the hero's total pool is 100 cards: 10 starter + 90 shop).
- Every card in the shop deck is unique — no duplicates exist.
- At the start of the game, the shop deck is shuffled. The top 3 cards are revealed face-up as the current shop offerings.

### Drafting

- At the beginning of each turn (during the Draft Phase after Upkeep), the active player must select one of the three face-up shop cards. The selected card goes to the player's **hand**.
- The two unchosen cards are placed at the bottom of the shop deck in a random order.
- Three new cards are revealed from the top of the shop deck for the next draft.
- The first player skips their draft on turn 1.

### Reroll

- During the Draft Phase, the active player may spend **1 mana** to reroll the shop offerings.
- Rerolling returns the current 3 face-up shop cards to the shop deck, shuffles the deck, and reveals 3 new cards.
- The player may reroll multiple times as long as they have mana and the shop deck is not empty.

### Shop Manipulation

Several card effects interact with the shop:

- **Restock** — Replace one face-up shop card with the next card from the top of the shop deck. The replaced card goes to the bottom.
- **Scout X** — Look at the top X cards of your shop deck. You may rearrange them in any order.
- **Deep Dig** — Reveal an additional shop card this turn (choose from 4 instead of 3).
- **Reject** — Remove a face-up shop card from the game entirely (it is not placed at the bottom).

---

## 9. Keywords & Effects Glossary

### Evergreen Combat Keywords

| Keyword | Effect |
|---------|--------|
| **First Strike** | This minion deals combat damage before minions without First Strike. |
| **Double Strike** | This minion deals combat damage during both the First Strike step and the normal damage step. |
| **Trample** | When blocked, excess combat damage beyond what is needed to destroy all blockers is dealt to the defending hero. |
| **Vigilance** | This minion does not tap when declared as an attacker. |
| **Haste** | This minion can attack and use tap abilities the turn it enters the battlefield. |
| **Deathtouch** | Any amount of combat damage this minion deals to another minion is lethal. |
| **Flying** | This minion can only be blocked by minions with Flying or Reach. |
| **Reach** | This minion can block minions with Flying. |
| **Menace** | This minion can only be blocked by two or more minions. |

### Defensive Keywords

| Keyword | Effect |
|---------|--------|
| **Defender** | This minion cannot attack. |
| **Taunt** | This minion must be blocked if the defending player has eligible untapped minions. At least one blocker must be assigned to each Taunt minion before other attackers can go unblocked. |
| **Ward X** | Spells and abilities the opponent plays that target this minion cost X additional mana. |
| **Hexproof** | This minion cannot be targeted by the opponent's spells or abilities. |
| **Indestructible** | This minion cannot be destroyed by damage or "destroy" effects. Damage is still dealt and tracked. |
| **Shield X** | Prevents the next X damage that would be dealt to this minion. Shield is then removed. |

### Sustain & Utility Keywords

| Keyword | Effect |
|---------|--------|
| **Regenerate X** | At the start of your Upkeep, this minion heals X health (up to its maximum). |
| **Siphon** | When this minion deals combat damage, it heals itself for the amount dealt. |
| **Piercing X** | When this minion is blocked, it still deals X damage to the defending hero (in addition to normal combat damage to blockers). |
| **Stealth** | This minion cannot be blocked the turn it enters the battlefield. |
| **Flash** | This card can be played at instant speed (during either player's turn, whenever you have priority). |
| **Frenzy** | After this minion deals combat damage, it can attack again this turn. |
| **Thorns X** | Whenever this minion is dealt combat damage, it deals X damage back to the source. |

### Triggered Ability Keywords

| Keyword | Effect |
|---------|--------|
| **Battlecry** | This effect triggers when the card is played from your hand. |
| **Last Breath** | This effect triggers when this minion is destroyed. |
| **Inspire** | This effect triggers at the start of your Upkeep while this minion is on the battlefield. |
| **Surge** | This effect triggers whenever you play a spell (instant or sorcery). |
| **Rally** | This effect triggers whenever another friendly minion enters the battlefield. |

### Shop Keywords

| Keyword | Effect |
|---------|--------|
| **Restock** | Replace one face-up shop card with the next card from the top of the shop deck. |
| **Scout X** | Look at the top X cards of your shop deck. You may rearrange them in any order. |
| **Deep Dig** | Reveal one additional shop card this turn (draft from 4 choices instead of 3). |
| **Reject** | Remove one face-up shop card from the game entirely. |

### Effect Terminology

| Term | Meaning |
|------|---------|
| **Bounce** | Return a minion from the battlefield to its owner's hand. |
| **Silence** | Remove all keywords and abilities from a minion (stat modifications from Upgrades persist). |
| **Freeze** | A frozen minion does not untap during its next Upkeep. |
| **Empower X** | Give a minion +X/+X until end of turn. |
| **Fortify X** | Give a minion +0/+X. Permanent only when granted by an Upgrade card. |
| **Sharpen X** | Give a minion +X/+0. Permanent only when granted by an Upgrade card. |
| **Summon** | Create a minion token on the battlefield. Tokens are removed from the game when destroyed (they do not go to the discard pile). |
| **Sacrifice** | Destroy a friendly minion you control (triggers Last Breath). |
| **Discard** | Remove a card from a player's hand and place it in their discard pile. |
| **Exile** | Remove a card from the game entirely. It does not go to the discard pile. |
| **Transform** | Replace a minion with a different minion. The original is removed from the game. |
| **Tap** | Tap an untapped minion. A tapped minion cannot attack or block. |
| **Drain** | A minion with Drain reduces the opponent's max mana by a specified amount when it deals combat damage to the hero. The mana is lost permanently. |

---

## 10. Hero Profiles

### THE WARDEN (Warrior)

**Class Identity:** Nature, beasts, resilience, overwhelming strength
**MTG Color Analog:** Green
**Playstyle:** Deploy powerful, high-health minions that can survive multiple combats. Use Regenerate, Shield, and healing effects to keep your army alive while steadily building board presence. Late-game Warden minions are nearly impossible to remove through combat alone.

**Core Mechanics:**

- Regenerate (signature sustain keyword)
- Trample (pushing damage past blockers)
- Shield (absorbing burst damage)
- Fortify / Sharpen (stat growth via Upgrades)
- Upgrade synergies (Warden Upgrades are among the most efficient)
- High HP-to-mana-cost ratio on minions

**Strengths:** Minion durability, late-game inevitability, stat growth, favorable trades in combat.
**Weaknesses:** Slow early turns, few instants, limited removal, vulnerable to Bounce/Silence/Freeze.

**Win Condition:** Build an unstoppable board of high-stat minions that barrel through blockers with Trample or simply outlast everything through Regenerate and healing.

#### Starter Deck (10 Cards)

**Minions (5):**

| Name | Cost | ATK/HP | Keywords/Effects |
|------|------|--------|-----------------|
| Forest Hound | 2 | 2/3 | — |
| Thornback Boar | 3 | 2/4 | Thorns 1 |
| Grove Watcher | 3 | 1/5 | Defender, Regenerate 1 |
| Wildseed Sprout | 1 | 1/2 | Rally: Gain +0/+1. |
| Ironbark Elk | 4 | 3/4 | Trample |

**Spells (5):**

| Name | Type | Cost | Effect |
|------|------|------|--------|
| Nature's Mend | Sorcery | 2 | Heal a friendly minion for 3 HP. |
| Bark Skin | Instant | 1 | Give a friendly minion +0/+3 until end of turn. |
| Overgrowth | Sorcery | 2 | Give a friendly minion +1/+1. |
| Wild Instinct | Instant | 2 | Target friendly minion gains Trample until end of turn. If it already has Trample, it also gains +2/+0 until end of turn. |
| Primal Roar | Sorcery | 3 | All friendly minions gain +1/+0 until end of turn. |

---

### THE SHADOW (Rogue)

**Class Identity:** Thieves, assassins, goblins, shadows, swarm tactics
**MTG Color Analog:** Red (aggro/goblins) with Black (sacrifice/death triggers)
**Playstyle:** Flood the board with cheap, aggressive minions. Use Haste, Stealth, and Deathtouch to keep pressure on the opponent's life total. Sacrifice mechanics turn dying minions into card advantage and burst power. The Shadow wants to end the game before the opponent can stabilize.

**Core Mechanics:**

- Haste (immediate pressure)
- Stealth (unblockable the turn played)
- Deathtouch (trading up)
- Last Breath (death value)
- Sacrifice effects (fuel for combos)
- Summon tokens (expendable bodies)
- Menace (hard to block efficiently)

**Strengths:** Speed, early-game pressure, efficient damage, swarm tactics, punishes slow starts.
**Weaknesses:** Minions are fragile, struggles against wide boards of big minions, runs out of steam if game goes long, weak to Taunt and area effects.

**Win Condition:** Rush the opponent down with relentless waves of cheap attackers. If the first wave dies, their Last Breath effects fuel the next one.

#### Starter Deck (10 Cards)

**Minions (5):**

| Name | Cost | ATK/HP | Keywords/Effects |
|------|------|--------|-----------------|
| Alley Cutpurse | 1 | 2/1 | Haste |
| Gutter Rat | 1 | 1/1 | Last Breath: Summon a 1/1 Rat token. |
| Goblin Skulker | 2 | 2/2 | Stealth |
| Shadow Fang | 2 | 1/2 | Deathtouch |
| Sewer Pack Leader | 3 | 2/3 | Rally: Give the new minion +1/+0 until end of turn. |

**Spells (5):**

| Name | Type | Cost | Effect |
|------|------|------|--------|
| Shiv | Instant | 1 | Deal 2 damage to target minion. |
| Backstab | Instant | 0 | Deal 3 damage to a tapped minion. |
| From the Shadows | Sorcery | 2 | Summon two 1/1 Goblin tokens with Haste. |
| Cheap Shot | Instant | 2 | Deal 1 damage to target minion. Draw a card. |
| Blood Pact | Sorcery | 2 | Sacrifice a friendly minion. Draw 2 cards. |

---

### THE ARCHMAGE (Mage)

**Class Identity:** Wizards, arcane mastery, foresight, control
**MTG Color Analog:** Blue
**Playstyle:** Control the pace of the game through counterspells, bounce effects, and freeze. The Archmage's minions are utility-focused — they generate card advantage and enable the Insight win condition. Rather than winning through brute force, the Archmage denies the opponent's strategy while accumulating Insight from unspent mana.

**Core Mechanics:**

- Counter spells (denying opponent's cards)
- Bounce (removing threats temporarily)
- Freeze (denying untap for a turn)
- Ward / Hexproof (protecting key minions)
- Surge (spell-cast triggers)
- Insight generation (alternate win condition)
- Card draw and hand advantage
- Shop manipulation (Scout, Restock, Deep Dig)

**Strengths:** Disruption, card advantage, alternate win condition, strong instant-speed interaction, excellent shop manipulation.
**Weaknesses:** Low minion stats, poor combat trades, struggles when behind on board, must carefully balance mana between interaction and Insight generation.

**Win Condition (Primary — Alternate):** Accumulate 50 Insight by conserving mana and controlling the board. Can also win through combat with evasive Flying minions if the opponent overcommits to stopping Insight.
**Win Condition (Secondary):** Chip away with evasive minions while maintaining board control.

#### Starter Deck (10 Cards)

**Minions (5):**

| Name | Cost | ATK/HP | Keywords/Effects |
|------|------|--------|-----------------|
| Arcane Familiar | 2 | 1/3 | Surge: Gain +1/+0 until end of turn. |
| Cloudwisp | 1 | 1/1 | Flying. Battlecry: Scout 1. |
| Rune Scholar | 3 | 1/4 | Ward 1. Inspire: Gain 1 Insight. |
| Spellweaver Initiate | 2 | 2/2 | Surge: Draw a card (once per turn). |
| Frost Sentinel | 3 | 0/5 | Defender. Battlecry: Freeze target enemy minion. |

**Spells (5):**

| Name | Type | Cost | Effect |
|------|------|------|--------|
| Counterspell | Instant | 2 | Counter target spell. |
| Arcane Recoil | Instant | 2 | Return target minion to its owner's hand. |
| Frostbolt | Instant | 1 | Deal 2 damage to target minion and Freeze it. |
| Arcane Intellect | Sorcery | 3 | Draw 2 cards. |
| Mana Surge | Instant | 1 | Gain 2 mana this turn. (Net +1 mana.) |

---

## 11. Token Reference

Tokens are created by card effects. They exist on the battlefield but are removed from the game when destroyed (they do not go to the discard pile or deck).

| Token Name | ATK/HP | Keywords | Created By |
|------------|--------|----------|------------|
| Rat | 1/1 | — | Gutter Rat (Shadow) |
| Goblin | 1/1 | Haste | From the Shadows (Shadow) |

(Additional tokens are defined in each hero's card catalog.)

---

## 12. Game Setup

1. Each player selects a hero.
2. Each player shuffles their 10-card starter deck and their 90-card shop deck separately.
3. Determine first player randomly.
4. Both players draw 5 cards from their starter deck.
5. Both players reveal the top 3 cards of their shop deck as their initial shop offerings.
6. The first player begins their turn (skipping the Draft Phase on turn 1).
7. Both players start with 5 maximum mana, 0 Insight (Mage only), and 20 hero health.

---

## 13. Design Notes & Balance Considerations

### Mana Curve Progression

| Turn | Max Mana | Cumulative Mana Spent (Approx.) |
|------|----------|--------------------------------|
| 1 | 5 | 5 |
| 5 | 9 | 35 |
| 10 | 14 | 95 |
| 15 | 19 | 180 |
| 20 | 24 | 290 |

This curve means:

- **Turns 1–5:** Players establish early board presence with 1–4 cost cards. Starter decks are the primary tools.
- **Turns 6–12:** Mid-game power spike. Drafted cards begin appearing in hand. Players can deploy 5–8 cost threats.
- **Turns 13–20:** Late game. Mana is abundant. Multiple large threats per turn. Games should be approaching conclusion.
- **Turn 20+:** Extreme late game. Mana exceeds 24. Almost any combination of cards can be played in a single turn.

### Card Cost Distribution Target (per 100-card hero deck)

| Mana Cost | Number of Cards | Role |
|-----------|----------------|------|
| 0–1 | 12–16 | Cheap tricks, tokens, cantrips |
| 2–3 | 25–30 | Core early game, removal, efficient minions |
| 4–5 | 20–25 | Strong mid-game minions and impactful spells |
| 6–7 | 12–16 | Powerful threats, board-defining effects |
| 8–10 | 8–10 | Finishers, game-ending effects |
| 11+ | 2–4 | Legendary-tier, ultimate cards |

### Insight Balance (Mage)

With mana growing each turn and the Mage needing to spend some on interaction:

- If the Mage saves ~30% of their mana each turn, they reach 50 Insight around turn 18–22.
- If the Mage saves ~50% (minimal interaction), they reach 50 Insight around turn 13–16.
- If the Mage is forced to spend heavily (under heavy aggro), Insight accumulates slowly, pushing toward 25+ turns or forcing a combat win.

This creates a natural tension: the Mage wants to save mana for Insight but must spend it to survive. Aggressive heroes can "tax" the Mage's Insight by forcing spell usage.

### The Draft Economy

With 90 unique shop cards and one drafted per turn:

- In a 20-turn game, a player drafts ~19 cards (first player skips turn 1 draft).
- They see 57 of the 90 shop cards (63%).
- Their final deck size is ~29 cards (10 starter + 19 drafted).
- Since drafted cards go directly to hand, they are immediately available for play. This makes draft choices have an instant impact on the current turn's options.
- With a 5-card hand and drawing to 5 each turn, players cycle through their deck roughly twice in a 20-turn game.
- The reroll mechanic (1 mana per reroll) allows players to fish for specific answers or synergies at the cost of tempo.

### Hero Matchup Philosophy

| Matchup | Dynamic |
|---------|---------|
| **Warden vs Shadow** | Classic "big vs wide" — The Warden's large minions trade well but the Shadow's speed can end the game before they come online. The Shadow must close out early; the Warden stabilizes and dominates late. |
| **Warden vs Archmage** | The Warden's minions are hard to remove but the Archmage's bounce and freeze effects buy time. The Warden pressures the Archmage's health to force mana expenditure and slow Insight. The Archmage must find the balance between survival and winning via Insight. |
| **Shadow vs Archmage** | The Shadow's speed directly taxes the Archmage's mana, slowing Insight. But the Archmage's counterspells and freeze effects can blunt the Shadow's aggression. If the Shadow can't close out fast, the Archmage pulls ahead on card advantage and Insight. |

---

## 14. Comprehensive Rules Clarifications

### Damage Rules

- Only combat damage can hit heroes. No spell, ability, triggered effect, or enchantment can deal direct damage to a hero.
- Spells and abilities CAN deal damage to minions.
- Trample damage that carries over to a hero IS combat damage and therefore hits the hero.
- Piercing damage IS combat damage and therefore hits the hero.

### Deck & Discard Rules

- When a player needs to draw and their deck is empty, their discard pile is immediately shuffled to become their new deck, then drawing continues.
- If both the deck and discard pile are empty, the player simply cannot draw. Running out of cards does not cause a loss.
- Tokens that are destroyed are removed from the game — they never enter the discard pile.

### Enchantment Rules

- Enchantments cannot be targeted by effects that say "target minion."
- Enchantments can be targeted by effects that say "target card" or "target enchantment" or "target non-minion permanent."
- Enchantments persist until removed by a specific effect or until the game ends.

### Upgrade Rules

- An Upgrade targets a specific minion on the battlefield when played.
- The stat or keyword modification is permanent and persists even if the Upgrade card goes to the discard pile.
- If a minion is bounced to hand after being Upgraded, it retains the Upgrade when replayed.
- If a minion is Silenced, stat modifications from Upgrades persist but keyword modifications from Upgrades are removed.
- Multiple Upgrades can be applied to the same minion.
- Only Upgrade cards grant permanent modifications. Buffs from non-Upgrade cards (spells, battlecries, abilities) last only while the minion remains on the battlefield, unless the effect text explicitly says "until end of turn."

### Tapping & Untapping

- Minions enter the battlefield tapped (unless they have Haste).
- Minions untap during their controller's Upkeep Phase.
- Frozen minions do not untap during their next Upkeep. The Freeze effect then wears off.
- Tapped minions cannot attack or block but can still be targeted by spells and abilities.
- Vigilance prevents tapping from attacking. The minion can still be tapped by other effects.

### Priority During Combat

1. Attackers declared → Priority window.
2. Blockers declared → Priority window.
3. First Strike damage dealt → Priority window.
4. Normal damage dealt → Last Breath effects trigger → Priority window.
5. Combat ends → Return to Action Phase.
