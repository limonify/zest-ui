import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { GeneratedDoc } from 'fumadocs-typescript';
import { source } from '@/lib/source';
import { typeGenerator } from '@/lib/type-generator';

/**
 * llms.txt / llms-full.txt generation (https://llmstxt.org).
 *
 * `llms.txt` is the index — one link per page, grouped by section.
 * `llms-full.txt` inlines every page as plain markdown: MDX-only components
 * (`Tabs`, `Demo`, `Anatomy`, `Callout`, `AutoType`) are lowered to markdown
 * so a model reads prose, code and prop tables without any JSX noise.
 *
 * Both are produced at build time by the route handlers in `app/llms.txt`
 * and `app/llms-full.txt`, and land in the static export as plain files.
 */

const SITE_URL = 'https://zestui.limonify.com';
const REPO_URL = 'https://github.com/limonify/zest';
const CONTENT_DIR = path.join(process.cwd(), 'content/docs');

const SUMMARY =
  'Headless, unstyled, accessible primitive components for React Native. ' +
  'zest-ui (`@limonify/zest-ui`) gives you behaviour, state and accessibility with zero styling — ' +
  'its API mirrors MUI Base UI, with composable part names like `Dialog.Popup` and `Select.Trigger`. ' +
  'Every part renders a plain React Native primitive and takes your `style`, which may be a function of the part state.';

interface DocPage {
  /** Absolute file path of the source `.mdx`. */
  file: string;
  url: string;
  title: string;
  description?: string;
  /** Section title from `meta.json`, e.g. `Components`. */
  section?: string;
}

/**
 * The pages in sidebar order — `pageTree` already applies each `meta.json`,
 * so llms.txt reads in the same order a human browses the site.
 */
function docPages(): DocPage[] {
  const byUrl = new Map(source.getPages().map((page) => [page.url, page]));
  const pages: DocPage[] = [];

  type Node = {
    type?: string;
    name?: unknown;
    url?: string;
    index?: Node;
    children?: Node[];
  };

  const push = (node: Node, section?: string) => {
    if (!node.url) return;
    const page = byUrl.get(node.url);
    if (!page) return;
    pages.push({
      file: path.join(CONTENT_DIR, page.path),
      url: page.url,
      title: page.data.title ?? String(node.name ?? page.url),
      description: page.data.description,
      section,
    });
  };

  const walk = (nodes: Node[] = [], section?: string) => {
    for (const node of nodes) {
      if (node.type === 'folder') {
        const name = typeof node.name === 'string' ? node.name : section;
        if (node.index) push(node.index, name);
        walk(node.children, name);
      } else if (node.type === 'page') {
        push(node, section);
      }
    }
  };

  walk((source.pageTree as Node).children, undefined);
  return pages;
}

/** Squash a value onto one line — a markdown table cell can't hold a newline. */
function oneLine(value = ''): string {
  return value.replace(/\s*\r?\n\s*/g, ' ').trim();
}

/** One line, with `|` escaped so it stays inside its table cell. */
function inline(value = ''): string {
  return oneLine(value).replace(/\|/g, '\\|');
}

function renderTypeTable(doc: GeneratedDoc): string {
  const hasDefaults = doc.entries.some((entry) =>
    entry.tags.some((tag) => tag.name === 'defaultValue'),
  );

  const rows = doc.entries.map((entry) => {
    // `simplifiedType` is the UI's short label ("union", "function"); the full
    // type is what actually tells a reader what to pass. The trailing
    // `| undefined` on optional props is already said by the `?`.
    const raw = oneLine(entry.type || entry.simplifiedType) || 'unknown';
    const type = (entry.required ? raw : raw.replace(/\s*\|\s*undefined$/, '')).replace(
      /\|/g,
      '\\|',
    );
    const fallback = entry.tags.find((tag) => tag.name === 'defaultValue')?.text;
    const description = inline(entry.description) || '—';
    const cells = [`\`${entry.name}${entry.required ? '' : '?'}\``, `\`${type}\``];
    // Only carry a Default column when some prop documents one.
    if (hasDefaults) cells.push(fallback ? `\`${inline(fallback)}\`` : '—');
    cells.push(`${entry.deprecated ? '**Deprecated.** ' : ''}${description}`);
    return `| ${cells.join(' | ')} |`;
  });

  const columns = hasDefaults ? ['Prop', 'Type', 'Default', 'Description'] : ['Prop', 'Type', 'Description'];

  return [
    `**${doc.name}**`,
    doc.description ? `\n${inline(doc.description)}` : '',
    '',
    `| ${columns.join(' | ')} |`,
    `| ${columns.map(() => '---').join(' | ')} |`,
    ...rows,
  ]
    .filter((line, index) => line !== '' || index > 1)
    .join('\n');
}

/** `<AutoType path="..." name="..." />` → the same props table, in markdown. */
async function autoTypeToMarkdown(attributes: string): Promise<string> {
  const filePath = /path="([^"]+)"/.exec(attributes)?.[1];
  const name = /name="([^"]+)"/.exec(attributes)?.[1];
  if (!filePath || !name) return '';

  try {
    const docs = await typeGenerator.generateTypeTable(
      { path: filePath, name },
      { basePath: process.cwd() },
    );
    return docs.map(renderTypeTable).join('\n\n');
  } catch {
    // A rename in the source tree shouldn't fail the whole build — point at
    // the declaration instead so the reader can still find it.
    return `**${name}** — see \`${filePath.replace(/^(\.\.\/)+/, '')}\`.`;
  }
}

/**
 * Run `transform` on the prose only. Fenced blocks are code samples of zest
 * itself — `<Tabs.Root>` there must not be mistaken for the MDX `<Tabs>`.
 */
function outsideCode(body: string, transform: (chunk: string) => string): string {
  return body
    .split(/(^```[\s\S]*?^```)/m)
    .map((chunk, index) => (index % 2 === 1 ? chunk : transform(chunk)))
    .join('');
}

async function mdxToMarkdown(raw: string): Promise<string> {
  let body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');

  body = outsideCode(body, (chunk) =>
    chunk
      // A demo is a GIF placeholder — nothing to read.
      .replace(/<Demo\b[^>]*>[\s\S]*?<\/Demo>/g, '')
      .replace(/<Demo\b[^>]*\/>/g, '')
      .replace(
        /<Anatomy\s+code=\{`([\s\S]*?)`\}\s*\/>/g,
        (_match, code: string) => `\`\`\`\n${code.trim()}\n\`\`\``,
      )
      // Tabs are alternate takes on one example — keep all of them, labelled.
      .replace(/<Tabs\s[^>]*>\s*/g, '')
      .replace(/\s*<\/Tabs>/g, '')
      .replace(/<Tab\s+value="([^"]+)"\s*>\s*/g, (_match, value: string) => `**${value}**\n\n`)
      .replace(/\s*<\/Tab>/g, '')
      .replace(/<Callout\b[^>]*>([\s\S]*?)<\/Callout>/g, (_match, inner: string) =>
        inner
          .trim()
          .split('\n')
          .map((line) => `> ${line.trim()}`.trimEnd())
          .join('\n'),
      )
      // Site-relative links mean nothing outside the site.
      .replace(/\]\(\/(?!\/)/g, `](${SITE_URL}/`),
  );

  const autoTypes = [...body.matchAll(/<AutoType\s+([^>]*?)\/>/g)];
  const tables = await Promise.all(autoTypes.map((match) => autoTypeToMarkdown(match[1])));
  let index = 0;
  body = body.replace(/<AutoType\s+[^>]*?\/>/g, () => tables[index++] ?? '');

  return body.replace(/\n{3,}/g, '\n\n').trim();
}

export async function generateLlmsTxt(): Promise<string> {
  const pages = docPages();
  const lines = [`# zest-ui`, '', `> ${SUMMARY}`];

  let section: string | undefined | symbol = Symbol('none');
  for (const page of pages) {
    if (page.section !== section) {
      section = page.section;
      lines.push('', `## ${page.section ?? 'Docs'}`, '');
    }
    lines.push(
      `- [${page.title}](${SITE_URL}${page.url})${page.description ? `: ${inline(page.description)}` : ''}`,
    );
  }

  lines.push(
    '',
    '## Optional',
    '',
    `- [Full documentation](${SITE_URL}/llms-full.txt): every page above inlined as one plain-text file.`,
    `- [Source repository](${REPO_URL}): the monorepo — library in \`packages/zest-ui\`, docs in \`apps/docs\`.`,
    '',
  );

  return lines.join('\n');
}

export async function generateLlmsFullTxt(): Promise<string> {
  const pages = docPages();

  const sections = await Promise.all(
    pages.map(async (page) => {
      const raw = await readFile(page.file, 'utf8');
      const body = await mdxToMarkdown(raw);
      return [
        `# ${page.title}`,
        '',
        `Source: ${SITE_URL}${page.url}`,
        page.description ? `\n${page.description}` : '',
        '',
        body,
      ]
        .join('\n')
        .trim();
    }),
  );

  return [
    '# zest-ui — full documentation',
    '',
    `> ${SUMMARY}`,
    '',
    `This file is generated from the documentation site at ${SITE_URL} and contains every page in full.`,
    `The index-only version lives at ${SITE_URL}/llms.txt.`,
    '',
    ...sections.flatMap((section) => ['---', '', section, '']),
  ].join('\n');
}
