const {
  readFileSync,
  createWriteStream,
  readdirSync,
  outputFileSync,
  removeSync,
} = require('fs-extra')
const {resolve} = require('path')
const JSZip = require('jszip')
const babel = require('babel-core')
const pkg = require('./package.json')
const DEV = process.argv[2] === 'development'

const assets = readdirSync(resolve(__dirname, './assets'))
  .reduce((tree, file) => {
    tree[`assets/${file}`] = readFileSync(resolve(__dirname, `assets/${file}`))
    return tree
  }, {})

const src = readdirSync(resolve(__dirname, './src'))
  .reduce((tree, file) => {
    tree[file] = babel.transformFileSync(resolve(__dirname, `src/${file}`), {
      sourceMaps: DEV ? 'inline' : false
    }).code
    return tree
  }, {})

const files = Object.assign({
  'manifest.json': readFileSync(resolve(__dirname, 'manifest.json'))
}, assets, src)

if (DEV) {
  removeSync(resolve(__dirname, 'unpacked'))
  for (let file in files) {
    outputFileSync(resolve(__dirname, 'unpacked', file), files[file])
  }
} else {
  const filename = `${pkg.name}.zip`
  const zip = new JSZip()

  for (let file in files) {
    zip.file(file, files[file])
  }

  removeSync(filename)

  zip
    .generateNodeStream({streamFiles: true})
    .pipe(createWriteStream(filename))
    .on('finish', () => {
      console.log(`${filename} written.`)
    })
}
