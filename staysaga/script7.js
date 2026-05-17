const fs = require('fs');
const files = [
  'src/app/(admin)/admin/users/page.tsx',
  'src/app/(admin)/admin/properties/page.tsx',
  'src/app/(admin)/admin/bookings/page.tsx',
  'src/app/(admin)/admin/reviews/page.tsx',
  'src/app/(admin)/admin/_components/AdminShell.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/\\\`/g, '`');
  content = content.replace(/\\\$/g, '$');
  fs.writeFileSync(f, content);
  console.log('Fixed', f);
});
