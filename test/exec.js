// What runs JS in Code App's EXECUTION tab?  Open this file, then run it.
// Wanted: a local runtime that can read/write the repo's files (so `bin/build.js` could run there).

/* eslint-disable no-undef, no-console, @stylistic/max-statements-per-line */

const say = (...args) => console.log(...args)

say('Deno:', typeof Deno, ' process:', typeof process, ' require:', typeof require)
try { say('node version:', process.version, ' platform:', process.platform, ' cwd:', process.cwd()) } catch (e) { say('no process:', e.message) }
try { say('files here:', require('fs').readdirSync('.').slice(0, 15).join(' ')) } catch (e) { say('no fs (or not repo):', e.message) }
try {
  require('fs').writeFileSync('.exec-probe-tmp', 'ok')
  say('write:', require('fs').readFileSync('.exec-probe-tmp', 'utf8'))
  require('fs').unlinkSync('.exec-probe-tmp')
} catch (e) { say('no write:', e.message) }
say('fetch:', typeof fetch, ' DOMParser:', typeof DOMParser)
