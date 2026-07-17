import Link from 'next/link';
import { highlight } from 'fumadocs-core/highlight';
import type { ReactNode } from 'react';

async function hl(code: string, lang = 'tsx'): Promise<ReactNode> {
  return highlight(code, {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
    components: {
      pre: (props) => (
        <pre {...props} className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6 !bg-transparent" />
      ),
    },
  });
}

const HERO_CODE = `import { Switch } from '@limonify/zest';

// 'style' is a function of the part's state —
// no data-attributes, no CSS. Just your StyleSheet.
export function Toggle() {
  return (
    <Switch.Root
      style={(state) => [
        styles.track,
        state.checked && styles.trackOn,
      ]}
    >
      <Switch.Thumb
        style={(state) => [
          styles.thumb,
          state.checked && styles.thumbOn,
        ]}
      />
    </Switch.Root>
  );
}`;

const SHOWCASE_CODE = `import { Text } from 'react-native';
import { Select } from '@limonify/zest';

<Select.Root items={fruits}>
  <Select.Trigger style={styles.trigger}>
    <Select.Value placeholder="Pick a fruit" />
    <Select.Icon />
  </Select.Trigger>

  <Select.Portal>
    <Select.Positioner>
      <Select.Popup style={styles.popup}>
        <Select.List>
          {fruits.map((f) => (
            <Select.Item key={f.value} value={f.value} style={styles.item}>
              <Select.ItemText>{f.label}</Select.ItemText>
              <Select.ItemIndicator>
                <Text>✓</Text>
              </Select.ItemIndicator>
            </Select.Item>
          ))}
        </Select.List>
      </Select.Popup>
    </Select.Positioner>
  </Select.Portal>
</Select.Root>`;

const INSTALL_CODE = `# Core — zero native setup
bun add @limonify/zest

# Only if you use Slider or Drawer
bun add react-native-gesture-handler`;

const WRAP_CODE = `import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <YourApp />
    </GestureHandlerRootView>
  );
}`;

const USE_CODE = `import { Text } from 'react-native';
import { Dialog } from '@limonify/zest';

<Dialog.Root>
  <Dialog.Trigger>
    <Text>Open</Text>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop style={styles.backdrop} />
    <Dialog.Popup style={styles.card}>
      <Dialog.Title>Hello</Dialog.Title>
    </Dialog.Popup>
  </Dialog.Portal>
</Dialog.Root>`;

const STATS = [
  { value: '32', label: 'components' },
  { value: '630+', label: 'tests' },
  { value: '2', label: 'runtime deps' },
  { value: '100%', label: 'TypeScript' },
];

const FEATURES = [
  {
    title: 'Truly headless',
    body: 'Behaviour, state and accessibility — zero styling. Every part is a plain React Native primitive you style with StyleSheet, Uniwind or NativeWind.',
    icon: <path d="M4 7h16M4 12h10M4 17h7" strokeWidth="2" strokeLinecap="round" />,
  },
  {
    title: 'Accessible by default',
    body: 'Roles, states, labelling and focus containment are wired for you — mapped to the React Native accessibility model, not bolted on.',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" strokeWidth="2" />
        <path d="M8 12.5l2.5 2.5L16 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: 'You own the animation',
    body: 'Parts publish measured geometry and transition status on state. Drive it with RN Animated or Reanimated — never locked into a motion library.',
    icon: <path d="M3 12c3-7 5-7 8 0s5 7 8 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: 'Almost zero deps',
    body: 'Two runtime dependencies, and gesture-handler is an optional peer only Slider and Drawer touch. No CSS-in-JS, no reanimated requirement.',
    icon: (
      <>
        <path d="M12 3v18" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="7" r="2.5" strokeWidth="2" />
        <circle cx="12" cy="17" r="2.5" strokeWidth="2" />
      </>
    ),
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Install',
    body: 'Add the package. No native modules unless you reach for Slider or Drawer.',
    lang: 'bash' as const,
    code: INSTALL_CODE,
  },
  {
    n: '02',
    title: 'Wrap',
    body: 'Gesture components need one provider at the root. Everything else works out of the box.',
    lang: 'tsx' as const,
    code: WRAP_CODE,
  },
  {
    n: '03',
    title: 'Compose',
    body: 'Import a Root and its parts, style them how you like, and ship.',
    lang: 'tsx' as const,
    code: USE_CODE,
  },
];

const GROUPS: { label: string; items: string[] }[] = [
  {
    label: 'Buttons & Inputs',
    items: ['Button', 'Checkbox', 'CheckboxGroup', 'Radio', 'RadioGroup', 'Switch', 'Toggle', 'ToggleGroup', 'Slider', 'NumberField', 'OTPField', 'Field', 'Fieldset', 'Input'],
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

export default async function HomePage() {
  const [heroCode, showcaseCode, stepCodes] = await Promise.all([
    hl(HERO_CODE),
    hl(SHOWCASE_CODE),
    Promise.all(STEPS.map((s) => hl(s.code, s.lang))),
  ]);

  return (
    <main className="relative w-full overflow-hidden">
      {/* Dot grid + citrus glow behind the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]"
        style={{
          backgroundImage:
            'radial-gradient(color-mix(in oklab, var(--color-fd-border) 90%, transparent) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(70% 60% at 50% 0%, #000 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(70% 60% at 50% 0%, #000 0%, transparent 75%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
        style={{
          background:
            'radial-gradient(55% 55% at 50% 0%, color-mix(in oklab, var(--color-fd-primary) 14%, transparent) 0%, transparent 70%)',
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-6 pb-28">
        {/* Hero */}
        <section className="grid gap-12 py-16 md:grid-cols-[1fr_1.05fr] md:items-center md:py-24">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-fd-border bg-fd-card/80 px-3 py-1 text-xs font-medium text-fd-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-fd-primary" />
              Headless UI for React Native
            </span>

            <h1
              className="text-4xl font-bold leading-[1.02] tracking-tight text-fd-foreground md:text-[3.5rem]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Unstyled, accessible
              <br />
              primitives that feel <span className="text-fd-primary">native.</span>
            </h1>

            <p className="max-w-md text-lg leading-relaxed text-fd-muted-foreground">
              <span className="font-mono text-fd-foreground">@limonify/zest</span> gives you the
              behaviour, state and accessibility of 32 components — and none of the styling. Ship your
              own design system on top.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/docs"
                className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
              >
                Get started
              </Link>
              <a
                href="https://github.com/limonify/zest"
                className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-5 py-2.5 text-sm font-semibold text-fd-foreground transition-colors hover:bg-fd-muted"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 2.5-.34c.85 0 1.71.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.03 10.03 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
                </svg>
                GitHub
              </a>
            </div>

            <div className="mt-1 flex w-fit items-center gap-3 rounded-lg border border-fd-border bg-fd-muted px-4 py-2.5 font-mono text-sm text-fd-foreground">
              <span className="select-none text-fd-primary">$</span>
              bun add @limonify/zest
            </div>
          </div>

          {/* Hero code window */}
          <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-card shadow-lg shadow-black/5">
            <div className="flex items-center gap-2 border-b border-fd-border px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-fd-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-fd-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-fd-border" />
              <span className="ml-2 font-mono text-xs text-fd-muted-foreground">Toggle.tsx</span>
            </div>
            {heroCode}
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-fd-border bg-fd-border sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 bg-fd-background px-4 py-6">
              <span
                className="text-3xl font-bold tracking-tight text-fd-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {s.value}
              </span>
              <span className="text-xs uppercase tracking-wide text-fd-muted-foreground">{s.label}</span>
            </div>
          ))}
        </section>

        {/* Composable showcase */}
        <section className="mt-24 grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-fd-primary">
              One consistent API
            </span>
            <h2
              className="mt-3 text-3xl font-bold tracking-tight text-fd-foreground"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Composable by design
            </h2>
            <p className="mt-3 max-w-md text-base leading-relaxed text-fd-muted-foreground">
              Every component is a <span className="font-mono text-fd-foreground">Root</span> plus
              descriptive parts — <span className="font-mono text-fd-foreground">Trigger</span>,{' '}
              <span className="font-mono text-fd-foreground">Portal</span>,{' '}
              <span className="font-mono text-fd-foreground">Popup</span>,{' '}
              <span className="font-mono text-fd-foreground">Item</span>. Learn the shape once and
              every other component reads the same way. Real part names, no mystery props.
            </p>
            <Link
              href="/docs/components/select"
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-fd-primary hover:underline"
            >
              Explore the Select API
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-fd-border px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-fd-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-fd-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-fd-border" />
              <span className="ml-2 font-mono text-xs text-fd-muted-foreground">FruitSelect.tsx</span>
            </div>
            {showcaseCode}
          </div>
        </section>

        {/* Feature grid */}
        <section className="mt-24">
          <h2
            className="text-3xl font-bold tracking-tight text-fd-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Everything wired, nothing in your way
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-fd-border bg-fd-card p-6 transition-colors hover:border-fd-primary/40"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-fd-accent text-fd-accent-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="mb-2 text-base font-semibold text-fd-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-fd-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick start — install → wrap → use */}
        <section className="mt-24">
          <span className="text-xs font-semibold uppercase tracking-wide text-fd-primary">
            Up and running in minutes
          </span>
          <h2
            className="mt-3 text-3xl font-bold tracking-tight text-fd-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Install, wrap, compose
          </h2>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-card">
                <div className="flex items-start gap-3 p-5">
                  <span
                    className="font-mono text-sm font-semibold text-fd-primary"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {s.n}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-fd-foreground">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-fd-muted-foreground">{s.body}</p>
                  </div>
                </div>
                <div className="mt-auto border-t border-fd-border bg-fd-muted/40 text-[12px]">
                  {stepCodes[i]}
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/docs/installation"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-fd-primary hover:underline"
          >
            Full installation guide
            <span aria-hidden>→</span>
          </Link>
        </section>

        {/* Component index */}
        <section className="mt-24">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2
              className="text-3xl font-bold tracking-tight text-fd-foreground"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              32 components, one mental model
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
                      className="rounded-md border border-fd-border bg-fd-card px-2.5 py-1 text-sm text-fd-foreground transition-colors hover:border-fd-primary/50 hover:text-fd-primary"
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mt-28 overflow-hidden rounded-2xl border border-fd-border bg-fd-card px-8 py-16 text-center">
          <h2
            className="text-3xl font-bold tracking-tight text-fd-foreground md:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Bring your design. We&apos;ll bring the rest.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-fd-muted-foreground">
            Drop zest into any Expo or bare React Native app. Accessible, tested, and typed — styled
            entirely by you.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/docs/installation"
              className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Get started
            </Link>
            <Link
              href="/docs/philosophy"
              className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-semibold text-fd-foreground transition-colors hover:bg-fd-muted"
            >
              Read the philosophy
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
