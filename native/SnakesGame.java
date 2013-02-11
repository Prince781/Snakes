package game;

import java.awt.*;
import java.awt.image.*;
import java.util.*;
import javax.swing.*;

public class SnakesGame extends Thread {
	private boolean running = true;
	private JFrame window;
	private String windowTitle = "Snakes";
	private int[] d = {1000,750};
	private int[] content_d = new int[2];
	private Graphics2D g2d;
	private Graphics2D b_g2d;
	private Canvas canvas;
	private BufferStrategy strategy;
	private BufferedImage background;
	private GraphicsConfiguration cfg = GraphicsEnvironment.getLocalGraphicsEnvironment().getDefaultScreenDevice().getDefaultConfiguration();
	private Dimension screen = Toolkit.getDefaultToolkit().getScreenSize();
	//declaration of game classes
	private class Player {
		
	}
	private class Enemy {
		/************
		 * 0 - up
		 * 1 - right
		 * 2 - down
		 * 3 - left
		*************/
		public int d = 0; //direction
		/************
		 * 0 - default; will simply move around aimlessly, and also act defensively
		 * 1 - aggressive; will try to limit moves of player
		 * 2 - economical; will try to find shortest available path to nearest pickups
		*************/
		public int m = 0; //mode
		private class EnemyColor {
			int r;
			int g;
			int b;
			int a;
			public EnemyColor() {
				Random rnd = new Random();
				r = rnd.nextInt(255);
				g = rnd.nextInt(255);
				b = rnd.nextInt(255);
				a = 255;
			}
		}
		EnemyColor color = new EnemyColor();
		public Enemy() {
			Random rand = new Random();
			d = rand.nextInt(3); //create a random direction
			
		}
	}
	private class ArtificialIntelligence {
		public void nextDir(Enemy e) {
			//TODO: add calculations
		}
	}
	//declaration of game classes
	ArtificialIntelligence ai = new ArtificialIntelligence();
	Player player = new Player();
	ArrayList<Enemy> enemies = new ArrayList<Enemy>();
	public SnakesGame() {
		window = new JFrame(windowTitle);
		window.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		window.setBounds((screen.width-d[0])/2,(screen.height-d[1])/2,d[0],d[1]);
		
		canvas = new Canvas(cfg);
		canvas.setSize(window.getBounds().getSize());
		window.add(canvas, 0);
		window.setVisible(true);
		window.setResizable(false);
		
		content_d[0] = window.getSize().width;
		content_d[1] = window.getSize().height;
		background = createBufferedImage(content_d[0], content_d[1], false);
		canvas.createBufferStrategy(2);
		do {
			strategy = canvas.getBufferStrategy();
		} while (strategy == null);
		
		
		
		start(); //start runnable process
		init();
	}
	private BufferedImage createBufferedImage(final int width, final int height, final boolean alpha) {
		return cfg.createCompatibleImage(width, height, alpha ? Transparency.TRANSLUCENT : Transparency.OPAQUE);
	}
	private Graphics2D getBuffer() {
		if (g2d == null) try {
			g2d = (Graphics2D) strategy.getDrawGraphics();
		} catch (IllegalStateException e) {
			return null;
		}
		return g2d;
	}
	private boolean screenUpdate() {
		g2d.dispose(); //free resources
		g2d = null;
		try {
			strategy.show();
			Toolkit.getDefaultToolkit().sync();
			return (!strategy.contentsLost());
		} catch (NullPointerException e) {
			return true;
		} catch (IllegalStateException e) {
			return true;
		}
	}
	public void init() { //initialize game components
		
	}
	public void run() { //runnable task to iterate through
		b_g2d = (Graphics2D) background.getGraphics();
		main: while (running) {
			update();
			do {
				if (!running) break main;
				Graphics2D bg = getBuffer(); //get buffered objects
				render(b_g2d);
				bg.drawImage(background,0,0,null);
			} while (!screenUpdate());
		}
		window.dispose(); //free resources
	}
	public void update() { //update game; no rendering
		//TODO: add more code
	}
	public void render(Graphics2D g) { //render game
		g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
		g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
		g.setColor(Color.black);
		g.fillRect(0, 0, content_d[0],  content_d[1]);
		//TODO: add more code
	}
	public static void main(String[] args) {
		new SnakesGame();
	}
}
