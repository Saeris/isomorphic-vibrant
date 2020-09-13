import { Filter } from "./filter"
import { rgbToHsl, rgbToHex } from "./util"

export type Vec3 = [number, number, number]

export class Swatch {
  static applyFilter = (colors: Swatch[], f: Filter): Swatch[] =>
    typeof f === `function`
      ? colors.filter(({ r, g, b }) => f(r, g, b, 255))
      : colors

  rgb: Vec3
  hsl: Vec3
  yiq: number
  hex: string
  population: number

  constructor(rgb: Vec3, population: number) {
    this.rgb = rgb
    this.hex = rgbToHex(...rgb)
    this.hsl = rgbToHsl(...rgb)
    this.yiq = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
    this.population = population
  }

  get r() {
    return this.rgb[0]
  }

  get g() {
    return this.rgb[1]
  }

  get b() {
    return this.rgb[2]
  }

  toJSON() {
    return {
      rgb: this.rgb,
      population: this.population
    }
  }
}

export interface Palette {
  [key: string]: Swatch | undefined
  Vibrant?: Swatch
  Muted?: Swatch
  DarkVibrant?: Swatch
  DarkMuted?: Swatch
  LightVibrant?: Swatch
  LightMuted?: Swatch
}
