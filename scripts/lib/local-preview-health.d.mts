export function assertLocalPreview(baseUrl?: string, options?: { timeoutMs?: number }): Promise<{
  url: string;
  status: number;
  contentType: string;
  checkedAt: string;
}>;
