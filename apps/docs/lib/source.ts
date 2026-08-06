import { docs } from '@/.source/server';
import { loader } from 'fumadocs-core/source';
import type { Root } from 'fumadocs-core/page-tree';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});

// The changelog is a live page (renders the repo-root CHANGELOG.md), not an
// MDX file, so it has no entry in the generated tree. Append one so it shows
// up in the sidebar alongside the rest of the docs.
let tree: Root | undefined;
export function docsTree(): Root {
  if (!tree) {
    tree = source.pageTree;
    tree.children.push({
      type: 'page',
      name: 'Changelog',
      url: '/docs/changelog',
    });
  }
  return tree;
}
