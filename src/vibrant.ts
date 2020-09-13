import { Palette, Swatch } from "./color"
import { MMCQ } from "./quantizer"
import { Generator } from "./generator"
import { defaultFilter, combineFilters } from "./filter"
import { NodeImage } from "./image"

type Filter = typeof defaultFilter

export interface VibrantOptions {
  colorCount?: number
  quality?: number
  maxDimension?: number
  filters?: Filter[]
  combinedFilter?: Filter
}

export class Vibrant {
  #src: URL
  colorCount?: number = 64
  quality?: number = 5
  maxDimension?: number
  filters: Filter[] = [defaultFilter]
  combinedFilter: Filter
  ImageClass: typeof NodeImage = NodeImage
  quantizer: typeof MMCQ = MMCQ
  generator?: typeof Generator = Generator

  get opts() {
    return {
      colorCount: this.colorCount,
      quality: this.quality,
      maxDimension: this.maxDimension,
      filters: this.filters,
      combinedFilter: this.combinedFilter
    }
  }

  constructor(src: string, opts: VibrantOptions = {}) {
    this.#src = new URL(src)
    Object.assign(this, opts)
    this.combinedFilter = combineFilters(this.filters)!
  }

  #process = (image: NodeImage): Palette => {
    const imageData = image.applyFilter(this.combinedFilter)
    const colors = this.quantizer(imageData, { colorCount: this.colorCount! })
    const filtered = Swatch.applyFilter(colors, this.combinedFilter)
    return this.generator!(filtered)
  }

  async getPalette(): Promise<Palette> {
    const image = new this.ImageClass(this.#src)
    const result = await image.load()
    const palette = this.#process(result)
    image.remove()
    return palette
  }
}
