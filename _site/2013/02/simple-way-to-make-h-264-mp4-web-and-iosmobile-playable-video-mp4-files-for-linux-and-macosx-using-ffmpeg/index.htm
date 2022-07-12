---
title: simple way to make h.264 mp4 web and iOS/mobile playable video mp4 files for linux and macosx using ffmpeg
url: 2013/02/simple-way-to-make-h-264-mp4-web-and-ios-mobile-playable-video-mp4-files-for-linux-and-macosx-using-ffmpeg
author: tracey pooh
type: post
date: 2013-02-10
categories:
  - linux
  - video
tags:
  - coding
  - ffmpeg
  - geek
  - h.264
  - Internet Archive
  - video
  - x264
aliases: /2013/02/09/simple-way-to-make-h-264-mp4-web-and-iosmobile-playable-video-mp4-files-for-linux-and-macosx-using-ffmpeg/
---
Greetings video geeks! 😎<br/>
At my job, I've updated the process and way we create our .mp4 files that are shown on video pages on archive.org

It's a much cleaner/clearer process, namely:

  * I opted to **ditch ffpreset files in favor of command-line argument** 100% equivalents. It seems a bit easier for someone reading the task log of their item, trying to see what we did.
  * I **no longer need qt-faststart** step and dropped it. I use the cmd-line modern ffmpeg `-movflags faststart`

Entire processing is now done 100% with ffmpeg, in the standard "2-pass" mode

As before, this output .mp4:

  * **plays in** modern html5 video tag compatible **browsers**
  * **plays in flash** plugin within browsers
  * works on all **iOS devices**
  * makes sure the "moov atom" is at the front of the file, so browsers can **playback before downloading** the entire file, etc.


Here is an example (you would tailor especially the `scale=640:480` depending on source aspect ratio and desired output size; change or drop altogether the `-r 20` option (the source was 20 fps, so we make the dest 20 fps); tailor the bitrate args to taste):
```bash
ffmpeg -y -i stairs.avi -vcodec libx264 -pix\_fmt yuv420p -vf yadif,scale=640:480 \
  -profile:v baseline \
  -x264opts cabac=0:bframes=0:ref=1:weightp=0:level=30:bitrate=700:vbv\_maxrate=768:vbv_bufsize=1400 \
  -movflags faststart -ac 2 -b:a 128k -ar 44100 -r 20 -pass 1 -acodec aac \
  -strict experimental stairs.mp4;

ffmpeg -y -i stairs.avi -vcodec libx264 -pix\_fmt yuv420p -vf yadif,scale=640:480 \
  -profile:v baseline \
  -x264opts cabac=0:bframes=0:ref=1:weightp=0:level=30:bitrate=700:vbv\_maxrate=768:vbv_bufsize=1400 \
  -movflags faststart -ac 2 -b:a 128k -ar 44100 -r 20 -pass 2 -acodec aac \
  -strict experimental \
  -metadata title='Stairs where i work - https://archive.org/details/stairs' \
  -metadata year='2004' \
  -metadata comment='license:http://creativecommons.org/licenses/publicdomain/' \
  stairs.mp4
```

 <em id="__mceDel">Happy hacking and creating!</em>

PS: here is the
[way we compile ffmpeg](https://github.com/traceypooh/deriver-archive/blob/master/ffmpeg-README.sh)
(we use ubuntu linux at work, but this script used to have minor mods for macosx, too).
