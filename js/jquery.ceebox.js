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
	onload:function(){}, //callback function once ceebox popup is loaded
	backwardsCompatible: false // if set to true than parameters passed in the rel use the old 1.x system
}
$.fn.ceebox.ratios = {"4:3": 1.667, "3:2": 1.5, "16:9": 1.778,"1:1":1,"square":1};

//set up modal regex expressions; publically accessable so that ceebox can adjust to suit your needs.
//also allows for backwards compatible with ceebox 1.x by just adding $.fn.ceebox.defaults.backwardsCompatible = true; to your ready script
$.fn.ceebox.relMatch = {"width": /\bwidth:[0-9]+\b/i, "height": /\bheight:[0-9]+\b/i, "modal": /\bmodal:true|false\b/i};

//-------------------------------main function----------------------------------------------
$.ceebox = function(element,clickEvent,opts){
	cb.opts = jQuery.extend({},$.fn.ceebox.defaults, opts);
	cb.obj = element;
	cb.tgt = $(clickEvent.target).closest("[href]");

	if (cb.tgt.is("[href]")) {

		$.each(urlMatch, function(i, val) {
			if (urlMatch[i](cb.tgt.attr("href"))) {
				clickEvent.preventDefault();
				clickEvent.stopPropagation();
				init(i);
				// might need something in init or elsewhere that detects if cb.ox is already loaded? Or maybe not?
				//$.fn.ceebox.popup(build[i](),{width:cb.width+30,height:cb.height+60,modal:cb.modal,class:cb.type}); //this doesn't work for reloading ajax. Might also fail for gallery	
				//build[i]();
				return false;
			}
		});
	}
}

//-------------------------------main variables----------------------------------------------
var cb = {
	opts: null, // extended options
	obj: null, // parent object of target
	tgt: null, // clicked target link
	group: null, // array of links grouped under the parent object
	h: "", //href
	t: "", //title
	r: "", //rel
	type: "",
	modal:false,
	width: null,
	height: null,
	ratio: null,
	callback: null
}
//-------------------------------url match----------------------------------------------
var urlMatch = {
	image: function(h) {return (cb.opts.image) && h.match(/\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$/i) || false},
	video: function(h) {return (cb.opts.video) && h.match(vidMatch) || false},
	//ajax: function(h) {return ((!opts.htmlLinks) || (!h.match(/^iframe/) || (!h.match(/^http:+/) || (document.domain == h.match(/\w+\.com/i))) || false},
	html: function(h) {return (cb.opts.html)}
}
//-------------------------------initializes all variables----------------------------------------------
var init = function(type){
	//set up main variables
	cb.h = cb.tgt.attr("href");
	cb.t = (cb.tgt.attr("title")) ? cb.tgt.attr("title") : "";
	cb.r = (cb.tgt.attr("rel")) ? cb.tgt.attr("rel") : "";
	cb.type = type;
	cb.group = $.data(cb.obj,"cb.ox");
	cb.modal = cb.opts.modal;cb.width = cb.opts.height;cb.width = cb.opts.width;cb.ratio = cb.opts.ratio;//reset
	
	//extend opts if meta plugin is present
	cb.opts = $.meta ? $.extend({}, cb.opts, cb.obj.data()) : cb.opts; // meta plugin support (applied on parent element)
	cb.opts = $.meta ? $.extend({}, cb.opts, cb.tgt.data()) : cb.opts; // meta plugin support (applied on target element)
	
	//grab options from rel
	if (cb.r != "") {
		//check for backwards compatiblity and set up for matches
		if (cb.opts.backwardsCompatible) {var r = [cb.r.match(/\bmodal\b/i),cb.r.match(/\b[0-9]+\b/g),cb.r.match(/\bwidth:[0-9]+\b/g)]}
		else {var r = [String(cb.r.match($.fn.ceebox.relMatch.modal)),String(cb.r.match($.fn.ceebox.relMatch.width)),String(cb.r.match($.fn.ceebox.relMatch.height))]}
		
		if (r[0]) {
			(cb.opts.backwardsCompatible) ? cb.modal=true : cb.modal=cb.r.match(/true|false/i);
		}
		if (cb.opts.backwardsCompatible) {
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
			
			cb.width = imgPreloader.width;
			cb.height = imgPreloader.height;
			cb.ratio = imgPreloader.width / imgPreloader.height;
			
			debug([cb.width,cb.height],"preload");
			run(boxSize[cb.type]())
		}	
	} else {run(boxSize[cb.type]())}
	//
	
}

var run = function(box) {
	//$.extend(cb,box); not sure why the extend is failing.
	cb.width = box.width;
	cb.height = box.height;
	cb.ratio = box.ratio;
	debug(cb,"run");
	$.fn.ceebox.popup(build[cb.type](),{width:cb.width+30,height:cb.height+60,modal:cb.modal,class:cb.type});
}

//---------------------------sizing functions----------------------------------

var boxSize = {
	image: function(){return setMax(cb.opts.imageWidth,cb.opts.imageHeight,cb.ratio)}, //problem here due to the imgpreload requirement
	video: function(){return setMax(cb.opts.videoWidth,cb.opts.videoHeight,cb.opts.videoRatio)},
	html: function(){return setMax(cb.opts.htmlWidth,cb.opts.htmlHeight,cb.opts.htmlRatio)}
}

var pageSize = function(){ // finde
	var de = document.documentElement;
	this.width = (window.innerWidth || self.innerWidth || (de&&de.clientWidth) || document.body.clientWidth) - (cb.opts.pageMargin * 2);
	this.height = (window.innerHeight || self.innerHeight || (de&&de.clientHeight) || document.body.clientHeight) - (cb.opts.pageMargin * 2);
	this.ratio = this.width / this.height;
	return this;
}
var setMax = function(w,h,r) { // finde
	w = cb.width || w || cb.opts.width;
	h = cb.height || h || cb.opts.hieght;
	r = cb.ratio || r;
	r = r*1
	var de = document.documentElement;
	var p = pageSize();
	this.width = (w && w < p.width) ? w : p.width;
	this.height = (h && h < p.height) ? h : p.height;
	this.ratio = this.width / this.height;
	debug([w,h,this.width,this.height,this.ratio],"max0");
	if (r) { //if ratio value has been passed, adjust size to the ratio
		
		if (!isNumber(r)) {
			$.each($.fn.ceebox.ratios, function(i, val) {
				if (r == $.fn.ceebox.ratios[i]) {
					r = val;
					return false;
				}
			});
		}
		//makes sure that it's smaller than the max width and height  //broke!!!!
		if (this.ratio > r ) {
			this.width = parseInt(this.height * r);
		}; 
		if (this.ratio < r ) {
			this.height = parseInt(this.width / r);
		};
		this.ratio = r*1;
	}
	debug([this.width,this.height,this.ratio],"max-end");
	return this;
}
//---------------------------build functions----------------------------------
var build = {
	image: function() {
		
		return "<img id='cee_img' src='"+cb.h+"' width='"+cb.width+"' height='"+cb.hieght+"' alt='"+cb.t+"'/>" + "<div id='cee_title'><h2>"+cb.t+"</h2></div>";
	},
	video: function() { tester("build:video")},
	ajax: function() { 
		cb.callback = function(){ //adds callback for loading ajax to module
			if (cb.h.match(/#[a-z_A-Z1-9]+/)){ //if there is an id on the link
				$("#cee_ajax").load(cb.h + " " + cb.h.match(/#[a-z_A-Z1-9]+/));
			} else {
				$("#cee_ajax").load(cb.h);
			}
		}
	
		if($("#cee_box").css("display") != "block"){ //if window currently not displaying
			return "<div id='cb.title'><h2>"+cb.t+"</h2></div><div id='cb.ajax' style='width:"+cb.width+"px;height:"+(cb.height-5)+"px'></div>"
		}else{ //if the window is already up, we are just loading new content via ajax BROKE! this is broke
			$("#cee_ajaxContent")[0].style.width = cb.width +"px";
			$("#cee_ajaxContent")[0].style.height = cb.height +"px";
			$("#cee_ajaxContent")[0].scrollTop = 0;
			$("#cee_ajaxWindowTitle").html(cb.t);
		}

	},
	html: function() {
		var content = "<div id='cee_title'><h2>"+cb.t+"</h2></div>"
		//test whether or not content is iframe or ajax
		var m = [cb.h.match(/\w+\.com/i),cb.h.match(/^http:+/),cb.r.match(/^iframe/)]
		if ((document.domain == m[0] && m[1] && !m[2]) || (!m[1] && !m[2])) { //if linked to same domain and not iframe than it's an ajax link
			cb.type = "ajax"
			
		} else {
			cb.type = "iframe"
			$("#cee_iframe").remove();
			content = content + "<iframe frameborder='0' hspace='0' src='"+cb.h+"' id='cee_iframeContent' name='cee_iframeContent"+Math.round(Math.random()*1000)+"'  style='width:"+(cb.width+29)+"px;height:"+(cb.height+12)+"px;' > </iframe>";
			return content;
		}
			//if (document.domain == h.match(/\w+\.com/i)) {		} 
			//if (cee.h.match(/^http:+/) && (document.domain == cee.h.match(/\w+\.com/i)){tester("woot")};
		
		//$("#cee_iframe").remove();
		//return content = "<div id='cee_title'><h2>"+cb.t+"</h2></div><iframe frameborder='0' hspace='0' src='"+cb.h+"' id='cee_iframeContent' name='cee_iframeContent"+Math.round(Math.random()*1000)+"'  style='width:"+(cb.width+29)+"px;height:"+(cb.height+12)+"px;' > </iframe>";
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

function debug(a,tag) {
	if (window.console && window.console.log) {
		var header = "[ceebox](" + (tag||"")  + ")"
		var bugs
		if($.isArray(a)) {
			$.each(a, function(i, val) {
				bugs = bugs + i + ": " + val + ", ";
			});
		} else {bugs = a}
		window.console.log(header);
		window.console.log(bugs);
	//window.console.log('[ceebox] ' + Array.prototype.join.call(arguments,' ') + " (" + a + ")");
	//$('body').append('<div class="debugconsole">'+Array.prototype.join.call(arguments,' ')+'</div>');
		
	}
}


$.fn.ceebox.popup = function(content,settings) { //creates ceebox popup
	settings = jQuery.extend({
//Turn off cb.ox for certian types of links
		width: pageSize().width - 150,
		height: pageSize().height - 150,
		modal:false,
		class: ""
	}, settings);
	debug(settings,"popup")
	$("<div id='cee_load'></div>").appendTo("body").show;//add loader to the page
	
	//Browser fixes
	if($.browser.opera){
		//hack to make opera display flash movie correctly
		$("body").append("<span style='line-height:0px;color:rgba(0,0,0,0)' rel='lame opera hack'>-</span>");
	}
	if (typeof document.body.style.maxHeight === "undefined") {//IE 6 positioning is special... and I mean that in the most demeaning way possible
		if ($("#cee_HideSelect") === null) {
			$("body").append("<iframe id='cb.HideSelect'></iframe>");
		}
		var ceeboxPos = "absolute";
		var scrollPos = document.documentElement && document.documentElement.scrollTop || document.body.scrollTop;
		var marginTop = parseInt(-1*(settings.height / 2 - scrollPos),10) + 'px';
	} else {
		var ceeboxPos = "fixed";
		var marginTop = parseInt(-1*(settings.height / 2),10) + 'px';
	}
	var marginLeft = parseInt(-1*(settings.width / 2),10) + "px";
	//Creates Overlay and Boxes
	
	//Creates overlay unless one already exists
	if ($("#cee_overlay").size() == 0){
		$("<div id='cee_overlay'></div>")
			.css({
				 opacity : cb.opts.overlayOpacity,
				 position: "absolute",
				 top: 0,
				 left: 0,
				 backgroundColor: cb.opts.overlayColor,
				 width: "100%",
				 height: $(document).height(),
				 zIndex: 100
			})
			.appendTo($("body"));
	};
	//Creates popup box unless one already exists
	if ($("#cee_box").size() == 0){ //if cb.ox does not exist create one.
		$("<div id='cee_box'></div>")
			.addClass(settings.class)
			.css({
				position: ceeboxPos,
				zIndex: 102,
				top: "50%",
				left: "50%"
			})
			.appendTo("body")
	} 
	// animate cb.ox opening and fade in content (also serves as gallery transition animation).
	$("#cee_box")
		.animate({
			marginLeft: marginLeft,
			marginTop: marginTop,
			height: settings.height + "px",
			width: settings.width + "px"
		},cb.opts.animSpeed,function(){$('#cee_box').children().fadeIn("fast")})
		.append(content).children().hide();
	
	//check to see if it's modal and add close buttons if not
	if (settings.modal==true) {
		$("#cee_overlay").unbind();
	} else {
		$("#cee_title").prepend("<a href='#' id='cee_closeBtn' title='Close'>close</a>");
		$("#cee_closeBtn").click(function(){removeCeebox()});
		$("#cee_overlay").click(function(){removeCeebox()});
	};
	$(".cee_close").live("click",function(e){e.preventDefault();removeCeebox()}); // make all current and future close buttons work.
	
	$("#cee_load").hide();
	//keyEvents(r,umbrella || false);
}

//-----------------------------END OF REWRITE---------------------------------------------------------------

/* hide all functions that have not been rewritten
function cb.mage($tgt) {
	var h = $tgt.attr("href");
	var t = $tgt.attr("title");
	var r = $tgt.attr("rel");
	var imgPreloader = new Image();
	imgPreloader.src = h;
	imgPreloader.onload = function(){
		imgPreloader.onload = null;

		var maxW = (imgPreloader.width < opts.imgWidth) ? opts.imgWidth : imgPreloader.width;
		var maxH = (imgPreloader.height < opts.imgHeight) ? opts.imgHeight : imgPreloader.height;
		var ratio = imgPreloader.width / imgPreloader.height;
		var imgSize = getSize(r,maxW,maxH,ratio);
		
		var html = "<img id='cb.img' width='"+imgSize[0]+"' height='"+imgSize[1]+"' src='"+h+"'/>";
		$.cb.ox.popup(html,{width:imgSize[0]+30,height:imgSize[1]+60})
	}
} 

	

	
	
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

	
	//---------------- AJAX popup function -----------------------
	
	$.cb.ox.ajax = function(t,h,r) {
	// t = title for window, h = href, r = rel
	//if indicated as ajax display as such; also, show relative path links as ajax unless indicated as iframe
		var htmlSize = cb.getSize(r,opts.htmlSize.width,opts.htmlSize.height,opts.htmlSize.ratio);
		var ajaxSize = [htmlSize[0],htmlSize[1] - 5];
		
		if($("#cee_box").css("display") != "block"){ //if window currently not displaying
			$.cb.ox.append("<div id='cb.title'><h2>"+t+"</h2></div><div id='cb.ajax' style='width:"+ajaxSize[0]+"px;height:"+ajaxSize[1]+"px'></div>",htmlSize[0]+30,htmlSize[1]+40,r,"cb.ajax");
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
	
		$("#cee_ajax a.cb.ox").cb.ox(); //adds cb.ox functionality to any cb.ox links within the ajax box
	}
	
	//---------------- Video popup function -----------------------
	
	$.cb.ox.video = function(t,h,r) { // creates an embeded video popup
		
		//detect video type and get src and params
		var vidType = cb.vidType(t,h,r);
		var vidSize = cb.getSize(r,opts.videoSize.width,opts.videoSize.height,opts.videoSize.ratio);
		//create cb.ox window for video
		$.cb.ox.append("<div id='cb.vid'></div>" + "<div id='cb.title'><h2>"+t+"</h2></div>",vidSize[0] + 30,vidSize[1] + 60,r,"cb.vid");
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
	function vidType(t,h,r) {
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
	
	function imgGal(imgLinks,loc,imgW,imgH,umbrella){
		var gArray = imgLinks;
		var imgNum = loc;
		var gLength = gArray.length;
		var navW = imgW+30;
		var $cb.av = $("<div id='cb.nav'></div>").css({width:navW,height:imgH});
		var gCount = "<div id='cb.count'>Image " + (imgNum + 1) +" of "+ gLength + "</div>";
		if (imgNum > 0) {
			$cb.rev = $("<a href='#' id='cb.prev'>Previous</a>")
			$cb.rev.t = gArray[imgNum-1].title || gArray[imgNum-1].alt;
			$cb.rev
				.bind("click",function(e){e.preventDefault();imgNav($cb.rev.t, $cb.rev.attr("href"), $cb.rev.attr("rel"),umbrella);})
				.appendTo($cb.av)
				.attr({href:gArray[imgNum-1].href,rel:gArray[imgNum-1].rel});
		}
		if (imgNum < gLength-1) {
			$cb.ext = $("<a href='#' id='cb.next'>Next</a>");
			$cb.ext.t = gArray[imgNum+1].title || gArray[imgNum+1].alt;
			$cb.ext
				.bind("click",function(e){e.preventDefault();imgNav($cb.ext.t, $cb.ext.attr("href"), $cb.ext.attr("rel"),umbrella);})
				.appendTo($cb.av)
				.attr({href:gArray[imgNum+1].href,rel:gArray[imgNum+1].rel});
		}
		$("#cee_title").prepend($cb.av).append(gCount);
	}
	
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
	
	function cb.keyEvents(r,umbrella) {
		document.onkeydown = function(e){ 	
			e = e || window.event;
			var kc = e.keyCode || e.which;
			switch (kc) {
				case 27:
					removeCeebox();
					break;
				case 188:
				case 37:
					if ($("#cee_prev").size() != 0) {imgNav($cb.rev.t,$cb.rev.attr("href"),$cb.rev.attr("rel"),umbrella);};
					break;
				case 190:
				case 39:
					if ($("#cee_next").size() != 0) {imgNav($cb.ext.t,$cb.ext.attr("href"),$cb.ext.attr("rel"),umbrella);};
					break;
			}
		};
	}
	
	*/
})(jQuery);