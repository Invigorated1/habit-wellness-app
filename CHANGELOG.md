# Changelog

All notable changes to HabitStory will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation structure
  - Architecture documentation with Mermaid diagrams
  - Glossary of terms and concepts
  - LLM-ready documentation in `/docs/llm-context/`
  - Readability audit report
  - Refactoring summary document
- Missing UI components
  - Button component (`/components/ui/button.tsx`)
  - Card component (`/components/ui/card.tsx`)
- Missing dependencies
  - `@radix-ui/react-slot`
  - `class-variance-authority`
  - `date-fns-tz`
- JSDoc comments to public APIs
  - ArchetypeClassifier
  - useRewards hook
  - useOnboardingStore
  - File-level documentation for key modules
- Missing database models
  - Habit model in Prisma schema
  - HabitEntry model for tracking

### Changed
- Updated README with current project state
- Improved code organization documentation
- Renamed theme components to kebab-case
  - `ThemeProvider.tsx` → `theme-provider.tsx`
  - `ThemeToggle.tsx` → `theme-toggle.tsx`
- Updated import statements for renamed files

### Fixed
- 17 unresolved imports for UI components
- Missing dependencies in package.json
- Build errors from missing core components
- TypeScript errors
  - date-fns-tz API changes
  - Missing exports (ThemeKeyboardShortcut, ForbiddenError)
  - Import errors
- Missing Prisma models causing database query failures

## [0.4.0] - 2025-01-09

### Added
- Complete engagement system implementation
  - Smart notifications with context awareness
  - Variable rewards engine with rarity tiers
  - House micro-communities (12-person cohorts)
  - Progress visualization (skill trees & journey maps)

## [0.3.0] - 2025-01-09

### Added
- HabitStory pivot implementation
  - Archetype classification system
  - Personality assessment onboarding
  - Task scheduling system
  - Quick Win onboarding experience
  - Graceful streak system
- UI theming system
  - Terminal (Green/White) themes
  - Notebook theme
  - ASCII art library

## [0.2.0] - 2025-01-08

### Added
- Production readiness features (Phase 1-3)
  - Zod validation schemas
  - Security headers and CSP
  - Sentry error tracking
  - Database timeouts and retries
  - Redis caching with Upstash
  - PostHog analytics
  - E2E testing with Playwright
  - SLI/SLO monitoring
  - RBAC authorization
  - Accessibility components
  - Cost tracking

## [0.1.0] - 2025-01-08

### Added
- Initial MVP implementation
  - Next.js 15 with App Router
  - Clerk authentication
  - Prisma database setup
  - Basic habit CRUD API
  - Dashboard UI
  - Structured logging
  - Error handling
  - Rate limiting
  - Unit testing setup

### Changed
- Moved from mock data to real database implementation

## [0.0.1] - 2025-01-08

### Added
- Initial project setup (Sprint-0)
  - Turborepo monorepo structure
  - Next.js boilerplate
  - TailwindCSS v4 configuration
  - Clerk authentication wrapper
  - Prisma schema definition