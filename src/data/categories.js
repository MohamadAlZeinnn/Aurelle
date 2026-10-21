// Seed categories. Pure data (no app imports) so Node scripts can read it too.
export const categories = [
  {
    id: 'cat_eye',
    slug: 'eye-care',
    name: 'Eye Care',
    tagline: 'Patches, creams and balms for the delicate under-eye area.',
    image: '/images/editorial/category-eye-care.svg',
    sortOrder: 1,
    isActive: true,
    subcategories: [
      { id: 'sub_patches', slug: 'hydrogel-eye-patches', name: 'Hydrogel Eye Patches' },
      { id: 'sub_eyecream', slug: 'under-eye-creams', name: 'Under-Eye Creams & Balms' },
    ],
  },
  {
    id: 'cat_serums',
    slug: 'serums',
    name: 'Serums & Oils',
    tagline: 'Concentrated daily treatments, layered under moisturiser.',
    image: '/images/editorial/category-serums.svg',
    sortOrder: 2,
    isActive: true,
    subcategories: [
      { id: 'sub_serum', slug: 'face-serums', name: 'Face Serums' },
      { id: 'sub_oil', slug: 'face-oils', name: 'Face Oils' },
    ],
  },
  {
    id: 'cat_masks',
    slug: 'masks',
    name: 'Masks',
    tagline: 'Sheet, clay and overnight masks for a slower ritual.',
    image: '/images/editorial/category-masks.svg',
    sortOrder: 3,
    isActive: true,
    subcategories: [
      { id: 'sub_sheet', slug: 'sheet-masks', name: 'Sheet Masks' },
      { id: 'sub_clay', slug: 'clay-cream-masks', name: 'Clay & Cream Masks' },
      { id: 'sub_overnight', slug: 'overnight-masks', name: 'Overnight Masks' },
    ],
  },
  {
    id: 'cat_moist',
    slug: 'moisturizers',
    name: 'Moisturisers',
    tagline: 'Gel, lotion and rich textures for every skin and season.',
    image: '/images/editorial/category-moisturizers.svg',
    sortOrder: 4,
    isActive: true,
    subcategories: [
      { id: 'sub_day', slug: 'day-moisturizers', name: 'Day Moisturisers' },
      { id: 'sub_night', slug: 'night-creams', name: 'Night Creams' },
    ],
  },
  {
    id: 'cat_lip',
    slug: 'lip-care',
    name: 'Lip Care',
    tagline: 'Balms, oils and overnight masks in soft, wearable tints.',
    image: '/images/editorial/category-lip-care.svg',
    sortOrder: 5,
    isActive: true,
    subcategories: [
      { id: 'sub_balm', slug: 'lip-balms', name: 'Lip Balms' },
      { id: 'sub_lipoil', slug: 'lip-oils', name: 'Lip Oils' },
      { id: 'sub_lipmask', slug: 'lip-masks', name: 'Lip Masks' },
    ],
  },
  {
    id: 'cat_tools',
    slug: 'beauty-tools',
    name: 'Beauty Tools',
    tagline: 'Rollers, stones and brushes for hands-on rituals.',
    image: '/images/editorial/category-tools.svg',
    sortOrder: 6,
    isActive: true,
    subcategories: [
      { id: 'sub_roller', slug: 'facial-rollers', name: 'Facial Rollers' },
      { id: 'sub_guasha', slug: 'gua-sha', name: 'Gua Sha' },
      { id: 'sub_brush', slug: 'brushes-applicators', name: 'Brushes & Applicators' },
    ],
  },
  {
    id: 'cat_acc',
    slug: 'accessories',
    name: 'Accessories',
    tagline: 'Headbands, silk and vanity pieces that finish the ritual.',
    image: '/images/editorial/category-accessories.svg',
    sortOrder: 7,
    isActive: true,
    subcategories: [
      { id: 'sub_headband', slug: 'headbands', name: 'Headbands' },
      { id: 'sub_sleep', slug: 'sleep-silk', name: 'Sleep & Silk' },
      { id: 'sub_vanity', slug: 'vanity', name: 'Vanity' },
    ],
  },
];

export const brands = [
  { id: 'br_luma', slug: 'luma-atelier', name: 'LUMA Atelier', origin: 'House label' },
  { id: 'br_oree', slug: 'maison-oree', name: 'Maison Orée', origin: 'France' },
  { id: 'br_dewlab', slug: 'dewlab-seoul', name: 'Dewlab Seoul', origin: 'South Korea' },
  { id: 'br_verde', slug: 'verde-botanics', name: 'Verdé Botanics', origin: 'Italy' },
  { id: 'br_noor', slug: 'noor-and-co', name: 'Noor & Co.', origin: 'Lebanon' },
  { id: 'br_kinsei', slug: 'kinsei', name: 'Kinsei', origin: 'Japan' },
];

export const concerns = [
  { id: 'dryness', name: 'Dryness' },
  { id: 'puffiness', name: 'Puffiness' },
  { id: 'dark-circles', name: 'Dark circles' },
  { id: 'dullness', name: 'Dullness' },
  { id: 'fine-lines', name: 'Fine lines' },
  { id: 'uneven-tone', name: 'Uneven tone' },
  { id: 'blemishes', name: 'Blemishes & pores' },
  { id: 'sensitivity', name: 'Sensitivity' },
];

export const attributes = [
  { id: 'fragrance-free', name: 'Fragrance-free' },
  { id: 'vegan', name: 'Vegan formula' },
  { id: 'alcohol-free', name: 'Alcohol-free' },
  { id: 'reusable', name: 'Reusable' },
  { id: 'travel-size', name: 'Travel size available' },
];
