# Production Deployment Checklist

## Pre-Deployment (1 Week Before)

### Environment Setup
- [ ] Create production database in Neon
  - [ ] Enable connection pooling
  - [ ] Set up automated backups
  - [ ] Configure SSL enforcement
- [ ] Set up production Clerk application
  - [ ] Configure production domain
  - [ ] Set up OAuth providers
  - [ ] Configure webhook endpoints
- [ ] Create production Redis instance (Upstash)
  - [ ] Enable eviction policy
  - [ ] Set up connection limits
- [ ] Configure Sentry project
  - [ ] Create production environment
  - [ ] Set up release tracking
  - [ ] Configure alert rules
- [ ] Set up PostHog
  - [ ] Create production project
  - [ ] Configure data retention
  - [ ] Set up dashboards

### Security Preparation
- [ ] Generate strong secrets
  ```bash
  # Generate secure random secrets
  openssl rand -base64 32  # For webhook secrets
  openssl rand -hex 32     # For API keys
  ```
- [ ] Review security headers
- [ ] Audit dependencies for vulnerabilities
  ```bash
  pnpm audit
  pnpm outdated
  ```
- [ ] Review and update CSP policy
- [ ] Set up WAF rules (if using Cloudflare)

### Code Preparation
- [ ] Ensure all tests pass
  ```bash
  pnpm test
  pnpm test:e2e
  pnpm test:a11y
  ```
- [ ] Run production build locally
  ```bash
  NODE_ENV=production pnpm build
  NODE_ENV=production pnpm start
  ```
- [ ] Check for console.log statements
  ```bash
  grep -r "console.log" src/ --exclude-dir=node_modules
  ```
- [ ] Verify error boundaries are in place
- [ ] Check loading states and error states

## Deployment Day

### 1. Final Checks (Before Deploy)
- [ ] Create deployment tag in Git
  ```bash
  git tag -a v1.0.0 -m "Initial production release"
  git push origin v1.0.0
  ```
- [ ] Back up any existing data
- [ ] Verify all environment variables are set
- [ ] Test database connectivity
- [ ] Verify Redis connectivity
- [ ] Check third-party service status pages

### 2. Environment Variables (Copy .env.production.example)
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` - Production database
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Production key
- [ ] `CLERK_SECRET_KEY` - Production secret
- [ ] `CLERK_WEBHOOK_SECRET` - Production webhook secret
- [ ] `UPSTASH_REDIS_REST_URL` - Production Redis
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Production Redis token
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` - Production key
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Production DSN
- [ ] `SENTRY_AUTH_TOKEN` - For source maps
- [ ] `NEXTAUTH_URL` - Production URL (no trailing slash)
- [ ] `LOG_FULL_IPS=false` - GDPR compliance
- [ ] `LOG_LEVEL=warn` - Reduce log noise
- [ ] `ENABLE_SECURITY_HEADERS=true`
- [ ] Do NOT set `ENABLE_TEST_ENDPOINTS`

### 3. Database Setup
- [ ] Run migrations
  ```bash
  pnpm prisma migrate deploy
  ```
- [ ] Seed initial data (if needed)
  ```bash
  pnpm seed:templates
  ```
- [ ] Verify database connectivity
- [ ] Test a simple query

### 4. Deploy Application
- [ ] Deploy to Vercel
  ```bash
  vercel --prod
  ```
- [ ] Or deploy via Git push (if connected)
- [ ] Monitor deployment logs
- [ ] Wait for deployment to complete

### 5. Post-Deployment Verification

#### Immediate Checks (First 5 minutes)
- [ ] Site loads correctly
- [ ] No console errors in browser
- [ ] Authentication works
  - [ ] Sign up flow
  - [ ] Sign in flow
  - [ ] Sign out
- [ ] Database connectivity
  - [ ] Can create data
  - [ ] Can read data
  - [ ] Can update data
- [ ] Static assets loading (CSS, JS, images)
- [ ] Fonts loading correctly

#### Security Verification
- [ ] Test endpoints return 403 in production
  ```bash
  curl https://habitstory.app/api/test-habits
  # Should return 403 Forbidden
  ```
- [ ] Check security headers
  ```bash
  curl -I https://habitstory.app
  # Verify CSP, HSTS, etc.
  ```
- [ ] Verify HTTPS redirect
- [ ] Check for exposed sensitive data

#### Monitoring Setup
- [ ] Sentry receiving errors
  - [ ] Trigger test error
  - [ ] Verify alert received
- [ ] PostHog receiving events
  - [ ] Check live events
  - [ ] Verify user identification
- [ ] Logs aggregating properly
- [ ] CSP violations being reported
- [ ] Health check endpoint responding
  ```bash
  curl https://habitstory.app/api/health
  ```

#### Performance Checks
- [ ] Run Lighthouse audit
  - [ ] Performance > 90
  - [ ] Accessibility > 95
  - [ ] Best Practices > 95
  - [ ] SEO > 90
- [ ] Check Time to First Byte (TTFB)
- [ ] Verify caching headers
- [ ] Test under load (if applicable)

### 6. Configure Production Services

#### Vercel Configuration
- [ ] Set up custom domain
- [ ] Configure environment variables
- [ ] Enable Web Analytics
- [ ] Set up deployment protection
- [ ] Configure build & development settings
  - Build Command: `pnpm build`
  - Output Directory: `.next`
  - Install Command: `pnpm install`

#### Clerk Production Setup
- [ ] Add production domain to allowed origins
- [ ] Configure production webhook endpoint
- [ ] Set up MFA policies
- [ ] Configure session lifetime
- [ ] Enable audit logs

#### External Services
- [ ] Add domain to Sentry allowed domains
- [ ] Configure PostHog allowed domains
- [ ] Set up uptime monitoring (e.g., Pingdom, UptimeRobot)
- [ ] Configure backup automation

### 7. Documentation Updates
- [ ] Update README with production URL
- [ ] Document deployment process
- [ ] Update API documentation
- [ ] Create runbook for common issues
- [ ] Document rollback procedure

## First 24 Hours Monitoring

### Every Hour
- [ ] Check error rate in Sentry
- [ ] Monitor response times
- [ ] Check memory/CPU usage
- [ ] Review user sign-ups

### After 6 Hours
- [ ] Review CSP violations
- [ ] Check for unusual traffic patterns
- [ ] Verify backup ran successfully
- [ ] Review security alerts

### After 24 Hours
- [ ] Full metrics review
- [ ] Performance analysis
- [ ] User feedback review
- [ ] Plan any needed hotfixes

## Rollback Plan

If critical issues arise:

1. **Immediate Rollback** (< 5 minutes)
   ```bash
   vercel rollback
   ```

2. **Database Rollback** (if schema changed)
   ```bash
   pnpm prisma migrate rollback
   ```

3. **Notify users** (if service disruption)
   - Status page update
   - Social media notification

4. **Investigate**
   - Review error logs
   - Check recent commits
   - Test in staging

5. **Fix and Redeploy**
   - Create hotfix branch
   - Test thoroughly
   - Deploy with increased monitoring

## Success Criteria

- [ ] Zero critical errors in first 24 hours
- [ ] Response time p95 < 500ms
- [ ] Uptime > 99.9%
- [ ] Successful user registrations
- [ ] No security incidents
- [ ] Positive user feedback

## Emergency Contacts

- **Database Issues**: Neon support
- **Authentication**: Clerk support
- **Hosting**: Vercel support
- **On-call Engineer**: [Your contact]
- **Security Issues**: security@habitstory.app

## Post-Launch Tasks (Week 1)

- [ ] Set up weekly backup verification
- [ ] Configure monthly security audits
- [ ] Plan first feature update
- [ ] Set up user feedback collection
- [ ] Schedule performance review
- [ ] Plan disaster recovery drill

## Notes

- Always deploy during low-traffic hours
- Have rollback plan ready
- Monitor actively for first 24 hours
- Keep stakeholders informed
- Document any issues encountered

---

**Remember**: It's better to delay deployment than to deploy with known issues. Take your time and be thorough!