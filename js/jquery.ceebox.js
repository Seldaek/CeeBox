//ceebox
/*
 * Ceebox 1.4.3 jQuery Plugin
 * Requires jQuery 1.3.2 and swfobject.jquery.js plugin to work
 * Code hosted on GitHub (http://github.com/catcubed/CeeBox) Please visit there for version history information
 * By Colin Fahrion (http://www.catcubed.com)
 * Inspiration for CeeBox comes from Thickbox (http://jquery.com/demo/thickbox/) and Videobox (http://videobox-lb.sourceforge.net/)
 * However, along the upgrade path CeeBox has morphed a long way from those roots.
 * Copyright (c) 2009 Colin Fahrion
 * Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
*/

// To make ceebox work add $(".ceebox").ceebox(); to your global js file or if you don't have one just uncomment the following...
//$(document).ready(function(){ $(".ceebox").ceebox();});

/* OPTIONAL DEFAULT SETTINGS
  * You can also change the default sizes for html and/or video toa static size (if you set width, you must also set height)
  * Also, the animation speed and the color and opacity of the overlay can be changed.
  * Changing settings is done by adding parameters to the function like so: 
  * $(".ceebox").ceebox({vidWidth:600,vidHeight:400,htmlWidth:600,htmlHeight:400,animSpeed:"fast",overlayColor:"#f00",overlayOpacity:0.8});
*/ 

(function($) {
	$.ceebox = {version:"1.4.3"};
	$.fn.ceebox = function(settings){
		settings = jQuery.extend({
			// default size settings are set to false which automatically sizes for the browser window
			vidWidth: false,
			vidHeight: false,
			htmlWidth: false,
			htmlHeight: false,
			animSpeed: "normal",
			overlayColor:"#000",
			overlayOpacity:0.8
		}, settings);
		
		$(this).each(function(){
			if ($(this).is("a") || $(this).is("area") || $(this).is("input")) {
				
				$(this).bind('click',function(e){
					e.preventDefault();
					$.ceebox.show(this.title || this.name || this.t || "", this.href || this.alt, this.rel || false);
					$(this).blur();
				});
			}
			return this;
		});
		
		//---------------- CeeBox detector and launcher function -----------------------
		
		$.ceebox.show = function(t,h,r){// detects the type of link and launches the appropriete type of ceebox popup
			// t = title (used for caption), h = href, r = rel (used for params)
			var urlTest = [
				{
					"url" : true, //catch all throws it in an iframe
					"act" : function(){$.ceebox.iframe(t,h,r)}
				},
				{
					"url" : (!h.match(/^http:+/) && (r && !r.match("iframe"))) || (r && r.match("ajax")) || false,
					"act" : function(){$.ceebox.ajax(t,h,r)}
				},
				{
					"url" : h.match(vidMatch) || false,
					"act" : function(){$.ceebox.video(t,h,r)}
				},
				{
					"url" : h.match(/\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$/i) || false,
					"act" : function(){$.ceebox.image(t,h,r)}
				}
			];
			var i = urlTest.length;
			do {
				if (urlTest[i-1]["url"]){urlTest[i-1].act(); break};
			} while (--i);
		}
		
		//---------------- iFrame popup function -----------------------
		
		$.ceebox.iframe = function(t,h,r) { // creates an ifreame popup
			var htmlSize = cee_htmlSize(r);
			var iframeSize = [htmlSize[0] + 29,htmlSize[1] + 12];
			$("#cee_iframe").remove();
			var append = "<div id='cee_title'><h2>"+t+"</h2></div><iframe frameborder='0' hspace='0' src='"+h+"' id='cee_iframeContent' name='cee_iframeContent"+Math.round(Math.random()*1000)+"'  style='width:"+iframeSize[0]+"px;height:"+iframeSize[1]+"px;' > </iframe>";
			$.ceebox.append(append,htmlSize[0]+30,htmlSize[1]+40,r,"cee_iframe");
		}
		
		//---------------- AJAX popup function -----------------------
		
		$.ceebox.ajax = function(t,h,r) {
		// t = title for window, h = href, r = rel
		//if indicated as ajax display as such; also, show relative path links as ajax unless indicated as iframe
			var htmlSize = cee_htmlSize(r);
			var ajaxSize = [htmlSize[0],htmlSize[1] - 5];
			
			if($("#cee_box").css("display") != "block"){ //if window currently not displaying
				$.ceebox.append("<div id='cee_title'><h2>"+t+"</h2></div><div id='cee_ajax' style='width:"+ajaxSize[0]+"px;height:"+ajaxSize[1]+"px'></div>",htmlSize[0]+30,htmlSize[1]+40,r,"cee_ajax");
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
		
			$("#cee_ajax a.ceebox").ceebox(); //adds ceebox functionality to any ceebox links within the ajax box
		}
		
		//---------------- Video popup function -----------------------
		
		$.ceebox.video = function(t,h,r) { // creates an embeded video popup
			
			//detect video type and get src and params
			var vidType = cee_vidType(t,h,r);
			var vidSize = (!settings.vidWidth || !settings.vidHeight) ? cee_getSize(r) : [settings.vidWidth,settings.vidHeight];
			//create ceebox window for video
			$.ceebox.append("<div id='cee_vid'></div>" + "<div id='cee_title'><h2>"+t+"</h2></div>",vidSize[0] + 30,vidSize[1] + 60,r,"cee_vid");
			//embed swfobject
			$('#cee_vid').flash({
				swf: vidType.src,
				params: vidType.params,
				width: vidSize[0],
				height: vidSize[1]
			});
		}
		
		//---------------- Video popup helper functions -----------------------
		// to add additional video formats you must add the url to the regex match string and a case to the switch function.
		
		// regex match string for all supported video player formats and generic swf
		var vidMatch = /youtube\.com\/watch|metacafe\.com\/watch|google\.com\/videoplay|ifilm\.com\/video|vimeo\.com|dailymotion\.com|facebook\.com\/video|\.swf$/i
		// Helper function for video; detects which player it is and returns the src and params
		function cee_vidType(t,h,r) {
			// h = href
			
			var domain = String(h.match(/\w+\.com/i));
			var baseUrl = "http://www." + domain
			var s,p // s = src, p = params
			switch (domain) {
				case "facebook.com": 
					s = baseUrl + "/v/"+h.split('v=')[1].split('&')[0];
					p = {wmode: "transparent",movie: s,allowFullScreen: "true",allowScriptAccess: "always",flashvars: {autoplay: true}};
					break;
				case "youtube.com":
					s = baseUrl + "/v/"+h.split('v=')[1].split('&')[0]+"&hl=en&fs=1&autoplay=1";
					p = {wmode: "transparent",allowFullScreen: "true",allowScriptAccess: "always"};
					break;
				case "metacafe.com":
					s = baseUrl + "/fplayer/"+h.split('id=')[1].split('&')[0]+"/.swf";
					p = {wmode: "transparent"};
					break;
				case "google.com":
					s = "http://video.google.com/googleplayer.swf?docId="+h.split('id=')[1].split('&')[0]+"&hl=en";
					p = {wmode: "transparent",allowFullScreen: "true",allowScriptAccess: "always",flashvars: {autoplay: true,playerMode: "normal",fs: true}};
					break;
				case "ifilm.com":
					s = baseUrl + "/efp";
					p = {wmode: "transparent",flashvars: {flvbaseclip: h.split('id=')[1].split('&')[0]+"&"}};
					break;
				case "vimeo.com":
					s = baseUrl + "/moogaloop.swf?clip_id="+h.split('/')[3]+"&server=vimeo.com&show_title=1&show_byline=1&show_portrait=0&color=&fullscreen=1";
					p = {wmode: "transparent",allowFullScreen: "true",allowScriptAccess: "always"};
					break;
				case "dailymotion.com":
					s = baseUrl + "/swf/"+h.split('/')[4]+"&related=0&autoplay=1";
					p = {allowFullScreen: "true",allowScriptAccess: "always"};
					break;
				default:
					s = h; // used for .swf files
					p = {wmode: "transparent",allowFullScreen: "true",allowScriptAccess: "always"};
					break;
			}
			return {src:s,params:p};
		}
		
		//---------------- Image Gallery popup function -----------------------
		
		$.ceebox.image = function(t,h,r) {
		// t = title for window, h = href, r = rel
		//Display images in box

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
				
				$.ceebox.append("<img id='cee_img' src='"+h+"' width='"+imgW+"' height='"+imgH+"' alt='"+t+"'/>" + "<div id='cee_title'><h2>"+t+"</h2></div>",imgW + 30,imgH + 60,r,"cee_img");
				
				if (r) {imgGal(t,h,r,imgW,imgH);} //set up gallery if there is one

			}; //end imgPreloader function
			
			imgPreloader.src = h;
		};
		
		//---------------- Image Gallery Helper functions -----------------------
		
		function imgNav(t,h,r) {
			document.onkeydown = null;
			$("#cee_box").empty();
			$.ceebox.image(t,h,r);
			return false;
		}
		
		function imgGal(t,h,r,imgW,imgH){
			var g = $("a[rel="+r+"]").get();
			var gLength = g.length;
			if (gLength > 1) {
				var navW = imgW+30;
				var $ceeNav = $("<div id='cee_nav'></div>").css({width:navW,height:imgH});
				var i = gLength;
				do { //find current image
					if (g[i-1].href == h) {var gImg = i;break;};
				} while (--i);
				var gCount = "<div id='cee_count'>Image " + (i) +" of "+ (gLength) + "</div>";
				if (gImg > 1) {
					$ceePrev = $("<a href='#' id='cee_prev'>Previous</a>")
					$ceePrev.t = g[gImg-2].title;
					$ceePrev
						.bind("click",function(e){e.preventDefault();imgNav($ceePrev.t, $ceePrev.attr("href"), r);})
						.appendTo($ceeNav)
						.attr({href:g[gImg-2].href});
				}
				if (gImg < gLength) {
					$ceeNext = $("<a href='#' id='cee_next'>Next</a>")
					$ceeNext.t = g[gImg].title;
					$ceeNext
						.bind("click",function(e){e.preventDefault();imgNav($ceeNext.t, $ceeNext.attr("href"), r);})
						.appendTo($ceeNav)
						.attr({href:g[gImg].href});
				}
			}
			$("#cee_title").prepend($ceeNav).append(gCount);
		}
		
		//---------------- Overlay & Box Creator -----------------------
		
		$.ceebox.append = function (content,width,height,r,type) { //creates ceebox popup
			//r = rel (used to test for modal param), type (used as added class)
			$("<div id='cee_load'></div>").appendTo("body").show;//add loader to the page
			
			//Browser fixes
			if($.browser.opera){
				//hack to make opera display flash movie correctly
				$("body").append("<span style='line-height:0px;color:rgba(0,0,0,0)' rel='lame opera hack'>-</span>");
			}
			if (typeof document.body.style.maxHeight === "undefined") {//IE 6 positioning is special... and I mean that in the most demeaning way possible
				if ($("#cee_HideSelect") === null) {
					$("body").append("<iframe id='cee_HideSelect'></iframe>");
				}
				var ceeboxPos = "absolute";
				var scrollPos = document.documentElement && document.documentElement.scrollTop || document.body.scrollTop;
				var marginTop = parseInt(-1*(height / 2 - scrollPos),10) + 'px';
			} else {
				var ceeboxPos = "fixed";
				var marginTop = parseInt(-1*(height / 2),10) + 'px';
			}
			var marginLeft = parseInt(-1*(width / 2),10) + "px";
			//Creates Overlay and Boxes
			
			//Creates overlay unless one already exists
			if ($("#cee_overlay").size() == 0){
				$("<div id='cee_overlay'></div>")
					.css({
						 opacity : settings.overlayOpacity,
						 position: "absolute",
						 top: 0,
						 left: 0,
						 backgroundColor: settings.overlayColor,
						 width: "100%",
						 height: $(document).height(),
						 zIndex: 100
				  	})
					.appendTo($("body"));
			};
			//Creates popup box unless one already exists
			if ($("#cee_box").size() == 0){ //if ceebox does not exist create one.
				$("<div id='cee_box'></div>")
					.addClass(type)
					.css({
						position: ceeboxPos,
						zIndex: 102,
						top: "50%",
						left: "50%"
					})
					.appendTo("body")
			} 
			// animate ceebox opening and fade in content (also serves as gallery transition animation).
			$("#cee_box")
				.animate({
					marginLeft: marginLeft,
					marginTop: marginTop,
					height: height + "px",
					width: width + "px"
				},settings.animSpeed,function(){$('#cee_box').children().fadeIn("fast")})
				.append(content).children().hide();
			
			//check to see if it's modal and add close buttons if not
			if (r && r.match("modal")) {
				$("#cee_overlay").unbind();
			} else {
				$("#cee_title").prepend("<a href='#' id='cee_closeBtn' title='Close'>close</a>");
				$("#cee_closeBtn").click(cee_remove);
				$("#cee_overlay").click(cee_remove);
			};
			$(".cee_close").live("click",function(e){e.preventDefault();cee_remove()}); // make all current and future close buttons work.
			
			$("#cee_load").hide();
			cee_keyEvents(r);
		}
		
		//---------------- Various Helper Functions -----------------------
		
		function cee_htmlSize(r) {
			return (!settings.htmlWidth || !settings.htmlHeight) ? cee_getSize(r) : [settings.htmlWidth,settings.htmlHeight];
		}
		
		function cee_getSize(r){	
				// r = rel
				//Base width and height set with settings; If base not set than it is sized to the window
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
		
		function cee_remove() {
			$("#cee_closeBtn").unbind("click");
			$("#cee_box").fadeOut("fast",function(){$('#cee_box,#cee_overlay,#cee_HideSelect').unbind().trigger("unload").remove();});
			$("#cee_load").remove();
			document.onkeydown = null;
			document.onkeyup = null;
			return false;
		}
		
		function cee_keyEvents(r) {
			document.onkeydown = function(e){ 	
				e = e || window.event;
				var kc = e.keyCode || e.which;
				switch (kc) {
					case 27:
						cee_remove();
						break;
					case 188:
					case 37:
						if ($("#cee_prev").size() != 0) {imgNav($ceePrev.t,$ceePrev.attr("href"),r);};
						break;
					case 190:
					case 39:
						if ($("#cee_next").size() != 0) {imgNav($ceeNext.t,$ceeNext.attr("href"),r);};
						break;
				}
			};
		}
	}
})(jQuery);