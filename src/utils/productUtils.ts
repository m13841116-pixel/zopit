export function getValidProductImageUrl(p: any): string {
  if (!p) return '';
  
  let url = p.imageUrl || p.image || p.mainImage || (p.images && p.images[0]?.url) || (Array.isArray(p.images) && typeof p.images[0] === 'string' ? p.images[0] : '') || (p.exploreContent?.customImageUrl || '');
  
  if (typeof url === 'string' && url.trim().length > 5) {
    return url.trim();
  }

  return '';
}

