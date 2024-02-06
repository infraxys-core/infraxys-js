const path = require('path');

module.exports = {
  mode: 'none',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'infraxys-js.js',
    library: 'InfraxysJs',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['.js'],
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
};
