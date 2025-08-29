# Docker Setup for HabitStory

## 🐳 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Docker Compose V2 (comes with Docker Desktop)

### 1. Setup Environment
```bash
# Copy the Docker environment template
cp .env.docker.example .env

# Edit .env with your Clerk keys
# (Required: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY)
```

### 2. Start Services
```bash
# Start all services (web app, postgres, redis)
docker-compose up -d

# Or start with development tools (Adminer, Redis Commander)
docker-compose --profile dev up -d
```

### 3. Access Applications
- **Web App**: http://localhost:3000
- **Adminer** (Database UI): http://localhost:8080
- **Redis Commander**: http://localhost:8081

### 4. Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

## 📦 What's Included

### Core Services
1. **PostgreSQL 15** - Primary database
2. **Redis 7** - Caching and rate limiting
3. **Next.js App** - The HabitStory application

### Development Tools (optional)
1. **Adminer** - Web-based database management
2. **Redis Commander** - Redis GUI

## 🛠️ Common Commands

### Database Operations
```bash
# Run migrations
docker-compose exec web pnpm prisma migrate dev

# Open Prisma Studio
docker-compose exec web pnpm db:studio

# Seed database
docker-compose exec web pnpm seed:templates
```

### Logs and Debugging
```bash
# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f web
docker-compose logs -f postgres

# Access web container shell
docker-compose exec web sh
```

### Development Workflow
```bash
# Rebuild after code changes
docker-compose build web
docker-compose up -d web

# Full rebuild (clean build)
docker-compose build --no-cache web
```

## 🔧 Configuration

### Environment Variables
The Docker setup uses these environment files:
- `.env` - Main environment file (gitignored)
- `.env.docker.example` - Template with all variables

### Volumes
Data is persisted in Docker volumes:
- `postgres_data` - Database files
- `redis_data` - Redis persistence

### Networking
All services are on the `habitstory-network` network and can communicate using service names:
- `postgres:5432` - Database
- `redis:6379` - Redis cache
- `web:3000` - Next.js app

## 🚀 Production Build

For production deployment:

```bash
# Build production image
docker build -t habitstory:latest -f apps/web/Dockerfile .

# Run production container
docker run -d \
  --name habitstory \
  -p 3000:3000 \
  --env-file .env.production \
  habitstory:latest
```

## 🐛 Troubleshooting

### Port Conflicts
If you get "port already in use" errors:
```bash
# Check what's using the ports
lsof -i :3000  # Web app
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Or change ports in docker-compose.yml
```

### Database Connection Issues
```bash
# Check if postgres is healthy
docker-compose ps
docker-compose logs postgres

# Manually test connection
docker-compose exec postgres psql -U habitstory -d habitstory_db
```

### Permission Issues
If you encounter permission errors:
```bash
# Fix ownership
sudo chown -R $(whoami):$(whoami) .

# Or run with proper user
docker-compose exec --user $(id -u):$(id -g) web sh
```

### Clean Slate
To completely reset:
```bash
# Stop everything and remove volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

## 📊 Resource Usage

Typical resource consumption:
- **PostgreSQL**: ~200MB RAM
- **Redis**: ~50MB RAM
- **Next.js**: ~300-500MB RAM
- **Total**: ~1GB RAM recommended

## 🔒 Security Notes

1. **Never commit .env files** with real credentials
2. **Use strong passwords** in production
3. **Limit port exposure** in production (use reverse proxy)
4. **Regular updates** - Keep base images updated
5. **Network isolation** - Production should use separate networks

## 🎯 Next Steps

1. **CI/CD Integration**: Build and push images in GitHub Actions
2. **Kubernetes**: Create K8s manifests for orchestration
3. **Monitoring**: Add Prometheus/Grafana services
4. **Backup**: Implement automated database backups