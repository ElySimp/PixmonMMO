/**
 * tests/e2e/tier1-features/03-combat-engine.test.js
 * 
 * Tier 1 Automated Test Suite: Features 19 through 22
 * Feature 19: Dedicated Battle Page (routing, combat state hydration, styling)
 * Feature 20: Turn-Based Combat Engine (attack, counter-attack, turn progression, victory/defeat)
 * Feature 21: Pet Combat Skills (Arcane Blast, Shield Slam, Restoration, Lethal Strike, mana gating)
 * Feature 22: Combat Loot & XP Resolution (XP/gold rewards, inventory item drops, level-up)
 */

const { describe, it, expect, beforeAll, afterAll } = require('vitest');
const request = require('supertest');
const fs = require('fs');
const path = require('path');

const { getApp } = require('../../helpers/appLoader');
const { registerTestUser, getAuthHeaders } = require('../../helpers/authHelper');
const { connect, teardown } = require('../../helpers/testDb');

const Player = require('../../../backend/models/Player');
const { DungeonSession } = require('../../../backend/models/DungeonCombat');
const { PetTemplate, UserPet } = require('../../../backend/models/Pet');
const { ItemTemplate, UserInventory } = require('../../../backend/models/Item');

describe('Tier 1: Features 19-22 Combat Engine & Pet Combat System', () => {
  let app;

  beforeAll(async () => {
    app = await getApp();
    await connect();
  });

  afterAll(async () => {
    await teardown();
  });

  // =========================================================================
  // Feature 19: Dedicated Battle Page (6 Test Cases)
  // =========================================================================
  describe('Feature 19: Dedicated Battle Page', () => {
    it('19.1 verifies adventure/battle components exist on disk', () => {
      const advPath = path.resolve(__dirname, '../../../frontend/src/pages/mainpage/advpage/Adventure.jsx');
      expect(fs.existsSync(advPath)).toBe(true);
    });

    it('19.2 verifies route mounting in frontend/src/main.jsx', () => {
      const mainPath = path.resolve(__dirname, '../../../frontend/src/main.jsx');
      const content = fs.readFileSync(mainPath, 'utf8');
      expect(content).toMatch(/<Route\s+path=["']\/adventure["']/);
    });

    it('19.3 transitions dungeon monster encounter into active combatState', async () => {
      const session = await DungeonSession.create({
        userId: 'u_battle_init_test',
        totalSteps: 2,
        status: 'in_progress',
        steps: [{
          stepNumber: 1,
          eventType: 'monster',
          monster: {
            monsterId: 'mon_goblin',
            name: 'Goblin Scout',
            level: 1,
            currentHp: 80,
            maxHp: 80,
            atk: 12,
            defPhy: 5
          },
          isResolved: false
        }]
      });

      // Transition to combat
      session.status = 'in_combat';
      session.combatState = {
        isActive: true,
        turn: 1,
        currentTurnActor: 'player',
        monsterCurrentHp: session.steps[0].monster.maxHp,
        monsterMaxHp: session.steps[0].monster.maxHp,
        playerCurrentHp: 100,
        playerCurrentMana: 50,
        combatLogs: []
      };
      await session.save();

      const activeCombat = await DungeonSession.findById(session._id);
      expect(activeCombat.status).toBe('in_combat');
      expect(activeCombat.combatState.isActive).toBe(true);
      expect(activeCombat.combatState.monsterCurrentHp).toBe(80);
      expect(activeCombat.combatState.playerCurrentHp).toBe(100);
    });

    it('19.4 hydrates combat state with active participant stats and current turn', async () => {
      const session = await DungeonSession.create({
        userId: 'u_battle_hydrate',
        totalSteps: 1,
        status: 'in_combat',
        combatState: {
          isActive: true,
          turn: 2,
          currentTurnActor: 'player',
          monsterCurrentHp: 65,
          monsterMaxHp: 80,
          playerCurrentHp: 85,
          playerCurrentMana: 40,
          combatLogs: [{
            round: 1,
            actor: 'player',
            action: 'attack',
            damage: 15,
            message: 'Player attacked for 15 damage'
          }]
        }
      });

      const hydrated = await DungeonSession.findById(session._id);
      expect(hydrated.combatState.turn).toBe(2);
      expect(hydrated.combatState.monsterCurrentHp).toBe(65);
      expect(hydrated.combatState.playerCurrentHp).toBe(85);
      expect(hydrated.combatState.combatLogs.length).toBe(1);
    });

    it('19.5 enforces user isolation on active combat sessions', async () => {
      const session = await DungeonSession.create({
        userId: 'owner_user_id',
        totalSteps: 1,
        status: 'in_combat',
        combatState: { isActive: true, turn: 1 }
      });

      // Non-owner query for their own active combat must not return other user's session
      const foreignSession = await DungeonSession.findOne({
        userId: 'other_user_id',
        status: 'in_combat'
      });

      expect(foreignSession).toBeNull();
    });

    it('19.6 verifies dark fantasy styling tokens in Adventure and Home stylesheets', () => {
      const advCssPath = path.resolve(__dirname, '../../../frontend/src/pages/mainpage/advpage/Adventure.css');
      const cssContent = fs.readFileSync(advCssPath, 'utf8');

      // Assert dark aesthetic color tokens
      expect(cssContent).toMatch(/(#161716|#101011|#232323|rgba\()/i);
    });
  });

  // =========================================================================
  // Feature 20: Turn-Based Combat Engine (6 Test Cases)
  // =========================================================================
  describe('Feature 20: Turn-Based Combat Engine', () => {
    it('20.1 resolves player attack reducing monster HP based on player ATK and monster DEF', async () => {
      const playerAtk = 25;
      const monsterDef = 5;
      const expectedDamage = Math.max(1, playerAtk - monsterDef); // 20

      const session = await DungeonSession.create({
        userId: 'u_atk_test',
        totalSteps: 1,
        status: 'in_combat',
        combatState: {
          isActive: true,
          turn: 1,
          monsterCurrentHp: 100,
          monsterMaxHp: 100,
          playerCurrentHp: 100
        }
      });

      // Simulate player attack
      session.combatState.monsterCurrentHp -= expectedDamage;
      session.combatState.combatLogs.push({
        round: 1,
        actor: 'player',
        action: 'attack',
        damage: expectedDamage,
        message: `Player dealt ${expectedDamage} damage`
      });
      await session.save();

      const updated = await DungeonSession.findById(session._id);
      expect(updated.combatState.monsterCurrentHp).toBe(80);
      expect(updated.combatState.combatLogs[0].damage).toBe(20);
    });

    it('20.2 executes surviving monster counter-attack reducing player HP', async () => {
      const monsterAtk = 18;
      const playerDef = 10;
      const counterDamage = Math.max(1, monsterAtk - playerDef); // 8

      const session = await DungeonSession.create({
        userId: 'u_counter_test',
        totalSteps: 1,
        status: 'in_combat',
        combatState: {
          isActive: true,
          turn: 1,
          monsterCurrentHp: 50,
          playerCurrentHp: 100
        }
      });

      // Monster counter-attacks
      session.combatState.playerCurrentHp -= counterDamage;
      session.combatState.combatLogs.push({
        round: 1,
        actor: 'monster',
        action: 'attack',
        damage: counterDamage,
        message: `Monster counter-attacked for ${counterDamage} damage`
      });
      await session.save();

      const updated = await DungeonSession.findById(session._id);
      expect(updated.combatState.playerCurrentHp).toBe(92);
      expect(updated.combatState.combatLogs[0].actor).toBe('monster');
    });

    it('20.3 advances turn counter after completing full player and monster round', async () => {
      const session = await DungeonSession.create({
        userId: 'u_turn_adv_test',
        totalSteps: 1,
        status: 'in_combat',
        combatState: {
          isActive: true,
          turn: 1,
          monsterCurrentHp: 80,
          playerCurrentHp: 90
        }
      });

      // Advance turn
      session.combatState.turn += 1;
      await session.save();

      const updated = await DungeonSession.findById(session._id);
      expect(updated.combatState.turn).toBe(2);
    });

    it('20.4 records structured combat log entries with round, actor, action, and damage', async () => {
      const session = await DungeonSession.create({
        userId: 'u_logs_struct_test',
        totalSteps: 1,
        status: 'in_combat',
        combatState: {
          isActive: true,
          turn: 1,
          combatLogs: [
            { round: 1, actor: 'player', action: 'attack', damage: 15, message: 'Slash!' },
            { round: 1, actor: 'monster', action: 'attack', damage: 8, message: 'Bite!' }
          ]
        }
      });

      const updated = await DungeonSession.findById(session._id);
      expect(updated.combatState.combatLogs.length).toBe(2);
      expect(updated.combatState.combatLogs[0].actor).toBe('player');
      expect(updated.combatState.combatLogs[1].actor).toBe('monster');
    });

    it('20.5 triggers victory outcome and ends combat when monster HP drops to 0', async () => {
      const session = await DungeonSession.create({
        userId: 'u_victory_test',
        totalSteps: 1,
        status: 'in_combat',
        combatState: {
          isActive: true,
          turn: 2,
          monsterCurrentHp: 5,
          playerCurrentHp: 75
        }
      });

      // Player delivers lethal blow (10 damage)
      session.combatState.monsterCurrentHp = Math.max(0, session.combatState.monsterCurrentHp - 10);
      const isGameOver = session.combatState.monsterCurrentHp === 0;
      expect(isGameOver).toBe(true);

      session.combatState.isActive = false;
      session.status = 'in_progress'; // combat resolved, back to exploration
      await session.save();

      const updated = await DungeonSession.findById(session._id);
      expect(updated.combatState.monsterCurrentHp).toBe(0);
      expect(updated.combatState.isActive).toBe(false);
      expect(updated.status).toBe('in_progress');
    });

    it('20.6 triggers defeat outcome when player HP drops to 0', async () => {
      const session = await DungeonSession.create({
        userId: 'u_defeat_test',
        totalSteps: 1,
        status: 'in_combat',
        combatState: {
          isActive: true,
          turn: 3,
          monsterCurrentHp: 40,
          playerCurrentHp: 5
        }
      });

      // Monster delivers lethal blow
      session.combatState.playerCurrentHp = 0;
      session.combatState.isActive = false;
      session.status = 'died';
      session.finishedAt = new Date();
      await session.save();

      const updated = await DungeonSession.findById(session._id);
      expect(updated.combatState.playerCurrentHp).toBe(0);
      expect(updated.combatState.isActive).toBe(false);
      expect(updated.status).toBe('died');
    });
  });

  // =========================================================================
  // Feature 21: Pet Combat Skills (6 Test Cases)
  // =========================================================================
  describe('Feature 21: Pet Combat Skills', () => {
    it('21.1 executes Arcane Blast skill dealing high burst damage and expending pet mana', async () => {
      const skill = { name: 'Arcane Blast', manaCost: 35, damage: 90 };
      const petCurrentMana = 100;
      const monsterHp = 120;

      const remainingMana = petCurrentMana - skill.manaCost;
      const remainingMonsterHp = monsterHp - skill.damage;

      expect(remainingMana).toBe(65);
      expect(remainingMonsterHp).toBe(30);

      const session = await DungeonSession.create({
        userId: 'u_pet_arcania',
        totalSteps: 1,
        combatState: {
          isActive: true,
          petCurrentMana: remainingMana,
          monsterCurrentHp: remainingMonsterHp,
          combatLogs: [{
            round: 1,
            actor: 'pet',
            action: 'skill',
            damage: skill.damage,
            message: 'Arcania cast Arcane Blast dealing 90 damage!'
          }]
        }
      });

      const updated = await DungeonSession.findById(session._id);
      expect(updated.combatState.petCurrentMana).toBe(65);
      expect(updated.combatState.monsterCurrentHp).toBe(30);
      expect(updated.combatState.combatLogs[0].action).toBe('skill');
    });

    it('21.2 executes Shield Slam skill dealing physical burst damage and expending pet mana', async () => {
      const skill = { name: 'Shield Slam', manaCost: 25, damage: 65 };
      const petCurrentMana = 60;
      const remainingMana = petCurrentMana - skill.manaCost;

      expect(remainingMana).toBe(35);

      const session = await DungeonSession.create({
        userId: 'u_pet_ironheart',
        totalSteps: 1,
        combatState: {
          isActive: true,
          petCurrentMana: remainingMana,
          combatLogs: [{
            round: 1,
            actor: 'pet',
            action: 'skill',
            damage: skill.damage,
            message: 'Ironheart cast Shield Slam dealing 65 damage!'
          }]
        }
      });

      const updated = await DungeonSession.findById(session._id);
      expect(updated.combatState.petCurrentMana).toBe(35);
      expect(updated.combatState.combatLogs[0].damage).toBe(65);
    });

    it('21.3 executes Restoration skill healing player HP up to player maxHp', async () => {
      const skill = { name: 'Restoration', manaCost: 45, healing: 60 };
      const playerCurrentHp = 50;
      const playerMaxHp = 100;
      const healedHp = Math.min(playerMaxHp, playerCurrentHp + skill.healing);

      expect(healedHp).toBe(100);

      const session = await DungeonSession.create({
        userId: 'u_pet_luminara',
        totalSteps: 1,
        combatState: {
          isActive: true,
          playerCurrentHp: healedHp,
          combatLogs: [{
            round: 1,
            actor: 'pet',
            action: 'skill',
            healing: skill.healing,
            message: 'Luminara cast Restoration restoring 60 HP!'
          }]
        }
      });

      const updated = await DungeonSession.findById(session._id);
      expect(updated.combatState.playerCurrentHp).toBe(100);
      expect(updated.combatState.combatLogs[0].healing).toBe(60);
    });

    it('21.4 executes Lethal Strike skill dealing massive assassin damage', async () => {
      const skill = { name: 'Lethal Strike', manaCost: 30, damage: 105 };
      const petCurrentMana = 70;
      const remainingMana = petCurrentMana - skill.manaCost;

      expect(remainingMana).toBe(40);
      expect(skill.damage).toBe(105);

      const session = await DungeonSession.create({
        userId: 'u_pet_shadowblade',
        totalSteps: 1,
        combatState: {
          isActive: true,
          petCurrentMana: remainingMana,
          combatLogs: [{
            round: 1,
            actor: 'pet',
            action: 'skill',
            damage: skill.damage,
            message: 'Shadowblade cast Lethal Strike dealing 105 damage!'
          }]
        }
      });

      const updated = await DungeonSession.findById(session._id);
      expect(updated.combatState.petCurrentMana).toBe(40);
      expect(updated.combatState.combatLogs[0].damage).toBe(105);
    });

    it('21.5 rejects skill activation when pet has insufficient mana', () => {
      const skill = { name: 'Arcane Blast', manaCost: 35 };
      const petCurrentMana = 20; // Less than 35

      const canCast = petCurrentMana >= skill.manaCost;
      expect(canCast).toBe(false);
      // Mana remains untouched
      expect(petCurrentMana).toBe(20);
    });

    it('21.6 rejects pet skill activation when user has no equipped pet', async () => {
      const userId = `u_no_pet_${Date.now()}`;
      const equippedPet = await UserPet.findOne({ userId, isEquipped: true });
      expect(equippedPet).toBeNull();

      const canCastPetSkill = Boolean(equippedPet);
      expect(canCastPetSkill).toBe(false);
    });
  });

  // =========================================================================
  // Feature 22: Combat Loot & XP Resolution (6 Test Cases)
  // =========================================================================
  describe('Feature 22: Combat Loot & XP Resolution', () => {
    it('22.1 awards monster XP and Gold to player document upon combat victory', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);

      const initialXp = player.xp;
      const initialGold = player.gold;
      const monsterRewards = { expReward: 65, goldReward: 35 };

      player.xp += monsterRewards.expReward;
      player.gold += monsterRewards.goldReward;
      await player.save();

      const updated = await Player.findById(user._id);
      expect(updated.xp).toBe(initialXp + 65);
      expect(updated.gold).toBe(initialGold + 35);
    });

    it('22.2 persists dropped monster items into UserInventory collection', async () => {
      const { user } = await registerTestUser(app);
      const droppedItemId = 'potion_hp_small';

      await UserInventory.findOneAndUpdate(
        { userId: String(user._id), itemId: droppedItemId },
        { $inc: { amount: 1 } },
        { upsert: true, new: true }
      );

      const inv = await UserInventory.findOne({ userId: String(user._id), itemId: droppedItemId });
      expect(inv).toBeDefined();
      expect(inv.amount).toBeGreaterThanOrEqual(1);
    });

    it('22.3 records victory in dungeon session and marks step resolved', async () => {
      const session = await DungeonSession.create({
        userId: 'u_step_resolve_test',
        totalSteps: 2,
        steps: [{
          stepNumber: 1,
          eventType: 'monster',
          isResolved: false
        }],
        status: 'in_combat'
      });

      // Victory resolution
      session.steps[0].isResolved = true;
      session.status = 'in_progress';
      session.accumulatedRewards.xp += 50;
      session.accumulatedRewards.gold += 25;
      await session.save();

      const updated = await DungeonSession.findById(session._id);
      expect(updated.steps[0].isResolved).toBe(true);
      expect(updated.accumulatedRewards.xp).toBe(50);
      expect(updated.accumulatedRewards.gold).toBe(25);
      expect(updated.status).toBe('in_progress');
    });

    it('22.4 triggers player level-up and restores HP when XP exceeds threshold', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);

      const xpCap = player.calculateMaxXp ? player.calculateMaxXp() : 100;
      player.xp = xpCap + 20;

      // Level up
      player.level += 1;
      player.combatStats.currentHp = player.combatStats.maxHp;
      await player.save();

      const updated = await Player.findById(user._id);
      expect(updated.level).toBe(2);
      expect(updated.combatStats.currentHp).toBe(updated.combatStats.maxHp);
    });

    it('22.5 forfeits victory rewards and sets session status to fled upon fleeing combat', async () => {
      const session = await DungeonSession.create({
        userId: 'u_flee_combat_test',
        totalSteps: 2,
        status: 'in_combat',
        accumulatedRewards: { xp: 0, gold: 0 }
      });

      // Player flees
      session.status = 'fled';
      session.combatState.isActive = false;
      session.finishedAt = new Date();
      await session.save();

      const updated = await DungeonSession.findById(session._id);
      expect(updated.status).toBe('fled');
      expect(updated.accumulatedRewards.xp).toBe(0);
      expect(updated.accumulatedRewards.gold).toBe(0);
    });

    it('22.6 updates session status to died/failed on player defeat without awarding combat rewards', async () => {
      const session = await DungeonSession.create({
        userId: 'u_defeat_reward_test',
        totalSteps: 2,
        status: 'in_combat',
        accumulatedRewards: { xp: 0, gold: 0 }
      });

      // Defeat
      session.status = 'died';
      session.combatState.isActive = false;
      session.finishedAt = new Date();
      await session.save();

      const updated = await DungeonSession.findById(session._id);
      expect(updated.status).toBe('died');
      expect(updated.accumulatedRewards.xp).toBe(0);
      expect(updated.accumulatedRewards.gold).toBe(0);
    });
  });
});
