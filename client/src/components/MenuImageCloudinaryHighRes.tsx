// client/src/components/MenuImageCloudinaryHighRes.tsx
import React from 'react';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const SPECS: Record<'card'|'avatar', { w:number,h:number, r:number|'max' }> = {
  card: { w: 80, h: 82, r: 18 },
  avatar: { w: 45, h: 45, r: 'max' }
};

function buildUrl(publicId: string, W: number, H: number, R: number|'max') {
  const rParam = R === 'max' ? 'r_max' : `r_${Math.round(R)}`;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto:good,c_fill,w_${W},h_${H},${rParam}/${publicId}`;
}

export default function MenuImageCloudinaryHighRes({
  publicId,
  variant = 'card',
  alt = ''
}: {
  publicId: string;
  variant?: 'card' | 'avatar';
  alt?: string;
}) {
  const spec = SPECS[variant];
  const densities = [4,5,6]; // you wanted 4x/5x/6x
  const urls = densities.map(d => {
    const W = Math.round(spec.w * d);
    const H = Math.round(spec.h * d);
    const R = spec.r === 'max' ? 'max' : spec.r * d;
    return { d, url: buildUrl(publicId, W, H, R as any) };
  });

  const src = urls[0].url; // 4x as default
  const srcSet = urls.map(u => `${u.url} ${u.d}x`).join(', ');

  return (
    <img
      src={src}
      srcSet={srcSet}
      width={spec.w}
      height={spec.h}
      alt={alt}
      style={{ objectFit: 'cover', borderRadius: variant === 'card' ? spec.r : '50%' }}
      loading="lazy"
    />
  );
}
