const fs = require('fs');
let c = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

c = c.replace(
  'document.body.appendChild(script);',
  `document.body.appendChild(script);
             const style = document.createElement("style");
             style.innerHTML = "body { top: 0 !important; } .skiptranslate > iframe.skiptranslate { display: none !important; visibility: hidden !important; } #goog-gt-tt { display: none !important; }";
             document.head.appendChild(style);`
);

fs.writeFileSync('src/components/layout/Navbar.tsx', c);
