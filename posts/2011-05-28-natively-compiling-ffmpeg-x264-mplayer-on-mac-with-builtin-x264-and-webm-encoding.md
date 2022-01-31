---
title: natively compiling ffmpeg, x264, mplayer on mac (with builtin x264 and webm encoding)
author: tracey pooh
type: post
date: 2011-05-28
categories:
  - video
tags:
  - coding
  - ffmpeg
  - video
aliases: /2011/05/28/natively-compiling-ffmpeg-x264-mplayer-on-mac-with-builtin-x264-and-webm-encoding/
---
i'm very pleased that after years of hacks here and there, all three heads of the current codebases pretty well build natively on mac (snow leopard) for

- x264
- ffmpeg
- mplayer

here, i'm making sure that i compile in static version of libvpx (Webm) and libx264 (h.264) video packages so that the ffmpeg can easily make hiqh quality h.246 and webm transcoded videos.

<https://archive.org/~tracey/downloads/macff.sh>

So we can make nice (2 pass video) ~768 kb/sec 640&#215;480 derivatives like so (alter `-r ..` as appropriate):

### make WebM
```bash
ffmpeg -deinterlace -y -i 'camels.avi' -vcodec webm -fpre libvpx-360p.ffpreset  \
  -vf scale=640:480  -r 20  -threads 2  -map_meta_data -1:0  -pass 1  \
  -an  tmp.webm

ffmpeg -deinterlace -y -i 'camels.avi' -vcodec webm -fpre libvpx-360p.ffpreset  \
  -vf scale=640:480  -r 20  -threads 2  -map_meta_data -1:0  -pass 2  \
  -acodec libvorbis -ab 128k -ac 2 -ar 44100 tmp.webm

mv tmp.webm 'camels.webm'
```

### make h.264
```bash
ffmpeg -deinterlace -y -i 'camels.avi' -vcodec libx264 -fpre libx264-IA.ffpreset  \
  -vf scale=640:480  -r 20  -threads 2  -map_meta_data -1:0  -pass 1  \
  -an  tmp.mp4

ffmpeg -deinterlace -y -i 'camels.avi' -vcodec libx264 -fpre libx264-IA.ffpreset  \
  -vf scale=640:480  -r 20  -threads 2  -map_meta_data -1:0  -pass 2  \
  -acodec aac -strict experimental -ab 128k -ac 2 -ar 44100 tmp.mp4

qt-faststart tmp.mp4 'camels.mp4'
```

our preset files:

<https://archive.org/~tracey/downloads/libvpx-360p.ffpreset>

<https://archive.org/~tracey/downloads/libx264-IA.ffpreset>

Nice things about the h.264 derivative:

  * plays on all iphones and ipads
  * browser video tag and/or flash plugin compatible
  * starts immediately, seeks immediately even before entire video is downloaded

hope this may be useful!