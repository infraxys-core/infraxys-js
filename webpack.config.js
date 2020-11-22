const path = require('path');

module.exports = {
  mode: 'none',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'infraxys-js.js',
    library: 'InfraxysJs',
    libraryTarget: 'var',
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
