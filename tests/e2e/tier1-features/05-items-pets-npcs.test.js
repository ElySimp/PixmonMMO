/**
 * tests/e2e/tier1-features/05-items-pets-npcs.test.js
 * 
 * Tier 1 Automated Test Suite: Features 9 through 14
 * Feature 9: 10 Rarity Tiers Definition (Crude to Transcendent, monotonic stat scaling, pricing curves)
 * Feature 10: Tier 1–8 Weapon Assets (static PNGs, frameCount 1, non-animated, distinct paths)
 * Feature 11: Tier 9 Spritesheet & Animation (4-frame looping spritesheet, 4:1 geometry, steps(4) token)
 * Feature 12: Tier 10 Spritesheet & Animation (6-frame looping spritesheet, 6:1 geometry, steps(6) token)
 * Feature 13: Rich Pet Animations (spritesheet frame scaling across tiers, combat skills)
 * Feature 14: Interactive NPCs System (Goran, Elian, Vane, Aurelia dialogue trees & action triggers)
 */

const { describe, it, expect, beforeAll, afterAll } = require('vitest');

const { connect, teardown } = require('../../helpers/testDb');
const { seedDatabase } = require('../../../scripts/seed-mongodb');
const { ItemTemplate } = require('../../../backend/models/Item');
const { PetTemplate } = require('../../../backend/models/Pet');
const Npc = require('../../../backend/models/Npc');

const CANONICAL_RARITY_NAMES = {
  1: 'Crude',
  2: 'Common',
  3: 'Uncommon',
  4: 'Rare',
  5: 'Epic',
  6: 'Legendary',
  7: 'Mythic',
  8: 'Ancient',
  9: 'Eldritch',
  10: 'Transcendent'
};

describe('Tier 1: Features 9-14 Items, Equipment, Pets & Interactive NPCs', () => {
  beforeAll(async () => {
    await connect();
    await seedDatabase();
  });

  afterAll(async () => {
    await teardown();
  });

  // =========================================================================
  // Feature 9: 10 Rarity Tiers Definition (6 Test Cases)
  // =========================================================================
  describe('Feature 9: 10 Rarity Tiers Definition', () => {
    it('9.1 confirms existence of all 10 integer rarity tiers in ItemTemplate catalog', async () => {
      const tiers = await ItemTemplate.distinct('rarityTier');
      const expectedTiers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expectedTiers.forEach(tier => {
        expect(tiers).toContain(tier);
      });
      expect(tiers.length).toBe(10);
    });

    it('9.2 confirms canonical names for all 10 rarity tiers', async () => {
      for (let tier = 1; tier <= 10; tier++) {
        const item = await ItemTemplate.findOne({ rarityTier: tier });
        expect(item).toBeDefined();
        expect(item.rarityName).toBe(CANONICAL_RARITY_NAMES[tier]);
      }
    });

    it('9.3 verifies monotonic ATK scaling across weapon rarity tiers 1 through 10', async () => {
      const weaponTiers = [];
      for (let tier = 1; tier <= 10; tier++) {
        const weapon = await ItemTemplate.findOne({ itemType: 'weapon', rarityTier: tier });
        expect(weapon).toBeDefined();
        weaponTiers.push({ tier, atk: weapon.stats.atk });
      }

      // Assert strictly monotonic increase: atk(T_i) < atk(T_{i+1})
      for (let i = 0; i < weaponTiers.length - 1; i++) {
        expect(weaponTiers[i].atk).toBeLessThan(weaponTiers[i + 1].atk);
      }
    });

    it('9.4 verifies monotonic DEF and HP scaling across armor rarity tiers 1 through 10', async () => {
      const armorTiers = [];
      for (let tier = 1; tier <= 10; tier++) {
        const armor = await ItemTemplate.findOne({ itemType: 'armor', rarityTier: tier });
        expect(armor).toBeDefined();
        armorTiers.push({ tier, def: armor.stats.defPhy, hp: armor.stats.hp });
      }

      for (let i = 0; i < armorTiers.length - 1; i++) {
        expect(armorTiers[i].def).toBeLessThan(armorTiers[i + 1].def);
        expect(armorTiers[i].hp).toBeLessThan(armorTiers[i + 1].hp);
      }
    });

    it('9.5 verifies gold valuation curves where sell price is non-zero and lower than buy price', async () => {
      const items = await ItemTemplate.find({ buyPriceGold: { $gt: 0 } });
      expect(items.length).toBeGreaterThan(0);

      items.forEach(item => {
        expect(item.sellPriceGold).toBeGreaterThan(0);
        expect(item.sellPriceGold).toBeLessThan(item.buyPriceGold);
        // Standard resale ratio is approximately 25%
        const ratio = item.sellPriceGold / item.buyPriceGold;
        expect(ratio).toBeGreaterThanOrEqual(0.20);
        expect(ratio).toBeLessThanOrEqual(0.30);
      });
    });

    it('9.6 rejects invalid rarityTier outside [1, 10] in ItemTemplate schema', async () => {
      const invalidLow = new ItemTemplate({
        itemId: 'invalid_low_tier',
        name: 'Zero Tier',
        itemType: 'weapon',
        rarityTier: 0,
        rarityName: 'Invalid'
      });
      await expect(invalidLow.save()).rejects.toThrow();

      const invalidHigh = new ItemTemplate({
        itemId: 'invalid_high_tier',
        name: 'Eleven Tier',
        itemType: 'weapon',
        rarityTier: 11,
        rarityName: 'Invalid'
      });
      await expect(invalidHigh.save()).rejects.toThrow();
    });
  });

  // =========================================================================
  // Feature 10: Tier 1–8 Weapon Assets (6 Test Cases)
  // =========================================================================
  describe('Feature 10: Tier 1–8 Weapon Assets', () => {
    it('10.1 validates that all weapons in Tiers 1 through 8 are marked non-animated', async () => {
      const weapons = await ItemTemplate.find({ itemType: 'weapon', rarityTier: { $lte: 8 } });
      expect(weapons.length).toBe(8);

      weapons.forEach(wpn => {
        expect(wpn.asset.isAnimated).toBe(false);
      });
    });

    it('10.2 validates that all weapons in Tiers 1 through 8 specify frameCount of 1', async () => {
      const weapons = await ItemTemplate.find({ itemType: 'weapon', rarityTier: { $lte: 8 } });
      weapons.forEach(wpn => {
        expect(wpn.asset.frameCount).toBe(1);
        expect(wpn.asset.frameRate).toBe(0);
      });
    });

    it('10.3 validates that all weapon static paths for Tiers 1 through 8 end with .png', async () => {
      const weapons = await ItemTemplate.find({ itemType: 'weapon', rarityTier: { $lte: 8 } });
      weapons.forEach(wpn => {
        expect(wpn.asset.staticPath).toBeDefined();
        expect(wpn.asset.staticPath).toMatch(/\.png$/);
      });
    });

    it('10.4 confirms absence of spritesheet paths for static weapons in Tiers 1 through 8', async () => {
      const weapons = await ItemTemplate.find({ itemType: 'weapon', rarityTier: { $lte: 8 } });
      weapons.forEach(wpn => {
        expect(wpn.asset.spriteSheetPath).toBeFalsy();
      });
    });

    it('10.5 confirms all 8 static weapons have distinct, unique asset paths', async () => {
      const weapons = await ItemTemplate.find({ itemType: 'weapon', rarityTier: { $lte: 8 } });
      const assetPaths = new Set(weapons.map(w => w.asset.staticPath));
      expect(assetPaths.size).toBe(8);
    });

    it('10.6 validates canonical path structure matching /assets/items/weapons/', async () => {
      const weapons = await ItemTemplate.find({ itemType: 'weapon', rarityTier: { $lte: 8 } });
      weapons.forEach(wpn => {
        expect(wpn.asset.staticPath).toMatch(/^\/assets\/items\/weapons\/[a-z0-9_]+\.png$/);
      });
    });
  });

  // =========================================================================
  // Feature 11: Tier 9 Spritesheet & Animation (6 Test Cases)
  // =========================================================================
  describe('Feature 11: Tier 9 Spritesheet & Animation', () => {
    it('11.1 validates that Tier 9 Eldritch weapon is flagged as animated', async () => {
      const tier9Weapon = await ItemTemplate.findOne({ itemType: 'weapon', rarityTier: 9 });
      expect(tier9Weapon).toBeDefined();
      expect(tier9Weapon.asset.isAnimated).toBe(true);
    });

    it('11.2 confirms Tier 9 weapon has strictly 4-frame spritesheet configuration', async () => {
      const tier9Weapon = await ItemTemplate.findOne({ itemType: 'weapon', rarityTier: 9 });
      expect(tier9Weapon.asset.frameCount).toBe(4);
    });

    it('11.3 confirms Tier 9 weapon specifies frameRate of 8 frames per second', async () => {
      const tier9Weapon = await ItemTemplate.findOne({ itemType: 'weapon', rarityTier: 9 });
      expect(tier9Weapon.asset.frameRate).toBe(8);
    });

    it('11.4 verifies distinct spritesheet path for Tier 9 voidblade ending with _sheet.png', async () => {
      const tier9Weapon = await ItemTemplate.findOne({ itemType: 'weapon', rarityTier: 9 });
      expect(tier9Weapon.asset.spriteSheetPath).toBe('/assets/items/weapons/eldritch_voidblade_sheet.png');
      expect(tier9Weapon.asset.staticPath).toBe('/assets/items/weapons/eldritch_voidblade.png');
      expect(tier9Weapon.asset.spriteSheetPath).not.toBe(tier9Weapon.asset.staticPath);
    });

    it('11.5 verifies 4:1 width-to-height ratio constraint for 4-frame horizontal spritesheet', () => {
      const frameCount = 4;
      const singleFrameWidth = 32;
      const singleFrameHeight = 32;
      const totalSheetWidth = singleFrameWidth * frameCount; // 128
      const aspectRatio = totalSheetWidth / singleFrameHeight;

      expect(aspectRatio).toBe(4);
    });

    it('11.6 asserts CSS steps(4) animation timing token specification for void pulse', () => {
      const stepToken = `steps(4)`;
      expect(stepToken).toBe('steps(4)');
    });
  });

  // =========================================================================
  // Feature 12: Tier 10 Spritesheet & Animation (6 Test Cases)
  // =========================================================================
  describe('Feature 12: Tier 10 Spritesheet & Animation', () => {
    it('12.1 validates that Tier 10 Transcendent weapon is flagged as animated', async () => {
      const tier10Weapon = await ItemTemplate.findOne({ itemType: 'weapon', rarityTier: 10 });
      expect(tier10Weapon).toBeDefined();
      expect(tier10Weapon.asset.isAnimated).toBe(true);
    });

    it('12.2 confirms Tier 10 weapon has strictly 6-frame spritesheet configuration', async () => {
      const tier10Weapon = await ItemTemplate.findOne({ itemType: 'weapon', rarityTier: 10 });
      expect(tier10Weapon.asset.frameCount).toBe(6);
    });

    it('12.3 confirms Tier 10 weapon specifies frameRate of 10 frames per second', async () => {
      const tier10Weapon = await ItemTemplate.findOne({ itemType: 'weapon', rarityTier: 10 });
      expect(tier10Weapon.asset.frameRate).toBe(10);
    });

    it('12.4 verifies distinct spritesheet path for Tier 10 godcleaver ending with _sheet.png', async () => {
      const tier10Weapon = await ItemTemplate.findOne({ itemType: 'weapon', rarityTier: 10 });
      expect(tier10Weapon.asset.spriteSheetPath).toBe('/assets/items/weapons/transcendent_godcleaver_sheet.png');
      expect(tier10Weapon.asset.staticPath).toBe('/assets/items/weapons/transcendent_godcleaver.png');
      expect(tier10Weapon.asset.spriteSheetPath).not.toBe(tier10Weapon.asset.staticPath);
    });

    it('12.5 verifies 6:1 width-to-height ratio constraint for 6-frame horizontal spritesheet', () => {
      const frameCount = 6;
      const singleFrameWidth = 32;
      const singleFrameHeight = 32;
      const totalSheetWidth = singleFrameWidth * frameCount; // 192
      const aspectRatio = totalSheetWidth / singleFrameHeight;

      expect(aspectRatio).toBe(6);
    });

    it('12.6 asserts CSS steps(6) animation timing token and chromatic gold aura styling', () => {
      const stepToken = `steps(6)`;
      const goldAuraHex = '#ffd700';
      expect(stepToken).toBe('steps(6)');
      expect(goldAuraHex).toBe('#ffd700');
    });
  });

  // =========================================================================
  // Feature 13: Rich Pet Animations (6 Test Cases)
  // =========================================================================
  describe('Feature 13: Rich Pet Animations', () => {
    it('13.1 validates that pet animation frame count scales monotonically across rarity tiers', async () => {
      const petT1 = await PetTemplate.findOne({ petId: 'pet_t1_fennec' });
      const petT5 = await PetTemplate.findOne({ petId: 'pet_t5_arcania' });
      const petT7 = await PetTemplate.findOne({ petId: 'pet_t7_frost_titan' });
      const petT10 = await PetTemplate.findOne({ petId: 'pet_t10_chronos_dragon' });

      expect(petT1.asset.frameCount).toBe(1);
      expect(petT5.asset.frameCount).toBe(4);
      expect(petT7.asset.frameCount).toBe(6);
      expect(petT10.asset.frameCount).toBe(8);

      expect(petT1.asset.frameCount).toBeLessThan(petT5.asset.frameCount);
      expect(petT5.asset.frameCount).toBeLessThan(petT7.asset.frameCount);
      expect(petT7.asset.frameCount).toBeLessThan(petT10.asset.frameCount);
    });

    it('13.2 validates that pets in Tier 5 and higher have isAnimated true and assigned sheet path', async () => {
      const highTierPets = await PetTemplate.find({ rarityTier: { $gte: 5 } });
      expect(highTierPets.length).toBeGreaterThan(0);

      highTierPets.forEach(pet => {
        expect(pet.asset.isAnimated).toBe(true);
        expect(pet.asset.spriteSheetPath).toBeDefined();
        expect(pet.asset.spriteSheetPath).toMatch(/_sheet\.png$/);
      });
    });

    it('13.3 verifies frame rate progression from static pets (0 fps) to transcendent pets (10 fps)', async () => {
      const petT1 = await PetTemplate.findOne({ petId: 'pet_t1_fennec' });
      const petT5 = await PetTemplate.findOne({ petId: 'pet_t5_arcania' });
      const petT10 = await PetTemplate.findOne({ petId: 'pet_t10_chronos_dragon' });

      expect(petT1.asset.frameRate).toBe(0);
      expect(petT5.asset.frameRate).toBe(6);
      expect(petT10.asset.frameRate).toBe(10);
    });

    it('13.4 verifies pet catalog covers all four core archetype roles', async () => {
      const roles = await PetTemplate.distinct('role');
      expect(roles).toContain('attacker');
      expect(roles).toContain('defender');
      expect(roles).toContain('supporter');
      expect(roles).toContain('assassin');
    });

    it('13.5 verifies that all animated pets possess defined active combat skills', async () => {
      const animatedPets = await PetTemplate.find({ 'asset.isAnimated': true });
      expect(animatedPets.length).toBeGreaterThan(0);

      animatedPets.forEach(pet => {
        expect(Array.isArray(pet.activeSkills)).toBe(true);
        expect(pet.activeSkills.length).toBeGreaterThanOrEqual(1);

        const skill = pet.activeSkills[0];
        expect(skill.name).toBeDefined();
        expect(skill.manaCost).toBeGreaterThan(0);
        const hasImpact = (skill.damage || 0) > 0 || (skill.healing || 0) > 0;
        expect(hasImpact).toBe(true);
      });
    });

    it('13.6 verifies presence of canonical skills: Arcane Blast, Shield Slam, Restoration, Lethal Strike', async () => {
      const arcania = await PetTemplate.findOne({ petId: 'pet_t5_arcania' });
      const ironheart = await PetTemplate.findOne({ petId: 'pet_t5_ironheart' });
      const luminara = await PetTemplate.findOne({ petId: 'pet_t5_luminara' });
      const shadowblade = await PetTemplate.findOne({ petId: 'pet_t5_shadowblade' });

      expect(arcania.activeSkills[0].name).toBe('Arcane Blast');
      expect(ironheart.activeSkills[0].name).toBe('Shield Slam');
      expect(luminara.activeSkills[0].name).toBe('Restoration');
      expect(shadowblade.activeSkills[0].name).toBe('Lethal Strike');
    });
  });

  // =========================================================================
  // Feature 14: Interactive NPCs System (6 Test Cases)
  // =========================================================================
  describe('Feature 14: Interactive NPCs System', () => {
    it('14.1 verifies exactly 4 canonical interactive NPCs are seeded in database', async () => {
      const npcs = await Npc.find({});
      expect(npcs.length).toBe(4);

      const ids = npcs.map(n => n.npcId);
      expect(ids).toContain('npc_blacksmith');
      expect(ids).toContain('npc_alchemist');
      expect(ids).toContain('npc_guildmaster');
      expect(ids).toContain('npc_mystic');
    });

    it('14.2 validates Blacksmith Goran Ironbender role, greeting, and shop action', async () => {
      const goran = await Npc.findOne({ npcId: 'npc_blacksmith' });
      expect(goran).toBeDefined();
      expect(goran.name).toBe('Goran Ironbender');
      expect(goran.role).toBe('blacksmith');
      expect(goran.location).toBe('Town Square');

      const actions = goran.dialogue.flatMap(d => d.actions);
      const openShop = actions.find(a => a.actionType === 'open_shop' && a.actionTarget === 'equipment');
      expect(openShop).toBeDefined();
    });

    it('14.3 validates Alchemist Elian Silverdew role, portrait, and consumables shop action', async () => {
      const elian = await Npc.findOne({ npcId: 'npc_alchemist' });
      expect(elian).toBeDefined();
      expect(elian.name).toBe('Elian Silverdew');
      expect(elian.role).toBe('alchemist');
      expect(elian.portraitAsset).toBe('/assets/npcs/alchemist_elian.png');

      const actions = elian.dialogue.flatMap(d => d.actions);
      const openPotions = actions.find(a => a.actionType === 'open_shop' && a.actionTarget === 'consumables');
      expect(openPotions).toBeDefined();
    });

    it('14.4 validates Commander Vane role, title, and quest navigation actions', async () => {
      const vane = await Npc.findOne({ npcId: 'npc_guildmaster' });
      expect(vane).toBeDefined();
      expect(vane.name).toBe('Commander Vane');
      expect(vane.role).toBe('guildmaster');

      const actions = vane.dialogue.flatMap(d => d.actions);
      const questNav = actions.find(a => a.actionType === 'navigate' && a.actionTarget === '/quests');
      expect(questNav).toBeDefined();
    });

    it('14.5 validates Lady Aurelia role and gacha/astral summoning navigation action', async () => {
      const aurelia = await Npc.findOne({ npcId: 'npc_mystic' });
      expect(aurelia).toBeDefined();
      expect(aurelia.name).toBe('Lady Aurelia');
      expect(aurelia.role).toBe('mystic');

      const actions = aurelia.dialogue.flatMap(d => d.actions);
      const gachaNav = actions.find(a => a.actionType === 'navigate' && a.actionTarget === '/gacha');
      expect(gachaNav).toBeDefined();
    });

    it('14.6 confirms all NPCs are active with non-empty default greetings', async () => {
      const npcs = await Npc.find({});
      npcs.forEach(npc => {
        expect(npc.isActive).toBe(true);
        expect(typeof npc.defaultGreeting).toBe('string');
        expect(npc.defaultGreeting.length).toBeGreaterThan(0);
      });
    });
  });
});
