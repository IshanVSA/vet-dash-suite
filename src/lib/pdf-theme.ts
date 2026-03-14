import { format } from "date-fns";
import vsaLogoUrl from "@/assets/vsa-logo.jpg";

let cachedLogoDataUrl: string | null = null;

async function loadLogoBase64(): Promise<string> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  const response = await fetch(vsaLogoUrl);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      cachedLogoDataUrl = reader.result as string;
      resolve(cachedLogoDataUrl);
    };
    reader.readAsDataURL(blob);
  });
}

// ── Brand Colors ──
export const PDF_COLORS = {
  dark: [24, 24, 27] as [number, number, number],       // zinc-900
  medium: [82, 82, 91] as [number, number, number],     // zinc-600
  light: [161, 161, 170] as [number, number, number],   // zinc-400
  border: [228, 228, 231] as [number, number, number],  // zinc-200
  bgAlt: [244, 244, 245] as [number, number, number],   // zinc-100
  white: [255, 255, 255] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  // Department accent colors
  website: [249, 115, 22] as [number, number, number],  // orange-500
  seo: [20, 184, 166] as [number, number, number],      // teal-500
  googleAds: [59, 130, 246] as [number, number, number],// blue-500
  social: [168, 85, 247] as [number, number, number],   // purple-500
};

/**
 * Renders a branded header banner on the first page of the PDF.
 * Returns the Y position after the header.
 */
export function renderPDFHeader(
  doc: any,
  title: string,
  clinicName: string,
  subtitle: string,
  accentColor: [number, number, number] = PDF_COLORS.dark
): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top accent bar
  doc.setFillColor(...accentColor);
  doc.rect(0, 0, pageWidth, 3, "F");

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.dark);
  doc.text(title, 14, 20);

  // Clinic name
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_COLORS.medium);
  doc.text(clinicName, 14, 28);

  // Subtitle / date range
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.light);
  doc.text(subtitle, 14, 34);

  // Separator line
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(14, 38, pageWidth - 14, 38);

  return 46;
}

/**
 * Renders a section header with a colored left accent bar.
 * Returns the Y position after the header.
 */
export function renderSectionHeader(
  doc: any,
  title: string,
  y: number,
  accentColor: [number, number, number] = PDF_COLORS.dark,
  subtitle?: string
): number {
  // Colored left accent bar
  doc.setFillColor(...accentColor);
  doc.roundedRect(14, y - 4, 3, subtitle ? 14 : 10, 1, 1, "F");

  // Title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PDF_COLORS.dark);
  doc.text(title, 21, y + 2);

  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_COLORS.light);
    doc.text(subtitle, 21, y + 8);
    return y + 16;
  }

  return y + 10;
}

/**
 * Professional table styling options for autoTable.
 */
export function getTableStyles(accentColor: [number, number, number] = PDF_COLORS.googleAds) {
  return {
    theme: "plain" as const,
    headStyles: {
      fillColor: accentColor,
      textColor: PDF_COLORS.white,
      fontStyle: "bold" as const,
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: PDF_COLORS.dark,
      cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.bgAlt,
    },
    styles: {
      lineColor: PDF_COLORS.border,
      lineWidth: 0.25,
      overflow: "linebreak" as const,
    },
    tableLineColor: PDF_COLORS.border,
    tableLineWidth: 0.25,
  };
}

/**
 * Color-coded change cell renderer for autoTable didParseCell.
 */
export function colorChangeCell(data: any, columnIndex: number) {
  if (data.section === "body" && data.column.index === columnIndex) {
    const val = data.cell.text[0] || "";
    data.cell.styles.fontStyle = "bold";
    if (val.startsWith("+")) data.cell.styles.textColor = PDF_COLORS.green;
    else if (val.startsWith("-")) data.cell.styles.textColor = PDF_COLORS.red;
    else data.cell.styles.textColor = PDF_COLORS.light;
  }
}

/**
 * Renders KPI summary boxes as a row of mini cards.
 * Returns the Y position after the cards.
 */
export function renderKPICards(
  doc: any,
  y: number,
  cards: { label: string; value: string; change?: string }[],
  accentColor: [number, number, number] = PDF_COLORS.googleAds
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const gap = 4;
  const availableWidth = pageWidth - margin * 2;
  const cardWidth = (availableWidth - gap * (cards.length - 1)) / cards.length;
  const cardHeight = 22;

  cards.forEach((card, i) => {
    const x = margin + i * (cardWidth + gap);

    // Card background
    doc.setFillColor(...PDF_COLORS.bgAlt);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "F");

    // Top accent line
    doc.setFillColor(...accentColor);
    doc.rect(x, y, cardWidth, 1.5, "F");

    // Value
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PDF_COLORS.dark);
    const valueWidth = doc.getTextWidth(card.value);
    doc.text(card.value, x + cardWidth / 2 - valueWidth / 2, y + 10);

    // Label
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_COLORS.light);
    const labelWidth = doc.getTextWidth(card.label);
    doc.text(card.label, x + cardWidth / 2 - labelWidth / 2, y + 15);

    // Change indicator
    if (card.change) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      const isPositive = card.change.startsWith("+");
      const isNegative = card.change.startsWith("-");
      doc.setTextColor(...(isPositive ? PDF_COLORS.green : isNegative ? PDF_COLORS.red : PDF_COLORS.light));
      const changeWidth = doc.getTextWidth(card.change);
      doc.text(card.change, x + cardWidth / 2 - changeWidth / 2, y + 20);
    }
  });

  return y + cardHeight + 6;
}

/**
 * Adds branded footer and logo to all pages. Call right before doc.save().
 */
export async function finalizePDF(doc: any): Promise<void> {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Load logo
  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await loadLogoBase64();
  } catch {
    // continue without logo
  }

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Bottom border line
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    // Footer text
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_COLORS.light);
    doc.text(
      `Generated on ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}`,
      14,
      pageHeight - 9
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 14,
      pageHeight - 9,
      { align: "right" }
    );

    // Logo top-right
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, "JPEG", pageWidth - 48, 6, 34, 17);
      } catch {
        // silently continue
      }
    }
  }
}

/**
 * Ensures Y doesn't overflow, adds page if needed.
 */
export function ensureSpace(doc: any, y: number, needed: number = 40): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    return 16;
  }
  return y;
}
