import vsaLogoUrl from "@/assets/vsa-logo.jpg";

/**
 * Loads the VSA logo as a base64 data URL and adds it to a jsPDF document.
 * Returns the Y position after the logo for content to start below it.
 */
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

/**
 * Adds the VSA logo to the top-right of the current page of a jsPDF doc.
 * Call this before adding other content.
 * @returns Promise that resolves when the logo has been added.
 */
export async function addVSALogo(doc: any, x = 160, y = 8, width = 30, height = 15): Promise<void> {
  try {
    const dataUrl = await loadLogoBase64();
    doc.addImage(dataUrl, "JPEG", x, y, width, height);
  } catch {
    // If logo fails to load, silently continue without it
  }
}
