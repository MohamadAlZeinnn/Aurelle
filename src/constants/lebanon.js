// Lebanese governorates (muhafazat) and their districts (aqdiya).
// `id`s are stable keys used for shipping zones and saved addresses.
export const GOVERNORATES = [
  { id: 'beirut', name: 'Beirut', districts: ['Beirut'] },
  { id: 'mount-lebanon', name: 'Mount Lebanon', districts: ['Baabda', 'Aley', 'Matn', 'Keserwan', 'Jbeil', 'Chouf'] },
  { id: 'north', name: 'North Lebanon', districts: ['Tripoli', 'Zgharta', 'Koura', 'Batroun', 'Bsharri', 'Minieh-Danniyeh'] },
  { id: 'akkar', name: 'Akkar', districts: ['Akkar'] },
  { id: 'baalbek-hermel', name: 'Baalbek-Hermel', districts: ['Baalbek', 'Hermel'] },
  { id: 'bekaa', name: 'Bekaa', districts: ['Zahle', 'West Bekaa', 'Rashaya'] },
  { id: 'south', name: 'South Lebanon', districts: ['Saida', 'Tyre', 'Jezzine'] },
  { id: 'nabatieh', name: 'Nabatieh', districts: ['Nabatieh', 'Marjeyoun', 'Hasbaya', 'Bint Jbeil'] },
];

export const governorateName = (id) => GOVERNORATES.find((g) => g.id === id)?.name ?? id;

// Mobile prefixes currently allocated by Alfa and touch.
export const LEBANESE_MOBILE_PREFIXES = ['3', '70', '71', '76', '78', '79', '81'];
