const fs = require('fs');
let c = fs.readFileSync('src/app/homestays/[slug]/page.tsx', 'utf8');

if (!c.includes('import { cookies } from "next/headers"')) {
    c = c.replace('import Link from "next/link";', 'import Link from "next/link";\nimport { cookies } from "next/headers";');
}

c = c.replace(
    'export default async function HotelDetailPage({ params }: Props) {',
    `export default async function HotelDetailPage({ params }: Props) {
  const cookieStore = await cookies();
  const currency = cookieStore.get("currency")?.value || "VND";

  const formatPrice = (priceStr) => {
    const rawNum = parseInt(priceStr.replace(/\\./g, ""));
    if (isNaN(rawNum)) return priceStr;
    if (currency === "USD") {
      return \`USD \${(rawNum / 27000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`;
    }
    return \`VND \${rawNum.toLocaleString("vi-VN")}\`;
  };

  const formatRelatedPrice = (priceFormatted) => {
    if (currency === "USD") {
      const numStr = priceFormatted.replace(/[^\\d]/g, "");
      const num = parseInt(numStr);
      if (!isNaN(num)) {
        return \`USD \${(num / 27000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\`;
      }
    }
    return priceFormatted;
  };`
);

c = c.replace(/<div className="text-\[11px\] text-rose-500 line-through">VND \{room\.original\}<\/div>/g, '<div className="text-[11px] text-rose-500 line-through">{formatPrice(room.original)}</div>');
c = c.replace(/<div className="text-xl font-bold text-zinc-900">VND \{room\.price\}<\/div>/g, '<div className="text-xl font-bold text-zinc-900">{formatPrice(room.price)}</div>');
c = c.replace(/<div className="mt-2 text-lg font-black text-rose-600">\{item\.priceFormatted\}<\/div>/g, '<div className="mt-2 text-lg font-black text-rose-600">{formatRelatedPrice(item.priceFormatted)}</div>');

fs.writeFileSync('src/app/homestays/[slug]/page.tsx', c);
