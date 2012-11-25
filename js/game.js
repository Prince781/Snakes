/**********************************************
 * game.js
 * Main JavaScript file for the Snakes game.
 * DISCLAIMER:
 * --------------------------------------------
 * This code is free to redistribution and 
 * modification, as long as this statement
 * remains intact.
 * --------------------------------------------
 * 2012 Princeton Ferro
 **********************************************/

function SnakesGame(){ //must be called using the "new" JavaScript keyword
	var gThis = this;
	var intervs = []; //the intervals, used for looping all functions. Specifically a private variable for ease
	var cx = {}; //additional ScriJe "2d+" context for canvas
	function Hue(hue){ //hue=0->1
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
		os: function(){ //the offsets, in x and y, of the coordinates of the board within the canvas
			with(Math)
				return {
					x1: floor((gThis.cnv.width % 10)/2),
					x2: ceil((gThis.cnv.width % 10)/2),
					y1: floor((gThis.cnv.height % 10)/2),
					y2: ceil((gThis.cnv.height % 10)/2)
				};
		},
		cv: function(){ //the dimensions of the board within the canvas
			return {
				x: gThis.cnv.width-bd.os().x1-bd.os().x2,
				y: gThis.cnv.height-bd.os().y1-bd.os().y2
			};
		},
		gd: function(){ //the amound of grids, for x and y, of the board within the canvas. SHOULD BE A WHOLE NUMBER
			return {
				x: bd.cv().x/10 - 1,
				y: bd.cv().y/10 - 1
			};
		},
		ps: function(c){ //the pixel-coordinates on the board, for x and y, of an input grid point
			return {
				x: bd.os().x1+(c.x*10),
				y: bd.os().y1+(c.y*10)
			};
		},
		invalid: function(px,py){ //determine whether or not the point is invalid
			var validity = true; //the validity, or invalidity
			for (var a=0; a<gThis.mm.en.length; a++){
				for (var b=0; b<gThis.mm.en[a].p.length; b++){
					if (gThis.mm.en[a].p[b].x==px&&gThis.mm.en[a].p[b].y==py){
						validity = false;
						break;
					}
				}
			}
			for (var a=0; a<gThis.g.en.length; a++){
				for (var b=0; b<gThis.g.en[a].p.length; b++){
					if (gThis.g.en[a].p[b].x==px&&gThis.g.en[a].p[b].y==py){
						validity = false;
						break;
					}
				}
			}
			for (var a=0; a<gThis.g.pl.p.length; a++){
				if (gThis.g.pl.p[a].x==px&&gThis.g.pl.p[a].y==py){
					validity = false;
					break;
				}
			}
			if (px<0||px>bd.gd().x||py<0||py>bd.gd().y) validity = false;
			if (typeof px=="undefined"||typeof py=="undefined") validity = false;
			return !validity;
		}
	};
	var ai = { //various artificial intelligence functions
		createEnem: function(){
			var rDir = Mathf.randVal([0,1,2,3]); //generate a random direction, based on clockwise movement
			/*****
				0 -- up
				1 -- right
				2 -- down
				3 -- left
			******/
			var len = 10;
			var diff = 0.1;
			var rClr=Hue(gThis.g.st=="interim"||gThis.g.st=="game"?Mathf.randVal([Math.random()*(gThis.g.pl.c.h*(1-diff)),gThis.g.pl.c.h*(1+diff)+Math.random()*(1-gThis.g.pl.c.h)]):Math.random());
			return { //return a new object, as a game enemy
				c: { //the array of colors (r, g, b, a)
					r: rClr.r,
					g: rClr.g,
					b: rClr.b,
					a: 1
				},
				d: rDir,
				m: 0, //the current mode of the enemy (0,1,2, or 3). Corresponds to different behaviors
				p: (function(){ //the list of points (x, y)
					var pnts = [];
					pnts[0] = {
						x: Mathf.rand(20,bd.gd().x-20),
						y: Mathf.rand(20,bd.gd().y-20)
					};
					
					var frst = pnts[0];
					/*
					for (var i=1; i<=len-1; i++){
						pnts.push({ //add the other coordinates to the creature's coordinate list
							x: frst.x-([0,i,0,-i][rDir]), //note: these values are the REVERSE of any normal ones,
							y: frst.y-([i,0,-i,0][rDir])  //as point 0 shall be the starting point of the enemy
						});									 //hence, the -, instead of a +
					}
					*/
					return pnts;
				})(),
				lu: 0,//(gThis.g.st == "game" ? gThis.g.gt : (new Date()).getTime()),
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
		nextPos: function(c){ //where c is the input enemy
			var frst = c.p[0];
			var newPos = {
				x: frst.x+([0,1,0,-1][c.d]),
				y: frst.y+([-1,0,1,0][c.d])
			};
			return newPos;
		},
		nextDir: function(c){ //the modified version of ai.nextDir
			var pkd = [];
			//calculate the nearest distance of a pickup
			for (var i=0; i<gThis.g.pk.length; i++)
				if (gThis.g.pk[i].t!=1&&!gThis.g.pk[i].f) //avoid poison
					pkd.push({
						d: Math.sqrt(Math.pow(gThis.g.pk[i].p.x-c.p[0].x,2)+Math.pow(gThis.g.pk[i].p.y-c.p[0].y,2)),
						p: {
							x: gThis.g.pk[i].p.x,
							y: gThis.g.pk[i].p.y
						},
						i: i
					});
			var npkd = pkd.length>=1 ? $_.assort(pkd,true,"d")[0] : false; //the nearest pickup
			var endangered = false;
			var pCrds = {
				p: [],
				oL: 0
			};
			for (var x=0; x<=bd.os().x; x++){
				for (var y=0; y<=bd.os().y; y++){
					if (!bd.invalid(x,y)) pCrds.p.push({x:x,y:y,v:true,e:false}); //e is a true/false value, meaning "edge"; v has to do with validity
					else pCrds.p.push({x:x,y:y,v:false,e:false});
				}
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
			for (var a=0; a<pCrds.p.length; a++){
				if ((Math.abs(c.p[0].x-pCrds.p[a].x)==1&&c.p[0].y==pCrds.p[a].y)||(Math.abs(c.p[0].y-pCrds.p[a].y)==1&&c.p[0].x==pCrds.p[a].x)){
					cpcrds.push(pCrds.p[a]);
					pCrds.p.splice(a,1);
					a--;
				}
			}
			for (var b=0; b<cpcrds.length; b++){
				for (var a=0; a<pCrds.p.length; a++){
					if ((Math.abs(cpcrds[b].x-pCrds.p[a].x)==1&&cpcrds[b].y==pCrds.p[a].y)||(Math.abs(cpcrds[b].y-pCrds.p[a].y)==1&&cpcrds[b].x==pCrds.p[a].x)){
						cpcrds.push(pCrds.p[a]);
						pCrds.p.splice(a,1);
						a--;
					}
				}
			}
			if (cpcrds.length/pCrds.oL <= 0.7) endangered = true;
			var mode = 0;
			/************
			 * 0 - default; will simply move around aimlessly, and also act defensively
			 * 1 - aggressive; will try to limit moves of player
			 * 2 - economical; will try to find shortest available path to nearest pickups
			*************/
			var fp = typeof gThis.g.pl.p[0] == "undefined" ? false : gThis.g.pl.p[0];
			var dir = gThis.g.pl.d;
			mode=gThis.g.st=="game"?(npkd?2:((gThis.g.pl.irs||gThis.g.pl.dy||!fp)?0:1)):0;
			c.m = mode;
			//console.log("Current mode: "+["default","aggressive","economical"][c.m]);
			var nDir = -1;
			function inval(d){
				return bd.invalid(c.p[0].x+[0,1,0,-1][d],c.p[0].y+[-1,0,1,0][d]);
			}
			function ppD(d){
				var pList = [];
				var p = cpcrds;
				for (var i=0; i<p.length; i++)
					if ((d==0&&p[i].y<c.p[0].y)||(d==1&&p[i].x>c.p[0].x)||(d==2&&p[i].y>c.p[0].y)||(d==3&&p[i].x<c.p[0].x))
						pList.push(p[i]);
				return pList.length;
			}
			switch(mode){
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
					else{
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
	this.cnv = {}; //the game's canvas. MUST be defined before initialization
	this.stdiv = {}; //the game's "Settings" <div> element. MUST be defined before initialization
	this.mmdiv = {}; //the game's "Main Menu" <div> element. MUST be defined before initialization
	this.mm = { //the main components of the main menu, when the game has not been started. Has a similar structure to this.g
		str: (new Date()).getTime(), //the starting time of the appearance of the main menu
		en: [], //the array of enemies, except as passive creatures
		am: { //the sound array, containing info for ambience
			is: false, //whether or not we have background sound playing already
			pl: function(){ //function to begin playing
				if (gThis.mm.am.is) return false; //if background sound is already initialized
				gThis.mm.am.is = true;
				var aud = document.getElementById("mga"); //the game's main audio component
				var aud2 = document.getElementById("mga2"); //the second audio component (used for looping)
				//aud.volume = 0.2;
				//aud2.volume = 0.2;
				aud.play();
				aud.addEventListener("ended", function(){
					aud.currentTime = 0;
					if (gThis.g.st=="menu")aud2.play();
				}, false);
				aud2.addEventListener("ended", function(){
					aud2.currentTime = 0;
					if (gThis.g.st=="menu")aud.play();
				}, false);
			}
		}
	};
	this.s = { //info for the appearance of the settings menu
		v: false, //the visibility
		show: function(){
			if (gThis.s.v) return false;
			gThis.s.v = true;
			$_("#mg_sd").effects.fadeTo(100, 500);
			$_("#mg_sd").effects.toPosition("margin-left", -1, 500);
			$_("#mg_sd_inun").value(gThis.g.pl.n);
		},
		hide: function(){
			var rs = gThis.un.chk($_("#mg_sd_inun").value());
			if (!gThis.s.v) return false;
			else if (!rs.v){
				gThis.s.ntfy(rs.r);
				return false;
			}
			$_("#mg_sd").effects.fadeTo(0, 500);
			$_("#mg_sd").effects.toPosition("margin-left", -340, 500, function(){
				gThis.s.v = false;
			});
			gThis.g.pl.n = $_("#mg_sd_inun").value(); //set the game player's name
		},
		ntfy: function(msg){ //show notification
			if (gThis.s.t[0]) clearTimeout(gThis.s.t[0]);
			$_("#md_sd_inun_ntf span").html(msg);
			$_("#md_sd_inun_ntf").effects.fadeTo(100,400);
			gThis.s.t[0] = setTimeout(function(){
				$_("#md_sd_inun_ntf").effects.fadeTo(0,400);
			},3000);
		},
		t: [] //array of timers
	};
	this.un = { //info for username
		chk: function(username){ //validation
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
	this.h = { //info for the appearance of the tutorial
		
	};
	this.is = { //info for the image array
		l: [], //list
		a: function(loc){
			var img = new Image();
			img.src = loc;
			gThis.is.l.push(img);
		}
	};
	this.g = { //the main components of the game, when started
		st: "menu",
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
		sst: "menu", //the saved state of the previous game state
		cSt: function(s){ //function to change the current game state
			if (s=="paused"){
				gThis.g.pt=(new Date()).getTime();
				$_("#mg_pd").effects.fadeTo(100,300);
			} else if (s=="game"&&gThis.g.st=="paused"){
				gThis.g.rt=(new Date()).getTime();
				gThis.g.to += gThis.g.rt-gThis.g.pt;
				$_("#mg_pd").effects.fadeTo(0,300);
			}
			gThis.g.sst = gThis.g.st;
			gThis.g.st = s;
		},
		rSt: function(){ //function to revert the game state to the previous saved state
			var rv = gThis.g.sst;
			if (rv=="paused"){
				gThis.g.pt=(new Date()).getTime();
				$_("#mg_pd").effects.fadeTo(100,300);
			} else if (rv=="game"&&gThis.g.st=="paused"){
				gThis.g.rt=(new Date()).getTime();
				gThis.g.to += gThis.g.rt-gThis.g.pt;
				$_("#mg_pd").effects.fadeTo(0,300);
			}
			gThis.g.sst = gThis.g.st;
			gThis.g.st = rv;
			return rv;
		},
		bg: { //the array for the background gradient
			c: { //the list of colors
				0: $_.newColor(21,79,90,0.9),
				0.1: $_.newColor(21,79,90,0.6),
				0.8: $_.newColor(21,79,90,0)
			},
			o: 0, //the overall opacity of the radial gradient
			v: true, //whether or not it is visible
			dt: 0 //disappearance time
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
			s: function(){ //show
				if (gThis.g.tb.an=="show") return;
				gThis.g.tb.an = "show";
				gThis.g.tb.np.y = 0;
				gThis.g.tb.nc.bg.a = 0.4;
				gThis.g.tb.at = (new Date()).getTime();
			},
			h: function(){ //hide
				if (gThis.g.tb.an=="hide") return;
				gThis.g.tb.an = "hide";
				gThis.g.tb.np.y = -24;
				gThis.g.tb.nc.bg.a = 0;
				gThis.g.tb.at = (new Date()).getTime();
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
			a: function(px,py,t,c){ //add
				/*****
				 * types:
				 * 0 - sparkle effect
				******/
				gThis.g.a.ls.push({
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
		pl: {}, //the player (defined during initialization)
		en: [], //the array of enemies
		kt: 0, //the type of key input used. 0 for WASD, and 1 for arrow keys
		sn: {//the sound array, for information pertaining to the volume and sound of the game
			a: 0.1, //ambient volume
			e: 0.6, //effects volume
			m: 0.3 //music volume
		},
		pk: [], //the list of pickups
		lpa: 0, //the last time a pickup was added
		ap: function(){ //function to add a new pickup to the game
			var pc = [];
			for (var i=1; i<bd.gd().x-1; i++){
				for (var j=1; j<bd.gd().y-1; j++){
					var conflict = false;
					for (var k=0; k<gThis.g.en.length; k++){
						for (var l=0; l<gThis.g.en[k].p.length; l++)
							conflict = (gThis.g.en[k].p[l].x == i && gThis.g.en[k].p[l].y == j ? true : conflict);
					}
					for (var k=0; k<gThis.g.pl.p.length; k++)
						conflict = (gThis.g.pl.p[k].x == i && gThis.g.pl.p[k].y == j ? true : conflict);
					for (var k=0; k<gThis.g.pk.length; k++)
						conflict = (gThis.g.pk[k].p.x == i && gThis.g.pk[k].p.y == j ? true : conflict);
					if (!conflict) pc.push({x:i,y:j}); //if the coordinate is good
				}
			}
			if (pc.length==0) return false;
			var pType = Mathf.rand(0,100)==50?2:(Mathf.rand(0,100)>85?1:0); //the type of pickup
			var rCl = Hue(Math.random());
			gThis.g.pk.push({ //add the new pickup
				p: Mathf.randVal(pc), //choose a random coordinate
				c: { //add a new color
					r: rCl.r,
					g: rCl.g,
					b: rCl.b,
					a: 0,
					oa: 0 //old opacity
				},
				i: gThis.g.gt, //the time of instantiation
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
		bt: [ //the button array; used to store all current canvas-drawn UI elements conveniently
		/************************************************
		 * Five basic array keys:
		 * n --> (name) useful label
		 * w --> (width)
		 * h --> (height)
		 * p --> (position) object containing x and y
		 * c --> (color) stores rgba data
		 * e --> (event) list of interactive functions
		 ************************************************/
			{
				n: "pauseButton",
				w: 40,
				h: 40,
				p: {
					x: 0, //to be later defined
					y: 0  //in an additional function...
				},
				c: {
					r: 24,
					g: 24,
					b: 24,
					a: 0.6
				},
				r: false, //whether or not the button is to the right
				m: false, //whether or not the button is moving
				mt: 0, //the start of the button moving
				mo: false, //whether or not the mouse is over the button
				sr: 20, //the shadow radius
				nsr: 20, //the new shadow radius
				srt: 0,  //the shadow radius time
				osr: 20, //the old shadow radius
				e: {
					ismouseover: false,
					mouseover: function(){
						gThis.g.bt[0].srt = (new Date()).getTime();
						gThis.g.bt[0].osr = gThis.g.bt[0].sr;
						gThis.g.bt[0].nsr = 30;
						gThis.g.bt[0].e.ismouseover = true;
					},
					mouseout: function(){
						gThis.g.bt[0].srt = (new Date()).getTime();
						gThis.g.bt[0].osr = gThis.g.bt[0].sr;
						gThis.g.bt[0].nsr = 20;
						gThis.g.bt[0].e.ismouseover = false;
					},
					click: function(){
						if ((gThis.g.st == "game" || gThis.g.st == "paused")&&!gThis.s.v) gThis.g.cSt(gThis.g.st=="game" ? "paused" : "game");
					}
				}
			}
		],
		gt: 0, //the game time interval
		pt: 0, //the time of pausing
		rt: 0, //the time of resuming
		to: 0, //the time offset (current time - to)
		glA: 1, //the global alpha value
		glAat: 0, //time of global alpha animation start time
		nl: function(){ //make preparations for the next level
			if (gThis.g.st=="interim") return false;
			if (gThis.g.st=="complete")
				$_("#mg_lo").effects.fadeTo(0,1000);
			gThis.g.pl.p.push({x:Mathf.rand(5,bd.gd().x-5),y:Mathf.rand(5,bd.gd().y-5)});
			gThis.g.pl.s+=gThis.g.pl.cs; //reset scores
			gThis.g.pl.cs=0;
			gThis.g.st = "interim";
		},
		qt: function(){ //quit to the main menu
			gThis.g.st = "menu";
			$_("#mg_mmi").effects.fadeTo(100,500); //show the main menu
			//hide other items, and reset values
			$_("#mg_np").effects.fadeTo(0,500, function(){
				$_("#mg_np").css('display','none');
			});
			$_("#mg_pd").effects.fadeTo(0,500, function(){
				$_("#mg_pd").css('display','none');
			});
			$_("#mg_lo").effects.fadeTo(0,500, function(){
				$_("#mg_lo").css('display','none');
			});
			$_("#mg_lb").effects.fadeTo(0,500, function(){
				$_("#mg_lo").css('display','none');
			});
			gThis.g.tb.h();
			gThis.g.bg.v = true;
			gThis.g.bg.dt = 0;
			gThis.mm.str = (new Date()).getTime(); //reset visibility of radial gradient
			gThis.g.pl.s = 0;
			gThis.g.pl.cs = 0;
			gThis.g.pl.hm = false; //change has_moved attribute
			gThis.g.pl.p.splice(0,gThis.g.pl.p.length);
			gThis.g.pl.p.push({x:Mathf.rand(5,bd.gd().x-5),y:Mathf.rand(5,bd.gd().y-5)});
			gThis.g.en.splice(0,gThis.g.en.length);
			gThis.g.pl.lv = 3;
			gThis.g.pl.pn = false;
			gThis.g.pl.dy = false;
			gThis.g.pl.irs = false;
			gThis.g.pl.c.a = 1;
			gThis.g.lv = 0;
		},
		end: function(){ //end the game; show leaderboards
			if (gThis.g.st!="over") return false;
			gThis.g.pl.s+=gThis.g.pl.cs; //add on score
			gThis.g.st = "lboard"; //change to leaderboards
			if ($_("#mg_lb_td").css('display')=='none') {
				$_("#mg_lb_td").effects.fadeTo(100,500);
				console.log("Fading in #mg_lb_td...");
			}
			$_("#mg_lb").effects.fadeTo(100,500); //show the leaderboards
			$_("#mg_go").effects.fadeTo(0,500); //hide the game over div
			$_("#mg_lb_td_top span").html(gThis.g.pl.n);
			$_("#mg_lb_td_btm span").html(gThis.g.pl.s);
			
		},
		sbm: function(){ //submit leaderboards info
		}, 
		glb: function(){ //get leaderboards info
			
		}
	};
	this.init = function(){ //the main initialization function
		if (!("width" in gThis.cnv && "style" in gThis.stdiv && "style" in gThis.mmdiv))
			return false;
		gThis.mm.str = (new Date()).getTime();
		gThis.g.pl = (function(){ //the player
			var dir = Mathf.rand(0,3); //create a random direction
			var pnts = [];
			var len = 10;
			pnts[0] = {
				x: Mathf.rand(20,bd.gd().x-20),
				y: Mathf.rand(20,bd.gd().y-20)
			};
			var frst = pnts[0];
			for (var i=1; i<=len-1; i++){
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
				lu: gThis.g.gt, //the last time the player's position was updated
				l: len, //the length of the player
				pn: { //poison info, if the player is poisoned
					p: false, //whether or not the player is poisoned
					pt: function(){ //poison time interval, for player, to decrease length
						return (gThis.g.pl.pn.p&&!gThis.g.pl.dy)?Math.round(1+1000*Math.pow(gThis.g.pl.lv,-gThis.g.pl.lv/20)):false;
					},
					ipt: gThis.g.gt, //initial poison time
					lpt: gThis.g.gt, //last poison time
					af: function(){ //affect
						if (!gThis.g.pl.pn.p||gThis.g.gt-gThis.g.pl.pn.lpt<gThis.g.pl.pn.pt()||gThis.g.pl.dy) return false;
						gThis.g.pl.pn.lpt = gThis.g.gt;
						gThis.g.pl.pn.lpt = gThis.g.gt;
						gThis.g.pl.l--;
						if (gThis.g.pl.l<=1){ //kill player
							gThis.g.pl.dy = true;
							gThis.g.pl.dt = gThis.g.gt;
						}
					}
				},
				dy: false, //whether or not the player is dying
				dt: false, //the time (timestamp) when dying was initiated
				irs: false, //whether or not the player is resurrecting
				rt: 0, //the time of resurrection
				rs: function(){ //resurrect the player after a death
					gThis.g.pl.d = -1;
					gThis.g.pl.irs = true;
					gThis.g.pl.dy = false;
					gThis.g.pl.p.splice(0,gThis.g.pl.p.length); //remove every point
					gThis.g.pl.lv--;
					if (gThis.g.pl.lv==0) return false;
					/*
					var safeCoords = [];
					for (var x=10; x<=bd.gd().x-10; x++){
						for (var y=10; y<=bd.gd().y-10; y++){
							if (!bd.invalid(x,y)) safeCoords.push({x:x,y:y});
						}
					}
					gThis.g.pl.p.push(Mathf.randVal(safeCoords));
					*/
					gThis.g.pl.p.push({x:Mathf.rand(10,bd.gd().x-10),y:Mathf.rand(10,bd.gd().y-10)});
					gThis.g.pl.l = 10;
					gThis.g.pl.rt = gThis.g.gt;
					var dList = [];
					function room(dir){
						var x=gThis.g.pl.p[0].x+[0,1,0,-1][dir],y=gThis.g.pl.p[0].y+[-1,0,1,0][dir];
						switch(dir){
							case 0:
								for (y;y>-2;y--)
									if (bd.invalid(x,y)) return dList.push({t:dir, d:Mathf.distance(x,y,x,gThis.g.pl.p[0].y)});
								break;
							case 1:
								for (x;x<=bd.gd().x+1;x++)
									if (bd.invalid(x,y)) return dList.push({t:dir, d:Mathf.distance(x,y,gThis.g.pl.p[0].x,y)});
								break;
							case 2:
								for (y;y<=bd.gd().y+1;y++)
									if (bd.invalid(x,y)) return dList.push({t:dir, d:Mathf.distance(x,y,x,gThis.g.pl.p[0].y)});
								break;
							case 3:
								for (x;x>-2;x--)
									if (bd.invalid(x,y)) return dList.push({t:dir, d:Mathf.distance(x,y,gThis.g.pl.p[0].x,y)});
								break;
						}
					}
					//for (var d=0; d<=3; d++) room(d);
					gThis.g.pl.d = Mathf.rand(0,3);//$_.assort(dList,false,"d")[0].t;
				},
				hm: false, //whether or not the player has decided to move
				mv: function(d){ //function to move the player according to direction
					if (gThis.g.pl.dy || gThis.g.pl.irs) return false;
					else if ([2,3,0,1][d]==gThis.g.pl.d){
						if (gThis.g.st=="interim")gThis.g.pl.hm = true;
						return false;
					}
					if (gThis.g.st=="interim")gThis.g.pl.hm = true;
					gThis.g.pl.qd = d;
				},
				pf: function(){
					if (gThis.g.pl.dy || gThis.g.pl.irs) return false;
					var coord = {
						x:gThis.g.pl.p[0].x+[0,1,0,-1][gThis.g.pl.qd],
						y:gThis.g.pl.p[0].y+[-1,0,1,0][gThis.g.pl.qd]
					};
					var conflict = false;
					for (var a=1; a<gThis.g.pl.p.length; a++){
						if (coord.x==gThis.g.pl.p[a].x && coord.y==gThis.g.pl.p[a].y){
							conflict = true;
							break;
						}
					}
					for (var a=0; a<gThis.g.en.length; a++){
						var en = gThis.g.en[a];
						for (var b=0; b<en.p.length; b++){
							if (coord.x==en.p[b].x && coord.y==en.p[b].y){
								conflict = true;
								break;
							}
						}
					}
					if (coord.x<0||coord.x>bd.gd().x||coord.y<0||coord.y>bd.gd().y) conflict = true;
					if (conflict){
						gThis.g.pl.dy = true;
						gThis.g.pl.dt = gThis.g.gt;
					} else gThis.g.pl.p.splice(0,0,coord);
				},
				lv: 3 //the amount of lives left in the player
			};
		})();
		gThis.g.bt[0].p = { //the position of the pause button
			x: bd.os().x1+10,
			y: bd.os().y1+bd.cv().y-gThis.g.bt[0].h-10
		};
		gThis.g.tb.d.w = gThis.cnv.width;
		gThis.g.pg.p = {
			x: gThis.cnv.width-10-gThis.g.pg.d.w, //position of progress bar
			y: gThis.g.tb.p.y+gThis.g.tb.d.h+10
		};
		gThis.is.a("img/heart.png");
		gThis.is.a("img/heart_gs.png");
		$_("#mg_mmi").effects.fadeTo(100,200, function(){
			intervs.draw = setInterval(gThis.draw, 1); //start the interval for the drawing of the main canvas
		});
		$_("#mg_mmpn").click(function(){
			if (gThis.s.v) return false;
			$_("#mg_mmi").effects.fadeTo(0,200);
			if (gThis.g.pl.n == ""){
				$_("#mg_np").effects.fadeTo(100,500);
				$_("#mg_np_dun").value(gThis.g.pl.n);
			} else gThis.g.cSt("interim"); //start at new level
		});
		$_("#mg_np_dc").click(function(){ //start the game, if there is a valid username
			var rs = gThis.un.chk($_("#mg_np_dun").value());
			if (!rs.v){
				$_("#mg_np_d_e").effects.fadeTo(100,700);
				$_("#mg_np_d_e").html(rs.r);
				return;
			}
			$_("#mg_np").effects.fadeTo(0,500);
			gThis.g.pl.n = $_("#mg_np_dun").value();
			gThis.g.cSt("interim"); //start at new level
		});
		$_("#mg_mms").click(gThis.s.show); //start the settings div's appearance, and pause everything else
		$_("#mg_sd_cb").click(gThis.s.hide); //close the settings div, and revert back to previous game state
		if (Storage){
			if (localStorage.SGsnda) gThis.g.sn.a = parseFloat(localStorage.SGsnda);
			if (localStorage.SGsnde) gThis.g.sn.e = parseFloat(localStorage.SGsnde);
			if (localStorage.SGpn) gThis.g.pl.n = localStorage.SGpn;
			if (localStorage.SGkt) gThis.g.kt = parseFloat(localStorage.SGkt);
		}
		$_("#mg_lo_bt_cntnu").click(gThis.g.nl); //prepare for the next level, when clicked
		$_("#mg_bo_bt_cntnu").click(gThis.g.end); //end the level
		$get("mga").volume = gThis.g.sn.a;
		$get("mga2").volume = gThis.g.sn.a;
		$get("mga3").volume = gThis.g.sn.e;
		$_("#md_sd_sl_cr .md_sd_slh").css("margin-left", Math.round((gThis.g.pl.c.r/255)*parseInt($_("#md_sd_sl_cr").css("width")))-8+"px");
		$_("#md_sd_sl_cg .md_sd_slh").css("margin-left", Math.round((gThis.g.pl.c.g/255)*parseInt($_("#md_sd_sl_cg").css("width")))-8+"px");
		$_("#md_sd_sl_cb .md_sd_slh").css("margin-left", Math.round((gThis.g.pl.c.b/255)*parseInt($_("#md_sd_sl_cb").css("width")))-8+"px");
		$_("#mg_sd_cl_l").css("background-color", "rgb("+gThis.g.pl.c.r+","+gThis.g.pl.c.g+","+gThis.g.pl.c.b+")");
		$_("#mg_sd_snda .md_sd_slh").css("margin-left", Math.round(gThis.g.sn.a*parseInt($_("#mg_sd_snda").css("width")))-8+"px");
		$_("#mg_sd_sndm .md_sd_slh").css("margin-left", Math.round(gThis.g.sn.m*parseInt($_("#mg_sd_sndm").css("width")))-8+"px");
		$_("#mg_sd_snde .md_sd_slh").css("margin-left", Math.round(gThis.g.sn.e*parseInt($_("#mg_sd_snde").css("width")))-8+"px");
		$_(".md_sd_sl .md_sd_slh").mousedown(function(){
			var cHandle = this;
			var cBar = this.parentNode;
			if ($_(cBar).attr("type")=="mg_snd"){
				var sType = cBar.id.charAt(9);
			} else var cType = cBar.id.charAt(10);
			window.onmousemove = function(e){
				var off = $_(cBar).offset().x;
				var offset = Mathf.limit(e.pageX-off, 0, cBar.offsetWidth);
				$_(cHandle).css("margin-left", (offset-8)+"px");
				if ($_(cBar).attr("type")=="mg_snd"){
					var nsnd = offset/cBar.offsetWidth;
					gThis.g.sn[sType] = nsnd;
				} else {
					var cl = 25+Math.round((offset/cBar.offsetWidth)*230);
					gThis.g.pl.c[cType] = cl;
					$_("#mg_sd_cl_l").css("background-color", "rgb("+gThis.g.pl.c.r+","+gThis.g.pl.c.g+","+gThis.g.pl.c.b+")");
				}
				return false;
			};
			window.onmouseup = function(){
				window.onmousemove = null;
				return false;
			};
		});
		$_("#mg_sd_cnkow").click(function(){ //change the default input to WASD keys
			$_("#mg_sd_cnk_1").html("W");
			$_("#mg_sd_cnk_2").html("A");
			$_("#mg_sd_cnk_3").html("S");
			$_("#mg_sd_cnk_4").html("D");
			gThis.g.kt=0;
		});
		$_("#mg_sd_cnkoa").click(function(){ //change the default input to arrow keys
			$_("#mg_sd_cnk_1").html("&#x25B2");
			$_("#mg_sd_cnk_2").html("&#x25C0");
			$_("#mg_sd_cnk_3").html("&#x25BC");
			$_("#mg_sd_cnk_4").html("&#x25B6");
			gThis.g.kt=1;
		});
		if (gThis.g.kt==0){
			$_("#mg_sd_cnk_1").html("W");
			$_("#mg_sd_cnk_2").html("A");
			$_("#mg_sd_cnk_3").html("S");
			$_("#mg_sd_cnk_4").html("D");
		} else if (gThis.g.kt==1){
			$_("#mg_sd_cnk_1").html("&#x25B2");
			$_("#mg_sd_cnk_2").html("&#x25C0");
			$_("#mg_sd_cnk_3").html("&#x25BC");
			$_("#mg_sd_cnk_4").html("&#x25B6");
		}
		$_("#mgpdbt_st").click(gThis.s.show);
		$_("#mgpdbt_qt, #mg_lo_bt_qt, #mg_lb_bt_qt").click(gThis.g.qt);
		$_(window).keyCode(function(k){ //get the input of the user, while the actual game is running or paused, and move the player accordingly
			switch(gThis.g.st){
				case "interim":
				case "game":
					switch(k){
						case (gThis.g.kt ? "up" : "w"):
							gThis.g.pl.mv(0);
							break;
						case (gThis.g.kt ? "right" : "d"):
							gThis.g.pl.mv(1);
							break;
						case (gThis.g.kt ? "down" : "s"):
							gThis.g.pl.mv(2);
							break;
						case (gThis.g.kt ? "left" : "a"):
							gThis.g.pl.mv(3);
							break;
					}
				case "paused":
					switch(k){
						case "p":
							if ((gThis.g.st == "game" || gThis.g.st == "paused")&&!gThis.s.v) gThis.g.cSt(gThis.g.st=="game" ? "paused" : "game");
							break;
					}				
				break;
			}
		});
		$_(gThis.cnv).mousemove(function(e){
			var mouse = {
				x: e.pageX-$_(gThis.cnv).offset().x,
				y: e.pageY-$_(gThis.cnv).offset().y
			};
			for (var i=0; i<gThis.g.bt.length; i++){
				var hovering = (mouse.y-gThis.g.bt[i].p.y >= 0 
								&& mouse.y-gThis.g.bt[i].p.y<=gThis.g.bt[i].h 
								&& mouse.x-gThis.g.bt[i].p.x >= 0
								&& mouse.x-gThis.g.bt[i].p.x<=gThis.g.bt[i].w);
				if (typeof gThis.g.bt[i].e.mouseover == "function" && hovering && !gThis.g.bt[i].e.ismouseover)
					gThis.g.bt[i].e.mouseover(); //invoke mouseover event
				else if (typeof gThis.g.bt[i].e.mouseout == "function" && gThis.g.bt[i].e.ismouseover && !hovering)
					gThis.g.bt[i].e.mouseout(); //invoke mouseout event
			}
		});
		$_(gThis.cnv).click(function(e){
			var mouse = {
				x: e.pageX-$_(gThis.cnv).offset().x,
				y: e.pageY-$_(gThis.cnv).offset().y
			};
			for (var i=0; i<gThis.g.bt.length; i++){
				var hovering = (mouse.y-gThis.g.bt[i].p.y >= 0 
								&& mouse.y-gThis.g.bt[i].p.y<=gThis.g.bt[i].h 
								&& mouse.x-gThis.g.bt[i].p.x >= 0
								&& mouse.x-gThis.g.bt[i].p.x<=gThis.g.bt[i].w);
				if (typeof gThis.g.bt[i].e.click == "function" && hovering)
					gThis.g.bt[i].e.click(); //invoke click event
			}
		});
	};
	this.draw = function(){ //the main drawing function of the game, which renders everything on the canvas
		cx = $_(gThis.cnv).ctx("2d+"); //additional ScriJe "2d+" context for canvas
		cx.clearRect(0, 0, gThis.cnv.width, gThis.cnv.height);
		with(cx){ //resetting values...
			strokeStyle="rgba(0,0,0,0)";
			fillStyle="rgba(0,0,0,0)";
			shadowColor="rgba(0,0,0,0)";
			shadowOffsetX=0;
			shadowOffsetY=0;
			lineWidth=0;
			lineJoin="miter";
		}
		if (gThis.g.bg.v){
			if ((new Date()).getTime()-gThis.mm.str < 1000 && gThis.g.bg.dt==0)
				gThis.g.bg.o = Math.pow(((new Date()).getTime()-gThis.mm.str)/1000,2);
			if (gThis.g.st != "menu" && gThis.g.bg.dt==0) gThis.g.bg.dt = (new Date()).getTime();
			if (gThis.g.bg.dt != 0 && (new Date()).getTime()-gThis.g.bg.dt < 1000)
				gThis.g.bg.o = 1-Math.pow(((new Date()).getTime()-gThis.g.bg.dt)/1000,2);
			else if ((new Date()).getTime()-gThis.g.bg.dt >= 1000 && gThis.g.bg.dt != 0)
				gThis.g.bg.v = false;
			var rg = cx.createRadialGradient(Math.round(gThis.cnv.width/2), Math.round(gThis.cnv.height/2), gThis.cnv.height*0.1, Math.round(gThis.cnv.width/2), Math.round(gThis.cnv.height/2), gThis.cnv.height);
			for (var a in gThis.g.bg.c){
				var col = gThis.g.bg.c[a];
				rg.addColorStop(a,"rgba("+col.r+","+col.g+","+col.b+","+(col.a*gThis.g.bg.o)+")");
			}
			cx.fillStyle=rg;
			cx.fillRect(0, 0, gThis.cnv.width, gThis.cnv.height);
		}
		if (gThis.g.st == "menu"){ //render the main menu
			if ($_(gThis.mmdiv).css("display") != "block")
				$_(gThis.mmdiv).effects.fadeTo(100,700);
			gThis.mm.am.pl(); //play the ambient music
			if (gThis.mm.en.length==0) //create more enemies, if none exist
				gThis.mm.en.push(ai.createEnem()); //create a new random enemy, and store it
			for (var i=0; i<gThis.mm.en.length; i++){
				if ((new Date()).getTime()-gThis.mm.en[i].lu >= 50 || gThis.mm.en[i].dy){ //don't perform if the enemy's position has been updated recently, or if it is dying
					gThis.mm.en[i].lu = (new Date()).getTime();
						gThis.mm.en[i].d = ai.nextDir(gThis.mm.en[i]); //find the next direction, based on the AI
					if (![1,1,1,1][(gThis.mm.en[i].d)]){ //if there are no more directions
						if (!gThis.mm.en[i].dy)
							gThis.mm.en[i].dc = (new Date()).getTime(); //set the decay time
						gThis.mm.en[i].dy = true; //set the dying attribute to be true
						var delta = (new Date()).getTime()-gThis.mm.en[i].dc;
						gThis.mm.en[i].c.a = 1-Math.pow(delta/1000,2);
						if (delta >= 1000){
							gThis.mm.en.splice(i,1); //remove the enemy
							i--;
							continue;
						}
					} else {
						gThis.mm.en[i].p.splice(0, 0, ai.nextPos(gThis.mm.en[i])); //create a new position
						if (gThis.mm.en[i].p.length > gThis.mm.en[i].l)
							gThis.mm.en[i].p.splice(gThis.mm.en[i].p.length-1, 1); //remove the last position
					}
				}
				var cl = gThis.mm.en[i].c;
				for (var j=0; j<gThis.mm.en[i].p.length; j++){
					var p = gThis.mm.en[i].p[j];
					cx.fillStyle = "rgba("+cl.r+","+cl.g+","+cl.b+","+cl.a+")";
					cx.strokeStyle = "rgba(0,0,0,0)";
					cx.fillRoundedRect(bd.os().x1+bd.ps(p).x+1, bd.os().y1+bd.ps(p).y+1, 8, 8, 2);
				}
			}
		} else if (gThis.g.st == "game" || gThis.g.st == "paused" || gThis.g.st == "interim" || gThis.g.st == "complete" || gThis.g.st == "over"){ //render the main game, if currently running, paused, or over
			if (gThis.g.st == "game") gThis.g.gt = (new Date()).getTime()-gThis.g.to;
			if (gThis.g.pl.cs/20==gThis.g.gl && !gThis.g.glc && gThis.g.gl!==0 && gThis.g.st!=="complete"){ //level has been completed
				gThis.g.glc=true;
				gThis.g.glct=(new Date()).getTime(); //set time for goal completion
			} else if (gThis.g.glc && (new Date()).getTime()-gThis.g.glct<1000 && gThis.g.st!=="complete")
				gThis.g.glA = 1-Math.pow(((new Date()).getTime()-gThis.g.glct)/1000,2);
			else if (gThis.g.glc && (new Date()).getTime()-gThis.g.glct>=1000 && gThis.g.st!=="complete"){
				gThis.g.glA = 0;
				for (var i=0;i<gThis.g.en.length;i++){
					gThis.g.en.splice(i,1);
					i--;
				}
				gThis.g.pl.p.splice(0,gThis.g.pl.p.length);
				gThis.g.pl.l=10;
				gThis.g.glc=false;
				gThis.g.glct=false;
				$_("#mg_lo_d span").html(gThis.g.lv);
				gThis.g.st = "complete";
				gThis.g.olv = gThis.g.lv;
			} else if (gThis.g.glAat&&(new Date()).getTime()-gThis.g.glAat<1000)
				gThis.g.glA = Math.pow(((new Date()).getTime()-gThis.g.glAat)/1000,2);
			else if (gThis.g.glAat&&(new Date()).getTime()-gThis.g.glAat>=1000){
				gThis.g.glA = 1;
				gThis.g.glAat = false;
			}
			if (gThis.g.st=="interim"){ //if we're at the very start of the game's level
				if ((gThis.g.lv==0||gThis.g.lv==gThis.g.olv)&&gThis.g.pl.n!==""){
					if (gThis.g.en.length==0)gThis.g.en.push(ai.createEnem()); //create a new enemy
					gThis.g.lv++;
					gThis.g.olv=gThis.g.lv-1;
				}
				gThis.g.pl.lu = gThis.g.gt;
				with(Math)gThis.g.gl = floor(5*(log(pow(gThis.g.lv,0.6))+1)); //set the goal for the current level
				gThis.g.lpa = gThis.g.gt;
				if (!gThis.g.tb.v) gThis.g.tb.s(); //show the top bar
				$get("mga").pause();
				$get("mga2").pause();
				if (gThis.g.pl.hm){
					gThis.g.st="game";
					gThis.g.pl.hm=false;
				}
				if (!gThis.g.glAat&&gThis.g.glA!==1) gThis.g.glAat = (new Date()).getTime();
			} else if (gThis.g.st=="game"||gThis.g.st=="paused"){ //otherwise, we're in the middle of the game, at an unknown level yet
				if (gThis.g.en.length==0 && !gThis.g.glc) //if there are no current enemies
					gThis.g.en.push(ai.createEnem());
				if (gThis.g.gt-gThis.g.lpa >= 10000 && (gThis.g.pk.length==0||gThis.g.pk.length<=10) && !gThis.g.glc)
					if (gThis.g.ap()) gThis.g.lpa = gThis.g.gt; //add a pickup, and set the last pickup addition time
				for (var i=0;i<gThis.g.a.ls.length;i++){ //render all animations
					switch(gThis.g.a.ls[i].t){
						case 0: //sparkle animation
							var pn={x:gThis.g.a.ls[i].p.x,y:gThis.g.a.ls[i].p.y};
							var pnts=[]; //particles
							if (gThis.g.a.ls[i].int==0){ //initialize
								gThis.g.a.ls[i].int=gThis.g.gt;
								gThis.g.a.ls[i].r=10; //radius
							}
							if (gThis.g.gt-gThis.g.a.ls[i].int<=1700){
								var dlt=(gThis.g.gt-gThis.g.a.ls[i].int)/1700;
								var mr=100; //md=maximum diameter
								gThis.g.a.ls[i].r=dlt*mr;
								gThis.g.a.ls[i].cl.a=1-dlt;
								function g(x,y,d,r){with(Math)return{x:x+r*parseFloat(cos(PI*d/180).toFixed(14)),y:y+r*parseFloat(sin(PI*d/180).toFixed(14))};}
								for (var deg=0;deg<360;deg+=360/30)
									pnts.push(g(pn.x,pn.y,deg,gThis.g.a.ls[i].r));
							} else if(gThis.g.gt-gThis.g.a.ls[i].int>1700){
								gThis.g.a.ls.splice(i,1);
								i--;
								continue;
							}
							var cl = gThis.g.a.ls[i].cl;
							cx.fillStyle="rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*gThis.g.glA)+")";
							for (var j=0;j<pnts.length;j++){
								cx.beginPath();
								cx.arc(pnts[j].x,pnts[j].y,1,0,Math.PI*2,false);
								cx.fill();
								cx.closePath();
							}
							break;
					}
				}
				for (var i=0; i<gThis.g.pk.length; i++){ //render all of the pickups
					if (gThis.g.gt-gThis.g.pk[i].i < 750)
						gThis.g.pk[i].c.a = Math.pow((gThis.g.gt-gThis.g.pk[i].i)/750,3);
					var eg = { g: false, e: 0 };
					for (var j=0; j<gThis.g.en.length; j++){
						if (gThis.g.pk[i].f) break;
						if (gThis.g.en[j].p[0].x == gThis.g.pk[i].p.x && gThis.g.en[j].p[0].y == gThis.g.pk[i].p.y){
							eg.g = true;
							eg.e = j;
							break;
						}
					}
					var cl = gThis.g.pk[i].c;
					var pk = { x: bd.os().x1+bd.ps(gThis.g.pk[i].p).x+5, y: bd.os().y1+bd.ps(gThis.g.pk[i].p).y+5 };
					if (!gThis.g.pl.irs && !gThis.g.pl.dy && gThis.g.pl.p[0].x == gThis.g.pk[i].p.x && gThis.g.pl.p[0].y == gThis.g.pk[i].p.y && !gThis.g.pk[i].f && gThis.g.st != "paused" && !gThis.g.pk[i].f){
						switch (gThis.g.pk[i].t){
							case 0: //pickup
								gThis.g.pl.cs+=20; //increase the player's score
								gThis.g.pl.l+=5; //increase the player's length
								break;
							case 1: //poison
								gThis.g.pl.pn.p = true; 
								gThis.g.pl.pn.ipt = gThis.g.gt;
								if(gThis.g.pl.cs-20>=0)gThis.g.pl.cs-=20;
								break;
							case 2: //life
								gThis.g.pl.lv+=(gThis.g.pl.lv<3?1:0);
								gThis.g.pl.l+=5;
								gThis.g.pl.cs+=60;
								gThis.g.a.a(pk.x,pk.y,0,{r:cl.r,g:cl.g,b:cl.b,a:cl.a}); //animation
								break;
						}
						gThis.g.pk[i].f = true; //set the item to fade away
						gThis.g.pk[i].ft = gThis.g.gt;
						gThis.g.pk[i].c.oa = gThis.g.pk[i].c.a; //save the old opacity
						$get("mga3").currentTime = 0;
						$get("mga3").play(); //play a sound
					} else if (eg.g && gThis.g.st != "paused" && !gThis.g.pk[i].f){ //if an enemy took the pickup instead
						switch (gThis.g.pk[i].t){
							case 0: //pickup
								gThis.g.en[eg.e].l+=5; //increase the enemy's length
								break;
							case 1: //poison
								gThis.g.en[eg.e].pn.p = true;
								gThis.g.en[eg.e].pn.ipt = gThis.g.gt;
								break;
							case 2: //life
								gThis.g.en[eg.e].l+=20;
								gThis.g.a.a(pk.x,pk.y,0,{r:cl.r,g:cl.g,b:cl.b,a:cl.a}); //animation
								break;
						}
						gThis.g.pk[i].f = true; //set the item to fade away
						gThis.g.pk[i].ft = gThis.g.gt;
						gThis.g.pk[i].c.oa = gThis.g.pk[i].c.a; //save the old opacity
					} else if (gThis.g.gt-gThis.g.pk[i].i > 10000 && !gThis.g.pk[i].f){ //if existing time > 10 seconds
						gThis.g.pk[i].f = true; //set the item to fade away
						gThis.g.pk[i].ft = gThis.g.gt;
						gThis.g.pk[i].c.oa = gThis.g.pk[i].c.a; //save the old opacity
					}
					if (gThis.g.pk[i].f){
						if (gThis.g.gt-gThis.g.pk[i].ft > 750){
							gThis.g.pk.splice(i,1); //remove the item
							i--;
							continue;
						} else gThis.g.pk[i].c.a = gThis.g.pk[i].c.oa-Math.pow(gThis.g.pk[i].c.oa*(gThis.g.gt-gThis.g.pk[i].ft)/750,2);
					} else if (gThis.g.gt-gThis.g.pk[i].i >= 750 && gThis.g.st != "paused")//render the fading in and out of the pickup
						with(Math)gThis.g.pk[i].c.a = abs(parseFloat(sin((gThis.g.gt-gThis.g.pk[i].i)/1500*PI).toFixed(14)));
					cx.fillStyle = "rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*gThis.g.glA)+")";
					function pkGradient(r1,r2){
						var pkrg = cx.createRadialGradient(
							pk.x, 
							pk.y, 
							(typeof r1=="undefined"?1:r1), 
							pk.x, 
							pk.y, 
							(typeof r2=="undefined"?16:r2)
						);
						pkrg.addColorStop(0,"rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*gThis.g.glA)+")");
						pkrg.addColorStop(0.3,"rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*0.3*gThis.g.glA)+")");
						pkrg.addColorStop(1,"rgba("+cl.r+","+cl.g+","+cl.b+",0)");
						cx.fillStyle=pkrg;
						cx.fillRect(bd.os().x1+bd.ps(gThis.g.pk[i].p).x-10, bd.os().y1+bd.ps(gThis.g.pk[i].p).y-10, 30, 30);
					}
					function drawSquig(px,py,rd,fld,vr){
						function squig(x,r,fl,v){with(Math)return sqrt(4*((4-v*4)+sin(fl*x))-pow(x,2));}
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
					switch (gThis.g.pk[i].t){
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
							cx.strokeStyle = "rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*0.5*gThis.g.glA)+")";
							cx.lineWidth = 1;
							for (var r=8; r<=16; r+=4){
								cx.strokeStyle = "rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*0.5*((18-r)/16)*gThis.g.glA)+")";
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
								var delta=abs(parseFloat(sin((gThis.g.gt-gThis.g.pk[i].i)/1700*PI).toFixed(14)));
							var vrt=delta*0.3;//radial variation (0-1)
							var fldy=delta*1.2;//roughness
							cx.strokeStyle = "rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*0.5*gThis.g.glA)+")";
							drawSquig(pk.x,pk.y,10,fldy,vrt);
							break;
					}
				}
				if (gThis.g.pl.pn.p&&gThis.g.gt-gThis.g.pl.pn.lpt>=gThis.g.pl.pn.pt()&&gThis.g.gt-gThis.g.pl.pn.ipt<5000)
					gThis.g.pl.pn.af(); //affect the player, if poisoned
				else if (gThis.g.pl.pn.p&&gThis.g.gt-gThis.g.pl.pn.ipt>=5000) gThis.g.pl.pn.p = false;
				if (!gThis.g.pl.irs && !gThis.g.pl.dy && gThis.g.gt-gThis.g.pl.lu >= 50 && gThis.g.st != "paused" && !gThis.g.glc){ //update the player
					gThis.g.pl.lu = gThis.g.gt;
					gThis.g.pl.pf(); //update the player's coordinates
					gThis.g.pl.d = gThis.g.pl.qd;
					if (gThis.g.pl.p.length > gThis.g.pl.l) //sychronize player length with array length
						gThis.g.pl.p.splice(gThis.g.pl.p.length-(gThis.g.pl.p.length-gThis.g.pl.l), gThis.g.pl.p.length-gThis.g.pl.l);
				} else if (gThis.g.pl.dy && !gThis.g.pl.irs && !gThis.g.glc){ //if the player is dying
					if (gThis.g.gt-gThis.g.pl.dt <= 500) gThis.g.pl.c.a = 1-Math.pow((gThis.g.gt-gThis.g.pl.dt)/500,2);
					else {
						gThis.g.pl.c.a = 0;
						gThis.g.pl.rs(); //resurrect the player
					}
				} else if (gThis.g.pl.irs && !gThis.g.pl.dy && !gThis.g.glc){ //if the player is resurrecting
					if (gThis.g.gt-gThis.g.pl.rt <= 500) gThis.g.pl.c.a = Math.pow((gThis.g.gt-gThis.g.pl.rt)/500,2);
					else {
						if (gThis.g.pl.lv == 0){ //if we're out of lives, too, end the game
							gThis.g.st = "over";
						} else {
							gThis.g.pl.c.a = 1;
							gThis.g.pl.irs = false;
						}
					}
				}
				var pcl = gThis.g.pl.c;
				for (var i=0; i<gThis.g.pl.p.length; i++){ //render the player
					var p = gThis.g.pl.p[i];
					cx.fillStyle = "rgba("+pcl.r+","+pcl.g+","+pcl.b+","+(pcl.a*gThis.g.glA)+")";
					cx.strokeStyle = "none";
					if (gThis.g.pl.pn.p){ //poison rendering
						with(Math)
							cx.shadowColor = "rgba("+pcl.r+","+pcl.g+","+pcl.b+","+(pcl.a*abs(parseFloat(sin((gThis.g.gt-gThis.g.pl.pn.ipt)/1000*PI).toFixed(14)))*gThis.g.glA)+")";
						cx.shadowBlur = 20;
						cx.shadowOffsetX = 0;
						cx.shadowoffSetY = 0;
					}
					cx.fillRoundedRect(bd.os().x1+bd.ps(p).x+1, bd.os().y1+bd.ps(p).y+1, 8, 8, 2);
					cx.shadowBlur = 0;
					cx.shadowColor = "rgba(0,0,0,0)";
				}
				for (var i=0; i<gThis.g.en.length; i++){ //render all of the enemies
					if (gThis.g.en[i].dy && !gThis.g.glc){
						var delta = gThis.g.gt-gThis.g.en[i].dc;
						gThis.g.en[i].c.a = 1-Math.pow(delta/1000,2);
						if (delta >= 1000){
							gThis.g.en.splice(i,1); //remove the enemy
							i--;
							continue;
						}
					} else if (gThis.g.gt-gThis.g.en[i].lu >= 50 && !gThis.g.en[i].dy && gThis.g.st != "paused" && !gThis.g.glc){ //update the enemy
						if (gThis.g.en[i].pn.p&&gThis.g.gt-gThis.g.en[i].pn.lpt>gThis.g.en[i].pn.pt){ //if the enemy is poisoned
							gThis.g.en[i].pn.lpt = gThis.g.gt;
							gThis.g.en[i].l--;
							if (gThis.g.en[i].l <= 1){
								gThis.g.en[i].dc = gThis.g.gt; //set the decay time
								gThis.g.en[i].dy = true; //set the dying attribute to be true
							}								
						} else if (gThis.g.gt-gThis.g.en[i].pn.ipt>5000) //if time is up
							gThis.g.en[i].pn.p = false;
						if ([1,1,1,1][(gThis.g.en[i].d)]&&!gThis.g.en[i].dy){ //if a valid point is reached
							gThis.g.en[i].lu = gThis.g.gt; //set the last update time
							gThis.g.en[i].d = ai.nextDir(gThis.g.en[i]); //generate next direction, based on the AI
						} else if (![1,1,1,1][(gThis.g.en[i].d)]&&!gThis.g.en[i].dy){ //if there are no more directions
							gThis.g.en[i].dc = gThis.g.gt; //set the decay time
							gThis.g.en[i].dy = true; //set the dying attribute to be true
						}
						if (!gThis.g.en[i].dy){
							gThis.g.en[i].p.splice(0, 0, ai.nextPos(gThis.g.en[i])); //create a new position
							if (gThis.g.en[i].p.length > gThis.g.en[i].l) //synchronize enemy length with array length
								gThis.g.en[i].p.splice(gThis.g.en[i].p.length-(gThis.g.en[i].p.length-gThis.g.en[i].l), gThis.g.en[i].p.length-gThis.g.en[i].l);
						}
					}
					var cl = gThis.g.en[i].c;
					for (var j=0; j<gThis.g.en[i].p.length; j++){
						var p = gThis.g.en[i].p[j];
						cx.fillStyle = "rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*gThis.g.glA)+")";
						cx.strokeStyle = "none";
						if (gThis.g.en[i].pn.p){ //poison rendering
							with(Math)
								cx.shadowColor = "rgba("+cl.r+","+cl.g+","+cl.b+","+(cl.a*abs(parseFloat(sin((gThis.g.gt-gThis.g.en[i].pn.ipt)/1000*PI).toFixed(14)))*gThis.g.glA)+")";
							cx.shadowBlur = 20;
							cx.shadowOffsetX = 0;
							cx.shadowOffsetY = 0;
						}
						cx.fillRoundedRect(bd.os().x1+bd.ps(p).x+1, bd.os().y1+bd.ps(p).y+1, 8, 8, 2);
						cx.shadowBlur = 0;
						cx.shadowColor = "rgba(0,0,0,0)";
					}
				}
			} else if (gThis.g.st == "complete") {  //if the level is complete
				if ($_("#mg_lo").css("display")=="none") 
					$_("#mg_lo").effects.fadeTo(100,1000);
			} else if (gThis.g.st == "over") { //if the game is over
				if ($_("#mg_go").css("display")=="none") 
					$_("#mg_go").effects.fadeTo(100,1000);
			}
			if (gThis.g.st == "interim" || gThis.g.st == "game" || gThis.g.st == "paused"){ //some additional last-millisecond rendering
				//update the position of the pause button
				var pbcflct = false;
				if (!gThis.g.pl.irs && !gThis.g.pl.dy && bd.ps(gThis.g.pl.p[0]).x >= gThis.g.bt[0].p.x && bd.ps(gThis.g.pl.p[0]).x <= gThis.g.bt[0].p.x+gThis.g.bt[0].w && bd.ps(gThis.g.pl.p[0]).y >= gThis.g.bt[0].p.y && bd.ps(gThis.g.pl.p[0]).y <= gThis.g.bt[0].p.y+gThis.g.bt[0].h) pbcflct = true;
				/* -- use the following below only for enemies -- *
				for (var i=0; i<gThis.g.en.length; i++)
					if (bd.ps(gThis.g.en[i].p[0]).x >= gThis.g.bt[0].p.x && bd.ps(gThis.g.en[i].p[0]).x <= gThis.g.bt[0].p.x+gThis.g.bt[0].w && bd.ps(gThis.g.en[i].p[0]).y >= gThis.g.bt[0].p.y && bd.ps(gThis.g.en[i].p[0]).y <= gThis.g.bt[0].p.y+gThis.g.bt[0].h) pbcflct = true;
				*/
				if (pbcflct && !gThis.g.bt[0].m){
					gThis.g.bt[0].m = true;
					gThis.g.bt[0].r = !gThis.g.bt[0].r; //switch orientations 
				}
				if (gThis.g.bt[0].m){ //if the pause button is moving
					var rc = bd.os().x1+bd.cv().x-gThis.g.bt[0].w-10; //right coord
					var lc = bd.os().x1+10; //left coord
					if (gThis.g.bt[0].mt == 0)
						gThis.g.bt[0].mt = gThis.g.gt;
					else if (gThis.g.gt-gThis.g.bt[0].mt < 700){
						var dlt = (gThis.g.gt-gThis.g.bt[0].mt)/700;
						dlt = Math.pow(dlt,1-dlt);
						gThis.g.bt[0].p.x = (gThis.g.bt[0].r ? lc+Math.round((rc-lc)*dlt) : rc-Math.round((rc-lc)*dlt));
						with(Math)gThis.g.bt[0].c.a = 0.7*(1-abs(parseFloat(sin(dlt*PI).toFixed(14)))); //fade in and out the opacity
					} else {
						gThis.g.bt[0].m = false;
						gThis.g.bt[0].mt = 0;
						gThis.g.bt[0].p.x = (gThis.g.bt[0].r ? rc : lc);
					}
				}
				if (gThis.g.bt[0].nsr != gThis.g.bt[0].sr && (new Date()).getTime()-gThis.g.bt[0].srt <= 700) //animate the shadow radius
					gThis.g.bt[0].sr = gThis.g.bt[0].osr+Math.round((((new Date()).getTime()-gThis.g.bt[0].srt)/700)*(gThis.g.bt[0].nsr-gThis.g.bt[0].osr));
				var pbcl = gThis.g.bt[0].c;
				cx.fillStyle = "rgba("+pbcl.r+","+pbcl.g+","+pbcl.b+","+(pbcl.a*gThis.g.glA)+")";
				cx.strokeStyle = "rgba(0,0,0,0)";
				cx.fillRoundedRect(gThis.g.bt[0].p.x, gThis.g.bt[0].p.y, gThis.g.bt[0].w, gThis.g.bt[0].h, 10);
				var r = {x:gThis.g.bt[0].p.x+gThis.g.bt[0].w/2,y:gThis.g.bt[0].p.y+gThis.g.bt[0].h/2};
				var shdw = cx.createRadialGradient(r.x, r.y, 0, r.x, r.y, gThis.g.bt[0].sr);
				shdw.addColorStop(0, "rgba("+pbcl.r+80+","+pbcl.g+80+","+pbcl.b+80+","+(pbcl.a*gThis.g.glA)+")");
				shdw.addColorStop(0.82, "rgba(0,0,0,0)");
				cx.fillStyle = shdw;
				cx.fillRect(gThis.g.bt[0].p.x, gThis.g.bt[0].p.y, gThis.g.bt[0].w, gThis.g.bt[0].h);
				cx.fillStyle = "rgba("+pbcl.r+100+","+pbcl.g+100+","+pbcl.b+100+","+(pbcl.a*gThis.g.glA)+")";
				//pause rectangles
				cx.shadowOffsetX = 0;
				cx.shadowOffsetY = 0;
				cx.shadowBlur = 5;
				cx.shadowColor = "rgba(20,20,20,"+(pbcl.a*gThis.g.glA)+")";
				if (gThis.g.st == "paused"){
					var crds = [
						{
							x: gThis.g.bt[0].p.x+Math.round((gThis.g.bt[0].w-18)/2),
							y: gThis.g.bt[0].p.y+10
						},
						{
							x: gThis.g.bt[0].p.x+Math.round((gThis.g.bt[0].w-18)/2),
							y: gThis.g.bt[0].p.y+30
						},
						{
							x: gThis.g.bt[0].p.x+Math.round((gThis.g.bt[0].w-18)/2)+18,
							y: gThis.g.bt[0].p.y+20
						}
					];
					cx.beginPath();
					cx.moveTo(crds[0].x,crds[0].y);
					for (var i=1; i<crds.length; i++)
						cx.lineTo(crds[i].x,crds[i].y);
					cx.lineTo(crds[(crds.length-1)].x,crds[(crds.length-1)].y);
					cx.closePath();
					cx.fill();	
				} else {
					cx.fillRect(gThis.g.bt[0].p.x+Math.round((gThis.g.bt[0].w-18)/2), gThis.g.bt[0].p.y+10, 6, 20); //distance of 6, inner width of 20
					cx.fillRect(gThis.g.bt[0].p.x+Math.round((gThis.g.bt[0].w-18)/2)+12, gThis.g.bt[0].p.y+10, 6, 20);
				}
				cx.shadowBlur = 0;
				cx.shadowColor = null;
				if (gThis.g.tb.an!="" && (new Date()).getTime()-gThis.g.tb.at >= 700){//update the top bar
					gThis.g.tb.p = {
						x: gThis.g.tb.np.x,
						y: gThis.g.tb.np.y
					};
					gThis.g.tb.c.bg = { 
						r: gThis.g.tb.nc.bg.r,
						g: gThis.g.tb.nc.bg.g,
						b: gThis.g.tb.nc.bg.b,
						a: gThis.g.tb.nc.bg.a 
					};
					if (gThis.g.tb.c.bg.a==0||gThis.g.tb.p.x<=-800||gThis.g.tb.p.y<=-24) gThis.g.tb.v = false;
					else gThis.g.tb.v = true;
					gThis.g.tb.an = "";
				} else if (gThis.g.tb.an!="" && (new Date()).getTime()-gThis.g.tb.at < 700){
					var dlta = ((new Date()).getTime()-gThis.g.tb.at)/700;
					var dc = {
						r: gThis.g.tb.c.bg.r+Math.round(dlta*(gThis.g.tb.nc.bg.r-gThis.g.tb.c.bg.r)),
						g: gThis.g.tb.c.bg.g+Math.round(dlta*(gThis.g.tb.nc.bg.g-gThis.g.tb.c.bg.g)),
						b: gThis.g.tb.c.bg.b+Math.round(dlta*(gThis.g.tb.nc.bg.b-gThis.g.tb.c.bg.b)),
						a: gThis.g.tb.c.bg.a+(dlta*(gThis.g.tb.nc.bg.a-gThis.g.tb.c.bg.a))
					};
					var dp = {
						x: gThis.g.tb.p.x+Math.round(dlta*(gThis.g.tb.np.x-gThis.g.tb.p.x)),
						y: gThis.g.tb.p.y+Math.round(dlta*(gThis.g.tb.np.y-gThis.g.tb.p.y))
					};
					if (gThis.g.tb.c.bg.a==0||gThis.g.tb.p.x<=-gThis.g.tb.d.w||gThis.g.tb.p.y<=-gThis.g.tb.d.h) gThis.g.tb.v = false;
					else gThis.g.tb.v = true;
					cx.fillStyle = "rgba("+dc.r+","+dc.g+","+dc.b+","+(dc.a*gThis.g.glA)+")";
					cx.fillRect(dp.x, dp.y, gThis.g.tb.d.w, gThis.g.tb.d.h);
					cx.fillStyle = "rgba(240,255,255,"+((dc.a+0.3)*gThis.g.glA)+")";
					cx.textAlign = "left";
					cx.font = "14px Arial";
					cx.textBaseline = "top";
					cx.fillText("Score:", dp.x+10, dp.y+gThis.g.tb.to.y);
					cx.fillStyle = "rgba(186,244,255,"+((dc.a+0.3)*gThis.g.glA)+")";
					cx.fillText((gThis.g.pl.s+gThis.g.pl.cs), dp.x+54, dp.y+gThis.g.tb.to.y);
					cx.fillStyle = "rgba(240,255,255,"+((dc.a+0.3)*gThis.g.glA)+")";
					cx.textAlign = "center";
					cx.fillText("Level "+gThis.g.lv, dp.x+(gThis.g.tb.d.w/2), dp.y+gThis.g.tb.to.y);
					cx.textAlign = "right";
					cx.fillText(gThis.g.pl.n, dp.x+gThis.g.tb.d.w-80, dp.y+gThis.g.tb.to.y);
					if (gThis.is.l.length>0 && typeof gThis.is.l[0].src !== "undefined")
						for (var i=0; i<3; i++)
							cx.drawImage(gThis.is.l[(i>2-gThis.g.pl.lv?0:1)], dp.x+gThis.g.tb.d.w-30-(20*i), dp.y+2, 20, 20);
				}
				if (gThis.g.tb.an==""){
					cx.fillStyle = "rgba("+gThis.g.tb.c.bg.r+","+gThis.g.tb.c.bg.g+","+gThis.g.tb.c.bg.b+","+(gThis.g.tb.c.bg.a*gThis.g.glA)+")";
					cx.fillRect(gThis.g.tb.p.x, gThis.g.tb.p.y, gThis.g.tb.d.w, gThis.g.tb.d.h);
					cx.fillStyle = "rgba(240,255,255,"+((gThis.g.tb.c.bg.a+0.3)*gThis.g.glA)+")";
					cx.textAlign = "left";
					cx.font = "14px Arial";
					cx.textBaseline = "top";
					cx.fillText("Score:", gThis.g.tb.p.x+10, gThis.g.tb.p.y+gThis.g.tb.to.y);
					cx.fillStyle = "rgba(186,244,255,"+((gThis.g.tb.c.bg.a+0.3)*gThis.g.glA)+")";
					cx.fillText((gThis.g.pl.s+gThis.g.pl.cs), gThis.g.tb.p.x+54, gThis.g.tb.p.y+gThis.g.tb.to.y);
					cx.fillStyle = "rgba(240,255,255,"+((gThis.g.tb.c.bg.a+0.3)*gThis.g.glA)+")";
					cx.textAlign = "center";
					cx.fillText("Level "+gThis.g.lv, gThis.g.tb.p.x+(gThis.g.tb.d.w/2), gThis.g.tb.p.y+gThis.g.tb.to.y);
					cx.textAlign = "right";
					cx.fillText(gThis.g.pl.n, gThis.g.tb.p.x+gThis.g.tb.d.w-80, gThis.g.tb.p.y+gThis.g.tb.to.y);
					if (gThis.is.l.length>0 && typeof gThis.is.l[0].src !== "undefined")
						for (var i=0; i<3; i++)
							cx.drawImage(gThis.is.l[(i>2-gThis.g.pl.lv?0:1)], gThis.g.tb.p.x+gThis.g.tb.d.w-30-(20*i), gThis.g.tb.p.y+2, 20, 20);
				}
				gThis.g.pg.p.y=(gThis.g.tb.an!=""?dp.y+gThis.g.tb.d.h+10:gThis.g.tb.p.y+gThis.g.tb.d.h+10); //drawing progress bar
				if(!gThis.g.pg.an.iit)gThis.g.pg.an.iit=gThis.g.gt;
				with(Math)var shdwA=abs(parseFloat(sin((gThis.g.gt-gThis.g.pg.an.iit)/1200*PI/2).toFixed(14)));
				var pgcl=gThis.g.pg.c;
				cx.strokeStyle="rgba("+pgcl.r+","+pgcl.g+","+pgcl.b+","+pgcl.a+")";
				cx.fillStyle="rgba("+(pgcl.r+35)+","+(pgcl.g+35)+","+(pgcl.b+35)+","+(pgcl.a*0.7)+")";
				cx.lineWidth=1;
				cx.lineJoin="round";
				gThis.g.pg.ib.nd.w = Mathf.limit((gThis.g.pg.d.w-2)*gThis.g.pl.cs/20/gThis.g.gl,0,gThis.g.pg.d.w-2);
				if (gThis.g.pg.ib.nd.w!==gThis.g.pg.ib.d.w){
					if (!gThis.g.pg.an.iat) gThis.g.pg.an.iat=gThis.g.gt;
					if (gThis.g.gt-gThis.g.pg.an.iat<700){
						with(Math)var delta = pow((gThis.g.gt-gThis.g.pg.an.iat)/700,2);
						var nw = gThis.g.pg.ib.d.w+delta*(gThis.g.pg.ib.nd.w-gThis.g.pg.ib.d.w);
						cx.strokeRect(gThis.g.pg.p.x+0.5,gThis.g.pg.p.y+0.5,gThis.g.pg.d.w,gThis.g.pg.d.h);
						cx.shadowColor="rgba("+(pgcl.r+70)+","+(pgcl.g+70)+","+(pgcl.b+70)+","+(shdwA*gThis.g.glA)+")";
						cx.shadowBlur=7;
						cx.fillRect(gThis.g.pg.p.x+1.5,gThis.g.pg.p.y+1.5,nw,gThis.g.pg.d.h-2);
						cx.shadowColor="rgba(0,0,0,0)";
						cx.shadowBlur=0;
					} else if (gThis.g.gt-gThis.g.pg.an.iat>=700){
						gThis.g.pg.ib.d.w = gThis.g.pg.ib.nd.w;
						gThis.g.pg.an.iat = false;
						cx.strokeRect(gThis.g.pg.p.x+0.5,gThis.g.pg.p.y+0.5,gThis.g.pg.d.w,gThis.g.pg.d.h);
						cx.shadowColor="rgba("+(pgcl.r+70)+","+(pgcl.g+70)+","+(pgcl.b+70)+","+(shdwA*gThis.g.glA)+")";
						cx.shadowBlur=7;
						cx.fillRect(gThis.g.pg.p.x+1.5,gThis.g.pg.p.y+1.5,gThis.g.pg.ib.d.w,gThis.g.pg.d.h-2);
						cx.shadowColor="rgba(0,0,0,0)";
						cx.shadowBlur=0;
					}
				} else {
					cx.strokeRect(gThis.g.pg.p.x+0.5,gThis.g.pg.p.y+0.5,gThis.g.pg.d.w,gThis.g.pg.d.h);
					cx.shadowColor="rgba("+(pgcl.r+70)+","+(pgcl.g+70)+","+(pgcl.b+70)+","+(shdwA*gThis.g.glA)+")";
					cx.shadowBlur=7;
					cx.fillRect(gThis.g.pg.p.x+1.5,gThis.g.pg.p.y+1.5,gThis.g.pg.ib.d.w,gThis.g.pg.d.h-2);
					cx.shadowColor="rgba(0,0,0,0)";
					cx.shadowBlur=0;
				}
			}
		} else if (gThis.g.st == "help"){
		} else if (gThis.g.st == "lboards"){
			if ($_("#mg_lb").css('display')=='none')
				$_("#mg_lb").effects.fadeTo(100,500);
		} //otherwise, there's nothing to do
		$get("mga").volume = gThis.g.sn.a;
		$get("mga2").volume = gThis.g.sn.a;
		$get("mga3").volume = gThis.g.sn.e;
		if (Storage){ //save data
			localStorage.SGsnda = gThis.g.sn.a;
			localStorage.SGsnde = gThis.g.sn.e;
			localStorage.SGpn = gThis.g.pl.n;
			localStorage.SGkt = gThis.g.kt;
		}
	};
	this.intrvlist = function(){ //lists all current intervals, outputted to an array
		var list = [];
		for (var a in intervs) list.push(a);
		return list;
	};
	this.cInterv = function(i){ //the main function for clearing any interval currently in the intervals list
		if (!i||typeof i=="undefined"||!(i in intervs)) return false;
		clearInterval(intervs[i]);
		delete intervs[i]; //remove the specific interval from the object list
		return !(i in intervs); //should be true
	};
}
