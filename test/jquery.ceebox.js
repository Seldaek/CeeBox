$.fn.ceebox = function(opts) {
	opts = $.extend($.fn.ceebox.defaults, opts);
	this.each(function(){
		init(this,opts);
	});
	
	return this;
};

function init(elem,opts) {
	var links = $(elem).children().find("[href]");
	links.each(function(){
		$.data(this,"ceebox",true)
	});
};

$.fn.ceebox.defaults = {
	html:true,
	image:true,
	video:true
};

