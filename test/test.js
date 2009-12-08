
$(document).ready(function(){
	//load ceebox
	$(".ceebox").ceebox();
	
	//qunit testing
	var tester = {};
	tester.links = $(".ceebox").children().find("[href]");
	
	module("link sorter");
	
	test("do all " + tester.links.length + " links have ceebox data?",function(){
		expect(tester.links.length);
		tester.links.each(function(i){
			ok($(tester.links.eq(i)).data("ceebox"),"testing data");
		});
	});
});

//generic helper functions
function isFunction(a) {return typeof a == 'function';}
