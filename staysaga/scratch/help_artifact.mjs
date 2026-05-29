import { Workbook } from "@oai/artifact-tool";
const wb=Workbook.create();
console.log(wb.help('range.values', { include:'examples,notes', maxChars:4000 }).ndjson);
console.log(wb.help('range.format', { include:'examples,notes', maxChars:4000 }).ndjson);
console.log(wb.help('worksheet.freezePanes', { include:'examples,notes', maxChars:4000 }).ndjson);
console.log(wb.help('SpreadsheetFile.exportXlsx', { include:'examples,notes', maxChars:4000 }).ndjson);
