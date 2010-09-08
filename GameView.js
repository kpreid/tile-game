var GameView = (function () {
  var tileToImage = {
    "Block": "Stone%20Block",
    "Grass": "Grass%20Block",
    "Dirt": "Dirt%20Block",
    "Washout": "Rock",
    "PushBlock": "Wall%20Block",
    "RampN": "Ramp%20South",
    "RampE": "Ramp%20West",
    "RampS": "Ramp%20North",
    "RampW": "Ramp%20East",
    "Player": "Character%20Boy",
    "Water": "Water%20Block",
    "WaterNew": "Water%20Block",
    "Gem1": "Gem%20Blue",
    "Gem2": "Gem%20Green",
    "Gem3": "Gem%20Orange",
    "GemWall1": "Plain%20Block",
    "GemWall2": "Plain%20Block",
    "GemWall3": "Plain%20Block",
    "Exit": "Selector"
  };

  function toPx(cssLength) {
    return Number(/^(\d+)px/.exec(cssLength)[1]);
  }

  function GameView(state, playfield, viewport) {
    var world = state.world;
    while (playfield.firstChild) {
      playfield.removeChild(playfield.firstChild);
    }
    
    // Image size. XXX get from image
    var rawTileWidth = 101;
    var rawTileHeight = 171;
    //      Image pixel width corresponding to a                 tile width.
    var rawTileXStep = rawTileWidth;             // "left-right"
    var rawTileYStep = rawTileHeight * 82 / 171; // "front-back"
    var rawTileZStep = rawTileHeight * 42 / 171; // "up-down"
    // These values are calculated in this way so that the image can be rescaled and 
    // get the same results.
    
    // View parameters:
    // px dimensions to scale tiles to
    var drawWidth;
    var drawHeight;
    // Conversions from tile counts to document px
    var xUnit;
    var yUnit;
    var zUnit;
    // document px offsets for the origin of the scene
    var xOrigin;
    var yOrigin;
    
    function calcView() {
      var computedStyle = window.getComputedStyle(viewport, null);
      var fieldWidth = toPx(computedStyle.width); // XXX stub
      var fieldHeight = toPx(computedStyle.height);

      var viewScale = Math.min(fieldWidth  / (world.xw * rawTileXStep),
                               fieldHeight / (world.yw * rawTileYStep + world.zw * rawTileZStep + rawTileHeight));
                              

      // Pixel width and height an individual tile is drawn at
      drawWidth  = Math.max(1, Math.floor(viewScale * rawTileWidth));
      drawHeight = Math.max(1, Math.floor(viewScale * rawTileHeight));

      // 1 world x step = xUnit pixels, and so on
      xUnit = Math.max(1, Math.floor(viewScale * rawTileXStep));
      yUnit = Math.max(1, Math.floor(viewScale * rawTileYStep));
      zUnit = Math.max(1, Math.floor(viewScale * rawTileZStep));

      // Center view
      xOrigin = (fieldWidth - xUnit * world.xw) / 2;
      yOrigin = (fieldHeight - yUnit * world.yw + zUnit * world.zw) / 2;
      //yOrigin = (world.zw - 1) * zUnit;
      console.log("", xUnit, " ", yUnit, " ", zUnit, " ", xOrigin, " ", yOrigin);
    }
    calcView();
    
    // Create tile images
    var tileElems = [];
    var tileAnims = [];
    for (var x = 0; x < world.xw; x++) {
      for (var y = 0; y < world.yw; y++) {
        for (var z = 0; z < world.zw; z++) {
          var tile = world.get(new IVector(x, y, z));
          
          var tileElem = document.createElement("img");
          tileElems.push(tileElem);
          tileAnims.push(null);
          playfield.appendChild(tileElem);
          tileElem.style.position="absolute";
          update(new IVector(x,y,z));
        }
      }
    }
    
    // TODO: create shadows
    
    // Update tile image from world
    function update(pos) {
      var x = pos.x;
      var y = pos.y;
      var z = pos.z;
      var tile = world.get(pos);          
      var tileElem = tileElems[x*world.yw*world.zw + y*world.zw + z];
      tileElem.style.visibility = (tile === Tile.Empty) ? "hidden" : "visible";
      var image = tileToImage[tile.name] || "Rock";
      tileElem.src = "resources/"+image+".png";
    }
    
    function calcViewPos(x, y, z) {
      return {
        x: x * xUnit + xOrigin,
        y: y * yUnit - z * zUnit + yOrigin,
        zIndex: 1 + (y + z) * 1000
        // XXX TODO figure out why this fails to handle animation (eg going left off a ramp) properly.
      };
    }
    
    // Set layout styles
    function layout() {
      for (var z = 0; z < world.zw; z++) {
        for (var y = 0; y < world.yw; y++) {
          for (var x = 0; x < world.xw; x++) {
            var tile = world.get(new IVector(x, y, z));          
            var tileElem = tileElems[x*world.yw*world.zw + y*world.zw + z];
            var vp = calcViewPos(x, y, z);

            tileElem.style.zIndex = vp.zIndex;
            tileElem.style.left = vp.x + "px";
            tileElem.style.top = vp.y + "px";
            tileElem.style.width = drawWidth + "px";
            tileElem.style.height = drawHeight + "px";
          }
        }
      }      
    }
    
    layout();
    
    var animate = {
      moveFrom: function (pos, oldPos) {
        var offset = (oldPos.sub(pos));
        var index = pos.x*world.yw*world.zw + pos.y*world.zw + pos.z;
        if (tileAnims[index]) clearInterval(tileAnims[index]);
        var tileElem = tileElems[index];
        var t = 1;
        var interval;
        function anim() {
          t -= 0.2;
          if (t <= 0) {
            t = 0;
            clearInterval(interval);
            tileAnims[index] = null;
          }
          var vp = calcViewPos(pos.x + offset.x * t, pos.y + offset.y * t, pos.z + offset.z * t);
          tileElem.style.zIndex = vp.zIndex;
          tileElem.style.left = vp.x + "px";
          tileElem.style.top = vp.y + "px";
          //console.log("animation", vp.x, (vp.x + (1 - t) * xUnit));
        }
        interval = setInterval(anim, 10);
        tileAnims[index] = interval;
        anim();
      }
    };
    
    function movePlayerKey(x,y,z) {
      state.movePlayer(new IVector(x, y, z));
    }
    
    world.addChangeListener(update);
    state.addAnimationListener(animate);
    
    return {
      onresize: function () {
        calcView();
        layout();
      },
      onkeydown: function (event) {
        switch (event.keyCode) {
          case 37: movePlayerKey(-1,  0, 0); break; // left
          case 38: movePlayerKey( 0, -1, 0); break; // up
          case 39: movePlayerKey( 1,  0, 0); break; // right
          case 40: movePlayerKey( 0,  1, 0); break; // down
          default:
            console.log("Ignoring keyCode " + event.keyCode);
            return true;
        }
        return false;
      }
    };
  }
  return GameView;
})();
