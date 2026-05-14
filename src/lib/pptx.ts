import pptxgen from "pptxgenjs";

interface SlideData {
  title: string;
  content: string;
  imageUrl?: string;
  imageDescription?: string;
}

export async function generatePowerPoint(sermonTitle: string, slides: SlideData[]) {
  const pptx = new pptxgen();

  // Define Master Slide for a professional look
  pptx.defineSlideMaster({
    title: "MASTER_SLIDE",
    background: { color: "FFFFFF" },
    objects: [
      { rect: { x: 0, y: 0, w: "100%", h: 0.8, fill: { color: "EA580C" } } }, // Orange-600 banner
      { text: { text: sermonTitle, options: { x: 0.5, y: 0.2, w: 9, h: 0.4, color: "FFFFFF", fontSize: 14, bold: true, align: "left" } } },
      { text: { text: "Gerado por ConectaSermon", options: { x: 0.5, y: 5.3, w: 9, h: 0.3, color: "94A3B8", fontSize: 10, align: "right" } } },
    ],
  });

  // Define a Dark Master Slide for slides with background images
  pptx.defineSlideMaster({
    title: "DARK_MASTER",
    background: { color: "000000" },
    objects: [
      { text: { text: sermonTitle, options: { x: 0.5, y: 0.2, w: 9, h: 0.4, color: "FFFFFF", fontSize: 14, align: "left" } } },
      { text: { text: "Gerado por ConectaSermon", options: { x: 0.5, y: 5.3, w: 9, h: 0.3, color: "FFFFFF", fontSize: 10, align: "right" } } },
    ],
  });

  // Cover Slide
  const coverSlide = pptx.addSlide({ masterName: "MASTER_SLIDE" });
  coverSlide.addText(sermonTitle, {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 2,
    fontSize: 44,
    bold: true,
    color: "1E293B",
    align: "center",
    valign: "middle"
  });
  
  coverSlide.addText("Esboço de Sermão Pastoral", {
    x: 0.5,
    y: 3.5,
    w: 9,
    h: 0.5,
    fontSize: 18,
    color: "EA580C",
    align: "center",
    italic: true
  });

  // Content Slides
  slides.forEach((slide) => {
    const hasImage = !!slide.imageUrl;
    const pptxSlide = pptx.addSlide({ 
      masterName: hasImage ? "DARK_MASTER" : "MASTER_SLIDE" 
    });

    if (hasImage) {
      // Background Image
      pptxSlide.addImage({
        path: slide.imageUrl,
        x: 0,
        y: 0,
        w: "100%",
        h: "100%",
        sizing: { type: "cover", w: 10, h: 5.625 } // standard 16:9 slide size in inches
      });
      // Dark Overlay to improve readability
      pptxSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: "100%",
        h: "100%",
        fill: { color: "000000", transparency: 40 }
      });
    }
    
    // Slide Title
    pptxSlide.addText(slide.title, {
      x: 0.5,
      y: hasImage ? 0.8 : 1.0,
      w: 9,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: hasImage ? "FFFFFF" : "EA580C",
      align: "center",
      underline: hasImage ? { style: "none" } : { style: "sng" }
    });

    // Slide Content
    pptxSlide.addText(slide.content, {
      x: 1,
      y: 2.0,
      w: 8,
      h: 3.0,
      fontSize: 24,
      color: hasImage ? "F8FAFC" : "334155",
      align: "center",
      valign: "top"
    });
  });

  // Save the presentation
  const fileName = `Sermao_${sermonTitle.replace(/[^a-z0-9]/gi, '_')}.pptx`;
  return pptx.writeFile({ fileName });
}
