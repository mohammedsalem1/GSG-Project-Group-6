import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/common/utils/hash.util';
const prisma = new PrismaClient();

async function main() {
    
    await prisma.review.deleteMany({})
    await prisma.feedback.deleteMany({})
    await prisma.session.deleteMany({});

    await prisma.swapRequest.deleteMany({});
    await prisma.userSkill.deleteMany({});
    await prisma.skill.deleteMany({});
    await prisma.category.deleteMany({});
    

    await prisma.user.upsert({
      where: { email: 'admin@admin.com' },
      update: {}, 
      create: {
        userName: 'admin',
        email: 'admin@admin.com',
        password: await hashPassword('123456'),
        role: 'ADMIN',
        isVerified: true,
      },
    });


    const categoriesData = [
      { name: "Programming", icon: "💻", skills: ["JavaScript", "React", "Python", "Node.js"] },
      { name: "Design", icon: "🎨", skills: ["UI Design", "Figma", "Adobe Photoshop", "Illustrator"] },
      { name: "Languages", icon: "🌍", skills: ["English", "Arabic", "French", "Spanish"] },
      { name: "Soft Skills", icon: "🤝", skills: ["Communication", "Teamwork", "Problem Solving", "Time Management"] },
      { name: "Others", icon: "➕", skills: [] },
    ];
      for (const cat of categoriesData) {
        const category = await prisma.category.create({
          data: {
            name: cat.name,
            icon:cat.icon,
            isActive: true,
          },
        });

        for (const skillName of cat.skills) {
          await prisma.skill.create({
            data: {
              name: skillName,
              categoryId: category.id,
              isActive: true,
            },
          });
        }
      }

      console.log('Category and skill seeding finished!');
    }

    main()
      .catch(e => console.error(e))
      .finally(async () => await prisma.$disconnect());
