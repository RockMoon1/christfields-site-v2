import { pathToFileURL } from 'node:url';

/** Fail before browser assertions when the local preview is unavailable. Never starts a server. */
export async function assertLocalPreview(baseUrl = 'http://127.0.0.1:3000', { timeoutMs = 5000 } = {}) {
  let url;
  try {
    url = new URL(baseUrl);
    if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.username || url.password) {
      throw new Error('Only an HTTP loopback preview without credentials is allowed.');
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), redirect: 'error' });
    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') ?? '';
    const html = await response.text();
    if (!contentType.toLowerCase().includes('text/html') || !/<html[\s>]/i.test(html) || !/<\/html\s*>/i.test(html)) {
      throw new Error('Response is not a complete HTML document.');
    }
    return { url: url.href, status: response.status, contentType, checkedAt: new Date().toISOString() };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`PREVIEW_UNAVAILABLE: ${url?.origin ?? 'invalid local URL'} — ${detail}. Start or inspect the owned local preview before verification.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await assertLocalPreview(process.argv[2]), null, 2));
}
