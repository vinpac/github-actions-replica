const path = require('path')
const { src, dest, series } = require('gulp')
const stylus = require('gulp-stylus')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const postcssFlexbugsFixes = require('postcss-flexbugs-fixes')
const postcssFilters = require('postcss-filters')
const postcssSelectorNot = require('postcss-selector-not')
const sourcemaps = require('gulp-sourcemaps')

const staticDirname = path.join('static', '.dist')

const css = () =>
  src('./styles/global/_index.styl')
    .pipe(sourcemaps.init())
    .pipe(
      stylus({
        compress: true,
      }),
    )
    .pipe(
      postcss([
        postcssFilters(),
        postcssSelectorNot(),
        postcssFlexbugsFixes(),
        autoprefixer({ browses: ['last 2 versions'] }),
      ]),
    )
    .pipe(sourcemaps.write('./'))
    .pipe(dest(path.join(staticDirname)))

exports.css = css
exports.default = series(css)
