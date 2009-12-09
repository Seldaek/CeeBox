
$(document).ready(function(){
	//load ceebox
	//$(".ceebox").ceebox();
	var testing = true
	if (testing) {
	
	//qunit testing
	var tst = {};
	tst.links = $(".ceebox").children().find("[href]");
	tst.len = tst.links.length;
	tst.linkattr = []
	
	function grabLinkAttr() {
		tst.links.each(function(i){
			tst.linkattr[i] = {data:tst.links.eq(i).data("ceebox"),linkdata:tst.links.eq(i).attr("data-ceebox"),rel:tst.links.eq(i).attr("rel")};
			if (tst.linkattr[i].rel) {
				var rgx = new RegExp($.fn.ceebox.relMatch.type);
				var tmp = rgx.exec(tst.linkattr[i].rel);
				tst.linkattr[i].type = lastItem(tmp);
			}
		});
	}
	
	module("(all links)", {
		setup: function(){$(".ceebox").ceebox();grabLinkAttr();},
		teardown: function(){}
	});
	test("do all " + tst.len + " links have correct ceebox type data?",function(){
		expect(tst.len);
		tst.links.each(function(i){
			var expected = tst.linkattr[i].type || tst.linkattr[i].linkdata;
			equals(tst.linkattr[i].data.linkType,expected,"type: " + tst.linkattr[i].linkdata + "; rel:" + tst.linkattr[i].linkType);
		});
	});
	//test options
	tst.opts = {};
	$.each($.fn.ceebox.defaults, function(optName,optVal){
		module("(Option: " + optName + ")",{
			setup: function(){
				tst.opts = {};
				tst.opts[optName] = false; //set current option to false
				$(".ceebox").ceebox(tst.opts);
				tst.opts = $.extend({},$.fn.ceebox.defaults,tst.opts);
				grabLinkAttr();
			},
			teardown: function(){}
		});
		test(optName +" set to false in options?",function(){
			expect(cbtst.opts.length);
			$.each(cbtst.opts,function(name){
				equals(cbtst.opts[name],tst.opts[name],name);
			});
		});
		if(optName === "image" || optName === "video" || optName === "html") {
			test("do all " + tst.len + " links have ceebox type data and are "+ optName +" set to false. Unless set otherwise by rel?",function(){
				expect(tst.len*2);
				tst.links.each(function(i){
					var expected = tst.linkattr[i].type || tst.linkattr[i].linkdata;
					equals(tst.linkattr[i].data.linkType,expected,"type: " + tst.linkattr[i].linkdata + "; rel:" + tst.linkattr[i].type);
					equals(tst.linkattr[i].data.on,tst.opts[expected],"on");
				});
			});
		}
		if(optName === "htmlGallery" || optName === "videoGallery" || optName === "imageGallery") {
			test("do all " + tst.len + " links have ceebox type data and are "+ optName +" set to false.",function(){
				expect(tst.len*2);
				tst.links.each(function(i){
					var expected = tst.linkattr[i].type || tst.linkattr[i].linkdata;
					equals(tst.linkattr[i].data.linkType,expected,"type: " + tst.linkattr[i].linkdata + "; rel:" + tst.linkattr[i].type);
					var gallery = (tst.linkattr[i].data.gallery) ? tst.linkattr[i].data.gallery.on : false;
					//ok(tst.linkattr[i].data.gallery, gallery)
					equals(gallery,tst.opts[expected + "Gallery"],"gallery");
				});
			});
		}
	});
	} else {$(".ceebox").ceebox();}
	
});

//generic helper functions
function isFunction(a) {return typeof a == 'function';}