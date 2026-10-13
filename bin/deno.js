/*
  `Deno` for scripts that run on Deno *and* Node:  import { Deno } from './deno.js'
  On Deno it's the real `Deno`.  On Node it's a small stand-in, built on `node:*`, w/ just the calls our
  scripts use -- add more as needed.  Not put on `globalThis` (libs & our own code check that to detect
  Deno), so the import only shadows the global name in the importing file.  See DENODE.md.
*/
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import process from 'node:process'

/** like Deno's `FileInfo` / `DirEntry`: booleans, not methods */
const info = (e) => ({
  isFile: e.isFile(),
  isDirectory: e.isDirectory(),
  isSymlink: e.isSymbolicLink(),
})

const shim = {
  denode: true, // so a check can tell this from the real thing
  args: process.argv.slice(2),
  env: { get: (key) => process.env[key] },
  exit: (code) => process.exit(code),
  readTextFileSync: (path) => readFileSync(path, 'utf8'),
  writeTextFileSync: (path, data) => writeFileSync(path, data),
  readDirSync: (path) => readdirSync(path, { withFileTypes: true })
    .map((e) => ({ name: e.name, ...info(e) })),
  statSync: (path) => {
    const s = statSync(path)
    return { ...info(s), size: s.size, mtime: s.mtime, atime: s.atime, birthtime: s.birthtime }
  },
}

export const Deno = globalThis.Deno ?? shim
