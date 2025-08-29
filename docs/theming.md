# HabitStory Theming System

## Overview

HabitStory features a unique dual UI theme system that allows users to switch between three distinct visual experiences:

1. **Terminal Green** - Matrix-inspired black background with bright green text
2. **Terminal White** - Clean monospace terminal with white text
3. **Notebook** - Skeuomorphic lined paper design reminiscent of early iPhone Notes

## Usage

### Switching Themes

Users can switch themes in three ways:

1. **Theme Toggle Button** - Click the theme icon in the navigation
2. **Keyboard Shortcut** - Press `Ctrl/Cmd + Shift + T` to cycle themes
3. **URL Parameter** - Add `?theme=terminalGreen|terminalWhite|notebook` to any URL

### Theme Persistence

The selected theme is automatically saved to localStorage and persists across sessions.

## Implementation

### CSS Variables

The theme system uses CSS custom properties (variables) for all colors:

```css
/* Core theme variables */
--bg: Background color
--text: Primary text color
--muted: Muted/secondary text
--accent: Accent/highlight color
--card: Card background
--border: Border color
```

### Component Integration

All components automatically adapt to the current theme through CSS variables:

```tsx
// Use theme-aware classes
<div className="bg-[var(--card)] text-[var(--text)] border-[var(--border)]">
  Content
</div>

// Or use utility classes
<div className="bg-theme-card text-theme border-theme">
  Content
</div>
```

## ASCII Art System

### Creating ASCII Art

ASCII art is stored in the `/src/ascii/` directory, organized by category:

- `houses.ts` - Archetype house emblems
- `badges.ts` - Achievement and streak badges
- `ui.ts` - UI elements and empty states

### Using ASCII Art

```tsx
import { AsciiArt } from '@/components/AsciiArt';
import { HOUSE_MONK } from '@/ascii';

// Basic usage
<AsciiArt
  ascii={HOUSE_MONK}
  label="Monk House"
  variant="display"
/>

// With animation
<AnimatedAsciiArt
  frames={BREATHING_ANIMATION}
  fps={1}
  variant="display"
/>
```

### ASCII Art Guidelines

1. **Keep it Simple** - ASCII art should be legible at different sizes
2. **Test in All Themes** - Ensure visibility in both terminal and notebook themes
3. **Provide Fallbacks** - Always include aria-label for accessibility
4. **Use Monospace** - ASCII art requires monospace fonts for proper alignment

## Adding New ASCII Art

1. Create your ASCII art using a monospace editor
2. Add it to the appropriate file in `/src/ascii/`
3. Export it with a descriptive name
4. Test in all three themes
5. Add to the main exports in `/src/ascii/index.ts`

Example:
```typescript
// In /src/ascii/badges.ts
export const NEW_BADGE = `
  ___
 /   \\
| NEW |
 \\___/
`;

// In /src/ascii/index.ts
export { NEW_BADGE } from './badges';
```

## Theme-Specific Features

### Terminal Themes
- Monospace font throughout
- Subtle scanline effect
- High contrast colors
- Matrix-style character support

### Notebook Theme
- Lined paper background (CSS-only)
- Warm paper color palette
- Margin line on the left
- Soft shadows on cards

## Accessibility

- All themes maintain WCAG 2.1 AA contrast ratios
- High contrast mode available for Terminal Green theme
- Respects `prefers-reduced-motion` for animations
- ASCII art includes proper ARIA labels

## Performance

- No external image assets
- CSS-only backgrounds
- Minimal JavaScript for theme switching
- Efficient ASCII rendering with React memoization

## Future Enhancements

- Custom theme creator
- Seasonal themes
- House-specific theme variants
- Community ASCII art contributions