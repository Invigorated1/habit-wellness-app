import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import fs from 'fs/promises';
import path from 'path';

export interface Migration {
  id: string;
  name: string;
  timestamp: number;
  up: string;
  down?: string;
}

export class MigrationRunner {
  private migrationsPath = path.join(process.cwd(), 'prisma/migrations');
  
  async getCurrentVersion(): Promise<string | null> {
    try {
      const result = await prisma.$queryRaw<{ version: string }[]>`
        SELECT version FROM _prisma_migrations 
        ORDER BY finished_at DESC 
        LIMIT 1
      `;
      return result[0]?.version || null;
    } catch (error) {
      logger.error('Failed to get current migration version', { error });
      return null;
    }
  }
  
  async getPendingMigrations(): Promise<Migration[]> {
    try {
      const currentVersion = await this.getCurrentVersion();
      const allMigrations = await this.getAllMigrations();
      
      if (!currentVersion) {
        return allMigrations;
      }
      
      const currentIndex = allMigrations.findIndex(m => m.id === currentVersion);
      return allMigrations.slice(currentIndex + 1);
    } catch (error) {
      logger.error('Failed to get pending migrations', { error });
      return [];
    }
  }
  
  async getAllMigrations(): Promise<Migration[]> {
    try {
      const migrationDirs = await fs.readdir(this.migrationsPath);
      const migrations: Migration[] = [];
      
      for (const dir of migrationDirs) {
        if (dir.startsWith('.')) continue;
        
        const migrationPath = path.join(this.migrationsPath, dir);
        const stat = await fs.stat(migrationPath);
        
        if (stat.isDirectory()) {
          const upPath = path.join(migrationPath, 'migration.sql');
          const downPath = path.join(migrationPath, 'down.sql');
          
          const [timestamp, ...nameParts] = dir.split('_');
          const name = nameParts.join('_');
          
          const up = await fs.readFile(upPath, 'utf-8');
          let down: string | undefined;
          
          try {
            down = await fs.readFile(downPath, 'utf-8');
          } catch {
            // Down migration is optional
          }
          
          migrations.push({
            id: dir,
            name,
            timestamp: parseInt(timestamp),
            up,
            down,
          });
        }
      }
      
      return migrations.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      logger.error('Failed to get all migrations', { error });
      return [];
    }
  }
  
  async runMigration(migration: Migration): Promise<void> {
    const startTime = Date.now();
    logger.info('Running migration', { id: migration.id, name: migration.name });
    
    try {
      await prisma.$transaction(async (tx) => {
        // Execute the migration
        await tx.$executeRawUnsafe(migration.up);
        
        // Record the migration
        await tx.$executeRaw`
          INSERT INTO _prisma_migrations (id, checksum, migration_name, finished_at)
          VALUES (${migration.id}, '', ${migration.name}, NOW())
        `;
      });
      
      const duration = Date.now() - startTime;
      logger.info('Migration completed', { 
        id: migration.id, 
        name: migration.name,
        duration 
      });
    } catch (error) {
      logger.error('Migration failed', { 
        id: migration.id, 
        name: migration.name,
        error 
      });
      throw error;
    }
  }
  
  async rollbackMigration(migration: Migration): Promise<void> {
    if (!migration.down) {
      throw new Error(`No rollback script for migration ${migration.id}`);
    }
    
    const startTime = Date.now();
    logger.info('Rolling back migration', { id: migration.id, name: migration.name });
    
    try {
      await prisma.$transaction(async (tx) => {
        // Execute the rollback
        await tx.$executeRawUnsafe(migration.down!);
        
        // Remove the migration record
        await tx.$executeRaw`
          DELETE FROM _prisma_migrations WHERE id = ${migration.id}
        `;
      });
      
      const duration = Date.now() - startTime;
      logger.info('Rollback completed', { 
        id: migration.id, 
        name: migration.name,
        duration 
      });
    } catch (error) {
      logger.error('Rollback failed', { 
        id: migration.id, 
        name: migration.name,
        error 
      });
      throw error;
    }
  }
  
  async migrate(): Promise<void> {
    const pending = await this.getPendingMigrations();
    
    if (pending.length === 0) {
      logger.info('No pending migrations');
      return;
    }
    
    logger.info('Found pending migrations', { count: pending.length });
    
    for (const migration of pending) {
      await this.runMigration(migration);
    }
    
    logger.info('All migrations completed');
  }
  
  async rollback(steps = 1): Promise<void> {
    const allMigrations = await this.getAllMigrations();
    const currentVersion = await this.getCurrentVersion();
    
    if (!currentVersion) {
      logger.info('No migrations to rollback');
      return;
    }
    
    const currentIndex = allMigrations.findIndex(m => m.id === currentVersion);
    const migrationsToRollback = allMigrations
      .slice(Math.max(0, currentIndex - steps + 1), currentIndex + 1)
      .reverse();
    
    logger.info('Rolling back migrations', { count: migrationsToRollback.length });
    
    for (const migration of migrationsToRollback) {
      await this.rollbackMigration(migration);
    }
    
    logger.info('Rollback completed');
  }
  
  async status(): Promise<void> {
    const current = await this.getCurrentVersion();
    const pending = await this.getPendingMigrations();
    const all = await this.getAllMigrations();
    
    logger.info('Migration status', {
      current,
      pending: pending.length,
      total: all.length,
    });
    
    if (pending.length > 0) {
      logger.info('Pending migrations:', pending.map(m => m.name));
    }
  }
}

export const migrationRunner = new MigrationRunner();