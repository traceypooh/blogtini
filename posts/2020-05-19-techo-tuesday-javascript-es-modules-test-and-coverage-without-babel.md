---
title: 🌮 Techo Tuesday 🌮 Javascript ES Modules Test and Coverage Without Babel
date: 2020-05-19
categories:
  - technical
  - techo tuesday
  - coding
  - website
tags:
  - coding
  - geek
  - javascript
featured: js-es-modules-test.jpg
featuredcaption: <del>greed</del> green is good
---
_things turning me on this week_ <br/>
_☕enjoy with a hot cupa java/script_ <br/>
JavaScript has gotten _even better_ and you can now run 100% [ES Modules](https://poohbot.com/2019/09/techo-tuesday-javascript-es6-and-es-modules/) code "natively" through the entire node, JS, testing, and coverage (and more!) ecosystem.  Picking the right tools that understand `ES Modules` is key - here we use `mocha` and `c8` (also show how to use `jasmine` (what is under `jest`) and `nyc`/.  `istanbul` if desired).  Bonus points?  `sinon` for mocking.

## Sample code setup
[demonstration minimal working git repository](https://github.com/traceypooh/js-es-modules-coverage-testing)


## Uses simply: mocha and c8
The goal is to avoid babel, transpiling, and any dynamic transform of the JS source/test code as possible.
- [mocha](https://mochajs.org/) since it can understand ES Modules
  (and make `import`/`export` work nicely).
- [c8](https://github.com/bcoe/c8) for code coverage (since it understands ES Modules)
- [expectations](https://github.com/spmason/expectations) for `jest`/`jasmine` like testing,
  eg: `expect('hai'.length).toBe(3)`
- [sinon](https://sinonjs.org/) for mocking, stubs, and spies (more below on that)

There's a few _subtle_ things to get setup and "just right" to make it all work seamlessly.
But once you know them, you're good to go.

**If you prefer `jasmine`**
- [see this prior setup](https://github.com/traceypooh/js-es-modules-coverage-testing/tree/jasmine-esm-nyc)


## Thus
you can now write all your source and test code in the modern/future default 100% `ES Modules` (AKA `import` / `export`), eg:
```javascript
import { foo, foobar } from '../src/foo.js'

describe('foo()', function () {
  it('should return number plus one', function () {
    expect(foo(1)).toEqual(2)
  })
})
```

## run
```bash

git clone https://github.com/traceypooh/js-es-modules-coverage-testing
cd js-es-modules-coverage-testing
npm install
npm test
```
(or alternatively: `npx c8 mocha`)

## yields
```text
> @ test /Users/tracey/dev/js-es-modules-coverage-testing
> c8 mocha

  bar()
    ✓ should return number minus one

  foo()
    ✓ should return number plus one

  foobar()
    ✓ should return same number

  goo()
    ✓ should switch from 2 to 3 via a swap out
    ✓ should switch from 2 to 3 via a mock

  5 passing (11ms)

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |     100 |      100 |     100 |     100 |
 bar.js   |     100 |      100 |     100 |     100 |
 foo.js   |     100 |      100 |     100 |     100 |
 goo.js   |     100 |      100 |     100 |     100 |
----------|---------|----------|---------|---------|-------------------
```

## the magic
- in `package.json`, this tells `node` and scripts all `.js` files are ES Modules
```json
{
  "type": "module",
}
```
- in `package.json`, this tells `mocha` to preload `expectations` (for `jest`-like testing)
```json
{
  "mocha": {
    "require": "expectations"
  }
}
```


## mocking, stubs, and spies
_By Far,_ this is the most complicated thing to get right.  I spent hours and hours over a few days on/off trying to get mocking to work (first with `jasmine`, then `sinon`).

Fortunately, I found this lil' gem:
- https://stackoverflow.com/a/46739544

Normally, ES Modules are _very locked down_ and hard to mock.  By grouping all the export-ed methods via `export default Goo`, and importing via `import Goo from '../src/goo.js'`, we can replace methods if needed for testing.  (Imagine needing to test something that live-fetches resources, etc.)

- see [src/goo.js](https://github.com/traceypooh/js-es-modules-coverage-testing/blob/master/src/goo.js)
- see [test/goo.test.js](https://github.com/traceypooh/js-es-modules-coverage-testing/blob/master/test/goo.test.js)

**2020 as ever, is a _super-exciting_ time 🥳 for javascript!**
