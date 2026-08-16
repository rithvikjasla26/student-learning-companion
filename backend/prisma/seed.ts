import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Seed Topics with CBSE Class 10 Science syllabus
  const topics = [
    {
      subject: "Physics",
      chapter: "Light - Reflection and Refraction",
      subtopic: "Laws of Reflection",
      examWeight: 8,
      expectedConcepts: JSON.stringify([
        "angle of incidence",
        "angle of reflection",
        "normal",
        "plane mirror",
        "spherical mirror",
      ]),
    },
    {
      subject: "Physics",
      chapter: "Light - Reflection and Refraction",
      subtopic: "Refraction of Light",
      examWeight: 10,
      expectedConcepts: JSON.stringify([
        "refractive index",
        "Snell's law",
        "critical angle",
        "total internal reflection",
        "optical fiber",
      ]),
    },
    {
      subject: "Chemistry",
      chapter: "Chemical Reactions and Equations",
      subtopic: "Types of Chemical Reactions",
      examWeight: 9,
      expectedConcepts: JSON.stringify([
        "combination reaction",
        "decomposition reaction",
        "displacement reaction",
        "double displacement",
        "redox reaction",
      ]),
    },
    {
      subject: "Chemistry",
      chapter: "Acids, Bases and Salts",
      subtopic: "pH Scale",
      examWeight: 7,
      expectedConcepts: JSON.stringify([
        "pH definition",
        "pH scale",
        "acidic",
        "neutral",
        "basic",
        "indicator",
      ]),
    },
    {
      subject: "Biology",
      chapter: "Life Processes",
      subtopic: "Photosynthesis",
      examWeight: 10,
      expectedConcepts: JSON.stringify([
        "chlorophyll",
        "light reaction",
        "dark reaction",
        "Calvin cycle",
        "glucose production",
        "oxygen release",
      ]),
    },
    {
      subject: "Biology",
      chapter: "Control and Coordination",
      subtopic: "Nervous System",
      examWeight: 8,
      expectedConcepts: JSON.stringify([
        "neurons",
        "brain",
        "spinal cord",
        "reflex arc",
        "synapse",
        "neurotransmitter",
      ]),
    },
    {
      subject: "Physics",
      chapter: "Electricity",
      subtopic: "Electric Current and Resistance",
      examWeight: 9,
      expectedConcepts: JSON.stringify([
        "electric current",
        "ampere",
        "volt",
        "resistance",
        "Ohm's law",
        "conductivity",
      ]),
    },
    {
      subject: "Chemistry",
      chapter: "Periodic Classification of Elements",
      subtopic: "Periodic Table",
      examWeight: 6,
      expectedConcepts: JSON.stringify([
        "periods",
        "groups",
        "valency",
        "atomic number",
        "atomic mass",
        "trends",
      ]),
    },
    {
      subject: "Biology",
      chapter: "Heredity and Evolution",
      subtopic: "Mendel's Laws of Inheritance",
      examWeight: 8,
      expectedConcepts: JSON.stringify([
        "dominant trait",
        "recessive trait",
        "allele",
        "genotype",
        "phenotype",
        "law of segregation",
      ]),
    },
    {
      subject: "Physics",
      chapter: "Magnetism",
      subtopic: "Magnetic Field and Force",
      examWeight: 7,
      expectedConcepts: JSON.stringify([
        "magnetic field",
        "magnetic force",
        "Lorentz force",
        "magnetic field lines",
        "Tesla",
      ]),
    },
  ];

  // Create topics
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
      console.log(`✓ Created topic: ${topic.subject} > ${topic.subtopic}`);
    }
  }

  // Seed sample badges
  const badges = [
    {
      name: "Sharp Eye",
      description: "Low confidence then correct answer - shows honest self-assessment",
      icon: "👁️",
    },
    {
      name: "Speed Learner",
      description: "Complete 3 topics in one day",
      icon: "⚡",
    },
    {
      name: "Consistency Champion",
      description: "Maintain a 7-day check-in streak",
      icon: "🎯",
    },
    {
      name: "Knowledge Master",
      description: "Achieve 90% or higher mastery on any topic",
      icon: "🏆",
    },
    {
      name: "First Step",
      description: "Complete your first check-in",
      icon: "🚀",
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
      console.log(`✓ Created badge: ${badge.name}`);
    }
  }

  // Create a sample student for testing
  const sampleStudent = await prisma.student.upsert({
    where: { email: "student@example.com" },
    update: {},
    create: {
      email: "student@example.com",
      name: "Test Student",
      class: 10,
      board: "CBSE",
      subjects: "Physics,Chemistry,Biology",
      role: "student",
    },
  });

  console.log(`✓ Created sample student: ${sampleStudent.name}`);

  // Create a sample parent
  const sampleParent = await prisma.parent.upsert({
    where: { email: "parent@example.com" },
    update: {},
    create: {
      email: "parent@example.com",
      name: "Test Parent",
      role: "parent",
    },
  });

  console.log(`✓ Created sample parent: ${sampleParent.name}`);

  // Link parent to student
  await prisma.student.update({
    where: { id: sampleStudent.id },
    data: { parentId: sampleParent.id },
  });

  console.log("✓ Linked student to parent");

  // Initialize StudentTopicProgress for all topics
  const allTopics = await prisma.topic.findMany();
  for (const topic of allTopics) {
    const existing = await prisma.studentTopicProgress.findUnique({
      where: {
        studentId_topicId: {
          studentId: sampleStudent.id,
          topicId: topic.id,
        },
      },
    });

    if (!existing) {
      await prisma.studentTopicProgress.create({
        data: {
          studentId: sampleStudent.id,
          topicId: topic.id,
          masteryScore: 0,
          confidenceRating: 50,
          nextDueAt: new Date(),
        },
      });
    }
  }

  console.log(
    `✓ Initialized progress tracking for ${allTopics.length} topics`
  );

  console.log("✅ Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
