const fs = require('fs');

// Fix 1: Add notranslate to Navbar currency elements
let nav = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');
nav = nav.replace(
  'className="px-3 py-2 rounded-full font-bold transition-colors hover:bg-white/10 text-white flex items-center gap-1"',
  'className="px-3 py-2 rounded-full font-bold transition-colors hover:bg-white/10 text-white flex items-center gap-1 notranslate translate-no"'
);
nav = nav.replace(
  /className=\{`w-full text-left px-4 py-2/g,
  'className={`notranslate translate-no w-full text-left px-4 py-2'
);
fs.writeFileSync('src/components/layout/Navbar.tsx', nav);

// Fix 2: Add seed multiplier so prices aren't identical after division
let actions = fs.readFileSync('src/core/properties/actions.ts', 'utf8');
actions = actions.replace(
  'const price = PRICE_MIN + (seed % (PRICE_MAX - PRICE_MIN + 1));',
  'const price = PRICE_MIN + ((seed * 73939) % (PRICE_MAX - PRICE_MIN + 1));'
);
fs.writeFileSync('src/core/properties/actions.ts', actions);
