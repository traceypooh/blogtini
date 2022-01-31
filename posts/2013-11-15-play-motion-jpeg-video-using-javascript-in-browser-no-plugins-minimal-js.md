---
title: play motion-JPEG video using javascript (in browser, no plugins, minimal JS)
author: tracey pooh
date: 2013-11-15
featured: ../../../img/traceymonet.jpg
categories:
  - coding
  - video
tags:
  - coding
  - geek
  - javascript
  - motion-JPEG
  - video
aliases:
  - /2013/11/14/play-motion-jpeg-video-using-javascript-in-browser-no-plugins-minimal-js/
  - /mj/
  - /mj
---
# Motion JPEG test

<style>
#map {
  position: relative;
  height: 480px;
  width: 100%;
}
#map img {
  position: absolute;
  border: 5px solid #333;
}
#bodydiv textarea {
  height: 2000px;
}
</style>

<div id="bodydiv">
  <input type="button" value="test image" onclick="MJ.test_img('/img/traceymonet.jpg')"/>
  <input type="button" value="motion jpeg avi (short, 3.5MB)"
    onclick="MJ.mjpeg(-1, 'https://archive.org/cors/stairs/stairs.avi', 20); delete MJ.fi; MJ.fi=0"
  />
  <input type="button" value="motion jpeg avi (34 seconds, 55MB)"
    onclick="MJ.mjpeg(-1, 'https://archive.org/cors/bikeDiablo-alt/bikeDiablo-alt.avi', 30); delete MJ.fi; MJ.fi=0"
  />

  <div id="map">
    <div style="padding: 30px 0 0 50px; font-size: 2em">
      <span class="fas fa-hand-point-up"></span>
      click a button above to try
      <span class="fas fa-hand-point-up"></span>
    </div>
    <noscript>Any app that can be written in JavaScript, will eventually be written in JavaScript.<br/>- Jeff Atwood<br/><b><i>enable thy javascript</i></b></noscript>
  </div>
  <div>
    Huh?
    <i>
      <p>
        This extracts the JPEG frames, _found within an `.avi` file bytestream_, likely without the huffman compression tables (though chrome dont care 8-).
        Then it base64 encodes each frame, inserting each frame into a dynamic &lt;img&gt; tag to "play the .avi file".
        <img src="/img/emote_happy_dance_infinite.gif"/>
      </p>
      <p>
        Add in a short display timeout and keep overlaying images, and you have your "video", using &lt;img&gt; tags, like a flip book.<br/>
      </p>
    </i>
    <h3>Works</h3>
      <ul>
        <li>chrome</li>
        <li>firefox (but slow)</li>
      </ul>
    <h3>Nope</h3>
      <small>(probably not happy w/ missing huffman compression tables in img headers)</small>
      <ul>
        <li>safari/iOS</li>
        <li>MS IE</li>
      </ul>
    <hr/>
    <small>
      Originally created 2006 by Tracey Jaquith.
      minor updates to jQuery and simplifying 2013
    </small>
  </div>

  <h2>Source (or "View Source"):</h2>
  <textarea id="src"></textarea>
</div>

<script src="/js/jquery.js"></script>
<script src="/js/motion-jpeg.js"></script>
<script src="/js/motion-jpeg-source.js"></script>
