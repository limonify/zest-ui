import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { docsTree } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={docsTree()} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
