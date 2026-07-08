const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

// Fetch côté serveur pour les pages publiques (SSR/SEO) — pas de token requis,
// n'accède qu'aux endpoints /catalog qui sont publics en lecture.
export async function fetchCatalog<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
