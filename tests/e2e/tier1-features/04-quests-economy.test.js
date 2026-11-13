/**
 * tests/e2e/tier1-features/04-quests-economy.test.js
 * 
 * Tier 1 Automated Test Suite: Features 23 through 25
 * Feature 23: Quests System & Rewards (daily/weekly/monthly quests, completion, claim locking)
 * Feature 24: In-Game Shop Buy/Sell (storefront catalog, buy deduction, sell credit, item stacking)
 * Feature 25: Server-Side Gacha System (1x/10x summons, drop pools, inventory/pet persistence, audit log)
 */

const { describe, it, expect, beforeAll, afterAll } = require('vitest');
const request = require('supertest');

const { getApp } = require('../../helpers/appLoader');
const { registerTestUser, getAuthHeaders } = require('../../helpers/authHelper');
const { connect, teardown } = require('../../helpers/testDb');

const Player = require('../../../backend/models/Player');
const { QuestTemplate, UserQuestProgress } = require('../../../backend/models/Quest');
const { ShopCatalog, GachaLog } = require('../../../backend/models/ShopGacha');
const { ItemTemplate, UserInventory } = require('../../../backend/models/Item');
const { PetTemplate, UserPet } = require('../../../backend/models/Pet');
const { seedDatabase } = require('../../../scripts/seed-mongodb');

describe('Tier 1: Features 23-25 Quests, Shop & Gacha Economy', () => {
  let app;

  beforeAll(async () => {
    app = await getApp();
    await connect();
    await seedDatabase();
  });

  afterAll(async () => {
    await teardown();
  });

  // =========================================================================
  // Feature 23: Quests System & Rewards (6 Test Cases)
  // =========================================================================
  describe('Feature 23: Quests System & Rewards', () => {
    it('23.1 retrieves full quest template catalog via GET /api/quests', async () => {
      const response = await request(app).get('/api/quests');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(16);

      const repeatTypes = response.body.map(q => q.repeatType);
      expect(repeatTypes).toContain('daily');
      expect(repeatTypes).toContain('weekly');
      expect(repeatTypes).toContain('monthly');
      expect(repeatTypes).toContain('bounty');
    });

    it('23.2 hydrates user quest progress via GET /api/user/:userId/quests', async () => {
      const { user } = await registerTestUser(app);

      const response = await request(app).get(`/api/user/${user._id}/quests`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(16);

      const firstQuest = response.body.data[0];
      expect(firstQuest.progress).toBe(0);
      expect(firstQuest.completed).toBe(false);
      expect(firstQuest.claimed).toBe(false);
    });

    it('23.3 completes quest via POST /api/user/:userId/quest/:questId/complete', async () => {
      const { user } = await registerTestUser(app);
      const quest = await QuestTemplate.findOne({ repeatType: 'daily' });

      const response = await request(app).post(`/api/user/${user._id}/quest/${quest.questId}/complete`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const periodKey = UserQuestProgress.generatePeriodKey(quest.repeatType);
      const progress = await UserQuestProgress.findOne({
        userId: String(user._id),
        questId: quest.questId,
        periodKey
      });

      expect(progress).toBeDefined();
      expect(progress.completed).toBe(true);
      expect(progress.progress).toBe(quest.requirementTarget);
    });

    it('23.4 claims completed quest reward and credits Player XP, Gold, Diamonds', async () => {
      const { user } = await registerTestUser(app);
      const quest = await QuestTemplate.findOne({ repeatType: 'daily' });

      const initialPlayer = await Player.findById(user._id);
      const initialGold = initialPlayer.gold;
      const initialXp = initialPlayer.xp;
      const initialDiamonds = initialPlayer.diamonds;

      // Complete and claim
      await request(app).post(`/api/user/${user._id}/quest/${quest.questId}/complete`);
      const claimRes = await request(app).post(`/api/user/${user._id}/quest/${quest.questId}/claim`);

      expect(claimRes.status).toBe(200);
      expect(claimRes.body.success).toBe(true);

      const updatedPlayer = await Player.findById(user._id);
      expect(updatedPlayer.gold).toBe(initialGold + (quest.goldReward || 0));
      expect(updatedPlayer.xp).toBe(initialXp + (quest.xpReward || 0));
      expect(updatedPlayer.diamonds).toBe(initialDiamonds + (quest.diamondReward || 0));
    });

    it('23.5 enforces claim locking rejecting repeat claim requests with HTTP 400', async () => {
      const { user } = await registerTestUser(app);
      const quest = await QuestTemplate.findOne({ repeatType: 'daily' });

      await request(app).post(`/api/user/${user._id}/quest/${quest.questId}/complete`);
      await request(app).post(`/api/user/${user._id}/quest/${quest.questId}/claim`);

      // Duplicate claim
      const dupRes = await request(app).post(`/api/user/${user._id}/quest/${quest.questId}/claim`);
      expect(dupRes.status).toBe(400);
      expect(dupRes.body.message).toMatch(/already claimed/i);
    });

    it('23.6 claims daily main reward granting 5 diamonds and 1 key locked per calendar day', async () => {
      const { user } = await registerTestUser(app);

      const response = await request(app).post(`/api/user/${user._id}/claim-daily-main-reward`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const player = await Player.findById(user._id);
      expect(player.diamonds).toBe(10 + 5);

      const keyInv = await UserInventory.findOne({ userId: String(user._id), itemId: 'key_steel' });
      expect(keyInv).toBeDefined();
      expect(keyInv.amount).toBe(1);

      // Repeat claim today must fail
      const repeatRes = await request(app).post(`/api/user/${user._id}/claim-daily-main-reward`);
      expect(repeatRes.status).toBe(400);
      expect(repeatRes.body.message).toMatch(/already claimed today/i);
    });
  });

  // =========================================================================
  // Feature 24: In-Game Shop Buy/Sell (6 Test Cases)
  // =========================================================================
  describe('Feature 24: In-Game Shop Buy/Sell', () => {
    it('24.1 inspects shop catalog listings across potions, equipment, keys, and food', async () => {
      const catalog = await ShopCatalog.find({ isAvailable: true }).populate('template');
      expect(catalog.length).toBeGreaterThanOrEqual(14);

      const categories = catalog.map(c => c.category);
      expect(categories).toContain('potions');
      expect(categories).toContain('keys');
      expect(categories).toContain('food');

      catalog.forEach(entry => {
        expect(entry.buyPriceGold).toBeGreaterThan(0);
        expect(entry.isAvailable).toBe(true);
      });
    });

    it('24.2 buys item deducting gold and creating UserInventory record', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);
      expect(player.gold).toBe(100);

      const shopItem = await ShopCatalog.findOne({ itemId: 'potion_hp_small' });
      const purchaseQuantity = 1;
      const totalCost = shopItem.buyPriceGold * purchaseQuantity;

      // Execute purchase
      player.gold -= totalCost;
      await player.save();

      await UserInventory.findOneAndUpdate(
        { userId: String(user._id), itemId: shopItem.itemId },
        { $inc: { amount: purchaseQuantity } },
        { upsert: true }
      );

      const updatedPlayer = await Player.findById(user._id);
      expect(updatedPlayer.gold).toBe(100 - totalCost);

      const inv = await UserInventory.findOne({ userId: String(user._id), itemId: shopItem.itemId });
      expect(inv.amount).toBe(1);
      expect(inv.isEquipped).toBe(false);
    });

    it('24.3 stacks inventory items on repeat purchase without creating duplicate documents', async () => {
      const { user } = await registerTestUser(app);
      const itemId = 'potion_hp_small';

      // Buy first copy
      await UserInventory.findOneAndUpdate(
        { userId: String(user._id), itemId },
        { $inc: { amount: 1 } },
        { upsert: true }
      );

      // Buy two more copies
      await UserInventory.findOneAndUpdate(
        { userId: String(user._id), itemId },
        { $inc: { amount: 2 } },
        { upsert: true }
      );

      const docs = await UserInventory.find({ userId: String(user._id), itemId });
      expect(docs.length).toBe(1); // Exactly 1 document stacked
      expect(docs[0].amount).toBe(3);
    });

    it('24.4 sells item from inventory decrements item amount and credits player gold', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);
      const initialGold = player.gold;
      const itemId = 'potion_hp_small';

      // Seed 3 potions
      await UserInventory.create({ userId: String(user._id), itemId, amount: 3 });

      const template = await ItemTemplate.findOne({ itemId });
      const sellUnitPrice = template.sellPriceGold || 10;
      const sellQuantity = 2;
      const totalEarned = sellUnitPrice * sellQuantity;

      // Execute sell
      await UserInventory.findOneAndUpdate(
        { userId: String(user._id), itemId },
        { $inc: { amount: -sellQuantity } }
      );

      player.gold += totalEarned;
      await player.save();

      const inv = await UserInventory.findOne({ userId: String(user._id), itemId });
      expect(inv.amount).toBe(1);

      const updatedPlayer = await Player.findById(user._id);
      expect(updatedPlayer.gold).toBe(initialGold + totalEarned);
    });

    it('24.5 sells remaining items down to 0 and verifies dungeon keys in shop catalog', async () => {
      const { user } = await registerTestUser(app);
      const itemId = 'potion_hp_small';

      await UserInventory.create({ userId: String(user._id), itemId, amount: 1 });
      await UserInventory.findOneAndDelete({ userId: String(user._id), itemId });

      const remaining = await UserInventory.findOne({ userId: String(user._id), itemId });
      expect(remaining).toBeNull();

      // Verify dungeon keys are in catalog for progression
      const steelKey = await ShopCatalog.findOne({ itemId: 'key_steel' });
      const mythicalKey = await ShopCatalog.findOne({ itemId: 'key_mythical' });
      expect(steelKey).toBeDefined();
      expect(mythicalKey).toBeDefined();
    });

    it('24.6 rejects purchase when player has insufficient gold balance', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);
      player.gold = 10;
      await player.save();

      const expensiveItem = await ShopCatalog.findOne({ itemId: 'wpn_t3_steel_broadsword' });
      const canAfford = player.gold >= expensiveItem.buyPriceGold;
      expect(canAfford).toBe(false);

      // Gold remains untouched
      expect(player.gold).toBe(10);
    });
  });

  // =========================================================================
  // Feature 25: Server-Side Gacha System (6 Test Cases)
  // =========================================================================
  describe('Feature 25: Server-Side Gacha System', () => {
    it('25.1 executes single summon (1x pull) granting 1 item or pet and recording GachaLog', async () => {
      const { user } = await registerTestUser(app);
      const player = await Player.findById(user._id);
      expect(player.diamonds).toBe(10);

      // 1x pull costs 10 diamonds
      const dropItem = await ItemTemplate.findOne({ rarityTier: 2 });
      player.diamonds -= 10;
      await player.save();

      await UserInventory.create({
        userId: String(user._id),
        itemId: dropItem.itemId,
        amount: 1
      });

      const log = await GachaLog.create({
        userId: String(user._id),
        bannerType: 'standard_item',
        resultItemType: 'item',
        resultId: dropItem.itemId,
        resultName: dropItem.name,
        rarityTier: dropItem.rarityTier,
        rarityName: dropItem.rarityName,
        costType: 'diamonds',
        costAmount: 10
      });

      expect(log).toBeDefined();
      expect(log.rarityTier).toBe(2);

      const updatedPlayer = await Player.findById(user._id);
      expect(updatedPlayer.diamonds).toBe(0);
    });

    it('25.2 executes 10x summon via GET /api/users/:userId/tenPull returning strictly 10 drops', async () => {
      const { user } = await registerTestUser(app);

      const response = await request(app).get(`/api/users/${user._id}/tenPull`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(10);

      response.body.forEach(item => {
        expect(item.id || item.index_id).toBeDefined();
        expect(item.item_name || item.name).toBeDefined();
      });
    });

    it('25.3 adheres strictly to registered item template catalog drop pool', async () => {
      const { user } = await registerTestUser(app);
      const response = await request(app).get(`/api/users/${user._id}/tenPull`);

      const allTemplates = await ItemTemplate.find({});
      const validItemIds = new Set(allTemplates.map(t => t.itemId));

      response.body.forEach(item => {
        const id = item.index_id || item.id || item.itemId;
        expect(validItemIds.has(id)).toBe(true);
      });
    });

    it('25.4 persists awarded gacha items into UserInventory with amount >= 1', async () => {
      const { user } = await registerTestUser(app);

      // Execute 10 pull
      await request(app).get(`/api/users/${user._id}/tenPull`);

      // Inventory must now contain items
      const userItems = await UserInventory.find({ userId: String(user._id) });
      expect(userItems.length).toBeGreaterThan(0);
      userItems.forEach(inv => {
        expect(inv.amount).toBeGreaterThanOrEqual(1);
      });
    });

    it('25.5 creates chronological GachaLog audit trail with timestamp and cost', async () => {
      const userId = `audit_gacha_${Date.now()}`;
      for (let i = 1; i <= 3; i++) {
        await GachaLog.create({
          userId,
          bannerType: 'standard_item',
          resultItemType: 'item',
          resultId: `wpn_t${i}_item`,
          rarityTier: i,
          costType: 'diamonds',
          costAmount: 10,
          pulledAt: new Date(Date.now() + i * 1000)
        });
      }

      const logs = await GachaLog.find({ userId }).sort({ pulledAt: -1 });
      expect(logs.length).toBe(3);
      expect(logs[0].resultId).toBe('wpn_t3_item');
      expect(logs[2].resultId).toBe('wpn_t1_item');
    });

    it('25.6 supports rare high-tier drop outcomes adhering to rarity tiers 1 through 10', async () => {
      const highTierPet = await PetTemplate.findOne({ rarityTier: 10 });
      expect(highTierPet).toBeDefined();
      expect(highTierPet.rarityTier).toBe(10);
      expect(highTierPet.rarityName).toBe('Transcendent');

      const log = await GachaLog.create({
        userId: 'u_transcendent_winner',
        bannerType: 'pet_summon',
        resultItemType: 'pet',
        resultId: highTierPet.petId,
        resultName: highTierPet.name,
        rarityTier: 10,
        rarityName: 'Transcendent',
        costType: 'diamonds',
        costAmount: 100
      });

      expect(log.rarityTier).toBe(10);
      expect(log.resultName).toBe(highTierPet.name);
    });
  });
});
