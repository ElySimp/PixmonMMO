/**
 * scripts/seed-mongodb.js
 * PixmonMMO MongoDB Atlas Idempotent Database Seeder
 * Milestone 1 — Database Migration & Backend Persistence
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://faldomaxwell123:Faldo@pixmonmmo.dlsixio.mongodb.net/pixmonmmo';

// Import Mongoose Models
let ItemTemplate, PetTemplate, QuestTemplate, ShopCatalog, Npc;

try {
  const ItemModels = require('../backend/models/Item');
  ItemTemplate = ItemModels.ItemTemplate;
  
  const PetModels = require('../backend/models/Pet');
  PetTemplate = PetModels.PetTemplate;
  
  const QuestModels = require('../backend/models/Quest');
  QuestTemplate = QuestModels.QuestTemplate;
  
  const ShopModels = require('../backend/models/ShopGacha');
  ShopCatalog = ShopModels.ShopCatalog;
  
  Npc = require('../backend/models/Npc');
} catch (e) {
  // Models are required from backend/models/
}

// 1. 10 TIERS OF EQUIPMENT & CONSUMABLES
const RARITY_NAMES = {
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

const itemsData = [
  // --- WEAPONS (Tiers 1 to 10) ---
  {
    itemId: 'wpn_t1_crude_club',
    name: 'Crude Wooden Club',
    description: 'A roughly whittled branch. Fragile and splintered, but it can bash.',
    itemType: 'weapon',
    equipSlot: 'weapon',
    rarityTier: 1,
    rarityName: RARITY_NAMES[1],
    stats: { atk: 5, agility: -1 },
    asset: { staticPath: '/assets/items/weapons/crude_club.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 60, sellPriceGold: 15, minLevel: 1
  },
  {
    itemId: 'wpn_t2_iron_sword',
    name: 'Iron Shortsword',
    description: 'A standard forged iron blade used by village guards.',
    itemType: 'weapon',
    equipSlot: 'weapon',
    rarityTier: 2,
    rarityName: RARITY_NAMES[2],
    stats: { atk: 12, agility: 0 },
    asset: { staticPath: '/assets/items/weapons/iron_sword.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 220, sellPriceGold: 55, minLevel: 5
  },
  {
    itemId: 'wpn_t3_steel_broadsword',
    name: 'Steel Broadsword',
    description: 'Tempered high-carbon steel with a keen double edge.',
    itemType: 'weapon',
    equipSlot: 'weapon',
    rarityTier: 3,
    rarityName: RARITY_NAMES[3],
    stats: { atk: 24, defPhy: 2, agility: 1 },
    asset: { staticPath: '/assets/items/weapons/steel_broadsword.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 650, sellPriceGold: 160, minLevel: 10
  },
  {
    itemId: 'wpn_t4_frostfang_blade',
    name: 'Frostfang Blade',
    description: 'Chilled steel that emits a frosty mist upon unsheathing.',
    itemType: 'weapon',
    equipSlot: 'weapon',
    rarityTier: 4,
    rarityName: RARITY_NAMES[4],
    stats: { atk: 45, defMag: 8, agility: 4 },
    asset: { staticPath: '/assets/items/weapons/frostfang_blade.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 1600, sellPriceGold: 400, minLevel: 15
  },
  {
    itemId: 'wpn_t5_shadowflame_cleaver',
    name: 'Shadowflame Cleaver',
    description: 'Imbued with violet demonic fire that burns the soul.',
    itemType: 'weapon',
    equipSlot: 'weapon',
    rarityTier: 5,
    rarityName: RARITY_NAMES[5],
    stats: { atk: 80, hp: 40, agility: 6 },
    asset: { staticPath: '/assets/items/weapons/shadowflame_cleaver.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 4000, sellPriceGold: 1000, minLevel: 20
  },
  {
    itemId: 'wpn_t6_sunfire_claymore',
    name: 'Sunfire Claymore',
    description: 'Forged under the zenith sun; pulses with blinding solar energy.',
    itemType: 'weapon',
    equipSlot: 'weapon',
    rarityTier: 6,
    rarityName: RARITY_NAMES[6],
    stats: { atk: 140, hp: 80, defPhy: 15, agility: 10 },
    asset: { staticPath: '/assets/items/weapons/sunfire_claymore.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 10000, sellPriceGold: 2500, minLevel: 25
  },
  {
    itemId: 'wpn_t7_abyssal_reaver',
    name: 'Abyssal Reaver',
    description: 'Pulled from the Marianas trench of the nether realm.',
    itemType: 'weapon',
    equipSlot: 'weapon',
    rarityTier: 7,
    rarityName: RARITY_NAMES[7],
    stats: { atk: 240, hp: 150, mana: 50, agility: 18 },
    asset: { staticPath: '/assets/items/weapons/abyssal_reaver.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 25000, sellPriceGold: 6500, minLevel: 30
  },
  {
    itemId: 'wpn_t8_primordial_titan_blade',
    name: 'Primordial Titan Blade',
    description: 'Carved from the spine of a fallen world-titan.',
    itemType: 'weapon',
    equipSlot: 'weapon',
    rarityTier: 8,
    rarityName: RARITY_NAMES[8],
    stats: { atk: 400, hp: 280, defPhy: 50, agility: 25 },
    asset: { staticPath: '/assets/items/weapons/primordial_titan_blade.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 60000, sellPriceGold: 15000, minLevel: 35
  },
  {
    itemId: 'wpn_t9_eldritch_voidblade',
    name: 'Eldritch Voidblade',
    description: 'A forbidden blade vibrating with dark void tendrils and occult power.',
    itemType: 'weapon',
    equipSlot: 'weapon',
    rarityTier: 9,
    rarityName: RARITY_NAMES[9],
    stats: { atk: 700, hp: 500, defMag: 100, agility: 45 },
    asset: {
      staticPath: '/assets/items/weapons/eldritch_voidblade.png',
      isAnimated: true,
      spriteSheetPath: '/assets/items/weapons/eldritch_voidblade_sheet.png',
      frameCount: 4,
      frameRate: 8
    },
    buyPriceGold: 150000, buyPriceDiamonds: 250, sellPriceGold: 40000, minLevel: 40
  },
  {
    itemId: 'wpn_t10_transcendent_godcleaver',
    name: 'Transcendent Godcleaver',
    description: 'An incomprehensible weapon woven from chromatic singularities and pure cosmos.',
    itemType: 'weapon',
    equipSlot: 'weapon',
    rarityTier: 10,
    rarityName: RARITY_NAMES[10],
    stats: { atk: 1250, hp: 1000, defPhy: 200, defMag: 200, agility: 80 },
    asset: {
      staticPath: '/assets/items/weapons/transcendent_godcleaver.png',
      isAnimated: true,
      spriteSheetPath: '/assets/items/weapons/transcendent_godcleaver_sheet.png',
      frameCount: 6,
      frameRate: 10
    },
    buyPriceGold: 500000, buyPriceDiamonds: 1000, sellPriceGold: 125000, minLevel: 50
  },

  // --- ARMORS (Tiers 1 to 10) ---
  {
    itemId: 'arm_t1_tattered_tunic',
    name: 'Crude Tattered Tunic',
    description: 'Rough burlap cloth that barely shields against the wind.',
    itemType: 'armor',
    equipSlot: 'armor',
    rarityTier: 1,
    rarityName: RARITY_NAMES[1],
    stats: { defPhy: 3, hp: 15 },
    asset: { staticPath: '/assets/items/armors/crude_tunic.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 50, sellPriceGold: 12, minLevel: 1
  },
  {
    itemId: 'arm_t2_leather_jerkin',
    name: 'Leather Jerkin',
    description: 'Tough tanned hide offering flexible defense for adventurers.',
    itemType: 'armor',
    equipSlot: 'armor',
    rarityTier: 2,
    rarityName: RARITY_NAMES[2],
    stats: { defPhy: 8, hp: 35, agility: 2 },
    asset: { staticPath: '/assets/items/armors/leather_jerkin.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 180, sellPriceGold: 45, minLevel: 5
  },
  {
    itemId: 'arm_t3_chainmail_hauberk',
    name: 'Chainmail Hauberk',
    description: 'Interlocking steel rings that absorb slash and piercing blows.',
    itemType: 'armor',
    equipSlot: 'armor',
    rarityTier: 3,
    rarityName: RARITY_NAMES[3],
    stats: { defPhy: 20, defMag: 5, hp: 80 },
    asset: { staticPath: '/assets/items/armors/chainmail_hauberk.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 550, sellPriceGold: 140, minLevel: 10
  },
  {
    itemId: 'arm_t4_cobalt_plate',
    name: 'Cobalt Plate',
    description: 'Deep-blue mined alloy forged into sturdy breastplates.',
    itemType: 'armor',
    equipSlot: 'armor',
    rarityTier: 4,
    rarityName: RARITY_NAMES[4],
    stats: { defPhy: 42, defMag: 15, hp: 160 },
    asset: { staticPath: '/assets/items/armors/cobalt_plate.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 1400, sellPriceGold: 350, minLevel: 15
  },
  {
    itemId: 'arm_t5_dragonscale_cuirass',
    name: 'Dragonscale Cuirass',
    description: 'Gleaming crimson scales that deflect infernal fire.',
    itemType: 'armor',
    equipSlot: 'armor',
    rarityTier: 5,
    rarityName: RARITY_NAMES[5],
    stats: { defPhy: 75, defMag: 40, hp: 300, mana: 30 },
    asset: { staticPath: '/assets/items/armors/dragonscale_cuirass.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 3600, sellPriceGold: 900, minLevel: 20
  },
  {
    itemId: 'arm_t6_celestial_aegis',
    name: 'Celestial Aegis Vestment',
    description: 'Blessed plate etched with holy runes that ward off evil.',
    itemType: 'armor',
    equipSlot: 'armor',
    rarityTier: 6,
    rarityName: RARITY_NAMES[6],
    stats: { defPhy: 130, defMag: 85, hp: 550, mana: 80 },
    asset: { staticPath: '/assets/items/armors/celestial_aegis.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 9000, sellPriceGold: 2200, minLevel: 25
  },
  {
    itemId: 'arm_t7_abyssal_dreadplate',
    name: 'Abyssal Dreadplate',
    description: 'Hardened chitin from abyssal monstrosities; unnerves nearby enemies.',
    itemType: 'armor',
    equipSlot: 'armor',
    rarityTier: 7,
    rarityName: RARITY_NAMES[7],
    stats: { defPhy: 220, defMag: 140, hp: 950 },
    asset: { staticPath: '/assets/items/armors/abyssal_dreadplate.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 22000, sellPriceGold: 5500, minLevel: 30
  },
  {
    itemId: 'arm_t8_titanforged_bulwark',
    name: 'Titanforged Bulwark Armor',
    description: 'An impenetrable suit of armor crafted by ancient forge-gods.',
    itemType: 'armor',
    equipSlot: 'armor',
    rarityTier: 8,
    rarityName: RARITY_NAMES[8],
    stats: { defPhy: 360, defMag: 220, hp: 1600, agility: -5 },
    asset: { staticPath: '/assets/items/armors/titanforged_bulwark.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 55000, sellPriceGold: 14000, minLevel: 35
  },
  {
    itemId: 'arm_t9_eldritch_carapace',
    name: 'Eldritch Nether-Carapace',
    description: 'Living void-armor that writhes and devours hostile magic.',
    itemType: 'armor',
    equipSlot: 'armor',
    rarityTier: 9,
    rarityName: RARITY_NAMES[9],
    stats: { defPhy: 580, defMag: 420, hp: 2600, mana: 250 },
    asset: {
      staticPath: '/assets/items/armors/eldritch_carapace.png',
      isAnimated: true,
      spriteSheetPath: '/assets/items/armors/eldritch_carapace_sheet.png',
      frameCount: 4,
      frameRate: 8
    },
    buyPriceGold: 140000, buyPriceDiamonds: 220, sellPriceGold: 35000, minLevel: 40
  },
  {
    itemId: 'arm_t10_transcendent_omnis_plate',
    name: 'Transcendent Omnis-Plate',
    description: 'Transcends physical reality; attacks pass through prism folds harmlessly.',
    itemType: 'armor',
    equipSlot: 'armor',
    rarityTier: 10,
    rarityName: RARITY_NAMES[10],
    stats: { defPhy: 1000, defMag: 850, hp: 5000, mana: 600, agility: 50 },
    asset: {
      staticPath: '/assets/items/armors/transcendent_omnis_plate.png',
      isAnimated: true,
      spriteSheetPath: '/assets/items/armors/transcendent_omnis_plate_sheet.png',
      frameCount: 6,
      frameRate: 10
    },
    buyPriceGold: 450000, buyPriceDiamonds: 900, sellPriceGold: 110000, minLevel: 50
  },

  // --- TOOLS & ACCESSORIES ---
  {
    itemId: 'tool_t1_stone_pickaxe',
    name: 'Crude Stone Pickaxe',
    description: 'A rudimentary pickaxe suitable for chipping soft ore nodes.',
    itemType: 'tool',
    equipSlot: 'tool',
    rarityTier: 1,
    rarityName: RARITY_NAMES[1],
    stats: { atk: 3, agility: 1 },
    asset: { staticPath: '/assets/items/tools/stone_pickaxe.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 80, sellPriceGold: 20, minLevel: 1
  },
  {
    itemId: 'tool_t3_iron_pickaxe',
    name: 'Reinforced Iron Pickaxe',
    description: 'Durable iron pick capable of breaking deeper mineral veins.',
    itemType: 'tool',
    equipSlot: 'tool',
    rarityTier: 3,
    rarityName: RARITY_NAMES[3],
    stats: { atk: 12, agility: 3 },
    asset: { staticPath: '/assets/items/tools/iron_pickaxe.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 450, sellPriceGold: 110, minLevel: 10
  },
  {
    itemId: 'acc_t5_ruby_talisman',
    name: 'Ruby Heart Talisman',
    description: 'Glows with internal warmth, boosting wearer vitality and attack.',
    itemType: 'accessory',
    equipSlot: 'accessory',
    rarityTier: 5,
    rarityName: RARITY_NAMES[5],
    stats: { hp: 120, atk: 25, manaRegen: 5 },
    asset: { staticPath: '/assets/items/accessories/ruby_talisman.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 3200, sellPriceGold: 800, minLevel: 20
  },

  // --- CONSUMABLES, POTIONS & FOOD ---
  {
    itemId: 'potion_hp_small',
    name: 'Minor Health Potion',
    description: 'Restores 30% of maximum HP instantly.',
    itemType: 'potion',
    equipSlot: 'none',
    rarityTier: 2,
    rarityName: RARITY_NAMES[2],
    stats: { healthRegen: 30, healHp: 30 },
    asset: { staticPath: '/assets/items/potion_hp_small.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 50, sellPriceGold: 10, minLevel: 1
  },
  {
    itemId: 'potion_hp_great',
    name: 'Greater Health Potion',
    description: 'Restores 70% of maximum HP instantly.',
    itemType: 'potion',
    equipSlot: 'none',
    rarityTier: 4,
    rarityName: RARITY_NAMES[4],
    stats: { healthRegen: 70, healHp: 70 },
    asset: { staticPath: '/assets/items/potion_hp_great.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 180, sellPriceGold: 40, minLevel: 10
  },
  {
    itemId: 'potion_mana_small',
    name: 'Minor Mana Potion',
    description: 'Restores 30% of maximum Mana instantly.',
    itemType: 'potion',
    equipSlot: 'none',
    rarityTier: 2,
    rarityName: RARITY_NAMES[2],
    stats: { manaRegen: 30, healMana: 30 },
    asset: { staticPath: '/assets/items/potion_mana_small.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 60, sellPriceGold: 15, minLevel: 1
  },
  {
    itemId: 'potion_mana_great',
    name: 'Greater Mana Potion',
    description: 'Restores 70% of maximum Mana instantly.',
    itemType: 'potion',
    equipSlot: 'none',
    rarityTier: 4,
    rarityName: RARITY_NAMES[4],
    stats: { manaRegen: 70, healMana: 70 },
    asset: { staticPath: '/assets/items/potion_mana_great.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 200, sellPriceGold: 50, minLevel: 10
  },
  {
    itemId: 'food_snaccident',
    name: 'Snaccident',
    description: 'An accidental mix of crunchy nuts and honey. Restores 40 hunger.',
    itemType: 'food',
    equipSlot: 'none',
    rarityTier: 2,
    rarityName: RARITY_NAMES[2],
    stats: { hungerValue: 40, healthRegen: 10, happinessValue: 20 },
    asset: { staticPath: '/assets/items/snaccident.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 30, sellPriceGold: 8, minLevel: 1
  },
  {
    itemId: 'food_chonklette',
    name: 'Chonklette',
    description: 'All the snacks rolled into one chocolate delight. Restores 60 hunger.',
    itemType: 'food',
    equipSlot: 'none',
    rarityTier: 3,
    rarityName: RARITY_NAMES[3],
    stats: { hungerValue: 60, healthRegen: 20, happinessValue: 35 },
    asset: { staticPath: '/assets/items/chonklette.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 75, sellPriceGold: 18, minLevel: 5
  },

  // --- KEYS (GACHA / CHESTS) ---
  {
    itemId: 'key_steel',
    name: 'Steel Key',
    description: 'Opens standard treasure chests and Common/Rare gacha banner.',
    itemType: 'key',
    equipSlot: 'none',
    rarityTier: 2,
    rarityName: RARITY_NAMES[2],
    stats: { keyLevel: 1 },
    asset: { staticPath: '/assets/items/steel_key.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 250, buyPriceDiamonds: 2, sellPriceGold: 50, minLevel: 1
  },
  {
    itemId: 'key_mythical',
    name: 'Mythical Key',
    description: 'Opens enchanted vaults and grants Epic/Legendary/Mythic pulls.',
    itemType: 'key',
    equipSlot: 'none',
    rarityTier: 7,
    rarityName: RARITY_NAMES[7],
    stats: { keyLevel: 2 },
    asset: { staticPath: '/assets/items/mythical_key.png', isAnimated: false, frameCount: 1 },
    buyPriceGold: 1000, buyPriceDiamonds: 10, sellPriceGold: 250, minLevel: 5
  }
];

// 2. PETS ACROSS 4 ROLES & RARITY TIERS
const petsData = [
  {
    petId: 'pet_t1_fennec',
    name: 'Fennec Pup',
    role: 'supporter',
    rarityTier: 1,
    rarityName: RARITY_NAMES[1],
    baseHp: 45,
    baseAtk: 10,
    baseDefPhy: 8,
    baseDefMag: 12,
    baseMana: 50,
    baseAgility: 14,
    activeSkills: [{
      skillId: 'sk_fennec_nip',
      name: 'Nip & Comfort',
      description: 'Nips the foe for minor damage and licks wounds to restore player HP.',
      manaCost: 15,
      damage: 12,
      healing: 20,
      duration: 1,
      cooldownTurns: 0
    }],
    asset: { staticPath: '/assets/pets/fennec.png', isAnimated: false, frameCount: 1 }
  },
  {
    petId: 'pet_t2_leaf_sprout',
    name: 'Leaf Sprout',
    role: 'defender',
    rarityTier: 2,
    rarityName: RARITY_NAMES[2],
    baseHp: 75,
    baseAtk: 12,
    baseDefPhy: 22,
    baseDefMag: 15,
    baseMana: 35,
    baseAgility: 6,
    activeSkills: [{
      skillId: 'sk_leaf_root_guard',
      name: 'Root Guard',
      description: 'Erects wooden brambles to absorb 25 damage for 2 turns.',
      manaCost: 20,
      damage: 0,
      healing: 0,
      duration: 2,
      cooldownTurns: 2
    }],
    asset: { staticPath: '/assets/pets/leaf_sprout.png', isAnimated: false, frameCount: 1 }
  },
  {
    petId: 'pet_t2_emberling',
    name: 'Emberling',
    role: 'attacker',
    rarityTier: 2,
    rarityName: RARITY_NAMES[2],
    baseHp: 50,
    baseAtk: 24,
    baseDefPhy: 12,
    baseDefMag: 14,
    baseMana: 40,
    baseAgility: 12,
    activeSkills: [{
      skillId: 'sk_ember_spit',
      name: 'Ember Spit',
      description: 'Spits a molten fireball dealing 30 fire damage.',
      manaCost: 15,
      damage: 30,
      healing: 0,
      duration: 1,
      cooldownTurns: 0
    }],
    asset: { staticPath: '/assets/pets/emberling.png', isAnimated: false, frameCount: 1 }
  },
  {
    petId: 'pet_t3_shadowcat',
    name: 'Shadowcat',
    role: 'assassin',
    rarityTier: 3,
    rarityName: RARITY_NAMES[3],
    baseHp: 60,
    baseAtk: 38,
    baseDefPhy: 14,
    baseDefMag: 16,
    baseMana: 45,
    baseAgility: 30,
    activeSkills: [{
      skillId: 'sk_cat_pounce',
      name: 'Silent Pounce',
      description: 'Strikes from the shadows with high critical chance.',
      manaCost: 20,
      damage: 48,
      healing: 0,
      duration: 1,
      cooldownTurns: 1
    }],
    asset: { staticPath: '/assets/pets/shadowcat.png', isAnimated: false, frameCount: 1 }
  },
  {
    petId: 'pet_t5_arcania',
    name: 'Arcania',
    role: 'attacker',
    rarityTier: 5,
    rarityName: RARITY_NAMES[5],
    baseHp: 90,
    baseAtk: 75,
    baseDefPhy: 30,
    baseDefMag: 55,
    baseMana: 140,
    baseAgility: 35,
    activeSkills: [
      {
        skillId: 'sk_arcania_blast',
        name: 'Arcane Blast',
        description: 'Launches a devastating bolt of raw magical ether.',
        manaCost: 35,
        damage: 90,
        healing: 0,
        duration: 1,
        cooldownTurns: 0
      },
      {
        skillId: 'sk_arcania_surge',
        name: 'Mana Surge',
        description: 'Channels atmospheric mana, restoring 25 mana to player.',
        manaCost: 40,
        damage: 0,
        healing: 25,
        duration: 1,
        cooldownTurns: 3
      }
    ],
    asset: {
      staticPath: '/assets/pets/arcania.png',
      isAnimated: true,
      spriteSheetPath: '/assets/pets/arcania_sheet.png',
      frameCount: 4,
      frameRate: 6
    }
  },
  {
    petId: 'pet_t5_ironheart',
    name: 'Ironheart',
    role: 'defender',
    rarityTier: 5,
    rarityName: RARITY_NAMES[5],
    baseHp: 180,
    baseAtk: 40,
    baseDefPhy: 110,
    baseDefMag: 60,
    baseMana: 60,
    baseAgility: 18,
    activeSkills: [
      {
        skillId: 'sk_iron_slam',
        name: 'Shield Slam',
        description: 'Bashes the target using its hardened shell, dealing damage based on DEF.',
        manaCost: 25,
        damage: 65,
        healing: 0,
        duration: 1,
        cooldownTurns: 1
      },
      {
        skillId: 'sk_iron_bastion',
        name: 'Defensive Bastion',
        description: 'Shields ally, mitigating 40% of incoming damage for 2 turns.',
        manaCost: 35,
        damage: 0,
        healing: 0,
        duration: 2,
        cooldownTurns: 4
      }
    ],
    asset: {
      staticPath: '/assets/pets/ironheart.png',
      isAnimated: true,
      spriteSheetPath: '/assets/pets/ironheart_sheet.png',
      frameCount: 4,
      frameRate: 6
    }
  },
  {
    petId: 'pet_t5_luminara',
    name: 'Luminara',
    role: 'supporter',
    rarityTier: 5,
    rarityName: RARITY_NAMES[5],
    baseHp: 105,
    baseAtk: 20,
    baseDefPhy: 45,
    baseDefMag: 70,
    baseMana: 130,
    baseAgility: 32,
    activeSkills: [
      {
        skillId: 'sk_lumi_restore',
        name: 'Restoration',
        description: 'Bathes the party in gentle dawn light, healing 45% HP.',
        manaCost: 45,
        damage: 0,
        healing: 60,
        duration: 1,
        cooldownTurns: 2
      },
      {
        skillId: 'sk_lumi_grace',
        name: 'Evasive Grace',
        description: 'Enhances party agility, boosting dodge rate by 25% for 2 turns.',
        manaCost: 30,
        damage: 0,
        healing: 0,
        duration: 2,
        cooldownTurns: 3
      }
    ],
    asset: {
      staticPath: '/assets/pets/luminara.png',
      isAnimated: true,
      spriteSheetPath: '/assets/pets/luminara_sheet.png',
      frameCount: 4,
      frameRate: 6
    }
  },
  {
    petId: 'pet_t5_shadowblade',
    name: 'Shadowblade',
    role: 'assassin',
    rarityTier: 5,
    rarityName: RARITY_NAMES[5],
    baseHp: 85,
    baseAtk: 95,
    baseDefPhy: 40,
    baseDefMag: 35,
    baseMana: 70,
    baseAgility: 80,
    activeSkills: [
      {
        skillId: 'sk_blade_lethal',
        name: 'Lethal Strike',
        description: 'Executes a blinding strike targeting critical pressure points.',
        manaCost: 30,
        damage: 105,
        healing: 0,
        duration: 1,
        cooldownTurns: 0
      },
      {
        skillId: 'sk_blade_counter',
        name: 'Counter Stance',
        description: 'Prepares to deflect the next attack and retaliate for 60 physical damage.',
        manaCost: 25,
        damage: 60,
        healing: 0,
        duration: 1,
        cooldownTurns: 2
      }
    ],
    asset: {
      staticPath: '/assets/pets/shadowblade.png',
      isAnimated: true,
      spriteSheetPath: '/assets/pets/shadowblade_sheet.png',
      frameCount: 4,
      frameRate: 6
    }
  },
  {
    petId: 'pet_t7_frost_titan',
    name: 'Frost Titan',
    role: 'defender',
    rarityTier: 7,
    rarityName: RARITY_NAMES[7],
    baseHp: 280,
    baseAtk: 70,
    baseDefPhy: 175,
    baseDefMag: 110,
    baseMana: 90,
    baseAgility: 25,
    activeSkills: [{
      skillId: 'sk_frost_barricade',
      name: 'Glacial Barricade',
      description: 'Creates a fortress of permanent ice, absorbing 150 damage.',
      manaCost: 50,
      damage: 40,
      healing: 0,
      duration: 3,
      cooldownTurns: 4
    }],
    asset: {
      staticPath: '/assets/pets/frost_titan.png',
      isAnimated: true,
      spriteSheetPath: '/assets/pets/frost_titan_sheet.png',
      frameCount: 6,
      frameRate: 8
    }
  },
  {
    petId: 'pet_t7_astral_phoenix',
    name: 'Astral Phoenix',
    role: 'supporter',
    rarityTier: 7,
    rarityName: RARITY_NAMES[7],
    baseHp: 190,
    baseAtk: 60,
    baseDefPhy: 75,
    baseDefMag: 130,
    baseMana: 210,
    baseAgility: 65,
    activeSkills: [{
      skillId: 'sk_phoenix_rebirth',
      name: 'Rebirth Flame',
      description: 'Channels stellar flames to heal 120 HP and burn all active debuffs.',
      manaCost: 75,
      damage: 30,
      healing: 120,
      duration: 1,
      cooldownTurns: 3
    }],
    asset: {
      staticPath: '/assets/pets/astral_phoenix.png',
      isAnimated: true,
      spriteSheetPath: '/assets/pets/astral_phoenix_sheet.png',
      frameCount: 6,
      frameRate: 8
    }
  },
  {
    petId: 'pet_t9_void_stalker',
    name: 'Void Stalker',
    role: 'assassin',
    rarityTier: 9,
    rarityName: RARITY_NAMES[9],
    baseHp: 240,
    baseAtk: 220,
    baseDefPhy: 95,
    baseDefMag: 90,
    baseMana: 160,
    baseAgility: 145,
    activeSkills: [{
      skillId: 'sk_void_rend',
      name: 'Nether Rend',
      description: 'Tears through spacetime to hit the enemy for 260 unmitigated void damage.',
      manaCost: 65,
      damage: 260,
      healing: 0,
      duration: 1,
      cooldownTurns: 1
    }],
    asset: {
      staticPath: '/assets/pets/void_stalker.png',
      isAnimated: true,
      spriteSheetPath: '/assets/pets/void_stalker_sheet.png',
      frameCount: 6,
      frameRate: 10
    }
  },
  {
    petId: 'pet_t10_chronos_dragon',
    name: 'Chronos Dragon',
    role: 'attacker',
    rarityTier: 10,
    rarityName: RARITY_NAMES[10],
    baseHp: 420,
    baseAtk: 360,
    baseDefPhy: 200,
    baseDefMag: 210,
    baseMana: 320,
    baseAgility: 130,
    activeSkills: [{
      skillId: 'sk_chronos_supernova',
      name: 'Temporal Supernova',
      description: 'Unleashes an apocalypse of rewound time, dealing 480 damage across spacetime.',
      manaCost: 110,
      damage: 480,
      healing: 0,
      duration: 1,
      cooldownTurns: 2
    }],
    asset: {
      staticPath: '/assets/pets/chronos_dragon.png',
      isAnimated: true,
      spriteSheetPath: '/assets/pets/chronos_dragon_sheet.png',
      frameCount: 8,
      frameRate: 10
    }
  }
];

// 3. QUEST TEMPLATES (Daily, Weekly, Monthly, Bounty)
const questsData = [
  // --- DAILY QUESTS ---
  {
    questId: 'quest_daily_login',
    name: 'Daily Adventurer Check-in',
    description: 'Log in to PixmonMMO today and claim your daily ration.',
    repeatType: 'daily',
    requirementType: 'login',
    requirementTarget: 1,
    xpReward: 50,
    goldReward: 30,
    diamondReward: 1,
    levelRequired: 1
  },
  {
    questId: 'quest_daily_steps_10',
    name: 'Scout the Wilds',
    description: 'Take at least 10 exploration steps in the adventure realm.',
    repeatType: 'daily',
    requirementType: 'steps',
    requirementTarget: 10,
    xpReward: 75,
    goldReward: 50,
    diamondReward: 1,
    levelRequired: 1
  },
  {
    questId: 'quest_daily_steps_30',
    name: 'Expedition March',
    description: 'Take 30 exploration steps in the adventure realm.',
    repeatType: 'daily',
    requirementType: 'steps',
    requirementTarget: 30,
    xpReward: 120,
    goldReward: 90,
    diamondReward: 2,
    levelRequired: 1
  },
  {
    questId: 'quest_daily_battle_win',
    name: 'Wild Skirmish',
    description: 'Win 1 turn-based battle against a wild Pixmon beast.',
    repeatType: 'daily',
    requirementType: 'battle_win',
    requirementTarget: 1,
    xpReward: 100,
    goldReward: 75,
    diamondReward: 2,
    levelRequired: 1
  },
  {
    questId: 'quest_daily_dungeon_enter',
    name: 'Dungeon Incursion',
    description: 'Spend 1 energy and clear a dungeon exploration session.',
    repeatType: 'daily',
    requirementType: 'dungeon_clear',
    requirementTarget: 1,
    xpReward: 150,
    goldReward: 120,
    diamondReward: 3,
    levelRequired: 1
  },
  {
    questId: 'quest_daily_item_consume',
    name: 'Field Sustenance',
    description: 'Consume 2 food or potion items from your inventory.',
    repeatType: 'daily',
    requirementType: 'item_craft',
    requirementTarget: 2,
    xpReward: 60,
    goldReward: 40,
    diamondReward: 1,
    levelRequired: 1
  },

  // --- WEEKLY QUESTS ---
  {
    questId: 'quest_weekly_steps_200',
    name: 'Grand March of the Week',
    description: 'Accumulate 200 exploration steps across the week.',
    repeatType: 'weekly',
    requirementType: 'steps',
    requirementTarget: 200,
    xpReward: 600,
    goldReward: 500,
    diamondReward: 10,
    levelRequired: 3
  },
  {
    questId: 'quest_weekly_battles_15',
    name: 'Vanguard Exterminator',
    description: 'Defeat 15 monster encounters in dungeons or combat arena.',
    repeatType: 'weekly',
    requirementType: 'battle_win',
    requirementTarget: 15,
    xpReward: 800,
    goldReward: 700,
    diamondReward: 15,
    levelRequired: 3
  },
  {
    questId: 'quest_weekly_dungeons_7',
    name: 'Catacomb Vanquisher',
    description: 'Successfully complete 7 dungeon sessions.',
    repeatType: 'weekly',
    requirementType: 'dungeon_clear',
    requirementTarget: 7,
    xpReward: 1000,
    goldReward: 1000,
    diamondReward: 20,
    levelRequired: 5
  },
  {
    questId: 'quest_weekly_gold_2500',
    name: 'Mercenary Coffers',
    description: 'Earn 2,500 gold through battles, quests, or shop sales.',
    repeatType: 'weekly',
    requirementType: 'gold_earn',
    requirementTarget: 2500,
    xpReward: 750,
    goldReward: 600,
    diamondReward: 12,
    levelRequired: 3
  },

  // --- MONTHLY QUESTS ---
  {
    questId: 'quest_monthly_steps_800',
    name: 'Pioneer of the Continent',
    description: 'Take 800 total exploration steps throughout the month.',
    repeatType: 'monthly',
    requirementType: 'steps',
    requirementTarget: 800,
    xpReward: 3000,
    goldReward: 3000,
    diamondReward: 50,
    levelRequired: 5
  },
  {
    questId: 'quest_monthly_battles_60',
    name: 'Legend of the Colosseum',
    description: 'Win 60 combat victories against monsters.',
    repeatType: 'monthly',
    requirementType: 'battle_win',
    requirementTarget: 60,
    xpReward: 4000,
    goldReward: 4500,
    diamondReward: 75,
    levelRequired: 5
  },
  {
    questId: 'quest_monthly_dungeons_25',
    name: 'Lord of the Catacombs',
    description: 'Conquer 25 randomized dungeon runs.',
    repeatType: 'monthly',
    requirementType: 'dungeon_clear',
    requirementTarget: 25,
    xpReward: 5000,
    goldReward: 6000,
    diamondReward: 100,
    levelRequired: 10
  },
  {
    questId: 'quest_monthly_gacha_15',
    name: 'Fate Weaver',
    description: 'Perform 15 gacha summons to expand your collection.',
    repeatType: 'monthly',
    requirementType: 'catch_pet',
    requirementTarget: 15,
    xpReward: 3500,
    goldReward: 2500,
    diamondReward: 40,
    levelRequired: 5
  },

  // --- BOUNTY QUESTS ---
  {
    questId: 'quest_bounty_beast_pack',
    name: 'Bounty: Feral Wolfpack',
    description: 'Track down and neutralize 3 rabid wild packs.',
    repeatType: 'bounty',
    requirementType: 'battle_win',
    requirementTarget: 3,
    xpReward: 220,
    goldReward: 180,
    diamondReward: 4,
    levelRequired: 1,
    questPointsRequired: 1
  },
  {
    questId: 'quest_bounty_crypt_gargoyle',
    name: 'Bounty: Stone Gargoyle',
    description: 'Shatter the sentinel gargoyle roosting in the dungeon entrance.',
    repeatType: 'bounty',
    requirementType: 'battle_win',
    requirementTarget: 1,
    xpReward: 450,
    goldReward: 400,
    diamondReward: 8,
    levelRequired: 10,
    questPointsRequired: 2
  }
];

// 4. SHOP CATALOG ENTRIES
const shopCatalogData = [
  { itemId: 'potion_hp_small', buyPriceGold: 50, buyPriceDiamonds: 0, isAvailable: true, minLevel: 1, category: 'potions' },
  { itemId: 'potion_hp_great', buyPriceGold: 180, buyPriceDiamonds: 0, isAvailable: true, minLevel: 10, category: 'potions' },
  { itemId: 'potion_mana_small', buyPriceGold: 60, buyPriceDiamonds: 0, isAvailable: true, minLevel: 1, category: 'potions' },
  { itemId: 'potion_mana_great', buyPriceGold: 200, buyPriceDiamonds: 0, isAvailable: true, minLevel: 10, category: 'potions' },
  { itemId: 'food_snaccident', buyPriceGold: 30, buyPriceDiamonds: 0, isAvailable: true, minLevel: 1, category: 'food' },
  { itemId: 'food_chonklette', buyPriceGold: 75, buyPriceDiamonds: 0, isAvailable: true, minLevel: 5, category: 'food' },
  { itemId: 'key_steel', buyPriceGold: 250, buyPriceDiamonds: 2, isAvailable: true, minLevel: 1, category: 'keys' },
  { itemId: 'key_mythical', buyPriceGold: 1000, buyPriceDiamonds: 10, isAvailable: true, minLevel: 5, category: 'keys' },
  { itemId: 'wpn_t1_crude_club', buyPriceGold: 60, buyPriceDiamonds: 0, isAvailable: true, minLevel: 1, category: 'equipment' },
  { itemId: 'wpn_t2_iron_sword', buyPriceGold: 220, buyPriceDiamonds: 0, isAvailable: true, minLevel: 5, category: 'equipment' },
  { itemId: 'arm_t1_tattered_tunic', buyPriceGold: 50, buyPriceDiamonds: 0, isAvailable: true, minLevel: 1, category: 'equipment' },
  { itemId: 'arm_t2_leather_jerkin', buyPriceGold: 180, buyPriceDiamonds: 0, isAvailable: true, minLevel: 5, category: 'equipment' },
  { itemId: 'tool_t1_stone_pickaxe', buyPriceGold: 80, buyPriceDiamonds: 0, isAvailable: true, minLevel: 1, category: 'equipment' },
  { itemId: 'tool_t3_iron_pickaxe', buyPriceGold: 450, buyPriceDiamonds: 0, isAvailable: true, minLevel: 10, category: 'equipment' }
];

// 5. INTERACTIVE NPCS
const npcsData = [
  {
    npcId: 'npc_blacksmith',
    name: 'Goran Ironbender',
    title: 'Master Forgemaster of the Red Hearth',
    role: 'blacksmith',
    portraitAsset: '/assets/npcs/blacksmith_goran.png',
    portraitUrl: '/assets/npcs/blacksmith_goran.png',
    dialogue: [
      {
        dialogueId: 'd_blacksmith_intro',
        prompt: 'Greetings, stranger! Need steel that will not snap against a drake skull?',
        response: 'I work day and night at this forge. 10 tiers of craftsmanship have passed through these hands — from crude wooden clubs up to the legendary Transcendent blades imbued with celestial stars.',
        actions: [
          { label: 'Browse Weapons & Armor', actionType: 'open_shop', actionTarget: 'equipment' },
          { label: 'Ask About Equipment Tiers', actionType: 'show_info', actionTarget: 'tiers' },
          { label: 'Farewell', actionType: 'close', actionTarget: '' }
        ]
      }
    ]
  },
  {
    npcId: 'npc_alchemist',
    name: 'Elian Silverdew',
    title: 'Grand Apothecary & Herbalist',
    role: 'alchemist',
    portraitAsset: '/assets/npcs/alchemist_elian.png',
    portraitUrl: '/assets/npcs/alchemist_elian.png',
    dialogue: [
      {
        dialogueId: 'd_alchemist_intro',
        prompt: 'The vapors of mandrake and moonberry fill the air. What brings you to my laboratory?',
        response: 'Never step into the dark dungeons without health and mana draughts in your satchel. The beasts strike fast, but alchemy restores life in a heartbeat.',
        actions: [
          { label: 'Buy Potions & Food', actionType: 'open_shop', actionTarget: 'consumables' },
          { label: 'Ask About Pet Nutrition', actionType: 'show_info', actionTarget: 'pet_food' },
          { label: 'Depart', actionType: 'close', actionTarget: '' }
        ]
      }
    ]
  },
  {
    npcId: 'npc_guildmaster',
    name: 'Commander Vane',
    title: 'Guildmaster of the Pixmon Vanguard',
    role: 'guildmaster',
    portraitAsset: '/assets/npcs/guildmaster_vane.png',
    portraitUrl: '/assets/npcs/guildmaster_vane.png',
    dialogue: [
      {
        dialogueId: 'd_guildmaster_intro',
        prompt: 'Stand straight, recruit! The realm is beset by dungeon rifts and ravenous beasts.',
        response: 'The Guild keeps records of every adventurer. Complete your Daily duties, fulfill Weekly contracts, and take on dangerous Bounties to earn gold, XP, and diamonds.',
        actions: [
          { label: 'View Available Quests', actionType: 'navigate', actionTarget: '/quests' },
          { label: 'Claim Bounty Contracts', actionType: 'navigate', actionTarget: '/quests?tab=bounty' },
          { label: 'Dismissed', actionType: 'close', actionTarget: '' }
        ]
      }
    ]
  },
  {
    npcId: 'npc_mystic',
    name: 'Lady Aurelia',
    title: 'Seer of the Astral Rift',
    role: 'mystic',
    portraitAsset: '/assets/npcs/mystic_aurelia.png',
    portraitUrl: '/assets/npcs/mystic_aurelia.png',
    dialogue: [
      {
        dialogueId: 'd_mystic_intro',
        prompt: 'The stars whisper your arrival, traveler. Can you feel the psychic resonance of the spirits?',
        response: 'Pixmon are not mere familiars; they fight alongside you in the arena, unleashing powerful combat skills. Through the Astral Gacha, higher tier pets awaken with radiant animations and celestial might.',
        actions: [
          { label: 'Open Gacha Summoning', actionType: 'navigate', actionTarget: '/gacha' },
          { label: 'Visit Pet Sanctuary', actionType: 'navigate', actionTarget: '/pets' },
          { label: 'Fade Away', actionType: 'close', actionTarget: '' }
        ]
      }
    ]
  }
];

// Seed execution engine using bulkWrite with upsert
async function seedDatabase() {
  const { connectDB } = require('../backend/config/mongodb');
  await connectDB();

  const itemOps = itemsData.map(item => ({
    updateOne: {
      filter: { itemId: item.itemId },
      update: { $set: item },
      upsert: true
    }
  }));
  await ItemTemplate.bulkWrite(itemOps);

  const petOps = petsData.map(pet => ({
    updateOne: {
      filter: { petId: pet.petId },
      update: { $set: pet },
      upsert: true
    }
  }));
  await PetTemplate.bulkWrite(petOps);

  const questOps = questsData.map(quest => ({
    updateOne: {
      filter: { questId: quest.questId },
      update: { $set: quest },
      upsert: true
    }
  }));
  await QuestTemplate.bulkWrite(questOps);

  const shopOps = shopCatalogData.map(entry => ({
    updateOne: {
      filter: { itemId: entry.itemId },
      update: { $set: entry },
      upsert: true
    }
  }));
  await ShopCatalog.bulkWrite(shopOps);

  const npcOps = npcsData.map(npc => ({
    updateOne: {
      filter: { npcId: npc.npcId },
      update: { $set: npc },
      upsert: true
    }
  }));
  await Npc.bulkWrite(npcOps);

  return {
    itemsCount: await ItemTemplate.countDocuments(),
    petsCount: await PetTemplate.countDocuments(),
    questsCount: await QuestTemplate.countDocuments(),
    shopCount: await ShopCatalog.countDocuments(),
    npcsCount: await Npc.countDocuments()
  };
}

if (require.main === module) {
  seedDatabase()
    .then(async (counts) => {
      const { disconnectDB } = require('../backend/config/mongodb');
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (error) => {
      const { disconnectDB } = require('../backend/config/mongodb');
      try { await disconnectDB(); } catch (_) {}
      process.exit(1);
    });
}

module.exports = {
  seedDatabase,
  itemsData,
  petsData,
  questsData,
  shopCatalogData,
  npcsData
};
