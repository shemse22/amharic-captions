import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://bgern.com').replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/shems/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/shems/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/shems/'],
      },
      {
        userAgent: 'Applebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/shems/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
