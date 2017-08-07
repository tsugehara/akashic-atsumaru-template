
<!-- jQueryアニメーション -->

//読み込み時のアニメ
$(window).load(function() {
	$('#btn_save').animate({'marginLeft': '-10px'},500).animate({'marginLeft': '5px'},300).animate({'marginLeft': '0px'},200),'swing';
	$('#btn_load').animate({'marginLeft': '-10px'},600).animate({'marginLeft': '5px'},300).animate({'marginLeft': '0px'},200),'swing';
});

//ロードセーブボタンhover時のアニメ
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


//シークバーの長さ※0～580px
function seek_width(percent){
    var seek_width;
    seek_width = 5.8*percent;
	if(seek_width > 580){seek_width=580;}
	return seek_width;
}
//スライダーの位置（シークバーの長さに合わせて)※197～777px

//↓↓seek_width()にバーの位置の割合％を入力↓↓
$(window).load(function() {
	$('#seek_blue').css('width', seek_width(100));
	$('#slyder').css('left', seek_width(100)+197);
});

//シークバーメニュー
var playstop_flag = 1;
$(document).ready(function(){
	$('#playstop').hover(function() {
		$(this).css('filter','grayscale(0%) brightness(100%)');},
		function(){$(this).css('filter','grayscale(100%) brightness(500%)');
	});
	
	$('#playstop').click(function(){
		if(playstop_flag===0){
			$('#playstop').css('background-image','url(page/btn_stop_on.png)');
			$('#seek_blue').css('background-image','url(page/bar_play.gif)');
			playstop_flag =1;
		}
		else{
			$('#playstop').css('background-image','url(page/btn_play_on.png)');
			$('#seek_blue').css('background-image','url(page/bar_stop.gif)');
			playstop_flag =0;
		}
	});
});

var speed_flag = 3;
$(document).ready(function(){
	$('#speed').hover(function() {
		$(this).css('filter','grayscale(0%) brightness(100%)');},
		function(){$(this).css('filter','grayscale(100%) brightness(500%)');
	});
	
	$('#speed').click(function(){
		if(speed_flag===5){
			$('#speed').css('background-image','url(page/speed1_on.png)');
			speed_flag =1;
		}
		else if(speed_flag===3){
			$('#speed').css('background-image','url(page/speed5_on.png)');
			speed_flag =5;
		}
		else{
			$('#speed').css('background-image','url(page/speed3_on.png)');
			speed_flag =3;
		}
	});
});