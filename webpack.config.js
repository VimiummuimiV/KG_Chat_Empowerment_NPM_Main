const webpack = require('webpack');
const path = require('path');
// Import the header from headers.js
const headers = require('./header.js');

module.exports = {
  entry: './src/main.js',
  output: {
    filename: 'bundle.user.js', // Final file for Tampermonkey
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.css$/, // Handle CSS files
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    // Prepend the header metadata from headers.js
    new webpack.BannerPlugin({
      banner: headers,
      raw: true
    })
  ],
  mode: 'production',
  devtool: 'source-map'
};
