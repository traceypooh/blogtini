/**
 * Context Request event for signaling Markdown needing to be parsed.
 */
export const ContextRequest_TransformMakup = 'transform-markup-context'


export const isContextRequest_TransformMakup = (event) =>
  event.context === ContextRequest_TransformMakup


export const assertContextRequest_TransformMakup = (event) => {
  if (!isContextRequest_TransformMakup(event)) {
    const message = `Unexpected error, we expected a "ContextRequest_TransformMakup" context event`
    throw new Error(message)
  }
}


export const markdownReplaceYouTubeShortCodes = (markdownText) => markdownText.replace(
  // replace any youtube shortcodes
  /{{<\s*youtube\s+([^\s>}]+)\s*>}}/g,
  '<iframe width="848" height="477" src="https://www.youtube.com/embed/$1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
)


export class TransformMarkupSource {

  frontMatterString /*: string */ = ''

  markup /*: string */ = ''

  frontMatter /*?: Record<string, unknown> */ = void 0

  html /*?: string */ = void 0

  get [Symbol.toStringTag]() {
    return 'TransformMarkupSource';
  }

  constructor(source /*: string */ = '') {
    const isThreeDashesLine = line => /^---$/.test(line)
    const lines = source.split('\n')
    // Line numbers of frontMatter.
    const [fmBeginLn, fmEndLn] = lines.map((ln, lnNbr) => isThreeDashesLine(ln) ? lnNbr : false).filter(i => i)
    // Probably bogus
    this.frontMatterString = lines.slice(fmBeginLn + 1, fmEndLn).join('\n')
    this.markup = lines.slice(fmEndLn + 1).join('\n')
  }
}


export const getFromContext_TransformMakup = (event) => {
  assertContextRequest_TransformMakup(event)
  const innerHTML = event.originalTarget.innerHTML
  return new TransformMarkupSource(innerHTML)
}


export const isValidContextResponse_TransformMakup = (payload) => {
  return /TransformMarkupSource/.test('' + payload)
}