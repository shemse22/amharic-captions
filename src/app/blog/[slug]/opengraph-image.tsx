import { ImageResponse } from 'next/og';
import { dbService } from '@/lib/db';

export const alt = 'Bgern creator guide';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const posts = await dbService.getBlogPosts({ status: 'published' });
  const post = posts.find((item) => item.slug === slug);
  const title = post?.title || 'Creator Guides & Video Captioning';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#0a0a0c',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Glow backdrop */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, rgba(59,130,246,0.1) 70%, transparent 100%)',
          }}
        />

        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            B
          </div>
          <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            bgern<span style={{ color: '#06b6d4' }}>.com</span>
          </span>
          <span
            style={{
              marginLeft: '12px',
              padding: '4px 12px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(6,182,212,0.15)',
              color: '#22d3ee',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            Blog
          </span>
        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '950px' }}>
          <div
            style={{
              fontSize: '52px',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-1px',
              color: '#ffffff',
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: '22px', color: '#94a3b8' }}>
            Accurate AI Subtitling & Captioning for Ethiopian Creators
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '1px solid #1e293b',
            paddingTop: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '18px' }}>
            <span>Amharic & English Captions</span>
            <span>•</span>
            <span>Practical creator insights</span>
          </div>
          <div style={{ color: '#38bdf8', fontSize: '18px', fontWeight: 600 }}>
            bgern.com/blog
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
