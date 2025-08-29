#!/usr/bin/env tsx

/**
 * Seed script to populate default task templates
 */

import { prisma } from '../src/lib/prisma';
import { defaultTaskTemplates } from '../src/lib/data/task-templates';
import { logger } from '../src/lib/logger';

async function seedTemplates() {
  logger.info('Starting template seeding...');

  try {
    for (const template of defaultTaskTemplates) {
      const created = await prisma.taskTemplate.upsert({
        where: { key: template.key },
        update: {
          title: template.title,
          description: template.description,
          instructions: template.instructions,
          modality: template.modality,
          minDuration: template.minDuration,
          maxDuration: template.maxDuration,
          difficulty: template.difficulty,
          houseTags: template.houseTags,
          captureType: template.captureType,
          isCore: template.isCore,
        },
        create: {
          key: template.key,
          title: template.title,
          description: template.description,
          instructions: template.instructions,
          modality: template.modality,
          minDuration: template.minDuration,
          maxDuration: template.maxDuration,
          difficulty: template.difficulty,
          houseTags: template.houseTags,
          captureType: template.captureType,
          isCore: template.isCore,
        },
      });

      logger.info(`✅ Template created/updated: ${created.key}`);
    }

    logger.info(`Successfully seeded ${defaultTaskTemplates.length} templates`);
  } catch (error) {
    logger.error('Failed to seed templates', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedTemplates().catch((error) => {
  console.error('Seed script failed:', error);
  process.exit(1);
});