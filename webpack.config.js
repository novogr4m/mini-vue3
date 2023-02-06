const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  mode: 'development',
  devtool: false,
  // devtool: 'inline-cheap-source-map',
  entry: './src/index.js',
  output: {
    filename: 'mini-vue.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    // library: 'MiniVue',
    // libraryTarget: 'umd'
  },

  devServer: {
    static: {
      // 指定路径
      directory: path.join(__dirname, 'public')
    }

  },
  plugins: [
      new HTMLWebpackPlugin({
        // title: "这是一个自定义的title"
        template: "./public/index.html"
    }),
],
};
