# Branch Protection Rules for HabitStory

## Setting Up Branch Protection

To implement these rules, go to your GitHub repository settings:

1. Navigate to Settings → Branches
2. Click "Add rule"
3. Apply these settings to the `main` branch:

### Required Settings

#### ✅ Require a pull request before merging
- **Require approvals**: 1 (increase to 2 for larger teams)
- **Dismiss stale pull request approvals when new commits are pushed**: ✓
- **Require review from CODEOWNERS**: ✓ (if using CODEOWNERS file)

#### ✅ Require status checks to pass before merging
- **Require branches to be up to date before merging**: ✓
- **Status checks required**:
  - `lint`
  - `typecheck`
  - `test`
  - `build`
  - `security`

#### ✅ Require conversation resolution before merging
- All PR comments must be resolved

#### ✅ Additional Protection
- **Include administrators**: ✓ (recommended for consistency)
- **Restrict who can push to matching branches**: Only allow specific users/teams
- **Allow force pushes**: ✗ (Never allow)
- **Allow deletions**: ✗ (Never allow)

### Recommended Additional Rules

#### For `develop` branch (if using git-flow):
- Similar rules to main but:
  - Allow direct pushes from senior developers
  - Require only 1 approval
  - Less strict on administrators

#### For feature branches (`feature/*`):
- No restrictions
- Developers can force push to their own feature branches
- Auto-delete head branches after merge

## CODEOWNERS File

Create `.github/CODEOWNERS`:

```
# Global owners
* @your-github-username

# Frontend
/apps/web/src/components/ @frontend-team
/apps/web/src/app/ @frontend-team

# Backend/API
/apps/web/src/app/api/ @backend-team
/apps/web/src/lib/ @backend-team

# Database
/apps/web/prisma/ @backend-team @database-admin

# DevOps
/.github/ @devops-team
/Dockerfile @devops-team
/docker-compose.yml @devops-team

# Documentation
/docs/ @tech-writers @team-leads
*.md @tech-writers
```

## Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Closes #(issue number)
```

## Enforcement Timeline

1. **Immediate**: Enable basic protection (require PR, no force push)
2. **Week 1**: Add status checks as CI stabilizes
3. **Week 2**: Require approvals once team is trained
4. **Month 1**: Full enforcement with CODEOWNERS

## Benefits

- ✅ Prevents accidental pushes to main
- ✅ Ensures code quality through CI checks
- ✅ Facilitates code review culture
- ✅ Maintains working main branch
- ✅ Prevents the feature branch divergence issue we just fixed

## GitHub CLI Commands

```bash
# Configure branch protection via CLI (requires gh auth)
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["lint","typecheck","test","build"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```