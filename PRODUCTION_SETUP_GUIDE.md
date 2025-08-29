# Production Setup Guide for HabitStory

## Overview

This guide covers setting up HabitStory for production deployment on Vercel (recommended) or self-hosted infrastructure.

## Option 1: Vercel Deployment (Recommended)

### Prerequisites
- Vercel account
- GitHub repository connected to Vercel
- Production services configured (Clerk, Neon, etc.)

### Step 1: Configure Environment Variables

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables for Production environment:

```bash
# Core Configuration
NODE_ENV=production

# Database
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Monitoring
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...

# Security
LOG_FULL_IPS=false
LOG_LEVEL=warn
ENABLE_SECURITY_HEADERS=true
```

### Step 2: Configure Build Settings

1. Build Command: `pnpm build`
2. Output Directory: `.next`
3. Install Command: `pnpm install`
4. Root Directory: `apps/web`

### Step 3: Deploy

```bash
# Deploy via Git
git push origin main

# Or deploy via Vercel CLI
vercel --prod
```

### Step 4: Post-Deployment

1. Set up custom domain
2. Configure Clerk production domain
3. Test all critical paths
4. Monitor error rates

## Option 2: Self-Hosted Deployment

### Prerequisites
- Ubuntu 20.04+ server
- Docker and Docker Compose installed
- SSL certificates (Let's Encrypt recommended)
- Domain pointed to server

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create deployment directory
sudo mkdir -p /opt/habitstory
cd /opt/habitstory
```

### Step 2: Clone Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/habitstory.git .
cd habitstory
```

### Step 3: Configure Environment

```bash
# Copy production environment template
cp apps/web/.env.production.example .env.production

# Edit with your values
nano .env.production
```

### Step 4: SSL Setup

```bash
# Install Certbot
sudo apt install certbot -y

# Get SSL certificate
sudo certbot certonly --standalone -d habitstory.app -d www.habitstory.app

# Copy certificates
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/habitstory.app/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/habitstory.app/privkey.pem nginx/ssl/
```

### Step 5: Deploy

```bash
# Run deployment script
./scripts/deploy-production.sh

# Or manually with Docker Compose
docker-compose -f docker-compose.production.yml up -d
```

### Step 6: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Database Setup

### Neon (Recommended)
1. Create project at console.neon.tech
2. Enable connection pooling
3. Copy connection string
4. Set `DATABASE_URL` in environment

### Migration
```bash
# Run migrations
pnpm prisma migrate deploy

# Seed initial data
pnpm seed:templates
```

## Monitoring Setup

### Sentry
1. Create production project
2. Configure alerts:
   - Error rate > 1%
   - New error types
   - Performance degradation

### PostHog
1. Create production project
2. Set up dashboards:
   - User activity
   - Feature usage
   - Conversion funnels

### CSP Monitoring
1. Check `/monitoring/csp` regularly
2. Review violation patterns
3. Update CSP policy as needed

## Security Checklist

- [ ] `NODE_ENV=production`
- [ ] Test endpoints return 403
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] Rate limiting active
- [ ] Logs redacting IPs
- [ ] Backups configured
- [ ] Monitoring active

## Performance Optimization

### Vercel
1. Enable Edge Network
2. Configure caching headers
3. Enable Web Analytics
4. Set up Speed Insights

### Self-Hosted
1. Enable nginx caching
2. Configure CDN (Cloudflare)
3. Optimize Docker resources
4. Monitor server metrics

## Backup Strategy

### Database
```bash
# Automated daily backups
0 2 * * * pg_dump $DATABASE_URL > /backups/db-$(date +\%Y\%m\%d).sql
```

### Application
```bash
# Backup uploads and generated files
0 3 * * * tar -czf /backups/app-$(date +\%Y\%m\%d).tar.gz /opt/habitstory/uploads
```

## Troubleshooting

### Application Won't Start
1. Check logs: `docker-compose logs web`
2. Verify environment variables
3. Test database connection
4. Check port availability

### High Memory Usage
1. Adjust Docker limits
2. Check for memory leaks
3. Review caching strategy

### Slow Response Times
1. Check database queries
2. Review Redis connection
3. Enable query logging
4. Check network latency

## Maintenance

### Weekly
- Review error logs
- Check disk space
- Verify backups
- Update dependencies

### Monthly
- Security updates
- Performance review
- Cost analysis
- User feedback review

### Quarterly
- Disaster recovery test
- Security audit
- Dependency updates
- Architecture review

## Emergency Procedures

### Rollback
```bash
# Using deployment script
./scripts/deploy-production.sh rollback

# Manual rollback
docker-compose down
docker tag habitstory:previous habitstory:latest
docker-compose up -d
```

### Emergency Contacts
- Database: support@neon.tech
- Auth: support@clerk.com
- Hosting: support@vercel.com
- On-call: [Your contact]

## Cost Optimization

### Vercel
- Use ISR for static pages
- Optimize image sizes
- Implement edge caching
- Monitor function usage

### Self-Hosted
- Right-size server
- Use spot instances
- Implement autoscaling
- Optimize Docker images

## Next Steps

1. Complete deployment checklist
2. Run security scan
3. Performance benchmark
4. Set up alerts
5. Document runbooks
6. Train team members

Remember: Take your time with production setup. It's better to be thorough than fast!