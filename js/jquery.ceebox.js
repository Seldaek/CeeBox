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

$.ceebox = {version:"2.0.0 alpha"};

$.fn.ceebox = function(settings){
	settings = jQuery.extend({
//Turn off ceebox for certian types of links
		htmlLinks:true,
		imageLinks:true,
		videoLinks:true,
		// Default size settings
		// false = autosize to browser window
		// Numerical sizes are uses for maximums; if the browser is smaller it will scale to match the browser. You can set any or all of the settings.
		// If ratio is set it overrides either width or height depending on the ratio (images ratios are set by the image itself)
		vidWidth: false,
		vidHeight: false,
		vidRatio: "16:9", //common ratios are included "4:3", "3:2", "16:9", or the parameter can also be set to a decimal amount (i.e., "3:2" is the same as 1.5)
		htmlWidth: false,
		htmlHeight: false,
		htmlRatio: false,
		imgWidth: false,
		imgHeight: false,
		animSpeed: "normal", // animation transition speed (can be set to "slow","normal","fast", or in milliseconds like 1000)
		overlayColor:"#000",
		overlayOpacity:0.8
	}, settings);
	

	$(this).each(function(e) {
		$.data(this,"ceebox", $(this).contents().andSelf().find("[href]")); //stores array of links under the this as a data item
	}); 
	
	$(this).live("click", function(e){
		var $this = $(this);
		var $tgt = $(e.target).closest("[href]");
		var group = $.data(this,"ceebox");
		
		if ($tgt.is("[href]")) {
			cee.h = $tgt.attr("href");
			cee.t = $tgt.attr("title");
			cee.r = $tgt.attr("rel");
			
			$.each(cee.urlMatch, function(i, val) {
				if (cee.urlMatch[i]()) {
					e.preventDefault();
					e.stopPropagation();
					cee.obj = $this;
					cee.tgt = $tgt;
					cee.init(i);
					$.fn.ceebox.popup(cee.build[i](),{width:cee.width,height:cee.height,modal:cee.modal,class:cee.type});
					return false;
				}
			});
		}
	});
	
	var cee = {
		obj: null, // parent object
		tgt: null, // clicked target link
		h: "", //href
		t: "", //title
		r: "", //rel
		type:"",
		modal:false,
		width: null,
		height: null,
		ratio: null,
		init: function(type){
			$.extend(cee,util.boxSize(type));
			settings = $.meta ? $.extend({}, settings, cee.obj.data()) : settings; // meta plugin support (applied on parent element)
			settings = $.meta ? $.extend({}, settings, cee.tgt.data()) : settings; // meta plugin support (applied on target element)
		},
		urlMatch : {
			image: function() {return (settings.imageLinks) && cee.h.match(/\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$/i) || false},
			video: function() {return (settings.videoLinks) && cee.h.match(vidMatch) || false},
			ajax: function() {return ((!settings.htmlLinks) || cee.r.match("iframe")) || (!cee.h.match(/^http:+/) || (document.domain == cee.h.match(/\w+\.com/i))) || false},
			iframe: function() {return (settings.htmlLinks)}
		},
		build: {
			image: function() { 
				
				tester(["build:image",cee.width,cee.height]);
			},
			video: function() { tester("build:video")},
			ajax: function() { tester("build:ajax")},
			iframe: function() {
				$("#cee_iframe").remove();
				return content = "<div id='cee_title'><h2>"+cee.t+"</h2></div><iframe frameborder='0' hspace='0' src='"+cee.h+"' id='cee_iframeContent' name='cee_iframeContent"+Math.round(Math.random()*1000)+"'  style='width:"+(cee.width)+"px;height:"+(cee.height)+"px;' > </iframe>";
				$.fn.ceebox.popup(content);
			}
		}
	}
	
	var util = {
		maxSize: {
			page: function(){
				var de = document.documentElement;
				this.width = window.innerWidth || self.innerWidth || (de&&de.clientWidth) || document.body.clientWidth;
				this.height = window.innerHeight || self.innerHeight || (de&&de.clientHeight) || document.body.clientHeight;
				this.ratio = this.width / this.height
				return this;
			},
			image: function(){this.width = settings.imgWidth;this.height = settings.imgHeight;return this;},
			video: function(){this.width = settings.vidWidth;this.height = settings.vidHeight;this.ratio = settings.vidRatio;return this;},
			ajax: function(){this.width = settings.htmlWidth;this.height = settings.htmlHeight;this.ratio = settings.htmlRatio;return this;},
			iframe: function(){this.width = settings.htmlWidth;this.height = settings.htmlHeight;this.ratio = settings.htmlRatio;return this;}
		},
		boxSize: function(type){
			$.extend(this,util.maxSize[type]());
			var w = util.maxSize.page().width - 150, h = util.maxSize.page().height - 150, r = util.maxSize.page().ratio;
			
			w = (this.width && this.width < w)? this.width : w; // set to max sizes for type if set
			h = (this.height && this.height < h) ? this.height : h;
			
			if (cee.r.match(/^[0-9]+/g)){ // if there is a size in the the rel use that instead
				var s = cee.r.match(/^[0-9]+/g);
				w = (s[0] && s[0]*1 < w) ? s[0]*1 : w;
				h = (s[1] && s[1]*1 < h) ? s[1]*1 : h;
			}
			
			if (this.ratio) { //if there is a ratio adjust size to the ratio
				if (!util.isNumber(this.ratio)) { 
					switch(this.ratio) {
						case "4:3": this.ratio = 1.667; break;
						case "3:2": this.ratio = 1.5; break;
						case "16:9": this.ratio = 1.778; break;
						default : this.ratio = 1;
					}
				}
				if (this.ratio > r ) {h = width / this.ratio};
				if (this.ratio < r ) {w = height * this.ratio};
			}
			this.width = w;
			this.height = h;
			this.type = type;
			return this;
		},
		isNumber: function(a) {typeof a == 'number' && isFinite(a)},
		debug: function(a) {
			if (window.console && window.console.log)
			window.console.log('[ceebox] ' + Array.prototype.join.call(arguments,' ') + " (" + a + ")");
			//$('body').append('<div class="debugconsole">'+Array.prototype.join.call(arguments,' ')+'</div>');
		},
		
	}
	
	$.fn.ceebox.popup = function(content,opts) { //creates ceebox popup
		opts = jQuery.extend({
//Turn off ceebox for certian types of links
			width: util.maxSize.page().width - 150,
			height: util.maxSize.page().height - 150,
			modal:false,
			class: ""
		}, opts);
		
		$("<div id='cee_load'></div>").appendTo("body").show;//add loader to the page
		util.debug(cee.width);
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
			var marginTop = parseInt(-1*(opts.height / 2 - scrollPos),10) + 'px';
		} else {
			var ceeboxPos = "fixed";
			var marginTop = parseInt(-1*(opts.height / 2),10) + 'px';
		}
		var marginLeft = parseInt(-1*(opts.width / 2),10) + "px";
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
				.addClass(opts.class)
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
				height: opts.height + "px",
				width: opts.width + "px"
			},settings.animSpeed,function(){$('#cee_box').children().fadeIn("fast")})
			.append(content).children().hide();
		
		//check to see if it's modal and add close buttons if not
		if (cee.r && cee.r.match(/^modal/i) || cee.modal == true) {
			$("#cee_overlay").unbind();
		} else {
			$("#cee_title").prepend("<a href='#' id='cee_closeBtn' title='Close'>close</a>");
			$("#cee_closeBtn").click(cee_remove);
			$("#cee_overlay").click(cee_remove);
		};
		$(".cee_close").live("click",function(e){e.preventDefault();cee_remove()}); // make all current and future close buttons work.
		
		$("#cee_load").hide();
		//cee_keyEvents(r,umbrella || false);
	}
	
	//-----------------------------END OF REWRITE---------------------------------------------------------------
	
	//-----------------------------END OF TEST FUNCTIONS--------------------------------------------
	
		function getSize(r,maxW,maxH,ratio){
			// r = rel
			
			var wnd = windowSize(); // base size set by browser dimensions
			var width=wnd[0] - 150;
			var height=wnd[1] - 150;

			width = (maxW && maxW < width)? maxW : width; // set to max width if set
			height = (maxH && maxH < height) ? maxH : height; // set to max width if set
			
			if (r && r.match(/^[0-9]+/g)){ // if there is a size in the the rel use that instead
				var s = r.match(/^[0-9]+/g);
				width = (s[0] && s[0]*1 < width) ? s[0]*1 : width;
				height = (s[1] && s[1]*1 < height) ? s[1]*1 : height;
			}
			
			if (ratio) { //if there is a ratio adjust size to the ratio
				if (!isNumber(ratio)) { 
					switch(ratio) {
						case "4:3": ratio = 1.667; break;
						case "3:2": ratio = 1.5; break;
						case "16:9": ratio = 1.778; break;
						default : ratio = 1;
					}
				}
				
				var maxRatio = width / height;
				if (ratio > maxRatio ) {height = width / ratio};
				if (ratio < maxRatio ) {width = height * ratio};
			}
			
			return [width,height];
	}
	
	
	
	function ceeIframe($tgt) {
		return "iframe";
	}
	function ceeAjax($tgt) {
		return "ajax";
	}
	function ceeVideo($tgt) {
		var h = $tgt.attr("href");
		var t = $tgt.attr("title");
		var imgPreloader = new Image();
		content = "<img id='cee_img' src='"+h+"'/>"
		return content;
	}
	function ceeImage($tgt) {
		var h = $tgt.attr("href");
		var t = $tgt.attr("title");
		var r = $tgt.attr("rel");
		var imgPreloader = new Image();
		imgPreloader.src = h;
		imgPreloader.onload = function(){
			imgPreloader.onload = null;

			var maxW = (imgPreloader.width < settings.imgWidth) ? settings.imgWidth : imgPreloader.width;
			var maxH = (imgPreloader.height < settings.imgHeight) ? settings.imgHeight : imgPreloader.height;
			var ratio = imgPreloader.width / imgPreloader.height;
			var imgSize = getSize(r,maxW,maxH,ratio);
			
			var html = "<img id='cee_img' width='"+imgSize[0]+"' height='"+imgSize[1]+"' src='"+h+"'/>";
			$.ceebox.popup(html,{width:imgSize[0]+30,height:imgSize[1]+60})
		}
	}
	
	
	

	
	function windowSize(){
		var de = document.documentElement;
		var w = window.innerWidth || self.innerWidth || (de&&de.clientWidth) || document.body.clientWidth;
		var h = window.innerHeight || self.innerHeight || (de&&de.clientHeight) || document.body.clientHeight;
		return [w,h];
	}
	
	function isNumber(a) {
		return typeof a == 'number' && isFinite(a);
	}
	
	function cee_remove() {
		$("#cee_closeBtn").unbind("click");
		$("#cee_box").fadeOut("fast",function(){$('#cee_box,#cee_overlay,#cee_HideSelect').unbind().trigger("unload").remove();});
		$("#cee_load").remove();
		document.onkeydown = null;
		document.onkeyup = null;
		return false;
	}
	
	return this;
	
}
	/* hide all functions that have not been rewritten
	
	function linkData($this){
		var links = $this.contents().andSelf().find("[href]");
		tester([$(links[0]).attr("href"),$(links[0]).attr("class"),$(links[0]).attr("rel"),$(links[0]).attr("title")]);
		var len = links.length, i = 0, data;
		if (len > 1) {
			while (i < len) {
				links[0]
				if (i < 0) data = {next:$(links[i+1]).attr("href"),nextRel:$(links[i+1]).attr("rel"),nextClass:$(links[i+1]).attr("class"),nextClass:$(links[i+1]).attr("class")};
				if (i > len-1) data = {prev:links[i-1].attr("href"),prevRel:links[i-1].attr("rel"),prevClass:links[i-1].attr("class")};
				$.data(links[i],"ceebox",data);
				i++;
			}
		}
	}
	
	function oldlivecee(e){ //adds click functionality to all links
		e.preventDefault;
		var group = $(this).contents().andSelf().find("[href]");
		
		

		if ($tgt.attr("href")) {$.ceebox.show($tgt.attr("title") || $tgt.t || $tgt.attr("alt") || "",$tgt.attr("href"),$tgt.attr("rel") || false,group,e);}

		return this;
	};

	function findLoc(group,href){
		var i = 0;
		var l = group.length;
		while (i <= l) {
			var tempHref = $(group[i]).attr("href")
			if (href == tempHref) {return i;};
			i++;
		}
	}
	//---------------- CeeBox detector and launcher function -----------------------

	$.ceebox.show = function(t,h,r,group,e){// detects the type of link and launches the appropriete type of ceebox popup
		// t = title (used for caption), h = href, r = rel (used for params), group = array of link group (used for galleries), e = event (used for preventing event).
		
		if ((settings.imageLinks) && h.match(/\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$/i)) {
			e.preventDefault;
			$.ceebox.image(t,h,r,group);
		} else if ((settings.videoLinks) && h.match(vidMatch)) {
			e.preventDefault;
			$.ceebox.video(t,h,r);
		} else if (settings.htmlLinks) {
			if ((settings.htmlLinks) && (!h.match(/^http:+/) && (r && !r.match("iframe"))) || (settings.htmlLinks) && (r && r.match("ajax"))){
				e.preventDefault;
				$.ceebox.ajax(t,h,r)
			} else {
				e.preventDefault;
				$.ceebox.iframe(t,h,r)
			}
		}
	}
	
	//---------------- iFrame popup function -----------------------
	
	$.ceebox.iframe = function(t,h,r) { // creates an ifreame popup
		var htmlSize = cee_getSize(r,settings.htmlSize.width,settings.htmlSize.height,settings.htmlSize.ratio);
		var iframeSize = [htmlSize[0] + 29,htmlSize[1] + 12];
		$("#cee_iframe").remove();
		var append = "<div id='cee_title'><h2>"+t+"</h2></div><iframe frameborder='0' hspace='0' src='"+h+"' id='cee_iframeContent' name='cee_iframeContent"+Math.round(Math.random()*1000)+"'  style='width:"+iframeSize[0]+"px;height:"+iframeSize[1]+"px;' > </iframe>";
		$.ceebox.append(append,htmlSize[0]+30,htmlSize[1]+40,r,"cee_iframe");
	}
	
	//---------------- AJAX popup function -----------------------
	
	$.ceebox.ajax = function(t,h,r) {
	// t = title for window, h = href, r = rel
	//if indicated as ajax display as such; also, show relative path links as ajax unless indicated as iframe
		var htmlSize = cee_getSize(r,settings.htmlSize.width,settings.htmlSize.height,settings.htmlSize.ratio);
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
		var vidSize = cee_getSize(r,settings.videoSize.width,settings.videoSize.height,settings.videoSize.ratio);
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
	*/
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
	
	/*
	//---------------- Image Gallery popup function -----------------------
	
	$.ceebox.image = function(t,h,r,group) {
	// t = title for window, h = href, r = rel
	//Display images in box
		
		var imgPreloader = new Image();
		imgPreloader.onload = function(){
			imgPreloader.onload = null;

			var maxW = (imgPreloader.width < settings.imageSize.width) ? settings.imageSize.width : imgPreloader.width;
			var maxH = (imgPreloader.height < settings.imageSize.height) ? settings.imageSize.height : imgPreloader.height;
			var ratio = imgPreloader.width / imgPreloader.height;
			var imageSize = cee_getSize(r,maxW,maxH,ratio);
			
			$.ceebox.append("<img id='cee_img' src='"+h+"' width='"+imageSize[0]+"' height='"+imageSize[1]+"' alt='"+t+"'/>" + "<div id='cee_title'><h2>"+t+"</h2></div>",imageSize[0] + 30,imageSize[1] + 60,r,"cee_img",group);
			
			//set up gallery if there are image links contained in same ceebox group
			if (umbrella) {
				// creates array of all ceebox image links under the umbrella for gallery functionality
				var imgLinks = $(umbrella).contents().andSelf().find("[href]").filter(function(){return $(this).attr("href").match(/\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$/i) ;});
				var i = 0;
				var l = imgLinks.length;
				while (i <= l) {
					if (h == imgLinks[i]) {var imgLoc=i;};
					i++;
				}
			
				if (imgLinks.length > 1){
					imgGal(imgLinks,imgLoc,imageSize[0],imageSize[1],group);
				}
			}
			
		}; //end imgPreloader function
		tester(group);
		imgPreloader.src = h;
	};
	
	//---------------- Image Gallery Helper functions -----------------------
	
	function imgNav(t,h,r,umbrella) {
		document.onkeydown = null;
		$("#cee_box").empty();
		$.ceebox.image(t,h,r,umbrella || false);
		return false;
	}
	
	function imgGal(imgLinks,loc,imgW,imgH,umbrella){
		var gArray = imgLinks;
		var imgNum = loc;
		var gLength = gArray.length;
		var navW = imgW+30;
		var $ceeNav = $("<div id='cee_nav'></div>").css({width:navW,height:imgH});
		var gCount = "<div id='cee_count'>Image " + (imgNum + 1) +" of "+ gLength + "</div>";
		if (imgNum > 0) {
			$ceePrev = $("<a href='#' id='cee_prev'>Previous</a>")
			$ceePrev.t = gArray[imgNum-1].title || gArray[imgNum-1].alt;
			$ceePrev
				.bind("click",function(e){e.preventDefault();imgNav($ceePrev.t, $ceePrev.attr("href"), $ceePrev.attr("rel"),umbrella);})
				.appendTo($ceeNav)
				.attr({href:gArray[imgNum-1].href,rel:gArray[imgNum-1].rel});
		}
		if (imgNum < gLength-1) {
			$ceeNext = $("<a href='#' id='cee_next'>Next</a>");
			$ceeNext.t = gArray[imgNum+1].title || gArray[imgNum+1].alt;
			$ceeNext
				.bind("click",function(e){e.preventDefault();imgNav($ceeNext.t, $ceeNext.attr("href"), $ceeNext.attr("rel"),umbrella);})
				.appendTo($ceeNav)
				.attr({href:gArray[imgNum+1].href,rel:gArray[imgNum+1].rel});
		}
		$("#cee_title").prepend($ceeNav).append(gCount);
	}
	
	function ceeArrayLocator(h){// finds where link is in the $ceelinks array
		var i = 0;
		while (i <= $ceeArrayLength - 1) {
			var ii = 0;
			var l = $ceeArray[i].length;
			while (ii <= l) {
				if (h == $ceeArray[i][ii]) {return [i,ii];};
				ii++;
			}
			i++;
		}
	}
	
	//---------------- Overlay & Box Creator -----------------------
	
	$.ceebox.append = function (content,width,height,r,type,umbrella) { //creates ceebox popup
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
		cee_keyEvents(r,umbrella || false);
	}
	
	//---------------- Various Helper Functions -----------------------
	
	
	function cee_getSize(r,maxW,maxH,ratio){	
			// r = rel
			
			var pg = cee_getPageSize(); // base size set by browser dimensions
			var width=pg[0] - 150;
			var height=pg[1] - 150;

			width = (maxW && maxW < width)? maxW : width; // set to max width if set
			height = (maxH && maxH < height) ? maxH : height; // set to max width if set
			
			if (r && r.match(/^[0-9]+/g)){ // if there is a size in the the rel use that instead
				var s = r.match(/^[0-9]+/g);
				width = (s[0] && s[0]*1 < width) ? s[0]*1 : width;
				height = (s[1] && s[1]*1 < height) ? s[1]*1 : height;
			}
			
			if (ratio) { //if there is a ratio adjust size to the ratio
				if (!isNumber(ratio)) { 
					switch(ratio) {
						case "4:3": ratio = 1.667; break;
						case "3:2": ratio = 1.5; break;
						case "16:9": ratio = 1.778; break;
						default : ratio = 1;
					}
				}
				
				var maxRatio = width / height;
				if (ratio > maxRatio ) {height = width / ratio};
				if (ratio < maxRatio ) {width = height * ratio};
			}
			
			return [width,height];
	}
	
	function cee_scale (width,height,maxW,maxH){ //scales down to size based on max width/height
		if (width > maxW) {
			width = maxW;
			height = height * (maxW / width);
		};
		if (hieght > maxH) {
			width = width * (maxH/hieght);
			hieght = maxH;
		};
	}
	
	function windowSize(){
		var de = document.documentElement;
		var w = window.innerWidth || self.innerWidth || (de&&de.clientWidth) || document.body.clientWidth;
		var h = window.innerHeight || self.innerHeight || (de&&de.clientHeight) || document.body.clientHeight;
		return [w,h];
	}
	
	function cee_remove() {
		$("#cee_closeBtn").unbind("click");
		$("#cee_box").fadeOut("fast",function(){$('#cee_box,#cee_overlay,#cee_HideSelect').unbind().trigger("unload").remove();});
		$("#cee_load").remove();
		document.onkeydown = null;
		document.onkeyup = null;
		return false;
	}
	
	function cee_keyEvents(r,umbrella) {
		document.onkeydown = function(e){ 	
			e = e || window.event;
			var kc = e.keyCode || e.which;
			switch (kc) {
				case 27:
					cee_remove();
					break;
				case 188:
				case 37:
					if ($("#cee_prev").size() != 0) {imgNav($ceePrev.t,$ceePrev.attr("href"),$ceePrev.attr("rel"),umbrella);};
					break;
				case 190:
				case 39:
					if ($("#cee_next").size() != 0) {imgNav($ceeNext.t,$ceeNext.attr("href"),$ceeNext.attr("rel"),umbrella);};
					break;
			}
		};
	}
	
	function isNumber(a) {
		return typeof a == 'number' && isFinite(a);
	}
	*/
	// ---------------------Tester fucntions ( need to remove) ----------------------------------
	function tester(stuff) {
		var i=0;
		var test="";
		if ($.isArray(stuff)) {
			while (i<stuff.length) {
				test = test + stuff[i] + " | ";
				i=i+1;
			}
		} else { test = stuff + " | ";}
		$("#test").append(test)
	}
	
	function testCeeLinks() { //remove me after done testing
		var i = 0;
		while (i <= $ceelinksLength - 1) {
			var ii = 0;
			var gallerLen = $ceelinks[i].length;
			while (ii <= gallerLen -1) {
				tester([i,ii,$($ceelinks[i][ii]).attr("href")]);
				ii++;
			}
			i++;
		}
	}
	/*
}*/
})(jQuery);