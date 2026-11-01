export const MAX_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024;

export const RECEIPT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function isSupportedReceiptFile(file: { type: string; size: number }): boolean {
  return (
    RECEIPT_IMAGE_TYPES.some((type) => type === file.type) &&
    file.size > 0 &&
    file.size <= MAX_RECEIPT_SIZE_BYTES
  );
}

export function isSupportedReceiptImage(
  file: { type: string; size: number },
  bytes: Uint8Array
): boolean {
  if (!isSupportedReceiptFile(file) || bytes.length !== file.size) return false;

  if (file.type === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (file.type === 'image/png') {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= pngSignature.length && pngSignature.every((byte, index) => bytes[index] === byte);
  }

  return (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP'
  );
}
