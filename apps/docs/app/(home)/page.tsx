import Link from 'next/link';

const FEATURES = [
  {
    title: 'Headless',
    body: 'Behaviour, state and accessibility — zero styling. You bring the StyleSheet; every part is a plain React Native primitive.',
  },
  {
    title: 'Accessible',
    body: 'Roles, states, labelling and focus containment are wired for you, adapted to the React Native accessibility model.',
  },
  {
    title: 'Base UI parity',
    body: 'A faithful port of MUI Base UI — real part names (Dialog.Popup, not Content), 32 components, everything portable to mobile.',
  },
  {
    title: 'No animation lock-in',
    body: 'Parts publish measured geometry and transition status on state; you drive the animation with RN Animated. No reanimated required.',
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

const CODE = `import { View, Text, Pressable } from 'react-native';
import { Dialog } from '@limonify/zest';

<Dialog.Root>
  <Dialog.Trigger>
    <Text>Open</Text>
  </Dialog.Trigger>

  <Dialog.Portal>
    <Dialog.Backdrop style={styles.backdrop} />
    <Dialog.Viewport style={styles.center}>
      <Dialog.Popup style={styles.card}>
        <Dialog.Title>Delete file?</Dialog.Title>
        <Dialog.Close>
          <Text>Cancel</Text>
        </Dialog.Close>
      </Dialog.Popup>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog.Root>`;

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 pb-24">
      {/* Hero */}
      <section className="grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div className="flex flex-col gap-6">
          <span className="w-fit rounded-full border border-fd-border bg-fd-muted px-3 py-1 text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">
            Base UI, for React Native
          </span>
          <h1
            className="text-4xl font-bold leading-[1.05] tracking-tight text-fd-foreground md:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Headless primitives that feel native.
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-fd-muted-foreground">
            <span className="font-mono text-fd-foreground">@limonify/zest</span> is a faithful React
            Native port of MUI Base UI — accessible, unstyled building blocks. 32 components, styled
            entirely by you.
          </p>
          <div className="flex flex-wrap gap-3">
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
              Browse components
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-muted/60">
          <div className="flex items-center gap-1.5 border-b border-fd-border px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-fd-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-fd-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-fd-border" />
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6 text-fd-foreground">
            <code>{CODE}</code>
          </pre>
        </div>
      </section>

      {/* Features */}
      <section className="grid gap-px overflow-hidden rounded-xl border border-fd-border bg-fd-border sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-fd-background p-6￼">
            <h3 className="mb-2 text-base font-semibold text-fd-foreground">{f.title}</h3>
            <p className="text-sm leading-relaxed text-fd-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      {/* Component gallery */}
      <section className="mt-16">
        <h2
          className="mb-6 text-2xl font-bold tracking-tight text-fd-foreground"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          32 components
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {GROUPS.map((g) => (
            <div key={g.label}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">
                {g.label}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {g.items.map((c) => (
                  <li key={c}>
                    <Link
                      href={`/docs/components/${c.toLowerCase()}`}
                      className="text-sm text-fd-foreground transition-colors hover:text-fd-primary"
                    >
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
