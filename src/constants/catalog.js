export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

export const PAGE_SIZE = 12;

export const STOCK_STATES = {
  in_stock: { label: 'In stock', tone: 'sage' },
  low_stock: { label: 'Low stock', tone: 'amber' },
  out_of_stock: { label: 'Sold out', tone: 'rosewood' },
  discontinued: { label: 'Discontinued', tone: 'neutral' },
};

export const PRODUCT_STATUSES = {
  published: { label: 'Published', tone: 'sage' },
  draft: { label: 'Draft', tone: 'amber' },
  archived: { label: 'Archived', tone: 'neutral' },
};
