#!/usr/bin/env tsx

import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { logger } from '../src/lib/logger';

const pages = [
  { name: 'Homepage', path: '/' },
  { name: 'Sign In', path: '/sign-in' },
  { name: 'Sign Up', path: '/sign-up' },
  { name: 'Dashboard', path: '/dashboard' },
];

async function checkAccessibility() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results: Record<string, any> = {};
  
  for (const pageInfo of pages) {
    logger.info(`Checking accessibility for ${pageInfo.name}`);
    
    try {
      await page.goto(`http://localhost:3000${pageInfo.path}`);
      
      // Run axe accessibility tests
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      results[pageInfo.name] = {
        violations: accessibilityScanResults.violations.length,
        passes: accessibilityScanResults.passes.length,
        incomplete: accessibilityScanResults.incomplete.length,
        details: accessibilityScanResults.violations,
      };
      
      if (accessibilityScanResults.violations.length > 0) {
        logger.warn(`${pageInfo.name} has accessibility violations:`, {
          violations: accessibilityScanResults.violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length,
          })),
        });
      } else {
        logger.info(`${pageInfo.name} passed all accessibility checks`);
      }
    } catch (error) {
      logger.error(`Failed to check ${pageInfo.name}`, { error });
      results[pageInfo.name] = { error: String(error) };
    }
  }
  
  await browser.close();
  
  // Summary
  logger.info('Accessibility Check Summary:');
  for (const [page, result] of Object.entries(results)) {
    if (result.error) {
      logger.error(`${page}: Error - ${result.error}`);
    } else {
      logger.info(`${page}: ${result.violations} violations, ${result.passes} passes`);
    }
  }
  
  // Exit with error if any violations found
  const hasViolations = Object.values(results).some(
    (r: any) => r.violations && r.violations > 0
  );
  
  if (hasViolations) {
    process.exit(1);
  }
}

checkAccessibility().catch(error => {
  logger.error('Accessibility check failed', { error });
  process.exit(1);
});