export function sanitizeDownloadFilename(value = 'gallery-item') {
  return value
    .toString()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .toLowerCase() || 'gallery-item';
}

export function getDownloadExtension(url = '') {
  const cleanUrl = String(url).split('?')[0].split('#')[0];
  const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : '';
}

export function buildDownloadFilename(item = {}, fallback = 'gallery-item') {
  const baseName = sanitizeDownloadFilename(item.title || item.name || fallback);
  const extension = getDownloadExtension(item.playbackUrl || item.url || '');
  return extension ? `${baseName}.${extension}` : baseName;
}

export async function downloadMediaToDevice(url, filename, options = {}) {
  if (!url) return false;

  const openOnFail = options.openOnFail !== false;

  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!response.ok) throw new Error(`Unable to fetch media (${response.status})`);

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename || 'gallery-item';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return true;
  } catch {
    if (!openOnFail) {
      return false;
    }

    const link = document.createElement('a');
    link.href = url;
    if (filename) {
      link.download = filename;
    }
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return false;
  }
}