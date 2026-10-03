// Reads the text inside a PDF with pdf.js (Mozilla's PDF reader, the one Firefox uses),
// so tests can check what is really in the CV file people download.
export async function pdfText(data: Buffer): Promise<string> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loading = getDocument({ data: new Uint8Array(data), isEvalSupported: false });
  const pdf = await loading.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const content = await (await pdf.getPage(i)).getTextContent();
    text += content.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
  }
  await loading.destroy();
  return text;
}
