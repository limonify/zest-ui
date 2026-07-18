import Image from 'next/image';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

/**
 * Shared layout options — the top nav title and links.
 *
 * Drop the mark at `apps/docs/public/logo.png` (served as `/logo.png`).
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        // One child so fumadocs' title `gap-2.5` doesn't sit between logo and text.
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Image
            src="/logo.png"
            alt=""
            width={44}
            height={44}
            aria-hidden
            style={{ display: 'block', borderRadius: 11 }}
          />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>
            zest-ui
          </span>
        </span>
      ),
    },
    githubUrl: 'https://github.com/limonify/zest',
  };
}
