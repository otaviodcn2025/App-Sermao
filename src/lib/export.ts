// Dynamic imports are used inside the active functions below to prevent startup loading errors
// and keep bundle sizes small for fast loading.

/**
 * Super simple HTML to DOCX converter for the sermon editor.
 */
export async function exportToWord(title: string, htmlContent: string) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
  const { saveAs } = await import('file-saver');

  // Simple parser: strip tags for now or use a basic approach
  // In a real app we'd use a DOMParser to walk the nodes
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const bodyNodes = Array.from(doc.body.childNodes);

  const sections: any[] = [];

  // Add Title
  sections.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400,
      },
    })
  );

  bodyNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      let headingLevel: any = undefined;
      if (tagName === 'h1') headingLevel = HeadingLevel.HEADING_1;
      if (tagName === 'h2') headingLevel = HeadingLevel.HEADING_2;
      if (tagName === 'h3') headingLevel = HeadingLevel.HEADING_3;

      if (tagName.startsWith('h') || tagName === 'p') {
        const children = Array.from(element.childNodes);
        const runs = children.map((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            return new TextRun({
              text: child.textContent || '',
            });
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childEl = child as HTMLElement;
            const childTag = childEl.tagName.toLowerCase();
            return new TextRun({
              text: childEl.textContent || '',
              bold: childTag === 'strong' || childTag === 'b',
              italics: childTag === 'em' || childTag === 'i',
              underline: childTag === 'u' ? {} : undefined,
            });
          }
          return new TextRun('');
        });

        sections.push(
          new Paragraph({
            children: runs,
            heading: headingLevel,
            spacing: {
              before: 200,
              after: 200,
            },
          })
        );
      } else if (tagName === 'ul' || tagName === 'ol') {
        const listItems = Array.from(element.querySelectorAll('li'));
        listItems.forEach((li) => {
          sections.push(
            new Paragraph({
              text: li.textContent || '',
              bullet: tagName === 'ul' ? { level: 0 } : undefined,
              // docx doesn't have a simple numbered list in this API without more setup,
              // but we can try to approximate or just use bullets for now.
              spacing: {
                before: 100,
                after: 100,
              },
            })
          );
        });
      }
    }
  });

  const wordDoc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  const blob = await Packer.toBlob(wordDoc);
  saveAs(blob, `${title || 'Sermão'}.docx`);
}

/**
 * Exports HTML content to PDF using html2pdf.js
 */
export async function exportToPdf(title: string, htmlContent: string) {
  const html2pdfModule = await import('html2pdf.js');
  const html2pdf = html2pdfModule.default || (html2pdfModule as any);

  const element = document.createElement('div');
  element.innerHTML = `
    <div style="padding: 40px; font-family: sans-serif; line-height: 1.6; color: #1e293b;">
      <h1 style="text-align: center; color: #0f172a; margin-bottom: 30px; font-size: 28px;">${title || 'Sermão'}</h1>
      <div class="sermon-content">
        ${htmlContent}
      </div>
    </div>
  `;

  // Basic styling for the PDF
  const style = document.createElement('style');
  style.innerHTML = `
    .sermon-content h1 { font-size: 24px; margin-top: 20px; font-weight: bold; color: #334155; margin-bottom: 10px; page-break-after: avoid; break-after: avoid; }
    .sermon-content h2 { font-size: 20px; margin-top: 15px; font-weight: bold; color: #475569; margin-bottom: 8px; page-break-after: avoid; break-after: avoid; }
    .sermon-content p { margin-bottom: 10px; font-size: 14px; page-break-inside: avoid; break-inside: avoid; }
    .sermon-content ul, .sermon-content ol { margin-bottom: 15px; padding-left: 20px; }
    .sermon-content li { margin-bottom: 5px; font-size: 14px; page-break-inside: avoid; break-inside: avoid; }
    .sermon-content blockquote { border-left: 4px solid #e2e8f0; padding-left: 15px; font-style: italic; color: #64748b; margin: 15px 0; page-break-inside: avoid; break-inside: avoid; }
    .sermon-content table { width: 100%; border-collapse: collapse; margin-bottom: 20px; page-break-inside: auto; }
    .sermon-content tr { page-break-inside: avoid; break-inside: avoid; }
    .sermon-content th, .sermon-content td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 12px; }
    .sermon-content th { background-color: #f8fafc; font-weight: bold; }
  `;
  element.appendChild(style);

  const opt = {
    margin: [15, 15],
    filename: `${title || 'Sermão'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    html2canvas: { 
      scale: 2, 
      useCORS: true, 
      logging: false,
      // Workaround for Tailwind 4 oklch colors failing in html2canvas
      onclone: (clonedDoc: any) => {
        // Disable external stylesheets that might contain complex CSS features
        const links = Array.from(clonedDoc.getElementsByTagName('link')) as HTMLLinkElement[];
        links.forEach(link => {
          if (link.rel === 'stylesheet') {
            link.disabled = true;
          }
        });

        // Replace oklch in all style tags with a safe fallback
        const styleTags = Array.from(clonedDoc.getElementsByTagName('style')) as HTMLStyleElement[];
        styleTags.forEach(style => {
          if (style.innerHTML.includes('oklch')) {
            style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, '#333333');
          }
        });

        // Also check inline styles on elements
        const allElements = Array.from(clonedDoc.querySelectorAll('*')) as HTMLElement[];
        allElements.forEach(el => {
          if (el.style && el.style.cssText && el.style.cssText.includes('oklch')) {
            el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/g, '#333333');
          }
        });
      }
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    // @ts-ignore
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('Error exporting PDF:', error);
  }
}
