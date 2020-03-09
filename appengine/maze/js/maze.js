/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview JavaScript for Maze game.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Maze');

goog.require('Blockly.FieldDropdown');
goog.require('Blockly.Trashcan');
goog.require('Blockly.utils.dom');
goog.require('Blockly.utils.math');
goog.require('Blockly.utils.string');
goog.require('Blockly.VerticalFlyout');
goog.require('BlocklyDialogs');
goog.require('BlocklyGames');
goog.require('BlocklyInterface');
goog.require('Maze.Blocks');
goog.require('Maze.soy');


BlocklyGames.NAME = 'maze';

/**
 * Go to the next level.  Add skin parameter.
 * @suppress {duplicate}
 */
BlocklyInterface.nextLevel = function() {
  if (BlocklyGames.LEVEL < BlocklyGames.MAX_LEVEL) {
    window.location = window.location.protocol + '//' +
        window.location.host + window.location.pathname +
        '?lang=' + BlocklyGames.LANG + '&level=' + (BlocklyGames.LEVEL + 1) +
        '&skin=' + Maze.SKIN_ID;
  } else {
    BlocklyInterface.indexPage();
  }
};

Maze.MAX_BLOCKS = [undefined, // Level 0.
    Infinity, Infinity, 2, 5, 5, 5, 5, 10, 7, 10][BlocklyGames.LEVEL];

// Crash type constants.
Maze.CRASH_STOP = 1;
Maze.CRASH_SPIN = 2;
Maze.CRASH_FALL = 3;

Maze.SKINS = [
  // sprite: A 1029x51 set of 21 avatar images. updated: 43x42 with 1 avatar image
  // tiles: A 250x200 set of 20 map images.
  // marker: A 20x34 goal image.
  // background: An optional 400x450 background image, or false.
  // look: Colour of sonar-like look icon.
  // winSound: List of sounds (in various formats) to play when the player wins.
  // crashSound: List of sounds (in various formats) for player crashes.
  // crashType: Behaviour when player crashes (stop, spin, or fall).
  {
    sprite: 'maze/xiaoc.png',
    marker: 'maze/apple34.png',
    // ToDo: resize the marker and need marker2
    marker2: false,
    background: false,
    // two different tiles
    tile1: 'maze/tile1.png',
    tile2: 'maze/tile2.png',
    look: '#000',
    winSound: ['maze/win.mp3', 'maze/win.ogg'],
    crashSound: ['maze/fail_pegman.mp3', 'maze/fail_pegman.ogg'],
    crashType: Maze.CRASH_STOP
  },
];
Maze.SKIN_ID = BlocklyGames.getNumberParamFromUrl('skin', 0, Maze.SKINS.length);
Maze.SKIN = Maze.SKINS[Maze.SKIN_ID];

/**
 * Milliseconds between each animation frame.
 */
Maze.stepSpeed;

/**
 * The types of squares in the maze, which is represented
 * as a 2D array of SquareType values.
 * @enum {number}
 */
Maze.SquareType = {
  WALL: 0,
  OPEN: 1,
  START: 2,
  FINISH: 3
};

// The maze square constants defined above are inlined here
// for ease of reading and writing the static mazes.
Maze.map = [
// Level 0.
 undefined,
// Level 1.
 [[0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 1, 2, 3, 1, 3, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0]],
// Level 2.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 3, 0, 0, 0],
  [0, 0, 2, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 3.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 2, 1, 1, 1, 1, 3, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 4.
/**
 * Note, the path continues past the start and the goal in both directions.
 * This is intentionally done so users see the maze is about getting from
 * the start to the goal and not necessarily about moving over every part of
 * the maze, 'mowing the lawn' as Neil calls it.
 */
 [[0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 1, 1],
  [0, 0, 0, 0, 0, 3, 1, 0],
  [0, 0, 0, 0, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 0],
  [0, 2, 1, 0, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 0, 0, 0]],
// Level 5.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 3, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 2, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 6.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 0, 0, 0, 1, 0, 0],
  [0, 1, 1, 3, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0],
  [0, 2, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 7.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 0],
  [0, 2, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 0],
  [0, 1, 1, 3, 0, 1, 0, 0],
  [0, 1, 0, 1, 0, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 8.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 0, 0, 0],
  [0, 1, 0, 0, 1, 1, 0, 0],
  [0, 1, 1, 1, 0, 1, 0, 0],
  [0, 0, 0, 1, 0, 1, 0, 0],
  [0, 2, 1, 1, 0, 3, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 9.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0],
  [3, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 1, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 2, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]],
// Level 10.
 [[0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 3, 0, 1, 0],
  [0, 1, 1, 0, 1, 1, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 1, 0, 0, 1, 0],
  [0, 2, 1, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]]
][BlocklyGames.LEVEL];

/**
 * Measure maze dimensions and set sizes.
 * ROWS: Number of tiles down.
 * COLS: Number of tiles across.
 * SQUARE_SIZE: Pixel height and width of each maze square (i.e. tile).
 */
Maze.ROWS = Maze.map.length;
Maze.COLS = Maze.map[0].length;
Maze.SQUARE_SIZE = 40;
Maze.PEGMAN_HEIGHT = 43;
Maze.PEGMAN_WIDTH = 42;

Maze.MAZE_WIDTH = Maze.SQUARE_SIZE * Maze.COLS;
Maze.MAZE_HEIGHT = Maze.SQUARE_SIZE * Maze.ROWS;

/**
 * Constants for cardinal directions.  Subsequent code assumes these are
 * in the range 0..3 and that opposites have an absolute difference of 2.
 * @enum {number}
 */
Maze.DirectionType = {
  NORTH: 0,
  EAST: 1,
  SOUTH: 2,
  WEST: 3
};

/**
 * Outcomes of running the user program.
 */
Maze.ResultType = {
  UNSET: 0,
  SUCCESS: 1,
  FAILURE: -1,
  TIMEOUT: 2,
  ERROR: -2
};

/**
 * Result of last execution.
 */
Maze.result = Maze.ResultType.UNSET;

/**
 * Starting direction.
 */
Maze.startDirection = Maze.DirectionType.EAST;

/**
 * PIDs of animation tasks currently executing.
 */
Maze.pidList = [];

/**
 * Create and layout all the nodes for the path, scenery, Pegman, and goal.
 */
Maze.drawMap = function() {
  var svg = document.getElementById('svgMaze');
  var scale = Math.max(Maze.ROWS, Maze.COLS) * Maze.SQUARE_SIZE;
  svg.setAttribute('viewBox', '0 0 ' + scale + ' ' + scale);

  // Draw the outer square.
  Blockly.utils.dom.createSvgElement('rect', {
      'height': Maze.MAZE_HEIGHT,
      'width': Maze.MAZE_WIDTH,
      'fill': '#F1EEE7',
      'stroke-width': 1,
      'stroke': '#CCB'
    }, svg);

  if (Maze.SKIN.background) {
    var tile = Blockly.utils.dom.createSvgElement('image', {
        'height': Maze.MAZE_HEIGHT,
        'width': Maze.MAZE_WIDTH,
        'x': 0,
        'y': 0
      }, svg);
    tile.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
        Maze.SKIN.background);
  }

  // Draw the tiles making up the maze map.

  // Return a value of '0' if the specified square is wall or out of bounds,
  // '1' otherwise (empty, start, finish).
  var normalize = function(x, y) {
    if (x < 0 || x >= Maze.COLS || y < 0 || y >= Maze.ROWS) {
      return '0';
    }
    return (Maze.map[y][x] == Maze.SquareType.WALL) ? '0' : '1';
  };

  // Compute and draw the tile for each square. (Check each direction)
  for (var y = 0; y < Maze.ROWS; y++) {
    for (var x = 0; x < Maze.COLS; x++) {
      if (Maze.map[y][x] != Maze.SquareType.WALL){
        // Tile sprite.
        var tile = Blockly.utils.dom.createSvgElement('image', {
            'height': Maze.SQUARE_SIZE,
            'width': Maze.SQUARE_SIZE,
            'x': x * Maze.SQUARE_SIZE,
            'y': y * Maze.SQUARE_SIZE
          }, svg);
        // alter between two different color of tiles
        if ((x+y) % 2 == 0){
          tile.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
            Maze.SKIN.tile1);
        }
        else{
          tile.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
            Maze.SKIN.tile2);
        }
      }
    }
  }

  // Add finish marker.
  for (var i = 0; i < Maze.numFinish; i++){
    var finishMarker = Blockly.utils.dom.createSvgElement('image', {
      'id': 'finish' + i,
      'height': 34,
      'width': 20
    }, svg);
    finishMarker.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
        Maze.SKIN.marker);
  }

  // Pegman's clipPath element, whose (x, y) is reset by Maze.displayPegman
  var pegmanClip = Blockly.utils.dom.createSvgElement('clipPath', {
      'id': 'pegmanClipPath'
    }, svg);
  Blockly.utils.dom.createSvgElement('rect', {
      'id': 'clipRect',
      'height': Maze.PEGMAN_HEIGHT,
      'width': Maze.PEGMAN_WIDTH
    }, pegmanClip);

  // Add Pegman.
  var pegmanIcon = Blockly.utils.dom.createSvgElement('image', {
      'id': 'pegman',
      'height': Maze.PEGMAN_HEIGHT,
      'width': Maze.PEGMAN_WIDTH, // 49 * 21 = 1029
      'clip-path': 'url(#pegmanClipPath)'
    }, svg);
  pegmanIcon.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
      Maze.SKIN.sprite);
};

/**
 * Initialize Blockly and the maze.  Called on page load.
 */
Maze.init = function() {
  // Render the Soy template.
  document.body.innerHTML = Maze.soy.start({}, null,
      {lang: BlocklyGames.LANG,
       level: BlocklyGames.LEVEL,
       maxLevel: BlocklyGames.MAX_LEVEL,
       skin: Maze.SKIN_ID,
       html: BlocklyGames.IS_HTML});

  BlocklyInterface.init();

  // Setup the Pegman menu.
  var pegmanImg = document.querySelector('#pegmanButton>img');
  pegmanImg.style.backgroundImage = 'url(' + Maze.SKIN.sprite + ')';
  var pegmanMenu = document.getElementById('pegmanMenu');
  var handlerFactory = function(n) {
    return function() {
      Maze.changePegman(n);
    };
  };
  for (var i = 0; i < Maze.SKINS.length; i++) {
    if (i == Maze.SKIN_ID) {
      continue;
    }
    var div = document.createElement('div');
    var img = document.createElement('img');
    img.src = 'common/1x1.gif';
    img.style.backgroundImage = 'url(' + Maze.SKINS[i].sprite + ')';
    div.appendChild(img);
    pegmanMenu.appendChild(div);
    Blockly.bindEvent_(div, 'mousedown', null, handlerFactory(i));
  }
  var rtl = BlocklyGames.isRtl();
  var blocklyDiv = document.getElementById('blockly');
  var visualization = document.getElementById('visualization');
  var onresize = function(e) {
    var top = visualization.offsetTop;
    blocklyDiv.style.top = Math.max(10, top - window.pageYOffset) + 'px';
    blocklyDiv.style.left = rtl ? '10px' : '420px';
    blocklyDiv.style.width = (window.innerWidth - 440) + 'px';
  };
  window.addEventListener('scroll', function() {
    onresize(null);
    Blockly.svgResize(BlocklyInterface.workspace);
  });
  window.addEventListener('resize', onresize);
  onresize(null);

  // Scale the workspace so level 1 = 1.3, and level 10 = 1.0.
  var scale = 1 + (1 - (BlocklyGames.LEVEL / BlocklyGames.MAX_LEVEL)) / 3;
  BlocklyInterface.injectBlockly(
      {'maxBlocks': Maze.MAX_BLOCKS,
       'rtl': rtl,
       'trashcan': true,
       'zoom': {'startScale': scale}});

  BlocklyInterface.workspace.getAudioManager().load(Maze.SKIN.winSound, 'win');
  BlocklyInterface.workspace.getAudioManager().load(Maze.SKIN.crashSound, 'fail');
  // Not really needed, there are no user-defined functions or variables.
  Blockly.JavaScript.addReservedWords('moveForward,moveBackward,' +
      'turnRight,turnLeft,isPathForward,isPathRight,isPathBackward,isPathLeft');

  var defaultXml =
      '<xml>' +
        '<block type="move_east"></block>' +
      '</xml>';
  BlocklyInterface.loadBlocks(defaultXml, false);

  // Locate the start and finish squares.
  Maze.finish_ = [];
  for (var y = 0; y < Maze.ROWS; y++) {
    for (var x = 0; x < Maze.COLS; x++) {
      if (Maze.map[y][x] == Maze.SquareType.START) {
        Maze.start_ = {x: x, y: y};
      } else if (Maze.map[y][x] == Maze.SquareType.FINISH) {
        Maze.finish_.push({x: x, y: y});
      }
    }
  }
  Maze.numFinish = Maze.finish_.length;

  Maze.drawMap();

  Maze.reset(true);
  BlocklyInterface.workspace.addChangeListener(function() {Maze.updateCapacity();});

  BlocklyGames.bindClick('runButton', Maze.runButtonClick);
  BlocklyGames.bindClick('resetButton', Maze.resetButtonClick);

  if (BlocklyGames.LEVEL == 1) {
    // Make connecting blocks easier for beginners.
    Blockly.SNAP_RADIUS *= 2;
    Blockly.CONNECTING_SNAP_RADIUS = Blockly.SNAP_RADIUS;
  }
  if (BlocklyGames.LEVEL == 10) {
    if (!BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
                                          BlocklyGames.LEVEL)) {
      // Level 10 gets an introductory modal dialog.
      // Skip the dialog if the user has already won.
      var content = document.getElementById('dialogHelpWallFollow');
      var style = {
        'width': '30%',
        'left': '35%',
        'top': '12em'
      };
      BlocklyDialogs.showDialog(content, null, false, true, style,
          BlocklyDialogs.stopDialogKeyDown);
      BlocklyDialogs.startDialogKeyDown();
      setTimeout(BlocklyDialogs.abortOffer, 5 * 60 * 1000);
    }
  }

  // Add the spinning Pegman icon to the done dialog.
  // <img id="pegSpin" src="common/1x1.gif">
  var buttonDiv = document.getElementById('dialogDoneButtons');
  var pegSpin = document.createElement('img');
  pegSpin.id = 'pegSpin';
  pegSpin.src = 'common/1x1.gif';
  pegSpin.style.backgroundImage = 'url(' + Maze.SKIN.sprite + ')';
  buttonDiv.parentNode.insertBefore(pegSpin, buttonDiv);

  // Lazy-load the JavaScript interpreter.
  BlocklyInterface.importInterpreter();
  // Lazy-load the syntax-highlighting.
  BlocklyInterface.importPrettify();
};

/**
 * Reset the maze to the start position and kill any pending animation tasks.
 * @param {boolean} first True if an opening animation is to be played.
 */
Maze.reset = function(first) {
  // Kill all tasks.
  for (var i = 0; i < Maze.pidList.length; i++) {
    clearTimeout(Maze.pidList[i]);
  }
  Maze.pidList = [];

  // Move Pegman into position.
  Maze.pegmanX = Maze.start_.x;
  Maze.pegmanY = Maze.start_.y;

  // reset number of Finish Marker into full
  Maze.numFinish = Maze.finish_.length;

  // reset all finish marker back to original form
  Maze.resetFinishMarker();

  if (first) {
    // Opening animation.
    Maze.pegmanD = Maze.startDirection + 1;
    Maze.scheduleFinish(false);
    Maze.pidList.push(setTimeout(function() {
      Maze.stepSpeed = 100;
      Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4],
                    [Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4 - 4]);
      Maze.pegmanD++;
    }, Maze.stepSpeed * 5));
  } else {
    Maze.pegmanD = Maze.startDirection;
    Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4);
  }

  // Move the finish icon into position.
  for (var i = 0; i < Maze.numFinish; i++){
    var finishIcon = document.getElementById('finish' + i);
    finishIcon.setAttribute('x', Maze.SQUARE_SIZE * (Maze.finish_[i].x));
    finishIcon.setAttribute('y', Maze.SQUARE_SIZE * (Maze.finish_[i].y));
  }

  // Make 'look' icon invisible and promote to top.
  var lookIcon = document.getElementById('look');
  lookIcon.style.display = 'none';
  lookIcon.parentNode.appendChild(lookIcon);
  var paths = lookIcon.getElementsByTagName('path');
  for (var i = 0, path; (path = paths[i]); i++) {
    path.setAttribute('stroke', Maze.SKIN.look);
  }
};

/**
 * Click the run button.  Start the program.
 * @param {!Event} e Mouse or touch event.
 */
Maze.runButtonClick = function(e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  BlocklyDialogs.hideDialog(false);
  // Only allow a single top block on level 1.
  if (BlocklyGames.LEVEL == 1 &&
      BlocklyInterface.workspace.getTopBlocks(false).length > 1 &&
      Maze.result != Maze.ResultType.SUCCESS &&
      !BlocklyGames.loadFromLocalStorage(BlocklyGames.NAME,
                                         BlocklyGames.LEVEL)) {
    return;
  }
  var runButton = document.getElementById('runButton');
  var resetButton = document.getElementById('resetButton');
  // Ensure that Reset button is at least as wide as Run button.
  if (!resetButton.style.minWidth) {
    resetButton.style.minWidth = runButton.offsetWidth + 'px';
  }
  runButton.style.display = 'none';
  resetButton.style.display = 'inline';
  Maze.reset(false);
  Maze.execute();
};

/**
 * Updates the document's 'capacity' element with a message
 * indicating how many more blocks are permitted.  The capacity
 * is retrieved from BlocklyInterface.workspace.remainingCapacity().
 */
Maze.updateCapacity = function() {
  var cap = BlocklyInterface.workspace.remainingCapacity();
  var p = document.getElementById('capacity');
  if (cap == Infinity) {
    p.style.display = 'none';
  } else {
    p.style.display = 'inline';
    p.innerHTML = '';
    cap = Number(cap);
    var capSpan = document.createElement('span');
    capSpan.className = 'capacityNumber';
    capSpan.appendChild(document.createTextNode(cap));
    if (cap == 0) {
      var msg = BlocklyGames.getMsg('Maze_capacity0');
    } else if (cap == 1) {
      var msg = BlocklyGames.getMsg('Maze_capacity1');
    } else {
      var msg = BlocklyGames.getMsg('Maze_capacity2');
    }
    var parts = msg.split(/%\d/);
    for (var i = 0; i < parts.length; i++) {
      p.appendChild(document.createTextNode(parts[i]));
      if (i != parts.length - 1) {
        p.appendChild(capSpan.cloneNode(true));
      }
    }
  }
};

/**
 * Click the reset button.  Reset the maze.
 * @param {!Event} e Mouse or touch event.
 */
Maze.resetButtonClick = function(e) {
  // Prevent double-clicks or double-taps.
  if (BlocklyInterface.eventSpam(e)) {
    return;
  }
  var runButton = document.getElementById('runButton');
  runButton.style.display = 'inline';
  document.getElementById('resetButton').style.display = 'none';
  BlocklyInterface.workspace.highlightBlock(null);
  Maze.reset(false);
};

/**
 * Inject the Maze API into a JavaScript interpreter.
 * @param {!Interpreter} interpreter The JS-Interpreter.
 * @param {!Interpreter.Object} globalObject Global object.
 */
Maze.initInterpreter = function(interpreter, globalObject) {
  // API
  var wrapper;
  wrapper = function(){
    return Maze.notDone();
  }
  interpreter.setProperty(globalObject, 'notDone',
      interpreter.createNativeFunction(wrapper));
  // new added: north, east, south, west
  wrapper = function(id){
    return Maze.move(Maze.DirectionType.NORTH, id);
  }
  interpreter.setProperty(globalObject, 'moveNorth', 
      interpreter.createNativeFunction(wrapper));
  wrapper = function(id){
    return Maze.move(Maze.DirectionType.EAST, id);
  }
  interpreter.setProperty(globalObject, 'moveEast',
      interpreter.createNativeFunction(wrapper));
  wrapper = function(id){
    return Maze.move(Maze.DirectionType.SOUTH, id);
  }
  interpreter.setProperty(globalObject, 'moveSouth',
      interpreter.createNativeFunction(wrapper));
  wrapper = function(id){
    return Maze.move(Maze.DirectionType.WEST, id);
  }
  interpreter.setProperty(globalObject, 'moveWest',
      interpreter.createNativeFunction(wrapper));
};

/**
 * Execute the user's code.  Heaven help us...
 */
Maze.execute = function() {
  if (!('Interpreter' in window)) {
    // Interpreter lazy loads and hasn't arrived yet.  Try again later.
    setTimeout(Maze.execute, 250);
    return;
  }

  Maze.log = [];
  Blockly.selected && Blockly.selected.unselect();
  var code = BlocklyInterface.getJsCode();
  Maze.result = Maze.ResultType.UNSET;
  var interpreter = new Interpreter(code, Maze.initInterpreter);

  // Try running the user's code.  There are four possible outcomes:
  // 1. If pegman reaches the finish [SUCCESS], true is thrown.
  // 2. If the program is terminated due to running too long [TIMEOUT],
  //    false is thrown.
  // 3. If another error occurs [ERROR], that error is thrown.
  // 4. If the program ended normally but without solving the maze [FAILURE],
  //    no error or exception is thrown.
  try {
    var ticks = 10000;  // 10k ticks runs Pegman for about 8 minutes.
    while (interpreter.step()) {
      if (ticks-- == 0) {
        throw Infinity;
      }
    }
    // Maze.result = Maze.notDone() ?
    //     Maze.ResultType.FAILURE : Maze.ResultType.SUCCESS;
  } catch (e) {
    // A boolean is thrown for normal termination.
    // Abnormal termination is a user error.
    if (e === Infinity) {
      Maze.result = Maze.ResultType.TIMEOUT;
    } else if (e === false) {
      Maze.result = Maze.ResultType.ERROR;
    } else {
      // Syntax error, can't happen.
      Maze.result = Maze.ResultType.ERROR;
      alert(e);
    }
  }

  // Fast animation if execution is successful.  Slow otherwise.
  // if (Maze.result == Maze.ResultType.SUCCESS) {
  //   Maze.stepSpeed = 100;
  //   Maze.log.push(['finish', null]);
  // } else {
  //   Maze.stepSpeed = 150;
  // }

  // add a check block to see if everything finished
  Maze.log.push(['check', null]);

  //default speed: 150ms
  Maze.stepSpeed = 150;

  // Maze.log now contains a transcript of all the user's actions.
  // Reset the maze and animate the transcript.
  Maze.reset(false);
  Maze.pidList.push(setTimeout(Maze.animate, 100));
};

/**
 * Iterate through the recorded path and animate pegman's actions.
 */
Maze.animate = function() {
  var action = Maze.log.shift();
  // all actions being executed
  if (!action) {
    BlocklyInterface.highlight(null);
    return;
  }
  BlocklyInterface.highlight(action[1]);

  // Check if touching the finish Marker
  Maze.checkFinishMarker();

  switch (action[0]) {
    case 'north':
      Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4],
                    [Maze.pegmanX, Maze.pegmanY - 1, Maze.pegmanD * 4]);
      Maze.pegmanY--;
      break;
    case 'east':
      Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4],
                    [Maze.pegmanX + 1, Maze.pegmanY, Maze.pegmanD * 4]);
      Maze.pegmanX++;
      break;
    case 'south':
      Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4],
                    [Maze.pegmanX, Maze.pegmanY + 1, Maze.pegmanD * 4]);
      Maze.pegmanY++;
      break;
    case 'west':
      Maze.schedule([Maze.pegmanX, Maze.pegmanY, Maze.pegmanD * 4],
                    [Maze.pegmanX - 1, Maze.pegmanY, Maze.pegmanD * 4]);
      Maze.pegmanX--;
      break;
    case 'look_north':
      Maze.scheduleLook(Maze.DirectionType.NORTH);
      break;
    case 'look_east':
      Maze.scheduleLook(Maze.DirectionType.EAST);
      break;
    case 'look_south':
      Maze.scheduleLook(Maze.DirectionType.SOUTH);
      break;
    case 'look_west':
      Maze.scheduleLook(Maze.DirectionType.WEST);
      break;
    case 'fail_forward':
      Maze.scheduleFail(true);
      break;
    case 'fail_backward':
      Maze.scheduleFail(false);
      break;
    case 'check':
      break;
    case 'finish':
      Maze.scheduleFinish(true);
      BlocklyInterface.saveToLocalStorage();
      setTimeout(BlocklyDialogs.congratulations, 1000);
  }

  // if maze is finished then add the finish log to execute
  if(!Maze.notDone()) Maze.log.push(['finish', null]);

  Maze.pidList.push(setTimeout(Maze.animate, Maze.stepSpeed * 5));
};

/**
 * Schedule the animations for a move or turn.
 * @param {!Array.<number>} startPos X, Y and direction starting points.
 * @param {!Array.<number>} endPos X, Y and direction ending points.
 */
Maze.schedule = function(startPos, endPos) {
  var deltas = [(endPos[0] - startPos[0]) / 4,
                (endPos[1] - startPos[1]) / 4,
                (endPos[2] - startPos[2]) / 4];
  Maze.displayPegman(startPos[0] + deltas[0],
                     startPos[1] + deltas[1],
                     Maze.constrainDirection16(startPos[2] + deltas[2]));
  Maze.pidList.push(setTimeout(function() {
      Maze.displayPegman(startPos[0] + deltas[0] * 2,
          startPos[1] + deltas[1] * 2,
          Maze.constrainDirection16(startPos[2] + deltas[2] * 2));
    }, Maze.stepSpeed));
  Maze.pidList.push(setTimeout(function() {
      Maze.displayPegman(startPos[0] + deltas[0] * 3,
          startPos[1] + deltas[1] * 3,
          Maze.constrainDirection16(startPos[2] + deltas[2] * 3));
    }, Maze.stepSpeed * 2));
  Maze.pidList.push(setTimeout(function() {
      Maze.displayPegman(endPos[0], endPos[1],
          Maze.constrainDirection16(endPos[2]));
    }, Maze.stepSpeed * 3));
};

/**
 * Schedule the animations and sounds for a failed move.
 * @param {boolean} forward True if forward, false if backward.
 */
Maze.scheduleFail = function(forward) {
  var deltaX = 0;
  var deltaY = 0;
  switch (Maze.pegmanD) {
    case Maze.DirectionType.NORTH:
      deltaY = -1;
      break;
    case Maze.DirectionType.EAST:
      deltaX = 1;
      break;
    case Maze.DirectionType.SOUTH:
      deltaY = 1;
      break;
    case Maze.DirectionType.WEST:
      deltaX = -1;
      break;
  }
  if (!forward) {
    deltaX = -deltaX;
    deltaY = -deltaY;
  }
  if (Maze.SKIN.crashType == Maze.CRASH_STOP) {
    // Bounce bounce.
    deltaX /= 4;
    deltaY /= 4;
    var direction16 = Maze.constrainDirection16(Maze.pegmanD * 4);
    Maze.displayPegman(Maze.pegmanX + deltaX,
                       Maze.pegmanY + deltaY,
                       direction16);
    BlocklyInterface.workspace.getAudioManager().play('fail', 0.5);
    Maze.pidList.push(setTimeout(function() {
      Maze.displayPegman(Maze.pegmanX,
                         Maze.pegmanY,
                         direction16);
      }, Maze.stepSpeed));
    Maze.pidList.push(setTimeout(function() {
      Maze.displayPegman(Maze.pegmanX + deltaX,
                         Maze.pegmanY + deltaY,
                         direction16);
      BlocklyInterface.workspace.getAudioManager().play('fail', 0.5);
    }, Maze.stepSpeed * 2));
    Maze.pidList.push(setTimeout(function() {
        Maze.displayPegman(Maze.pegmanX, Maze.pegmanY, direction16);
      }, Maze.stepSpeed * 3));
  } else {
    // Add a small random delta away from the grid.
    var deltaZ = (Math.random() - 0.5) * 10;
    var deltaD = (Math.random() - 0.5) / 2;
    deltaX += (Math.random() - 0.5) / 4;
    deltaY += (Math.random() - 0.5) / 4;
    deltaX /= 8;
    deltaY /= 8;
    var acceleration = 0;
    if (Maze.SKIN.crashType == Maze.CRASH_FALL) {
      acceleration = 0.01;
    }
    Maze.pidList.push(setTimeout(function() {
      BlocklyInterface.workspace.getAudioManager().play('fail', 0.5);
    }, Maze.stepSpeed * 2));
    var setPosition = function(n) {
      return function() {
        var direction16 = Maze.constrainDirection16(Maze.pegmanD * 4 +
                                                    deltaD * n);
        Maze.displayPegman(Maze.pegmanX + deltaX * n,
                           Maze.pegmanY + deltaY * n,
                           direction16,
                           deltaZ * n);
        deltaY += acceleration;
      };
    };
    // 100 frames should get Pegman offscreen.
    for (var i = 1; i < 100; i++) {
      Maze.pidList.push(setTimeout(setPosition(i),
          Maze.stepSpeed * i / 2));
    }
  }
};

/**
 * Schedule the animations and sound for a victory dance.
 * @param {boolean} sound Play the victory sound.
 */
Maze.scheduleFinish = function(sound) {
  if (sound) {
    BlocklyInterface.workspace.getAudioManager().play('win', 0.5);
  }
};

/**
 * Display Pegman at the specified location, facing the specified direction.
 * @param {number} x Horizontal grid (or fraction thereof).
 * @param {number} y Vertical grid (or fraction thereof).
 * @param {number} d Direction (0 - 15) or dance (16 - 17).
 * @param {number=} opt_angle Optional angle (in degrees) to rotate Pegman.
 */
Maze.displayPegman = function(x, y, d, opt_angle) {
  d = 0 // cancel offset for only one image of sprite
  var pegmanIcon = document.getElementById('pegman');
  pegmanIcon.setAttribute('x',
      x * Maze.SQUARE_SIZE - d * Maze.PEGMAN_WIDTH + 1);
  pegmanIcon.setAttribute('y',
      Maze.SQUARE_SIZE * (y + 0.5) - Maze.PEGMAN_HEIGHT / 2 - 8);
  if (opt_angle) {
    pegmanIcon.setAttribute('transform', 'rotate(' + opt_angle + ', ' +
        (x * Maze.SQUARE_SIZE + Maze.SQUARE_SIZE / 2) + ', ' +
        (y * Maze.SQUARE_SIZE + Maze.SQUARE_SIZE / 2) + ')');
  } else {
    pegmanIcon.setAttribute('transform', 'rotate(0, 0, 0)');
  }

  var clipRect = document.getElementById('clipRect');
  clipRect.setAttribute('x', x * Maze.SQUARE_SIZE + 1);
  clipRect.setAttribute('y', pegmanIcon.getAttribute('y'));
};

Maze.checkFinishMarker = function(){
  for (var i = 0; i < Maze.finish_.length; i++){
    if (Maze.pegmanX == Maze.finish_[i].x && Maze.pegmanY == Maze.finish_[i].y){
      Maze.numFinish--;
      Maze.deleteFinishMarker(i);
      break;
    }
  }
}

Maze.resetFinishMarker = function(){
  for (var i = 0; i < Maze.finish_.length; i++){
    var Marker = document.getElementById('finish'+i);
    Marker.setAttribute('xlink:href', Maze.SKIN.marker);
  }
}

/**
 * Change the given finish marker into the second form
 * @param {number} idx Index of the finish Marker that need to be deleted.
 */
Maze.deleteFinishMarker = function(idx){
  var changedFinishMarker = document.getElementById('finish'+idx);
  changedFinishMarker.setAttribute('xlink:href', Maze.SKIN.marker2);
}

/**
 * Display the look icon at Pegman's current location,
 * in the specified direction.
 * @param {!Maze.DirectionType} d Direction (0 - 3).
 */
Maze.scheduleLook = function(d) {
  var x = Maze.pegmanX;
  var y = Maze.pegmanY;
  switch (d) {
    case Maze.DirectionType.NORTH:
      x += 0.5;
      break;
    case Maze.DirectionType.EAST:
      x += 1;
      y += 0.5;
      break;
    case Maze.DirectionType.SOUTH:
      x += 0.5;
      y += 1;
      break;
    case Maze.DirectionType.WEST:
      y += 0.5;
      break;
  }
  x *= Maze.SQUARE_SIZE;
  y *= Maze.SQUARE_SIZE;
  var deg = d * 90 - 45;

  var lookIcon = document.getElementById('look');
  lookIcon.setAttribute('transform',
      'translate(' + x + ', ' + y + ') ' +
      'rotate(' + deg + ' 0 0) scale(.4)');
  var paths = lookIcon.getElementsByTagName('path');
  lookIcon.style.display = 'inline';
  for (var i = 0, path; (path = paths[i]); i++) {
    Maze.scheduleLookStep(path, Maze.stepSpeed * i);
  }
};

/**
 * Schedule one of the 'look' icon's waves to appear, then disappear.
 * @param {!Element} path Element to make appear.
 * @param {number} delay Milliseconds to wait before making wave appear.
 */
Maze.scheduleLookStep = function(path, delay) {
  Maze.pidList.push(setTimeout(function() {
    path.style.display = 'inline';
    setTimeout(function() {
      path.style.display = 'none';
    }, Maze.stepSpeed * 2);
  }, delay));
};

/**
 * Keep the direction within 0-15, wrapping at both ends.
 * @param {number} d Potentially out-of-bounds direction value.
 * @return {number} Legal direction value.
 */
Maze.constrainDirection16 = function(d) {
  d = Math.round(d) % 16;
  if (d < 0) {
    d += 16;
  }
  return d;
};

// Core functions.

/**
 * Attempt to move pegman forward or backward.
 * @param {number} direction Direction to move (0 = forward, 2 = backward).
 * @param {string} id ID of block that triggered this action.
 * @throws {true} If the end of the maze is reached.
 * @throws {false} If Pegman collides with a wall.
 */
Maze.move = function(direction, id) {
  if (!Maze.isPath(direction)) {
    Maze.log.push(['fail_forward', id]);
    throw false;
  }
  var command;
  switch (direction) {
    case Maze.DirectionType.NORTH:
      Maze.pegmanY--;
      command = 'north';
      break;
    case Maze.DirectionType.EAST:
      Maze.pegmanX++;
      command = 'east';
      break;
    case Maze.DirectionType.SOUTH:
      Maze.pegmanY++;
      command = 'south';
      break;
    case Maze.DirectionType.WEST:
      Maze.pegmanX--;
      command = 'west';
      break;
  }
  Maze.log.push([command, id]);
};

/**
 * Turn pegman left or right.
 * @param {number} direction Direction to turn (0 = left, 1 = right).
 * @param {string} id ID of block that triggered this action.
 */
Maze.turn = function(direction, id) {
  if (direction) {
    // Right turn (clockwise).
    Maze.pegmanD++;
    Maze.log.push(['right', id]);
  } else {
    // Left turn (counterclockwise).
    Maze.pegmanD--;
    Maze.log.push(['left', id]);
  }
  Maze.pegmanD = Maze.constrainDirection4(Maze.pegmanD);
};

/**
 * Is there a path next to pegman?
 * @param {number} direction Direction to look
 *     (0 = forward, 1 = right, 2 = backward, 3 = left).
 * @param {?string} id ID of block that triggered this action.
 *     Null if called as a helper function in Maze.move().
 * @return {boolean} True if there is a path.
 */
Maze.isPath = function(direction) {
  var square;
  switch (direction) {
    case Maze.DirectionType.NORTH:
      square = Maze.map[Maze.pegmanY - 1] &&
          Maze.map[Maze.pegmanY - 1][Maze.pegmanX];
      break;
    case Maze.DirectionType.EAST:
      square = Maze.map[Maze.pegmanY][Maze.pegmanX + 1];
      break;
    case Maze.DirectionType.SOUTH:
      square = Maze.map[Maze.pegmanY + 1] &&
          Maze.map[Maze.pegmanY + 1][Maze.pegmanX]
      break;
    case Maze.DirectionType.WEST:
      square = Maze.map[Maze.pegmanY][Maze.pegmanX - 1];
      break;
  }
  return square !== Maze.SquareType.WALL && square !== undefined;
};

/**
 * Is the player touching all finish markers?
 * @return {boolean} True if not done, false if done.
 */
Maze.notDone = function() {
  return Maze.numFinish != 0;
};

window.addEventListener('load', Maze.init);
