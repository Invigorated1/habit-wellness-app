import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { logger } from '@/lib/logger';
import { archetypeClassifier } from '@/lib/archetype/classifier';
import { taskScheduler } from '@/lib/scheduler/task-scheduler';
import { TraitScore, UserGoal } from '@/lib/archetype/types';
import { z } from 'zod';

// Validation schema
const OnboardingSubmitSchema = z.object({
  traitScores: z.array(z.object({
    trait: z.string(),
    score: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    source: z.string(),
  })),
  goals: z.array(z.object({
    goal: z.string(),
    priority: z.number().min(1).max(5),
  })),
  preferences: z.object({
    intensity: z.enum(['low', 'medium', 'high']),
    timeCommitment: z.enum(['minimal', 'moderate', 'dedicated']),
    socialPreference: z.enum(['solo', 'community', 'mixed']),
  }),
  schedule: z.object({
    timezone: z.string(),
    morningWindow: z.object({
      start: z.string(),
      end: z.string(),
    }).nullable(),
    middayWindow: z.object({
      start: z.string(),
      end: z.string(),
    }).nullable(),
    eveningWindow: z.object({
      start: z.string(),
      end: z.string(),
    }).nullable(),
    dndWindows: z.array(z.object({
      start: z.string(),
      end: z.string(),
    })),
  }),
});

export const POST = withErrorHandler(async (request: Request) => {
  const user = await getOrCreateUser();
  const body = await request.json();
  
  // Validate input
  const validatedData = OnboardingSubmitSchema.parse(body);
  
  logger.info('Processing onboarding submission', { userId: user.id });

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create or update profile
    const profile = await tx.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        timezone: validatedData.schedule.timezone,
        dndWindows: {
          ...validatedData.schedule,
          dndWindows: validatedData.schedule.dndWindows,
        },
        verificationMode: 'NONE', // Default
      },
      update: {
        timezone: validatedData.schedule.timezone,
        dndWindows: {
          ...validatedData.schedule,
          dndWindows: validatedData.schedule.dndWindows,
        },
      },
    });

    // 2. Store trait scores
    for (const trait of validatedData.traitScores) {
      await tx.traitScore.upsert({
        where: {
          profileId_trait: {
            profileId: profile.id,
            trait: trait.trait,
          },
        },
        create: {
          profileId: profile.id,
          trait: trait.trait,
          score: trait.score,
          confidence: trait.confidence,
          source: trait.source,
        },
        update: {
          score: trait.score,
          confidence: trait.confidence,
          source: trait.source,
        },
      });
    }

    // 3. Store goals
    // First, deactivate old goals
    await tx.goal.updateMany({
      where: { userId: user.id },
      data: { active: false },
    });

    // Then create new goals
    for (const goal of validatedData.goals) {
      await tx.goal.create({
        data: {
          userId: user.id,
          label: goal.goal,
          priority: goal.priority,
          active: true,
        },
      });
    }

    // 4. Run classification
    const classificationResult = await archetypeClassifier.classify({
      traitScores: validatedData.traitScores as TraitScore[],
      goals: validatedData.goals as UserGoal[],
      preferences: validatedData.preferences,
    });

    // 5. Create assignment
    // Deactivate old assignments
    await tx.assignment.updateMany({
      where: { userId: user.id },
      data: { active: false },
    });

    const assignment = await tx.assignment.create({
      data: {
        userId: user.id,
        house: classificationResult.house,
        class: classificationResult.class,
        confidence: classificationResult.confidence,
        rationale: classificationResult.rationale,
        active: true,
        expiresAt: classificationResult.recommendedReassessment,
      },
    });

    // 6. Update user role if first time
    if (user.role === 'user') {
      await tx.user.update({
        where: { id: user.id },
        data: { role: 'user' }, // Could upgrade to 'premium' based on payment
      });
    }

    return {
      profile,
      assignment,
      classificationResult,
    };
  });

  // 7. Schedule initial tasks (outside transaction)
  try {
    await taskScheduler.generateSchedule({
      userId: user.id,
      startDate: new Date(),
      days: 7, // Generate first week
    });
  } catch (error) {
    logger.error('Failed to generate initial schedule', { error, userId: user.id });
    // Don't fail the whole onboarding if scheduling fails
  }

  logger.info('Onboarding completed successfully', {
    userId: user.id,
    house: result.assignment.house,
    class: result.assignment.class,
  });

  return successResponse({
    house: result.classificationResult.house,
    class: result.classificationResult.class,
    confidence: result.classificationResult.confidence,
    rationale: result.classificationResult.rationale,
    alternativeHouses: result.classificationResult.alternativeHouses,
  });
});