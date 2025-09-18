import pdf from "pdf-parse";

export async function extractTextFromPDF(buffer: Buffer) {
  const data = await pdf(buffer);
  // rapikan newline/whitespace
  return (data.text || '')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
