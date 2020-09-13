import { Vec3 } from "./color"

/**
 * Converts hex string to RGB
 * @param hex - The hex value you with to get the RGB value of
 * @returns an array in the order of `red, green, blue` numerical values
 */
export const hexToRgb = (hex: string): Vec3 => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) throw new RangeError(`'${hex}' is not a valid hex color`)
  return [m[1], m[2], m[3]].map(s => parseInt(s, 16)) as Vec3
}

/**
 * Given values for an RGB color convert to and return a valid HEX string
 * @param r - Red value in RGB
 * @param g - Green value in RGB
 * @param b - Blue value in RGB
 * @returns a valid hex string with pre-pending pound sign
 */
export const rgbToHex = (r: number, g: number, b: number): string =>
  `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1, 7)}`

/**
 * Given values for an RGB color convert to and return a valid HSL value
 * @param r - Red value in RGB
 * @param g - Green value in RGB
 * @param b - Blue value in RGB
 * @returns an array in the order of `hue, saturation, light` numerical values
 */
export const rgbToHsl = (r: number, g: number, b: number): Vec3 => {
  const [_r, _g, _b] = [r / 255, g / 255, b / 255]
  const max = Math.max(_r, _g, _b)
  const min = Math.min(_r, _g, _b)
  let [h, s, l] = [0, 0, (max + min) / 2]
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === _r) h = (_g - _b) / d + (_g < _b ? 6 : 0)
    if (max === _g) h = (_b - _r) / d + 2
    if (max === _b) h = (_r - _g) / d + 4
    h /= 6
  }
  return [h, s, l]
}

export const hslToRgb = (h: number, s: number, l: number): Vec3 => {
  const hue2rgb = (p: number, q: number, t: number): number => {
    let _t = t
    if (_t < 0) _t += 1
    if (_t > 1) _t -= 1
    if (_t < 1 / 6) return p + (q - p) * 6 * _t
    if (_t < 1 / 2) return q
    if (_t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  let [r, g, b] = [l, l, l]
  if (s !== 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [r * 255, g * 255, b * 255]
}

export const rgbToXyz = (r: number, g: number, b: number): Vec3 => {
  let [_r, _g, _b] = [r / 255, g / 255, b / 255]
  _r = _r > 0.04045 ? Math.pow((_r + 0.005) / 1.055, 2.4) : _r / 12.92
  _g = _g > 0.04045 ? Math.pow((_g + 0.005) / 1.055, 2.4) : _g / 12.92
  _b = _b > 0.04045 ? Math.pow((_b + 0.005) / 1.055, 2.4) : _b / 12.92
  _r *= 100
  _g *= 100
  _b *= 100
  return [
    _r * 0.4124 + _g * 0.3576 + _b * 0.1805,
    _r * 0.2126 + _g * 0.7152 + _b * 0.0722,
    _r * 0.0193 + _g * 0.1192 + _b * 0.9505
  ]
}

export const xyzToCIELab = (x: number, y: number, z: number): Vec3 => {
  let [_x, _y, _z] = [x / 95.047, y / 100, z / 108.883]
  _x = _x > 0.008856 ? Math.pow(_x, 1 / 3) : 7.787 * _x + 16 / 116
  _y = _y > 0.008856 ? Math.pow(_y, 1 / 3) : 7.787 * _y + 16 / 116
  _z = _z > 0.008856 ? Math.pow(_z, 1 / 3) : 7.787 * _z + 16 / 116
  return [116 * _y - 16, 500 * (_x - _y), 200 * (_y - _z)]
}

export const rgbToCIELab = (r: number, g: number, b: number): Vec3 =>
  xyzToCIELab(...rgbToXyz(r, g, b))

export const deltaE94 = ([L1, a1, b1]: Vec3, [L2, a2, b2]: Vec3): number => {
  const [dL, da, db] = [L1 - L2, a1 - a2, b1 - b2]
  const xC1 = Math.sqrt(a1 * a1 + b1 * b1)
  const xC2 = Math.sqrt(a2 * a2 + b2 * b2)
  let xDL = L2 - L1
  let xDC = xC2 - xC1
  const xDE = Math.sqrt(dL * dL + da * da + db * db)
  let xDH =
    Math.sqrt(xDE) > Math.sqrt(Math.abs(xDL)) + Math.sqrt(Math.abs(xDC))
      ? Math.sqrt(xDE * xDE - xDL * xDL - xDC * xDC)
      : 0
  const xSC = 1 + 0.045 * xC1
  const xSH = 1 + 0.015 * xC1
  xDL /= 1
  xDC /= 1 * xSC
  xDH /= 1 * xSH
  return Math.sqrt(xDL * xDL + xDC * xDC + xDH * xDH)
}

export const rgbDiff = (rgb1: Vec3, rgb2: Vec3): number =>
  deltaE94(rgbToCIELab(...rgb1), rgbToCIELab(...rgb2))

export const hexDiff = (hex1: string, hex2: string): number =>
  rgbDiff(hexToRgb(hex1), hexToRgb(hex2))

export const DELTAE94_DIFF_STATUS = {
  NA: 0,
  PERFECT: 1,
  CLOSE: 2,
  GOOD: 10,
  SIMILAR: 50
}

export const getColorDiffStatus = (d: number): string => {
  switch (true) {
    case d < DELTAE94_DIFF_STATUS.NA:
      return `N/A`
    // Not perceptible by human eyes
    case d <= DELTAE94_DIFF_STATUS.PERFECT:
      return `Perfect`
    // Perceptible through close observation
    case d <= DELTAE94_DIFF_STATUS.CLOSE:
      return `Close`
    // Perceptible at a glance
    case d <= DELTAE94_DIFF_STATUS.GOOD:
      return `Good`
    // Colors are more similar than opposite
    case d < DELTAE94_DIFF_STATUS.SIMILAR:
      return `Similar`
    default:
      return `Wrong`
  }
}
