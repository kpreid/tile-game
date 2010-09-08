function IVector(x, y, z) {
  // TODO restrict to integers
  return {
    x: x,
    y: y,
    z: z,
    coordinate: function (index) {
      switch (index) {
        case 0: return x;
        case 1: return y;
        case 2: return z;
      }
    },
    equals: function (other) {
      return x === other.x && y === other.y && z === other.z;
    },
    add: function (other) {
      return new IVector(x + other.x, y + other.y, z + other.z);
    },
    sub: function (other) {
      return new IVector(x - other.x, y - other.y, z - other.z);
    },
    toString: function () {
      return "<" + x + "," + y + "," + z + ">";
    },
    dump: function () {
      return "new IVector("+x+","+y+","+z+")";
    }
  }
}
