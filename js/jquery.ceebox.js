//ceebox
/*
 * Ceebox jQuery Plugin 1.3.5 - Minimized via YUI compressor (branched from CeeBox 1.3.4 which was not a plugin)
 * Requires jQuery 1.3.2 and swfobject.jquery.js plugin to work
 * Code hosted on GitHub (http://github.com/catcubed/CeeBox) Please visit there for version history information
 * By Colin Fahrion (http://www.catcubed.com)
 * Inspiration for CeeBox comes from Thickbox (http://jquery.com/demo/thickbox/) and Videobox (http://videobox-lb.sourceforge.net/)
 * However, along the upgrade path CeeBox has morphed a long way from those roots.
 * Copyright (c) 2009 Colin Fahrion
 * Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
*/

// To make ceebox work add $(".ceebox").ceebox(); to your global js file or if you don't have one just uncomment the following...
$(document).ready(function(){ $(".ceebox").ceebox();});

/* OPTIONAL DEFAULT SETTINGS
  * You can also change the default sizes for html and/or video like so:
  * $(".ceebox").ceebox({vidWidth:600,vidHeight:400,htmlWidth:600,htmlHeight:400});
  * Note, both width and height must be set.
*/ 

(function($) {
	$.ceebox = {version:"1.3.5"};
	$.fn.ceebox = function(settings){
		settings = jQuery.extend({
			// default size settings are set to false which automatically sizes for the browser window
			vidWidth: false,
			vidHeight: false,
			htmlWidth: false,
			htmlHeight: false
		}, settings);
		
		$(this).each(function(){
			if ($(this).is("a") || $(this).is("area") || $(this).is("input")) {
				
				$(this).bind('click',function(){
					$.ceebox.show(this.title || this.name || this.t || "", this.href || this.alt, this.rel || false);
					$(this).blur();
					return false;
				});
			}
		});
		
		$.ceebox.show = function(t,h,r){
			// t = title for window, h = href, r = rel
			//Browser fixes
			if (typeof document.body.style.maxHeight === "undefined") {//if IE 6
				$("html").css("overflow","hidden");
				if ($("#cee_HideSelect") === null) {$("body").append("<iframe id='cee_HideSelect'></iframe>");}
			}
			if($.browser.opera){
				$("body").append("<span style='line-height:0px;color:rgba(0,0,0,0)' rel='lame opera hack'>-</span>");
			}
			
			//create overlay and boxes
			box = document.createElement('div');
			overlay = document.createElement('div');
			cee_closeBtn = "<a href='#' id='cee_closeBtn' title='Close'>close</a>"
			$(overlay).attr('id','cee_overlay');
			$(box).attr('id','cee_box');
			(cee_detectMacXFF()) ? $(overlay).addClass("cee_overlayMacFFBGHack") : $(overlay).addClass("cee_overlayBG");
			$("body").append("<div id='cee_load'></div>");//add loader to the page
			$('#cee_load').show();//show loader
			
			// Url Matching
			var baseURL = (h.indexOf("?")!==-1) ? h.substr(0, h.indexOf("?")) : h; //grab query string if there is one
			
			urlString = /\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$|\.swf$|\.htm$|\.html$|\.asp$|\.aspx$/;
			var urlType = baseURL.toLowerCase().match(urlString);
			
			// set size of module window for video or html
			var vidSize = (!settings.vidWidth || !settings.vidHeight) ? cee_getSize(r) : [settings.vidWidth,settings.vidHeight];
			var htmlSize = (!settings.htmlWidth || !settings.htmlHeight) ? cee_getSize(r) : [settings.htmlWidth,settings.htmlHeight];
			
			var urlTest = [
				[(!h.match(/^http:+/) && (r && !r.match("iframe"))) || (r && r.match("ajax")) || false, "ajax"],
				[urlType == '.jpg' || urlType == '.jpeg' || urlType == '.png' || urlType == '.gif' || urlType == '.bmp' || false, "image"],
				[h.match(/youtube\.com\/watch/i) || false, "youtube"],
				[h.match(/metacafe\.com\/watch/i) || false, "metacafe"],
				[h.match(/google\.com\/videoplay/i) || false, "google"],
				[h.match(/ifilm\.com\/video/i) || false, "ifilm"],
				[h.match(/vimeo\.com/i) || false, "vimeo"],
				[h.match(/dailymotion\.com/i) || false, "dailymotion"],
				[h.match(/facebook\.com\/video/i) || false, "facebook"]
			]
	
			var i = urlTest.length;
			var urlMatch;
			do {
				if (urlTest[i-1][0]){var urlMatch = urlTest[i-1][1]; break};
			} while (--i);
			switch (urlMatch) {
				case "image":
					cee_imagegal(t,h,r);
					break;
				case "facebook":
					var src = "http://www.facebook.com/v/"+h.split('v=')[1].split('&')[0];
					var params = {wmode: "transparent",movie: src,allowFullScreen: "true",allowScriptAccess: "always",flashvars: {autoplay: true}};
					cee_vidWindow(src,vidSize,t,params);
					break;
				case "youtube":
					var src = "http://www.youtube.com/v/"+h.split('v=')[1].split('&')[0]+"&hl=en&fs=1&autoplay=1";
					var params = {wmode: "transparent",allowFullScreen: "true",allowScriptAccess: "always"};
					cee_vidWindow(src,vidSize,t,params);
					break;
				case "metacafe":
					var src = "http://www.metacafe.com/fplayer/"+h.split('id=')[1].split('&')[0]+"/.swf";
					var params = {wmode: "transparent"};
					cee_vidWindow(src,vidSize,t,params);
					break;
				case "google":
					src = "http://video.google.com/googleplayer.swf?docId="+h.split('id=')[1].split('&')[0]+"&hl=en";
					params = {wmode: "transparent",allowFullScreen: "true",allowScriptAccess: "always",flashvars: {autoplay: true,playerMode: "normal",fs: true}};
					cee_vidWindow(src,vidSize,t,params);
					break;
				case "ifilm":
					src = "http://www.ifilm.com/efp";
					params = {wmode: "transparent",flashvars: {flvbaseclip: h.split('id=')[1].split('&')[0]+"&"}};
					cee_vidWindow(src,vidSize,t,params);
					break;
				case "vimeo":
					src = "http://www.vimeo.com/moogaloop.swf?clip_id="+h.split('/')[3]+"&server=vimeo.com&show_title=1&show_byline=1&show_portrait=0&color=&fullscreen=1";
					params = {wmode: "transparent",allowFullScreen: "true",allowScriptAccess: "always"};
					cee_vidWindow(src,vidSize,t,params);
					break;
				case "dailymotion":
					src = "http://www.dailymotion.com/swf/"+h.split('/')[4]+"&related=0&autoplay=1";
					params = {allowFullScreen: "true",allowScriptAccess: "always"};
					cee_vidWindow(src,vidSize,t,params);
				case "ajax":
					cee_ajaxWindow(t,h,r,htmlSize);
					break;
				default:
					cee_iframeWindow(t,h,r,htmlSize);	
			}
			
		}
		// end of ceebox.show
		//various functions
		function cee_detectMacXFF() {
			var userAgent = navigator.userAgent.toLowerCase();
			if (userAgent.indexOf('mac') != -1 && userAgent.indexOf('firefox')!=-1) {return true;}
		}
		
		function cee_getSize(r){	
				// r = rel
				//Base width and height set at top of ceebox.js; If base not set than it is 
				//To set width and height manually for the video use the rel attribute. I.E., rel="600 480"
				var pg = cee_getPageSize();
				
				var w=pg[0] - 150;
				var h=pg[1] - 150;
				var s=new Array();
				if (r && r.match(/[0-9]+/g)){
					var s = r.match(/[0-9]+/g);
					s[0] = (s[0]) ? s[0]*1 : w;
					s[1] = (s[1]) ? s[1]*1 : h;
				} else {
					s = [w,h];
				}
				return s;
		}
		
		function cee_getPageSize(){
			var de = document.documentElement;
			var w = window.innerWidth || self.innerWidth || (de&&de.clientWidth) || document.body.clientWidth;
			var h = window.innerHeight || self.innerHeight || (de&&de.clientHeight) || document.body.clientHeight;
			var pg = [w,h];
			return pg;
		}
		
		function cee_imagegal(t,h,r) {
		// t = title for window, h = href, r = rel
		//Display images in box
	
			// check to see if this is a gallery and set up next/prev buttons
			if (r) {
				var g = $("a[rel="+r+"]").get();
				var gLength = g.length;
				var i = gLength;
				var gNext="",gPrev=""
				do {
					if (g[i-1].href == h) {var gImg = i;break;};
				} while (--i);
				var gCount = "Image " + (i) +" of "+ (gLength);
				if (gImg > 1) {
					var gPrev = "<a href='#' id='cee_prev'>Previous</a>";
				}
				if (gImg < gLength) {
					var gNext = "<a href='#' id='cee_next'>Next</a>";
				}
				
			} else {var gCount = ""; var gPrev = ""; var gNext = "";}
		
			var imgPreloader = new Image();
			imgPreloader.onload = function(){
				imgPreloader.onload = null;
					
				// Resizing large images
				var pg = cee_getPageSize();
				var x = pg[0] - 150;
				var y = pg[1] - 150;
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
				var navW = imgW+30;
				cee_append("<img id='cee_img' src='"+h+"' width='"+imgW+"' height='"+imgH+"' alt='"+t+"'/>" + "<div id='cee_nav' style='width:" + navW + "px;height:"+ imgH +"px'>" + gPrev + gNext + "</div><div id='cee_cap'>"+t+"<div id='cee_count'>" + gCount + "</div></div>" + cee_closeBtn,imgW + 30,imgH + 60);
		
				if (gPrev != "") {
					function goPrev(){
						document.onkeydown = null;
						if($(document).unbind("click",goPrev)){$(document).unbind("click",goPrev);}
						$("#cee_box").remove();
						$.ceebox.show(g[gImg-2].title, g[gImg-2].href, r);
						return false;
					}
					$("#cee_prev").click(goPrev);
				}
				if (gNext != "") {
					function goNext(){
						document.onkeydown = null;
						$("#cee_box").remove();
						$.ceebox.show(g[gImg].title, g[gImg].href, r);				
						return false;
					}
					$("#cee_next").click(goNext);
				}
				
				
				document.onkeydown = function(e){ 	
					e = e || window.event;
					var kc = e.keyCode || e.which;
					if(kc == 27){ // close
						cee_remove();
					} else if (kc == 190 || kc == 39){ // display next image
						if (gNext != "") {goNext()};
					} else if(kc == 188 || kc == 37){ // display prev image
						if (gPrev != "") {goPrev()};
					}
				};
			}; //end imgPreloader function
			
			imgPreloader.src = h;
		};
		
		function cee_ajaxWindow(t,h,r,htmlSize) {
		// t = title for window, h = href, r = rel
		//if indicated as ajax display as such; also, show relative path links as ajax unless indicated as iframe
	
			var ajaxSize = [htmlSize[0],htmlSize[1] - 5];
			
			if($("#cee_box").css("display") != "block"){ //if window currently not displaying
				if(r && r.match("modal")){//modal ajax ceebox
					$("#cee_overlay").unbind();
					cee_append("<div id='cee_ajax' class='cee_modal' style='width:"+ajaxSize[0]+"px;height:"+ajaxSize[1]+"px;'></div>",htmlSize[0]+30,htmlSize[1]+40);	
					
				}else{//normal non-modal ajax
					cee_append("<div id='cee_title'><div id='cee_ajaxTitle'>"+t+"</div>" + cee_closeBtn + "</div><div id='cee_ajax' style='width:"+ajaxSize[0]+"px;height:"+ajaxSize[1]+"px'></div>",htmlSize[0]+30,htmlSize[1]+40);
				}
			}else{ //if the window is already up, we are just loading new content via ajax
				$("#cee_ajaxContent")[0].style.width = ajaxSize[0] +"px";
				$("#cee_ajaxContent")[0].style.height = ajaxSize[1] +"px";
				$("#cee_ajaxContent")[0].scrollTop = 0;
				$("#cee_ajaxWindowTitle").html(caption);
			}
			
			if (r && r.match(/#[a-z_A-Z1-9]+/)){ //if the user as supplied a id to target in the rel than use that
				targetId = r.match(/#[a-z_A-Z1-9]+/);
				$("#cee_ajax").load(h + " " + targetId);
			} else {
				$("#cee_ajax").load(h);
			}
		
			$("#cee_ajax a.ceebox").ceebox();
			cee_keyEvents();
					
		}
		
		function cee_iframeWindow(t,h,r,htmlSize) {
			// t = title for window, h = href, r = rel
			//else show as iframe (catch-all)
		
			var iframeSize = [htmlSize[0] + 29,htmlSize[1] + 12];
			
			$("#cee_iframe").remove();
			if (r && r.match("modal")) {//modal iframe ceebox
				$("#cee_overlay").unbind();
				var append = "<iframe frameborder='0' hspace='0' src='"+h+"' id='cee_iframe' name='cee_iframe"+Math.round(Math.random()*1000)+"' onload='$.ceebox.showIframe()' style='width:"+iframeSize[0]+"px;height:"+iframeSize[1]+"px;'> </iframe>"
			} else {//normal non-modal iframe ceebox (this is what it defaults to)
				var append = "<div id='cee_title'><div id='cee_ajaxTitle'>"+t+"</div>" + cee_closeBtn + "</div><iframe frameborder='0' hspace='0' src='"+h+"' id='cee_iframeContent' name='cee_iframeContent"+Math.round(Math.random()*1000)+"' onload='$.ceebox.showIframe()' style='width:"+iframeSize[0]+"px;height:"+iframeSize[1]+"px;' > </iframe>";
			}
			
			cee_append(append,htmlSize[0]+30,htmlSize[1]+40);
		
			cee_keyEvents();
		}
		
		$.ceebox.showIframe = function(){
			$("#cee_load").remove();
			$("#cee_window").css({display:"block"});
		}
		
		function cee_remove() {
			$("#cee_imgBtn").unbind("click");
			$("#cee_closeBtn").unbind("click");
			$("#cee_box").fadeOut("fast",function(){$('#cee_box,#cee_overlay,#cee_HideSelect').unbind().trigger("unload").remove();});
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
			$("#cee_box").css({marginLeft: '-' + parseInt((w / 2),10) + 'px', width: w + 'px'});
			if ( !(jQuery.browser.msie && jQuery.browser.version < 7)) { // take away IE6
				$("#cee_box").css({marginTop: '-' + parseInt((h / 2),10) + 'px'});
			}
		}
		
		function cee_vidWindow(u,s,t,p) {
			// u = src url, s = size array, t = title, p = params
			//create ceebox window for video
			cee_append("<div id='cee_vid'></div>" + "<div id='cee_cap'>"+t+"</div>" + cee_closeBtn,s[0] + 30,s[1] + 60);
			cee_keyEvents();
			//embed swfobject
			$('#cee_vid').flash({
				swf: u,
				width: s[0],
				height: s[1],
				params: p
			});
		
		}
		
		function cee_keyEvents() {
			document.onkeyup = function(e){ 	
				e = e || window.event;
				(e.keyCode == 27 || e.which == 27) ? cee_remove() : false ;
			};
		}
		
		function cee_append (c,w,h) {
			//c = content, w = width, h = height
			if ($('#cee_overlay').size() == 0){$(overlay).appendTo($("body")).click(cee_remove)}
			$(box).appendTo("body").append(c);
			
			$("#cee_closeBtn").click(cee_remove);
			cee_position(w,h);
			$("#cee_load").remove();
			$("#cee_box").css({display:"block"});
		}

	}
})(jQuery);