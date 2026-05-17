#!/usr/bin/env node
// Usage: node scripts/extract_booking.js /path/to/booking.html /output/dir
// Requires: npm install cheerio

const fs = require('fs');
const path = require('path');
let cheerio;
try {
  cheerio = require('cheerio');
} catch (e) {
  console.error('Missing dependency: cheerio. Run `npm install cheerio` and try again.');
  process.exit(1);
}

const htmlPath = process.argv[2] || 'c:/Users/Admin/Downloads/Booking.com_ Khách sạn tại Đà Lạt. Hãy đặt khách sạn ngay bây giờ!.html';
const outDir = process.argv[3] || path.dirname(htmlPath);

if (!fs.existsSync(htmlPath)) {
  console.error('HTML file not found:', htmlPath);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf-8');
const $ = cheerio.load(html);

const results = [];
$('div[data-testid="property-card"]').each((i, el) => {
  const card = $(el);
  const link = card.find('a').first().attr('href') || '';
  const img = card.find('img[data-testid="image"]').first();
  const imgSrc = img.attr('src') || '';
  const imgAlt = img.attr('alt') || '';
  const resolvedImageLocalPath = imgSrc && !/^https?:\/\//i.test(imgSrc)
    ? path.resolve(path.dirname(htmlPath), imgSrc.replace(/^\.\//, ''))
    : imgSrc;

  // Title: prefer image alt, else heading inside card
  let title = imgAlt.trim();
  if (!title) {
    const h4 = card.find('h4').first().text().trim();
    const h3 = card.find('h3').first().text().trim();
    const heading = h4 || h3 || card.find('.fff1944c52').first().text().trim();
    title = heading || `listing-${i + 1}`;
  }

  // Price: search inside availability wrapper
  const availText = card.find('[data-testid="availability-rate-wrapper"]').first().text();
  let price = null;
  let priceCurrency = null;
  if (availText) {
    const m = availText.match(/VND\s*([0-9.,]+)/i);
    if (m) {
      priceCurrency = 'VND';
      price = m[1].replace(/[.,]/g, (c, idx, str) => c === ',' ? '' : '');
      // Booking uses dot as thousands separator, comma as decimal in some locales.
      // We'll remove dots and commas to produce integer VND cents-like value.
      price = m[1].replace(/[.,]/g, '');
      price = parseInt(price, 10);
    } else {
      // fallback: find any number with separators
      const n = availText.match(/([0-9][0-9.,]{1,})/);
      if (n) {
        priceCurrency = 'VND';
        price = parseInt(n[1].replace(/[.,]/g, ''), 10);
      }
    }
  }

  // Rating
  let rating = null;
  const ratingWrapper = card.find('.bc946a29db').first().text() || card.find('[aria-hidden="true"]').filter(function () {
    return $(this).text().trim().match(/^\d+[.,]\d+/);
  }).first().text();
  if (ratingWrapper) {
    const rm = ratingWrapper.match(/(\d+[.,]\d+)/);
    if (rm) {
      rating = rm[1].replace(',', '.');
      rating = parseFloat(rating);
    }
  }

  // Reviews count
  let reviews = null;
  const reviewsMatch = card.text().match(/(\d{1,3}(?:[.,]\d{3})*)\s*đánh giá/i);
  if (reviewsMatch) {
    reviews = parseInt(reviewsMatch[1].replace(/[.,]/g, ''), 10);
  }

  results.push({
    id: i + 1,
    title,
    price: price === null ? null : price,
    price_currency: priceCurrency,
    image_src: imgSrc,
    image_local_path: resolvedImageLocalPath,
    rating,
    reviews_count: reviews,
    link
  });
});

// Write JSON and CSV
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const baseName = 'dalat_listings';
const jsonPath = path.join(outDir, baseName + '.json');
const csvPath = path.join(outDir, baseName + '.csv');
fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf-8');

const headers = ['id','title','price','price_currency','image_src','image_local_path','rating','reviews_count','link'];
const rows = results.map(r => headers.map(h => {
  const v = r[h] == null ? '' : String(r[h]);
  return '"' + v.replace(/"/g, '""') + '"';
}).join(','));
fs.writeFileSync(csvPath, headers.join(',') + '\n' + rows.join('\n'), 'utf-8');

console.log('Wrote', jsonPath);
console.log('Wrote', csvPath);
console.log('Total listings:', results.length);
