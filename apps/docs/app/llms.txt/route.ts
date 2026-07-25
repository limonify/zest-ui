import { generateLlmsTxt } from '@/lib/llms';

export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
  return new Response(await generateLlmsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
