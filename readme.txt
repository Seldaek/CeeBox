/*
 * Ceebox 1.4 jQuery Plugin - Minimized via YUI compressor
 * Requires jQuery 1.3.2 and swfobject.jquery.js plugin to work
 * Code hosted on GitHub (http://github.com/catcubed/CeeBox) Please visit there for version history information
 * By Colin Fahrion (http://www.catcubed.com)
 * Inspiration for CeeBox comes from Thickbox (http://jquery.com/demo/thickbox/) and Videobox (http://videobox-lb.sourceforge.net/)
 * However, along the upgrade path CeeBox has morphed a long way from those roots.
 * Copyright (c) 2009 Colin Fahrion
 * Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
*/

// To make ceebox work add $(".ceebox").ceebox(); to your global js file in the document ready and add ceebox as a class to your links

/* OPTIONAL SETTINGS
  * For html and videos, CeeBox automatically defaults to the size of the browser (minus a few pixels)
  * You can change this on a case by case basis via the rel attribute
  * You can also change the default to a static size by adding settings to the ceebox function like so:
  * $(".ceebox").ceebox({vidWidth:600,vidHeight:400,htmlWidth:600,htmlHeight:400});
  * Note, if you change the settings both width and height must be set. You can however choose to only set video or html size.
*/ 

1.4 jQuery Plugin Release
* Now a full fledged jquery plugin.
* Incorporates all the improvements and code optimization of 1.3.x
* Tested on FF 3.5,Opera 10, Safari 4, Chrome, IE6/7/8
* Due to additional refinements jquery.ceebox.js is 8.4KB minimized

1.3.5 Patch
* small bug fixes

1.3.4 Patch (though really more of an upgrade)
* Optimize code that generates image gallery (smaller and cleaner than before)
* Add graphic links for next, prev, and close buttons; make next/prev occur as rollovers on top of the image.
* Further optimize/shrink js (now 14.2KB upcompressed and 9.5KB compressed using YUI compressor)
* provide minimized version of css

1.3.3 Patch
* Converted the urlMatch from a giant if then else to a switch, which makes it much easier to grok the code and add more video players.
* Also, it should make the javascript run slighty faster. 
* Fixed another Opera display bug (with html and body needing 100% height)
* Added Facebook video embeding

1.3.2 Patch
Includes fix for Opera, which is admittedly a little hacky but it works. if anyone has a better less janky solution that would be great.

1.3.1 Patch
Includes fixes by Mark Elphinstone-Hoadley for IE6.

1.3 UPGRADE
Code cleanup and optimization. Reduced size of file from 17.7KB to 15.5KB. Minimized version is 10.1KB

1.2 UPGRADE
 * Uses the much smaller jquery.swfobject.js 1.0.7 instead of the swfobject.js
 * Allows Base Width & Height to be flexible based on the browser window or static
 * fixes problem with Esc not working and position problem with iframes
 * adds arrow keys functionality to move to next/prev image when used for galleries
 * General code cleanup.

1.1 UPGRADE
 * includes fix for jQuery 1.3.2
 * adds support for Vimeo and Dailymotion



Please refer to the following link for instructions and to make sure that you are using the most current version of Ceebox:
http://catcubed.com/2008/12/23/ceebox-a-thickboxvideobox-mashup/

I have included both a minified version and the full version of CeeBox. You can choose to use either.

jquery.swfobject.js v1.0.7 and jquery.js v1.3.2 in this archive. Which are the most current versions as of this release of Ceebox. It is also recommended that you visit http://jquery.com/ and http://code.google.com/p/swfobject/ to make sure that these are up to date.