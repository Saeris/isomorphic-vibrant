export interface Filter {
  (red: number, green: number, blue: number, alpha: number): boolean
}

export const defaultFilter: Filter = (r, g, b, a) =>
  a >= 125 && !(r > 250 && g > 250 && b > 250)

export const combineFilters = (filters: Filter[]): Filter => (r, g, b, a) => {
  if (a === 0) return false
  for (let i = 0; i < filters.length; i++) {
    if (!filters[i](r, g, b, a)) return false
  }
  return true
}
