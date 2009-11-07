//ceebox
/*
 * CeeBox 1.4.3 jQuery Plugin
 * Requires jQuery 1.3.2 and swfobject.jquery.js plugin to work
 * Code hosted on GitHub (http://github.com/catcubed/ceebox) Please visit there for version history information
 * By Colin Fahrion (http://www.catcubed.com)
 * Inspiration for ceebox comes from Thickbox (http://jquery.com/demo/thickbox/) and Videobox (http://videobox-lb.sourceforge.net/)
 * However, along the upgrade path cb.ox has morphed a long way from those roots.
 * Copyright (c) 2009 Colin Fahrion
 * Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
*/

// To make cb.ox work add $(".ceebox").ceebox(); to your global js file or if you don't have one just uncomment the following...
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
	$(this).each(function(){
		$.data(this,"ceebox", $(this).contents().andSelf().find("[href]")); //stores array of links under the this as a data item
	});
	$(this).live("click", function(e){
		(new $.ceebox(this, e, opts));						   
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
	pageMargin: 75, //margin between ceebox content (not including ceebox border) and browser frame
	width: false, //set max size for all links (overridden by the more specific size defaults set below)
	height: false,
	ratio: false,
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
	onload:function(){}, //callback function once ceebox popup is loaded
	backwardsCompatible: false // if set to true than parameters passed in the rel use the old 1.x system
}
//ratio shortcuts
$.fn.ceebox.ratios = {"4:3": 1.667, "3:2": 1.5, "16:9": 1.778,"1:1":1,"square":1};

//set up modal regex expressions; publically accessable so that ceebox can adjust to suit your needs.
//also allows for backwards compatible with ceebox 1.x by just adding $.fn.ceebox.defaults.backwardsCompatible = true; to your ready script
$.fn.ceebox.relMatch = {"width": /\bwidth:[0-9]+\b/i, "height": /\bheight:[0-9]+\b/i, "modal": /\bmodal:true|false\b/i};

//-------------------------------main function----------------------------------------------
$.ceebox = function(element,clickEvent,opts){
	cb.o = jQuery.extend({},$.fn.ceebox.defaults, opts);
	cb.obj = element;
	cb.tgt = $(clickEvent.target).closest("[href]");

	if (cb.tgt.is("[href]")) {

		$.each(urlMatch, function(i, val) {
			if (urlMatch[i](cb.tgt.attr("href"))) {
				clickEvent.preventDefault();
				clickEvent.stopPropagation();		
				init(i);
				return false;
			}
		});
	}
}

//-------------------------------main variables----------------------------------------------
var cb = {
	o: null, // extended options
	obj: null, // parent object of target
	tgt: null, // clicked target link
	grp: null, // array of links grouped under the parent object
	h: "", //href
	t: "", //title
	r: "", //rel
	type: "",
	modal:false,
	width: null,
	height: null,
	ratio: null,
	onload: null,
	next: null,
	prev: null
}
//-------------------------------url match----------------------------------------------
var urlMatch = {
	image: function(h) {return (cb.o.image) && h.match(/\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$/i) || false},
	video: function(h) {return (cb.o.video) && h.match(vidMatch) || false},
	//ajax: function(h) {return ((!opts.htmlLinks) || (!h.match(/^iframe/) || (!h.match(/^http:+/) || (document.domain == h.match(/\w+\.com/i))) || false},
	html: function(h) {return (cb.o.html)}
}
//-------------------------------initializes all variables----------------------------------------------
var init = function(type,grp,tgt){
	$.fn.ceebox.overlay({class:type});//adds overlay to page unless one already exists
	cb.tgt = tgt || cb.tgt;
	//set up main variables
	cb.h = cb.tgt.attr("href");
	cb.t = (cb.tgt.attr("title")) ? cb.tgt.attr("title") : "";
	cb.r = (cb.tgt.attr("rel")) ? cb.tgt.attr("rel") : "";
	cb.type = type;
	cb.grp = grp || $.data(cb.obj,"ceebox");
	cb.modal = cb.o.modal;cb.width = cb.o.height;cb.width = cb.o.width;cb.ratio = cb.o.ratio;cb.next=null;cb.prev=null;//reset
	debug(cb.grp,"init");
	//extend opts if meta plugin is present
	cb.o = $.meta ? $.extend({}, cb.o, cb.obj.data()) : cb.o; // meta plugin support (applied on parent element)
	cb.o = $.meta ? $.extend({}, cb.o, cb.tgt.data()) : cb.o; // meta plugin support (applied on target element)
	
	//gallery next prev code
	if (cb.grp) {
		var len = cb.grp.length;
		$.each(cb.grp, function(i) {
			var tp = $(cb.grp[i]).attr("href");
			if (tp == cb.h) {
				if (i > 0) {
					cb.prev = cb.grp[i-1];
					$.each(urlMatch, function(i, val) {
						if (urlMatch[i]($(cb.prev).attr("href"))) {
							cb.prevType = i;debug(cb.prevType);
							return false;
							
						}
					});
				}
				if (i < len-1) {
					cb.next = cb.grp[i+1];
					$.each(urlMatch, function(i, val) {
						if (urlMatch[i]($(cb.next).attr("href"))) {
							cb.nextType = i;
							return false;
							
						}
					});
				}
				return false;
			}
		});
	}
	
	//grab options from rel
	if (cb.r != "") {
		//check for backwards compatiblity and set up for matches
		if (cb.o.backwardsCompatible) {var r = [cb.r.match(/\bmodal\b/i),cb.r.match(/\b[0-9]+\b/g),cb.r.match(/\bwidth:[0-9]+\b/g)]}
		else {var r = [String(cb.r.match($.fn.ceebox.relMatch.modal)),String(cb.r.match($.fn.ceebox.relMatch.width)),String(cb.r.match($.fn.ceebox.relMatch.height))]}
		
		if (r[0]) {
			(cb.o.backwardsCompatible) ? cb.modal=true : cb.modal=cb.r.match(/true|false/i);
		}
		if (cb.o.backwardsCompatible) {
			if (r[1][0]) cb.width = r[1][0];
			if (r[1][1]) cb.height = r[1][1];
		} else {
			if (r[1]) cb.width = r[1].match(/[0-9]+\b/)// cb.width = r[1].match(/[0-9]+\b/);
			if (r[2]) cb.height = r[2].match(/[0-9]+\b/)//cb.height = r[2].match(/[0-9]+\b/);
		}
	}
	
	if (cb.type == "image") {
		var imgPreloader = new Image();
		imgPreloader.src = cb.h;
		imgPreloader.onload = function(){
			imgPreloader.onload = null;
			//add image actual size as base size
			cb.width = imgPreloader.width;
			cb.height = imgPreloader.height;
			cb.ratio = imgPreloader.width / imgPreloader.height;
			run(boxSize[cb.type]());
		}
	} else {run(boxSize[cb.type]());}

	
}

var run = function(box) {
	//$.extend(cb,box); not sure why the extend is failing.
	cb.width = Number(box.width);
	cb.height = Number(box.height);
	
	var content = build[cb.type]();
	debug(cb,"run");
	$.fn.ceebox.popup(content,{width:cb.width+30,height:cb.height+60,modal:cb.modal,class:cb.type,onload:cb.onload});
}

//---------------------------sizing functions----------------------------------

var boxSize = {
	image: function(){return setMax(cb.o.imageWidth,cb.o.imageHeight,cb.ratio)},
	video: function(){return setMax(cb.o.videoWidth,cb.o.videoHeight,cb.o.videoRatio)},
	html: function(){return setMax(cb.o.htmlWidth,cb.o.htmlHeight,cb.o.htmlRatio)}
}

var pageSize = function(){ // finde
	var de = document.documentElement;
	this.width = (window.innerWidth || self.innerWidth || (de&&de.clientWidth) || document.body.clientWidth) - (cb.o.pageMargin * 2);
	this.height = (window.innerHeight || self.innerHeight || (de&&de.clientHeight) || document.body.clientHeight) - (cb.o.pageMargin * 2);
	this.ratio = this.width / this.height;
	return this;
}
var setMax = function(w,h,r) { // finde
	w = cb.width || w || cb.o.width;
	h = cb.height || h || cb.o.hieght;
	r = cb.ratio || r;
	var de = document.documentElement;
	var p = pageSize();
	w = (w && w < p.width) ? w : p.width;
	h = (h && h < p.height) ? h : p.height;
	if (r) { //if ratio value has been passed, adjust size to the ratio
		if (!Number(r)) {//check to see if it's a shortcut name rather than a number
			$.each($.fn.ceebox.ratios, function(i, val) {
				if (r == i) {r = val;return false;}
			});
			r = Number(r) || 1; //defaults to 1 if it doesn't convert to a number properly
		}
		//makes sure that it's smaller than the max width and height
		if (w/h > r ) w = parseInt(h * r,10);
		if (w/h < r ) h = parseInt(w / r,10);
	}
	this.width = w;
	this.height = h;
	return this;
}
//---------------------------build functions----------------------------------
var build = {
	image: function() {
		debug(cb,"buildimage");
		return "<img id='cee_img' src='"+cb.h+"' width='"+cb.width+"' height='"+cb.hieght+"' alt='"+cb.t+"'/>" + "<div id='cee_title'><h2>"+cb.t+"</h2></div>";
	},
	video: function() { 
		
		var vidType = cee_vidType(cb.t,cb.h,cb.r);
		cb.onload = function() {
			$('#cee_vid').flash({
				swf: vidType.src,
				params: vidType.params,
				flashvars: vidType.flashvars,
				width: cb.width,
				height: cb.height
			});
		}
		return "<div id='cee_vid' style='width:"+cb.width+"px;height:"+cb.height+"px'></div><div id='cee_title'><h2>"+cb.t+"</h2></div>"
		},
	html: function() {
		var content = "<div id='cee_title'><h2>"+cb.t+"</h2></div>"
		//test whether or not content is iframe or ajax
		var m = [cb.h.match(/\w+\.com/i),cb.h.match(/^http:+/),cb.r.match(/^iframe/)]
		if ((document.domain == m[0] && m[1] && !m[2]) || (!m[1] && !m[2])) { //if linked to same domain and not iframe than it's an ajax link
			cb.type = "ajax"
			cb.onload = function(){ //adds callback for loading ajax to module
				if (cb.h.match(/#[a-z_A-Z1-9]+/)){ //if there is an id on the link
					$("#cee_ajax").load(cb.h + " " + cb.h.match(/#[a-z_A-Z1-9]+/));
				} else {
					$("#cee_ajax").load(cb.h);
				}
			}
			content = content + "<div id='cee_ajax' style='width:"+cb.width+"px;height:"+(cb.height-5)+"px'></div>"
		} else {
			cb.type = "iframe"
			$("#cee_iframe").remove();
			content = content + "<iframe frameborder='0' hspace='0' src='"+cb.h+"' id='cee_iframeContent' name='cee_iframeContent"+Math.round(Math.random()*1000)+"'  style='width:"+(cb.width+29)+"px;height:"+(cb.height+12)+"px;' > </iframe>";
			
		}
		return content;
	}
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

$.fn.ceebox.overlay = function(settings) {//used to preload the overlay
	settings = $.extend({
		width: 50,
		height: 50,
		modal:false,
		class: ""
	}, settings);
	
	var borderWidth = Number((cb.o.border.match(/[0-9]+/g)[0])) || 0;
	
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
		var marginTop = parseInt(-1*(settings.height / 2 - scrollPos + borderWidth),10) ;
	} else {
		var ceeboxPos = "fixed";
		var marginTop = parseInt(-1*(settings.height / 2 + borderWidth),10);
	}
	var marginLeft = parseInt(-1*(settings.width / 2 + borderWidth),10);
	
	//Creates overlay unless one already exists
	if ($("#cee_overlay").size() == 0){
		$("<div id='cee_overlay'></div>")
			.css({
				 opacity : cb.o.overlayOpacity,
				 position: "absolute",
				 top: 0,
				 left: 0,
				 backgroundColor: cb.o.overlayColor,
				 width: "100%",
				 height: $(document).height(),
				 zIndex: 100
			})
			.appendTo($("body"));
	};
	//Creates popup box unless one already exists
	if ($("#cee_box").size() == 0){ //if cb.ox does not exist create one.
		$("<div id='cee_box'></div>")
			.addClass("cee_" + settings.class)
			.css({
				position: ceeboxPos,
				zIndex: 102,
				top: "50%",
				left: "50%",
				height: settings.height + "px",
				width: settings.width + "px",
				marginLeft: marginLeft + 'px',
				marginTop: marginTop + 'px',
				opacity:0,
				border:cb.o.border
			})
			.appendTo("body")
			.animate({
				height: settings.height + "px",
				width: settings.width + "px",
				opacity:1
			},cb.o.animSpeed);
		$("<div id='cee_load'></div>")
		.css({
			 zIndex: 105,
				top: "50%",
				left: "50%",
				position:"fixed"
			 })
		.appendTo("body").show("fast");
	} else {
		$("#cee_box").removeClass().addClass("cee_" + settings.class);//changes class if it has changed
	}
	this.top = marginTop;
	this.left = marginLeft;
	return this;
}
$.fn.ceebox.popup = function(content,settings) { //creates ceebox popup
	settings = $.extend({
		width: pageSize().width - 150,
		height: pageSize().height - 150,
		modal:false,
		class: "",
		onload:null
	}, settings);
	debug(cb,"popup");
	//Creates overlay and small ceebox to page unless one already exists and grabs margins
	var margin = $.fn.ceebox.overlay(settings);
	$("#cee_load").hide("normal").animate({opacity:0},"slow");
	// animate ceebox opening and fade in content (also serves as gallery transition animation).
	$("#cee_box")
		.css("background-image","none")
		.animate({
			marginLeft: margin.left,
			marginTop: margin.top,
			height: settings.height + "px",
			width: settings.width + "px"
		},cb.o.animSpeed,function(){
			$(this).append(content).children().fadeIn("fast")
			//check to see if it's modal and add close buttons if not
			if (settings.modal=="true") {
				$("#cee_overlay").unbind();
			} else {
				$("#cee_title").prepend("<a href='#' id='cee_closeBtn' title='Close'>close</a>");
				$("#cee_closeBtn, #cee_overlay").click(function(e){removeCeebox();return false;});
			};
			if (cb.next || cb.prev) imgGal();
			if (isFunction(settings.onload)) settings.onload();
		});

	$(".cee_close").live("click",function(e){e.preventDefault();removeCeebox()}); // make all current and future close buttons work.
	
	
	keyEvents(r);
}

//----------------------------video type matching function (may rewrite this)----------------------------------------//
// regex match string for all supported video player formats and generic swf
	var vidMatch = /youtube\.com\/watch|metacafe\.com\/watch|google\.com\/videoplay|ifilm\.com\/video|vimeo\.com|dailymotion\.com|facebook\.com\/video|\.swf$/i
	// Helper function for video; detects which player it is and returns the src and params
	function cee_vidType(t,h,r) {
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
	
	function keyEvents(r) {
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
	
	function imgGal(){
		var imgNum = 1;
		var len = cb.grp.length
		var $cee_nav = $("<div id='cee_nav'></div>").css({width:(cb.width + 30),height:cb.hieght});
		var gCount = "<div id='cee_count'>Image " + (imgNum + 1) +" of "+ len + "</div>";
		var navW = (cb.width / 2)+"px";
		var navH = cb.height+"px";
		if (cb.type != "image") {
			navW = (cb.width / 3)+"px";
			navH = cb.height - 50 + "px";
		}
		if (cb.prev) {
			$(cb.prev)
				.clone()
				.text("Prev")
				.attr("id","cee_prev")
				.css({width:navW,height:navH,position:"absolute",left:"0px"})
				.bind("click",function(e){
					e.preventDefault();$("#cee_box").children().remove();
					init(cb.prevType,cb.grp,$(cb.prev))
				})
				.appendTo($cee_nav)
		}
		if (cb.next) {
			$(cb.next)
				.clone()
				.text("Next")
				.attr("id","cee_next")
				.css({width:navW,height:navH,position:"absolute",right:"0px"})
				.bind("click",function(e){e.preventDefault();$("#cee_box").children().remove();init(cb.nextType,cb.grp,$(cb.next))})
				.appendTo($cee_nav);
		}
		
		$("#cee_title").prepend($cee_nav).append(gCount);
	}
//-----------------------------END OF REWRITE---------------------------------------------------------------

/*
	
	function linkData($this){
		var links = $this.contents().andSelf().find("[href]");
		tester([$(links[0]).attr("href"),$(links[0]).attr("class"),$(links[0]).attr("rel"),$(links[0]).attr("title")]);
		var len = links.length, i = 0, data;
		if (len > 1) {
			while (i < len) {
				links[0]
				if (i < 0) data = {next:$(links[i+1]).attr("href"),nextRel:$(links[i+1]).attr("rel"),nextClass:$(links[i+1]).attr("class"),nextClass:$(links[i+1]).attr("class")};
				if (i > len-1) data = {prev:links[i-1].attr("href"),prevRel:links[i-1].attr("rel"),prevClass:links[i-1].attr("class")};
				$.data(links[i],"cb.ox",data);
				i++;
			}
		}
	}

	function findLoc(group,href){
		var i = 0;
		var l = group.length;
		while (i <= l) {
			var tempHref = $(group[i]).attr("href")
			if (href == tempHref) {return i;};
			i++;
		}
	}

	
	*/
	
	
	/*
	//---------------- Image Gallery popup function -----------------------
	
	$.cb.ox.image = function(t,h,r,group) {
	// t = title for window, h = href, r = rel
	//Display images in box
		
		var imgPreloader = new Image();
		imgPreloader.onload = function(){
			imgPreloader.onload = null;

			var maxW = (imgPreloader.width < opts.imageSize.width) ? opts.imageSize.width : imgPreloader.width;
			var maxH = (imgPreloader.height < opts.imageSize.height) ? opts.imageSize.height : imgPreloader.height;
			var ratio = imgPreloader.width / imgPreloader.height;
			var imageSize = cb.getSize(r,maxW,maxH,ratio);
			
			$.cb.ox.append("<img id='cb.img' src='"+h+"' width='"+imageSize[0]+"' height='"+imageSize[1]+"' alt='"+t+"'/>" + "<div id='cb.title'><h2>"+t+"</h2></div>",imageSize[0] + 30,imageSize[1] + 60,r,"cb.img",group);
			
			//set up gallery if there are image links contained in same cb.ox group
			if (umbrella) {
				// creates array of all cb.ox image links under the umbrella for gallery functionality
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
		$.cb.ox.image(t,h,r,umbrella || false);
		return false;
	}
	*/
	
	/*
	function cb.rrayLocator(h){// finds where link is in the $cb.inks array
		var i = 0;
		while (i <= $cb.rrayLength - 1) {
			var ii = 0;
			var l = $cb.rray[i].length;
			while (ii <= l) {
				if (h == $cb.rray[i][ii]) {return [i,ii];};
				ii++;
			}
			i++;
		}
	}
	
	
	
	*/
})(jQuery);