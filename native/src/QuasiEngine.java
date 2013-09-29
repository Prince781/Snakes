//quasi-engine 
//in charge of the entire game
import java.util.*;

public class QuasiEngine extends Thread {
	private boolean running = false;

	//
	public QuasiEngine() {
		//initialize the engine; begin reponsibility for materials/objects
		running = true;
		run();
	}
	
	public void run() {
		main: do (running) {
		} while (screenUpdate()); //update the screen contents
	}

	public boolean screenUpdate() {
		//update the display contents
		
	}
}
