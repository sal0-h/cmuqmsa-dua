import { jsPDF } from "jspdf";
import type { Dua } from "./db";

export async function generatePDF(duas: Dua[], filename = "dua-list.pdf") {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  for (let i = 0; i < duas.length; i++) {
    const d = duas[i];
    addPageIfNeeded(120);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(d.title, margin, y);
    y += 18;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`[${d.category}]`, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 14;

    if (d.transliteration) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11);
      doc.text(d.transliteration, margin, y, { maxWidth });
      const translitLines = doc.splitTextToSize(d.transliteration, maxWidth);
      y += translitLines.length * 13 + 4;
      doc.setFont("helvetica", "normal");
    } else if (d.arabic_text) {
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text("(Use .tex export for Arabic text)", margin, y);
      doc.setTextColor(0, 0, 0);
      y += 12;
    }

    doc.setFontSize(11);
    doc.text(d.translation, margin, y, { maxWidth });
    const transLines = doc.splitTextToSize(d.translation, maxWidth);
    y += transLines.length * 13 + 4;

    if (d.source) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Source: ${d.source}`, margin, y);
      doc.setTextColor(0, 0, 0);
      y += 12;
    }

    y += 16;
  }

  doc.save(filename);
}
