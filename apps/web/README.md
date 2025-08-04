# Habit Wellness App

A modern habit tracking application built with Next.js 15, Clerk authentication, Prisma, and SWR for data fetching.

## ✨ Features

- 🔐 **Authentication**: Clerk EU integration with email and Google OAuth
- 📊 **Dashboard**: SWR-powered real-time habit tracking
- 🎯 **API Routes**: RESTful habit management endpoints
- 🎨 **Modern UI**: TailwindCSS 4 with responsive design
- 🚀 **Performance**: Next.js App Router with optimized fonts

## 🛠️ Tech Stack

- **Framework**: Next.js 15.4.5 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **Authentication**: Clerk EU
- **Database**: Neon Postgres (planned)
- **ORM**: Prisma (in development)
- **Data Fetching**: SWR
- **Package Manager**: pnpm
- **Monorepo**: Turbo

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm/yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Invigorated1/habit-wellness-app.git
   cd habit-wellness-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in `apps/web/`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   
   # Database (Neon Postgres)
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   
   # Optional: Redis for caching (Sprint-1)
   UPSTASH_REDIS_REST_URL=...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

4. **Run development server**
   ```bash
   # From project root
   pnpm dev
   
   # Or specifically for web app (without Turbopack due to compatibility issues)
   cd apps/web
   pnpm dev-no-turbo
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧭 Available Routes

- `/` - Landing page
- `/sign-in` - Authentication
- `/sign-up` - User registration  
- `/dashboard` - Habit tracking dashboard
- `/api/habits` - REST API for habits (GET, POST)

## 🔧 Development

### Running Tests
```bash
pnpm test
```

### Linting
```bash
pnpm lint
```

### Building for Production
```bash
pnpm build
```

## 🐛 Known Issues

- **Turbopack Compatibility**: Use `pnpm dev-no-turbo` due to runtime module resolution issues in Next.js 15.4.5
- **Dashboard Auth Flow**: 404 error investigation pending for authenticated dashboard access

## 🗺️ Roadmap

### ✅ Sprint-0 (Completed)
- [x] Clerk authentication setup
- [x] API routes with mock data
- [x] Dashboard with SWR integration
- [x] Auth flow (sign-in → dashboard)

### 🚧 Sprint-1 (In Progress)
- [ ] Prisma schema and migrations
- [ ] Real database integration
- [ ] Upstash Redis for caching
- [ ] Vercel Cron for streak calculations
- [ ] PostHog analytics
- [ ] Sentry error monitoring
- [ ] GitHub Actions CI/CD

### 📋 Sprint-2 (Planned)
- [ ] Habit creation and editing
- [ ] Streak tracking and celebrations
- [ ] Progress visualization
- [ ] Mobile-responsive design
- [ ] PWA capabilities

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Live Demo](https://habit-wellness-app.vercel.app) (Coming Soon)
- [GitHub Repository](https://github.com/Invigorated1/habit-wellness-app)
- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
