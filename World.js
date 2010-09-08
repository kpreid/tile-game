function World(xw, yw, zw, array, playerPos) {
  if (array) {
    array = Array.prototype.slice.call(array, 0);
  } else {
    array = [];
  }
  if (playerPos) {
    // XXX validate
  } else {
    playerPos = new IVector(0,0,0);
  }
  var changeListeners = [];
  var world = {
    xw: xw,
    yw: yw,
    zw: zw,
    inBounds: function (pos) {
      var x = pos.x;
      var y = pos.y;
      var z = pos.z;
      return x >= 0 && y >= 0 && z >= 0 && x < xw && y < yw && z < zw;
    },
    get: function (pos) {
      var x = pos.x;
      var y = pos.y;
      var z = pos.z;
      if (x < 0 || y < 0 || z < 0 || x >= xw || y >= yw || z >= zw) {
        return Tile.Empty;
      } else {
        return array[x*yw*zw + y*zw + z];
      }
    },
    set: function (pos, tile) {
      if (tile.constructor != Tile.Empty.constructor) {
        throw new Error("Not a tile: " + tile);
      }
      var x = pos.x;
      var y = pos.y;
      var z = pos.z;
      if (x < 0 || y < 0 || z < 0 || x >= xw || y >= yw || z >= zw) {
        //throw new Error("OOB");
      } else {
        array[x*yw*zw + y*zw + z] = tile;
      }
      for (var i = 0; i < changeListeners.length; i++) {
        changeListeners[i](pos);
      }
    },
    getPlayerPos: function () { return playerPos; },
    setPlayerPos: function (pp) { playerPos = pp; },
    dump: function () {
      return "new World("+xw+","+yw+","+zw+",["+array+"],"+playerPos.dump()+")";
    },
    addChangeListener: function (l) {
      changeListeners.push(l);
    }
  };
  for (var x = 0; x < xw; x++) {
    for (var y = 0; y < yw; y++) {
      for (var z = 0; z < zw; z++) {
        array.push(Tile.Empty);
      }
    }
  }
  return world;
}