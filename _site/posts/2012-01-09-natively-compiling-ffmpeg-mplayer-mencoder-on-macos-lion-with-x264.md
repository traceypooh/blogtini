---
title: natively compiling ffmpeg, mplayer, mencoder on MacOS Lion (with x264!)
author: tracey pooh
type: post
date: 2012-01-09
categories:
  - video
tags:
  - coding
  - ffmpeg
  - geek
  - mac
  - video
aliases: /2012/01/09/natively-compiling-ffmpeg-mplayer-mencoder-on-macos-lion-with-x264/
---
OK, I've revamped my script to compile these tools:

```bash
ffmpeg
ffrobe
qt-faststart
mplayer
mencoder
```

on MacOS Lion, using the heads of the trees, with direct encoding support for:

`x264`

`vpx` / WebM

https://archive.org/~tracey/downloads/macff.sh.txt

A nice recent update to ffmpeg is the ability to decode/read Apple ProRes, too!
