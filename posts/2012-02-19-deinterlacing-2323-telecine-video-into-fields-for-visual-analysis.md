---
title: deinterlacing 2323 telecine video into fields for visual analysis
author: tracey pooh
type: post
date: 2012-02-19
featured: deinterlace.jpg
featuredalt: (uninter)"lacer" program having fun with
featured-click: /lacer/
categories:
  - video
tags:
  - coding
  - deinterlace
  - mplayer
  - video
aliases: /2012/02/19/deinterlacing-2323-telecine-video-into-fields-for-visual-analysis/
---
Having some challenging fun working on trying to deinterlace some toughie clips
from my [brother's](http://rjfilms.com) upcoming feature film.

His camera recorded in 24fps (24000/1001 to you fellow geeks 😎 and smartly
did a "2323" writing/stretching of it to 60i (60 half-frames).

After correcting back to 24fps progressive most of his clips, he's found ~10-20%
are not able to be put back together visually properly even with CineTools
and manually specifying the "cadence" and sequence starting frames, etc...

I started with code that I wrote to take a small segment of a video
and split the interlaced frames into 1/2 height "fields" and then drop them
down to grayscale to compare them all to each other to find the best matches
(to verify the cadence is right and/or the fields aren't "off by 1", etc..)

It uses mplayer and ImageMagick ("convert" and "compare") for pretty high-quality
extraction of frames from the source video into the 1/2 height "fields".

So I just do about 0.3 seconds to get 10 frames, and thus 20 1/2 frame fields for analyzing.

It will output the best matches of frames. For example:

```bash
bash lacer.txt  good.mov  0.5  0.8
```

I then extended it into a web page (screenshot above, where I'm left-shifting one field by 4 pixels for visual inspection)

**[/lacer/](/lacer/)**
<i class="fa fa-hand-point-left"></i>
try it out online! (sources: [lacer.js](/lacer/lacer.js) [lacer.txt](/lacer/lacer.txt))

that uses some CSS cleverness (clip property is your BFF!) to interlace together a pair of fields.

#### It supports:
- field swapping (move one 1/2 image to be the 1st, 3rd, 5th, etc. lines -- if it was previously the 2nd, 4th, 6th, etc. lines)
- left and right shifting a field
- pairing arbitrary fields
- showing a "raw" 60i telecined sequence
- showing the 60i sequence as a "deinterlaced" 24P sequence
