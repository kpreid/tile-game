function GameState(world, playerPos) {
  var animationListeners = [];
  
  // Items picked up
  var inventory = [];

  // The positions of tiles which should have gravity applied, after previous actions
  var gravityQueue = [];

  // Executed after the direct effects of a player action have been performed, to handle
  // things like gravity, running water, and detecting a win.
  function thatWhichHappensAfterPlayerAction() {
    while (gravityQueue.length > 0) {
      console.group("gravity round");
      var gq = gravityQueue;
      gravityQueue = [];
      for (var i = 0; i < gq.length; i++) {
        gravity(gq[i]);
      }
      console.groupEnd();
    }
    runWater();
  }

  function evaluateGameState() {
    console.log("XXX evaluateGameState stub");
  }
  
  // Add an item to the inventory, and run the effects of taking it. It is the caller's
  // responsibility to clear the tile.
  function take(theTile) {
    inventory.push(theTile);

    if (theTile.gem()) {
      substituteTiles(theTile.gemToWall(), Tile.Empty);
      evaluateGameState();
    }

    animate();
  }
  
  
  // Calculate the spread of water.
  function runWater() {
    var Above = new IVector(0, 0, 1);
    var needsUpdate = true;
    while (needsUpdate) {
      animate();
      needsUpdate = false;
      for (var xi = 0; xi < world.xw; xi++) {
        for (var yi = 0; yi < world.yw; yi++) {
          for (var zi = 0; zi < world.zw; zi++) {
            var pos = new IVector(xi, yi, zi);
            switch (world.get(pos)) {
              case Tile.WaterNew:
                world.set(pos, Tile.Water);
                needsUpdate = true;
                break;
              case Tile.Water:
                var belowPos = new IVector(xi, yi, zi - 1);
                var belowTile = world.get(belowPos);
                if (belowTile.isFloodableFrom(Above)) {
                  // Water falls if space available                                
                  if (world.set(belowPos, Tile.WaterNew)) {
                    needsUpdate = true;
                  }
                } else if (belowTile.isWater()) {
                  // do nothing
                } else {
                  // If no vertical space, propagates horizontally.
                  var dirs = [
                    // von Neumann neighborhood
                    new IVector(-1, 0, 0), 
                    new IVector(1, 0, 0),
                    new IVector(0, -1, 0),
                    new IVector(0, 1, 0)
                  ];
                  for (var i = 0; i < dirs.length; i++) {
                    if (world.get(pos.add(dirs[i])).isFloodableFrom(new IVector(0,0,0).sub(dirs[i]))) {
                      if (world.set(pos.add(dirs[i]), Tile.WaterNew)) {
                        needsUpdate = true;
                      }
                    }
                  }
                }
                break;
            }
          }
        }
      }
    }
  }

  function animate() {
    console.log("XXX Warning: using animate stub");
  }
  
  // Apply gravity to what might be in the given tile
  // Don't call this directly, put positions on the GravityQueue.
  function gravity(objectPos) {
    var theTile = world.get(objectPos);
    if (theTile.isPushable() || theTile.isTakeable() || theTile === Tile.Player) {
      console.log("Gravity does apply to " + theTile);
      var belowTile = world.get(objectPos.add(new IVector(0, 0, -1)));
      if (belowTile.canOccupy()) {
        animate();
        console.log("gravity move of " + theTile, moveObject(objectPos, new IVector(0, 0, -1)));
        if (theTile !== Tile.Player && objectPos.z === 0) {
          // Fall off bottom of world
          animate();
          world.set(objectPos, Tile.Empty);
        }
      } else if (belowTile === Tile.Player && theTile.isTakeable()) {
        take(theTile);
        world.set(objectPos, Tile.Empty);
        gravityQueue.push(objectPos.add(new IVector(0, 0, 1)));
      }
    } else {
      console.log("Gravity does not apply to " + theTile);
    }
  }
  
  // Move the object by the specified offset. Does nothing and returns an explanation if out of bounds or occupied tile.
  function moveObject(pos, delta) {
    // Note that this function's rules should match those of the predicate Tiles.CanOccupy.

    var isMovingPlayer = pos.equals(world.getPlayerPos());

    // For special cases like the player winning, this is set to a different tile -
    // the tile will change as it moves.
    var newObjectTile = world.get(pos);

    // Check the player hasn't been drowned or stomped on
    if (isMovingPlayer && world.get(pos) !== Tile.Player) {
      return "stomped";
    }

    // Check new position...
    var newPos = pos.add(delta);

    // ...for being out of bounds
    if (!world.inBounds(newPos)) return "oob(" + newPos + ")";

    // ...or being off the edge of the world (The player is not allowed to die by falling, 
    // or rather, not allowed to stand on the bottom of the world, which is what would happen.)
    if (isMovingPlayer) {
      var hasFloor = false;
      var floorPos = newPos;
      while (world.get(floorPos) === Tile.Empty) {
        floorPos = floorPos.add(new IVector(0, 0, -1));
        if (!world.inBounds(floorPos)) {
          return "cliff"; // Nothing to fall onto, you're just not allowed to walk there.
        }
      }
    }

    // ...or being occupied.
    var whatsThere = world.get(newPos);
    if (whatsThere === Tile.Empty) {
      // proceed
    } else if (whatsThere.isWater()) {
      // will drown or block water - proceed as normal, and RunWater will do what's appropriate.
    } else if (whatsThere.isRampFor(delta)) {
      // If the tile is a ramp of the appropriate direction, retry with this motion
      return moveObject(pos, delta.add(new IVector(0, 0, 1)));
    } else if (isMovingPlayer && whatsThere.isTakeable()) {
      // In addition to moving, pick up the object.
      take(whatsThere);
    } else if (isMovingPlayer && whatsThere === Tile.Exit && canWin()) {
      // proceed, will become win
      newObjectTile = Tile.PlayerWon
    } else if (whatsThere.isPushable()) {
      // Pushable object: push it if possible, then proceed
      var res = moveObject(newPos, new IVector(delta.x, delta.y, 0));
      whatsThere = world.get(newPos);
      if (whatsThere !== Tile.Empty) {
        return "push failed("+res+")"; // Still an obstacle
      }
    } else if (whatsThere.canOccupy()) {
      // There should have been a case for this, but there isn't.
      throw new Error("Tried to move onto occupiable tile of type "+whatsThere+" which MoveObject doesn't know how to handle.");
    } else {
      return "obstacle(" + whatsThere + ")"; // Obstacle
    }
    
    // Moving down a ramp, not pushing anything?
    var downward = newPos.add(new IVector(0, 0, -1));
    if (whatsThere === Tile.Empty 
        && world.get(downward) === Tile.Empty
        && world.get(pos.add(new IVector(0, 0, -1))).isRampFor(new IVector(0,0,0).sub(delta))) {
      newPos = downward;
    }

    // Update world
    world.set(pos, Tile.Empty);
    if (isMovingPlayer) {
      world.setPlayerPos(newPos);
    }
    world.set(newPos, newObjectTile);
    for (var li = 0; li < animationListeners.length; li++) {
      animationListeners[li].moveFrom(newPos, pos);
    }

    // Apply gravity to moved object
    gravityQueue.push(newPos);

    // Apply gravity to cleared space
    gravityQueue.push(pos.add(new IVector(0, 0, 1)));
    
    return "OK";
  }
  
  
  function substituteTiles(fromType, toType) {
    for (var xi = 0; xi < world.xw; xi++) {
      for (var yi = 0; yi < world.yw; yi++) {
        for (var zi = 0; zi < world.zw; zi++) {
          var pos = new IVector(xi, yi, zi);
          if (world.get(pos) === fromType) {
            world.set(pos, toType);
            if (toType === Tile.Empty) {
              // Apply gravity to cleared space
              gravity(new IVector(xi, yi, zi + 1));
            }
          }
        }
      }
    }
  }

  
  // -----
  
  thatWhichHappensAfterPlayerAction();
  return {
    world: world,
    addAnimationListener: function (l) {
      animationListeners.push(l);
    },
    movePlayer: function (delta) {
      var res = moveObject(world.getPlayerPos(), delta);
      thatWhichHappensAfterPlayerAction();
      return res;
    },
    toString: function () { return "[GameState]"; }
  };
}