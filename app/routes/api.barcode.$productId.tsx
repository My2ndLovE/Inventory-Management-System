import type { LoaderFunctionArgs } from 'react-router';
import { requireAuth } from '~/lib/auth.server';
import { generateBarcode, generateBarcodeText } from '~/lib/barcode.server';

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const { userId, orgId } = await requireAuth(request, context);
  const db = context.DB;
  const { productId } = params;

  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'code128';

  const product = await db
    .prepare('SELECT id, sku, barcode FROM products WHERE id = ? AND organization_id = ?')
    .bind(productId, orgId)
    .first<{ id: string; sku: string; barcode: string }>();

  if (!product) {
    return new Response('Product not found', { status: 404 });
  }

  const barcodeText = product.barcode || generateBarcodeText(product.id, product.sku);
  const dataUrl = await generateBarcode(barcodeText, format as any);

  // Convert data URL to actual image
  const base64Data = dataUrl.split(',')[1];
  const imageData = atob(base64Data);
  const bytes = new Uint8Array(imageData.length);
  for (let i = 0; i < imageData.length; i++) {
    bytes[i] = imageData.charCodeAt(i);
  }

  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
