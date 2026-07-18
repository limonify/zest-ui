import Link from 'next/link';
import { highlight } from 'fumadocs-core/highlight';
import type { ReactNode } from 'react';

async function hl(code: string, lang = 'tsx'): Promise<ReactNode> {
  return highlight(code, {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
    components: {
      // Keep shiki's own class (the color rules target `.shiki code span`);
      // only append layout tweaks.
      pre: (props) => (
        <pre
          {...props}
          className={`${props.className ?? ''} overflow-x-auto p-4 text-[12.5px] leading-6 !bg-transparent`}
        />
      ),
    },
  });
}

const HERO_CODE = `import { Switch } from '@limonify/zest-ui';

// style is a function of the part's state.
// No data-attributes, no CSS — just your StyleSheet.
<Switch.Root style={(s) => [styles.track, s.checked && styles.on]}>
  <Switch.Thumb style={(s) => [styles.thumb, s.checked && styles.thumbOn]} />
</Switch.Root>`;

const USE_CODE = `import { Text } from 'react-native';
import { Dialog } from '@limonify/zest-ui';

<Dialog.Root>
  <Dialog.Trigger>
    <Text>Delete</Text>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop style={styles.backdrop} />
    <Dialog.Popup style={styles.card}>
      <Dialog.Title>Delete file?</Dialog.Title>
      <Dialog.Close><Text>Cancel</Text></Dialog.Close>
    </Dialog.Popup>
  </Dialog.Portal>
</Dialog.Root>`;

const FEATURES = [
  {
    title: 'Headless',
    body: 'Behaviour, state and accessibility — zero styling. Each part is a plain React Native primitive that takes your style.',
  },
  {
    title: 'Accessible',
    body: 'Roles, states, labelling and focus containment are wired to the React Native accessibility model for you.',
  },
  {
    title: 'Composable',
    body: 'Every component is a Root plus descriptive parts — Dialog.Popup, Menu.Item. Learn one, know them all.',
  },
  {
    title: 'Unopinionated',
    body: 'No theme, no CSS-in-JS, no motion library. Two runtime deps. You drive animation from state with Animated or Reanimated.',
  },
];

const GROUPS: { label: string; items: string[] }[] = [
  {
    label: 'Buttons & Inputs',
    items: ['Button', 'Checkbox', 'Radio', 'Switch', 'Toggle', 'Slider', 'NumberField', 'OTPField', 'Field', 'Input'],
  },
  {
    label: 'Overlays',
    items: ['Dialog', 'AlertDialog', 'Drawer', 'Popover', 'Tooltip', 'Menu', 'ContextMenu', 'Select', 'Combobox', 'Autocomplete'],
  },
  {
    label: 'Feedback & Disclosure',
    items: ['Progress', 'Meter', 'Toast', 'Accordion', 'Collapsible', 'Tabs', 'Avatar', 'Separator'],
  },
];

function CodeWindow({ file, children }: { file: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-card">
      <div className="flex items-center gap-2 border-b border-fd-border px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-fd-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-fd-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-fd-border" />
        <span className="ml-2 font-mono text-xs text-fd-muted-foreground">{file}</span>
      </div>
      {children}
    </div>
  );
}

export default async function HomePage() {
  const [heroCode, useCode] = await Promise.all([hl(HERO_CODE), hl(USE_CODE)]);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pb-24">
      {/* Hero */}
      <section className="grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-20">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-fd-border px-3 py-1 text-xs font-medium text-fd-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-fd-primary" />
            Headless UI for React Native
          </span>

          <h1
            className="text-4xl font-bold leading-[1.08] tracking-tight text-fd-foreground md:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Unstyled, accessible primitives for React Native.
          </h1>

          <p className="max-w-md text-lg leading-relaxed text-fd-muted-foreground">
            <span className="font-mono text-fd-foreground">@limonify/zest-ui</span> gives you the
            behaviour, state and accessibility of 32 components. You bring the styling.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/docs"
              className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
            <Link
              href="/docs/components/dialog"
              className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-semibold text-fd-foreground transition-colors hover:bg-fd-muted"
            >
              Components
            </Link>
          </div>

          <div className="flex w-fit items-center gap-3 rounded-lg border border-fd-border bg-fd-muted px-4 py-2 font-mono text-sm text-fd-foreground">
            <span className="select-none text-fd-primary">$</span>
            bun add @limonify/zest-ui
          </div>
        </div>

        <CodeWindow file="Switch.tsx">{heroCode}</CodeWindow>
      </section>

      {/* Meta line */}
      <p className="border-y border-fd-border py-4 text-center text-sm text-fd-muted-foreground">
        32 components&nbsp;·&nbsp;630+ tests&nbsp;·&nbsp;2 runtime dependencies&nbsp;·&nbsp;fully typed&nbsp;·&nbsp;MIT
      </p>

      {/* Features */}
      <section className="mt-16 grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title}>
            <h3 className="mb-1.5 text-base font-semibold text-fd-foreground">{f.title}</h3>
            <p className="text-sm leading-relaxed text-fd-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      {/* Quick look */}
      <section className="mt-20 grid gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-center">
        <div>
          <h2
            className="text-2xl font-bold tracking-tight text-fd-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            One shape, every component
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground">
            Import a <span className="font-mono text-fd-foreground">Root</span> and its parts, style
            them with your own <span className="font-mono text-fd-foreground">StyleSheet</span>, and
            ship. Overlays render through a real React Native{' '}
            <span className="font-mono text-fd-foreground">Modal</span>, so context and focus just
            work.
          </p>
          <Link
            href="/docs/installation"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-fd-primary hover:underline"
          >
            Installation
            <span aria-hidden>→</span>
          </Link>
        </div>
        <CodeWindow file="DeleteDialog.tsx">{useCode}</CodeWindow>
      </section>

      {/* Components */}
      <section className="mt-20">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2
            className="text-2xl font-bold tracking-tight text-fd-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Components
          </h2>
          <Link href="/docs/components/button" className="shrink-0 text-sm font-semibold text-fd-primary hover:underline">
            Browse all →
          </Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {GROUPS.map((g) => (
            <div key={g.label}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">
                {g.label}
              </h3>
              <div className="flex flex-wrap gap-2">
                {g.items.map((c) => (
                  <Link
                    key={c}
                    href={`/docs/components/${c.toLowerCase()}`}
                    className="rounded-md border border-fd-border px-2.5 py-1 text-sm text-fd-foreground transition-colors hover:border-fd-primary/50 hover:text-fd-primary"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mt-20 flex flex-col items-center gap-5 rounded-xl border border-fd-border bg-fd-card px-6 py-12 text-center">
        <h2
          className="text-2xl font-bold tracking-tight text-fd-foreground"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Start building
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/docs/installation"
            className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
          <a
            href="https://github.com/limonify/zest"
            className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-semibold text-fd-foreground transition-colors hover:bg-fd-muted"
          >
            GitHub
          </a>
        </div>
      </section>
    </main>
  );
}
