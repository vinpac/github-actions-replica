const fs = require('fs')
const path = require('path')
const withTypescript = require('@zeit/next-typescript')

// Utils
const { assign } = Object
const resolve = function() {
  return path.resolve.apply(path, Array.prototype.slice.call(arguments))
}

module.exports = withTypescript({
  serverRuntimeConfig: {
    staticDistDirname: `${Math.random()
      .toString(36)
      .substring(7)}-${Date.now()}`,
  },
  publicRuntimeConfig: {
    apiURL: process.env.API_URL || 'http://localhost:8000',
    appURL: process.env.APP_URL || 'http://localhost:3000',
  },
  webpack(config, { isServer, dev }) {
    if (isServer) {
      fs.stat(path.resolve('static/.dist/_index.css'), error => {
        if (error) {
          console.log('> Running Gulp')
          require('child_process').exec('gulp', error => {
            if (error) {
              console.error(error)
            }

            console.log('> Finished running Gulp')
          })
        }
      })
    }
    const MiniCssExtractPlugin = require('mini-css-extract-plugin')

    if (!dev) {
      config.plugins.push(
        new MiniCssExtractPlugin({
          filename: 'styles.css',
          chunkFilename: 'static/[hash:8].css',
        }),
      )
    }

    // Do not run type checking twice
    if (isServer) {
      const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
      config.plugins.push(
        new ForkTsCheckerWebpackPlugin({
          tsconfig: path.resolve('tsconfig.json'),
        }),
      )
    }

    assign(config, {
      resolve: assign(config.resolve, {
        alias: assign({}, config.resolve.alias, {
          '~/channel': resolve('channel'),
          '~/components': resolve('components'),
          '~/types': resolve('types'),
          '~/core': resolve('core'),
          '~/lib': resolve('lib'),
          '~/redux': resolve('redux'),
          '~/server': resolve('server'),
        }),
      }),
    })

    config.module.rules = config.module.rules.map(rule => {
      if (rule.use.loader === 'next-babel-loader') {
        return {
          ...rule,
          use: [rule.use, 'astroturf/loader'],
        }
      }

      return rule
    })

    config.module.rules.push({
      test: /\.css$/,
      use: (dev
        ? [
            {
              loader: path.resolve('loader'),
              options: {
                server: isServer,
              },
            },
          ]
        : [MiniCssExtractPlugin.loader]
      ).concat([
        {
          loader: 'css-loader',
          options: {
            modules: true,
            importLoaders: 1,
            sourceMap: !dev,
            localIdentName: dev
              ? '[name]-[local]-[hash:base64:5]'
              : '[hash:base64:5]',
          },
        },
        {
          loader: 'postcss-loader',
          query: '',
          options: {
            ident: 'postcss-astroturf',
            plugins: [require('postcss-nested')()],
          },
        },
      ]),
    })

    return config
  },
})
