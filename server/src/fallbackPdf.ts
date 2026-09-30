/**
 * Generates a valid standard PDF 1.4 buffer without external heavy dependencies.
 * Used to immediately showcase the PDF viewer UI with setup instructions if no native TeX compiler is yet installed.
 */
export function generateStarterPdf(title: string, message: string): Buffer {
  const content = `BT
/F1 20 Tf
50 720 Td
(${escapePdf(title)}) Tj
0 -30 Td
/F1 12 Tf
(${escapePdf('Latexer Document Preview')}) Tj
0 -40 Td
(${escapePdf(message)}) Tj
0 -20 Td
(${escapePdf('To enable full LaTeX rendering, run: brew install tectonic')}) Tj
0 -20 Td
(${escapePdf('Tectonic will automatically fetch packages and compile your documents!')}) Tj
ET`;

  const streamLength = Buffer.byteLength(content, 'utf-8');

  const pdf = `%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 792]
  /Resources <<
    /Font <<
      /F1 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica
      >>
    >>
  >>
  /Contents 4 0 R
>>
endobj
4 0 obj
<<
  /Length ${streamLength}
>>
stream
${content}
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000305 00000 n 
trailer
<<
  /Size 5
  /Root 1 0 R
>>
startxref
${400 + streamLength}
%%EOF`;

  return Buffer.from(pdf, 'utf-8');
}

function escapePdf(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
