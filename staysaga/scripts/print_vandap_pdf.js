const path = require("path");
const { chromium } = require("playwright");

async function main() {
  const root = path.resolve(__dirname, "..");
  const input = path.join(root, "docs", "Tra_loi_toan_bo_cau_hoi_StaySaga.html");
  const output = path.join(root, "docs", "Tra_loi_toan_bo_cau_hoi_StaySaga_FIXED.pdf");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage();
  await page.goto("file:///" + input.replace(/\\/g, "/"), { waitUntil: "load" });
  await page.pdf({
    path: output,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate:
      "<div style=\"font-family:Arial,sans-serif;font-size:8px;color:#6b7280;width:100%;padding:0 13mm;display:flex;justify-content:space-between;\"><span>StaySaga - Bộ đáp án vấn đáp</span><span>Trang <span class='pageNumber'></span>/<span class='totalPages'></span></span></div>",
    margin: { top: "14mm", right: "13mm", bottom: "17mm", left: "13mm" },
  });
  await browser.close();
  console.log(output);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
