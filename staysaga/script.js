const fs = require('fs');
let c = fs.readFileSync('src/components/features/search/DetailedFilters.tsx', 'utf8');

c = c.replace(
  /export function formatVnd\([\s\S]*?return `VND \$\{amount.toLocaleString\("vi-VN"\)\}`;(\r?\n)}/,
  `export function formatVnd(amount: number | null | undefined) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "VND 0";
  let currency = "VND";
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split("=");
      if (key === "currency") currency = value;
    }
  }
  if (currency === "USD") {
     return \`USD \${(amount / 27000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`;
  }
  return \`VND \${amount.toLocaleString("vi-VN")}\`;
}`
);

// Replace static VND formatting in RangeInput and FilterSection
c = c.replace(
  `VND {filters.priceMin.toLocaleString("vi-VN")} -{" "}
            {filters.priceMax >= PRICE_MAX
              ? "VND 2.000.000+"
              : \`VND \${filters.priceMax.toLocaleString("vi-VN")}\`}`,
  `{formatVnd(filters.priceMin)} -{" "}
            {filters.priceMax >= PRICE_MAX
              ? formatVnd(PRICE_MAX) + "+"
              : formatVnd(filters.priceMax)}`
);

c = c.replace(
  `VND {value.toLocaleString("vi-VN")}`,
  `{formatVnd(value)}`
);

fs.writeFileSync('src/components/features/search/DetailedFilters.tsx', c);
