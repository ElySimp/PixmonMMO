/**
 * PixmonMMO Rarity & Tier System (Tiers 1 to 10)
 * Tiers 1-8: Static assets with distinctive tier color schemes and glowing borders
 * Tier 9: Eldritch — 4-frame looping spritesheet animation with cosmic void pulse
 * Tier 10: Transcendent — 6-frame looping spritesheet animation with genesis gold aura
 */

export const RARITY_TIERS = {
  1: {
    tier: 1,
    name: 'Crude',
    color: '#8C8C8C',
    bg: 'rgba(140, 140, 140, 0.15)',
    border: '#8C8C8C',
    glow: 'rgba(140, 140, 140, 0.4)',
    animated: false,
    frames: 0
  },
  2: {
    tier: 2,
    name: 'Sturdy',
    color: '#4CAF50',
    bg: 'rgba(76, 175, 80, 0.15)',
    border: '#4CAF50',
    glow: 'rgba(76, 175, 80, 0.4)',
    animated: false,
    frames: 0
  },
  3: {
    tier: 3,
    name: 'Tempered',
    color: '#2196F3',
    bg: 'rgba(33, 150, 243, 0.15)',
    border: '#2196F3',
    glow: 'rgba(33, 150, 243, 0.4)',
    animated: false,
    frames: 0
  },
  4: {
    tier: 4,
    name: 'Runic',
    color: '#9C27B0',
    bg: 'rgba(156, 39, 176, 0.15)',
    border: '#9C27B0',
    glow: 'rgba(156, 39, 176, 0.4)',
    animated: false,
    frames: 0
  },
  5: {
    tier: 5,
    name: 'Abyssal',
    color: '#E91E63',
    bg: 'rgba(233, 30, 99, 0.15)',
    border: '#E91E63',
    glow: 'rgba(233, 30, 99, 0.4)',
    animated: false,
    frames: 0
  },
  6: {
    tier: 6,
    name: 'Radiant',
    color: '#FF9800',
    bg: 'rgba(255, 152, 0, 0.15)',
    border: '#FF9800',
    glow: 'rgba(255, 152, 0, 0.4)',
    animated: false,
    frames: 0
  },
  7: {
    tier: 7,
    name: 'Dragonforged',
    color: '#FF5722',
    bg: 'rgba(255, 87, 34, 0.15)',
    border: '#FF5722',
    glow: 'rgba(255, 87, 34, 0.4)',
    animated: false,
    frames: 0
  },
  8: {
    tier: 8,
    name: 'Astral',
    color: '#00E5FF',
    bg: 'rgba(0, 229, 255, 0.15)',
    border: '#00E5FF',
    glow: 'rgba(0, 229, 255, 0.4)',
    animated: false,
    frames: 0
  },
  9: {
    tier: 9,
    name: 'Eldritch',
    color: '#B388FF',
    bg: 'rgba(179, 136, 255, 0.2)',
    border: '#B388FF',
    glow: 'rgba(179, 136, 255, 0.7)',
    animated: true,
    frames: 4,
    animationClass: 'spritesheet-anim-4frame'
  },
  10: {
    tier: 10,
    name: 'Transcendent',
    color: '#FFD700',
    bg: 'rgba(255, 215, 0, 0.2)',
    border: '#FFD700',
    glow: 'rgba(255, 215, 0, 0.85)',
    animated: true,
    frames: 6,
    animationClass: 'spritesheet-anim-6frame'
  }
};

export const getRarityInfo = (tierOrName) => {
  if (typeof tierOrName === 'number') {
    return RARITY_TIERS[tierOrName] || RARITY_TIERS[1];
  }

  const normalized = String(tierOrName || '').toLowerCase().trim();
  for (const info of Object.values(RARITY_TIERS)) {
    if (info.name.toLowerCase() === normalized) {
      return info;
    }
  }

  // Fallbacks for legacy labels
  if (normalized.includes('legendary') || normalized.includes('mythic')) return RARITY_TIERS[10];
  if (normalized.includes('epic')) return RARITY_TIERS[7];
  if (normalized.includes('rare')) return RARITY_TIERS[5];
  if (normalized.includes('uncommon')) return RARITY_TIERS[3];

  return RARITY_TIERS[1];
};
