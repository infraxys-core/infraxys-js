module.exports = {
  mode: 'production',
  entry: './src/index.js',
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
