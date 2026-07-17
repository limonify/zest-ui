import Link from 'next/link';
import { highlight } from 'fumadocs-core/highlight';

const STATS = [
  { value: '32', label: 'components' },
  { value: '630+', label: 'tests' },
  { value: '2', label: 'runtime deps' },
  { value: '100%', label: 'typed' },
];

const FEATURES = [
  {
    title: 'Truly headless',
    body: 'Behaviour, state and accessibility — zero styling. Every part is a plain React Native primitive you style with your own StyleSheet, Uniwind or NativeWind.',
    icon: (
      <path d="M4 7h16M4 12h10M4 17h7" strokeWidth="2" strokeLinecap="round" />
    ),
  },
  {
    title: 'Accessible by default',
    body: 'Roles, states, labelling and focus containment are wired for you — adapted to the React Native accessibility model, not bolted on.',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" strokeWidth="2" />
        <path d="M8 12.5l2.5 2.5L16 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: 'Predictable, composable API',
    body: 'Real, descriptive part names — Dialog.Popup, Menu.Item, Select.Trigger — and the same Root → parts shape on every component. Learn one, know them all.',
    icon: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1.5" strokeWidth="2" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" strokeWidth="2" />
        <path d="M13 7h5a3 3 0 0 1 3 3v1M11 17H6a3 3 0 0 1-3-3v-1" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: 'You own the animation',
    body: 'Parts publish measured geometry and transition status on state. Drive it with RN Animated or Reanimated — zest never locks you into a motion library.',
    icon: (
      <path d="M3 12c3-7 5-7 8 0s5 7 8 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

const PRINCIPLES = [
  {
    title: 'Portals are Modals',
    body: 'Every overlay is a real RN Modal, so context survives the portal boundary and focus is contained for free.',
  },
  {
    title: 'State, not data-attributes',
    body: "The web's data-open / data-checked become fields on a state object you read from style and render functions.",
  },
  {
    title: 'Never styled, never animated',
    body: 'zest ships behaviour only. Two runtime deps, no CSS-in-JS, no reanimated requirement. The look is entirely yours.',
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

const CODE = `import { Switch } from '@limonify/zest';

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

export default async function HomePage() {
  const code = await highlight(CODE, {
    lang: 'tsx',
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
    components: {
      pre: (props) => (
        <pre {...props} className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6 !bg-transparent" />
      ),
    },
  });

  return (
    <main className="relative w-full overflow-hidden">
      {/* Soft citrus glow behind the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--color-fd-primary) 16%, transparent) 0%, transparent 70%)',
        }}
      />

      <div className="mx-auto w-full max-w-5xl px-6 pb-28">
        {/* Hero */}
        <section className="grid gap-10 py-16 md:grid-cols-[1.1fr_1fr] md:items-center md:py-24">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-fd-border bg-fd-card px-3 py-1 text-xs font-medium text-fd-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-fd-primary" />
              Headless UI for React Native
            </span>

            <h1
              className="text-4xl font-bold leading-[1.03] tracking-tight text-fd-foreground md:text-[3.4rem]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Headless primitives
              <br />
              that feel{' '}
              <span className="text-fd-primary">native.</span>
            </h1>

            <p className="max-w-md text-lg leading-relaxed text-fd-muted-foreground">
              <span className="font-mono text-fd-foreground">@limonify/zest</span> gives you accessible,
              unstyled building blocks for React Native — behaviour and a11y done, the look entirely
              yours. 32 components, one consistent API.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/docs"
                className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
              >
                Get started
              </Link>
              <Link
                href="/docs/components/dialog"
                className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-semibold text-fd-foreground transition-colors hover:bg-fd-muted"
              >
                Browse components
              </Link>
            </div>

            <div className="mt-1 flex w-fit items-center gap-3 rounded-lg border border-fd-border bg-fd-muted px-4 py-2.5 font-mono text-sm text-fd-foreground">
              <span className="select-none text-fd-muted-foreground">$</span>
              bun add @limonify/zest
            </div>
          </div>

          {/* Code window */}
          <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-fd-border px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-fd-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-fd-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-fd-border" />
              <span className="ml-2 font-mono text-xs text-fd-muted-foreground">Toggle.tsx</span>
            </div>
            {code}
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

        {/* Features */}
        <section className="mt-20 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-fd-border bg-fd-card p-6 transition-colors hover:border-fd-primary/40"
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
        </section>

        {/* Principles */}
        <section className="mt-20">
          <h2
            className="text-2xl font-bold tracking-tight text-fd-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Built for React Native, not adapted to it
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-fd-muted-foreground">
            zest doesn&apos;t paper over the web-to-native gap — it re-derives every pattern from
            React Native&apos;s own model.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <div key={p.title} className="rounded-xl border border-fd-border bg-fd-card p-6">
                <span className="font-mono text-xs text-fd-primary">0{i + 1}</span>
                <h3 className="mb-2 mt-3 text-base font-semibold text-fd-foreground">{p.title}</h3>
                <p className="text-sm leading-relaxed text-fd-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
          <Link
            href="/docs/philosophy"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-fd-primary hover:underline"
          >
            Read the philosophy
            <span aria-hidden>→</span>
          </Link>
        </section>

        {/* Component gallery */}
        <section className="mt-20">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2
              className="text-2xl font-bold tracking-tight text-fd-foreground"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              32 components, one API
            </h2>
            <Link href="/docs/components/button" className="text-sm font-semibold text-fd-primary hover:underline">
              See all
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
        <section className="mt-24 overflow-hidden rounded-2xl border border-fd-border bg-fd-card px-8 py-14 text-center">
          <h2
            className="text-3xl font-bold tracking-tight text-fd-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Start building
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fd-muted-foreground">
            Drop zest into any Expo or bare React Native app. Bring your own design system — zest
            handles the rest.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/docs/installation"
              className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Installation
            </Link>
            <a
              href="https://github.com/limonify/zest"
              className="rounded-lg border border-fd-border px-5 py-2.5 text-sm font-semibold text-fd-foreground transition-colors hover:bg-fd-muted"
            >
              GitHub
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
