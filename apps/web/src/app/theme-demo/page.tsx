'use client';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AsciiArt, AnimatedAsciiArt, AsciiProgress, AsciiSpinner } from '@/components/AsciiArt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import * as ASCII from '@/ascii';
import { useTheme } from '@/components/theme/ThemeProvider';

export default function ThemeDemoPage() {
  const { theme } = useTheme();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">HabitStory Theme Demo</h1>
          <p className="text-muted-foreground">
            Experience the dual UI themes: Terminal & Notebook
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Current Theme Display */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current Theme: {theme}</CardTitle>
          <CardDescription>
            Use Ctrl/Cmd + Shift + T to cycle themes, or use the toggle button
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Typography</p>
              <p className="font-mono">Monospace text in terminal themes</p>
              <p>Regular text in notebook theme</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Colors</p>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded bg-[var(--accent)]" />
                <div className="w-8 h-8 rounded bg-[var(--card)]" />
                <div className="w-8 h-8 rounded bg-[var(--border)]" />
                <div className="w-8 h-8 rounded bg-[var(--muted)]" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Components</p>
              <div className="flex gap-2">
                <Button size="sm">Primary</Button>
                <Button size="sm" variant="secondary">Secondary</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ASCII Art Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Houses */}
        <Card>
          <CardHeader>
            <CardTitle>House Archetypes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <AsciiArt
                ascii={ASCII.HOUSE_MONK}
                label="Monk"
                variant="display"
                className="text-center"
              />
            </div>
            <div>
              <AsciiArt
                ascii={ASCII.HOUSE_WARRIOR_MONK_ASCII}
                label="Warrior-Monk"
                variant="display"
                className="text-center"
              />
            </div>
            <div>
              <AsciiArt
                ascii={ASCII.HOUSE_SAGE}
                label="Sage"
                variant="display"
                className="text-center"
              />
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AsciiArt
              ascii={ASCII.BADGE_STAR}
              label="Star Badge"
              variant="badge"
            />
            <AsciiArt
              ascii={ASCII.BADGE_TROPHY}
              label="Trophy"
              variant="badge"
            />
            <AsciiArt
              ascii={ASCII.STREAK_7_DAYS}
              label="Week Streak"
              variant="badge"
            />
          </CardContent>
        </Card>

        {/* UI Elements */}
        <Card>
          <CardHeader>
            <CardTitle>UI Elements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm mb-2">Progress Bar</p>
              <AsciiProgress value={75} />
            </div>
            <div>
              <p className="text-sm mb-2">Loading Spinner</p>
              <AsciiSpinner />
            </div>
            <div>
              <p className="text-sm mb-2">Avatar</p>
              <AsciiArt
                ascii={ASCII.AVATAR_MEDITATION}
                variant="avatar"
              />
            </div>
          </CardContent>
        </Card>

        {/* Animations */}
        <Card>
          <CardHeader>
            <CardTitle>Animations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm mb-2">Breathing Exercise</p>
              <AnimatedAsciiArt
                frames={ASCII.BREATHING_ANIMATION}
                fps={1}
                variant="display"
                ariaLabel="Breathing animation"
              />
            </div>
            <div>
              <p className="text-sm mb-2">Celebration</p>
              <AnimatedAsciiArt
                frames={ASCII.CELEBRATION_FRAMES}
                fps={2}
                variant="display"
                ariaLabel="Celebration animation"
              />
            </div>
          </CardContent>
        </Card>

        {/* Empty States */}
        <Card>
          <CardHeader>
            <CardTitle>Empty States</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AsciiArt
              ascii={ASCII.EMPTY_TASKS}
              variant="empty"
              className="text-center"
            />
            <AsciiArt
              ascii={ASCII.EMPTY_MEDITATION}
              variant="empty"
              className="text-center"
            />
          </CardContent>
        </Card>

        {/* Terminal Effects */}
        <Card>
          <CardHeader>
            <CardTitle>Terminal Effects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="font-mono">
              <span>{ASCII.TERMINAL_PROMPT}</span>
              <span>habitstory --version</span>
              <AnimatedAsciiArt
                frames={ASCII.TERMINAL_CURSOR_BLINK}
                fps={2}
                variant="inline"
              />
            </div>
            <pre className="text-xs opacity-50 overflow-hidden">
              {ASCII.MATRIX_CHARS}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Theme Features */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Theme Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Terminal Themes</h3>
              <ul className="space-y-1 text-sm">
                <li>• Monospace font throughout</li>
                <li>• High contrast colors</li>
                <li>• Subtle scanline effect</li>
                <li>• Matrix-inspired aesthetics</li>
                <li>• Green or white text options</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Notebook Theme</h3>
              <ul className="space-y-1 text-sm">
                <li>• Warm paper background</li>
                <li>• Lined paper effect</li>
                <li>• Margin line on the left</li>
                <li>• Ink-like text color</li>
                <li>• Soft shadows on cards</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}