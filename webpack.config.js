const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: './src/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
    ]
  },
  devServer: {
    historyApiFallback: true,
    publicPath: '/dist/',
    noInfo: true
  },
  performance: {
    hints: false
  },
  plugins: [],
  devtool: '#eval-source-map'
}

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map'
  module.exports.plugins = module.exports.plugins.concat([
    // short-circuits all Vue.js warning code
    new webpack.DefinePlugin({
      'process.env': {
         NODE_ENV: '"production"'
      }
    }),
    // minify with dead-code elimination
/*    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
*/    
    /*new webpack.LoaderOptionsPlugin({
      minimize: true
    })*/
  ])
} else {
}
