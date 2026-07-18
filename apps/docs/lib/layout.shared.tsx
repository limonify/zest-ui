import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

/**
 * Shared layout options — the top nav title and links.
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 18,
              height: 18,
              borderRadius: 5,
              background: 'var(--color-fd-primary)',
            }}
          />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>zest</span>
        </>
      ),
    },
    githubUrl: 'https://github.com/limonify/zest',
  };
}
