---
title: 🌮 Techo Tuesday 🌮 Dark Mode
date: 2019-10-08
featured: good-v-evil.jpg
featuredcaption: "dark -v- light mode"
class: featured-top
categories:
  - technical
  - techo tuesday
  - coding
  - website
tags:
  - css
  - javascript
  - dark mode
  - coding
  - geek
---
_things turning me on this week_ <br/>
_☕enjoy with a hot cupa java/script_ <br/>
'Dark Mode' is new - and a great relief to our eyes at night.
_Thankfully_ it's also not _that_ hard to setup very effectively.

# Basics
If you _ideally_ use either minimal css/style `color:` and `background-color:` or neutral colors (eg: middle grays for accents like `#888`) then your work is a lot simpler because you have less overrides to setup.

Effectively, one easy pass through is to find your darker and lighter colors and invert them for when it is dark mode.

You can then set those overrides into a `CSS` 'media query' eg:
```css
@media (prefers-color-scheme: dark) {
  body {
    color: #ddd;
    background-color: #111;
  }
}
```
That might override normal defaults (implicit or explict) for your site like:
```css
  body {
    color: #111;
    background-color: #ddd;
  }
```
The less places that use specific colors - the less you have setup overrides for.

# Advanced
At the time of this writing:

- macosx is `Mojave` and `Catalina` comes later this month
  - Mojave has only either everything is dark mode (always) or not
- iOS latest is v13
  - which has the same ^^ ability to always be light/default, always be dark, **_or_** be time-based

So for non-mobile, if you want _time-based_ dark mode, you can use `javascript` to _additionally_ use the browser's localtime to do dark mode when it's evening hours _and_ dark mode is enabled (and otherwise do default/light/day mode).
```js
if (window.matchMedia  &&  window.matchMedia('(prefers-color-scheme: dark)').matches) {
  log('bring on the darkness!')
  const hour = new Date().getHours()
  if (7 <= hour  &&  hour < 19) { // override [7am .. 7pm] localtime
    log('.. but its vampire sleep time - back to day mode')
    $('body').addClass('lite')
  }
}
```
and you can assign some 'overrides to the overrides' in your `css` rules like:
```css
body.lite {
  color: #333;
  background-color: #f4f4f4;
}
```
which will basically disable/revert dark mode during the local daylight hours.

Once Catalina macosx hits, I will _likely_ drop the JS and `body.lite` stuff above.

Feel free to see the 'dark mode' CSS and JS I'm using here:
[CSS](/css/add-on.css)
[JS](/js/add-on.js)
(presently at the bottom of the files).
