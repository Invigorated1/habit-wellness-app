import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create a test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      clerkId: 'user_test_123',
      email: 'test@example.com',
      name: 'Test User',
    },
  });

  console.log('Created test user:', testUser);

  // Create some sample habits
  const habits = await Promise.all([
    prisma.habit.create({
      data: {
        name: 'Morning Meditation',
        description: '10 minutes of mindfulness meditation',
        userId: testUser.id,
      },
    }),
    prisma.habit.create({
      data: {
        name: 'Daily Exercise',
        description: '30 minutes of physical activity',
        userId: testUser.id,
      },
    }),
    prisma.habit.create({
      data: {
        name: 'Read for 20 minutes',
        description: 'Read any book or article',
        userId: testUser.id,
      },
    }),
  ]);

  console.log('Created habits:', habits);

  // Create some habit entries for the first habit
  const today = new Date();
  const habitEntries = await Promise.all([
    prisma.habitEntry.create({
      data: {
        habitId: habits[0].id,
        date: new Date(today.setDate(today.getDate() - 2)),
        completed: true,
        notes: 'Great session!',
      },
    }),
    prisma.habitEntry.create({
      data: {
        habitId: habits[0].id,
        date: new Date(today.setDate(today.getDate() + 1)),
        completed: true,
        notes: 'Feeling calm and focused',
      },
    }),
    prisma.habitEntry.create({
      data: {
        habitId: habits[0].id,
        date: new Date(),
        completed: false,
      },
    }),
  ]);

  console.log('Created habit entries:', habitEntries);

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });