import type { ReactNode } from 'react';

/**
 * A slot for a component demo. On React Native there is no live web preview
 * (the anchored-popup family relies on native measurement), so demos are shown
 * as GIFs recorded from the example app. Until a GIF is added, this renders a
 * labelled placeholder.
 */
export function Demo({ src, alt, children }: { src?: string; alt?: string; children?: ReactNode }) {
  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-fd-border bg-fd-muted">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? ''} className="mx-auto block w-full max-w-sm" />
      ) : (
        <div className="flex min-h-52 flex-col items-center justify-center gap-2 p-8 text-center">
          <div
            aria-hidden
            className="grid h-11 w-11 place-items-center rounded-lg border border-fd-border bg-fd-background text-fd-muted-foreground"
          >
            ▶
          </div>
          <p className="text-sm font-medium text-fd-foreground">Demo</p>
          <p className="max-w-xs text-xs text-fd-muted-foreground">
            {children ?? 'A recorded demo (GIF) goes here.'}
          </p>
        </div>
      )}
    </div>
  );
}
