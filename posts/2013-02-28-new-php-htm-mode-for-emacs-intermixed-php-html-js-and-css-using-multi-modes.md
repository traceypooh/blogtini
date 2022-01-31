---
title: new 'php-htm-mode' for emacs — intermixed PHP, HTML, JS, and CSS using multi-modes
author: tracey pooh
date: 2013-02-28
featured: https://raw.github.com/traceypooh/php-htm-mode/master/php.png
class: featured-bottom
featuredalt: screenshot of php-htm-mode
featuredcaption: screenshot of php-htm-mode
categories:
  - linux
  - macosx
  - technical
tags:
  - coding
  - emacs
  - geek
  - linux
  - lisp
  - mac
  - php
  - php-htm-mode
aliases: /2013/02/27/new-php-htm-mode-for-emacs-intermixed-php-html-js-and-css-using-multi-modes/
---
I finally formalized, cleaned up, and packaged up my current emacs editing setup for files with intermixed PHP, HTML, JS/javascript, and CSS code all in the same file.  It uses an existing but rarely used technique called "multi-mode" and sets "trigger points" for switching the "major mode" of the buffer as your cursor moves through the code.

A nice thing about this approach is that you can always glance down anytime you are editing to see which mode you are in (or the emacs lisp code **thinks** you are in).  You can also fork/edit the single ".el" lisp file to add/update the triggers for various modes.

https://github.com/traceypooh/php-htm-mode
