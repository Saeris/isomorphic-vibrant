export class Histogram {
  getColorIndex: (r: number, g: number, b: number) => number
  hist!: Uint32Array
  rmin!: number
  rmax!: number
  gmin!: number
  gmax!: number
  bmin!: number
  bmax!: number
  #colorCount: number
  get colorCount() {
    return this.#colorCount
  }

  constructor(pixels: Uint8Array, { sigBits }: { sigBits: number }) {
    const getColorIndex = (r: number, g: number, b: number) =>
      (r << (2 * sigBits)) + (g << sigBits) + b
    const rshift = 8 - sigBits
    const hist = new Uint32Array(1 << (3 * sigBits))
    let [rmax, rmin, gmax, gmin, bmax, bmin] = [
      0,
      Number.MAX_VALUE,
      0,
      Number.MAX_VALUE,
      0,
      Number.MAX_VALUE
    ]
    let [r, g, b, a, n, i] = [0, 0, 0, 0, pixels.length / 4, 0]
    while (i < n) {
      const offset = i * 4
      i++
      r = pixels[offset + 0]
      g = pixels[offset + 1]
      b = pixels[offset + 2]
      a = pixels[offset + 3]
      // Ignored pixels' alpha is marked as 0 in filtering stage
      if (a === 0) continue // eslint-disable-line
      r >>= rshift
      g >>= rshift
      b >>= rshift
      hist[getColorIndex(r, g, b)] += 1
      if (r > rmax) rmax = r
      if (r < rmin) rmin = r
      if (g > gmax) gmax = g
      if (g < gmin) gmin = g
      if (b > bmax) bmax = b
      if (b < bmin) bmin = b
    }
    Object.assign(this, {
      hist,
      rmax,
      rmin,
      gmax,
      gmin,
      bmax,
      bmin
    })
    this.getColorIndex = getColorIndex
    this.#colorCount = hist.reduce((total, c) => (c > 0 ? total + 1 : total), 0)
  }
}
