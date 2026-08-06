import fs from 'node:fs';
import path from 'node:path';
import { createMarkdownRenderer } from 'fumadocs-core/content/md';
import { getTableOfContents } from 'fumadocs-core/content/toc';
import { remarkHeading } from 'fumadocs-core/mdx-plugins/remark-heading';
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';

const { Markdown } = createMarkdownRenderer({ remarkPlugins: [remarkHeading] });

// The repo-root CHANGELOG.md is the single source of truth — this page renders
// it verbatim, so it can never drift from the file.
const changelog = fs.readFileSync(
  path.join(process.cwd(), '..', '..', 'CHANGELOG.md'),
  'utf8',
);

const toc = getTableOfContents(changelog);

export const metadata = {
  title: 'Changelog',
};

export default function ChangelogPage() {
  return (
    <DocsPage toc={toc}>
      <DocsTitle>Changelog</DocsTitle>
      <DocsDescription>All notable changes to @limonify/zest-ui.</DocsDescription>
      <DocsBody>
        <Markdown components={defaultMdxComponents}>{changelog}</Markdown>
      </DocsBody>
    </DocsPage>
  );
}
