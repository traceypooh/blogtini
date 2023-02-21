/**
 * Dress up all the things
 */

/**
 * What is the intented URL to expose this site, it's most likely over http, not "file://",
 * and possibly not at the root of the domain name.
 */
const PRODUCTION_SITE_ROOT_BASE_URL = 'https://renoirb.github.io/blogtini/'

/**
 * This should work for file:/// URLs
 * (assuming it's supported, Safari does, not Chromium thus far 2023-02-03)
 */
const SITE_ROOT_BASE_URL = await import.meta.url?.replace('theme.js', '') // await import.meta.resolve('./theme.js', import.meta.url) // ??'').replace('theme.js', '');

document.body.dataset.siteRootBaseUrl = SITE_ROOT_BASE_URL

scriptElement = document.createElement('script')
scriptElement.setAttribute('type', 'application/json')
scriptElement.setAttribute('id', 'appConfig')
scriptElement.setAttribute('class', 'blogtini-stuff')
const appConfig = {
  SITE_ROOT_BASE_URL,
  PRODUCTION_SITE_ROOT_BASE_URL,
}
scriptElement.innerText = JSON.stringify(appConfig)
document.body.appendChild(scriptElement)

import(
  `./js/blogtini.js?SITE_ROOT_BASE_URL=${encodeURIComponent(
    SITE_ROOT_BASE_URL,
  )}&PRODUCTION_SITE_ROOT_BASE_URL=${encodeURIComponent(
    PRODUCTION_SITE_ROOT_BASE_URL,
  )}`
)
