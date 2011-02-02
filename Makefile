.SUFFIXES: .png .svg
.PHONY: all clean

BATIK:=java -cp batik-all.jar:xml-apis-ext.jar org.apache.batik.apps.rasterizer.Main -scriptSecurityOff

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
	$(BATIK) -m image/png -d "$@" "$<"
resources/Block\ Green.png: resources/Block\ Green.svg
	$(BATIK) -m image/png -d "$@" "$<"
resources/Block\ Orange.png: resources/Block\ Orange.svg
	$(BATIK) -m image/png -d "$@" "$<"

# doesn't work... due to spaces in name?
%.png: %.svg
	$(BATIK) -m image/png -d "$@" "$<"

