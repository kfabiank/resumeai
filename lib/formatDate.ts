export function formatDate(value?: string | null): string {
  if (!value) return '';

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }

  return String(value);
}
