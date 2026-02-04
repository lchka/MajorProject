import prisma from '../../lib/prisma.js';

const roles = [
  {
    name: 'admin',
    description: 'Administrator with full system access and permissions'
  },
  {
    name: 'moderator',
    description: 'Moderator with limited administrative capabilities'
  },
  {
    name: 'user',
    description: 'Standard user with basic access permissions'
  }
];

async function seedRoles() {
  try {
    console.log('Seeding roles...');

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role
      });
      console.log(`✓ Role '${role.name}' created/updated`);
    }

    console.log('Roles seeded successfully!');
  } catch (error) {
    console.error('Error seeding roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedRoles();