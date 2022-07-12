---
title: 'convert yuvj420p to yuv420p (chrome playable!) mp4 video (eg: canon/nikon video)'
url: 2012/06/convert-yuvj420p-to-yuv420p-chrome-playable-mp4-video-eg-canon-nikon-video
author: tracey pooh
date: 2012-06-17
categories:
  - video
tags:
  - camera video
  - colorspaces
  - ffmpeg
  - geek
  - video
  - yuvj420p
aliases: /2012/06/17/convert-yuvj420p-to-yuv420p-chrome-playable-mp4-video-eg-canonnikon-video/
---
hooray!
found a nice (video lossless, best i can tell) way to convert the video from cameras like my Canon ELPH SD1400

which is **already** h.264 video + PCM mono audio

to a new mp4 container with aac audio. that part's easy/cake w/ ffmpeg -- but the trick to get the h.264

video part to play in chrome browser and/or with a flash plugin is to get the flagged "yuvj420p" colorspace pixels

to be considered "yuv420p". it seems like the former is >= 8 bits-per-pixel and has a range wider than the 256 values;

while the later is 8 bit per pixel. ( brief [info/notes/background](https://lists.libav.org/pipermail/libav-user/2010-August/005234.html) )

at any rate, finally found this nice post:

<https://blendervse.wordpress.com/2012/04/02/waiving-the-fullrange-flag/>

which refers to this modified MP4Box/gpac tree, to switch the "fullrange" color-related flag off:

<https://github.com/golgol7777/gpac>

and then, voila! i have a nice little script where i can convert my canon ELPH videos to a html5 video tag and flash plugin compatible mp4:

```bash
#!/bin/bash -ex
IN=${1:?"Usage: [input video] [output video]"}
OUT=${2:?"Usage: [input video] [output video]"}
# make hacked version of "mp4box" that can toggle colorspace-related flag in our vid
if [ ! -e $HOME/scripts/mp4box ]; then
  (git clone https://github.com/golgol7777/gpac.git  &&  cd gpac)  ||  \
  ( cd gpac  &&  git reset --hard  &&   git clean -f  &&  git pull  &&  git status )
    ./configure --enable-pic --static-mp4box --enable-static-bin
    make -j4
    # bonus points: make *static* binary so if change linux/OS versions, dont hafta worry!
    cd applications/mp4box
    gcc  -o  $HOME/scripts/mp4box   -static   main.o filedump.o fileimport.o live.o \
      -L../../bin/gcc -lgpac_static -lm -lpthread -ldl -lz
fi
# demux
ffmpeg -y -i "$IN" -an -vcodec copy  video.mp4
ffmpeg -y -i "$IN" -vn -acodec copy  audio.wav
# convert yuvj420p to yuv420p the cheater way (for chrome and flash plugin playback!)
rm -fv tmp.mp4
$HOME/scripts/mp4box  -add video.mp4#:fullrange=off tmp.mp4
# convert wav audio to aac
ffmpeg -y -i tmp.mp4 -i audio.wav -acodec libfaac -ac 1 -ab 256k  -vcodec copy  t2.mp4
qt-faststart t2.mp4 "$OUT"
rm -fv video.mp4 audio.wav t2.mp4 tmp.mp4
```
