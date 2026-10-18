import { prisma } from '../src/lib/prisma';

async function main() {
  const categories = await prisma.category.findMany();
  console.log('Categories in DB:');
  categories.forEach(c => console.log(`- name: "${c.name}", slug: "${c.slug}", id: "${c.id}"`));

  const pkgs = await prisma.package.findMany({
    where: { provider: { user: { email: 'realkanagaraj@gmail.com' } } },
    include: { category: true, destination: true },
  });

  console.log(`\nPackages under realkanagaraj (${pkgs.length}):`);
  pkgs.forEach(p => console.log(`- "${p.name}" -> Category: "${p.category?.name}" (${p.category?.slug}), Dest: "${p.destination?.name}"`));
}

main().finally(() => prisma.$disconnect());
