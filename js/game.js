/**********************************************
 * game.js
 * Main JavaScript file for the Snakes game.
 * DISCLAIMER:
 * --------------------------------------------
 * This code is free to redistribution and 
 * modification, as long as this statement
 * remains intact.
 * --------------------------------------------
 * March 2012, Princeton Ferro
 **********************************************/
var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.requestAnimationFrame = requestAnimationFrame;

function SnakesGame() { //must be called using the "new" JavaScript keyword
	var gThis = this; //global reference to this object
	var intervs = {}; //the intervals, used for looping all functions
	var cx = {}; //additional ScriJe "2d+" context for canvas
	var g = {};  //the main game component
	var is = {}; //image source loader
	var un = {}; //username validity information
	function Hue(hue) { //hue=0->1
		//generates a hsv color, with saturation and value at 1
		var h=hue*360;
		with(Math)
			return {
				r: round(h<=60||h>=300?255:(h>=120&&h<=240?0:(h>240?255*(h-240)/60:255*(1-(h-60)/60)))),
				g: round(h>=60&&h<=180?255:(h>=240?0:(h<60?255*h/60:255*(1-(h-180)/60)))),
				b: round(h>=180&&h<=300?255:(h<=120?0:(h>300?255*(1-(h-300)/60):255*(h-120)/60))),
				a: 1
			};
	}
	var bd = { //various functions pertaining to the geometry of the canvas
		os: function() { //the offsets, in x and y, of the coordinates of the board within the canvas
			with (Math)
				return {
					x1: floor((gThis.cnv.width % 10)/2),
					x2: ceil((gThis.cnv.width % 10)/2),
					y1: floor((gThis.cnv.height % 10)/2),
					y2: ceil((gThis.cnv.height % 10)/2)
				};
		},
		cv: function() { //the dimensions of the board within the canvas
			return {
				x: gThis.cnv.width-bd.os().x1-bd.os().x2,
				y: gThis.cnv.height-bd.os().y1-bd.os().y2
			};
		},
		gd: function() { //the amound of grids, for x and y, of the board within the canvas. SHOULD BE A WHOLE NUMBER
			return {
				x: bd.cv().x/10 - 1,
				y: bd.cv().y/10 - 1
			};
		},
		ps: function(c) { //the pixel-coordinates on the board, for x and y, of an input grid point
			return {
				x: bd.os().x1+(c.x*10),
				y: bd.os().y1+(c.y*10)
			};
		},
	};
	this.cnv = {}; //the game's canvas. MUST be defined before initialization
	this.stdiv = {}; //the game's "Settings" <div> element. MUST be defined before initialization
	this.mmdiv = {}; //the game's "Main Menu" <div> element. MUST be defined before initialization
	var debugInfo = { //debug information for measuring performance and other variables
		lu: 0, //last update - the last time at which the frame count was updated (within 1s)
		fc: 0, //the frame count since the last update time
		fps: 0 //the amount of frames per second
	};
	var gen = { //list of "general" variables, such as game states and audio
		/*******************************************************************
		* The current state of the game. Can be one of the following:
		* menu --> The main menu is visible.
		* game --> The game is playing, and current visible.
		* paused --> The game is paused, and currently visible.
		* interim --> A new level has loaded, but the player has not given
		* 			  input yet.
		* complete --> The level has ended, and there is a prompt for the 
		* 			   user to continue.
		* over --> The game has finished and is currently visible, as well
		* 		   as the score upload prompt.
		* help --> The help menu is visible.
		* lboards --> The leaderboards are currently visible.
		********************************************************************/
		st: "menu", //the current state of the game
		sst: "menu",
		/* the previous state of the game. This is especially useful for transitions between
		   pause menus and back to gameplay */
		snd: { //the sound array, for storing sound information
			ambience: {
				vol: 0.3,
				on: false
			},
			music: {
				vol: 0.5,
				on: false
			},
			effects: {
				vol: 0.7,
				on: false
			}
		},
		//some configurable options for gameplay
		ismultiplayer: false,
		specialeffects: true,
		hints: true,
		fps: false
	};
	var mm = { //the main components of the main menu, when the game has not been started. Has a similar structure to this.g
		en: [] //the array of enemies, except as passive creatures
	};
	var s = { //info for the appearance of the settings menu
		v: false, //the visibility
		show: function() {
			if (s.v) return false;
			s.v = true;
			$_("#mg_sd").effects.fadeTo(100, 500);
			$_("#mg_sd_inun").value(g.pl[0].n);
			$_("#mg_sd_inun_2").value(g.pl[1].n);
		},
		hide: function() {
			var rs = un.chk($_("#mg_sd_inun").value());
			var rs2 = un.chk($_("#mg_sd_inun_2").value());
			if (!s.v) return false;
			else if (!rs.v){
				s.ntfy(rs.r);
				return false;
			}
			$_("#mg_sd").effects.fadeTo(0, 500, function(){
				s.v = false;
			});
			g.pl[0].n = $_("#mg_sd_inun").value(); //set the game player's name
			g.pl[1].n = $_("#mg_sd_inun_2").value(); //set the second game player's name
		},
		ntfy: function(msg){ //show notification
			if (s.t[0]) clearTimeout(s.t[0]);
			$_("#mg_sd_inun_ntf span").html(msg);
			$_("#mg_sd_inun_ntf").effects.fadeTo(100,400);
			s.t[0] = setTimeout(function(){
				$_("#mg_sd_inun_ntf").effects.fadeTo(0,400);
			},3000);
		},
		t: [] //array of timers
	};
	un = { //info for username validity
		chk: function(username) { //validation
			if (!username||typeof username=="undefined"||username=="")
				return {r:"The text field is currently blank. Please provide a username.",v:false};
			else if (username.length<3)
				return {r:"Too short. Your username should be at least 3 characters.",v:false};
			else if (username.length>29)
				return {r:"Your username is too long. Please shorten it to under 30 characters.",v:false};
			else if (/\W/gi.test(username))
				return {r: (/\s/gi.test(username) ? "Please remove all spaces from your username." : "Only alphanumeric characters are permitted."),v:false};
			else return {r:"",v:true};
		}
	};
	is = { //info for the image array
		l: [], //list of loaded images
		a: function(loc) {
			var img = new Image();
			img.src = loc;
			is.l.push(img);
		}
	};
	g = { //the main components of the game, when started
		vStr: { //the version string of the game
			c: $_.newColor(122,167,184,0), //the render color
			ft: 0, //the last fade time
			text: "Version 1.1"
		},
		sted: false, //whether or not the game has started
		cSt: function(s) { //function to change the current game state
			if (s=="paused") {
				g.pt=(new Date()).getTime();
				$_("#mg_pd").effects.fadeTo(100,300);
			} else if (s=="game"&&gen.st=="paused") {
				g.rt=(new Date()).getTime();
				g.to += g.rt-g.pt;
				$_("#mg_pd").effects.fadeTo(0,300);
			}
			if (s!="paused") {
				$_(".mg_pb_p").effects.fadeTo(100,300);
				$_(".mg_pb_pl").effects.fadeTo(0,300);
			} else {
				$_(".mg_pb_p").effects.fadeTo(0,300);
				$_(".mg_pb_pl").effects.fadeTo(100,300);
			}
			gen.sst = gen.st;
			gen.st = s;
		},
		rSt: function() { //function to revert the game state to the previous saved state
			var rv = gen.sst;
			if (rv=="paused") {
				g.pt=(new Date()).getTime();
				$_("#mg_pd").effects.fadeTo(100,300);
			} else if (rv=="game"&&gen.st=="paused") {
				g.rt=(new Date()).getTime();
				g.to += g.rt-g.pt;
				$_("#mg_pd").effects.fadeTo(0,300);
			}
			if (s!="paused") {
				$_(".mg_pb_p").effects.fadeTo(100,300);
				$_(".mg_pb_pl").effects.fadeTo(0,300);
			} else {
				$_(".mg_pb_p").effects.fadeTo(0,300);
				$_(".mg_pb_pl").effects.fadeTo(100,300);
			}
			gen.sst = gen.st;
			gen.st = rv;
			return rv;
		},
		bg: { //the array for the background gradient
			//reddish color is $_.newColor(90,21,42,0)
			//bluish color is $_.newColor(21,79,90,0)
			co: { //the list of color opacities, at different points in the gradient
				0: 0.9,
				0.1: 0.6,
				0.8: 0
			},
			c: $_.newColor(21,79,90,0), //the current color of the gradient
			olc: $_.newColor(21,79,90,0), //the old color of the gradient
			nc: $_.newColor(21,79,90,0), //the new color of the gradient
			v: true, //whether or not it is visible
			t: 0 //time at which color transition is initiated
		},
		tb: { //the array for the top bar
			v: false, //visibility
			an: "", //current animation
			at: 0, //animation timestamp
			p: { //position
				x: 0,
				y: -24
			},
			np: { //new position
				x: 0,
				y: -24
			},
			to: { //text offset
				y: 6
			},
			d: { //dimensions
				w: 0, //width
				h: 24, //height
			},
			c: { //colors
				bg: $_.newColor(32,45,52,0) //background color
			},
			nc: { //new colors
				bg: $_.newColor(32,45,52,0)
			},
			s: function() { //show
				if (g.tb.an=="show") return;
				g.tb.an = "show";
				g.tb.np.y = 0;
				g.tb.nc.bg.a = 0.4;
				g.tb.at = (new Date()).getTime();
			},
			h: function() { //hide
				if (g.tb.an=="hide") return;
				g.tb.an = "hide";
				g.tb.np.y = -24;
				g.tb.nc.bg.a = 0;
				g.tb.at = (new Date()).getTime();
			}
		},
		pg: { //info for the progress bar
			d: { //dimensions
				w: 140,
				h: 10
			},
			p: { //position
				x: 0, //defined at init
				y: 0  //defined at init
			},
			c: $_.newColor(54,164,204,0.8),
			ib: { //inside bar
				d: {w:0}, //width set at init
				nd: {w:0} //set at init
			},
			an: { //animation values
				iat: false,
				iit: false
			}
		},
		a: { //list of instanced animations
			ls:[],
			a: function(px,py,t,c) { //add
				/*****
				 * types:
				 * 0 - sparkle effect
				******/
				g.a.ls.push({
					int: 0, //initial time
					p: {x:px,y:py}, //position
					t: ([1][t]?t:0), //type
					cl: (typeof c!="object"?{r:0,g:0,b:0,a:1}:c)
				});
			}
		},
		lv: 0, //the current game level
		olv: 0, //the original game level, prior to initialization
		gl: 0, //goal for the current level
		glc: false, //whether or not the goal has been completed
		glct: 0, //the time of goal completion
		plc: 2, //maximum player count
		pl: [], //the player list (defined during initialization)
		en: [], //the array of enemies
		pk: [], //the list of pickups
		lpa: 0, //the last time a pickup was added
		ap: function() { //function to add a new pickup to the game
			var pc = [];
			for (var i=1; i<bd.gd().x-1; i++)
				for (var j=1; j<bd.gd().y-1; j++) {
					var conflict = false;
					for (var k=0; k<g.en.length; k++){
						for (var l=0; l<g.en[k].p.length; l++)
							conflict = (g.en[k].p[l].x == i && g.en[k].p[l].y == j ? true : conflict);
					}
					for (var pln=0; pln<(gen.ismultiplayer?g.plc:1); pln++)
						for (var k=0; k<g.pl[pln].p.length; k++)
							conflict = (g.pl[pln].p[k].x == i && g.pl[pln].p[k].y == j ? true : conflict);
					for (var k=0; k<g.pk.length; k++)
						conflict = (g.pk[k].p.x == i && g.pk[k].p.y == j ? true : conflict);
					if (!conflict) pc.push({x:i,y:j}); //if the coordinate is good
				}
			if (pc.length==0) return false;
			//var pType = Mathf.rand(0,100)==50?2:(Mathf.rand(0,100)>85?1:0);
			var pType = Mathf.rand(0,100)>80+((g.pl[0].lv>g.pl[1].lv?g.pl[1].lv:g.pl[0].lv)*6)?2:(Mathf.rand(0,100)>90?1:0);  //the type of pickup
			var rCl = Hue(Math.random());
			g.pk.push({ //add the new pickup
				p: Mathf.randVal(pc), //choose a random coordinate
				c: { //add a new color
					r: rCl.r,
					g: rCl.g,
					b: rCl.b,
					a: 0,
					oa: 0 //old opacity
				},
				i: g.gt, //the time of instantiation
				f: false, //whether or not the item is fading
				ft: 0, //the time of fading
				t: pType
				/********************
				 * Pickup types are:
				 * 0 - normal
				 * 1 - poison
				 * 2 - life
				*********************/
			});
			return true;
		},
		hnts: { //game hints
			key: {
				p: {}, //coordinates defined at run time
				ft: 0, //fade time
				cK: 0, //the current key being faded
				o: 0, //current opacity (of fading key)
				bw: 40, //box width, the width of the individual keys
				sp: 4, //spacing between the keys
				lmod: 0 //the last mod value
			}
		},
		gt: 0, //the game time interval
		pt: 0, //the time of pausing
		rt: 0, //the time of resuming
		to: 0, //the time offset (current time - to)
		glA: 1, //the global alpha value
		glAat: 0, //time of global alpha animation start time
		nl: function() { //make preparations for the next level
			if (gen.st=="interim") return false;
			if (gen.st=="complete")
				$_("#mg_lo").effects.fadeTo(0,1000);
			for (var pln=0; pln<(gen.ismultiplayer?g.plc:1); pln++) {
				g.pl[pln].p.push({x:Mathf.rand(5,bd.gd().x-5),y:Mathf.rand(5,bd.gd().y-5)});
				g.pl[pln].s+=g.pl[pln].cs; //reset scores
				g.pl[pln].cs=0;
			}
			g.cSt("interim");
		},
		slb: function() { //show the leaderboards normally
			if ($_("#mg_lb_td").css('display')!='none')
				$_("#mg_lb_td").effects.fadeTo(0,500);
			$_("#mg_mmi").effects.fadeTo(0,500);
			g.cSt("lboards");
			if ($_("#mg_pd").css('display')!='none')
				$_("#mg_pd").effects.fadeTo(0,500,function() {
					$_("#mg_pd").css('display','none');
				}); //hide pause div
			$_("#mg_lb").effects.fadeTo(100,500); //show the leaderboards
			$_("#mg_lb").effects.toHeight(204,500);
			intervs.lbrds = setTimeout(g.glb,1000); //get leaderboards information
		},
		qlb: function() { //quit leaderboards
			if (gen.sst=="paused") {
				$_("#mg_pd").effects.fadeTo(100,500,g.rSt); //revert state
				$_("#mg_lb").effects.fadeTo(0,500,function() {
					$_("#mg_lb").css('display','none');
				});
			} else g.qt(); //quit to main menu
		},
		shlp: function() { //show help
			$_("#mg_mmi").effects.fadeTo(0,500);
			g.cSt("help");
			if ($_("#mg_pd").css('display')!='none')
				$_("#mg_pd").effects.fadeTo(0,500,function() {
					$_("#mg_pd").css('display','none');
				}); //hide pause div
			$_("#mg_hlp").effects.fadeTo(100,500); //show help menu
		},
		qhlp: function() { //quit help
			if (gen.sst=="paused") {
				$_("#mg_pd").effects.fadeTo(100,500,g.rSt); //revert state
				$_("#mg_hlp").effects.fadeTo(0,500,function() {
					$_("#mg_hlp").css('display','none');
				});
			} else g.qt(); //quit to main menu
		},
		qt: function() { //quit to the main menu
			g.cSt("menu");
			$_("#mg_mmi").effects.fadeTo(100,500); //show the main menu
			//hide other items, and reset values
			$_("#mg_np").effects.fadeTo(0,500,function() {
				$_("#mg_np").css('display','none');
			});
			$_("#mg_pd").effects.fadeTo(0,500,function() {
				$_("#mg_pd").css('display','none');
			});
			$_("#mg_lo").effects.fadeTo(0,500,function() {
				$_("#mg_lo").css('display','none');
			});
			$_("#mg_lb").effects.fadeTo(0,500,function() {
				$_("#mg_lb").css('display','none');	
			});
			$_("#mg_go").effects.fadeTo(0,500,function() {
				$_("#mg_go").css('display','none');
			});
			$_("#mg_go_m").effects.fadeTo(0,500,function() {
				$_("#mg_go_m").css('display','none');
			});
			$_("#mg_hlp").effects.fadeTo(0,500,function() {
				$_("#mg_hlp").css('display','none');
			});
			$_("#mg_go_m_tbl td").html(""); //clear html
			g.tb.h();
			for (var pln=0; pln<(gen.ismultiplayer?g.plc:1); pln++) {
				g.pl[pln].s = 0;
				g.pl[pln].cs = 0;
				g.pl[pln].hm = false; //change has_moved attribute
				g.pl[pln].p.splice(0,g.pl[pln].p.length);
				g.pl[pln].p.push({x:Mathf.rand(5,bd.gd().x-5),y:Mathf.rand(5,bd.gd().y-5)});
				g.pl[pln].l = 10;
				g.pl[pln].lv = 3;
				g.pl[pln].pn = false;
				g.pl[pln].dy = false;
				g.pl[pln].irs = false;
				g.pl[pln].c.a = 1;
			}
			g.en.splice(0,g.en.length);
			g.lv = 0;
			g.pk.splice(0,g.pk.length);
		},
		end: function() { //end the game; show leaderboards
			if (gen.st!="over") return false;
			for (var pln=0; pln<(gen.ismultiplayer?g.plc:1); pln++)
				g.pl[pln].s+=g.pl[pln].cs; //add on score
			if (!gen.ismultiplayer) {
				g.cSt("lboards"); //change to leaderboards
				if ($_("#mg_lb_td").css('display')=='none')
					$_("#mg_lb_td").effects.fadeTo(100,500);
				$_("#mg_lb").effects.fadeTo(100,500,function() {
					$_("#mg_lb").effects.toHeight(254,500);
				}); //show the leaderboards
				$_("#mg_go").effects.fadeTo(0,500); //hide the game over div
				$_("#mg_lb_td_top span").html(g.pl[0].n);
				$_("#mg_lb_td_btm span").html(g.pl[0].s);
				g.sbm(g.pl[0].n, g.pl[0].s, g.lv, g.glb); //submit
			} else {
				var tdL = $_("#mg_go_m_tbl td").div;
				for (var tl=0; tl+2<tdL.length; tl+=3) {
					tdL[tl].innerHTML = g.pl[tl/3].n;
					tdL[tl+1].innerHTML = g.pl[tl/3].lv;
					tdL[tl+2].innerHTML = g.pl[tl/3].s;
				}
			}
		},
		sbm: function(name, score, level, onDone) { //submit leaderboards info to server
			$_.req({
				method: "post",
				url: "submit.php",
				headers: ["Content-Type", "application/x-www-form-urlencoded"],
				data: { username: name, score: score, level: level },
				readystatechange: function(ajax) {
					if (ajax.readyState == 4 &&
					 ajax.responseText ==  "Successfully updated information.")
					onDone();
					else console.log("Was not able to update information:" + ajax.responseText);
				}
			});
		}, 
		glb: function() { //get leaderboards info from server
			$_("table#mg_lb_lst tbody").clear(); //remove previous list
			try {
				$_.req({
					method: "get",
					url: "lb_list.php",
					readystatechange: function(ajax) {
						if (ajax.readyState != 4) return;
						var rspXML = ajax.responseXML.documentElement;
						var results = rspXML.getElementsByTagName("player");
						for (var i=0; i<results.length; i++) {
							var username, score, level, rank;
							if ($_.browser().agent == 1) {
								//use .firstChild.nodeValue;
								username = results[i].getElementsByTagName("username")[0].firstChild.nodeValue;
								score = results[i].getElementsByTagName("score")[0].firstChild.nodeValue;
								level = results[i].getElementsByTagName("level")[0].firstChild.nodeValue;
								rank = results[i].getElementsByTagName("rank")[0].firstChild.nodeValue;
							} else {
								//use .textContent;
								username = results[i].getElementsByTagName("username")[0].textContent;
								score = results[i].getElementsByTagName("score")[0].textContent;
								level = results[i].getElementsByTagName("level")[0].textContent;
								rank = results[i].getElementsByTagName("rank")[0].textContent;
							}
							$_("table#mg_lb_lst tbody").add("<tr>\n<td>"+username+"</td>\n<td>"+score+"</td>\n<td>"+level+"</td>\n<td>"+rank+"</td>\n</tr>\n");
						}
					}
				});
			} catch(e) {
				console.log("Could not obtain list. Error is subsequently printed: \n"+"\tError Name: "+e.name+"\n\tError Message: "+e.message);
			}
		}
	};
	bd.invalid = function(px,py) { //determine whether or not the point is invalid
		var validity = true; //the validity, or invalidity
		for (var a=0; a<mm.en.length; a++)
			for (var b=0; b<mm.en[a].p.length; b++)
				if (mm.en[a].p[b].x==px&&mm.en[a].p[b].y==py){
					validity = false;
					break;
				}
		for (var a=0; a<g.en.length; a++)
			for (var b=0; b<g.en[a].p.length; b++)
				if (g.en[a].p[b].x==px&&g.en[a].p[b].y==py) {
					validity = false;
					break;
				}
		for (var pln=0; pln<(gen.ismultiplayer?g.plc:1); pln++)
			for (var a=0; a<g.pl[pln].p.length; a++)
				if (g.pl[pln].p[a].x==px&&g.pl[pln].p[a].y==py) {
					validity = false;
					break;
				}
		if (px<0||px>bd.gd().x||py<0||py>bd.gd().y) validity = false;
		if (typeof px=="undefined"||typeof py=="undefined") validity = false;
		return !validity;
	};
	var ai = { //various artificial intelligence functions
		createEnem: function() {
			var rDir = Mathf.randVal([0,1,2,3]); //generate a random direction, based on clockwise movement
			/*****
				0 -- up
				1 -- right
				2 -- down
				3 -- left
			******/
			var len = 10;
			var diff = 0.1;
			var rClr=Hue(gen.st=="interim"||gen.st=="game"?Mathf.randVal([Math.random()*(g.pl[0].c.h*(1-diff)),g.pl[0].c.h*(1+diff)+Math.random()*(1-g.pl[0].c.h)]):Math.random());
			return { //return a new object, as a game enemy
				c: { //the array of colors (r, g, b, a)
					r: rClr.r,
					g: rClr.g,
					b: rClr.b,
					a: 1
				},
				d: rDir,
				m: 0, //the current mode of the enemy (0,1,2, or 3). Corresponds to different behaviors
				p: (function() { //the list of points (x, y)
					var pnts = [];
					pnts[0] = { //start off with one random point
						x: Mathf.rand(20,bd.gd().x-20),
						y: Mathf.rand(20,bd.gd().y-20)
					};
					return pnts;
				})(),
				lu: 0,//(gen.st == "game" ? g.gt : (new Date()).getTime()),
				dy: false, //whether or not the enemy is dying
				dc: 0,
				l: len, //the length of the enemy
				pn: { //poison info for enemy
					p: false, //poisoned?
					ipt: 0, //initial poison time
					lpt: 0, //last poison time
					pt: Mathf.rand(80,200)*10 //interval for poison time
				}
			};
		},
		nextPos: function(c) { //where c is the input enemy
			var frst = c.p[0];
			var newPos = {
				x: frst.x+([0,1,0,-1][c.d]),
				y: frst.y+([-1,0,1,0][c.d])
			};
			return newPos;
		},
		nextDir: function(c) { //calculate the next direction of the enemy
			var pkd = [];
			//calculate the nearest distance of a pickup
			for (var i=0; i<g.pk.length; i++)
				if (g.pk[i].t!=1&&!g.pk[i].f) //avoid poison
					pkd.push({
						d: Math.sqrt(Math.pow(g.pk[i].p.x-c.p[0].x,2)+Math.pow(g.pk[i].p.y-c.p[0].y,2)),
						p: {
							x: g.pk[i].p.x,
							y: g.pk[i].p.y
						},
						i: i
					});
			var npkd = pkd.length>=1 ? $_.assort(pkd,true,"d")[0] : false; //the nearest pickup
			var endangered = false;
			var pCrds = {
				p: [],
				oL: 0
			};
			for (var x=0; x<=bd.os().x; x++)
				for (var y=0; y<=bd.os().y; y++){
					if (!bd.invalid(x,y)) pCrds.p.push({x:x,y:y,v:true,e:false}); //e is a true/false value, meaning "edge"; v has to do with validity
					else pCrds.p.push({x:x,y:y,v:false,e:false});
				}
			for (var a=0; a<pCrds.p.length; a++){
				if (pCrds.p[a].v) continue;
				for (var b=0; b<pCrds.p.length; b++){
					if (!pCrds.p[b].v) continue;
					else if ((Math.abs(pCrds.p[b].x-pCrds.p[a].x)==1&&pCrds.p[b].y==pCrds.p[a].y)||(Math.abs(pCrds.p[b].y-pCrds.p[a].y)==1&&pCrds.p[b].x==pCrds.p[a].x))
						pCrds.p[b].e = true;
				}
				pCrds.p.splice(a,1);
				a--;
			}
			pCrds.oL=pCrds.p.length;
			var cpcrds = [];
			for (var a=0; a<pCrds.p.length; a++)
				if ((Math.abs(c.p[0].x-pCrds.p[a].x)==1&&c.p[0].y==pCrds.p[a].y)||(Math.abs(c.p[0].y-pCrds.p[a].y)==1&&c.p[0].x==pCrds.p[a].x)){
					cpcrds.push(pCrds.p[a]);
					pCrds.p.splice(a,1);
					a--;
				}
			for (var b=0; b<cpcrds.length; b++)
				for (var a=0; a<pCrds.p.length; a++)
					if ((Math.abs(cpcrds[b].x-pCrds.p[a].x)==1&&cpcrds[b].y==pCrds.p[a].y)||(Math.abs(cpcrds[b].y-pCrds.p[a].y)==1&&cpcrds[b].x==pCrds.p[a].x)) {
						cpcrds.push(pCrds.p[a]);
						pCrds.p.splice(a,1);
						a--;
					}
			if (cpcrds.length/pCrds.oL <= 0.7) endangered = true;
			var mode = 0;
			/************
			 * 0 - default; will simply move around aimlessly, and also act defensively
			 * 1 - aggressive; will try to limit moves of player
			 * 2 - economical; will try to find shortest available path to nearest pickups
			*************/
			var fp = typeof g.pl[0].p[0] == "undefined" ? false : g.pl[0].p[0];
			var dir = g.pl[0].d;
			mode=gen.st=="game"?(npkd?2:((g.pl[0].irs||g.pl[0].dy||!fp)?0:1)):0;
			c.m = mode;
			var nDir = -1;
			function inval(d) {
				return bd.invalid(c.p[0].x+[0,1,0,-1][d],c.p[0].y+[-1,0,1,0][d]);
			}
			function ppD(d) {
				var pList = [];
				var p = cpcrds;
				for (var i=0; i<p.length; i++)
					if ((d==0&&p[i].y<c.p[0].y)||(d==1&&p[i].x>c.p[0].x)||(d==2&&p[i].y>c.p[0].y)||(d==3&&p[i].x<c.p[0].x))
						pList.push(p[i]);
				return pList.length;
			}
			switch(mode) {
				case 0: //default
					var dList=[];
					for (var d1=0; d1<4; d1++)
						if (!inval(d1)) dList.push({d:d1,c:ppD(d1)});
					if (endangered) nDir=$_.assort(dList,true,"c")[0].d;
					else if (dList.length>0) nDir = !inval(c.d)?(Mathf.rand(0,100)>90?Mathf.randVal(dList).d:c.d):Mathf.randVal(dList).d;
					break;
				case 1: //aggressive
					var xd=fp.x-c.p[0].x, yd=c.p[0].y-fp.y;
					with(Math)var ang=(xd<0?180:(yd<0?360:0))+atan(yd/xd)*180/PI;
					var nwDir=[1,0,3,2,1][(Math.round(ang/90))];
					if (!inval(nwDir))
						nDir=nwDir;
					else {
						var cDirs=[];
						cDirs.push({d:(nwDir-1==-1?3:nwDir-1),c:ppD(nwDir-1==-1?3:nwDir-1)});
						cDirs.push({d:(nwDir+1==4?0:nwDir+1),c:ppD(nwDir+1==4?0:nwDir+1)});
						var rd={d:-1,c:0};
						for (var d1=0;d1<4;d1++)
							if (!inval(d1)&&d1!==cDirs[0].d&&d1!==cDirs[1].d) rd={d:d1,c:ppD(d1)};
						for (var i=0;i<cDirs.length;i++)
							if (inval(cDirs[i].d)||(cDirs[i].c>10&&rd.c<cDirs[i].c)){ cDirs.splice(i,1); i--; }
						if (cDirs.length>0) nDir=$_.assort(cDirs,true,"c")[0].d;
						else nDir=rd.d;
					}
					break;
				case 2: //economical
					var dL = {v:c.p[0].y!==npkd.p.y?(c.p[0].y>npkd.p.y?0:2):-1,h:c.p[0].x!==npkd.p.x?(c.p[0].x>npkd.p.x?3:1):-1};
					var nwDir = c.d!=dL.v?((dL.v!==-1&&!inval(dL.v))?dL.v:dL.h):((dL.h!==-1&&!inval(dL.h))?dL.h:dL.v);
					if (nwDir!==-1&&!inval(nwDir))
						nDir = nwDir;
					else {
						var cDir = [];
						if (nwDir!==-1){
							cDir.push(nwDir-1==-1?3:nwDir-1);
							cDir.push(nwDir+1==4?0:nwDir+1);
						}
						var dList = [];
						for (var d1=0; d1<4; d1++)
							if (!inval(d1)&&d1!==-1&&d1!==cDir[0]&&d1!==cDir[1]) dList.push({d:d1,c:ppD(d1)});
						for (var i=0; i<cDir.length; i++)
							if (!inval(cDir[i])) dList.push({d:cDir[i],c:ppD(cDir[i])});
						if (dList.length>0)
							nDir = $_.assort(dList,true,"c")[0].d;
					}
					/*//buggy code below...
					var xd=npkd.p.x-c.p[0].x, yd=(c.p[0].y-npkd.p.y)*(-1);
					var dL={h:(xd==0?-1:(xd<0?3:1)),v:(yd==0?-1:(yd<0?0:2))};
					if (dL.h==-1&&dL.v==-1)nDir=c.d;
					else nDir=(dL.h==-1?(inval(dL.v)?(inval(3)?1:3):dL.v):(dL.v==-1?(inval(dL.h)?(inval(0)?2:0):dL.h):(c.d==dL.h?(inval(dL.v)?dL.h:dL.v):(inval(dL.h)?dL.v:dL.h))));
					*/
					break;
			}
			return nDir;
		}
	};
	function draw() { //the main drawing function of the game, which renders everything on the canvas
		debugInfo.fc++; //increase the frame count
		if ((new Date()).getTime() - debugInfo.lu > 1000) {
			debugInfo.fps = parseFloat((debugInfo.fc/(((new Date()).getTime()-debugInfo.lu)/1000)).toFixed(1));
			debugInfo.fc = 0; //reset the frame count
			debugInfo.lu = (new Date()).getTime();
		}
		cx = $_(gThis.cnv).ctx("2d+"); //additional ScriJe "2d+" context for canvas
		cx.clearRect(0, 0, gThis.cnv.width, gThis.cnv.height);
		with(cx) { //resetting values...
			strokeStyle="#000000";
			font="";
			fillStyle="#000000";
			shadowColor="#000000";
			shadowOffsetX=0;
			shadowOffsetY=0;
			lineWidth=0;
			lineJoin="miter";
			textBaseline="alphabetic";
			textAlign="center";
		}
		function colorEquals(clr1, clr2) { //test equivalence between two colors
			var equals = true;
			for (var prop in clr1)
				if (clr1[prop]!=clr2[prop]) equals = false;
			return equals;
		}
		if (g.bg.v) {
			if (g.bg.t != 0) {
				if ((new Date()).getTime()-g.bg.t > 1000) {
					g.bg.t = 0;
					g.bg.c = g.bg.nc;
					g.bg.v = (g.bg.c.a == 0 ? false : true);
				} else for (var cl in g.bg.c) {
					var delta = (g.bg.nc[cl]-g.bg.olc[cl])*Math.pow(((new Date()).getTime()-g.bg.t)/1000,2);
					if (cl != "a") delta = Math.round(delta);
					g.bg.c[cl] = parseFloat((g.bg.olc[cl]+delta).toFixed(3));
				}
			}
			with (Math)
				var rg = cx.createRadialGradient(round(gThis.cnv.width/2), round(gThis.cnv.height/2), gThis.cnv.height*0.1, round(gThis.cnv.width/2), round(gThis.cnv.height/2), gThis.cnv.height);
			for (var a in g.bg.co)
				rg.addColorStop(a,"rgba("+g.bg.c.r+","+g.bg.c.g+","+g.bg.c.b+","+(g.bg.c.a*g.bg.co[a])+")");
			cx.fillStyle=rg;
			cx.fillRect(0, 0, gThis.cnv.width, gThis.cnv.height);
		}
		if (gen.st!="game" && gen.st!="paused" && $_("#mg_pb").css('opacity')=="1")
			$_("#mg_pb").effects.fadeTo(0,400);
		if (gen.st == "menu") { //render the main menu
			g.sted = false;
			if (!colorEquals(g.bg.c,$_.newColor(21,79,90,1)) && g.bg.t==0) {
				g.bg.olc = (g.bg.v ? g.bg.c : $_.newColor(21,79,90,0));
				g.bg.nc = $_.newColor(21,79,90,1);
				g.bg.t = (new Date()).getTime();
				g.bg.v = true;
			}
			if ($_(gThis.mmdiv).css("display") != "block")
				$_(gThis.mmdiv).effects.fadeTo(100,700);
			$get("mgAudio_ambience").play();//play the ambient music
			if (mm.en.length<2) //create more enemies, if none exist
				mm.en.push(ai.createEnem()); //create a new random enemy, and store it
			for (var i=0; i<mm.en.length; i++) { //render the main menu's enemies
				if ((new Date()).getTime()-mm.en[i].lu >= 50 || mm.en[i].dy) { //don't perform if the enemy's position has been updated recently, or if it is dying
					mm.en[i].lu = (new Date()).getTime();
						mm.en[i].d = ai.nextDir(mm.en[i]); //find the next direction, based on the AI
					if (![1,1,1,1][(mm.en[i].d)]) { //if there are no more directions
						if (!mm.en[i].dy)
							mm.en[i].dc = (new Date()).getTime(); //set the decay time
						mm.en[i].dy = true; //set the dying attribute to be true
						var delta = (new Date()).getTime()-mm.en[i].dc;
						mm.en[i].c.a = 1-Math.pow(delta/1000,2);
						if (delta >= 1000) {
							mm.en.splice(i,1); //remove the enemy
							i--;
							continue;
						}
					} else {
						mm.en[i].p.splice(0, 0, ai.nextPos(mm.en[i])); //create a new position
						if (mm.en[i].p.length > mm.en[i].l)
							mm.en[i].p.splice(mm.en[i].p.length-1, 1); //remove the last position
					}
				}
				var cl = mm.en[i].c;
				for (var j=0; j<mm.en[i].p.length; j++) {
					var p = mm.en[i].p[j];
					cx.fillStyle = "rgba("+cl.r+","+cl.g+","+cl.b+","+cl.a+")";
					cx.strokeStyle = "rgba(0,0,0,0)";
					cx.fillRoundedRect(bd.os().x1+bd.ps(p).x+1, bd.os().y1+bd.ps(p).y+1, 8, 8, 2);
				}
			}
			cx.textAlign = "center";
			if (g.vStr.ft==0) g.vStr.ft = (new Date()).getTime();
			with (Math)
				g.vStr.c.a = abs(parseFloat(sin(PI/2 * ((new Date()).getTime()-g.vStr.ft)/1500).toFixed(4)));
			cx.fillStyle = "rgba("+g.vStr.c.r+","+g.vStr.c.g+","+g.vStr.c.b+","+g.vStr.c.a+")";
			cx.font = "10px Arial";
			cx.fillText(g.vStr.text,gThis.cnv.width/2,gThis.cnv.height-10);
		} else if (gen.st == "game" || gen.st == "paused" || gen.st == "interim" || gen.st == "complete" || gen.st == "over") { //render the main game, if currently running, paused, or over
			if (g.bg.v && g.bg.t==0 && !gen.ismultiplayer) {
				g.bg.olc = g.bg.c;
				g.bg.nc = {menu:$_.newColor(21,79,90,0),lboards:$_.newColor(90,21,42,0),help:$_.newColor(117,80,123,0)}[gen.sst];
				g.bg.t = (new Date()).getTime();
			} else if (!colorEquals(g.bg.c,$_.newColor(8,18,10,1)) && g.bg.t==0 && gen.ismultiplayer) {
				g.bg.olc = g.bg.c;
				g.bg.nc = $_.newColor(8,18,10,1);
				g.bg.t = (new Date()).getTime();
			}
			if (gen.st == "game") g.gt = (new Date()).getTime()-g.to;
			if (!gen.ismultiplayer) {
				if (g.pl[0].cs/20>=g.gl && g.gl>0 && !g.glc && g.gl!==0 && gen.st!=="complete") { //level has been completed
					g.glc=true;
					g.glct=(new Date()).getTime(); //set time for goal completion
				} else if (g.glc && (new Date()).getTime()-g.glct<1000 && gen.st!=="complete")
					g.glA = 1-Math.pow(((new Date()).getTime()-g.glct)/1000,2);
				  else if (g.glc && (new Date()).getTime()-g.glct>=1000 && gen.st!=="complete") {
					g.glA = 0;
					for (var i=0;i<g.en.length;i++) {
						g.en.splice(i,1);
						i--;
					}
					g.pl[0].p.splice(0,g.pl[0].p.length);
					g.pl[0].l=10;
					g.glc=false;
					g.glct=false;
					$_("#mg_lo_d span").html(g.lv);
					g.cSt("complete");
					g.olv = g.lv;
				} else if (g.glAat&&(new Date()).getTime()-g.glAat<1000)
					g.glA = Math.pow(((new Date()).getTime()-g.glAat)/1000,2);
				  else if (g.glAat&&(new Date()).getTime()-g.glAat>=1000) {
					g.glA = 1;
					g.glAat = false;
				}
			}
			if (gen.st!="interim") { //reset g.hnts.key values
				g.hnts.key.o = 0.4;
				g.hnts.key.cK = 0;
				g.hnts.key.ft = 0;
				g.hnts.key.lmod = 0;
			}
			if (gen.st=="interim") { //if we're at the very start of the game's level
				if ((g.lv==0||g.lv==g.olv)&&g.pl[0].n!==""&&!gen.ismultiplayer) {
					if (g.en.length==0)g.en.push(ai.createEnem()); //create a new enemy
					g.lv++;
					g.olv=g.lv-1;
					with(Math)g.gl = floor(5*(log(pow(g.lv,0.6))+1)); //set the goal for the current level
				}
				g.pl[0].lu = g.gt;
				g.lpa = g.gt;
				if (!g.tb.v) g.tb.s(); //show the top bar
				$get("mgAudio_ambience").pause();
				//$get("mgAudio_music").pause();
				if (g.pl[0].hm) {
					gen.st="game";
					g.pl[0].hm=false;
				}
				if (!g.glAat&&g.glA!==1) g.glAat = (new Date()).getTime();
				if (gen.hints) { //show game starting hint
					/* Unicode characters:
						\u25B2 = up arrow
						\u25C0 = down arrow
						\u25BC = left arrow
						\u25B6 = right arrow
					*/
					//render keys
					if (!g.hnts.key.ft) g.hnts.key.ft = (new Date()).getTime();
					with (Math) {
						g.hnts.key.o = 0.4+0.6*parseFloat(abs(sin(PI/2 * ((new Date()).getTime()-g.hnts.key.ft)/1000).toFixed(2)));
						if (((new Date()).getTime()-g.hnts.key.ft)%2000 < g.hnts.key.lmod)
							g.hnts.key.cK = g.hnts.key.cK==3?0:g.hnts.key.cK+1;
						g.hnts.key.lmod = ((new Date()).getTime()-g.hnts.key.ft)%2000;
					}
					cx.textBaseline = "middle";
					cx.textAlign = "center";
					cx.fillStyle = "rgba(212,234,255,"+(g.hnts.key.cK==0?g.hnts.key.o:"0.4")+")";
					cx.strokeStyle = "rgba(120,140,166,0.4)";
					cx.font = "18px Arial";
					cx.lineWidth = 1;
					cx.fillRoundedRect(0.5+g.hnts.key.p.x-g.hnts.key.bw/2, 0.5+g.hnts.key.p.y-g.hnts.key.bw-g.hnts.key.sp/2, g.hnts.key.bw, g.hnts.key.bw, 6);
					cx.fillStyle = "rgba(10,22,27,"+(g.hnts.key.cK==0?Mathf.limit(g.hnts.key.o*2,0,1):"0.8")+")";
					cx.fillText(!g.pl[0].kt?"W":"\u25B2", 0.5+g.hnts.key.p.x, 0.5+g.hnts.key.p.y-g.hnts.key.bw/2-g.hnts.key.sp/2);
					for (var k=0; k<3; k++) {
						cx.fillStyle = "rgba(212,234,255,"+(g.hnts.key.cK-1==k?g.hnts.key.o:"0.4")+")";
						cx.fillRoundedRect(g.hnts.key.p.x+g.hnts.key.bw*(k-3/2)+g.hnts.key.sp*(k-1), 0.5+g.hnts.key.p.y+g.hnts.key.sp/2, g.hnts.key.bw, g.hnts.key.bw, 6);
						cx.fillStyle = "rgba(10,22,27,0.8)";
						cx.fillText(!g.pl[0].kt?["A","S","D"][k]:["\u25C0","\u25BC","\u25B6"][k], 0.5+g.hnts.key.p.x+g.hnts.key.bw*(k-1)+g.hnts.key.sp*(k-1), 0.5+g.hnts.key.p.y+g.hnts.key.bw/2+g.hnts.key.sp/2);
					}
				}
			} else if (gen.st=="game"||gen.st=="paused") { //otherwise, we're in the middle of the game, at an unknown level yet
				g.sted = true;
				if ($_("#mg_pb").css('display')=='none')
					$_("#mg_pb").effects.fadeTo(100,400);
				if (g.en.length==0 && !g.glc && !gen.ismultiplayer) //if there are no current enemies
					g.en.push(ai.createEnem());
				if (g.gt-g.lpa >= 10000 && (g.pk.length==0||g.pk.length<=10) && !g.glc)
					if (g.ap()) g.lpa = g.gt; //add a pickup, and set the last pickup addition time
				for (var i=0;i<g.a.ls.length;i++) //render all animations
					switch (g.a.ls[i].t) {
						case 0: //sparkle animation
							var pn={x:g.a.ls[i].p.x,y:g.a.ls[i].p.y};
							var pnts=[]; //particles
							if (g.a.ls[i].int==0) { //initialize
								g.a.ls[i].int=g.gt;
								g.a.ls[i].r=10; //radius
							}
							if (g.gt-g.a.ls[i].int<=1700) {
								var dlt=(g.gt-g.a.ls[i].int)/1700;
								var mr=100; //md=maximum diameter
								g.a.ls[i].r=dlt*mr;
								g.a.ls[i].cl.a=1-dlt;
								function grad(x,y,d,r){with(Math)return{x:x+r*parseFloat(cos(PI*d/180).toFixed(14)),y:y+r*parseFloat(sin(PI*d/180).toFixed(14))};}
								for (var deg=0;deg<360;deg+=360/30)
									pnts.push(grad(pn.x,pn.y,deg,g.a.ls[i].r));
							} else if(g.gt-g.a.ls[i].int>1700) {
								g.a.ls.splice(i,1);
								i--;
								continue;
							}
							var cl = g.a.ls[i].cl;
							cx.fillStyle="rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*g.glA)+")";
							for (var j=0;j<pnts.length;j++) {
								cx.beginPath();
								cx.arc(pnts[j].x,pnts[j].y,1,0,Math.PI*2,false);
								cx.fill();
								cx.closePath();
							}
							break;
					}
				for (var i=0; i<g.pk.length; i++) { //render all of the pickups
					if (g.gt-g.pk[i].i < 750)
						g.pk[i].c.a = Math.pow((g.gt-g.pk[i].i)/750,3);
					var eg = { g: false, e: 0 };
					for (var j=0; j<g.en.length; j++) {
						if (g.pk[i].f) break;
						if (g.en[j].p[0].x == g.pk[i].p.x && g.en[j].p[0].y == g.pk[i].p.y) {
							eg.g = true;
							eg.e = j;
							break;
						}
					}
					var cl = g.pk[i].c;
					var pk = { x: bd.os().x1+bd.ps(g.pk[i].p).x+5, y: bd.os().y1+bd.ps(g.pk[i].p).y+5 };
					for (var pln=0; pln<(gen.ismultiplayer?g.plc:1); pln++)
						if (!g.pl[pln].irs && !g.pl[pln].dy && g.pl[pln].p[0].x == g.pk[i].p.x && g.pl[pln].p[0].y == g.pk[i].p.y && !g.pk[i].f && gen.st != "paused" && !g.pk[i].f){
						switch (g.pk[i].t) {
							case 0: //pickup
								g.pl[pln].cs+=20; //increase the player's score
								g.pl[pln].l+=5; //increase the player's length
								break;
							case 1: //poison
								g.pl[pln].pn.p = true; 
								g.pl[pln].pn.ipt = g.gt;
								if(g.pl[pln].cs-20>=0)g.pl[pln].cs-=20;
								break;
							case 2: //life
								g.pl[pln].lv+=(g.pl[pln].lv<3?1:0);
								g.pl[pln].l+=5;
								g.pl[pln].cs+=60;
								g.a.a(pk.x,pk.y,0,{r:cl.r,g:cl.g,b:cl.b,a:cl.a}); //animation
								break;
						}
						g.pk[i].f = true; //set the item to fade away
						g.pk[i].ft = g.gt;
						g.pk[i].c.oa = g.pk[i].c.a; //save the old opacity
						$get("mgAudio_effects").currentTime = 0;
						$get("mgAudio_effects").play(); //play a sound
					} else if (eg.g && gen.st != "paused" && !g.pk[i].f) { //if an enemy took the pickup instead
						switch (g.pk[i].t) {
							case 0: //pickup
								g.en[eg.e].l+=5; //increase the enemy's length
								break;
							case 1: //poison
								g.en[eg.e].pn.p = true;
								g.en[eg.e].pn.ipt = g.gt;
								break;
							case 2: //life
								g.en[eg.e].l+=20;
								g.a.a(pk.x,pk.y,0,{r:cl.r,g:cl.g,b:cl.b,a:cl.a}); //animation
								break;
						}
						g.pk[i].f = true; //set the item to fade away
						g.pk[i].ft = g.gt;
						g.pk[i].c.oa = g.pk[i].c.a; //save the old opacity
					} else if (g.gt-g.pk[i].i > 10000 && !g.pk[i].f) { //if existing time > 10 seconds
						g.pk[i].f = true; //set the item to fade away
						g.pk[i].ft = g.gt;
						g.pk[i].c.oa = g.pk[i].c.a; //save the old opacity
					}
					if (g.pk[i].f) {
						if (g.gt-g.pk[i].ft > 750) {
							g.pk.splice(i,1); //remove the item
							i--;
							continue;
						} else g.pk[i].c.a = g.pk[i].c.oa-Math.pow(g.pk[i].c.oa*(g.gt-g.pk[i].ft)/750,2);
					} else if (g.gt-g.pk[i].i >= 750 && gen.st != "paused")//render the fading in and out of the pickup
						with(Math)g.pk[i].c.a = abs(parseFloat(sin((g.gt-g.pk[i].i)/1500*PI).toFixed(14)));
					cx.fillStyle = "rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*g.glA)+")";
					function pkGradient(r1,r2) {
						var pkrg = cx.createRadialGradient(
							pk.x, 
							pk.y, 
							(typeof r1=="undefined"?1:r1), 
							pk.x, 
							pk.y, 
							(typeof r2=="undefined"?16:r2)
						);
						pkrg.addColorStop(0,"rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*g.glA)+")");
						pkrg.addColorStop(0.3,"rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*0.3*g.glA)+")");
						pkrg.addColorStop(1,"rgba("+cl.r+","+cl.g+","+cl.b+",0)");
						cx.fillStyle=pkrg;
						cx.fillRect(bd.os().x1+bd.ps(g.pk[i].p).x-10, bd.os().y1+bd.ps(g.pk[i].p).y-10, 30, 30);
					}
					function drawSquig(px,py,rd,fld,vr) {
						function squig(x,r,fl,v) {with(Math)return sqrt(4*((4-v*4)+sin(fl*x))-pow(x,2));}
						cx.lineJoin="round";
						cx.beginPath();
						for (var x=px-rd*2;x<=px+rd*2;x++)
							cx.lineTo(x,py-squig((x-px)/(rd/4),rd,fld,vr)*(rd/4));
						for (var x=px+rd*2;x>=px-rd*2;x--)
							cx.lineTo(x,py+squig((x-px)/(rd/4),rd,fld,vr)*(rd/4));
						for (var x=px-rd*2;x<=px+rd*2;x++)
							cx.lineTo(x,py-squig((x-px)/(rd/4),rd,fld,vr)*(rd/4));
						cx.stroke();
						cx.closePath();
					}
					switch (g.pk[i].t) {
						case 0: //normal
							cx.beginPath();
							cx.arc(pk.x, pk.y, 4, 0, 2*Math.PI, false);
							cx.fill();
							cx.closePath();
							cx.strokeStyle = "rgba(0,0,0,0)";
							cx.lineWidth = 0;
							pkGradient();
							break;
						case 1: //poison
							cx.beginPath();
							cx.arc(pk.x, pk.y, 4, 0, 2*Math.PI, false);
							cx.fill();
							cx.closePath();
							cx.strokeStyle = "rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*0.5*g.glA)+")";
							cx.lineWidth = 1;
							for (var r=8; r<=16; r+=4) {
								cx.strokeStyle = "rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*0.5*((18-r)/16)*g.glA)+")";
								cx.beginPath();
								cx.arc(pk.x, pk.y, r, 0.618*Math.PI, 1.382*Math.PI, false);
								cx.stroke();
								cx.closePath();
								cx.beginPath();
								cx.arc(pk.x, pk.y, r, 0.382*Math.PI, 1.618*Math.PI, true);
								cx.stroke();
								cx.closePath();
							}
							break;
						case 2: //life
							cx.beginPath();
							cx.arc(pk.x, pk.y, 4, 0, 2*Math.PI, false);
							cx.fill();
							cx.closePath();
							cx.lineWidth = 1;
							pkGradient();
							with(Math)
								var delta=abs(parseFloat(sin((g.gt-g.pk[i].i)/1700*PI).toFixed(14)));
							var vrt=delta*0.3;//radial variation (0-1)
							var fldy=delta*1.2;//roughness
							cx.strokeStyle = "rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*0.5*g.glA)+")";
							drawSquig(pk.x,pk.y,10,fldy,vrt);
							break;
					}
				}
				for (var pln=0; pln<(gen.ismultiplayer?g.plc:1); pln++) { //render and loop through all players in the game
					if (g.pl[pln].pn.p&&g.gt-g.pl[pln].pn.lpt>=g.pl[pln].pn.pt(pln)&&g.gt-g.pl[pln].pn.ipt<5000)
						g.pl[pln].pn.af(pln); //affect the player, if poisoned
					else if (g.pl[pln].pn.p&&g.gt-g.pl[pln].pn.ipt>=5000) g.pl[pln].pn.p = false;
					if (!g.pl[pln].irs && !g.pl[pln].dy && g.gt-g.pl[pln].lu >= 50 && gen.st != "paused" && !g.glc) { //update the player
						g.pl[pln].lu = g.gt;
						g.pl[pln].pf(pln); //update the player's coordinates
						g.pl[pln].d = g.pl[pln].qd;
						if (g.pl[pln].p.length > g.pl[pln].l) //sychronize player length with array length
							g.pl[pln].p.splice(g.pl[pln].p.length-(g.pl[pln].p.length-g.pl[pln].l), g.pl[pln].p.length-g.pl[pln].l);
					} else if (g.pl[pln].dy && !g.pl[pln].irs && !g.glc) { //if the player is dying
						if (g.gt-g.pl[pln].dt <= 500) g.pl[pln].c.a = 1-Math.pow((g.gt-g.pl[pln].dt)/500,2);
						else {
							g.pl[pln].c.a = 0;
							g.pl[pln].rs(pln); //resurrect the player
						}
					} else if (g.pl[pln].irs && !g.pl[pln].dy && !g.glc) { //if the player is resurrecting
						if (g.gt-g.pl[pln].rt <= 500) g.pl[pln].c.a = Math.pow((g.gt-g.pl[pln].rt)/500,2);
						else {
							if (g.pl[pln].lv == 0) g.cSt("over"); //if we're out of lives, too, end the game
							else {
								g.pl[pln].c.a = 1;
								g.pl[pln].irs = false;
							}
						}
					}
					var pcl = g.pl[pln].c;
					for (var i=0; i<g.pl[pln].p.length; i++) { //render the player (or players)
						var p = g.pl[pln].p[i];
						cx.fillStyle = "rgba("+pcl.r+","+pcl.g+","+pcl.b+","+(pcl.a*g.glA)+")";
						cx.strokeStyle = "#000000";
						if (g.pl[pln].pn.p) { //poison rendering
							with(Math)
								cx.shadowColor = "rgba("+pcl.r+","+pcl.g+","+pcl.b+","+(pcl.a*abs(parseFloat(sin((g.gt-g.pl[pln].pn.ipt)/1000*PI).toFixed(4)))*g.glA)+")";
							cx.shadowBlur = 20;
							cx.shadowOffsetX = 0;
							cx.shadowoffSetY = 0;
						}
						cx.fillRoundedRect(bd.os().x1+bd.ps(p).x+1, bd.os().y1+bd.ps(p).y+1, 8, 8, 2);
						/*
							
						*/
						cx.shadowBlur = 0;
						cx.shadowColor = "#000000";
					}
				}
				for (var i=0; i<g.en.length; i++) { //render all of the enemies
					if (g.en[i].dy && !g.glc) {
						var delta = g.gt-g.en[i].dc;
						g.en[i].c.a = 1-Math.pow(delta/1000,2);
						if (delta >= 1000) {
							g.en.splice(i,1); //remove the enemy
							i--;
							continue;
						}
					} else if (g.gt-g.en[i].lu >= 50 && !g.en[i].dy && gen.st != "paused" && !g.glc) { //update the enemy
						if (g.en[i].pn.p&&g.gt-g.en[i].pn.lpt>g.en[i].pn.pt) { //if the enemy is poisoned
							g.en[i].pn.lpt = g.gt;
							g.en[i].l--;
							if (g.en[i].l <= 1) {
								g.en[i].dc = g.gt; //set the decay time
								g.en[i].dy = true; //set the dying attribute to be true
							}								
						} else if (g.gt-g.en[i].pn.ipt>5000) //if time is up
							g.en[i].pn.p = false;
						if ([1,1,1,1][(g.en[i].d)]&&!g.en[i].dy) { //if a valid point is reached
							g.en[i].lu = g.gt; //set the last update time
							g.en[i].d = ai.nextDir(g.en[i]); //generate next direction, based on the AI
						} else if (![1,1,1,1][(g.en[i].d)]&&!g.en[i].dy) { //if there are no more directions
							g.en[i].dc = g.gt; //set the decay time
							g.en[i].dy = true; //set the dying attribute to be true
						}
						if (!g.en[i].dy) {
							g.en[i].p.splice(0, 0, ai.nextPos(g.en[i])); //create a new position
							if (g.en[i].p.length > g.en[i].l) //synchronize enemy length with array length
								g.en[i].p.splice(g.en[i].p.length-(g.en[i].p.length-g.en[i].l), g.en[i].p.length-g.en[i].l);
						}
					}
					var cl = g.en[i].c;
					for (var j=0; j<g.en[i].p.length; j++) {
						var p = g.en[i].p[j];
						cx.fillStyle = "rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*g.glA)+")";
						cx.strokeStyle = "none";
						if (g.en[i].pn.p) { //poison rendering
							with(Math)
								cx.shadowColor = "rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*abs(parseFloat(sin((g.gt-g.en[i].pn.ipt)/1000*PI).toFixed(14)))*g.glA)+")";
							cx.shadowBlur = 20;
							cx.shadowOffsetX = 0;
							cx.shadowOffsetY = 0;
						}
						cx.fillRoundedRect(bd.os().x1+bd.ps(p).x+1, bd.os().y1+bd.ps(p).y+1, 8, 8, 2);
						cx.shadowBlur = 0;
						cx.shadowColor = "rgba(0,0,0,0)";
					}
				}
			} else if (gen.st == "complete") {  //if the level is complete
				if ($_("#mg_lo").css("display")=="none") 
					$_("#mg_lo").effects.fadeTo(100,1000);
			} else if (gen.st == "over") { //if the game is over
				if ($_("#mg_go").css("display")=="none" && !gen.ismultiplayer) 
					$_("#mg_go").effects.fadeTo(100,1000);
				else if ($_("#mg_go_m").css("display")=="none" && gen.ismultiplayer) {
					g.end();
					$_("#mg_go_m").effects.fadeTo(100,1000);
				}
			}
			if (gen.st == "interim" || gen.st == "game" || gen.st == "paused") { //some additional last-millisecond rendering
				if (g.tb.an!="" && (new Date()).getTime()-g.tb.at >= 700) {//update the top bar
					g.tb.p = {
						x: g.tb.np.x,
						y: g.tb.np.y
					};
					g.tb.c.bg = { 
						r: g.tb.nc.bg.r,
						g: g.tb.nc.bg.g,
						b: g.tb.nc.bg.b,
						a: g.tb.nc.bg.a 
					};
					if (g.tb.c.bg.a==0||g.tb.p.x<=-800||g.tb.p.y<=-24) g.tb.v = false;
					else g.tb.v = true;
					g.tb.an = "";
				} else if (g.tb.an!="" && (new Date()).getTime()-g.tb.at < 700) {
					var dlta = ((new Date()).getTime()-g.tb.at)/700;
					var dc = {
						r: g.tb.c.bg.r+Math.round(dlta*(g.tb.nc.bg.r-g.tb.c.bg.r)),
						g: g.tb.c.bg.g+Math.round(dlta*(g.tb.nc.bg.g-g.tb.c.bg.g)),
						b: g.tb.c.bg.b+Math.round(dlta*(g.tb.nc.bg.b-g.tb.c.bg.b)),
						a: g.tb.c.bg.a+(dlta*(g.tb.nc.bg.a-g.tb.c.bg.a))
					};
					var dp = {
						x: g.tb.p.x+Math.round(dlta*(g.tb.np.x-g.tb.p.x)),
						y: g.tb.p.y+Math.round(dlta*(g.tb.np.y-g.tb.p.y))
					};
					if (g.tb.c.bg.a==0||g.tb.p.x<=-g.tb.d.w||g.tb.p.y<=-g.tb.d.h) g.tb.v = false;
					else g.tb.v = true;
					cx.fillStyle = "rgba("+dc.r+","+dc.g+","+dc.b+","+(dc.a*g.glA)+")";
					cx.fillRect(dp.x, dp.y, g.tb.d.w, g.tb.d.h);
					cx.fillStyle = "rgba(240,255,255,"+((dc.a+0.3)*g.glA)+")";
					cx.textAlign = "left";
					cx.font = "14px Arial";
					cx.textBaseline = "top";
					if (!gen.ismultiplayer) {
						cx.fillText("Score:", dp.x+10, dp.y+g.tb.to.y);
						cx.fillStyle = "rgba(186,244,255,"+((dc.a+0.3)*g.glA)+")";
						cx.fillText((g.pl[0].s+g.pl[0].cs), dp.x+54, dp.y+g.tb.to.y);
					}
					
					if (gen.fps) {
						cx.font = "12px Arial";
						cx.fillStyle = "rgba(240,240,240,"+((dc.a+0.3)*g.glA)+")";
						cx.fillText(debugInfo.fps+" FPS",dp.x+10, dp.y+g.tb.to.y+30);
						cx.font = "14px Arial";
					}
					//else cx.fillText((g.pl[0].s+g.pl[0].cs)+" vs "+(g.pl[1].s+g.pl[1].cs), dp.x+54, dp.y+g.tb.to.y);
					cx.fillStyle = "rgba(240,255,255,"+((dc.a+0.3)*g.glA)+")";
					cx.textAlign = "center";
					if (!gen.ismultiplayer)
						cx.fillText("Level "+g.lv, dp.x+(g.tb.d.w/2), dp.y+g.tb.to.y);
					else cx.fillText("Multiplayer Mode", dp.x+(g.tb.d.w/2), dp.y+g.tb.to.y);
					cx.strokeStyle = "#000000";
					if (!gen.ismultiplayer) {
						cx.textAlign = "right";
						var pcl = g.pl[0].c;
						cx.fillStyle = "rgba("+pcl.r+","+pcl.g+","+pcl.b+","+(pcl.a*g.glA)+")";
						cx.fillRoundedRect(dp.x+g.tb.d.w-94-cx.measureText(g.pl[0].n).width, dp.y+g.tb.to.y+2, 8, 8, 2);
						cx.fillStyle = "rgba(240,255,255,"+((dc.a+0.3)*g.glA)+")"; //reset back to text
						cx.fillText(g.pl[0].n, dp.x+g.tb.d.w-80, dp.y+g.tb.to.y);
					} else {
						var pcl = [g.pl[0].c,g.pl[1].c];
						//draw info for first player
						cx.textAlign = "left";
						cx.fillStyle = "rgba("+pcl[0].r+","+pcl[0].g+","+pcl[0].b+","+(pcl[0].a*g.glA)+")";
						cx.fillRoundedRect(dp.x+10, dp.y+g.tb.to.y+2, 8, 8, 2);
						cx.fillStyle = "rgba(240,255,255,"+((dc.a+0.3)*g.glA)+")"; //reset back to text
						cx.fillText(g.pl[0].n, dp.x+24, dp.y+g.tb.to.y);
						if (is.l.length>0 && typeof is.l[0].src !== "undefined")
							for (var i=0; i<3; i++)
								cx.drawImage(is.l[(i<g.pl[0].lv?0:1)], dp.x+30+cx.measureText(g.pl[0].n).width+(20*i), dp.y+2, 20, 20);
						//draw info for second player
						cx.textAlign = "right";
						cx.fillStyle = "rgba("+pcl[1].r+","+pcl[1].g+","+pcl[1].b+","+(pcl[1].a*g.glA)+")";
						cx.fillRoundedRect(dp.x+g.tb.d.w-94-cx.measureText(g.pl[1].n).width, dp.y+g.tb.to.y+2, 8, 8, 2);
						cx.fillStyle = "rgba(240,255,255,"+((dc.a+0.3)*g.glA)+")"; //reset back to text
						cx.fillText(g.pl[1].n, dp.x+g.tb.d.w-80, dp.y+g.tb.to.y);
						if (is.l.length>0 && typeof is.l[0].src !== "undefined")
							for (var i=0; i<3; i++)
								cx.drawImage(is.l[(i>2-g.pl[1].lv?0:1)], dp.x+g.tb.d.w-30-(20*i), dp.y+2, 20, 20);
					}
					if (is.l.length>0 && typeof is.l[0].src !== "undefined" && !gen.ismultiplayer)
						for (var i=0; i<3; i++)
							cx.drawImage(is.l[(i>2-g.pl[0].lv?0:1)], dp.x+g.tb.d.w-30-(20*i), dp.y+2, 20, 20);
					
				}
				if (g.tb.an=="") {
					cx.fillStyle = "rgba("+g.tb.c.bg.r+","+g.tb.c.bg.g+","+g.tb.c.bg.b+","+(g.tb.c.bg.a*g.glA)+")";
					cx.fillRect(g.tb.p.x, g.tb.p.y, g.tb.d.w, g.tb.d.h);
					cx.fillStyle = "rgba(240,255,255,"+((g.tb.c.bg.a+0.3)*g.glA)+")";
					cx.textAlign = "left";
					cx.font = "14px Arial";
					cx.textBaseline = "top";
					if (!gen.ismultiplayer) {
						cx.fillText("Score:", g.tb.p.x+10, g.tb.p.y+g.tb.to.y);
						cx.fillStyle = "rgba(186,244,255,"+((g.tb.c.bg.a+0.3)*g.glA)+")";
						cx.fillText((g.pl[0].s+g.pl[0].cs), g.tb.p.x+54, g.tb.p.y+g.tb.to.y);
					}
					if (gen.fps) {
						cx.font = "12px Arial";
						cx.fillStyle = "rgba(240,240,240,"+((g.tb.c.bg.a+0.3)*g.glA)+")";
						cx.fillText(debugInfo.fps+" FPS",g.tb.p.x+10,g.tb.p.y+g.tb.to.y+30);
						cx.font = "14px Arial";
					}
					cx.fillStyle = "rgba(240,255,255,"+((g.tb.c.bg.a+0.3)*g.glA)+")";
					cx.textAlign = "center";
					if (!gen.ismultiplayer)
						cx.fillText("Level "+g.lv, g.tb.p.x+(g.tb.d.w/2), g.tb.p.y+g.tb.to.y);
					else cx.fillText("Multiplayer Mode", g.tb.p.x+(g.tb.d.w/2), g.tb.p.y+g.tb.to.y);
					cx.textAlign = "right";
					if (!gen.ismultiplayer) {
						cx.strokeStyle = "#000000";
						var pcl = g.pl[0].c;
						cx.fillStyle = "rgba("+pcl.r+","+pcl.g+","+pcl.b+","+(pcl.a*g.glA)+")";
						cx.fillRoundedRect(g.tb.p.x+g.tb.d.w-94-cx.measureText(g.pl[0].n).width, g.tb.p.y+g.tb.to.y+2, 8, 8, 2);
						cx.fillStyle = "rgba(240,255,255,"+((g.tb.c.bg.a+0.3)*g.glA)+")"; //reset back to text
						cx.fillText(g.pl[0].n, g.tb.p.x+g.tb.d.w-80, g.tb.p.y+g.tb.to.y);
					} else {
						var pcl = [g.pl[0].c,g.pl[1].c];
						//draw info for first player
						cx.textAlign = "left";
						cx.fillStyle = "rgba("+pcl[0].r+","+pcl[0].g+","+pcl[0].b+","+(pcl[0].a*g.glA)+")";
						cx.fillRoundedRect(g.tb.p.x+10, g.tb.p.y+g.tb.to.y+2, 8, 8, 2);
						cx.fillStyle = "rgba(240,255,255,"+((g.tb.c.bg.a+0.3)*g.glA)+")"; //reset back to text
						cx.fillText(g.pl[0].n, g.tb.p.x+24, g.tb.p.y+g.tb.to.y);
						if (is.l.length>0 && typeof is.l[0].src !== "undefined")
							for (var i=0; i<3; i++)
								cx.drawImage(is.l[(i<g.pl[0].lv?0:1)], g.tb.p.x+30+cx.measureText(g.pl[0].n).width+(20*i), g.tb.p.y+2, 20, 20);
						//draw info for second player
						cx.textAlign = "right";
						cx.fillStyle = "rgba("+pcl[1].r+","+pcl[1].g+","+pcl[1].b+","+(pcl[1].a*g.glA)+")";
						cx.fillRoundedRect(g.tb.p.x+g.tb.d.w-94-cx.measureText(g.pl[1].n).width, g.tb.p.y+g.tb.to.y+2, 8, 8, 2);
						cx.fillStyle = "rgba(240,255,255,"+((g.tb.c.bg.a+0.3)*g.glA)+")"; //reset back to text
						cx.fillText(g.pl[1].n, g.tb.p.x+g.tb.d.w-80, g.tb.p.y+g.tb.to.y);
						if (is.l.length>0 && typeof is.l[0].src !== "undefined")
							for (var i=0; i<3; i++)
								cx.drawImage(is.l[(i>2-g.pl[1].lv?0:1)], g.tb.p.x+g.tb.d.w-30-(20*i), g.tb.p.y+2, 20, 20);
					}
					if (is.l.length>0 && typeof is.l[0].src !== "undefined" && !gen.ismultiplayer)
						for (var i=0; i<3; i++)
							cx.drawImage(is.l[(i>2-g.pl[0].lv?0:1)], g.tb.p.x+g.tb.d.w-30-(20*i), g.tb.p.y+2, 20, 20);
				}
				if (!gen.ismultiplayer) { //drawing progress bar
					g.pg.p.y=(g.tb.an!=""?dp.y+g.tb.d.h+10:g.tb.p.y+g.tb.d.h+10);
					if(!g.pg.an.iit)g.pg.an.iit=g.gt;
					with(Math)var shdwA=abs(parseFloat(sin((g.gt-g.pg.an.iit)/1200*PI/2).toFixed(6)));
					var pgcl=g.pg.c;
					cx.strokeStyle="rgba("+pgcl.r+","+pgcl.g+","+pgcl.b+","+pgcl.a+")";
					cx.fillStyle="rgba("+(pgcl.r+35)+","+(pgcl.g+35)+","+(pgcl.b+35)+","+(pgcl.a*0.7)+")";
					cx.lineWidth=1;
					cx.lineJoin="round";
					g.pg.ib.nd.w = Mathf.limit((g.pg.d.w-2)*g.pl[0].cs/20/g.gl,0,g.pg.d.w-2);
					if (g.pg.ib.nd.w!==g.pg.ib.d.w) {
						if (!g.pg.an.iat) g.pg.an.iat=g.gt;
						if (g.gt-g.pg.an.iat<700) {
							with(Math)var delta = pow((g.gt-g.pg.an.iat)/700,2);
							var nw = g.pg.ib.d.w+delta*(g.pg.ib.nd.w-g.pg.ib.d.w);
							cx.strokeRect(g.pg.p.x+0.5,g.pg.p.y+0.5,g.pg.d.w,g.pg.d.h);
							cx.shadowColor="rgba("+(pgcl.r+70)+","+(pgcl.g+70)+","+(pgcl.b+70)+","+(shdwA*g.glA)+")";
							cx.shadowBlur=7;
							cx.fillRect(g.pg.p.x+1.5,g.pg.p.y+1.5,nw,g.pg.d.h-2);
							cx.shadowColor="rgba(0,0,0,0)";
							cx.shadowBlur=0;
						} else if (g.gt-g.pg.an.iat>=700) {
							g.pg.ib.d.w = g.pg.ib.nd.w;
							g.pg.an.iat = false;
							cx.strokeRect(g.pg.p.x+0.5,g.pg.p.y+0.5,g.pg.d.w,g.pg.d.h);
							cx.shadowColor="rgba("+(pgcl.r+70)+","+(pgcl.g+70)+","+(pgcl.b+70)+","+(shdwA*g.glA)+")";
							cx.shadowBlur=7;
							cx.fillRect(g.pg.p.x+1.5,g.pg.p.y+1.5,g.pg.ib.d.w,g.pg.d.h-2);
							cx.shadowColor="rgba(0,0,0,0)";
							cx.shadowBlur=0;
						}
					} else {
						cx.strokeRect(g.pg.p.x+0.5,g.pg.p.y+0.5,g.pg.d.w,g.pg.d.h);
						cx.shadowColor="rgba("+(pgcl.r+70)+","+(pgcl.g+70)+","+(pgcl.b+70)+","+(shdwA*g.glA)+")";
						cx.shadowBlur=7;
						cx.fillRect(g.pg.p.x+1.5,g.pg.p.y+1.5,g.pg.ib.d.w,g.pg.d.h-2);
						cx.shadowColor="rgba(0,0,0,0)";
						cx.shadowBlur=0;
					}
				}
			}
		} else if (gen.st == "help") {
			if (!colorEquals(g.bg.c,$_.newColor(117,80,123,1)) && g.bg.t==0) {
				g.bg.olc = (g.bg.v ? g.bg.c : $_.newColor(117,80,123,0));
				g.bg.nc = $_.newColor(117,80,123,1);
				g.bg.t = (new Date()).getTime();
				g.bg.v = true;
			}
		} else if (gen.st == "lboards") {
			if (!colorEquals(g.bg.c,$_.newColor(90,21,42,1)) && g.bg.t==0) {
				g.bg.olc = (g.bg.v ? g.bg.c : $_.newColor(90,21,42,0));
				g.bg.nc = $_.newColor(90,21,42,1);
				g.bg.t = (new Date()).getTime();
				g.bg.v = true;
			}
		}		
		$get("mgAudio_ambience").volume = gen.snd.ambience.vol;
		$get("mgAudio_music").volume = gen.snd.music.vol;
		$get("mgAudio_effects").volume = gen.snd.effects.vol;
		if (Storage) { //save data
			localStorage.SGsnda = gen.snd.ambience.vol;
			localStorage.SGsndm = gen.snd.music.vol;
			localStorage.SGsnde = gen.snd.effects.vol;
			localStorage.SGpn = g.pl[0].n;
			localStorage.SGpn2 = g.pl[1].n;
			localStorage.SGkt = g.pl[0].kt;
			localStorage.SGhnt = String(gen.hints);
			localStorage.SGism = String(gen.ismultiplayer);
			localStorage.SGse = String(gen.specialeffects);
			localStorage.SGfps = String(gen.fps);
		}
		if (window.requestAnimationFrame) window.requestAnimationFrame(draw);
	}
	this.init = function() { //the main initialization function
		if (!("width" in gThis.cnv && "style" in gThis.stdiv && "style" in gThis.mmdiv))
			return false;
		for (var pl_num=0; pl_num<g.plc; pl_num++)
			g.pl.push((function() { //the player
				var dir = Mathf.rand(0,3); //create a random direction
				var pnts = [];
				var len = 10;
				pnts[0] = {
					x: Mathf.rand(20,bd.gd().x-20),
					y: Mathf.rand(20,bd.gd().y-20)
				};
				var frst = pnts[0];
				for (var i=1; i<=len-1; i++) {
					pnts.push({ //add the other coordinates to the player's coordinate list
						x: frst.x+([0,-i,0,i][dir]), //note: these values are the REVERSE of any normal ones,
						y: frst.y+([i,0,-i,0][dir])  //as point 0 shall be the starting point of the enemy
					});								 //hence, the -, instead of a +
				}
				var hueColor = Math.random();
				var rC=Hue(hueColor);
				return {
					p: pnts, //the list of points (x, y)
					c: { //the color data (r, g, b, a). Is randomized on initialization
						r: rC.r,
						g: rC.g,
						b: rC.b,
						a: 1,
						h: hueColor
					},
					d: dir, //the direction of the player, at move time
					qd: dir, //the queued direction of the player, prior to move time
					s: 0, //the score of the player
					cs: 0, //the current, level-based score of the player
					n: "", //the name of the player
					lu: g.gt, //the last time the player's position was updated
					l: len, //the length of the player
					pn: { //poison info, if the player is poisoned
						p: false, //whether or not the player is poisoned
						pt: function(pln) { //poison time interval, for player, to decrease length
							return (g.pl[pln].pn.p&&!g.pl[pln].dy)?Math.round(1+1000*Math.pow(g.pl[pln].lv,-g.pl[pln].lv/20)):false;
						},
						ipt: g.gt, //initial poison time
						lpt: g.gt, //last poison time
						af: function(pln) { //affect
							if (!g.pl[pln].pn.p||g.gt-g.pl[pln].pn.lpt<g.pl[pln].pn.pt(pln)||g.pl[pln].dy) return false;
							g.pl[pln].pn.lpt = g.gt;
							g.pl[pln].pn.lpt = g.gt;
							g.pl[pln].l--;
							if (g.pl[pln].l<=1) { //kill player
								g.pl[pln].dy = true;
								g.pl[pln].dt = g.gt;
							}
						}
					},
					dy: false, //whether or not the player is dying
					dt: false, //the time (timestamp) when dying was initiated
					irs: false, //whether or not the player is resurrecting
					rt: 0, //the time of resurrection
					rs: function(pln) { //resurrect the player after a death
						g.pl[pln].d = -1;
						g.pl[pln].irs = true;
						g.pl[pln].dy = false;
						g.pl[pln].p.splice(0,g.pl[pln].p.length); //remove every point
						g.pl[pln].lv--;
						if (g.pl[pln].lv==0) return false;
						/* code for resurrecting in only safe areas
						var safeCoords = [];
						for (var x=10; x<=bd.gd().x-10; x++)
							for (var y=10; y<=bd.gd().y-10; y++)
								if (!bd.invalid(x,y)) safeCoords.push({x:x,y:y});
						g.pl[pln].p.push(Mathf.randVal(safeCoords));
						*/
						g.pl[pln].p.push({x:Mathf.rand(10,bd.gd().x-10),y:Mathf.rand(10,bd.gd().y-10)});
						g.pl[pln].l = 10;
						g.pl[pln].rt = g.gt;
						var dList = [];
						function room(dir) {
							var x=g.pl[pln].p[0].x+[0,1,0,-1][dir],y=g.pl[pln].p[0].y+[-1,0,1,0][dir];
							switch(dir) {
								case 0:
									for (y;y>-2;y--)
										if (bd.invalid(x,y)) return dList.push({t:dir, d:Mathf.distance(x,y,x,g.pl[pln].p[0].y)});
									break;
								case 1:
									for (x;x<=bd.gd().x+1;x++)
										if (bd.invalid(x,y)) return dList.push({t:dir, d:Mathf.distance(x,y,g.pl[pln].p[0].x,y)});
									break;
								case 2:
									for (y;y<=bd.gd().y+1;y++)
										if (bd.invalid(x,y)) return dList.push({t:dir, d:Mathf.distance(x,y,x,g.pl[pln].p[0].y)});
									break;
								case 3:
									for (x;x>-2;x--)
										if (bd.invalid(x,y)) return dList.push({t:dir, d:Mathf.distance(x,y,g.pl[pln].p[0].x,y)});
									break;
							}
						}
						//for (var d=0; d<=3; d++) room(d);
						g.pl[pln].d = Mathf.rand(0,3);//$_.assort(dList,false,"d")[0].t;
					},
					hm: false, //whether or not the player has decided to move
					mv: function(d, pln) { //function to move the player according to direction
						if (g.pl[pln].dy || g.pl[pln].irs) return false;
						else if ([2,3,0,1][d]==g.pl[pln].d) {
							if (gen.st=="interim")g.pl[pln].hm = true;
							return false;
						}
						if (gen.st=="interim") g.pl[pln].hm = true;
						g.pl[pln].qd = d;
					},
					pf: function(plnum) {
						if (g.pl[plnum].dy || g.pl[plnum].irs) return false;
						var coord = {
							x:g.pl[plnum].p[0].x+[0,1,0,-1][g.pl[plnum].qd],
							y:g.pl[plnum].p[0].y+[-1,0,1,0][g.pl[plnum].qd]
						};
						var conflict = false;
						for (var pln=0; pln<(gen.ismultiplayer?g.plc:1); pln++)
							for (var a=1; a<g.pl[pln].p.length; a++)
								if (coord.x==g.pl[pln].p[a].x && coord.y==g.pl[pln].p[a].y) {
									conflict = true;
									break;
								}
						for (var a=0; a<g.en.length; a++) {
							var en = g.en[a];
							for (var b=0; b<en.p.length; b++) {
								if (coord.x==en.p[b].x && coord.y==en.p[b].y) {
									conflict = true;
									break;
								}
							}
						}
						if (coord.x<0||coord.x>bd.gd().x||coord.y<0||coord.y>bd.gd().y) conflict = true;
						if (conflict) {
							g.pl[plnum].dy = true;
							g.pl[plnum].dt = g.gt;
						} else g.pl[plnum].p.splice(0,0,coord);
					},
					lv: 3, //the amount of lives left in the player
					kt: pl_num%2 //the type of key input used. 0 for WASD, and 1 for arrow keys
				};
			})());
		g.tb.d.w = gThis.cnv.width;
		g.pg.p = {
			x: gThis.cnv.width-10-g.pg.d.w, //position of progress bar
			y: g.tb.p.y+g.tb.d.h+10
		};
		g.hnts.key.p = {
			x: gThis.cnv.width/2,
			y: gThis.cnv.height/2
		};
		is.a("img/heart.png");
		is.a("img/heart_gs.png");
		$_("#mg_mmi").effects.fadeTo(100,200, function() {
			//start the interval for the drawing of the main canvas
			if (window.requestAnimationFrame) window.requestAnimationFrame(draw);
			else intervs.draw = setInterval(draw, 1); 
		});
		$_("#mg_mmpn").click(function() {
			if (s.v) return false;
			$_("#mg_mmi").effects.fadeTo(0,200);
			if (g.pl[0].n == "") {
				$_("#mg_np").effects.fadeTo(100,500);
				$_("#mg_np_dun").value(g.pl[0].n);
			} else g.cSt("interim"); //start at new level
		});
		$_("#mg_np_dc").click(function() { //start the game, if there is a valid username
			var rs = un.chk($_("#mg_np_dun").value());
			if (!rs.v) {
				$_("#mg_np_d_e").effects.fadeTo(100,700);
				$_("#mg_np_d_e").html(rs.r);
				return;
			}
			$_("#mg_np").effects.fadeTo(0,500);
			g.pl[0].n = $_("#mg_np_dun").value();
			g.cSt("interim"); //start at new level
		});
		$_("#mg_mms").click(s.show); //start the settings div's appearance, and pause everything else
		$_("#mg_sd_cb").click(s.hide); //close the settings div, and revert back to previous game state
		$_("#mg_pb").click(function() { //toggle the pause/play state of the game
			if ($_("#mg_sd").css('display')=="block") return false;
			if (gen.st == "paused") g.cSt("game");
			else if (gen.st == "game") g.cSt("paused");
		});
		if (Storage) { //restore saved data
			if (localStorage.SGsnda) gen.snd.ambience.vol = parseFloat(localStorage.SGsnda);
			if (localStorage.SGsndm) gen.snd.music.vol = parseFloat(localStorage.SGsndm);
			if (localStorage.SGsnde) gen.snd.effects.vol = parseFloat(localStorage.SGsnde);
			if (localStorage.SGpn) g.pl[0].n = localStorage.SGpn;
			if (localStorage.SGpn2) g.pl[1].n = localStorage.SGpn2;
			if (localStorage.SGkt) {
				g.pl[0].kt = parseInt(localStorage.SGkt);
				g.pl[1].kt = 1-parseInt(localStorage.SGkt);
			}
			if (localStorage.SGhnt) gen.hints = (localStorage.SGhnt=="true");
			if (localStorage.SGism) gen.ismultiplayer = (localStorage.SGism=="true");
			if (localStorage.SGse) gen.specialeffects = (localStorage.SGse=="true");
			if (localStorage.SGfps) gen.fps = (localStorage.SGfps=="true");
		}
		$_("#mg_lo_bt_cntnu").click(g.nl); //prepare for the next level, when clicked
		$_("#mg_go_bt_cntnu").click(g.end); //end the level
		$get("mgAudio_ambience").volume = gen.snd.ambience.vol;
		$get("mgAudio_music").volume = gen.snd.music.vol;
		$get("mgAudio_effects").volume = gen.snd.effects.vol;
		$_("#mg_sd_sl_cr .mg_sd_slh").css("margin-left", Math.round((g.pl[0].c.r/255)*parseInt($_("#mg_sd_sl_cr").css("width")))-8+"px");
		$_("#mg_sd_sl_cg .mg_sd_slh").css("margin-left", Math.round((g.pl[0].c.g/255)*parseInt($_("#mg_sd_sl_cg").css("width")))-8+"px");
		$_("#mg_sd_sl_cb .mg_sd_slh").css("margin-left", Math.round((g.pl[0].c.b/255)*parseInt($_("#mg_sd_sl_cb").css("width")))-8+"px");
		$_("#mg_sd_cl_l").css("background-color", "rgb("+g.pl[0].c.r+","+g.pl[0].c.g+","+g.pl[0].c.b+")");
		$_("#mg_sd_snd_ambience .mg_sd_slh").css("margin-left", Math.round(gen.snd.ambience.vol*parseInt($_("#mg_sd_snd_ambience").css("width")))-8+"px");
		$_("#mg_sd_snd_music .mg_sd_slh").css("margin-left", Math.round(gen.snd.music.vol*parseInt($_("#mg_sd_snd_music").css("width")))-8+"px");
		$_("#mg_sd_snd_effects .mg_sd_slh").css("margin-left", Math.round(gen.snd.effects.vol*parseInt($_("#mg_sd_snd_effects").css("width")))-8+"px");
		$_(".mg_sd_sl .mg_sd_slh").mousedown(function(ev) {
			if (ev.preventDefault) ev.preventDefault();
			else window.event.returnValue = false;
			var cHandle = this;
			var cBar = this.parentNode;
			if ($_(cBar).attr("type")=="mg_snd")
				var sType = cBar.id.substring(10); //capture sound type
			else var cType = cBar.id.charAt(10);
			window.onmousemove = function(e) {
				var off = $_(cBar).offset().x;
				var offset = Mathf.limit(e.pageX-off, 0, $_(cBar).offsetWidth());
				$_(cHandle).css("margin-left", (offset-8)+"px");
				if ($_(cBar).attr("type")=="mg_snd") {
					var nsnd = offset/$_(cBar).offsetWidth();
					gen.snd[sType].vol = nsnd;
				} else {
					var cl = 25+Math.round((offset/$_(cBar).offsetWidth())*230);
					g.pl[0].c[cType] = cl;
					$_("#mg_sd_cl_l").css("background-color", "rgb("+g.pl[0].c.r+","+g.pl[0].c.g+","+g.pl[0].c.b+")");
				}
				return false;
			};
			window.onmouseup = function() {
				window.onmousemove = null;
				return false;
			};
		});
		$_("#mg_sd_cnkow").click(function() { //change the default input to WASD keys
			$_("#mg_sd_cnk_1").html("W");
			$_("#mg_sd_cnk_2").html("A");
			$_("#mg_sd_cnk_3").html("S");
			$_("#mg_sd_cnk_4").html("D");
			g.pl[0].kt=0;
			g.pl[1].kt=1;
		});
		$_("#mg_sd_cnkoa").click(function() { //change the default input to arrow keys
			$_("#mg_sd_cnk_1").html("&#x25B2;");
			$_("#mg_sd_cnk_2").html("&#x25C0;");
			$_("#mg_sd_cnk_3").html("&#x25BC;");
			$_("#mg_sd_cnk_4").html("&#x25B6;");
			g.pl[0].kt=1;
			g.pl[1].kt=0;
		});
		if (g.pl[0].kt==0) {
			$_("#mg_sd_cnk_1").html("W");
			$_("#mg_sd_cnk_2").html("A");
			$_("#mg_sd_cnk_3").html("S");
			$_("#mg_sd_cnk_4").html("D");
		} else if (g.pl[0].kt==1) {
			$_("#mg_sd_cnk_1").html("&#x25B2;");
			$_("#mg_sd_cnk_2").html("&#x25C0;");
			$_("#mg_sd_cnk_3").html("&#x25BC;");
			$_("#mg_sd_cnk_4").html("&#x25B6;");
		}
		$_("#mgpdbt_st").click(s.show); //show settings
		$_("#mgpdbt_qt, #mg_lo_bt_qt, #mg_go_bt_qt, #mg_go_m_bt_qt").click(g.qt); //quit game
		$_("#mg_lb_bt_qt").click(g.qlb); //quit leaderboards
		$_("#mg_mmb_bt_lbd, #mgpdbt_lb").click(g.slb); //show leaderboards
		$_("#mg_mmb_bt_hlp, #mgpdbt_hlp").click(g.shlp); //show help
		$_("#mg_hlp_qt").click(g.qhlp); //quit help menu
		var chkbxes =  $_(".mg_sd_chkbx").div;
		for (var j=0; j<chkbxes.length; j++) {
			var prop_name = chkbxes[j].id.substring(12);
			if (prop_name in gen && gen[prop_name])
				$_(chkbxes[j].getElementsByTagName("img")[0]).css({
					opacity: 1,
					visibility: "visible"
				});
		}
		$_(".mg_sd_chkbx").click(function() { //respond to checkbox toggle events
			var prop_name = this.id.substring(12);
			if (prop_name == "ismultiplayer" && g.sted) {
				$_("#mg_sd_ismultiplayer_ntf span").html("You cannot change this in the middle of a game.");
				$_("#mg_sd_ismultiplayer_ntf").effects.fadeTo(100,700,function() {
					intervs.ism_ntf = setTimeout(function() {
						$_("#mg_sd_ismultiplayer_ntf").effects.fadeTo(0,700);
					}, 3000);
				});
				return false;
			}
			if (prop_name in gen) {
				gen[prop_name] = !gen[prop_name];
				$_(this.getElementsByTagName("img")[0]).effects.fadeTo(gen[prop_name]?100:0,200);
			}
		});
		$_(window).keyCode(function(k) { //get the input of the user, while the actual game is running or paused, and move the player accordingly
			switch(gen.st) {
				case "interim":
				case "game":
					for (var pln=0; pln<(gen.ismultiplayer?g.plc:1); pln++)
						switch(k) {
							case (g.pl[pln].kt ? "up" : "w"):
								g.pl[pln].mv(0,pln);
								break;
							case (g.pl[pln].kt ? "right" : "d"):
								g.pl[pln].mv(1,pln);
								break;
							case (g.pl[pln].kt ? "down" : "s"):
								g.pl[pln].mv(2,pln);
								break;
							case (g.pl[pln].kt ? "left" : "a"):
								g.pl[pln].mv(3,pln);
								break;
						}
				case "paused":
					switch(k) {
						case "p":
							if ((gen.st == "game" || gen.st == "paused")&&!s.v) g.cSt(gen.st=="game" ? "paused" : "game");
							break;
					}				
				break;
			}
		});
	};
	this.intrvlist = function() { //lists all current intervals, outputted to an array
		var list = [];
		for (var a in intervs) list.push(a);
		return list;
	};
}
