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
