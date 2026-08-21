import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with sample CBSE topics...');

  // Sample CBSE Class 10 Science Topics
  const topics = [
    {
      subject: 'Science',
      chapter: 'Chapter 1: Chemical Reactions and Equations',
      subtopic: 'Types of Chemical Reactions',
      examWeight: 15,
      expectedConcepts: [
        'Oxidation and reduction',
        'Oxidizing and reducing agents',
        'Balancing chemical equations',
        'Types of reactions: combination, decomposition, displacement, double displacement',
      ],
    },
    {
      subject: 'Science',
      chapter: 'Chapter 5: Periodic Classification of Elements',
      subtopic: 'Modern Periodic Table',
      examWeight: 12,
      expectedConcepts: [
        'Periodic table organization',
        'Periods and groups',
        'Trends in periodic table',
        'Valency and atomic number',
      ],
    },
    {
      subject: 'Biology',
      chapter: 'Chapter 6: Life Processes',
      subtopic: 'Photosynthesis',
      examWeight: 18,
      expectedConcepts: [
        'Light-dependent reactions',
        'Light-independent reactions (Calvin cycle)',
        'Role of chlorophyll',
        'Stomata and gas exchange',
        'Equation of photosynthesis',
      ],
    },
    {
      subject: 'Biology',
      chapter: 'Chapter 6: Life Processes',
      subtopic: 'Respiration',
      examWeight: 16,
      expectedConcepts: [
        'Aerobic respiration',
        'Anaerobic respiration',
        'Glycolysis',
        'Krebs cycle',
        'Electron transport chain',
      ],
    },
    {
      subject: 'Physics',
      chapter: 'Chapter 1: Electricity',
      subtopic: 'Electric Current and Resistance',
      examWeight: 14,
      expectedConcepts: [
        'Current definition and units',
        'Voltage and potential difference',
        "Ohm's law",
        'Resistance and resistivity',
        'Factors affecting resistance',
      ],
    },
    {
      subject: 'Physics',
      chapter: 'Chapter 10: Light - Reflection and Refraction',
      subtopic: 'Refraction of Light',
      examWeight: 13,
      expectedConcepts: [
        'Refractive index',
        'Snell\'s law',
        'Critical angle and total internal reflection',
        'Lens formula',
        'Lens power',
      ],
    },
    {
      subject: 'Chemistry',
      chapter: 'Chapter 3: Metals and Non-metals',
      subtopic: 'Reactivity Series',
      examWeight: 11,
      expectedConcepts: [
        'Reactivity series of metals',
        'Metal and non-metal properties',
        'Corrosion and prevention',
        'Ores and minerals',
      ],
    },
    {
      subject: 'Science',
      chapter: 'Chapter 16: Management of Natural Resources',
      subtopic: 'Sustainable Development',
      examWeight: 10,
      expectedConcepts: [
        'Renewable resources',
        'Non-renewable resources',
        'Conservation strategies',
        'Sustainable practices',
      ],
    },
  ];

  for (const topic of topics) {
    const existing = await prisma.topic.findUnique({
      where: {
        subject_chapter_subtopic: {
          subject: topic.subject,
          chapter: topic.chapter,
          subtopic: topic.subtopic,
        },
      },
    });

    if (!existing) {
      await prisma.topic.create({
        data: topic,
      });
      console.log(`Created topic: ${topic.subject} - ${topic.subtopic}`);
    }
  }

  // Create sample badges
  const badges = [
    {
      name: 'First Check-in',
      description: 'Complete your first check-in',
      criteriaType: 'check_in_count',
      criteriaValue: 1,
    },
    {
      name: '7-Day Streak',
      description: 'Maintain a 7-day learning streak',
      criteriaType: 'streak_days',
      criteriaValue: 7,
    },
    {
      name: 'Hundred XP',
      description: 'Earn 100 XP',
      criteriaType: 'xp_threshold',
      criteriaValue: 100,
    },
    {
      name: 'Chapter Expert',
      description: 'Achieve 80%+ mastery on all topics in a chapter',
      criteriaType: 'topic_mastery',
      criteriaValue: 80,
    },
    {
      name: 'Consistent Learner',
      description: 'Complete 10 check-ins',
      criteriaType: 'check_in_count',
      criteriaValue: 10,
    },
  ];

  for (const badge of badges) {
    const existing = await prisma.badge.findUnique({
      where: { name: badge.name },
    });

    if (!existing) {
      await prisma.badge.create({
        data: badge,
      });
      console.log(`Created badge: ${badge.name}`);
    }
  }

  // Create sample TaughtLog and goal records for demo purposes
  // First, get or create a demo student
  let demoStudent = await prisma.student.findFirst({
    where: {
      name: 'Demo Student',
    },
  });

  if (!demoStudent) {
    // Create a demo user and student
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@example.com',
        role: 'STUDENT',
      },
    });

    demoStudent = await prisma.student.create({
      data: {
        userId: demoUser.id,
        name: 'Demo Student',
        gradeLevel: 10,
        subjects: ['Science', 'Math', 'Physics', 'Chemistry', 'Biology'],
      },
    });

    console.log('Created demo student');
  }

  // Initialize student stats if not present
  let studentStats = await prisma.studentStats.findUnique({
    where: { studentId: demoStudent.id },
  });

  if (!studentStats) {
    studentStats = await prisma.studentStats.create({
      data: {
        studentId: demoStudent.id,
        totalXp: 0,
        level: 1,
        streakCount: 0,
      },
    });
    console.log('Created student stats for demo student');
  }

  // Initialize student topic progress for all topics
  const allTopics = await prisma.topic.findMany();
  for (const topic of allTopics) {
    const existing = await prisma.studentTopicProgress.findUnique({
      where: {
        studentId_topicId: {
          studentId: demoStudent.id,
          topicId: topic.id,
        },
      },
    });

    if (!existing) {
      await prisma.studentTopicProgress.create({
        data: {
          studentId: demoStudent.id,
          topicId: topic.id,
          masteryScore: Math.floor(Math.random() * 70), // Random mastery 0-70
          confidenceScore: 50,
          nextDueAt: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log(`Initialized topic progress for demo student`);

  // Create sample TaughtLog entries
  const sampleTaughtLogs = allTopics.slice(0, 3).map((topic) => ({
    studentId: demoStudent.id,
    subject: topic.subject,
    chapter: topic.chapter,
    topicId: topic.id,
    source: 'SCHOOL',
    coverageType: 'INTRODUCED',
    homeworkAssigned: true,
  }));

  for (const log of sampleTaughtLogs) {
    const existing = await prisma.taughtLog.findFirst({
      where: {
        studentId: log.studentId,
        topicId: log.topicId,
      },
    });

    if (!existing) {
      await prisma.taughtLog.create({
        data: log,
      });
    }
  }
  console.log(`Created sample TaughtLog entries`);

  // Create sample goal records
  const existingLargerGoal = await prisma.largerGoal.findFirst({
    where: { studentId: demoStudent.id },
  });

  if (!existingLargerGoal) {
    const largerGoal = await prisma.largerGoal.create({
      data: {
        studentId: demoStudent.id,
        title: 'Score 90%+ in Science Board Exams',
        subject: 'Science',
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      },
    });

    // Create sample smaller goals
    const topicIds = allTopics.slice(0, 3).map((t) => t.id);
    await prisma.smallerGoal.create({
      data: {
        studentId: demoStudent.id,
        largerGoalId: largerGoal.id,
        title: 'Master Photosynthesis and Respiration',
        topicIds: topicIds.slice(0, 2),
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'ACTIVE',
      },
    });

    await prisma.smallerGoal.create({
      data: {
        studentId: demoStudent.id,
        largerGoalId: largerGoal.id,
        title: 'Ace Chemical Reactions',
        topicIds: topicIds.slice(2, 3),
        targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: 'ACTIVE',
      },
    });

    console.log(`Created sample goal records`);
  }

  console.log('Seeding complete!');
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
