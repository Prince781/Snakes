/* main.js
 * The main script for the Snakes Game page.
 * March 2012, Princeton Ferro
 */

function vCenter(){ //maintain the div's vertical center
	var div = $_("#main_container");
	div.css("margin-top", Math.floor((window.innerHeight-div.offsetHeight())/2)+"px");
}
window.onload = function(){
	vCenter();
	$_("#mm_play").click(function(){ //start the game on the function's click
		$_(this).click(null); //disable clicking ability
		var mg = $_("#main_game");
		mg.effects.fadeTo(100, 500); //animate the appearance of the game
		mg.effects.toPosition("margin-left", -10, 2000);
		mg.effects.toDimensions(800, 495, 2000, function(){
			var ng = new SnakesGame();
			ng.cnv = document.getElementById("mg_canvas"); //define the game's canvas
			ng.mmdiv = document.getElementById("mg_mm"); //define the game's main menu
			ng.stdiv = document.getElementById("mg_sd"); //define the game's settings div
			ng.init();
		});
	});	
	$_("audio").attr("volume",0);
};
window.onresize = vCenter;
