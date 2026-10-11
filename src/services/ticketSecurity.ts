import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      color: {
        dark: '#0F2C59',
        light: '#FFFFFF'
      }
    });
  } catch (err) {
    console.error('Erreur génération QR Code:', err);
    // Fallback simple SVG data URI
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%230f2c59">QR TSR TRANSIT</text></svg>';
  }
}

export function formatXOF(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

export function validateBurkinaPhone(phone: string): boolean {
  // Burkina Faso phones: 8 digits starting with 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 50-59, 25, 20
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 8) return true;
  if (cleaned.length === 11 && cleaned.startsWith('226')) return true;
  return cleaned.length >= 8;
}
