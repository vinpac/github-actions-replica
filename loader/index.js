const path = require('path')
const loaderUtils = require('loader-utils')

module.exports = function styleLoader() {}

module.exports.pitch = function styleLoaderPitch(request) {
  if (this.cacheable) this.cacheable()

  const options = Object.assign({ add: true }, loaderUtils.getOptions(this))
  const requestStr = loaderUtils.stringifyRequest(this, `!!${request}`)

  const hmr = `
    if (module.hot) {
      module.hot.accept(${requestStr}, function () {
        var newContent = require(${requestStr});
        if (typeof newContent === 'string') {
          newContent = [[module.id, content, '']];
        }

        update(newContent);
      })

      module.hot.dispose(function() { update(null, { remove: true }) });
    }
  `

  return `
    var content = require(${requestStr});
    if (typeof content === 'string') {
      content = [[module.id, content, '']];
    }

    ${
      !options.add
        ? ''
        : `
    var params = ${JSON.stringify(options)}

    // Prepare CSS Transformation
    params.transform = ${
      options.transform
        ? `require(${loaderUtils.stringifyRequest(
            this,
            `!${path.resolve(options.transform)}`,
          )})`
        : 'undefined'
    };

    // Add filepath to options
    params.filepath = "${loaderUtils
      .getRemainingRequest(this)
      .split('!')
      .pop()}";

    // Add style
    var update = require(${loaderUtils.stringifyRequest(
      this,
      `${path.join(__dirname, options.server ? 'store.js' : 'addStyles.js')}`,
    )})(content, params);`
    }

    if (content.locals) module.exports = content.locals;
    ${options.hmr ? hmr : ''}
  `
}
