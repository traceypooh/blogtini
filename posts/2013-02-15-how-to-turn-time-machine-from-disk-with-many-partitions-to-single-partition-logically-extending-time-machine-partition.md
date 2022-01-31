---
title: How to turn Time Machine from disk with many partitions to single partition (logically “extending” Time Machine partition)
author: tracey pooh
type: post
date: 2013-02-15
categories:
  - macosx
tags:
  - geek
  - mac
  - macosx
  - partioning
  - time machine
aliases: /2013/02/14/how-to-turn-time-machine-from-disk-with-many-partitions-to-single-partition-logically-extending-time-machine-partition/
---
<span style="font-size: medium;"><span style="line-height: 24px;">The high-level answer is:  </span></span>

  * <span style="line-height: 16px;">use macosx Disk Utility</span>
  * make a .dmg of Time Machine partition (to another disk)
  * wipe out disk
  * restore .dmg
  * extend partition to full size (or whatever size you want) of disk

Detailed steps:

  1. backup one last time with Time Machine
  2. turn off Time Machine via preferences
  3. open Disk Utility (builtin mac app)
  4. select the partition where your Time Machine backups are
  5. hit the "New Image" icon in top bar -- use the default options (with ".dmg" suffix, no encryption)
  6. save the .dmg to another disk that has space (this takes awhile)
  7. once that's done, you can re-partition using Disk Utility the disk that originally had your Time Machine partition on it.  (WARNING THIS WIPES OUT ENTIRE DISK AND ALL PARTITIONS!)  Select each partition on the disk and hit the [-] icon near the bottom of the partition list.  BE VERY CAREFUL AND MAKE SURE YOU HAVE IDENTIFIED THE RIGHT DISK!
  8. your disk is now empty...
  9. repartition the disk however you like -- since Time Machine uses its own subdir, I suggest partitioning the disk to a single partition, full extent of the disk
 10. with the emptied disk still selected, hit "Restore" button/tab to the right
 11. find the .dmg you made previously as your Source
 12. drag the emptied partition (where you want Time Machine backups to go) to the Destination
 13. hit the "Restore" button (bottom right)
 14. it will ask you to approve scanning/verifying .dmg (yes/OK)
 15. (this takes awhile)
 16. resize your restored Time Machine partition to full disk (or whatever size you want)
 17. turn back on Time Machine backups
 18. approve the question about "disk has moved..."

PS: you can also you this technique to move an entire set of Time Machine backups from one disk to another disk (without losing all your backups!)