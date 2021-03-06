<?php
if (!isset($_SESSION)) {
	session_start();
	$_SESSION["uniqueID"] = mt_rand(); //set random id
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<title>Snakes: The Game</title>
<meta charset="UTF-8">
<link rel="StyleSheet" type="text/css" href="style.css">
<script type="text/javascript" src="http://bumbuu.com/files/js/scrije.lib.js"></script>
<script type="text/javascript" src="js/game.js"></script>
<script type="text/javascript" src="js/main.js"></script>
</head>
<body>
	<div id="main_container">
		<div id="main_topbar">
			<div id="mtbar_left">SNAKES</div>
			<div id="mtbar_right">The Game</div>
		</div>
		<div id="main_mid">
			<div id="main_game">
				<audio id="mgAudio_ambience" preload loop>
					<source src="snd/str_ambience.ogg" type="audio/ogg">
					<source src="snd/str_ambience.mp3" type="audio/mpeg">
				</audio>
				<audio id="mgAudio_music" preload loop>
					<source src="snd/str_ambience.ogg" type="audio/ogg">
					<source src="snd/str_ambience.mp3" type="audio/mpeg">
				</audio>
				<audio id="mgAudio_effects" preload>
					<source src="snd/pickup.ogg" type="audio/ogg">
					<source src="snd/pickup.mp3" type="audio/mpeg">
				</audio>
				<canvas id="mg_canvas" width="800" height="494"></canvas>
				<div id="mg_mm">
					<div id="mg_np"> <!-- player name div -->
						<div id="mg_np_t">Player Name</div>
						<div id="mg_np_d">
							Enter your preferred username below. This will be used to identify you on the leaderboards.
						</div>
						<div id="mg_np_d_e">A serious error has occurred.</div>
						<input id="mg_np_dun" type="text">
						<div id="mg_np_dc">Okay</div>
					</div>
					<div id="mg_mmi"><!--inside main menu-->
						<div class="mg_mmb" id="mg_mmpn">Play Now</div>
						<div class="mg_mmb" id="mg_mms">Settings</div>
						<div class="mg_mmb_bt" id="mg_mmb_bt_hlp">Help</div>
						<div class="mg_mmb_bt" id="mg_mmb_bt_lbd">Leaderboards</div>
					</div>
				</div>
				<div id="mg_pd"><!-- pause div -->
					<div id="mg_pd_i">
						<div class="mg_pd_bt" id="mgpdbt_st">Settings</div>
						<div class="mg_pd_bt" id="mgpdbt_lb">Leaderboards</div>
						<div class="mg_pd_bt" id="mgpdbt_hlp">Help</div>
						<div class="mg_pd_bt" id="mgpdbt_qt">Quit</div>
					</div>					
				</div>
				<div id="mg_lo"><!-- level ending -->
					<div id="mg_lo_t">Level Up!</div>
					<div id="mg_lo_d">
						Level <span>0</span> has finished. Of course, the format of this game allows for infinite levels of increasing difficulty, so if you'd like to, you can quit now while you're ahead... :P
					</div>
					<div class="mg_lo_bt" id="mg_lo_bt_cntnu">Continue</div>
					<div class="mg_lo_bt" id="mg_lo_bt_qt">Quit</div>
				</div>
				<div id="mg_go"><!-- game over -->
					<div class="mg_go_t">Game Over</div>
					<div id="mg_lo_d">
						Well, apparently, all of your lives have been lost, and that means <strong>game over</strong>. Press &quot;Continue&quot; to move on to the leaderboards.
					</div>
					<div class="mg_go_bt" id="mg_go_bt_cntnu">Continue</div>
					<div class="mg_go_bt" id="mg_go_bt_qt">Quit</div>
				</div>
				<div id="mg_go_m"><!-- game over (multiplayer) -->
					<div class="mg_go_t">Game Over</div>
					<table id="mg_go_m_tbl">
						<thead>
							<th></th>
							<th>Lives</th>
							<th>Score</th>
						</thead>
						<tbody>
							<tr>
								<td></td>
								<td></td>
								<td></td>
							</tr>
							<tr>
								<td></td>
								<td></td>
								<td></td>
							</tr>
						</tbody>
					</table>
					<div class="mg_go_bt" id="mg_go_m_bt_qt">Quit</div>
				</div>
				<div id="mg_sd"> <!-- settings div -->
					<div id="mg_sd_cb">Close</div>
					<div id="mg_sd_t">Settings</div>
					<div class="mg_sd_s" id="mg_sd_1">
						<div class="mg_sd_ntf" id="mg_sd_inun_ntf">
							<img src="img/mg_sd_inun_ntf_pnt.png">
							<div></div>
							<span></span>
						</div>
						<div class="mg_sd_lb">Name</div>
						<input id="mg_sd_inun" class="mg_sd_in" type="text">
						<div class="mg_sd_lb" style="margin-top: 10px;">Color</div>
						<div id="mg_sd_cl">
							<div id="mg_sd_cl_l">
							</div>
							<div id="mg_sd_cl_r">
								<div class="mg_sd_cl_h">
									<div class="mg_sd_sll">r</div>
									<div class="mg_sd_sl" id="mg_sd_sl_cr" style="margin-top: 7px;"><div class="mg_sd_slh"></div></div>
								</div>
								<div class="mg_sd_cl_h">
									<div class="mg_sd_sll">g</div>
									<div class="mg_sd_sl" id="mg_sd_sl_cg" style="margin-top: 7px;"><div class="mg_sd_slh"></div></div>
								</div>
								<div class="mg_sd_cl_h">
									<div class="mg_sd_sll">b</div>
									<div class="mg_sd_sl" id="mg_sd_sl_cb" style="margin-top: 7px;"><div class="mg_sd_slh"></div></div>
								</div>
							</div>
						</div>
						<div class="mg_sd_lb" style="margin-top: 10px;">Primary Controls</div>
						<div class="mg_sd_lb_descr">
							When playing in multiplayer mode, secondary controls will be used for the opposing player.
						</div>
						<div id="mg_sd_cn">
							<div class="mg_sd_cnk" id="mg_sd_cnk_1" style="margin-left: auto; margin-right: auto;">W</div>
							<div class="mg_sd_cnk" id="mg_sd_cnk_2" style="margin-left: 47px; float: left; clear: none;">A</div>
							<div class="mg_sd_cnk" id="mg_sd_cnk_3" style="margin-left: 5px; float: left; clear: none;">S</div>
							<div class="mg_sd_cnk" id="mg_sd_cnk_4" style="margin-left: 5px; float: left; clear: none;">D</div>
							<div id="mg_sd_cnb">
								<div class="mg_sd_cnko" id="mg_sd_cnkoa">Arrow Keys</div>
								<div class="mg_sd_cnko" id="mg_sd_cnkow" style="float: right;">WASD Keys</div>
							</div>
						</div>
					</div>
					<div class="mg_sd_s" id="mg_sd_2">
						<div class="mg_sd_ntf" id="mg_sd_inun2_ntf">
							<img src="img/mg_sd_inun_ntf_pnt.png">
							<div></div>
							<span></span>
						</div>
						<div class="mg_sd_ntf" id="mg_sd_ismultiplayer_ntf">
							<img src="img/mg_sd_inun_ntf_pnt.png">
							<div></div>
							<span></span>
						</div>
						<div class="mg_sd_lb">Player 2's Name</div>
						<input id="mg_sd_inun_2" class="mg_sd_in" type="text">
						<div class="mg_sd_lb" style="margin-top: 10px;">Gameplay</div>
						<div class="mg_sd_lblh">
							<div class="mg_sd_lbl">Local Multiplayer</div>
							<div class="mg_sd_chkbx" id="mg_sd_chkbx_ismultiplayer">
								<img src="img/mg_sd_check.png">
							</div>
						</div>
						<div class="mg_sd_lblh">
							<div class="mg_sd_lbl">Special Effects</div>
							<div class="mg_sd_chkbx" id="mg_sd_chkbx_specialeffects">
								<img src="img/mg_sd_check.png">
							</div>
						</div>
						<div class="mg_sd_lblh">
							<div class="mg_sd_lbl">Hints</div>
							<div class="mg_sd_chkbx" id="mg_sd_chkbx_hints">
								<img src="img/mg_sd_check.png">
							</div>
						</div>
						<div class="mg_sd_lb">Volume</div>
						<div class="mg_sd_snh">
							<div class="mg_sd_sll" style="text-indent: 4px;">Ambience</div>
							<div class="mg_sd_sl" type="mg_snd" id="mg_sd_snd_ambience" style="margin-top: 7px; width: 186px;"><div class="mg_sd_slh"></div></div>
						</div>
						<div class="mg_sd_snh">
							<div class="mg_sd_sll" style="text-indent: 4px;">Music</div>
							<div class="mg_sd_sl" type="mg_snd" id="mg_sd_snd_music" style="margin-top: 7px; width: 186px;"><div class="mg_sd_slh"></div></div>
						</div>
						<div class="mg_sd_snh">
							<div class="mg_sd_sll" style="text-indent: 4px;">Effects</div>
							<div class="mg_sd_sl" type="mg_snd" id="mg_sd_snd_effects" style="margin-top: 7px; width: 186px;"><div class="mg_sd_slh"></div></div>
						</div>
						<div class="mg_sd_lb">Debug</div>
						<div class="mg_sd_lblh">
							<div class="mg_sd_lbl">Show FPS</div>
							<div class="mg_sd_chkbx" id="mg_sd_chkbx_fps">
								<img src="img/mg_sd_check.png">
							</div>
						</div>
					</div>
				</div>
				<div id="mg_lb"><!-- leaderboards -->
					<div id="mg_lb_td">
						<div id="mg_lb_td_top">
							<span></span>, your score is:
						</div>
						<div id="mg_lb_td_btm">
							<span></span>
						</div>
					</div>
					<div id="mg_lb_lst_h">
						<table id="mg_lb_lst">
							<thead>
								<th>Name</th>
								<th>Score</th>
								<th>Level</th>
								<th>Rank</th>
							</thead>
							<tbody>
								<tr>
									<td>n&#47;a</td>
									<td>n&#47;a</td>
									<td>n&#47;a</td>
									<td>1</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div class="mg_lb_bt" id="mg_lb_bt_qt">Okay</div>
				</div>
				<div id="mg_hlp"><!-- help menu -->
					<div class="mg_hlp_ttl">Controls</div>
					<table>
						<tbody>
							<tr>
								<td><div class="mg_hlp_key">&#x25B2;</div> or <div class="mg_hlp_key">W</div></td>
								<td>- Up</td>
							</tr>
							<tr>
								<td><div class="mg_hlp_key">&#x25C0;</div> or <div class="mg_hlp_key">A</div></td>
								<td>- Left</td>
							</tr>
							<tr>
								<td><div class="mg_hlp_key">&#x25BC;</div> or <div class="mg_hlp_key">S</div></td>
								<td>- Down</td>
							</tr>
							<tr>
								<td><div class="mg_hlp_key">&#x25B6;</div> or <div class="mg_hlp_key">D</div></td>
								<td>- Right</td>
							</tr>
							<tr>
								<td><div class="mg_hlp_key">P</div></td>
								<td>- Pause Game</td>
							</tr>
						</tbody>
					</table>
					<div id="mg_hlp_qt">Okay</div>
				</div>
				<div id="mg_pb"><!-- pause button -->
					<div class="mg_pb_p"></div>
					<div class="mg_pb_p"></div>
					<div class="mg_pb_pl"></div>
				</div>
			</div>
			<div id="mm_descr">
				What is Snakes?<br>
				Snakes is a simple game involving the dexterity of the player's fingers as he or she tries to navigate their creature through an empty void, dotted by only a few items. The point of the game is to eat the items and grow to longer sizes, although the game's difficulty increases as a result of this size growth. Anyway, as a result of a challenge, and some holiday spirit, I took it upon myself to make a version of the classic, albeit with some...touches...of my own, completely coded in HTML, JavaScript, and CSS. It also uses the <span style="font-family: Courier, Monospace;">&lt;canvas&gt;</span> tag element to render the main portion of the game. <br><br>
				After some coding, and a little ingenuity, I've somewhat managed to make something...playable. Give it a try, and be sure to tell me what you think about it.
			</div>
			<div id="mm_play">Play Snakes</div>
		</div>
		<div id="main_bbar">
			<div id="mbb_right">By Princeton Ferro</div>
		</div>
	</div>
</body>
</html>
