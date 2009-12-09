$.fn.ceebox = function(opts) {
	opts = $.extend({},$.fn.ceebox.defaults, opts);
	var selector = $(this).selector
	this.each(function(){
		init(this,selector,opts);
	});
	cbtst.opts = opts
	return this;
};

function init(elem,selector,opts) {
	var links = $(elem).children().find("[href]");
	var linkArray = [], galleryArray = [], galleryId = 0;
	links.each(function(linkId){
		var metadata = ($.metadata) ? $(alink).metadata() : false;
		opts = (metadata) ? $.extend({}, opts, metadata) : opts; // metadata plugin support (applied on link element)
		var $link = $(this), href = $link.attr("href"), rel = $link.attr("rel"), type;
		
		if (rel) {
			var m = {};
			$.each($.fn.ceebox.relMatch,function(i,v){m[i] = v.exec(rel);});
			if (m.type) {
				m.type = lastItem(m.type);
				if (m.type === "iframe" || m.type === "ajax") {m.type = "html";}
				type = m.type;
			}
			if (m.modal) {opts.modal = true;}
			if (m.nonmodal) {opts.modal = false;}
			if (m.width) {opts[type + "Width"] = Number(lastItem(m.width));}
			if (m.height) {opts[type + "Height"] = Number(lastItem(m.height));}
			if (m.ratio) {opts[type + "Ratio"] = lastItem(m.ratio); r = (Number(r)) ? Number(r) : String(r);}
		}
		if (!type) {
			$.each(types,function(i){
				if (href.match(types[i].rgx)) {
					type = i;
					return false;
				};
			});
		}
		
		linkArray[linkId] = {
			$link: $link,
			settings: {
				on:opts[type],
				linkType:type,
				modal:opts.modal,
				maxwidth:opts[type + "Width"],
				maxheight:opts[type + "Height"],
				ratio:opts[type + "Ratio"],
				opts:metadata
			}
		};
		if (opts[type + "Gallery"]) {galleryArray[galleryId] = $link;galleryId++;}
	});
	
	var galleryLen = galleryArray.length;
	var galleryId = 0;
	$.each(linkArray, function(i){
		if (linkArray[i].$link === galleryArray[galleryId]) {
			linkArray[i].settings.gallery = {on:true,galleryLen:galleryLen,currentId:galleryId}
			if (galleryId> 0) {linkArray[i].settings.gallery.prevId = galleryArray[galleryId-1];}
			if (galleryId < galleryLen - 1) {linkArray[i].settings.gallery.nextId = galleryArray[galleryId+1];}
			galleryId++;
			if (!$.support.opacity && $(elem).is("map")) {$(linkArray[i].$link).click(function(e){e.preventDefault();});} //IE falls to return false if using image map with ceebox gallery
		}
		linkArray[i].$link.data("ceebox",linkArray[i].settings);
	});
	
	$(selector).die().live("click", function(e){
		var tgt = $(e.target).closest("[href]");
		var tgtData = tgt.data("ceebox");
		if (tgtData && tgtData.on) {
			var linkOpts = (tgtData.opts) ? $.extend({}, opts, tgtData.opts) : opts; // grab link specific opts
			//$.fn.ceebox.overlay(linkOpts);
			if (tgtData.linkType == "image") {
				var imgPreload = new Image();
				imgPreload.onload = function(){
					var w = imgPreload.width,h=imgPreload.height,r = w/h;
					//set image max sizes to so that image doesn't scale larger
					w = getSmlr(w,tgtData.maxwidth);
					h = getSmlr(h,tgtData.maxheight);
					var size = getSize(w,h,r,opts.margin);
					debug(size);
					//$.fn.ceebox.popup(tgt,$.extend(linkOpts,{type:tgtData.type},{gallery:tgtData.gallery})); //build popup
				}
				imgPreload.src = $(tgt).attr("href");
			} else {
				var size = getSize(tgtData.maxwidth,tgtData.maxheight,tgtData.ratio,opts.margin);
				debug(size);
				//$.fn.ceebox.popup(tgt,$.extend(linkOpts,{type:tgtData.type},{gallery:tgtData.gallery}));} //build popup
			}
			return false;
		}
	});
};
// ratio shortcuts
$.fn.ceebox.ratios = {"4:3": 1.333, "3:2": 1.5, "16:9": 1.778,"1:1":1,"square":1};

$.fn.ceebox.defaults = {
	html: true,
	image: true,
	video: true,
	modal: false,
	titles: true,
	htmlGallery: true,
	imageGallery: true,
	videoGallery: true,
	videoWidth: false, //set max size for all video links
	videoHeight: false, 
	videoRatio: "16:9",
	htmlWidth: false, //set max size for all html links
	htmlHeight: false,
	htmlRatio: false,
	imageWidth: false, //set max size for all image links (image ratio is determined by the image itself)
	imageHeight: false,
	margin: 80
};

var cbtst = {}

var types = {
	image: {rgx:/\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$/i},
	video: {rgx:/youtube\.com\/watch/i},
	html: {rgx:/./i}
}

function getSize(w,h,r,margin){
	var p = pageSize();
	margin = margin*2;
	var w = getSmlr(w,p.width-margin);
	var h = getSmlr(h,p.height-margin);
	if (r) { //if ratio value has been passed, adjust size to the ratio
		// test if it's a ratio name shortcut
		if (!Number(r)) r = ($.fn.ceebox.ratios[r]) ? Number($.fn.ceebox.ratios[r]) : 1;
		//makes sure that it's smaller than the max width and height
		if (w/h > r) w = parseInt(h * r,10);
		if (w/h < r) h = parseInt(w / r,10);
	}

	return {
		width: w,
		height: h
	};
}
// pageSize function used in box and overlay function
var pageSize = function(){
	var d = document,de = d.documentElement;
	return {
		width: (window.innerWidth || self.innerWidth || (de&&de.clientWidth) || d.body.clientWidth), 
		height: (window.innerHeight || self.innerHeight || (de&&de.clientHeight) || d.body.clientHeight)
	};
};
function debug(a) {window.console.log(a)}
$.fn.ceebox.relMatch = {
	width: /(?:width:)([0-9]+)/i, // force a max width
	height: /(?:height:)([0-9]+)/i, // force a max height
	ratio: /(?:ratio:)([0-9\.:]+)/i, // force a ratio
	type: /(?:type:)(image|video|html|iframe|ajax)/i, // force a ratio
	modal: /modal:true/i, // set as modal
	nonmodal: /modal:false/i, // set as nonmodal (only useful if modal is the default)
	videoSrc:/(?:videoSrc:)(http:[\/\-\._0-9a-zA-Z:]+)/i, // add a different src url for a video this is for help supporting sites that use annoying src urls, which is any site that uses media.mtvnservices.com. Also as bonus, with a bit of ingenuity this can be used to RickRoll people.
	videoId:/(?:videoId:)([\-\._0-9a-zA-Z:]+)/i //add an id which is useful for Daily Show and other sites like the above.
};


//------------------------------ Generic helper functions ------------------------------------

function getSmlr(a,b) {return ((a && a < b) || !b) ? a : b;};
function isFunction(a) {return typeof a == 'function';};
function lastItem(a) {var l = a.length;return (l > 1) ? a[l-1] : a;};
