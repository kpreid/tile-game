.SUFFIXES: .png .svg
.PHONY: all clean

all: Map.js \
     resources/Block\ Blue.png \
     resources/Block\ Green.png \
     resources/Block\ Orange.png

clean:
	rm -f Map.js \
	    resources/Block\ Blue.png \
	    resources/Block\ Green.png \
	    resources/Block\ Orange.png

Map.js: Tile.js IVector.js World.js compileMap.js Map.tilemap
	rhino -f IVector.js -f Tile.js -f World.js compileMap.js Map.tilemap > Map.js || rm -f Map.js

resources/Block\ Blue.png: resources/Block\ Blue.svg
	java -jar batik-rasterizer.jar -m image/png -d "$@" "$<"
resources/Block\ Green.png: resources/Block\ Green.svg
	java -jar batik-rasterizer.jar -m image/png -d "$@" "$<"
resources/Block\ Orange.png: resources/Block\ Orange.svg
	java -jar batik-rasterizer.jar -m image/png -d "$@" "$<"

# doesn't work... due to spaces in name?
%.png: %.svg
	java -jar batik-rasterizer.jar -m image/png -d "$@" "$<"

