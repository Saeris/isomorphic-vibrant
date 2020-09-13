import { Vec3 } from "../color"
import { Histogram } from "./histogram"

export interface Dimension {
  r1: number
  r2: number
  g1: number
  g2: number
  b1: number
  b2: number
  [d: string]: number
}

const SIGBITS = 5
const RSHIFT = 8 - SIGBITS

export class VBox {
  static build(pixels: Uint8Array): VBox {
    const h = new Histogram(pixels, { sigBits: SIGBITS })
    const { rmin, rmax, gmin, gmax, bmin, bmax } = h
    return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, h)
  }

  dimension: Dimension
  histogram: Histogram
  #volume = -1
  #avg: Vec3 | null = null
  #count = -1

  constructor(
    r1: number,
    r2: number,
    g1: number,
    g2: number,
    b1: number,
    b2: number,
    histogram: Histogram
  ) {
    // NOTE: dimension will be mutated by split operation.
    //       It must be specified explicitly, not from histogram
    this.dimension = { r1, r2, g1, g2, b1, b2 }
    this.histogram = histogram
  }

  invalidate(): void {
    this.#volume = -1
    this.#count = -1
    this.#avg = null
  }

  volume(): number {
    if (this.#volume < 0) {
      let { r1, r2, g1, g2, b1, b2 } = this.dimension
      this.#volume = (r2 - r1 + 1) * (g2 - g1 + 1) * (b2 - b1 + 1)
    }
    return this.#volume
  }

  count(): number {
    if (this.#count < 0) {
      let {
        histogram: { hist, getColorIndex },
        dimension: { r1, r2, g1, g2, b1, b2 }
      } = this
      let c = 0
      for (let r = r1; r <= r2; r++) {
        for (let g = g1; g <= g2; g++) {
          for (let b = b1; b <= b2; b++) {
            c += hist[getColorIndex(r, g, b)]
          }
        }
      }
      this.#count = c
    }
    return this.#count
  }

  clone(): VBox {
    const {
      dimension: { r1, r2, g1, g2, b1, b2 },
      histogram
    } = this
    return new VBox(r1, r2, g1, g2, b1, b2, histogram)
  }

  avg(): Vec3 {
    if (!this.#avg) {
      let { hist, getColorIndex } = this.histogram
      let { r1, r2, g1, g2, b1, b2 } = this.dimension
      let [ntot, mult, rsum, gsum, bsum] = [0, 1 << (8 - SIGBITS), 0, 0, 0]

      for (let r = r1; r <= r2; r++) {
        for (let g = g1; g <= g2; g++) {
          for (let b = b1; b <= b2; b++) {
            const h = hist[getColorIndex(r, g, b)]
            ntot += h
            rsum += h * (r + 0.5) * mult
            gsum += h * (g + 0.5) * mult
            bsum += h * (b + 0.5) * mult
          }
        }
      }
      if (ntot) {
        this.#avg = [~~(rsum / ntot), ~~(gsum / ntot), ~~(bsum / ntot)]
      } else {
        this.#avg = [
          ~~((mult * (r1 + r2 + 1)) / 2),
          ~~((mult * (g1 + g2 + 1)) / 2),
          ~~((mult * (b1 + b2 + 1)) / 2)
        ]
      }
    }
    return this.#avg
  }

  contains(rgb: Vec3): boolean {
    let [r, g, b] = rgb
    const { r1, r2, g1, g2, b1, b2 } = this.dimension
    r >>= RSHIFT
    g >>= RSHIFT
    b >>= RSHIFT
    return r >= r1 && r <= r2 && g >= g1 && g <= g2 && b >= b1 && b <= b2
  }

  split(): VBox[] {
    let { hist, getColorIndex } = this.histogram
    let { r1, r2, g1, g2, b1, b2 } = this.dimension
    let count = this.count()
    if (!count) return []
    if (count === 1) return [this.clone()]
    let [rw, gw, bw] = [r2 - r1 + 1, g2 - g1 + 1, b2 - b1 + 1]
    const maxw = Math.max(rw, gw, bw)
    let accSum: Uint32Array | null = null
    let [sum, total] = [0, 0]
    let maxd: "r" | "g" | "b" | null = null

    if (maxw === rw) {
      maxd = `r`
      accSum = new Uint32Array(r2 + 1)
      for (let r = r1; r <= r2; r++) {
        sum = 0
        for (let g = g1; g <= g2; g++) {
          for (let b = b1; b <= b2; b++) {
            let index = getColorIndex(r, g, b)
            sum += hist[index]
          }
        }
        total += sum
        accSum[r] = total
      }
    } else if (maxw === gw) {
      maxd = `g`
      accSum = new Uint32Array(g2 + 1)
      for (let g = g1; g <= g2; g++) {
        sum = 0
        for (let r = r1; r <= r2; r++) {
          for (let b = b1; b <= b2; b++) {
            let index = getColorIndex(r, g, b)
            sum += hist[index]
          }
        }
        total += sum
        accSum[g] = total
      }
    } else {
      maxd = `b`
      accSum = new Uint32Array(b2 + 1)
      for (let b = b1; b <= b2; b++) {
        sum = 0
        for (let r = r1; r <= r2; r++) {
          for (let g = g1; g <= g2; g++) {
            let index = getColorIndex(r, g, b)
            sum += hist[index]
          }
        }
        total += sum
        accSum[b] = total
      }
    }

    let splitPoint = -1
    const reverseSum = new Uint32Array(accSum.length)
    for (let i = 0; i < accSum.length; i++) {
      let d = accSum[i]
      if (splitPoint < 0 && d > total / 2) splitPoint = i
      reverseSum[i] = total - d
    }
    const doCut = (d: string): VBox[] => {
      const dim1 = `${d}1`
      const dim2 = `${d}2`
      let d1 = this.dimension[dim1]
      let d2 = this.dimension[dim2]
      const vbox1 = this.clone()
      const vbox2 = this.clone()
      const left = splitPoint - d1
      const right = d2 - splitPoint
      if (left <= right) {
        d2 = Math.min(d2 - 1, ~~(splitPoint + right / 2))
        d2 = Math.max(0, d2)
      } else {
        d2 = Math.max(d1, ~~(splitPoint - 1 - left / 2))
        d2 = Math.min(this.dimension[dim2], d2)
      }

      while (!accSum![d2]) d2++

      let c2 = reverseSum[d2]
      while (!c2 && accSum![d2 - 1]) c2 = reverseSum[--d2]

      vbox1.dimension[dim2] = d2
      vbox2.dimension[dim1] = d2 + 1

      return [vbox1, vbox2]
    }

    return doCut(maxd)
  }
}
