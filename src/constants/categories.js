export const STARTER_CATEGORIES = ['Work', 'Personal', 'Shopping', 'Health']

const CATEGORY_VARIANT_MAP = {
  work: 'work',
  personal: 'personal',
  shopping: 'shopping',
  health: 'health',
}

export function getCategoryVariant(category) {
  const slug = category.trim().toLowerCase()
  return CATEGORY_VARIANT_MAP[slug] || 'custom'
}
