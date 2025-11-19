// Barcode generation utilities
// Note: bwip-js doesn't work in Cloudflare Workers due to Canvas dependency
// We'll create a placeholder that can be enhanced with a different approach

export async function generateBarcode(text: string, format: 'code128' | 'qrcode' = 'code128'): Promise<string> {
  // For now, return a data URL placeholder
  // In production, you could use:
  // 1. Client-side barcode generation with JsBarcode
  // 2. External barcode API service
  // 3. Pre-generated barcodes stored in R2

  // SVG-based barcode placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
      <rect fill="white" width="200" height="80"/>
      <rect fill="black" x="20" y="10" width="2" height="50"/>
      <rect fill="black" x="25" y="10" width="3" height="50"/>
      <rect fill="black" x="30" y="10" width="1" height="50"/>
      <rect fill="black" x="35" y="10" width="2" height="50"/>
      <rect fill="black" x="40" y="10" width="4" height="50"/>
      <rect fill="black" x="47" y="10" width="1" height="50"/>
      <rect fill="black" x="50" y="10" width="2" height="50"/>
      <rect fill="black" x="55" y="10" width="3" height="50"/>
      <rect fill="black" x="60" y="10" width="2" height="50"/>
      <rect fill="black" x="65" y="10" width="1" height="50"/>
      <rect fill="black" x="70" y="10" width="4" height="50"/>
      <rect fill="black" x="77" y="10" width="2" height="50"/>
      <text x="100" y="75" font-family="monospace" font-size="12" text-anchor="middle">${text}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function generateBarcodeText(productId: string, sku: string): string {
  return sku.length <= 12 ? sku : productId.substring(0, 12);
}
