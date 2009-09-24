//ceebox
/*
 * Ceebox 1.3.1
 * By Colin Fahrion (http://www.catcubed.com)
 * Adapted from Thickbox (http://jquery.com/demo/thickbox/) Copyright (c) 2007 Cody Lindley (http://www.codylindley.com)
 * Video pop-up code inspired by Videobox (http://videobox-lb.sourceforge.net/)
 * Copyright (c) 2009 Colin Fahrion
 * Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
 * Ceebox 1.3 requires jQuery 1.3.2 and swfobject.jquery.js plugin to work
*/

/* 1.3.1 UPGRADE
 * Code cleanup and optimization. Reduced size of file from 17.7KB to 15.5KB. Minimized version is 10.1KB
 * Includes IE6 fix provided by Mark Elphinstone-Hoadley
*/
/* 1.2 UPGRADE
 * Uses the much smaller jquery.swfobject.js 1.0.7 instead of the swfobject.js
 * Allows Base Width & Height to be flexible based on the browser window or static
 * fixes problem with Esc not working and position problem with iframes
 * adds arrow keys functionality to move to next/prev image when used for galleries
 * General code cleanup.
*/
/* 1.1 UPGRADE
 * includes fix for jQuery 1.3.2
 * adds support for Vimeo and Dailymotion
*/

// BASE SETTINGS - Edit to your liking
// path to loading animationChange base settings below.
var pathToLoadingAnim = "../images/loadinganimation.gif";

// Base Width and Height for html boxes 
// if set to false, size is set automatically by size of browser window. Can be set to a static size (ie, var vidBaseW = 480; var vidBaseH = 359;).
var htmlBaseW = false;
var htmlBaseH = false;
// Base Width and Height for video boxes
// if set to false, size is set automatically by size of browser window. Can be set to a static size (ie, var vidBaseW = 480; var vidBaseH = 359;).
var vidBaseW = false;
var vidBaseH = false;


/*!!!!!!!!!!!!!!!!! edit below this line at your own risk !!!!!!!!!!!!!!!!!!!!!!!*/

//on page load call cee_init
$(document).ready(function(){   
	cee_init('a.ceebox, area.ceebox, input.ceebox');//pass where to apply ceebox
	imgLoader = new Image();// preload image
	imgLoader.src = pathToLoadingAnim;
	
	/* Opera Hack.
	 * Flash movies were not displaying properly with CeeBox under Opera. Videobox works fine, I don't know what's different.
	 * I randomly discovered that if there is an inline element immediately under the body tag it works. 
	 * Don't ask me why but this works. Note that I have made the text invisible to hide added element.
	 * If anyone has a better solution please let me know. I hate having to include something as hacky as this.
	*/
		if($.browser.opera){
			$("body").append("<span style='line-height:0px;color:rgba(0,0,0,0)'>lame opera hack</span>");
		}
});

//add ceebox function to href & area elements that have a class of .ceebox
function cee_init(domChunk){
	$(domChunk).click(function(){
	var t = this.title || this.name || null;
	var a = this.href || this.alt;
	var g = this.rel || false;
	cee_show(t,a,g);
	this.blur();
	return false;
	});
}

function cee_show(caption, url, rel) {//function called when the user clicks on a ceebox link

	try {
		if (typeof document.body.style.maxHeight === "undefined") {//if IE 6
			$("body","html").css({height: "100%", width: "100%"});
			$("html").css("overflow","hidden");
			if (document.getElementById("cee_HideSelect") === null) {//iframe to hide select elements in ie6
				$("body").append("<iframe id='cee_HideSelect'></iframe><div id='cee_overlay'></div><div id='cee_window'></div>");
				$("#cee_overlay").click(cee_remove);
			}
		}else{//all others
			if(document.getElementById("cee_overlay") === null){
				$("body").append("<div id='cee_overlay'></div><div id='cee_window'></div>");
				$("#cee_overlay").click(cee_remove);
			}
		}
		//For Firefox use png overlay to hide flash otherwise use background and opacity
		(cee_detectMacXFF()) ? $("#cee_overlay").addClass("cee_overlayMacFFBGHack") : $("#cee_overlay").addClass("cee_overlayBG");
		
		if(caption===null){caption="";}
		$("body").append("<div id='cee_load'><img src='"+imgLoader.src+"' /></div>");//add loader to the page
		$('#cee_load').show();//show loader
		
		var baseURL = (url.indexOf("?")!==-1) ? url.substr(0, url.indexOf("?")) : url; //grab query string if there is one
		
		var urlString = /\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$|\.swf$|\.htm$|\.html$|\.asp$|\.aspx$/;
		var urlType = baseURL.toLowerCase().match(urlString);
		
		// Size of module window for video or html
		var vidSize = cee_getSize(rel,vidBaseW,vidBaseH);
		var htmlSize = cee_getSize(rel,htmlBaseW,htmlBaseH);
		
		if(urlType == '.jpg' || urlType == '.jpeg' || urlType == '.png' || urlType == '.gif' || urlType == '.bmp'){
			//Display images in box
			imgs = {
				pCap: "",
				pUrl: "",
				pHtml: "",
				nCap: "",
				nUrl: "",
				nHtml: "",
				count: "",
				fUrl: false
			}
			
			if(rel){
				cee_TempArray = $("a[rel="+rel+"]").get();
				for (i = 0; ((i < cee_TempArray.length) && (imgs.nHtml === "")); i++) {
					var urlTypeTemp = cee_TempArray[i].href.toLowerCase().match(urlString);
						if (!(cee_TempArray[i].href == url)) {						
							if (imgs.fUrl) {
								imgs.nCap = cee_TempArray[i].title;
								imgs.nUrl = cee_TempArray[i].href;
								imgs.nHtml = "<span id='cee_next'>&nbsp;&nbsp;<a href='#'>Next &gt;</a></span>";
							} else {
								imgs.pCap = cee_TempArray[i].title;
								imgs.pUrl = cee_TempArray[i].href;
								imgs.pHtml = "<span id='cee_prev'>&nbsp;&nbsp;<a href='#'>&lt; Prev</a></span>";
							}
						} else {
							imgs.fUrl = true;
							imgs.count = "Image " + (i + 1) +" of "+ (cee_TempArray.length);											
						}
				}
			}
			

			imgPreloader = new Image();
			imgPreloader.onload = function(){		
				imgPreloader.onload = null;
					
				// Resizing large images
				var pagesize = cee_getPageSize();
				var x = pagesize[0] - 150;
				var y = pagesize[1] - 150;
				var imgW = imgPreloader.width;
				var imgH = imgPreloader.height;
				
				if (imgW > x) {
					imgW = x;
					imgH = imgH * (x / imgW);
				};
				if (imgH > y) {
					imgW = imgW * (y/imgH);
					imgH = y;
				};
				// End Resizing
				
				$("#cee_window").append("<a href='' id='cee_ImageOff' title='Close'><img id='cee_Image' src='"+url+"' width='"+imgW+"' height='"+imgH+"' alt='"+caption+"'/></a>" + "<div id='cee_caption'>"+caption+"<div id='cee_secondLine'>" + imgs.count + imgs.pHtml + imgs.nHtml + "</div></div><div id='cee_closeWindow'><a href='#' id='cee_closeWindowButton' title='Close'>close</a> or Esc Key</div>"); 		
				
				$("#cee_closeWindowButton").click(cee_remove);
				
				
				if (imgs.pHtml != "") {
					function goPrev(){
						document.onkeydown = null;
						if($(document).unbind("click",goPrev)){$(document).unbind("click",goPrev);}
						$("#cee_window").remove();
						$("body").append("<div id='cee_window'></div>");
						cee_show(imgs.pCap, imgs.pUrl, rel);
						return false;
					}
					$("#cee_prev").click(goPrev);
				}
				if (imgs.nHtml != "") {
					function goNext(){
						document.onkeydown = null;
						$("#cee_window").remove();
						$("body").append("<div id='cee_window'></div>");
						cee_show(imgs.nCap, imgs.nUrl, rel);				
						return false;
					}
					$("#cee_next").click(goNext);
				}
				
				document.onkeydown = function(e){ 	
					e = e || window.event;
					var code = e.keyCode || e.which;
					if(code == 27){ // close
						cee_remove();
					} else if(code == 190 || code == 39 && imgs.nHtml != ""){ // display next image
						goNext();
					} else if(code == 188 || code == 37 && imgs.pHtml != ""){ // display prev image
						goPrev();
					}	
				};
				
				cee_position(imgW + 30,imgH + 60);
				$("#cee_load").remove();
				$("#cee_ImageOff").click(cee_remove);
				$("#cee_window").css({display:"block"}); //for safari using css instead of show
			};
			
			imgPreloader.src = url;
		}else if (urlType == '.swf' && !url.match(/metacafe\.com\/watch/i)){
			//code to show swf.
			var vidSrc = url;
			var params = {
					wmode: "transparent",
					allowFullScreen: "true",
					allowScriptAccess: "always",
					flashvars: {
						autoplay: true
					}
				};
			
			cee_vidWindow(vidSrc,vidSize,caption,params);

		}else if (url.match(/youtube\.com\/watch/i)){
			//play youtube video in swf player

			var vidId = url.split('v=')[1].split('&')[0];
			var vidSrc = "http://www.youtube.com/v/"+vidId+"&hl=en&fs=1&autoplay=1"
			var params = {
					wmode: "transparent",
					allowFullScreen: "true",
					allowScriptAccess: "always"
				};
			
			cee_vidWindow(vidSrc,vidSize,caption,params);
			
		}else if (url.match(/google\.com\/videoplay/i)) {
			//play google video in swf player

			var vidId = url.split('id=')[1].split('&')[0];
			var vidSrc = "http://video.google.com/googleplayer.swf?docId="+vidId+"&hl=en"
			var params = {
					wmode: "transparent",
					allowFullScreen: "true",
					allowScriptAccess: "always",
					flashvars: {
						autoplay: true,
						playerMode: "normal",
						fs: true
					}
				};
			
			cee_vidWindow(vidSrc,vidSize,caption,params);
			
		}else if(url.match(/metacafe\.com\/watch/i)){
			//play metacafe video in swf player

			var vidId = url.split('id=')[1].split('&')[0];
			var vidSrc = "http://www.metacafe.com/fplayer/"+vidID+"/.swf"
			var params = {
					wmode: "transparent"
				};
			
			cee_vidWindow(vidSrc,vidSize,caption,params);
			
		}else if(url.match(/ifilm\.com\/video/i)){
			//play ifilm video in swf player

			var vidId = url.split('id=')[1].split('&')[0];
			var vidSrc = "http://www.ifilm.com/efp"
			var params = {
					wmode: "transparent",
					flashvars: {
						flvbaseclip: vidId+"&"
					}
				};
			
			cee_vidWindow(vidSrc,vidSize,caption,params);
			
		} else if (url.match(/vimeo\.com/i)){
			// play vimeo video in swf player

			var vidId = url.split('/')[3];
			var vidSrc = "http://www.vimeo.com/moogaloop.swf?clip_id="+vidId+"&server=vimeo.com&show_title=1&show_byline=1&show_portrait=0&color=&fullscreen=1";
			var params = {
					wmode: "transparent",
					allowFullScreen: "true",
					allowScriptAccess: "always",
					flashvars: {
						autoplay: 1
					}
				};
			
			cee_vidWindow(vidSrc,vidSize,caption,params);
		
		} else if (url.match(/dailymotion\.com/i)){
			// play dailymotion video in swf player

			var vidId = url.split('/')[4];
			var vidSrc = "http://www.dailymotion.com/swf/"+vidId+"&related=0&autoplay=1" ;		
			var params = {
					allowFullScreen: "true",
					allowScriptAccess: "always"
				};
			
			cee_vidWindow(vidSrc,vidSize,caption,params);
		
		}else if ((!url.match(/^http:+/) && (rel && !rel.match("iframe"))) || (rel && rel.match("ajax"))){
			//if indicated as ajax display as such; also, show relative path links as ajax unless indicated as iframe

			ajaxSize = [htmlSize[0],htmlSize[1] - 5];
			
			if($("#cee_window").css("display") != "block"){ //if window currently not displaying
				if(rel && rel.match("modal")){//modal ajax ceebox
					$("#cee_overlay").unbind();
					$("#cee_window").append("<div id='cee_ajaxContent' class='cee_modal' style='width:"+ajaxSize[0]+"px;height:"+ajaxSize[1]+"px;'></div>");	
					
				}else{//normal non-modal ajax
					$("#cee_window").append("<div id='cee_title'><div id='cee_ajaxWindowTitle'>"+caption+"</div><div id='cee_closeAjaxWindow'><a href='#' id='cee_closeWindowButton'>close</a> or Esc Key</div></div><div id='cee_ajaxContent' style='width:"+ajaxSize[0]+"px;height:"+ajaxSize[1]+"px'></div>");
				}
			}else{ //if the window is already up, we are just loading new content via ajax
				$("#cee_ajaxContent")[0].style.width = ajaxSize[0] +"px";
				$("#cee_ajaxContent")[0].style.height = ajaxSize[1] +"px";
				$("#cee_ajaxContent")[0].scrollTop = 0;
				$("#cee_ajaxWindowTitle").html(caption);
			}
			$("#cee_closeWindowButton").click(cee_remove);
			if (rel && rel.match(/#[a-z_A-Z1-9]+/)){ //if the user as supplied a id to target in the rel than use that
				targetId = rel.match(/#[a-z_A-Z1-9]+/);
				$("#cee_ajaxContent").load(url + " " + targetId);
			} else {
				$("#cee_ajaxContent").load(url);
			}
			
			cee_position(htmlSize[0]+30, htmlSize[1]+40);
			$("#cee_load").remove();
			cee_init("#cee_ajaxContent a.ceebox");
			$("#cee_window").css({display:"block"});
			document.onkeyup = function(e){ 	
				e = e || window.event;
						(e.keyCode == 27 || e.which == 27) ? cee_remove() : false ;
			};
			
		}else{
			//else show as iframe (catch-all)

			iframeSize = [htmlSize[0] + 29,htmlSize[1] + 12];
			
			$("#cee_iframeContent").remove();
			if (rel && rel.match("modal")) {//modal iframe ceebox
				$("#cee_overlay").unbind();
				$("#cee_window").append("<iframe frameborder='0' hspace='0' src='"+url+"' id='cee_iframeContent' name='cee_iframeContent"+Math.round(Math.random()*1000)+"' onload='cee_showIframe()' style='width:"+iframeSize[0]+"px;height:"+iframeSize[1]+"px;'> </iframe>");
			} else {//normal non-modal iframe ceebox (this is what it defaults to)
				$("#cee_window").append("<div id='cee_title'><div id='cee_ajaxWindowTitle'>"+caption+"</div><div id='cee_closeAjaxWindow'><a href='#' id='cee_closeWindowButton' title='Close'>close</a> or Esc Key</div></div><iframe frameborder='0' hspace='0' src='"+url+"' id='cee_iframeContent' name='cee_iframeContent"+Math.round(Math.random()*1000)+"' onload='cee_showIframe()' style='width:"+iframeSize[0]+"px;height:"+iframeSize[1]+"px;' > </iframe>");
			}
			$("#cee_closeWindowButton").click(cee_remove);
			cee_position(htmlSize[0]+30, htmlSize[1]+40);
			if($.browser.safari){//safari needs help because it will not fire iframe onload
				$("#cee_load").remove();
				$("#cee_window").css({display:"block"});
			}
			document.onkeyup = function(e){ 	
				e = e || window.event;
					(e.keyCode == 27 || e.which == 27) ? cee_remove() : false ;
			};
		}
		
	} catch(e) {
		//nothing here
	}
}

//helper functions below
function cee_showIframe(){
	$("#cee_load").remove();
	$("#cee_window").css({display:"block"});
}

function cee_remove() {
 	$("#cee_imageOff").unbind("click");
	$("#cee_closeWindowButton").unbind("click");
	$("#cee_window").fadeOut("fast",function(){$('#cee_window,#cee_overlay,#cee_HideSelect').unbind().trigger("unload").remove();});
	$("#cee_load").remove();
	if (typeof document.body.style.maxHeight == "undefined") {//if IE 6
		$("body","html").css({height: "auto", width: "auto"});
		$("html").css("overflow","");
	}
	document.onkeydown = null;
	document.onkeyup = null;
	return false;
}

function cee_position(w,h) {
$("#cee_window").css({marginLeft: '-' + parseInt((w / 2),10) + 'px', width: w + 'px'});
	if ( !(jQuery.browser.msie && jQuery.browser.version < 7)) { // take away IE6
		$("#cee_window").css({marginTop: '-' + parseInt((h / 2),10) + 'px'});
	}
}

function cee_getSize(rel,baseW,baseH){	
			//Base width and height set at top of ceebox.js; If base not set than it is 
			//To set width and height manually for the video use the rel attribute. I.E., rel="600 480"
			var pagesize = cee_getPageSize();
			
			(baseW)? baseW=baseW*1 : baseW=pagesize[0] - 150;
			(baseH)? baseH=baseH*1 : baseH=pagesize[1] - 150;
			var sizes=new Array();
			if (rel && rel.match(/[0-9]+/g)){
				sizes = rel.match(/[0-9]+/g);
				sizes[0] = (sizes[0]) ? sizes[0]*1 : baseW;
				sizes[1] = (sizes[1]) ? sizes[1]*1 : baseH;
			} else {
				sizes = [baseW,baseH];
			}
			return sizes;
}

function cee_vidWindow(u,s,c,p) {
	//create ceebox window for video
	$("#cee_window").append("<div id='cee_video'></div>" + "<div id='cee_caption'>"+c+"</div><div id='cee_closeWindow'><a href='#' id='cee_closeWindowButton' title='Close'>close</a> or Esc Key</div>"); 		
	$("#cee_closeWindowButton").click(cee_remove);
	cee_position(s[0] + 30,s[1] + 60);
	document.onkeyup = function(e){ 	
			e = e || window.event;
			(e.keyCode == 27 || e.which == 27) ? cee_remove() : false ;
	};
	//embed swfobject
	$('#cee_video').flash({
		swf: u,
		width: s[0],
		height: s[1],
		params: p
	});

	$("#cee_load").remove();
	$("#cee_window").css({display:"block"}); //for safari using css instead of show
}

function cee_getPageSize(){
	var de = document.documentElement;
	var w = window.innerWidth || self.innerWidth || (de&&de.clientWidth) || document.body.clientWidth;
	var h = window.innerHeight || self.innerHeight || (de&&de.clientHeight) || document.body.clientHeight;
	arrayPageSize = [w,h];
	return arrayPageSize;
}

function cee_detectMacXFF() {
  var userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.indexOf('mac') != -1 && userAgent.indexOf('firefox')!=-1) {
    return true;
  }
}