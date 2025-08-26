# Incident Response Runbook

## Overview
This runbook outlines the process for responding to production incidents for the Habit Tracker application.

## Incident Severity Levels

### P0 - Critical
- **Definition**: Complete service outage or data loss
- **Response Time**: Immediate (within 15 minutes)
- **Examples**:
  - Site completely down
  - Authentication system failure
  - Data corruption or loss
  - Security breach

### P1 - High
- **Definition**: Major functionality broken
- **Response Time**: Within 1 hour
- **Examples**:
  - Cannot create/update habits
  - Payments failing
  - Significant performance degradation (>5x normal)

### P2 - Medium
- **Definition**: Minor functionality broken
- **Response Time**: Within 4 hours
- **Examples**:
  - Analytics not updating
  - Non-critical features broken
  - Moderate performance issues

### P3 - Low
- **Definition**: Minor issues
- **Response Time**: Next business day
- **Examples**:
  - UI glitches
  - Non-blocking bugs
  - Feature requests

## Incident Response Process

### 1. Detection
Incidents can be detected through:
- 🚨 **Automated Alerts** (Sentry, monitoring)
- 👤 **User Reports** (support tickets, social media)
- 👀 **Team Observation**

### 2. Initial Response

#### For P0/P1 Incidents:
1. **Acknowledge** the alert/report immediately
2. **Create** incident channel in Slack: `#incident-YYYY-MM-DD-description`
3. **Assign** Incident Commander (IC)
4. **Post** initial status in #engineering channel
5. **Update** status page if user-facing

#### Incident Commander Responsibilities:
- Coordinate response efforts
- Make decisions on mitigation strategies
- Communicate with stakeholders
- Delegate tasks to responders

### 3. Investigation

#### Quick Checks:
```bash
# Check application health
curl https://api.habittracker.com/health

# Check recent deployments
git log --oneline -10

# Check error rates
sentry issues list --project habit-tracker --status unresolved

# Check database status
psql $DATABASE_URL -c "SELECT version();"

# Check infrastructure status
vercel list --prod
```

#### Key Dashboards:
- [Sentry Errors](https://sentry.io/organizations/habit-tracker/issues/)
- [Vercel Deployments](https://vercel.com/habit-tracker/deployments)
- [Database Metrics](https://dashboard.postgresql.com)
- [PostHog Analytics](https://app.posthog.com)

### 4. Mitigation

#### Common Mitigations:

**🔄 Rollback Deployment**
```bash
# List recent deployments
vercel list --prod

# Rollback to previous version
vercel rollback [deployment-url]
```

**🚦 Feature Flag Toggle**
```javascript
// Disable problematic feature
posthog.feature_flags.update('feature_name', { enabled: false })
```

**📊 Scale Resources**
```bash
# Scale database
heroku addons:upgrade heroku-postgresql:standard-2

# Increase Vercel limits
vercel env pull
# Update VERCEL_FUNCTION_TIMEOUT
vercel env push
```

**🔧 Emergency Fixes**
1. Create hotfix branch: `git checkout -b hotfix/incident-description`
2. Make minimal fix
3. Deploy directly to production with approval
4. Backport to main branch later

### 5. Communication

#### Internal Updates (every 30 min for P0/P1):
```
📋 **Incident Update**
**Time**: [timestamp]
**Status**: 🔴 Investigating | 🟡 Mitigating | 🟢 Resolved
**Impact**: [affected users/features]
**Current Actions**: [what we're doing]
**Next Update**: [time]
```

#### External Updates (Status Page):
- Be transparent but avoid technical details
- Focus on user impact and ETA
- Update at least hourly for P0/P1

### 6. Resolution

1. **Verify** fix is working (monitoring, manual testing)
2. **Monitor** for 30 minutes post-fix
3. **Update** status page to "Resolved"
4. **Close** incident channel (archive after post-mortem)

### 7. Post-Mortem (Required for P0/P1)

**Timeline**: Within 48 hours
**Template**: See [post-mortem-template.md](./post-mortem-template.md)

Key sections:
- Timeline of events
- Root cause analysis (5 Whys)
- Impact assessment
- What went well
- What went poorly
- Action items with owners

## Key Contacts

### On-Call Rotation
- **Primary**: Check #on-call channel
- **Secondary**: Engineering Manager
- **Escalation**: CTO

### External Contacts
- **Vercel Support**: enterprise@vercel.com
- **Database Support**: support@supabase.io
- **Auth Support**: support@clerk.dev

## Common Issues & Solutions

### 🔒 Authentication Issues
```bash
# Check Clerk status
curl https://api.clerk.dev/v1/health

# Verify environment variables
vercel env ls --prod | grep CLERK

# Test authentication flow
curl -X POST https://api.habittracker.com/test-auth
```

### 🗄️ Database Issues
```sql
-- Check connections
SELECT count(*) FROM pg_stat_activity;

-- Kill long-running queries
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE query_time > interval '5 minutes';

-- Check table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### ⚡ Performance Issues
```bash
# Check function logs
vercel logs --prod --since 1h

# Analyze slow queries
heroku pg:diagnose

# Check cache hit rates
redis-cli INFO stats | grep hit
```

### 💳 Payment Issues
```javascript
// Check Stripe webhook status
stripe webhooks list --limit 10

// Verify webhook endpoint
stripe webhook_endpoints list

// Replay failed webhooks
stripe events resend evt_xxxx
```

## Preventive Measures

### Daily Checks
- [ ] Review error rates in Sentry
- [ ] Check SLO dashboard
- [ ] Verify backup completion

### Weekly Checks
- [ ] Review performance trends
- [ ] Update dependencies
- [ ] Audit security alerts

### Monthly Checks
- [ ] Disaster recovery drill
- [ ] Review and update runbooks
- [ ] Capacity planning review

## Tools & Scripts

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

echo "🏥 Running health checks..."

# API Health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.habittracker.com/health)
echo "API Status: $API_STATUS"

# Database Health
DB_STATUS=$(psql $DATABASE_URL -c "SELECT 1" &> /dev/null && echo "200" || echo "500")
echo "Database Status: $DB_STATUS"

# Feature Flags
FLAGS=$(curl -s https://api.posthog.com/flags)
echo "Feature Flags: Active"

if [ "$API_STATUS" != "200" ] || [ "$DB_STATUS" != "200" ]; then
  echo "❌ Health check failed!"
  exit 1
else
  echo "✅ All systems operational"
fi
```

### Rollback Script
```bash
#!/bin/bash
# rollback.sh

DEPLOYMENT_URL=$1
if [ -z "$DEPLOYMENT_URL" ]; then
  echo "Usage: ./rollback.sh <deployment-url>"
  exit 1
fi

echo "🔄 Rolling back to $DEPLOYMENT_URL..."
vercel rollback $DEPLOYMENT_URL --yes

echo "⏳ Waiting for rollback..."
sleep 30

echo "🏥 Running health check..."
./health-check.sh
```

---

**Last Updated**: January 2024  
**Owner**: Engineering Team  
**Review Frequency**: Monthly