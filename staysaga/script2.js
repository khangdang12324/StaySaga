const fs = require('fs');
let c = fs.readFileSync('src/components/home/TrendingDestinations.tsx', 'utf8');

c = c.replace(
  /const formatPrice = \(value: number\) =>[\s\S]*?\}\)\.format\(value\);/,
  `const formatPrice = (value: number) => {
  let currency = "VND";
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [k, v] = cookie.trim().split("=");
      if (k === "currency") currency = v;
    }
  }
  if (currency === "USD") {
     return \`USD \${(value / 27000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`;
  }
  return \`VND \${value.toLocaleString("vi-VN")}\`;
}`
);

fs.writeFileSync('src/components/home/TrendingDestinations.tsx', c);
