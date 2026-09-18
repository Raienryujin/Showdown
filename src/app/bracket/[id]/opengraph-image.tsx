import { ImageResponse } from 'next/og';
import { createClient } from '@/utils/supabase/server';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'Showdown Maker Tournament';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  // Edge runtime limitations mean we might need to parse the ID carefully,
  // but standard await params works in recent Next.js versions.
  // Next 15+ dynamic route params are technically promises in standard pages,
  // but for OG image routes, check Next.js docs. We'll await it to be safe.
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabase = await createClient();

  const { data: bracket } = await supabase
    .from('brackets')
    .select('name')
    .eq('id', id)
    .single();

  const title = bracket?.name || 'Tournament Bracket';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #0a0a0a, #121212)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'sans-serif',
          borderTop: '20px solid #6366f1', // Indigo border
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '2px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '100px',
            padding: '12px 32px',
            marginBottom: '40px',
          }}
        >
          <span style={{ color: '#818cf8', fontSize: '32px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Showdown Maker
          </span>
        </div>

        <h1
          style={{
            fontSize: '80px',
            fontWeight: '900',
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: '30px',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: '36px',
            color: '#a3a3a3',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          A new tournament has been declared. Tap to cast your vote and decide the winner!
        </p>

        {/* Decorative background gradients */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, background: '#6366f1', filter: 'blur(200px)', opacity: 0.15, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, background: '#06b6d4', filter: 'blur(200px)', opacity: 0.15, borderRadius: '50%' }} />
      </div>
    ),
    {
      ...size,
    }
  );
}
