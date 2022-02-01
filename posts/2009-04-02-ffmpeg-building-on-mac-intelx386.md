---
title: ffmpeg building on mac intel/x386
url: 2009/04/ffmpeg-building-on-mac-intel-x386
author: tracey pooh
type: post
date: 2009-04-02
categories:
  - video
tags:
  - ffmpeg
  - video
aliases: /2009/04/01/ffmpeg-building-on-mac-intelx386/
---
ffmpeg v0.5 just came out. it's the bomb. it's got tons of fixes and massive amounts of new codecs that it can read. for example, it can now decode my professional filmmaker brother's "DVC ProHD" highly proprietary (and massive bitrate!) format! it can also decode flac and 24-bit flac. (encoding flac is disappointing though).

at any rate! macports is a great way to get it installed on your mac.

the current way of setting up macports and then doing

`sudo port install ffmpeg`

works fine on my PPC at work (oddly -- pretty old computer now) but not my Air (intel x386)

So I set out to find the fixes needed to make it work. Here they are:

step 1: install macports -- see http://www.macports.org/install.php
```bash
sudo port install x264 +noasm # for i386 (not needed for PPC)
sudo port fetch ffmpeg
sudo port checksum ffmpeg
sudo port extract ffmpeg
sudo port patch ffmpeg
```
remove `--enable-shared` from
`/opt/local/var/macports/sources/rsync.macports.org/release/ports/multimedia/ffmpeg/Portfile`

sudo port install ffmpeg

### [May update]
I think the packages are improving so some of the above steps may not be necessary, depending on your Mac model, xcode version, and such. So I'd suggest just trying

`sudo port install ffmpeg`

first to see if it works and try some tweaks above if that doesn't work.
