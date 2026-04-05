export const HOSTING_CONFIG_KEY = "roomify_hosting_config";
export const HOSTING_DOMAIN_SUFFIX = ".puter.site";

export interface HostingConfig {
  subdomain: string;
}

export const createHostingSlug = () => `roomify-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

export const getImageExtension = (contentType: string, fallbackUrl: string): string => {
  const typeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return typeToExt[contentType] || fallbackUrl.split('.').pop()?.split('?')[0] || 'png';
};

export const getHostedUrl = ({ subdomain }: HostingConfig, filePath: string): string => {
  const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, '/');
  return `https://${subdomain}${HOSTING_DOMAIN_SUFFIX}/${encodedPath}`;
};

export const isHostedUrl = (url: string): boolean => {
  return url.includes(HOSTING_DOMAIN_SUFFIX);
};

export const fetchBlobFromUrl = async (url: string): Promise<{ blob: Blob; contentType?: string } | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return { 
      blob, 
      contentType: response.headers.get('content-type') || blob.type || undefined 
    };
  } catch {
    return null;
  }
};

export const imageUrlToPngBlob = async (url: string): Promise<Blob | null> => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((pngBlob) => resolve(pngBlob || null), 'image/png');
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
};

