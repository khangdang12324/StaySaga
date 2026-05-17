#!/usr/bin/env node
// Usage: node scripts/extract_booking.js /path/to/booking.html /output/dir
// Requires: npm install cheerio

const fs = require('node:fs');
const path = require('node:path');
let cheerio;
try {
  cheerio = require('cheerio');
} catch {
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
  const publicImageFileName = resolvedImageLocalPath
    ? path.basename(resolvedImageLocalPath)
    : '';

  // Title: prefer image alt, else heading inside card
  let title = imgAlt.trim();
  if (!title) {
    const h4 = card.find('h4').first().text().trim();
    const h3 = card.find('h3').first().text().trim();
    const heading = h4 || h3 || card.find('.fff1944c52').first().text().trim();
    title = heading || `listing-${i + 1}`;
  }

  // Room name: first room heading inside availability (if present)
  const roomName = card.find('h4').first().text().trim() || card.find('.fff1944c52.f254df5361').first().text().trim() || '';

  // Price: search inside availability wrapper
  const availText = card.find('[data-testid="availability-rate-wrapper"]').first().text();
  let price = null;
  let originalPrice = null;
  let priceCurrency = null;
  if (availText) {
    const originalMatch = availText.match(/Giá gốc là VND\s*([0-9.,]+)/i);
    if (originalMatch) {
      priceCurrency = 'VND';
      originalPrice = parseInt(originalMatch[1].replace(/[.,]/g, ''), 10);
    }

    const m = availText.match(/VND\s*([0-9.,]+)/i);
    if (m) {
      priceCurrency = 'VND';
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

  // Room/availability details from the crawl HTML
  const roomHeading = card.find('[data-testid="recommended-units"] h4').first().text().trim() || roomName;
  const bedInfo = card.find('[data-testid="recommended-units"] li').first().text().trim();
  const availabilityText = card.find('[data-testid="availability-single"]').first().text().replace(/\s+/g, ' ').trim();
  const prepaymentPolicyMatch = availabilityText.match(/(Không cần thanh toán trước[^]*?)(?=Chúng tôi còn|1 đêm|VND|Giá gốc|Đã bao gồm|Xem chỗ trống|$)/i);
  const remainingRoomsMatch = availabilityText.match(/còn\s+([0-9]+)\s+/i);
  const remainingRooms = remainingRoomsMatch ? parseInt(remainingRoomsMatch[1], 10) : null;
  const prepaymentPolicy = prepaymentPolicyMatch ? prepaymentPolicyMatch[1].trim() : null;
  const freeCancellation = /Miễn phí hủy/i.test(availabilityText);
  const noPrepayment = /Không cần thanh toán trước/i.test(availabilityText);
  const discountedPrice = price;

  results.push({
    id: i + 1,
    title,
    room_name: roomHeading,
    price: price === null ? null : price,
    original_price: originalPrice,
    discounted_price: discountedPrice,
    price_currency: priceCurrency,
    image_src: publicImageFileName ? `/hotels/dalat/${publicImageFileName}` : '',
    image_local_path: publicImageFileName ? `/hotels/dalat/${publicImageFileName}` : '',
    image_public_path: publicImageFileName ? `/hotels/dalat/${publicImageFileName}` : '',
    rating,
    reviews_count: reviews,
    remaining_rooms: remainingRooms,
    prepayment_policy: prepaymentPolicy,
    free_cancellation: freeCancellation,
    no_prepayment: noPrepayment,
    bed_info: bedInfo,
    availability_text: availabilityText,
    link
  });
});

// Write JSON and CSV
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const baseName = 'dalat_listings';
const jsonPath = path.join(outDir, baseName + '.json');
const csvPath = path.join(outDir, baseName + '.csv');
fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf-8');

const headers = ['id','title','room_name','price','original_price','discounted_price','price_currency','image_src','image_local_path','image_public_path','rating','reviews_count','remaining_rooms','prepayment_policy','free_cancellation','no_prepayment','bed_info','availability_text','link'];
const rows = results.map(r => headers.map(h => {
  const v = r[h] == null ? '' : String(r[h]);
  return '"' + v.replace(/"/g, '""') + '"';
}).join(','));
fs.writeFileSync(csvPath, headers.join(',') + '\n' + rows.join('\n'), 'utf-8');

console.log('Wrote', jsonPath);
console.log('Wrote', csvPath);
console.log('Total listings:', results.length);
