//ceebox
/*
 * CeeBox 2.0.2 jQuery Plugin
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
  * You can change many of the default options
  * $(".ceebox").ceebox({vidWidth:600,vidHeight:400,htmlWidth:600,htmlHeight:400,animSpeed:"fast",overlayColor:"#f00",overlayOpacity:0.8});
*/ 

(function($) {
$.ceebox = {version:"2.0.2"};

//--------------------------- CEEBOX FUNCTION -------------------------------------
$.fn.ceebox = function(opts){
	opts = $.extend({selector: $(this).selector},$.fn.ceebox.defaults, opts);
	
	$(this).each(function(i){
		$.ceebox(this,i,opts) //makes it all happen
	});
	return this;
}


//--------------------------- PUBLIC GLOBAL VARIABLES -------------------------------------------
$.fn.ceebox.defaults = {
	// all types of links are activated by default. You can turn them off separately by setting to false
	html:true,
	image:true,
	video:true,
	modal:false, //if set to true all ceebox links are modal (unless you set modal:false in the rel);
	// Default size opts
	// false = autosize to browser window
	// Numerical sizes are uses for maximums; if the browser is smaller it will scale to match the browser. You can set any or all of the opts.
	// common ratios are included "4:3", "3:2", "16:9" (as set in $.fn.ceebox.ratios), or ratio can also be set to a decimal amount (i.e., "3:2" is the same as 1.5)
	htmlGallery:true,
	imageGallery:true,
	videoGallery:true,
	videoWidth: false, //set max size for all video links
	videoHeight: false, 
	videoRatio: "16:9",
	htmlWidth: false, //set max size for all html links
	htmlHeight: false,
	htmlRatio: false,
	imageWidth: false, //set max size for all image links (image ratio is determined by the image itself)
	imageHeight: false,
	//ceebox display settings
	animSpeed: "normal", // animation resize transition speed (can be set to "slow","normal","fast", or in milliseconds like 1000)
	easing: "swing", // supports use of the easing plugin for resize anim (http://gsgd.co.uk/sandbox/jquery/easing/)
	fadeOut: 400, //speed that ceebox fades out when closed or advancing through galleries
	fadeIn: 400, //speed that ceebox fades in when opened or advancing through galleries
	overlayColor:"#000",
	overlayOpacity:0.8,
	boxColor:"", //background color for ceebox. Normally set in CSS but this overrides. Useful in with metadata plugin for changing colors on per link basis
	borderColor:"", //border color. Normally set in CSS
	borderWidth: "3px 3px 3px 3px", //the border on ceebox (color and style controled in css)
	padding: 15, //ceebox padding
	margin: 150, //margin between ceebox content and browser frame
	
	//misc settings
	onload:null //callback function once ceebox popup is loaded. MUST BE A FUNCTION!
}
// ratio shortcuts
$.fn.ceebox.ratios = {"4:3": 1.667, "3:2": 1.5, "16:9": 1.778,"1:1":1,"square":1};

// set up modal regex expressions; publically accessable so that ceebox can adjust to suit your needs.
$.fn.ceebox.relMatch = {"width": /\bwidth:[0-9]+\b/i, "height": /\bheight:[0-9]+\b/i, "modal": /\bmodal:true|false\b/i};

// html for loader anim div
$.fn.ceebox.loader = "<div id='cee_load' style='z-index:105;top:50%;left:50%;position:fixed'></div>"

//--------------------------- MAIN INIT FUNCTION ----------------------------------------------

$.ceebox = function(parent,parentId,opts) {
	
	// private function variables
	var family,cblinks = [], cbId = 0;
	
	// 1. if dom element is a link use that otherwise find any and all links under selected dom element
	($(parent).is("a[href],area[href],input[href]")) ? family = $(parent) : family = $(parent).children().andSelf().find("a[href],area[href],input[href]");
	
	// 2. url match functions
	var urlMatch = {
		image: function(h,o) {return (o.image) && h.match(/\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$/i) || false},
		video: function(h,o) {return (o.video) && h.match(vidMatch) || false},
		html: function(h,o) {return (o.html)}
	}
	
	// 3. sort links by type
	family.each(function(alinkId){
		var alink = this;
		var linkOpts = $.metadata ? $.extend({}, opts, $(alink).metadata()) : opts; // meta plugin support (applied on link element)
		
		$.each(urlMatch, function(type) {
			if (urlMatch[type]($(alink).attr("href"),linkOpts)) {	
				var cblink = alink;
				
				// 2. set up array of gallery links
				if (opts.htmlGallery == true && type == "html") {
					cblinks[cbId] = alinkId;
					cbId++;
				}
				if (opts.imageGallery == true && type == "image") {
					cblinks[cbId] = alinkId;
					cbId++;
				}
				if (opts.videoGallery == true && type == "video") {
					cblinks[cbId] = alinkId;
					cbId++;
				}
				
				// 3. unbind any preexisting click conditions; then bind ceebox click functionality
				$(cblink).unbind("click").bind("click", function(e){
					e.preventDefault();
					e.stopPropagation();
					
					// 3a. create overlay sans content with loader
					$.fn.ceebox.overlay(linkOpts);
					// 3b. if image then preload to get size before calling popup function
					if (type == "image") { 
						var imgPreload = new Image();
						imgPreload.onload = function(){
							var w = imgPreload.width,h=imgPreload.height;
							//set image max sizes to so that image doesn't scale larger
							linkOpts.imageWidth = getSmlr(w,$.fn.ceebox.defaults.imageWidth);
							linkOpts.imageHeight = getSmlr(h,$.fn.ceebox.defaults.imageHeight);
							linkOpts.imageRatio = w/h;
							$.fn.ceebox.popup(cblink,$.extend(linkOpts,{type:type})); //build popup
						}
						imgPreload.src = $(cblink).attr("href");
					} else $.fn.ceebox.popup(cblink,$.extend(linkOpts,{type:type})); //build popup
				});
				return false;
			}
		});
	});
	
	// 4. store ids of next/prev links for gallery functionality
	var cbLen = cblinks.length;
	$.each(cblinks, function(i){
		var cblink = family[cblinks[i]];
		
		if (cbLen > 1) {
			var gallery = {parentId:parentId,cbId:i,cbLen:cbLen}
			if (i > 0) gallery.prevId = cblinks[i-1];
			if (i < cbLen - 1) gallery.nextId = cblinks[i+1];
			$.data(cblink,"ceebox",gallery);
		}
	});
}

//--------------------------- PUBLIC FUNCTIONS ---------------------------------------------------------------

//--------------------------- Overlay function (makes the blank popup and loader) -------------------------------
// this function is called ahead of time so the loader is there, but it does not have to be called as the ceebox.popup script also calls this

$.fn.ceebox.overlay = function(opts) {
	opts = $.extend({//adds a few basic opts then merges in the defaults
		width: 60,
		height: 30,
		type: "html"
	}, $.fn.ceebox.defaults, opts);
	
	// 1. set up base sizes and positions
	var borderWidth,borderHeight, border = (opts.borderWidth.match(/[0-9]+/g));
	if (border.length = 1) {borderHeight = borderWidth = Number(border)}
	else if ((border.length = 4)) {
		borderHeight = Number(border[0]); //only need top
		borderWidth = Number(border[3]); //only need left
	};
	var marginLeft = parseInt(-1*((opts.width) / 2 + borderWidth),10);
	var marginTop = parseInt(-1*((opts.height) / 2 + borderHeight),10);
	var ceeboxPos = "fixed";

	// 2. IE 6 Browser fixes
	if (typeof document.body.style.maxHeight === "undefined") {
		if ($("#cee_HideSelect") === null) $("body").append("<iframe id='cb.HideSelect'></iframe>"); //fixes IE6's form select z-index issue
		var ceeboxPos = "absolute"; //IE 6 positioning is special... and I mean that in the most demeaning way possible
		var scrollPos = document.documentElement && document.documentElement.scrollTop || document.body.scrollTop;
		marginTop = marginTop + parseInt((scrollPos),10);
	}
	
	// 3. Creates overlay unless one already exists
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
			.appendTo($("body"))
			.click(function(e){removeCeebox(opts);return false;});
	};
	debug(opts.boxColor,"overlay")
	// 4. Creates popup box unless one already exists
	if ($("#cee_box").size() == 0){
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
				borderWidth:opts.borderWidth,
				borderColor:opts.borderColor,
				backgroundColor:opts.boxColor
			})
			.appendTo("body")
			.animate({
				height: opts.height + "px",
				width: opts.width + "px",
				opacity:1
			},opts.animSpeed);
			
			// 5. loads loading anim
			$($.fn.ceebox.loader).appendTo("body");
	} else {
		$("#cee_box").removeClass().addClass("cee_" + opts.type);//changes class if it has changed
	}
	
	// 5. show loading animation if not present
    $("#cee_load").show("fast").animate({opacity:1},"fast");
	
	// 6. return margins
	this.top = marginTop;
	this.left = marginLeft;
	return this;
}

//------------------------Popup function (adds content to popup and animates) -------------------------------
// if the content is a link it sets up as a ceebox content
// otherwise it can be used to add any html content to a ceebox style popup

$.fn.ceebox.popup = function(content,opts) {
	opts = $.extend({
		width: pageSize(opts.margin).width,
		height: pageSize(opts.margin).height,
		titleHeight: 40, //used as a base. This is set automatically if you are using the main ceebox function
		modal:false,
		type: "html",
		onload:null
	}, $.fn.ceebox.defaults, opts);
	
	// private variables and functions
	var gallery,family
	
	// 1. set up ceebox content based on link info
	if ($(content).is("a,area,input") && (opts.type == "html" || opts.type == "image" || opts.type == "video")) { //
		// 1a. grab gallery data, if it's there
		gallery = $.data(content,"ceebox");
		if (gallery) family = $(opts.selector).eq(gallery.parentId).contents().andSelf().find("[href]");
		
		// 1b. build ceebox content using constructors (this is where the heavy lifting happens)
		baseAttr.prototype = new baseSize[opts.type](opts);
		box.prototype = new baseAttr(content,opts);
		build[opts.type].prototype = new box();
		var cb = new build[opts.type];
		content = cb.content;
		
		// 1c. modify options based on properties of constructed ceebox content
		opts.action = cb.action;
		opts.modal = cb.modal;
		
		// 1d. get computed height of title text area
		opts.titleHeight = $(cb.titlebox).contents().contents().wrap("<div></div>").parent().attr("id","ceetitletest").css({position:"absolute",top:"-300px",width:cb.width + "px"}).appendTo("body").height();
		$("#ceetitletest").remove();
		opts.titleHeight = (opts.titleHeight >= 10) ? opts.titleHeight + 20 : 30;
		
		// 1e. sets final width and height of ceebox popup
		opts.width = cb.width + 2*opts.padding;
		opts.height = cb.height + opts.titleHeight + 2*opts.padding;
	}
	
	// 2. Get margins; Also creates overlay and empty ceebox to page if one does not already exist
	var margin = $.fn.ceebox.overlay(opts);
	
	// 3. add loading animation if not present
	if ($("#cee_load").size() == 0){
		$($.fn.ceebox.loader).appendTo("body").show("fast");
	}
	
	// function called when ceebox is finished loading all content
	function cbOnload(){
		$("#cee_load").hide(300).fadeOut(600); // remove loading anim
		if (isFunction(opts.action)) opts.action(); // call ceebox specific functions (ie, add flash player or ajax)
		if (isFunction(opts.onload)) opts.onload(); // call optional onload callback
	}
	
	// 4. animate ceebox transition
	$("#cee_box")
		.animate({
			marginLeft: margin.left,
			marginTop: margin.top,
			width: opts.width + "px",
			height: opts.height + "px"
		},
		opts.animSpeed,
		opts.easing,
		function(){

			// 5. append content once animation finishes
			var children = $(this).append(content).children().hide();
			var len = children.length;
			
			// 6. fade content in
			children.fadeIn(opts.fadeIn,function(){
				// 6a. if iframe call onload function when iframe content loaded
				if ($(this).is("iframe")) {
					$(this).load(function(){cbOnload();});
					var ifrm = true;
				}
				
				// 6b. if no iframe call onload functions once last item loaded
				if (!ifrm && this == children[len-1]) cbOnload();

			});
			
			// 7. check to see if it's modal
			if (opts.modal==true) {
				$("#cee_overlay").unbind(); //remove close function on overlay
			} else {
				// 7a. add closebtn
				$("<a href='#' id='cee_closeBtn' title='Close'>close</a>").prependTo("#cee_box").one("click",function(e){removeCeebox(opts);return false;});
				
				// 7b. add gallery next/prev nav if there is a gallery group
				if (gallery) addGallery(gallery,family,opts);
				
				// 7c. add key events
				keyEvents(gallery,family,opts);
			};
			
			
		});
		
	// 8. make close buttons in popup work (mostly for modal popups but works for anything)
	$(".cee_close").live("click",function(e){e.preventDefault();$(".cee_close").die();removeCeebox(opts)});
}

//--------------------------- PRIVATE FUNCTIONS ---------------------------------------------------

//--------------------------- ceebox builder constructor objects ----------------------------------

// 1. sets up base size based on default options
var baseSize = {
	image: function(opts){this.width = opts.imageWidth;this.height = opts.imageHeight;this.ratio = opts.imageRatio;return this;},
	video: function(opts){this.width = opts.videoWidth;this.height = opts.videoHeight;this.ratio = opts.videoRatio;return this;},
	html: function(opts){this.width = opts.htmlWidth;this.height = opts.htmlHeight;this.ratio = opts.htmlRatio;return this;}
}
// 2. grabs base attributes from link including any options from rel
var baseAttr = function(cblink,opts) {
	this.rel =  $(cblink).attr("rel");
	this.href = $(cblink).attr("href");
	this.title = $(cblink).attr("title");
	this.titlebox = "<div id='cee_title'><h2>"+this.title+"</h2></div>";
	this.margin = opts.margin;
	this.modal = opts.modal;
	
	//grab options form rel
	var rel = this.rel;
	if (rel && rel!= "") {
		//check for backwards compatiblity and set up for matches NOT TESTED!!!
		var m = [String(rel.match($.fn.ceebox.relMatch.modal)),String(rel.match($.fn.ceebox.relMatch.width)),String(rel.match($.fn.ceebox.relMatch.height))]
		
		//check for modal option
		if (m[0]) var mod = m[0].match(/true|false/i);
		if (mod == "true") this.modal = true;
		if (mod == "false") this.modal = false;
		//check for size option (overwrites the base size)
		if (m[1]) this.width = Number(m[1].match(/[0-9]+\b/));
		if (m[2]) this.height = Number(m[2].match(/[0-9]+\b/));
	}
	return this;
}
// 3. computes final size based on previously set size options and page size
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

var pageSize = function(margin){
	var de = document.documentElement;
	margin = margin || 100;
	this.width = (window.innerWidth || self.innerWidth || (de&&de.clientWidth) || document.body.clientWidth) - margin;
	this.height = (window.innerHeight || self.innerHeight || (de&&de.clientHeight) || document.body.clientHeight) - margin;
	this.ratio = this.width / this.height;
	return this;
}

// 4. builds content based on type
var build = {
	image: function() {
		this.type = "image";
		this.content = "<img id='cee_img' src='"+this.href+"' width='"+this.width+"' height='"+this.height+"' alt='"+this.title+"'/>" + this.titlebox;
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
		this.content = "<div id='cee_vid' style='width:"+this.width+"px;height:"+this.height+"px'></div>" + this.titlebox;
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
				ajx = h.split("#")[0];
				ajx = String(ajx + " " + h.match(/#[a-z_A-Z1-9\-]+/));
			}
			this.action = function(){ $("#cee_ajax").load(ajx);}
			this.content = this.titlebox + "<div id='cee_ajax' style='width:"+(this.width-30)+"px;height:"+(this.height-20)+"px'></div>"
		} else {
			$("#cee_iframe").remove();
			this.content = this.titlebox + "<iframe frameborder='0' hspace='0' src='"+h+"' id='cee_iframeContent' name='cee_iframeContent"+Math.round(Math.random()*1000)+"'  style='width:"+(this.width)+"px;height:"+(this.height)+"px;' > </iframe>";
			
		}
		return this;
	}
}

//---------------------------- video type matching function ----------------------------------------//
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

//--------------------------- specific single purpose functions ----------------------------------

function removeCeebox(opts) {
	$("#cee_closeBtn").unbind();
	$("#cee_box").fadeOut(opts.fadeOut,function(){$('#cee_box,#cee_overlay,#cee_HideSelect').unbind().trigger("unload").remove();});
	$("#cee_overlay").fadeOut(opts.fadeOut*2);
	$("#cee_load").remove();
	document.onkeydown = null;
	document.onkeyup = null;
	return false;
}

function keyEvents(g,family,opts) {
	document.onkeydown = function(e){ 	
		e = e || window.event;
		var kc = e.keyCode || e.which;
		switch (kc) {
			case 27:
				removeCeebox(opts);
				document.onkeydown = null;
				break;
			case 188:
			case 37:
				if (g && g.prevId!=null) {galleryNav(e,family,g.prevId,opts)}; 
				break;
			case 190:
			case 39:
				if (g && g.nextId!=null) {galleryNav(e,family,g.nextId,opts)};
				break;
		}
	}
}

function addGallery(g,family,opts){
	//set up base sizing and positioning for image gallery
	var navW = parseInt(opts.width / 2);
	var navH = opts.height-opts.titleHeight-2*opts.padding;
	var navTop = opts.padding;
	var navBgTop = navH/2;
	
	if (opts.type == "video" || opts.type == "html") {
		navW = 60;
		navH = 80;
		navTop = parseInt((opts.height-opts.titleHeight-2*opts.padding-10) / 2);
		navBgTop = 24;
	}
	if (opts.type == "html") navTop = parseInt((opts.height-opts.titleHeight-10) / 2);
	
	// function for creating prev/next buttons
	function navLink(btn,id) {
		var s,off = (navBgTop-2000) + "px", on = navBgTop + "px";
		
		(btn == "prev") ? s = [{left:0},"left"] : s = [{right:0}, x = "right"];

		var style = function(y) {return $.extend({width:navW + "px", height:navH + "px",position:"absolute",top:navTop},s[0],{backgroundPosition:s[1] + " " + y})}
		$("<a href='#'></a>")
			.text(btn)
			.attr("id","cee_" + btn)
			.css(style(off))
			.hover(
				function(){$(this).css(style(on))},
				function(){$(this).css(style(off))}
			)
			.one("click",function(e){
				galleryNav(e,family,id,opts);
			})
			.appendTo("#cee_box");
	}
	
	// add prev/next buttons	
	if (g.prevId != null) navLink("prev",g.prevId);
	if (g.nextId) navLink("next",g.nextId);
	
	$("#cee_title").append("<div id='cee_count'>Item " + (g.cbId + 1) +" of "+ g.cbLen + "</div>");
}

function galleryNav(e,f,id,opts) {
	e.preventDefault();
	$("#cee_box").children().fadeOut(opts.fadeOut,function(){$(this).remove();if ($(this).is("[id=cee_title]")) f.eq(id).trigger("click");})
}

//------------------------------ Generic helper functions ------------------------------------

function getSmlr(a,b) {return ((a && a < b) || !b) ? a : b;}
function isObject(a) {return (typeof a == 'object' && a) || isFunction(a);}
function isFunction(a) {return typeof a == 'function';}

//------------------------------ Debug function -----------------------------------------------
function debug(a,tag,opts) {
	//must turn on by setting debugging to true as a global variable
	if (debugging == true) {var bugs, header = "[ceebox](" + (tag||"")  + ")";
		($.isArray(a) || isObject(a)) ? $.each(a, function(i, val) { bugs = bugs +i + ":" + val + ", ";}) :  bugs = a;
		
		if (window.console && window.console.log) {
			window.console.log(header + bugs);
		} else {
			if ($("#debug").size() == 0) $("<ul id='debug'></ul>").appendTo("body").css({border:"1px solid #ccf",position:"fixed",top:"10px",right:"10px",width:"300px",padding:"10px",listStyle:"square"});
			$("<li>").css({margin:"0 0 5px"}).appendTo("#debug").append(header).wrapInner("<b></b>").append(" " + bugs);
		}
	}
}

})(jQuery);