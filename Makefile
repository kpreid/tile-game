.PHONY: all clean

all: Map.js

clean:
	rm -f Map.js

Map.js: Tile.js IVector.js World.js compileMap.js Map.tilemap
	rhino -f IVector.js -f Tile.js -f World.js compileMap.js Map.tilemap > Map.js || rm -f Map.js
