/** Lebanese governorates (muhafazat) and their districts (aqdiya). */
export const GOVERNORATES = [
  { id: "beirut", name: "Beirut", districts: ["Beirut"] },
  { id: "mount-lebanon", name: "Mount Lebanon", districts: ["Baabda", "Aley", "Matn", "Keserwan", "Jbeil", "Chouf"] },
  { id: "north", name: "North Lebanon", districts: ["Tripoli", "Zgharta", "Koura", "Batroun", "Bsharri", "Minieh-Danniyeh"] },
  { id: "akkar", name: "Akkar", districts: ["Akkar"] },
  { id: "baalbek-hermel", name: "Baalbek-Hermel", districts: ["Baalbek", "Hermel"] },
  { id: "bekaa", name: "Bekaa", districts: ["Zahle", "West Bekaa", "Rashaya"] },
  { id: "south", name: "South Lebanon", districts: ["Saida", "Tyre", "Jezzine"] },
  { id: "nabatieh", name: "Nabatieh", districts: ["Nabatieh", "Marjeyoun", "Hasbaya", "Bint Jbeil"] },
] as const;

export const ALL_DISTRICTS: string[] = GOVERNORATES.flatMap((g) => [...g.districts]);

/** Mobile prefixes allocated by Alfa and touch (after the country code / leading 0). */
export const LEBANESE_MOBILE_PREFIXES = ["3", "70", "71", "76", "78", "79", "81"];
