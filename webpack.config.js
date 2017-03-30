const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry:  './src/index.js',
  module: {
    loaders: [
      {
        test:   /\.js$/,
        loader: 'babel-loader',
        query:  { cacheDirectory: true },
      },
    ],
  },
  output: {
    filename:      'index.js',
    path:          path.join(__dirname, './lib'),
    library:       'ESjs',
    libraryTarget: 'umd',
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin(),
  ],
};
