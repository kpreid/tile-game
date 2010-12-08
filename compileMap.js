if (arguments.length !== 1) {
  throw new Error("Usage: compileMap.js <mapfile>");
}

var map = readFile(arguments[0]);

// --- Parser
var i = 0; // Position in map string.
var lineNo = 1; // Line number counter.
var axes = [0, 1, 2]; // Axes to manipulate

// Default position if no player marker found
var playerPos = new IVector(10, 5, 8);

// XXX TODO: make this retrieved from the map file
var world = new World(20, 16, 9);

while (i < map.length) {
  // Take header line of first slice and chop it into words
  var endOfHeader = map.indexOf("\n", i);
  var theLine = map.substring(i, endOfHeader);
  //var words = theLine.trim().split();
  var trimmed = /^\s*(.*?)\s*(?:'.*)?$/.exec(theLine)[1];
  var words = trimmed.split(/\s+/);

  if (words.length === 1 && words[0] === "" || theLine[0] == "'") {
    // Comment line or blank line
    i = endOfHeader + 1
    lineNo += 1
    continue
  }

  // First word is the dimension order.
  if (words[0].length !== 3) {
      throw new Error("Axis specifiers not of length 3 in map at line " + lineNo);
  }
  for (var d = 0; d <= 2; d++) {
    switch (words[0][d]) {
      case "x": axes[d] = 0; break;
      case "y": axes[d] = 1; break;
      case "z": axes[d] = 2; break;
      default:
          // I have no idea if this is really an appropriate exception class.
          throw new Error("Bad axis specifier '"+map[i]+"' in map at line "+lineNo);
    }
  }

  // Next 3 words are the starting coordinates
  var origin = [];
  for (var d = 0; d <= 2; d++) {
      origin[d] = parseInt(words[d + 1]);
  }
  i = endOfHeader + 1;
  lineNo += 1;

  var here = origin.slice(0); // Cursor position in world.
  var doneWithSlice = false;
  while (i < map.length && !doneWithSlice) {
    switch (map[i]) {
      case "\n":
        // Go to next line (1st dimension)
        lineNo += 1;
        if (here[axes[0]] == origin[axes[0]]) { // Double blank line starts a new map section
          doneWithSlice = true;
        } else {
          // Go to next row [2nd dimension]
          here[axes[0]] = origin[axes[0]];
          here[axes[1]] += 1;
        }
        break;
      case "$":
        // Go to next layer [3rd dimension]
        // This character is assumed to end a line -- that is, it will be followed by a Lf,
        // so the 2nd dimension is set to one less than the origin.
        here[axes[0]] = -1; // invalid value, also not equal to the origin.
        here[axes[1]] = origin[axes[1]] - 1;
        here[axes[2]] += 1;
        break;
      case "P":
        // Player position
        var vec = IVector.apply(null, here);
        world.set(vec, Tile.Player);
        world.setPlayerPos(vec);
        here[axes[0]] += 1;
        break;
      case " ":
        // Do nothing to the tile but advance the cursor
        here[axes[0]] += 1;
        break;
      default:
        // Either an ordinary tile, or an error.
        var charTile;
        switch (map[i]) {
          // Various plain solid block types
          case ".": charTile = Tile.Grass; break;
          case "d": charTile = Tile.Dirt;  break;
          case "#": charTile = Tile.Block; break;

          // Tile types with particular behaviors
          case "`": charTile = Tile.Empty;     break;
          case "w": charTile = Tile.Washout;   break;
          case "p": charTile = Tile.PushBlock; break;

          // Ramps
          case "/":  charTile = Tile.RampE; break;
          case "\\": charTile = Tile.RampW; break;
          case "^":  charTile = Tile.RampN; break;
          case "v":  charTile = Tile.RampS; break;
          case "W":  charTile = Tile.Water; break;

          // Gems
          case "1": charTile = Tile.Gem1; break;
          case "2": charTile = Tile.Gem2; break;
          case "3": charTile = Tile.Gem3; break;

          // Gem-triggered walls;
          case "4": charTile = Tile.GemWall1; break;
          case "5": charTile = Tile.GemWall2; break;
          case "6": charTile = Tile.GemWall3; break;

          // Exit
          case "X": charTile = Tile.Exit; break;

          default:
            var context = Math.max(0, i - 10);
            throw new Error("Bad map character '"+map[i]+"' near '"+map.substring(context, i + 1)+"' at line "+lineNo);
        }
        //print(here + " - " + charTile);
        world.set(IVector.apply(null, here), charTile);
        here[axes[0]] += 1;
        break;
    }
    i += 1;
  }
}

// Output map
print("gameMap = " + world.dump() + ";\n");
