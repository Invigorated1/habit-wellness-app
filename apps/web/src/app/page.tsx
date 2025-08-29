'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AsciiArt, AnimatedAsciiArt } from '@/components/AsciiArt';
import { Button } from '@/components/ui/button';
import * as ASCII from '@/ascii';

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Simple Header */}
      <header className="w-full p-4 flex justify-between items-center">
        <h1 className="font-mono text-xl font-bold">
          <AsciiArt ascii={ASCII.TERMINAL_PROMPT} variant="inline" />
          HabitStory
        </h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {isSignedIn ? (
            <Link href="/dashboard">
              <Button variant="secondary">Dashboard</Button>
            </Link>
          ) : (
            <Link href="/sign-in">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* ASCII Art Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex justify-center"
          >
            <AnimatedAsciiArt
              frames={ASCII.BREATHING_ANIMATION}
              fps={0.5}
              variant="display"
              ariaLabel="Meditation figure breathing"
            />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              Discover Your Wellness Archetype
            </h2>
            <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto">
              Embark on a personalized journey of growth through ancient wisdom and modern science.
              Find your path among six unique archetypes.
            </p>
          </motion.div>

          {/* House Preview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-12"
          >
            {Object.entries(ASCII.HOUSES_MINI).map(([house, icon]) => (
              <div
                key={house}
                className="p-4 border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors"
              >
                <div className="text-2xl mb-2 font-mono">{icon}</div>
                <div className="text-sm capitalize">
                  {house.toLowerCase().replace('_', ' ')}
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-4"
          >
            {isSignedIn ? (
              <>
                <Link href="/onboarding">
                  <Button size="lg" className="text-lg px-8">
                    Begin Your Journey
                  </Button>
                </Link>
                <p className="text-sm text-[var(--muted)]">
                  Take the assessment and discover your archetype
                </p>
              </>
            ) : (
              <>
                <div className="flex gap-4 justify-center">
                  <Link href="/sign-up">
                    <Button size="lg" className="text-lg px-8">
                      Start Free
                    </Button>
                  </Link>
                  <Link href="/sign-in">
                    <Button size="lg" variant="secondary" className="text-lg px-8">
                      Sign In
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  No credit card required • 3 minute setup
                </p>
              </>
            )}
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left"
          >
            <div className="p-6 border border-[var(--border)] rounded-lg">
              <AsciiArt ascii={ASCII.BADGE_STAR_MINI} variant="inline" />
              <h3 className="font-semibold mt-2 mb-2">Personalized Practices</h3>
              <p className="text-sm text-[var(--muted)]">
                Daily routines tailored to your unique archetype and goals
              </p>
            </div>
            <div className="p-6 border border-[var(--border)] rounded-lg">
              <AsciiArt ascii={ASCII.BADGE_TROPHY} variant="badge" />
              <h3 className="font-semibold mt-2 mb-2">Track Progress</h3>
              <p className="text-sm text-[var(--muted)]">
                Build streaks, earn achievements, and watch yourself grow
              </p>
            </div>
            <div className="p-6 border border-[var(--border)] rounded-lg">
              <AsciiArt ascii={ASCII.STATUS_ONLINE} variant="inline" />
              <h3 className="font-semibold mt-2 mb-2">Community Support</h3>
              <p className="text-sm text-[var(--muted)]">
                Connect with others on similar journeys in your House
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-8 text-center text-sm text-[var(--muted)]">
        <div className="space-y-2">
          <p>Built with mindfulness and code</p>
          <div className="flex justify-center gap-4">
            <Link href="/theme-demo" className="hover:text-[var(--text)]">
              Theme Demo
            </Link>
            <span>•</span>
            <Link href="/docs" className="hover:text-[var(--text)]">
              Docs
            </Link>
            <span>•</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--text)]"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}