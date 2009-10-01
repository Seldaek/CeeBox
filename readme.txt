

/*
 * Ceebox 1.3.4 beta - (Code optimization; improved gallery navigation)
 * 1.3.4 is currently stable but it's not finished nor have I tested it across all browsers. 
 * currently stable as of commit 8afd225a2da93125fca223af979982b5eac90521
 * 
 * 
 * Requires jQuery 1.3.2 and swfobject.jquery.js plugin to work
 * Code hosted on GitHub (http://github.com/catcubed/CeeBox) Please visit there for version history information
 * By Colin Fahrion (http://www.catcubed.com)
 * Adapted from Thickbox (http://jquery.com/demo/thickbox/) Copyright (c) 2007 Cody Lindley (http://www.codylindley.com)
 * Video pop-up code inspired by Videobox (http://videobox-lb.sourceforge.net/)
 * Copyright (c) 2009 Colin Fahrion
 * Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
*/

1.3.4 UPGRADE - [status]
* Optimize code that generates image gallery [60% completed; stable] (smaller and cleaner than the mashup I borrowed from thickbox)
* Improve gallery navigation functionality [not started] (never did like the small next/prev links which are a holdover from thickbox).
* Possibly delve into other code areas to optimize further [not started]

1.3.3 UPGRADE
* Converted the urlMatch from a giant if then else to a switch, which makes it much easier to grok the code and add more video players.
* Also, it should make the javascript run slighty faster. 
* Fixed another Opera display bug (with html and body needing 100% height)
* Added Facebook video embeding

1.3.2 UPGRADE
Includes fix for Opera, which is admittedly a little hacky but it works. if anyone has a better less janky solution that would be great.

1.3.1 UPGRADE
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