package game;

public class GameObject {
	private type = "GameObject";
	public String getType() {
		return type;
	}
	
	public static class transform {
		int x, y;
		public void translateX(int d_x) {
			x += d_x;
		}
		public void translateY(int d_y) {
			y += d_y;
		}
	}

	public static class material {
		private Material[] mats;
		//hold all of the materials

		public void add(Material material) {
			Material[] mats2 = new Material[mats.length+1];
			System.arraycopy(mats, 0, mats2, 0); //TODO: check for consistency
			mats2[mats.length] = material;
			mats = mats2;
		}
		public Material get(int materialPosition) {
			return mats[materialPosition];
		}
		public Material get() {
			return get(mats.length-1); //return latest material
		}
		public void remove(int materialPosition) {
			Material[] mats_a = new Material[materialPosition];
			Material[] mats_b = new Material[mats.length-1-materialPosition];
			
		}
	}
	
	public GameObject() {
		//instantiate new game object
	}
}