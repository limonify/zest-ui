import { generateLlmsFullTxt } from '@/lib/llms';

export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
  return new Response(await generateLlmsFullTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
