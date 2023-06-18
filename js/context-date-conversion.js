// Can use Symbol, but let's not make this more complex.
/**
 * Context Request event for signaling we want to get other formats of the same date.
 */
export const ContextRequest_DateConversion = 'date-conversion'

const KEYS_DateConversion = ['date', 'dateIsoString', 'dateUnix', 'dateHuman']

export const isContextRequest_DateConveresion = (event) =>
  event.context === ContextRequest_DateConversion

export const assertContextRequest_DateConveresion = (event) => {
  if (!isContextRequest_DateConveresion(event)) {
    const message = `Unexpected error, we expected a "ContextRequest_DateConversion" context event`
    throw new Error(message)
  }
}

export const getFromContext_DateConversion = (event) => {
  assertContextRequest_DateConveresion(event)
  const maybeDate = event.originalTarget.getAttribute('datetime')
  const dateHumanFormat = event.originalTarget.dataset.dateHumanFormat ?? 'MMM D, YYYY' /* data-date-human-format */
  const date = maybeDate ?? null
  return Object.freeze({
    date,
    dateHumanFormat,
  })
}

export const isValidContextResponse_DateConversion = (payload) => {
  const _keys = Object.keys(payload)
  const found = _keys.filter((currentValue) =>
    KEYS_DateConversion.includes(currentValue),
  )
  return found.length === KEYS_DateConversion.length
}
