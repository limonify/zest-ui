import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { Anatomy } from '@/components/anatomy';
import { Demo } from '@/components/demo';
import { AutoType } from '@/components/type-table';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Anatomy,
    Demo,
    AutoType,
    Tab,
    Tabs,
    ...components,
  };
}
