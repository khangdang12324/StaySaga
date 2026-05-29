import { Workbook } from "@oai/artifact-tool";
const wb=Workbook.create();
console.log(wb.help('*', { search:'merge|merged', include:'index,examples,notes', maxChars:5000 }).ndjson);
