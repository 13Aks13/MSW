const SLUG_REPLACEMENTS: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh',
  з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'yu', я: 'ya', ы: 'y', э: 'e', ё: 'e',
};

/**
 * Filesystem-safe slug. Minecraft folder names are user visible, so we keep
 * the readable part and only normalise unsafe characters.
 */
export function slugify(input: string, fallback = 'pack'): string {
  const transliterated = [...input.toLowerCase()]
    .map((char) => SLUG_REPLACEMENTS[char] ?? char)
    .join('');

  const slug = transliterated
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 80);

  return slug || fallback;
}

export function formatBytes(bytes: number | string, fractionDigits = 1): string {
  const value = typeof bytes === 'string' ? Number(bytes) : bytes;
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : fractionDigits)} ${units[index]}`;
}

export function parseVersion(version: unknown): { raw: string; array: number[] } {
  if (Array.isArray(version) && version.every((part) => Number.isInteger(part))) {
    return { raw: version.join('.'), array: version as number[] };
  }
  if (typeof version === 'string' && /^\d+(\.\d+){0,3}$/.test(version.trim())) {
    const array = version.trim().split('.').map((part) => Number(part));
    return { raw: array.join('.'), array };
  }
  throw new Error('Invalid pack version: expected an array of integers like [1, 0, 0]');
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
