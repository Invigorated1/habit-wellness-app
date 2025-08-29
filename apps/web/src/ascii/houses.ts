/**
 * ASCII Art for HabitStory Houses
 */

export const HOUSE_MONK = `
    _._
   / _ \\
  | (_) |
   \\___/
    |*|
   /| |\\
`;

export const HOUSE_WARRIOR_MONK = `
    /\\
   /  \\
  | ⚔️ |
  |    |
  /____\\
`;

// Alternative without emoji
export const HOUSE_WARRIOR_MONK_ASCII = `
    /\\
   /  \\
  |>--<|
  |    |
  /____\\
`;

export const HOUSE_SAGE = `
   ___
  /   \\
 | o.o |
 |  >  |
 |\\___/|
  \\___/
`;

export const HOUSE_ARTISAN = `
    ___
   /   \\
  | ♦ ♦ |
  |  ~  |
  |\\___/|
   \\___/
`;

// Alternative without special chars
export const HOUSE_ARTISAN_ASCII = `
    ___
   /   \\
  | * * |
  |  ~  |
  |\\___/|
   \\___/
`;

export const HOUSE_OPERATIVE = `
  _____
 [     ]
 | >_< |
 |_____|
  |||||
`;

export const HOUSE_COUNCILOR = `
   ___
  /   \\
 | - - |
 |  ^  |
 |\\_-_/|
  \\___/
`;

// Simplified versions for inline use
export const HOUSE_MONK_MINI = `◯`;
export const HOUSE_WARRIOR_MONK_MINI = `⚔`;
export const HOUSE_SAGE_MINI = `◉`;
export const HOUSE_ARTISAN_MINI = `◆`;
export const HOUSE_OPERATIVE_MINI = `▣`;
export const HOUSE_COUNCILOR_MINI = `☆`;

// House banners
export const HOUSE_BANNER_MONK = `
╔══════════════╗
║     MONK     ║
║      ◯       ║
║   _/   \\_   ║
╚══════════════╝
`;

export const HOUSE_BANNER_WARRIOR_MONK = `
╔══════════════╗
║ WARRIOR-MONK ║
║      /\\      ║
║     >--<     ║
╚══════════════╝
`;

// Map for easy access
export const HOUSES = {
  MONK: HOUSE_MONK,
  WARRIOR_MONK: HOUSE_WARRIOR_MONK,
  SAGE: HOUSE_SAGE,
  ARTISAN: HOUSE_ARTISAN,
  OPERATIVE: HOUSE_OPERATIVE,
  COUNCILOR: HOUSE_COUNCILOR,
};

export const HOUSES_MINI = {
  MONK: HOUSE_MONK_MINI,
  WARRIOR_MONK: HOUSE_WARRIOR_MONK_MINI,
  SAGE: HOUSE_SAGE_MINI,
  ARTISAN: HOUSE_ARTISAN_MINI,
  OPERATIVE: HOUSE_OPERATIVE_MINI,
  COUNCILOR: HOUSE_COUNCILOR_MINI,
};