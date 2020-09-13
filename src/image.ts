import photon from "@silvia-odwyer/photon-node"
import fetch from "cross-fetch"
import { Filter } from "./filter"

const convertBlobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
        resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
});

export class NodeImage {
  #src: URL
  #image: photon.PhotonImage | null = null
  constructor(src: URL) {
    this.#src = src
  }

  load = async () => {
    const res = await fetch(this.#src.toString())
    const data = await res.arrayBuffer()
    const blob = new Blob([data])
    const b64 = await convertBlobToBase64(blob)
    const str = b64.replace(/^data:.*\/.*;base64,/, ``)
    this.#image = photon.PhotonImage.new_from_base64(str)
    return this
  }

  #isLoaded: true | Error = new Error(`Image must be loaded first!`)
  #verifyLoaded = () => {
    if (!this.#isLoaded) throw this.#isLoaded
    return true
  }

  applyFilter(filter: Filter): Uint8Array {
    this.#verifyLoaded()
    let imageData = this.getImageData() as Uint8Array

    if (typeof filter === `function`) {
      let pixels = imageData
      let n = pixels.length / 4
      let offset
      let r
      let g
      let b
      let a
      for (let i = 0; i < n; i++) {
        offset = i * 4
        r = pixels[offset + 0]
        g = pixels[offset + 1]
        b = pixels[offset + 2]
        a = pixels[offset + 3]
        // Mark ignored color
        if (!filter(r, g, b, a)) pixels[offset + 3] = 0
      }
    }

    return imageData
  }

  getWidth = () => this.#verifyLoaded() && this.#image!.get_width()

  getHeight = () => this.#verifyLoaded() && this.#image!.get_height()

  getPixelCount = () =>
    this.#verifyLoaded() &&
    (this.getWidth() as number) * (this.getHeight() as number)

  getImageData = () => this.#verifyLoaded() && this.#image!.get_raw_pixels()

  resize = (targetWidth: number, targetHeight: number) => {
    this.#verifyLoaded()
    photon.resize(this.#image!, targetWidth, targetHeight, 1)
    return this
  }

  scaleDown = (maxDimension: number, quality: number) => {
    this.#verifyLoaded()
    const width = this.getWidth() as number
    const height = this.getHeight() as number
    const maxSide: number = Math.max(width, height)
    const ratio: number =
      maxDimension > 0 && maxSide > maxDimension
        ? maxDimension / maxSide
        : 1 / quality
    if (ratio < 1) this.resize(width * ratio, height * ratio)
    return this
  }

  remove = () => {
    this.#verifyLoaded()
    this.#image = null
    return this
  }
}
