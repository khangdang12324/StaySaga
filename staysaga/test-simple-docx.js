const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: 'Test Simple Document',
            bold: true,
            size: 28,
          }),
        ],
      }),
      new Paragraph({
        text: 'This is a test paragraph.',
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('test-simple.docx', buffer);
  console.log('✅ Simple test DOCX created!');
});
