<h1 align="center" style="display: block; text-align: center;">🎨 Isomorphic Vibrant</h1>
<p align="center"><a href="https://www.npmjs.org/package/@saeris/isomorphic-vibrant"><img src="https://badgen.net/npm/v/@saeris/isomorphic-vibrant" alt="npm version"></a><a href="https://bundlephobia.com/result?p=@saeris/isomorphic-vibrant"><img src="https://badgen.net/bundlephobia/minzip/@saeris/isomorphic-vibrant" alt="bundlephobia minified + gzip"><img src="https://badgen.net/bundlephobia/dependency-count/@saeris/isomorphic-vibrant" alt="bundlephobia dependency count"><img src="https://badgen.net/bundlephobia/tree-shaking/@saeris/isomorphic-vibrant" alt="bundlephobia tree-shaking support"></a><a href="https://travis-ci.com/saeris/isomorphic-vibrant"><img src="https://badgen.net/travis/saeris/isomorphic-vibrant" alt="travis status"></a><a href="https://codecov.io/gh/Saeris/isomorphic-vibrant"><img src="https://badgen.net/codecov/c/github/saeris/isomorphic-vibrant/master" alt="codecov coverage"/></a></p>
<p align="center">A library for extracting prominent colors from an image anywhere you can run JavaScript!</p>

---

## 🚧 Under Construction

> Warning: This library is still under construction! A pre-release version is available for testing only. Expect things to be broken. The below documentation is both incomplete and subject to change.

## 📦 Installation

```bash
npm install --save @saeris/isomorphic-vibrant
# or
yarn add @saeris/isomorphic-vibrant
```

## 🔧 Usage

```typescript
import { Vibrant } from "@saeris/isomorphic-vibrant"

const vibrant = new Vibrant(`url/to/image.png`, { colorCount: 64 })
console.log(await vibrant.getPalette())
```

## 📣 Acknowledgements

This library was forked from [node-vibrant](https://github.com/Vibrant-Colors/node-vibrant).

## 🥂 License

Released under the [MIT license](https://github.com/Saeris/isomorphic-vibrant/blob/master/LICENSE.md).
