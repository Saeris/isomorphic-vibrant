import { Swatch } from "../color"
import { VBox } from "./vbox"
import { PQueue } from "./pqueue"

const fractByPopulations = 0.75

function splitBoxes(pq: PQueue<VBox>, target: number): void {
  let lastSize = pq.size()
  while (pq.size() < target) {
    let vbox = pq.pop()

    if (vbox && vbox.count() > 0) {
      let [vbox1, vbox2] = vbox.split()

      pq.push(vbox1)
      if (vbox2 && vbox2.count() > 0) pq.push(vbox2)

      // No more new boxes, converged
      if (pq.size() === lastSize) {
        break
      } else {
        lastSize = pq.size()
      }
    } else {
      break
    }
  }
}

function generateSwatches(pq: PQueue<VBox>) {
  let swatches: Swatch[] = []
  while (pq.size()) {
    let v = pq.pop()
    let color = v.avg()
    swatches.push(new Swatch(color, v.count()))
  }
  return swatches
}

export const MMCQ = (
  pixels: Uint8Array,
  opts: { colorCount: number }
): Array<Swatch> => {
  if (pixels.length === 0 || opts.colorCount < 2 || opts.colorCount > 256) {
    throw new Error(`Wrong MMCQ parameters`)
  }

  const vbox = VBox.build(pixels)
  const pq = new PQueue<VBox>((a, b) => a.count() - b.count())

  pq.push(vbox)

  // first set of colors, sorted by population
  splitBoxes(pq, fractByPopulations * opts.colorCount)

  // Re-order
  const pq2 = new PQueue<VBox>(
    (a, b) => a.count() * a.volume() - b.count() * b.volume()
  )
  pq2.contents = pq.contents

  // next set - generate the median cuts using the (npix * vol) sorting.
  splitBoxes(pq2, opts.colorCount - pq2.size())

  // calculate the actual colors
  return generateSwatches(pq2)
}
