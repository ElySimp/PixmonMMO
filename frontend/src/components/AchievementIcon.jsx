import React from 'react';
import './AchievementIcon.css';

// Import icons
import footprintsIcon from '../assets/achievements/footprints.png';
import compassIcon from '../assets/achievements/compass.png';
import mapIcon from '../assets/achievements/map.png';
import mountainIcon from '../assets/achievements/mountain.png';
import levelStarIcon from '../assets/achievements/level_star.png';
import moneyBagIcon from '../assets/achievements/money_bag.png';
import treasureIcon from '../assets/achievements/treasure.png';
import crownIcon from '../assets/achievements/crown.png';
import pixballIcon from '../assets/achievements/pixball.png';
import pixdexIcon from '../assets/achievements/pixdex.png';

// Default icon to use if the specified one isn't found
import defaultIcon from '../assets/achievements/default_achievement.png';

const AchievementIcon = ({ iconName, completed = false, size = 'medium', pulse = false }) => {
  // Icon mapping
  const iconMap = {
    footprints: footprintsIcon,
    compass: compassIcon,
    map: mapIcon,
    mountain: mountainIcon,
    level_star: levelStarIcon,
    money_bag: moneyBagIcon,
    treasure: treasureIcon,
    crown: crownIcon,
    pixball: pixballIcon,
    pixdex: pixdexIcon
  };

  // Select the appropriate icon or fall back to default
  const iconSrc = iconMap[iconName] || defaultIcon;

  // Determine classes based on props
  const sizeClasses = {
    small: 'achievement-icon-small',
    medium: 'achievement-icon-medium',
    large: 'achievement-icon-large'
  };

  const iconClass = `achievement-icon ${sizeClasses[size] || sizeClasses.medium} ${
    completed ? 'completed' : 'locked'
  } ${pulse ? 'pulse' : ''}`;

  return (
    <div className={iconClass}>
      <img src={iconSrc} alt={`${iconName} icon`} />
      {!completed && <div className="lock-overlay"></div>}
    </div>
  );
};

export default AchievementIcon;
