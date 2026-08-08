'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { isDemoName } from './demos/names';

/**
 * A live component demo.
 *
 * These are the real components — the same source the native app runs — mounted
 * in the browser through `react-native-web`.
 *
 * Nothing React Native is imported from this file. The site is a static export,
 * so every page is prerendered in Node, where a React Native module blows up on
 * the `__DEV__` global Metro would have defined; the whole of that side lives
 * behind `DemoStage`, which only ever loads in the browser.
 *
 * `name` selects a demo. Without one (or with a name that has no demo yet) the
 * children stand in as a caption, which is what every page showed before any of
 * this existed.
 */
const DemoStage = dynamic(() => import('./demos/stage').then((m) => m.DemoStage), {
  ssr: false,
  // Holds the height so the page does not jump when the demo arrives.
  loading: () => <div className="min-h-40" aria-hidden />,
});

export function Demo({ name, children }: { name?: string; children?: ReactNode }) {
  if (!isDemoName(name)) {
    return <Placeholder>{children}</Placeholder>;
  }

  // No frame of its own: every demo sits in the Preview tab of a Usage block,
  // and nesting a bordered card inside a bordered tab panel reads as two boxes.
  return (
    <div className="not-prose -mx-2 overflow-hidden">
      <DemoStage name={name} />
    </div>
  );
}

function Placeholder({ children }: { children?: ReactNode }) {
  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-fd-border bg-fd-muted">
      <div className="flex min-h-52 flex-col items-center justify-center gap-2 p-8 text-center">
        <div
          aria-hidden
          className="grid h-11 w-11 place-items-center rounded-lg border border-fd-border bg-fd-background text-fd-muted-foreground"
        >
          ▶
        </div>
        <p className="text-sm font-medium text-fd-foreground">Demo</p>
        <p className="max-w-xs text-xs text-fd-muted-foreground">
          {children ?? 'A live demo goes here.'}
        </p>
      </div>
    </div>
  );
}
