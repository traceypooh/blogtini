
const DEP_SHOWDOWN_VERSION = '2.1.0'
const IMPORT_DEP_SHOWDOWN = `https://esm.archive.org/showdown@${DEP_SHOWDOWN_VERSION}`
// const IMPORT_DEP_SHOWDOWN = `https://ga.jspm.io/npm:showdown@${DEP_SHOWDOWN_VERSION}/dist/showdown.js`

/**
 * By default, markup is in Markdown, but could be in another.
 */
export const markupParser = async (opts = {}) => {
  const imported = await import(IMPORT_DEP_SHOWDOWN)
  const showdown = imported?.default
  const converter = new showdown.Converter({ tables: true, simplifiedAutoLink: true, ...opts })
  converter.setOption('openLinksInNewWindow', true)

  return converter
}