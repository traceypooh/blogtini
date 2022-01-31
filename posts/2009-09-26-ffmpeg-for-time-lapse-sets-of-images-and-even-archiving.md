---
title: ffmpeg for time-lapse, sets of images, and even *archiving*!
author: tracey pooh
date: 2009-09-26
categories:
  - video
tags:
  - ffmpeg
  - video
aliases: /2009/09/25/ffmpeg-for-time-lapse-sets-of-images-and-even-archiving/
---
I now use the [FFMPEG](https://ffmpeg.org) [package](http://trac.macports.org/browser/trunk/dports/multimedia/ffmpeg) compiled locally on my Mac Leopard laptop.<br/>
If you want to take a bunch of JPEG images, you can turn them into a "motion JPEG" AVI video file (which is ideal for time-lapse). What's neat about `ffmpeg`, is you can turn a directory of JPEGs into an AVI and later recreate the JPEGs from the AVI.

Thus, I can take 100-1000 JPEG images from a "shoot" and create a video time-lapse of all the JPEG images in a given subdir in a command-line shell (terminal):

```bash
ffmpeg -r 6 -i "%04d.jpg" -an -vcodec copy out.avi
```

Even cooler, you can go directly back to **the same JPEG** images like so (this is where you can see it is a lossless conversion from JPEGs to Motion JPEG and back):

```bash
ffmpeg -i out.avi -vcodec copy "%04d.jpg"
```

`-r 6` is the framerate, ie: "make the video play 6 JPEG images per second".

It doesn't get much nicer than that! Not to mention, the encoding is FAST! I recently moved from mencoder/mplayer to ffmpeg since you can specify a complete copy of the input JPEGs (lossless from the source) as well as compress them down a bit (as you like).

For the lossless conversion, the (not entirely obvious) **key** to success is to use the `-vcodec copy` **after** the source file(s).

You can get this running on Windows with Cygwin, Mac with terminal, and any linux distribution like Ubuntu.
