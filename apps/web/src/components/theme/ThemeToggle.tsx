'use client';

import { useEffect } from 'react';
import { useTheme, Theme } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Monitor, Palette, Terminal } from 'lucide-react';

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: 'terminalGreen',
    label: 'Terminal (Green)',
    icon: <Terminal className="w-4 h-4 text-green-500" />,
  },
  {
    value: 'terminalWhite',
    label: 'Terminal (White)',
    icon: <Terminal className="w-4 h-4" />,
  },
  {
    value: 'notebook',
    label: 'Notebook',
    icon: <Monitor className="w-4 h-4 text-amber-600" />,
  },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const currentTheme = THEME_OPTIONS.find(t => t.value === theme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {currentTheme?.icon || <Palette className="w-4 h-4" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEME_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
            className="cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {option.icon}
              {option.label}
            </span>
            {theme === option.value && (
              <span className="ml-auto text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Keyboard shortcut component
export function ThemeKeyboardShortcut() {
  const { toggleTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + T
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  return null;
}