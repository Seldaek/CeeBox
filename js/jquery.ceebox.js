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
	opts = $.extend({},$.fn.ceebox.defaults, opts);
	
	/*$(this).live("click", function(e){ //for some reason live doesn't allow you to grab jquery dom data
		
		var tgt = $(e.target).closest("[href]");
		if (tgt.is("[href]")) {
			e.preventDefault();
			e.stopPropagation();
			
			var ceeData = $.data(tgt,"ceeboxTarget");
		
			if ($.data(tgt,"ceeboxTarget")) {
			
			}
		}					   
	});*/
	$(this).each(function(){
		(new $.ceebox(this,opts)) //makes it all happen
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
$.ceebox.live = function(elm,e){
	var tgt = $(e.target).closest("[href]");

	if (tgt.is("[href]") && $.data(tgt,"ceeboxTarget")) {
		e.preventDefault();
		e.stopPropagation();
		var ceeData = $.data(tgt,"ceeboxTarget");
	}
}

$.ceebox = function(elm,opts) {
	opts = $.meta ? $.extend({}, opts, $(elm).data()) : opts; // meta plugin support (applied on parent element) NOT TESTED
	var grp = $(elm).contents().andSelf().find("[href]");
	var ceegrp = [] // this is the group paired down to matched urls
	var ic  = 0;
	grp.each(function(ig){
		var tgt = this;
		$.each(urlMatch, function(im) {
			if (urlMatch[im]($(tgt).attr("href"),opts)) {	
				ceegrp[ic] = {tgt:tgt,type:im};
				ic++;
				//store(tgt,im,opts);
				//addClick(tgt,im,opts);
				return false;
			}
		});
		
	});
	var ceelen = ceegrp.length;
	$(ceegrp).each(function(i){
		var g = addGallery(ceegrp,ceelen,i);
		opts = $.extend(opts, {next:g.next,prev:g.prev,galSize:ceelen,galNum:i});
		var tgt=ceegrp[i].tgt;
		var type=ceegrp[i].type;
		//debug([tgt.href,type],"ceegrp");
		store(tgt,type,opts);
		addClick(tgt,type,opts);
	});
}

var addGallery = function(ceegrp,ceelen,i) {
	var p = false,n = false;
	if (i > 0 && ceelen > 1) {
		p = $.data(ceegrp[i-1].tgt);
	}
	if (i < ceelen-1) {
		n = $.data(ceegrp[i+1].tgt);
		
	}
	this.prev = p;
	this.next = n;
	return this
}

var addClick = function(tgt,i,opts) {
	$(tgt).click(function(e){
		e.preventDefault();
		e.stopPropagation();
		$.fn.ceebox.overlay($.extend(opts,{width:60,height:30}));
		if (i == "image") { //preloads images before adding content
			var imgPreloader = new Image();
			imgPreloader.src = $(tgt).attr("href");
			imgPreloader.onload = function(){
				addPopup(tgt,opts);
			}
		} else addPopup(tgt,opts);
	});
}

var addPopup = function(tgt,opts) { 
		var cd = $.data(tgt,"ceeboxTarget");
		var w = cd.width+30, h = cd.height+60,prev=opts.prev,next=opts.next,galSize=opts.galSize,galNum=opts.galNum;
		debug(galNum,"addPop");
		$.fn.ceebox.popup(cd.build,$.extend(opts,{width:w,height:h,type:cd.type,action:cd.action,prev:prev,next:next,galSize:galSize,galNum:galNum}));
}

//-------------------------------url match----------------------------------------------
var urlMatch = {
	image: function(h,o) {return (o.image) && h.match(/\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$/i) || false},
	video: function(h,o) {return (o.video) && h.match(vidMatch) || false},
	html: function(h,o) {return (o.html)}
}
//-------------------------------store build to data of link------------------------
var store = function(elm,type,opts) {
	opts = $.meta ? $.extend({}, opts, $(elm).data()) : opts; // meta plugin support (applied on target element) NOT TESTED!
	if (type == "image") {
		var imgPreloader = new Image();
		imgPreloader.src = $(elm).attr("href");
		imgPreloader.onload = function(){
			imgPreloader.onload = null;
			//add image actual size as base size
			sz = {width:imgPreloader.width,height:imgPreloader.height,ratio:imgPreloader.width / imgPreloader.height}
			addData(elm,type,boxSize[type](sz,opts),opts);
		}
	} else {addData(elm,type,boxSize[type](false,opts),opts);}
}

var addData = function(elm,type,sz,opts){
	//debug([$(elm).attr("href"),type,sz.width,sz.height],"addData")
	var cd = build[type](elm,sz,opts);
	$.data(elm,"ceeboxTarget", {type:cd.type,width:sz.width,height:sz.height,ratio:sz.ratio,build:cd.content,action:cd.action});
	$.data(elm,"arg", "pirates");
}

//---------------------------sizing functions----------------------------------

var boxSize = {
	image: function(sz,opts){return setMax(sz,opts)},
	video: function(sz,opts){return setMax({width:opts.videoWidth,height:opts.videoHeight,ratio:opts.videoRatio},opts)},
	html: function(sz,opts){return setMax({width:opts.htmlWidth,height:opts.htmlHeight,ratio:opts.htmlRatio},opts)}
}

var pageSize = function(opts){
	var de = document.documentElement;
	var mar = 200/2
	this.width = (window.innerWidth || self.innerWidth || (de&&de.clientWidth) || document.body.clientWidth) - mar;
	this.height = (window.innerHeight || self.innerHeight || (de&&de.clientHeight) || document.body.clientHeight) - mar;
	this.ratio = this.width / this.height;
	//debug(opts,"pageSize")
	return this;
}
var setMax = function(sz,opts) {
	w = sz.width || opts.width; //this isn't quite right as we are missing the rel attribute
	h = sz.hieght || opts.hieght;
	r = sz.ratio || opts.ratio;
	var de = document.documentElement;
	var p = pageSize(opts);
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
	image: function(elm,sz) {
		var a = getAttr(elm);
		this.type = "image";
		this.action = false;
		this.content = "<img id='cee_img' src='"+a.h+"' width='"+sz.width+"' height='"+sz.height+"' alt='"+a.t+"'/>" + "<div id='cee_title'><h2>"+a.t+"</h2></div>";
		return this;
	},
	video: function(elm,sz) { 
		var a = getAttr(elm);
		var vidType = cee_vidType(a.t,a.h,a.r);
		//must directly declare variables for the swfobject to work properly
		var s = vidType.src;
		var p = vidType.params;
		var f = vidType.flashvars;
		var w = sz.width;
		var h = sz.height
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
		this.content = "<div id='cee_vid' style='width:"+sz.width+"px;height:"+sz.height+"px'></div><div id='cee_title'><h2>"+a.t+"</h2></div>";
		return this;
		},
	html: function(elm,sz) {
		var a = getAttr(elm);
		this.content = "<div id='cee_title'><h2>"+a.t+"</h2></div>"
		//test whether or not content is iframe or ajax
		var m = [a.h.match(/\w+\.com/i),a.h.match(/^http:+/),(a.r) ? a.r.match(/^iframe/) : false]
		if ((document.domain == m[0] && m[1] && !m[2]) || (!m[1] && !m[2])) { //if linked to same domain and not iframe than it's an ajax link
			this.type = "ajax";
			var ajx = a.h;
			if (a.h.match(/#[a-z_A-Z1-9]+/)){ //if there is an id on the link
				var ajx = ajx + " " + a.h.match(/#[a-z_A-Z1-9]+/)
			}
			this.action = function(){ $("#cee_ajax").load(ajx);}
			this.content = this.content + "<div id='cee_ajax' style='width:"+sz.width+"px;height:"+(sz.height-5)+"px'></div>"
		} else {
			this.type = "iframe"
			$("#cee_iframe").remove();
			this.content = this.content + "<iframe frameborder='0' hspace='0' src='"+a.h+"' id='cee_iframeContent' name='cee_iframeContent"+Math.round(Math.random()*1000)+"'  style='width:"+(sz.width+29)+"px;height:"+(sz.height+12)+"px;' > </iframe>";
			
		}
		return this;
	}
}

function getAttr(a){
	this.h = $(a).attr("href");
	this.t = $(a).attr("title");
	this.r = $(a).attr("rel");
	return this
}

//------------------------Overlay function (makes the blank popup and loader) -------------------------------
// this function is called ahead of time so the loader is there, but it does not have to be called as the ceebox.popup script also runs this

$.fn.ceebox.overlay = function(opts) {
	opts = $.extend({
		width: 50,
		height: 50,
		modal:false,
		type: ""
	}, opts);
	
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
		width: pageSize().width - 150,
		height: pageSize().height - 150,
		modal:false,
		type: "",
		onload:null
	}, opts);
	debug(opts,"popup")
	//Creates overlay and small ceebox to page unless one already exists and grabs margins
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
			};
			debug("anim");
			if (opts.prev || opts.next) addgal(opts);
			
	$("#cee_load").hide("normal").animate({opacity:0},"slow");
			if (isFunction(opts.action)) opts.action();//ceebox specific actions (load movie or ajax)
			if (isFunction(opts.onload)) opts.onload();//optional onload callback
		});

	$(".cee_close").live("click",function(e){e.preventDefault();removeCeebox()}); // make all current and future close buttons work.
	
	
	keyEvents(r);
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
	
	function addgal(opts){
		debug([opts.next,opts.prev],"gallery");
		var $cee_nav = $("<div id='cee_nav'></div>").css({width:(opts.width + 30),height:opts.hieght});
		var gCount = "<div id='cee_count'>Image " + (opts.galNum + 1) +" of "+ opts.galSize + "</div>";
		var navW = (opts.width / 2)+"px";
		var navH = opts.height+"px";
		/*if (opts.type != "image") {
			navW = (opts.width / 3)+"px";
			navH = opts.height - 50 + "px";
		}
		if (opts.prev) {
			$(opts.prev)
				//.clone()
				.text("Prev")
				.attr("id","cee_prev")
				.css({width:navW,height:navH,position:"absolute",left:"0px"})
				.bind("click",function(e){e.preventDefault();$("#cee_box").children().remove();})
				//.appendTo($cee_nav)
		}*/
		if (opts.next) {
			$(opts.next)
				//.clone()
				.text("Next")
				.attr("id","cee_next")
				.css({width:navW,height:navH,position:"absolute",right:"0px"})
				.bind("click",function(e){e.preventDefault();$("#cee_box").children().remove();})
				.appendTo($cee_nav);
		}
		
		$("#cee_title").prepend($cee_nav).append(gCount);
	}
	
	/*
//-------------------------------OLD CODE FROM INIT (Gallery & rel variables) ----------------------------------------------
var old_init = function(type,grp,tgt){

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
							cb.prevType = i;
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

	
}

*/

})(jQuery);