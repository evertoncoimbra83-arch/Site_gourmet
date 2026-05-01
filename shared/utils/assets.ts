// shared/utils/assets.ts
export function normalizeImageUrl(path: string | null | undefined): string {
  if (!path) return "/placeholder-dish.png";
  if (path.startsWith("http")) return path;
  
  const baseUrl = (import.meta.env?.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
  const cleanPath = path.replace(/^\/+/, '').replace(/^uploads\//, '');
  
  return `${baseUrl}/uploads/${cleanPath}`;
}