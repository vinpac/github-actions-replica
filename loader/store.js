function store(newStyles, { filepath }) {
  // Find or push
  const style =
    store.styles.find(s => s.filepath === filepath) ||
    store.styles[store.styles.push({ filepath }) - 1]
  style.body = newStyles.map(s => s[1]).join('\n')

  return updatedStyles => {
    style.body = updatedStyles.map(s => s[1]).join('\n')
  }
}

store.styles = []
store.getStyles = includeFilePath => ({
  id: 'style-loaded',
  body: store.styles
    .map(
      style =>
        `${includeFilePath ? `/* ${style.filepath} */\n` : ''}${style.body}`,
    )
    .join('\n'),
})

module.exports = store
