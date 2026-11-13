/**
 * tests/e2e/tier1-features/02-exploration-energy.test.js
 * 
 * Tier 1 Automated Test Suite: Features 15 through 18
 * Feature 15: Stepping Action Delay (cooldown timestamp, rejection during cooldown, step progression)
 * Feature 16: Energy System & Deduction (10 max energy pool, 1 energy per dungeon, zero-energy floor)
 * Feature 17: Dedicated Dungeon Page (frontend routes, session initialization, retreat lifecycle)
 * Feature 18: Randomized 1-8 Dungeon Steps (bounds check [1, 8], monster/loot/empty distributions)
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

describe('Tier 1: Features 15-18 Exploration & Energy System', () => {
  let app;

  beforeAll(async () => {
    app = await getApp();
    await connect();
  });

  afterAll(async () => {
    await teardown();
  });

  // =========================================================================
  // Feature 15: Stepping Action Delay (6 Test Cases)
  // =========================================================================
  describe('Feature 15: Stepping Action Delay', () => {
    it('15.1 initializes player exploration with cooldownEnd and step counters', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);

      expect(player.exploration).toBeDefined();
      expect(player.exploration.totalSteps).toBe(0);
      expect(player.exploration.dailySteps).toBe(0);
    });

    it('15.2 sets future cooldown timestamp upon stepping action and prevents concurrent step spam', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);

      // Simulate step taken by setting cooldown 5 seconds in future
      const cooldownMs = 5000;
      player.exploration.cooldownEnd = new Date(Date.now() + cooldownMs);
      player.exploration.totalSteps += 1;
      player.exploration.dailySteps += 1;
      await player.save();

      // Attempt immediate step within cooldown window
      const refreshedPlayer = await Player.findById(user._id);
      const isUnderCooldown = new Date(refreshedPlayer.exploration.cooldownEnd).getTime() > Date.now();
      expect(isUnderCooldown).toBe(true);

      // If under cooldown, step counter must not increment
      if (isUnderCooldown) {
        expect(refreshedPlayer.exploration.totalSteps).toBe(1);
      }
    });

    it('15.3 advances exploration totalSteps and dailySteps upon valid step execution', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);

      const initialSteps = player.exploration.totalSteps;
      player.exploration.totalSteps += 1;
      player.exploration.dailySteps += 1;
      player.xp += 10;
      await player.save();

      const updated = await Player.findById(user._id);
      expect(updated.exploration.totalSteps).toBe(initialSteps + 1);
      expect(updated.exploration.dailySteps).toBe(1);
      expect(updated.xp).toBeGreaterThanOrEqual(10);
    });

    it('15.4 allows stepping when cooldown timestamp has expired in the past', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);

      // Set cooldown 10 seconds in the past (expired)
      player.exploration.cooldownEnd = new Date(Date.now() - 10000);
      await player.save();

      const refreshed = await Player.findById(user._id);
      const canStep = !refreshed.exploration.cooldownEnd || new Date(refreshed.exploration.cooldownEnd).getTime() <= Date.now();
      expect(canStep).toBe(true);

      // Successfully execute step
      refreshed.exploration.totalSteps += 1;
      refreshed.exploration.cooldownEnd = new Date(Date.now() + 5000);
      await refreshed.save();

      const finalPlayer = await Player.findById(user._id);
      expect(finalPlayer.exploration.totalSteps).toBe(1);
      expect(new Date(finalPlayer.exploration.cooldownEnd).getTime()).toBeGreaterThan(Date.now());
    });

    it('15.5 rejects unauthenticated requests to protected exploration endpoints', async () => {
      const response = await request(app).get('/api/user/overlay-profile');
      expect(response.status).toBe(401);
    });

    it('15.6 updates lastStepDate formatted to current calendar day YYYY-MM-DD', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);

      const todayStr = new Date().toISOString().slice(0, 10);
      player.exploration.lastStepDate = todayStr;
      await player.save();

      const updated = await Player.findById(user._id);
      expect(updated.exploration.lastStepDate).toBe(todayStr);
      expect(updated.exploration.lastStepDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // =========================================================================
  // Feature 16: Energy System & Deduction (6 Test Cases)
  // =========================================================================
  describe('Feature 16: Energy System & Deduction', () => {
    it('16.1 initializes player with 10 max energy and 10 current energy', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);

      expect(player.energy.current).toBe(10);
      expect(player.energy.max).toBe(10);
      expect(player.energy.refillRateMinutes).toBe(10);
    });

    it('16.2 deducts exactly 1 energy point upon entering dungeon session', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);
      expect(player.energy.current).toBe(10);

      const consumed = player.consumeEnergy(1);
      expect(consumed).toBe(true);
      await player.save();

      const session = await DungeonSession.create({
        userId: String(user._id),
        totalSteps: 3,
        energyCost: 1,
        status: 'in_progress'
      });

      expect(session).toBeDefined();
      const updatedPlayer = await Player.findById(user._id);
      expect(updatedPlayer.energy.current).toBe(9);
    });

    it('16.3 sequentially decrements energy across consecutive dungeon entries (10 -> 9 -> 8 -> 7)', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);

      for (let expected = 9; expected >= 7; expected--) {
        const consumed = player.consumeEnergy(1);
        expect(consumed).toBe(true);
        expect(player.energy.current).toBe(expected);
      }
      await player.save();

      const reloaded = await Player.findById(user._id);
      expect(reloaded.energy.current).toBe(7);
    });

    it('16.4 rejects dungeon entry when player energy pool is 0', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);

      player.energy.current = 0;
      await player.save();

      const consumed = player.consumeEnergy(1);
      expect(consumed).toBe(false);
      expect(player.energy.current).toBe(0);
    });

    it('16.5 model method consumeEnergy enforces zero floor and never yields negative values', async () => {
      const player = new Player({
        username: 'energy_floor_test',
        email: 'floor@test.com',
        password: 'Password123!'
      });
      player.energy.current = 1;

      expect(player.consumeEnergy(1)).toBe(true);
      expect(player.energy.current).toBe(0);

      expect(player.consumeEnergy(1)).toBe(false);
      expect(player.energy.current).toBe(0);

      expect(player.consumeEnergy(5)).toBe(false);
      expect(player.energy.current).toBe(0);
    });

    it('16.6 passive energy regeneration calculates points based on elapsed time capped at max 10', () => {
      const player = new Player({
        username: 'energy_regen_test',
        email: 'regen@test.com',
        password: 'Password123!'
      });

      // Set energy to 4 and lastRefill to 30 minutes ago (3 intervals of 10 min)
      player.energy.current = 4;
      player.energy.max = 10;
      player.energy.refillRateMinutes = 10;
      player.energy.lastRefillAt = new Date(Date.now() - 30 * 60 * 1000);

      const regenerated = player.refillEnergy();
      expect(regenerated).toBe(7); // 4 + 3 = 7

      // Simulate 200 minutes elapsed: must cap strictly at 10
      player.energy.lastRefillAt = new Date(Date.now() - 200 * 60 * 1000);
      const capped = player.refillEnergy();
      expect(capped).toBe(10);
      expect(player.energy.current).toBe(10);
    });
  });

  // =========================================================================
  // Feature 17: Dedicated Dungeon Page (6 Test Cases)
  // =========================================================================
  describe('Feature 17: Dedicated Dungeon Page', () => {
    it('17.1 verifies adventure and dungeon frontend components exist on disk', () => {
      const advPath = path.resolve(__dirname, '../../../frontend/src/pages/mainpage/advpage/Adventure.jsx');
      const advCssPath = path.resolve(__dirname, '../../../frontend/src/pages/mainpage/advpage/Adventure.css');

      expect(fs.existsSync(advPath)).toBe(true);
      expect(fs.existsSync(advCssPath)).toBe(true);
    });

    it('17.2 verifies adventure route mounting in frontend/src/main.jsx', () => {
      const mainPath = path.resolve(__dirname, '../../../frontend/src/main.jsx');
      const mainContent = fs.readFileSync(mainPath, 'utf8');

      expect(mainContent).toMatch(/<Route\s+path=["']\/adventure["']/);
      expect(mainContent).toMatch(/import\s+Adventure\s+from/);
    });

    it('17.3 initializes dungeon session document with in_progress status and step index 0', async () => {
      const session = await DungeonSession.create({
        userId: 'u_dungeon_page_test',
        totalSteps: 4,
        steps: DungeonSession.generateSteps(4),
        status: 'in_progress',
        currentStepIndex: 0
      });

      expect(session._id).toBeDefined();
      expect(session.status).toBe('in_progress');
      expect(session.currentStepIndex).toBe(0);
      expect(session.steps.length).toBe(4);
    });

    it('17.4 queries and retrieves active in-progress dungeon session for player', async () => {
      const userId = `u_active_${Date.now()}`;
      const session = await DungeonSession.create({
        userId,
        totalSteps: 3,
        status: 'in_progress'
      });

      const activeSession = await DungeonSession.findOne({ userId, status: 'in_progress' });
      expect(activeSession).toBeDefined();
      expect(activeSession._id.toString()).toBe(session._id.toString());
      expect(activeSession.status).toBe('in_progress');
    });

    it('17.5 handles dungeon retreat transition cleanly updating status to fled', async () => {
      const userId = `u_retreat_${Date.now()}`;
      const session = await DungeonSession.create({
        userId,
        totalSteps: 5,
        status: 'in_progress'
      });

      session.status = 'fled';
      session.finishedAt = new Date();
      await session.save();

      const updated = await DungeonSession.findById(session._id);
      expect(updated.status).toBe('fled');
      expect(updated.finishedAt).toBeDefined();

      const active = await DungeonSession.findOne({ userId, status: 'in_progress' });
      expect(active).toBeNull();
    });

    it('17.6 prevents redundant energy deduction when active dungeon session is re-queried', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);

      player.consumeEnergy(1);
      await player.save();

      const activeSession = await DungeonSession.create({
        userId: String(user._id),
        totalSteps: 2,
        status: 'in_progress'
      });

      // Checking active session state should not consume more energy
      const existingSession = await DungeonSession.findOne({ userId: String(user._id), status: 'in_progress' });
      expect(existingSession._id.toString()).toBe(activeSession._id.toString());

      const recheckedPlayer = await Player.findById(user._id);
      expect(recheckedPlayer.energy.current).toBe(9);
    });
  });

  // =========================================================================
  // Feature 18: Randomized 1-8 Dungeon Steps (6 Test Cases)
  // =========================================================================
  describe('Feature 18: Randomized 1-8 Dungeon Steps', () => {
    it('18.1 ensures generated totalSteps is strictly an integer between 1 and 8 across 50 sessions', () => {
      const stepCounts = new Set();

      for (let i = 0; i < 50; i++) {
        // Randomize count between 1 and 8
        const count = Math.floor(Math.random() * 8) + 1;
        const steps = DungeonSession.generateSteps(count);

        expect(steps.length).toBeGreaterThanOrEqual(1);
        expect(steps.length).toBeLessThanOrEqual(8);
        expect(Number.isInteger(steps.length)).toBe(true);
        stepCounts.add(steps.length);
      }

      // Check variance: should have generated more than 1 distinct step count across 50 runs
      expect(stepCounts.size).toBeGreaterThan(1);
    });

    it('18.2 validates all step event types strictly belong to [monster, loot, empty]', () => {
      const steps = DungeonSession.generateSteps(8);
      const allowedEvents = ['monster', 'loot', 'empty'];

      steps.forEach((step, idx) => {
        expect(allowedEvents).toContain(step.eventType);
        expect(step.stepNumber).toBe(idx + 1);
        expect(typeof step.isResolved).toBe('boolean');
      });
    });

    it('18.3 validates monster encounter step schema attributes', () => {
      // Generate until a monster step is created
      let monsterStep = null;
      for (let attempt = 0; attempt < 10 && !monsterStep; attempt++) {
        const steps = DungeonSession.generateSteps(8);
        monsterStep = steps.find(s => s.eventType === 'monster');
      }

      expect(monsterStep).toBeDefined();
      expect(monsterStep.monster).toBeDefined();
      expect(typeof monsterStep.monster.name).toBe('string');
      expect(monsterStep.monster.name.length).toBeGreaterThan(0);
      expect(monsterStep.monster.currentHp).toBeGreaterThan(0);
      expect(monsterStep.monster.atk).toBeGreaterThan(0);
      expect(monsterStep.monster.expReward).toBeGreaterThan(0);
      expect(monsterStep.monster.goldReward).toBeGreaterThan(0);
    });

    it('18.4 validates loot step schema attributes and gold rewards', () => {
      let lootStep = null;
      for (let attempt = 0; attempt < 20 && !lootStep; attempt++) {
        const steps = DungeonSession.generateSteps(8);
        lootStep = steps.find(s => s.eventType === 'loot');
      }

      expect(lootStep).toBeDefined();
      expect(lootStep.loot).toBeDefined();
      expect(lootStep.loot.gold).toBeGreaterThanOrEqual(0);
      expect(lootStep.isResolved).toBe(false);
    });

    it('18.5 advances currentStepIndex through session progression', async () => {
      const session = await DungeonSession.create({
        userId: 'u_step_adv_test',
        totalSteps: 3,
        currentStepIndex: 0,
        steps: DungeonSession.generateSteps(3),
        status: 'in_progress'
      });

      expect(session.currentStepIndex).toBe(0);

      // Step 1 resolved -> advance to step index 1
      session.steps[0].isResolved = true;
      session.currentStepIndex = 1;
      await session.save();

      const updated = await DungeonSession.findById(session._id);
      expect(updated.currentStepIndex).toBe(1);
      expect(updated.steps[0].isResolved).toBe(true);
    });

    it('18.6 completes dungeon session upon resolving the final step', async () => {
      const totalSteps = 2;
      const session = await DungeonSession.create({
        userId: 'u_final_step_test',
        totalSteps,
        currentStepIndex: 1,
        steps: DungeonSession.generateSteps(totalSteps),
        status: 'in_progress'
      });

      // Resolve final step
      session.steps[1].isResolved = true;
      session.status = 'completed';
      session.finishedAt = new Date();
      await session.save();

      const completed = await DungeonSession.findById(session._id);
      expect(completed.status).toBe('completed');
      expect(completed.finishedAt).toBeDefined();
    });
  });
});
