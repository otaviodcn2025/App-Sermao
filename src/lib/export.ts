import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Super simple HTML to DOCX converter for the sermon editor.
 * Handles headings, paragraphs, bold, italic.
 * For more complex layouts, a proper HTML parser would be needed.
 */
export async function exportToWord(title: string, htmlContent: string) {
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
