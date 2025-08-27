import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const filePath = path.join(__dirname, '..', 'kbtu_full_schedule.json');
  const coursesData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  for (const course of coursesData) {
    if (course.sections && course.sections.length > 0) {
      await prisma.course.create({
        data: {
          code: course.code,
          name: course.name_en,
          credits: parseInt(course.credits, 10) || 0,
          sections: {
            create: course.sections.map((section: any) => ({
              type: section.type,
              day: section.day,
              time: section.time,
              teacher: section.teacher,
              room: section.room,
            })),
          },
        },
      });
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });