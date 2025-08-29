/**
 * Central ASCII Art Library
 */

// Re-export all ASCII collections
export * from './houses';
export * from './badges';
export * from './ui';

// Common ASCII art for easy access
export { BADGE_STAR as BadgeStar } from './badges';
export { BADGE_TROPHY as Trophy } from './badges';
export { BADGE_MEDAL as Medal } from './badges';
export { AVATAR_DEFAULT as AvatarDefault } from './ui';
export { AVATAR_MEDITATION as Meditation } from './ui';
export { CHECK_ASCII as Checkmark } from './ui';
export { WARNING as Warning } from './ui';

// Utility function to get house ASCII by key
import { HOUSES, HOUSES_MINI } from './houses';

export function getHouseAscii(house: string, mini: boolean = false): string {
  const houseKey = house.toUpperCase();
  if (mini) {
    return HOUSES_MINI[houseKey as keyof typeof HOUSES_MINI] || HOUSES_MINI.MONK;
  }
  return HOUSES[houseKey as keyof typeof HOUSES] || HOUSES.MONK;
}

// ASCII animations
export const BREATHING_ANIMATION = [
  `
  ( o.o )
   > ^ <
  /|   |\\
   |   |
  `,
  `
  ( o.o )
   > ^ <
 / |   | \\
   |   |
  `,
  `
  ( o.o )
   > ^ <
/  |   |  \\
   |   |
  `,
  `
  ( o.o )
   > ^ <
 \\ |   | /
   |   |
  `,
];

export const CELEBRATION_FRAMES = [
  `
    \\o/
     |
    / \\
  `,
  `
     o
    /|\\
    / \\
  `,
  `
    \\o/
     |
    / \\
  `,
  `
     o
    /|\\
    / \\
  `,
];

export const STREAK_FIRE_ANIMATION = [
  `
   )
  ((
 ((()
((()))
 ||||
  `,
  `
   ))
  (()
 ((())
((()))
 ||||
  `,
  `
  )))
  (((
 ((())
((()))
 ||||
  `,
  `
   ))
  (()
 ((())
((()))
 ||||
  `,
];

// Special effects
export const SPARKLE_BURST = `
    .  *  .
  *  \\|/  *
    --*--
  *  /|\\  *
    ·  ·  ·
`;

export const COMPLETION_BURST = `
     \\  |  /
   ___\\___/___
  ----( ✓ )----
   ‾‾‾/‾‾‾\\‾‾‾
     /  |  \\
`;

// Terminal effects
export const TERMINAL_PROMPT = `> `;
export const TERMINAL_CURSOR = `█`;
export const TERMINAL_CURSOR_BLINK = [`█`, `_`];

// Matrix rain characters (for terminal theme)
export const MATRIX_CHARS = '日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ012345789Z:・."=*+-<>¦｜╌';