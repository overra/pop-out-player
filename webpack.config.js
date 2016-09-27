const webpack = require('webpack')
const {resolve} = require('path')

module.exports = env => {
  const DEV = env === 'development'
  const config = {
    context: resolve(__dirname, 'src'),
    entry: {},
    output: {
      filename: '[name].js',
      path: resolve(__dirname, 'dist')
    },
    module: {
      loaders: [{
        loader: 'babel',
        exclude: [
          /node_modules/,
          /\.test\.js$/
        ],
        test: /\.js$/
      }]
    },
    plugins: [
      new webpack.DefinePlugin({
        'DEV': DEV
      }),
    ]
  }
  if (!DEV) {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        screw_ie8: true,
        warnings: false
      }
    }))
  }

  return config
}
