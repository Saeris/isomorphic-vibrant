import { Vibrant } from "../"

describe(`vibrant`, () => {
  it(`generates a palette`, async () => {
    const vibrant = new Vibrant(
      `https://www.bloomnation.com/blog/wp-content/uploads/2012/07/Rainbow-Rose.jpg`
    )
    const palette = await vibrant.getPalette()
    expect(palette).toBeDefined()
  })
})
