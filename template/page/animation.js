
<!-- jQueryアニメーション -->

//読み込み時のアニメ
$(window).load(function() {
	$('#btn_save').animate({'marginLeft': '-10px'},500).animate({'marginLeft': '5px'},300).animate({'marginLeft': '0px'},200),'swing';
	$('#btn_load').animate({'marginLeft': '-10px'},600).animate({'marginLeft': '5px'},300).animate({'marginLeft': '0px'},200),'swing';
});

//hover時のアニメ
$(document).ready(function(){
	$('#btn_save:not(:animated)').hover(function(){
	$('#btn_save:not(:animated)').animate({'marginLeft': '-3px'},100).animate({'marginLeft': '3px'},160).animate({'marginLeft': '-2px'},100).animate({'marginLeft': '0px'},50),'swing';
	});
});
$(document).ready(function(){
	$('#btn_load:not(:animated)').hover(function(){
	$('#btn_load:not(:animated)').animate({'marginLeft': '-3px'},100).animate({'marginLeft': '3px'},160).animate({'marginLeft': '-2px'},100).animate({'marginLeft': '0px'},50),'swing';
	});
});