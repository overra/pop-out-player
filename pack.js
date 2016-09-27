const MemoryFS = require('memory-fs')
const webpack = require('webpack')
const {resolve} = require('path')
const {
  readFileSync,
  createWriteStream,
  readdirSync,
  outputFileSync,
  removeSync,
} = require('fs-extra')
const JSZip = require('jszip')
const babel = require('babel-core')
const WebSocketServer = require('ws').Server
const pkg = require('./package.json')
const webpackConfig = require('./webpack.config')
const manifest = require('./manifest')
const config = webpackConfig(process.argv[2])
const DEV = process.argv[2] === 'development'

const assets = readdirSync(resolve(__dirname, './assets'))
  .reduce((tree, file) => {
    tree[`assets/${file}`] = readFileSync(resolve(__dirname, `assets/${file}`))
    return tree
  }, {})

// define content scripts as entry points
manifest.content_scripts.forEach(scripts => {
  scripts.js.forEach(script => {
    config.entry[script.slice(0, -3)] = `./${script}`
  })
})

// define background scripts as entry points
manifest.background.scripts.forEach(script => {
  config.entry[script.slice(0, -3)] = `./${script}`
})

const fs = new MemoryFS()
const compiler = webpack(config)
let server
let sockets = []
compiler.outputFileSystem = fs

function finishedCompiling(err, stats) {
  const src = fs.readdirSync(resolve(__dirname, 'dist'))
    .reduce((tree, file) => {
      tree[file] = fs.readFileSync(resolve(__dirname, `dist/${file}`))
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
    sockets.forEach(socket => socket.send('reload'))
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
}

if (DEV) {
  server = new WebSocketServer({port: 34343})
  server.on('connection', ws => {
    sockets = [
      ...sockets,
      ws
    ]
    ws.on('close', () => {
      const index = sockets.indexOf(ws)
      sockets = [
        ...sockets.slice(0, index),
        ...sockets.slice(index + 1)
      ]
    })
  })
  compiler.watch({}, finishedCompiling)
} else {
  compiler.run(finishedCompiling)
}
