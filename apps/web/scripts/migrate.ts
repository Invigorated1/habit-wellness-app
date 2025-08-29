#!/usr/bin/env tsx

import { migrationRunner } from '../src/lib/migrations/runner';
import { logger } from '../src/lib/logger';

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  try {
    switch (command) {
      case 'up':
      case 'migrate':
        await migrationRunner.migrate();
        break;
        
      case 'down':
      case 'rollback':
        const steps = args[0] ? parseInt(args[0]) : 1;
        await migrationRunner.rollback(steps);
        break;
        
      case 'status':
        await migrationRunner.status();
        break;
        
      default:
        console.log(`
Migration Runner

Commands:
  up, migrate     Run all pending migrations
  down, rollback  Rollback migrations (default: 1 step)
  status          Show migration status

Examples:
  pnpm migrate up
  pnpm migrate down 2
  pnpm migrate status
        `);
    }
  } catch (error) {
    logger.error('Migration command failed', { error, command });
    process.exit(1);
  }
}

main();