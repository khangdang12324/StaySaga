import { Workbook } from "@oai/artifact-tool";
const wb=Workbook.create();
for (const q of ['fill','font','wrap','columnWidth','range.style','range.formatting','borders','autofit','table']) {
 console.log('---',q);
 console.log(wb.help('*', { search:q, include:'index,examples,notes', maxChars:3000 }).ndjson);
}
