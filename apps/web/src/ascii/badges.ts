/**
 * ASCII Art for Badges and Achievements
 */

export const BADGE_STAR = `
     /\\
    /  \\
 ___\\__/___
 \\  /  \\  /
  \\/____\\/
`;

export const BADGE_STAR_MINI = `★`;

export const BADGE_TROPHY = `
   _______
  /_____ /|
 /_____ / |
 |  _  |  |
 | |_| |  |
 |_____|  |
 (_____)  /
  \\_____\\/
`;

export const BADGE_MEDAL = `
    ___
   /   \\
  | 1st |
   \\___/
     |
   __|__
`;

export const BADGE_MEDAL_MINI = `🏅`;
export const BADGE_MEDAL_ASCII = `◉`;

export const BADGE_CHECK = `
      ___
     /   \\
    |  ✓  |
     \\___/
`;

export const BADGE_CHECK_ASCII = `
      ___
     /   \\
    |  V  |
     \\___/
`;

export const BADGE_CROWN = `
  ♔♔♔
 \\___/
`;

export const BADGE_CROWN_ASCII = `
  VVV
 \\___/
`;

export const BADGE_FLAME = `
   )
  ((
 ((()
((()))
 ||||
`;

export const BADGE_HEART = `
  ♥ ♥
 \\   /
  \\ /
   V
`;

export const BADGE_HEART_ASCII = `
  * *
 \\   /
  \\ /
   V
`;

// Streak badges
export const STREAK_7_DAYS = `
╔═══════╗
║ WEEK! ║
║ ██████║
║   7   ║
╚═══════╝
`;

export const STREAK_30_DAYS = `
╔═══════╗
║ MONTH ║
║ ██████║
║  30!  ║
╚═══════╝
`;

export const STREAK_100_DAYS = `
╔═══════╗
║ EPIC! ║
║ ██████║
║  100  ║
╚═══════╝
`;

// Achievement frames
export const FRAME_SIMPLE = (content: string) => `
┌─────────┐
│${content.padEnd(9, ' ')}│
└─────────┘
`;

export const FRAME_DOUBLE = (content: string) => `
╔═════════╗
║${content.padEnd(9, ' ')}║
╚═════════╝
`;

export const FRAME_ORNATE = (content: string) => `
◆═══════◆
║${content.padEnd(9, ' ')}║
◆═══════◆
`;

// Progress indicators
export const PROGRESS_EMPTY = `[          ]`;
export const PROGRESS_25 = `[██        ]`;
export const PROGRESS_50 = `[█████     ]`;
export const PROGRESS_75 = `[███████   ]`;
export const PROGRESS_FULL = `[██████████]`;

// Level badges
export const LEVEL_BADGES = {
  1: `[LV.1]`,
  5: `[LV.5]`,
  10: `<LV.10>`,
  25: `«LV.25»`,
  50: `◆LV.50◆`,
  100: `★LV.100★`,
};