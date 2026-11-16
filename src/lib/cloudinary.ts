export async function triggerDirectDownload(url: string, fileName: string): Promise<void> {
  const safeName = fileName || `pixelfotos_${Date.now()}.jpg`;
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objUrl), 2500);
      return;
    }
  } catch {
    // fallback to anchor navigation
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
