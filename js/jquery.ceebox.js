//ceebox
/*
 * CeeBox 2.0.0 alpha jQuery Plugin
 * Requires jQuery 1.3.2 and swfobject.jquery.js plugin to work
 * Code hosted on GitHub (http://github.com/catcubed/ceebox) Please visit there for version history information
 * By Colin Fahrion (http://www.catcubed.com)
 * Inspiration for ceebox comes from Thickbox (http://jquery.com/demo/thickbox/) and Videobox (http://videobox-lb.sourceforge.net/)
 * However, along the upgrade path ceebox has morphed a long way from those roots.
 * Copyright (c) 2009 Colin Fahrion
 * Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
*/

// To make ceebox work add $(".ceebox").ceebox(); to your global js file or if you don't have one just uncomment the following...
//$(document).ready(function(){ $(".ceebox").ceebox();});

/* OPTIONAL DEFAULT opts
  * You can also change the default sizes for html and/or video toa static size (if you set width, you must also set height)
  * Also, the animation speed and the color and opacity of the overlay can be changed.
  * Changing opts is done by adding parameters to the function like so: 
  * $(".ceebox").ceebox({vidWidth:600,vidHeight:400,htmlWidth:600,htmlHeight:400,animSpeed:"fast",overlayColor:"#f00",overlayOpacity:0.8});
*/ 

(function($) {
$.ceebox = {version:"2.0.0 alpha"};

$.fn.ceebox = function(opts){
	opts = $.extend({selector: $(this).selector},$.fn.ceebox.defaults, opts);

	$(this).each(function(i){
		$.ceebox(this,i,opts) //makes it all happen
	});
	return this;
}


//-----------------------------------publically accessible variables-------------------------------------------
$.fn.ceebox.defaults = {
	// all types of links are activated by default. You can turn them off separately by setting to false
	html:true,
	image:true,
	video:true,
	modal:false, //if set to true all ceebox links are modal
	// Default size opts
	// false = autosize to browser window
	// Numerical sizes are uses for maximums; if the browser is smaller it will scale to match the browser. You can set any or all of the opts.
	// common ratios are included "4:3", "3:2", "16:9" (as set in $.fn.ceebox.ratios), or ratio can also be set to a decimal amount (i.e., "3:2" is the same as 1.5)
	pageMargin: 100, //margin between ceebox content (not including ceebox border) and browser frame
	videoWidth: false, //set max size for all video links
	videoHeight: false, 
	videoRatio: "16:9",
	htmlWidth: false, //set max size for all html links
	htmlHeight: false,
	htmlRatio: false,
	imageWidth: false, //set max size for all image links (image ratio is determined by the image itself)
	imageHeight: false,
	animSpeed: "normal", // animation transition speed (can be set to "slow","normal","fast", or in milliseconds like 1000)
	overlayColor:"#000",
	overlayOpacity:0.8,
	border: "4px solid #525252", //the border on the ceebox
	onload:null, //callback function once ceebox popup is loaded. MUST BE A FUNCTION!
	backwardsCompatible: false // if set to true than parameters passed in the rel use the old 1.x system
}
//ratio shortcuts
$.fn.ceebox.ratios = {"4:3": 1.667, "3:2": 1.5, "16:9": 1.778,"1:1":1,"square":1};

//set up modal regex expressions; publically accessable so that ceebox can adjust to suit your needs.
//also allows for backwards compatible with ceebox 1.x by just adding $.fn.ceebox.defaults.backwardsCompatible = true; to your ready script
$.fn.ceebox.relMatch = {"width": /\bwidth:[0-9]+\b/i, "height": /\bheight:[0-9]+\b/i, "modal": /\bmodal:true|false\b/i};

//-------------------------------main function----------------------------------------------

$.ceebox = function(parent,parentId,opts) {
	opts = $.meta ? $.extend({}, opts, $(parent).data()) : opts; // meta plugin support (applied on parent element) NOT TESTED
	
	// 1. create set of ceebox active links from all links under selected dom element
	var family = $(parent).contents().andSelf().find("[href]");
	var cblinks = [], cbId = 0;
	family.each(function(alinkId){
		var alink = this;
		$.each(urlMatch, function(type) {
			if (urlMatch[type]($(alink).attr("href"),opts)) {	
				cblinks[cbId] = {alinkId:alinkId,type:type};
				cbId++;
				return false;
			}
		});
	});
	
	// 2. sort through ceebox links
	var cbLen = cblinks.length;
	$.each(cblinks, function(i){
		var cblink = family[cblinks[i].alinkId];
		
		var type = cblinks[i].type;
		opts = $.meta ? $.extend({}, opts, $(cblink).data()) : opts; // meta plugin support (applied on link element) NOT TESTED
		
		// 3. identify next/prev links for gallery functionality
		if (cbLen > 1) {
			var gallery = {parentId:parentId,cbId:i,cbLen:cbLen}
			if (i > 0) {
				gallery.prevId = cblinks[i-1].alinkId;
			};
			if (i < cbLen - 1) {
				gallery.nextId = cblinks[i+1].alinkId;
			}
			$.data(cblink,"ceebox",gallery);
		}
		
		// 4. bind click functionality
		$(cblink).bind("click", function(e){
			debug($(cblink).attr("href"));
			e.preventDefault();
			e.stopPropagation();
			$.fn.ceebox.overlay(); //create overlay sans content with loader
			if (type == "image") { // preload img to grab size
				var imgPreload = new Image();
				imgPreload.src = $(cblink).attr("href");
				imgPreload.onload = function(){
					var w = imgPreload.width,h=imgPreload.height;
					opts.imageWidth = getSmlr(w,opts.imageWidth);
					opts.imageHeight = getSmlr(h,opts.imageHeight);
					opts.imageRatio = w/h;
					$.fn.ceebox.popup(cblink,$.extend(opts,{type:type})); //build popup
				}
			} else $.fn.ceebox.popup(cblink,$.extend(opts,{type:type})); //build popup
		});
	});
}

//-------------------------------helper functions for main function----------------------------------------------

var urlMatch = {
	image: function(h,o) {return (o.image) && h.match(/\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$/i) || false},
	video: function(h,o) {return (o.video) && h.match(vidMatch) || false},
	html: function(h,o) {return (o.html)}
}

function getSmlr(a,b) {return (a && a < b) ? a : b;}

//---------------------------build prototype objects ----------------------------------

var baseSize = { //base size
	image: function(opts){this.width = opts.imageWidth;this.height = opts.imageHeight;this.ratio = opts.imageRatio;return this;},
	video: function(opts){this.width = opts.videoWidth;this.height = opts.videoHeight;this.ratio = opts.videoRatio;return this;},
	html: function(opts){this.width = opts.htmlWidth;this.height = opts.htmlHeight;this.ratio = opts.htmlRatio;return this;}
}

var baseAttr = function(cblink,opts) {//grab attrs from link; options from rel over write base options if available 
	this.rel =  $(cblink).attr("rel");this.href = $(cblink).attr("href");this.title = $(cblink).attr("title");
	this.content = "<div id='cee_title'><h2>"+this.title+"</h2></div>";
	this.margin = opts.pageMargin;
	
	//grab options form rel
	var rel = this.rel;
	if (rel && rel!= "") {
		//check for backwards compatiblity and set up for matches
		if (opts.backwardsCompatible) {var m = [rel.match(/\bmodal\b/i),rel.match(/\b[0-9]+\b/g),rel.match(/\bwidth:[0-9]+\b/g)]}
		else {var m = [String(rel.match($.fn.ceebox.relMatch.modal)),String(rel.match($.fn.ceebox.relMatch.width)),String(rel.match($.fn.ceebox.relMatch.height))]}
		
		if (m[0]) {
			(opts.backwardsCompatible) ? this.modal=true : this.modal=m[0].match(/true|false/i);
		}
		if (opts.backwardsCompatible) {
			if (m[1][0]) this.width = Number(r[1][0]);
			if (m[1][1]) this.height = Number(r[1][1]);
		} else {
			if (m[1]) this.width = Number(m[1].match(/[0-9]+\b/));
			if (m[2]) this.height = Number(m[2].match(/[0-9]+\b/));
		}
	}
	return this;
}

var box = function() {
	var p = pageSize(this.margin);
	w = getSmlr(this.width,p.width);
	h = getSmlr(this.height,p.height);
	r = this.ratio;
	if (r) { //if ratio value has been passed, adjust size to the ratio
		if (!Number(r)) {//check to see if it's a shortcut name rather than a number
			$.each($.fn.ceebox.ratios, function(i, val) {
				if (r == i) {r = val;return false;}
			});
			r = Number(r) || 1; //defaults to 1 if it doesn't convert to a number properly
		}
		//makes sure that it's smaller than the max width and height
		if (w/h > r) w = parseInt(h * r,10);
		if (w/h < r) h = parseInt(w / r,10);
	}
	this.width = w;
	this.height = h;
	return this;
}

var build = {
	image: function() {
		this.type = "image";
		this.content = "<img id='cee_img' src='"+this.href+"' width='"+this.width+"' height='"+this.height+"' alt='"+this.title+"'/>" + this.content;
		return this;
	},
	video: function() { 
		var vidType = cee_vidType(this.href,this.title,this.rel);
		//must directly declare variables for the swfobject to work properly
		var s = vidType.src;
		var p = vidType.params;
		var f = vidType.flashvars;
		var w = this.width;
		var h = this.height
		this.type = "video";
		this.action = function() {
			$('#cee_vid').flash({
				swf: s,
				params:p,
				flashvars: f,
				width: w,
				height: h
			});
		}
		this.content = "<div id='cee_vid' style='width:"+this.width+"px;height:"+this.height+"px'></div>" + this.content;
		return this;
		},
	html: function() {
		//test whether or not content is iframe or ajax
		var h = this.href,r = this.rel
		var m = [h.match(/\w+\.com/i),h.match(/^http:+/),(r) ? r.match(/^iframe/) : false]
		this.type = "html";
		if ((document.domain == m[0] && m[1] && !m[2]) || (!m[1] && !m[2])) { //if linked to same domain and not iframe than it's an ajax link
			var ajx = h;
			if (h.match(/#[a-z_A-Z1-9]+/)){ //if there is an id on the link
				var ajx = ajx + " " + h.match(/#[a-z_A-Z1-9]+/)
			}
			this.action = function(){ $("#cee_ajax").load(ajx);}
			this.content = this.content + "<div id='cee_ajax' style='width:"+(this.width-30)+"px;height:"+(this.height-20)+"px'></div>"
		} else {
			$("#cee_iframe").remove();
			this.content = this.content + "<iframe frameborder='0' hspace='0' src='"+h+"' id='cee_iframeContent' name='cee_iframeContent"+Math.round(Math.random()*1000)+"'  style='width:"+(this.width)+"px;height:"+(this.height)+"px;' > </iframe>";
			
		}
		return this;
	}
}

var pageSize = function(margin){
	var de = document.documentElement;
	margin = margin || 100;
	this.width = (window.innerWidth || self.innerWidth || (de&&de.clientWidth) || document.body.clientWidth) - margin;
	this.height = (window.innerHeight || self.innerHeight || (de&&de.clientHeight) || document.body.clientHeight) - margin;
	this.ratio = this.width / this.height;
	return this;
}

//------------------------Overlay function (makes the blank popup and loader) -------------------------------
// this function is called ahead of time so the loader is there, but it does not have to be called as the ceebox.popup script also runs this

$.fn.ceebox.overlay = function(opts) {
	opts = $.extend({//adds a few basic opts then merges in the defaults
		width: 60,
		height: 30,
		type: "html"
	}, $.fn.ceebox.defaults, opts);
	
	var borderWidth = Number((opts.border.match(/[0-9]+/g)[0])) || 0;
	//debug(opts,"overlay")
	//Browser fixes
	if($.browser.opera){
		//hack to make opera display flash movie correctly
		if ($("#lameoperahack") === null) $("body").append("<span style='line-height:0px;color:rgba(0,0,0,0)' id='lameoperahack'>-</span>");
	}
	if (typeof document.body.style.maxHeight === "undefined") {//IE 6 positioning is special... and I mean that in the most demeaning way possible
		if ($("#cee_HideSelect") === null) {
			$("body").append("<iframe id='cb.HideSelect'></iframe>");
		}
		var ceeboxPos = "absolute";
		var scrollPos = document.documentElement && document.documentElement.scrollTop || document.body.scrollTop;
		var marginTop = parseInt(-1*(opts.height / 2 - scrollPos + borderWidth),10) ;
	} else {
		var ceeboxPos = "fixed";
		var marginTop = parseInt(-1*(opts.height / 2 + borderWidth),10);
	}
	var marginLeft = parseInt(-1*(opts.width / 2 + borderWidth),10);
	
	//Creates overlay unless one already exists
	if ($("#cee_overlay").size() == 0){
		$("<div id='cee_overlay'></div>")
			.css({
				 opacity : opts.overlayOpacity,
				 position: "absolute",
				 top: 0,
				 left: 0,
				 backgroundColor: opts.overlayColor,
				 width: "100%",
				 height: $(document).height(),
				 zIndex: 100
			})
			.appendTo($("body"));
	};
	//Creates popup box unless one already exists
	if ($("#cee_box").size() == 0){ //if cb.ox does not exist create one.
		$("<div id='cee_box'></div>")
			.addClass("cee_" + opts.type)
			.css({
				position: ceeboxPos,
				zIndex: 102,
				top: "50%",
				left: "50%",
				height: opts.height + "px",
				width: opts.width + "px",
				marginLeft: marginLeft + 'px',
				marginTop: marginTop + 'px',
				opacity:0,
				border:opts.border
			})
			.appendTo("body")
			.animate({
				height: opts.height + "px",
				width: opts.width + "px",
				opacity:1
			},opts.animSpeed);
		$("<div id='cee_load'></div>")
		.css({
			 zIndex: 105,
				top: "50%",
				left: "50%",
				position:"fixed"
			 })
		.appendTo("body").show("fast");
	} else {
		$("#cee_box").removeClass().addClass("cee_" + opts.type);//changes class if it has changed
	}
	this.top = marginTop;
	this.left = marginLeft;
	return this;
}

//------------------------Popup function (adds content to popup and animates) -------------------------------
$.fn.ceebox.popup = function(content,opts) { //creates ceebox popup
	opts = $.extend({
		width: pageSize(100).width,
		height: pageSize(100).height,
		modal:false,
		type: "iframe",
		onload:null
	}, $.fn.ceebox.defaults, opts);
	
	if ($(content).is("a")) {//build ceebox content via prototype objects
		var gallery = $.data(content,"ceebox");
		baseAttr.prototype = new baseSize[opts.type](opts);
		box.prototype = new baseAttr(content,opts);
		build[opts.type].prototype = new box();
		var cb = new build[opts.type];
		content = cb.content;
		opts.width = cb.width + 30;
		opts.height = cb.height + 60;
		opts.action = cb.action;
		opts.modal = cb.modal;
		
	}
	//Creates overlay and small ceebox to page unless one already exists and also grabs margins
	var margin = $.fn.ceebox.overlay(opts);
	// animate ceebox opening and fade in content (also serves as gallery transition animation).
	$("#cee_box")
		.css("background-image","none")
		.animate({
			marginLeft: margin.left,
			marginTop: margin.top,
			height: opts.height + "px",
			width: opts.width + "px"
		},opts.animSpeed,function(){
			$(this).append(content).children().fadeIn("fast")
			//check to see if it's modal and add close buttons if not;
			if (opts.modal=="true") {
				$("#cee_overlay").unbind();
			} else {
				$("#cee_title").prepend("<a href='#' id='cee_closeBtn' title='Close'>close</a>");
				$("#cee_closeBtn, #cee_overlay").click(function(e){removeCeebox();return false;});
				if (gallery) addGallery(gallery,opts);
				keyEvents();
			};
			
			$("#cee_load").hide("normal").animate({opacity:0},"slow");
			if (isFunction(opts.action)) opts.action();//ceebox specific actions (load movie or ajax)
			if (isFunction(opts.onload)) opts.onload();//optional onload callback
		});

	$(".cee_close").live("click",function(e){e.preventDefault();removeCeebox()}); // make all current and future close buttons work.
	
	
	
}

//---------------------------general single purpose functions----------------------------------

function removeCeebox() {
	$("#cee_closeBtn").unbind("click");
	$("#cee_box").fadeOut("fast",function(){$('#cee_box,#cee_overlay,#cee_HideSelect').unbind().trigger("unload").remove();});
	$("#cee_load").remove();
	document.onkeydown = null;
	document.onkeyup = null;
	return false;
}

function isNumber(a) {typeof a == 'number' && isFinite(a)}

function isObject(a) {
return (typeof a == 'object' && a) || isFunction(a);
}
function isFunction(a) {
return typeof a == 'function';
}

function debug(a,tag) {
	if (window.console && window.console.log) {
		var header = "[ceebox](" + (tag||"")  + ")"
		var bugs
		if($.isArray(a) || isObject(a)) {
			$.each(a, function(i, val) {
				bugs = bugs +i + ":" + val + ", ";
			});
		} else {bugs = a}
		window.console.log(header + bugs);
	//window.console.log('[ceebox] ' + Array.prototype.join.call(arguments,' ') + " (" + a + ")");
	//$('body').append('<div class="debugconsole">'+Array.prototype.join.call(arguments,' ')+'</div>');
		
	}
}

//----------------------------video type matching function (may rewrite this)----------------------------------------//
// regex match string for all supported video player formats and generic swf
	var vidMatch = /youtube\.com\/watch|metacafe\.com\/watch|google\.com\/videoplay|ifilm\.com\/video|vimeo\.com|dailymotion\.com|facebook\.com\/video|\.swf$/i
	// Helper function for video; detects which player it is and returns the src and params
	function cee_vidType(h,t,r) {
		// h = href
		var site = String(String(h.match(/\w+\.com/i)).match(/\w+/i));
		var s,p,f // s = src, p = params
		p = {wmode: "transparent",allowFullScreen: "true",allowScriptAccess: "always"}
		f = {autoplay: true}
		s = String(h.match(/http:\/\/[a-zA-Z\.]+\.com/))
		switch (site) {
			case "facebook": 
				s = s + "/v/"+h.split('v=')[1].split('&')[0];
				p = $.extend({movie:s},p);
				break;
			case "youtube":
				s = s + "/v/"+h.split('v=')[1].split('&')[0]+"&hl=en&fs=1&autoplay=1";
				break;
			case "metacafe":
				s = s + "/fplayer/"+h.split('id=')[1].split('&')[0]+"/.swf";
				break;
			case "google":
				s = s + "/googleplayer.swf?docId="+h.split('id=')[1].split('&')[0]+"&hl=en";
				f = $.extend({playerMode: "normal",fs: true},f);
				break;
			case "ifilm":
				s = s + "/efp";
				f = $.extend({flvbaseclip: h.split('id=')[1].split('&')[0]+"&"});
				break;
			case "vimeo":
				s = s + "/moogaloop.swf?clip_id="+h.split('/')[3]+"&server=vimeo.com&show_title=1&show_byline=1&show_portrait=0&color=&fullscreen=1";
				break;
			case "dailymotion":
				s = s + "/swf/"+h.split('/')[4]+"&related=0&autoplay=1";
				break;
			default:
				s = h; // used for .swf files
				break;
		}
		this.src = s;
		this.params = p;
		this.flashvars = f;
		return this;
	}
	
	function keyEvents() {
		document.onkeydown = function(e){ 	
			e = e || window.event;
			var kc = e.keyCode || e.which;
			switch (kc) {
				case 27:
					removeCeebox();
					break;
				case 188:
				case 37:
					//if ($("#cee_prev").size() != 0) {imgNav($cb.rev.t,$cb.rev.attr("href"),$cb.rev.attr("rel"),umbrella);};
					break;
				case 190:
				case 39:
					//if ($("#cee_next").size() != 0) {imgNav($cb.ext.t,$cb.ext.attr("href"),$cb.ext.attr("rel"),umbrella);};
					break;
			}
		};
	}
	
	function addGallery(g,opts){
		debug(g,"gallery");debug(opts.selector)
		var parentId,cbId,cbLen,prevId,nextId;
		var family = $(opts.selector).eq(g.parentId).contents().andSelf().find("[href]")
		var px = "px"
		var gCount = "<div id='cee_count'>Item " + (g.cbId + 1) +" of "+ g.cbLen + "</div>";
		var navW = parseInt(opts.width / 2);
		var navH = opts.height-60;
		var navTop = 0;
		var navBgTop = navH/2;
		
		if (opts.type == "video" || opts.type == "html") {
			navW = 60;
			navH = 80;
			navTop = parseInt((opts.height-60) / 2);
			navBgTop = 24;
		}
		
		$navLink = $("<a href='#'></a>").css({width:navW + px, height:navH + px,position:"absolute",top:navTop})
		if (g.prevId != null) {
			$navLink
				.clone()
				.text("Prev")
				.attr("id","cee_prev")
				.css({left:"0px",backgroundPosition:"left " + (navBgTop-2000) + px})
				.hover(
					function(){$(this).css({backgroundPosition:"left " + navBgTop + px})},
					function(){$(this).css({backgroundPosition:"left " + (navBgTop-2000) + px})}
				)
				.bind("click",function(e){
					e.preventDefault();
					$("#cee_box").children().remove();
					family.eq(g.prevId).trigger("click");
				})
				.appendTo("#cee_box");
		}
		if (g.nextId) {
			$navLink
				.clone()
				.text("Next")
				.attr("id","cee_next")
				.css({right:"0px",backgroundPosition:"right " + (navBgTop-2000) + px})
				.hover(
					function(){$(this).css({backgroundPosition:"right " + navBgTop + px})},
					function(){$(this).css({backgroundPosition:"right " + (navBgTop-2000) + px})}
				)
				.bind("click",function(e){
					e.preventDefault();
					$("#cee_box").children().remove();
					family.eq(g.nextId).trigger("click");
				})
				.appendTo("#cee_box");
		}
		
		$("#cee_title").append(gCount);
	}

})(jQuery);