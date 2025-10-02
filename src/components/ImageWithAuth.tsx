import React, { useEffect, useState } from 'react';
import { getAuthHeader } from '@/lib/auth';

interface ImageWithAuthProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  srcPath: string; // Relative API path or absolute URL
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function resolveUrl(srcPath: string): string {
  if (!srcPath) return '';
  // If absolute URL, use as-is
  if (/^https?:\/\//i.test(srcPath)) return srcPath;
  // Normalize relative path
  const cleanPath = srcPath.startsWith('/') ? srcPath.slice(1) : srcPath;
  return `${API_BASE_URL}/${cleanPath}`;
}

export const ImageWithAuth: React.FC<ImageWithAuthProps> = ({ srcPath, alt = '', className, onClick, ...rest }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState<boolean>(false);

  const fullUrl = resolveUrl(srcPath);

  useEffect(() => {
    let isMounted = true;
    let urlToRevoke: string | null = null;

    async function load() {
      setFailed(false);
      try {
        const res = await fetch(fullUrl, { headers: { ...getAuthHeader() } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        urlToRevoke = URL.createObjectURL(blob);
        if (isMounted) setObjectUrl(urlToRevoke);
      } catch (e) {
        // Fallback: try direct URL without auth if auth fetch fails
        setFailed(true);
        if (isMounted) setObjectUrl(null);
      }
    }

    if (fullUrl) load();

    return () => {
      isMounted = false;
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    };
  }, [fullUrl]);

  // Prefer the blob URL (authorized), fallback to direct URL if needed
  const src = objectUrl || (failed ? fullUrl : undefined);

  if (!fullUrl) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      {...rest}
    />
  );
};

export default ImageWithAuth;
