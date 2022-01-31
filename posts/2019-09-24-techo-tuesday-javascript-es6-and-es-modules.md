---
title: 🌮 Techo Tuesday 🌮 Javascript ES6 and ES Modules
date: 2019-09-24
categories:
  - technical
  - techo tuesday
  - coding
  - website
tags:
  - coding
  - geek
  - javascript
featured: https://hacks.mozilla.org/files/2018/03/02_module_scope_04-768x691.png
featuredcaption: "image credit: Lin Clark <a href='https://twitter.com/linclark'>@linclark</a> (article link included below)"
---
_things turning me on this week_ <br/>
_☕enjoy with a hot cupa java/script_ <br/>
JavaScript got all growed up since it begun, when "ES6" hit the scenes (now present it just about every browser and mobile setup at this point aside from MSIE).
You can finally do _sane_ things like `class Foo { .. }` similar to other languages, and the dreaded `this` "stealing" is finally sane with "fat arrow" functions like `const myfunc = (arg1, arg2) => { console.log({ arg1, arg2 }) }`.
Pentultimately, javascript template strings are _amazing_ and get us all out of the quoting and multi-line h*ll we've been dealing with for _decades_.
Lastly, throw in 'ES Modules' and you get a _#1_ world-class code including/importing system that handles optimizing across `server <=> client` boundaries.

## ES6 Examples

ES6 is a [major update to JavaScript](https://www.freecodecamp.org/news/write-less-do-more-with-javascript-es6-5fd4a8e50ee2/) that fixes _sooo many things_.

Among _other things_:

- We get _real_ `class` definitions.
- We get _real_ `constructor()` methods.
- `const` and `let` make variables safer and much easier to maintain.
- We can use `static` methods (class methods callable _without_ instantiating/constructing objects)
- We get multi-line 'template strings' that can have JS code inside `${ .. }` blocks.  Brilliant!

---

```js
class Adder {
  constructor(arg) {
    this.arg = arg
  }
  render() {
    return `
<div class="something">
  You said: ${this.arg}
</div>`
  }

  static add(x, y) {
    return x + y
  }
}
```

Some simple calls:

```js
Adder.add(3, 10)
```
`=> 13`

```javascript
const math = new Adder(17)
math.render()
```
```text
<div class="something">
  You said: 17
</div>"
```


## ES Modules

The article below, I've pored over at least 3x over last year or so.  It's always a treat, and showcases _just how good_ and amazing ES Modules really are.  _To wit_ nodeJS is migrating to ES Modules instead of commonJS.

Basically, you can have JS code that imports other JS code (across the web) efficiently.  Like best-in-class code/package managers, even circular dependencies are no problem.  It works via 3 stages:

- [**load**] quick parse (but don't execute) found lists of (included) `.js` files to find other `.js` files that are, in turn, `import`-ed.  Load `.js` files in parallel (and over binary/compressed HTTP/2 connections, ideally).  Make "variable slots" that connect `import .. from ..` statements with imported/included files.
- [**instantiate**] setup all the "slots" - connecting imported/included code with the names used in the _including_ code.
- [**evaluate**] excecute all the JS code, filling in the "slots" with values and evaluated code.

Check out
[Lin Clark's excellent overview of ES Modules](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/)

