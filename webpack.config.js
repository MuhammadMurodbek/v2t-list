const HtmlWebPackPlugin = require('html-webpack-plugin')
const { join, resolve } = require('path')
const CircularDependencyPlugin = require('circular-dependency-plugin')
const { frontEndDevPort } = require('./server/config')

const { NODE_ENV, CI } = process.env

const isDevelopment = NODE_ENV === 'development' && CI == null

function useCache(loaders) {
  if (isDevelopment) {
    return [ 'cache-loader' ].concat(loaders)
  }

  return loaders
}

module.exports = {
  entry: join(__dirname, 'src', 'index.js'),
  output: {
    path: join(__dirname, 'build'),
    filename: '[name].js',
    chunkFilename: '[name].chunk.js'
  },
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
    poll: 300
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.s?css$/,
        use: useCache([ 'style-loader', 'css-loader', 'sass-loader' ])
      },
      {
        test: /\.less$/,
        use: useCache([ 'style-loader', 'css-loader', 'less-loader' ])
      },
      {
        test: /\.(png|jpg|gif|svg|woff|woff2|eot|ttf)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10240
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: resolve(__dirname, 'public/index.html'),
      filename: 'index.html',
      inlineSource: '.js$',
      favicon:resolve(__dirname, 'public/favicon.png')
    }),
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      failOnError: true
    })
  ],
  devServer: {
    historyApiFallback: true,
    port: frontEndDevPort
  },
  optimization: {
    moduleIds: 'hashed',
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
}
