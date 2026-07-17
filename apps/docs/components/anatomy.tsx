/**
 * Renders a component's part composition as an indented mono tree, e.g.
 * `<Anatomy code={`Dialog.Root\n  Dialog.Trigger\n  Dialog.Portal`} />`.
 */
export function Anatomy({ code }: { code: string }) {
  return (
    <div className="not-prose my-6 overflow-x-auto rounded-xl border border-fd-border bg-fd-muted/60 p-4">
      <pre className="font-mono text-[13px] leading-6 text-fd-foreground">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}
