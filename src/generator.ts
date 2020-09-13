import { Swatch, Palette } from "./color"
import { hslToRgb } from "./util"

const findMaxPopulation = (swatches: Array<Swatch>): number =>
  swatches.reduce((p, s) => Math.max(p, s.population), 0)

const isAlreadySelected = (palette: Palette, s: Swatch): boolean =>
  palette.Vibrant === s ||
  palette.DarkVibrant === s ||
  palette.LightVibrant === s ||
  palette.Muted === s ||
  palette.DarkMuted === s ||
  palette.LightMuted === s

const createComparisonValue = (
  saturation: number,
  targetSaturation: number,
  luma: number,
  targetLuma: number,
  population: number,
  maxPopulation: number,
  weightSaturation: number = 3,
  weightLuma: number = 6.5,
  weightPopulation: number = 0.5
): number => {
  const weightedMean = (...values: number[]) => {
    const [sum, weightSum] = values.reduce(
      ([s, w], value, i, arr) => [s + value * arr[i + 1], w + arr[i + 1]],
      [0, 0]
    )
    return sum / weightSum
  }

  const invertDiff = (value: number, targetValue: number): number =>
    1 - Math.abs(value - targetValue)

  return weightedMean(
    invertDiff(saturation, targetSaturation),
    weightSaturation,
    invertDiff(luma, targetLuma),
    weightLuma,
    population / maxPopulation,
    weightPopulation
  )
}

const findColorVariation = (
  palette: Palette,
  swatches: Array<Swatch>,
  maxPopulation: number,
  targetLuma: number,
  minLuma: number,
  maxLuma: number,
  targetSaturation: number,
  minSaturation: number,
  maxSaturation: number,
  weightSaturation?: number,
  weightLuma?: number,
  weightPopulation?: number
): Swatch => {
  let max: Swatch | null = null
  let maxValue = 0

  swatches.forEach(swatch => {
    const [, s, l] = swatch.hsl

    if (
      s >= minSaturation &&
      s <= maxSaturation &&
      l >= minLuma &&
      l <= maxLuma &&
      !isAlreadySelected(palette, swatch)
    ) {
      const value = createComparisonValue(
        s,
        targetSaturation,
        l,
        targetLuma,
        swatch.population,
        maxPopulation,
        weightSaturation,
        weightLuma,
        weightPopulation
      )

      if (max === null || value > maxValue) {
        max = swatch
        maxValue = value
      }
    }
  })

  return max!
}

export interface GeneratorOptions {
  targetDarkLuma?: number
  maxDarkLuma?: number
  minLightLuma?: number
  targetLightLuma?: number
  minNormalLuma?: number
  targetNormalLuma?: number
  maxNormalLuma?: number
  targetMutesSaturation?: number
  maxMutesSaturation?: number
  targetVibrantSaturation?: number
  minVibrantSaturation?: number
  weightSaturation?: number
  weightLuma?: number
  weightPopulation?: number
}

const generateVariationColors = (
  swatches: Array<Swatch>,
  maxPopulation: number,
  {
    targetDarkLuma = 0.26,
    maxDarkLuma = 0.45,
    minLightLuma = 0.55,
    targetLightLuma = 0.74,
    minNormalLuma = 0.3,
    targetNormalLuma = 0.5,
    maxNormalLuma = 0.7,
    targetMutesSaturation = 0.3,
    maxMutesSaturation = 0.4,
    targetVibrantSaturation = 1.0,
    minVibrantSaturation = 0.35,
    weightSaturation,
    weightLuma,
    weightPopulation
  }: GeneratorOptions
): Palette => {
  let palette: Palette = {}
  palette.Vibrant = findColorVariation(
    palette,
    swatches,
    maxPopulation,
    targetNormalLuma,
    minNormalLuma,
    maxNormalLuma,
    targetVibrantSaturation,
    minVibrantSaturation,
    1,
    weightSaturation,
    weightLuma,
    weightPopulation
  )
  palette.LightVibrant = findColorVariation(
    palette,
    swatches,
    maxPopulation,
    targetLightLuma,
    minLightLuma,
    1,
    targetVibrantSaturation,
    minVibrantSaturation,
    1,
    weightSaturation,
    weightLuma,
    weightPopulation
  )
  palette.DarkVibrant = findColorVariation(
    palette,
    swatches,
    maxPopulation,
    targetDarkLuma,
    0,
    maxDarkLuma,
    targetVibrantSaturation,
    minVibrantSaturation,
    1,
    weightSaturation,
    weightLuma,
    weightPopulation
  )
  palette.Muted = findColorVariation(
    palette,
    swatches,
    maxPopulation,
    targetNormalLuma,
    minNormalLuma,
    maxNormalLuma,
    targetMutesSaturation,
    0,
    maxMutesSaturation,
    weightSaturation,
    weightLuma,
    weightPopulation
  )
  palette.LightMuted = findColorVariation(
    palette,
    swatches,
    maxPopulation,
    targetLightLuma,
    minLightLuma,
    1,
    targetMutesSaturation,
    0,
    maxMutesSaturation,
    weightSaturation,
    weightLuma,
    weightPopulation
  )
  palette.DarkMuted = findColorVariation(
    palette,
    swatches,
    maxPopulation,
    targetDarkLuma,
    0,
    maxDarkLuma,
    targetMutesSaturation,
    0,
    maxMutesSaturation,
    weightSaturation,
    weightLuma,
    weightPopulation
  )
  if (
    palette.Vibrant === null &&
    palette.DarkVibrant === null &&
    palette.LightVibrant === null
  ) {
    if (palette.DarkVibrant === null && palette.DarkMuted !== null) {
      const [h, s] = palette.DarkMuted!.hsl
      palette.DarkVibrant = new Swatch(hslToRgb(h, s, targetDarkLuma), 0)
    }
    if (palette.LightVibrant === null && palette.LightMuted !== null) {
      const [h, s] = palette.LightMuted!.hsl
      palette.DarkVibrant = new Swatch(hslToRgb(h, s, targetDarkLuma), 0)
    }
  }
  if (palette.Vibrant === null && palette.DarkVibrant !== null) {
    const [h, s] = palette.DarkVibrant!.hsl
    palette.Vibrant = new Swatch(hslToRgb(h, s, targetNormalLuma), 0)
  } else if (palette.Vibrant === null && palette.LightVibrant !== null) {
    const [h, s] = palette.LightVibrant!.hsl
    palette.Vibrant = new Swatch(hslToRgb(h, s, targetNormalLuma), 0)
  }
  if (palette.DarkVibrant === null && palette.Vibrant !== null) {
    const [h, s] = palette.Vibrant!.hsl
    palette.DarkVibrant = new Swatch(hslToRgb(h, s, targetDarkLuma), 0)
  }
  if (palette.LightVibrant === null && palette.Vibrant !== null) {
    const [h, s] = palette.Vibrant!.hsl
    palette.LightVibrant = new Swatch(hslToRgb(h, s, targetLightLuma), 0)
  }
  if (palette.Muted === null && palette.Vibrant !== null) {
    const [h, s] = palette.Vibrant!.hsl
    palette.Muted = new Swatch(hslToRgb(h, s, targetMutesSaturation), 0)
  }
  if (palette.DarkMuted === null && palette.DarkVibrant !== null) {
    const [h, s] = palette.DarkVibrant!.hsl
    palette.DarkMuted = new Swatch(hslToRgb(h, s, targetMutesSaturation), 0)
  }
  if (palette.LightMuted === null && palette.LightVibrant !== null) {
    const [h, s] = palette.LightVibrant!.hsl
    palette.LightMuted = new Swatch(hslToRgb(h, s, targetMutesSaturation), 0)
  }
  return palette
}

export const Generator = (
  swatches: Array<Swatch>,
  opts: GeneratorOptions = {}
): Palette =>
  generateVariationColors(swatches, findMaxPopulation(swatches), opts)
