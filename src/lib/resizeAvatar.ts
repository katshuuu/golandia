/** Сжимает изображение до квадрата JPEG для аватара (без огромных строк в metadata). */
export async function fileToAvatarJpegDataUrl(
  file: File,
  maxEdge = 320,
  quality = 0.82
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const w = bitmap.width;
  const h = bitmap.height;
  const edge = Math.min(maxEdge, Math.max(w, h));
  const scale = edge / Math.max(w, h);
  const tw = Math.round(w * scale);
  const th = Math.round(h * scale);

  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas недоступен');
  }
  ctx.drawImage(bitmap, 0, 0, tw, th);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  );
  if (!blob) {
    throw new Error('Не удалось сжать изображение');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = reader.result;
      if (typeof s === 'string') resolve(s);
      else reject(new Error('Ошибка чтения файла'));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
