/*

sq1.coffee

Ported from PPT, written Walter Souza: https://bitbucket.org/walter/puzzle-timer/src/7049018bbdc7/src/com/puzzletimer/solvers/Square1Solver.java
Ported by Lucas Garron, November 16, 2011.

TODO:
- Try to ini using pregenerated JSON.
- Try to optimize array (byte arrays?).
- Mersenne Twister for PRNG
- Figure out middle slice stuff.

*/
/*
    Trick from QBX (by Evan Gates).
*/
var IndexMappingCombinationToIndex, IndexMappingIndexToCombination, IndexMappingIndexToPermutation, IndexMappingNChooseK, IndexMappingOrientationToIndex, IndexMappingPermutationToIndex, b, cubeStateMultiply, i, idState, isEvenPermutation, make2DArray, makeArray, makeArrayZeroed, numStates, randomIntBelow, rs, square1SolverGenerate, square1SolverGetRandomState, square1SolverInitialized, square1SolverSearch, square1SolverSearch2, square1SolverSolution, square1SolverSolution2, square1SolverSolve, square1Solver_N_CORNERS_COMBINATIONS, square1Solver_N_CORNERS_PERMUTATIONS, square1Solver_N_EDGES_COMBINATIONS, square1Solver_N_EDGES_PERMUTATIONS, square1Solver_evenShapeDistance, square1Solver_initialize, square1Solver_oddShapeDistance, square1Solver_shapes, ss1, ss2, stateGetPiecesPermutation, stateGetShapeIndex, stateIsTwistable, stateMultiply, stateToCubeState, _i, _len;

makeArray = function(len) {
  var array;
  array = new Array;
  array.length = len;
  return array;
};

makeArrayZeroed = function(len) {
  var array, i;
  array = makeArray(len);
  if (len > 0) {
    for(i = 0; i < len; i++) {
      array[i] = 0;
    }
  }
  return array;
};

make2DArray = function(lenOuter, lenInner) {
  var i, outer;
  outer = makeArray(lenOuter);
  for(i = 0; i < lenOuter; i++) {
    outer[i] = makeArray(lenInner);
  }
  return outer;
};

IndexMappingPermutationToIndex = function(permutation) {
  var i, index, j;
  index = 0;
  if (permutation.length === 0) {
    return index;
  }
  for(i = 0; i < permutation.length - 1; i++) {
    index *= permutation.length - i;
    for (j = i + 1; j < permutation.length; j++) {
      if (permutation[i] > permutation[j]) {
        index++;
      }
    }
  }
  return index;
};

IndexMappingIndexToPermutation = function(index, length) {
  var i, j, permutation;
  permutation = makeArray(length);
  permutation[length - 1] = 0;
  for (i = length - 2; i >= 0; i--) {
    permutation[i] = index % (length - i);
    index = Math.floor(index / (length - i));
    for (j = i + 1; j < length; j++) {
      if (permutation[j] >= permutation[i]) {
        permutation[j]++;
      }
    }
  }
  return permutation;
};

IndexMappingOrientationToIndex = function(orientation, nValues) {
  var i, index;
  index = 0;
  for(i = 0; i < orientation.length; i++) {
    index = nValues * index + orientation[i];
  }
  return index;
};

IndexMappingNChooseK = function(n, k) {
  var i, value;
  value = 1;
  for(i = 0; i < k; i++) {
    value *= n - i;
  }
  for(i = 0; i < k; i++) {
    value /= k - i;
  }
  return value;
};

IndexMappingCombinationToIndex = function(combination, k) {
  var i, index;
  index = 0;
  for (i = combination.length - 1; i >= 0 && k >= 0; i--) {
    if (combination[i]) {
      index += IndexMappingNChooseK(i, k--);
    }
  }
  return index;
};

IndexMappingIndexToCombination = function(index, k, length) {
  var combination, i;
  combination = makeArray(length);
  for (i = length - 1; i >= 0 && k >= 0; i--) {
    if (index >= IndexMappingNChooseK(i, k)) {
      combination[i] = true;
      index -= IndexMappingNChooseK(i, k--);
    }
  }
  return combination;
};
numStates = 0;
ss1 = 0;
ss2 = 0;
idState = [0, 8, 1, 1, 9, 2, 2, 10, 3, 3, 11, 0, 4, 12, 5, 5, 13, 6, 6, 14, 7, 7, 15, 4];

stateIsTwistable = function(permutation) {
  return permutation[1] !== permutation[2] && permutation[7] !== permutation[8] && permutation[13] !== permutation[14] && permutation[19] !== permutation[20];
};

stateMultiply = function(permutation, move) {
  var i, newPermutation;
  newPermutation = makeArray(24);
  for(i = 0; i < permutation.length; i++) {
    newPermutation[i] = permutation[move[i]];
  }
  return newPermutation;
};

stateGetShapeIndex = function(permutation) {
  var cuts, i, next;
  cuts = makeArray(24);
  for(i = 0; i < cuts.length; i++) {
    cuts[i] = 0;
  }
  for (i = 0; i <= 11; i++) {
    next = (i + 1) % 12;
    if (permutation[i] !== permutation[next]) {
      cuts[i] = 1;
    }
  }
  for (i = 0; i <= 11; i++) {
    next = (i + 1) % 12;
    if (permutation[12 + i] !== permutation[12 + next]) {
      cuts[12 + i] = 1;
    }
  }
  return IndexMappingOrientationToIndex(cuts, 2);
};

stateGetPiecesPermutation = function(permutation) {
  var i, newPermutation, next, nextSlot;
  newPermutation = makeArray(16);
  nextSlot = 0;
  for (i = 0; i <= 11; i++) {
    next = (i + 1) % 12;
    if (permutation[i] !== permutation[next]) {
      newPermutation[nextSlot++] = permutation[i];
    }
  }
  for (i = 0; i <= 11; i++) {
    next = 12 + (i + 1) % 12;
    if (permutation[12 + i] !== permutation[next]) {
      newPermutation[nextSlot++] = permutation[12 + i];
    }
  }
  return newPermutation;
};

stateToCubeState = function(permutation) {
  var cornerIndices, cornersPermutation, edgeIndices, edgesPermutation, i;
  cornerIndices = [0, 3, 6, 9, 12, 15, 18, 21];
  cornersPermutation = makeArray(8);
  for(i = 0; i < cornersPermutation.length; i++) {
    cornersPermutation[i] = permutation[cornerIndices[i]];
  }
  edgeIndices = [1, 4, 7, 10, 13, 16, 19, 22];
  edgesPermutation = makeArray(8);
  for(i = 0; i < edgesPermutation.length; i++) {
    edgesPermutation[i] = permutation[edgeIndices[i]] - 8;
  }
  return [cornersPermutation, edgesPermutation];
};

cubeStateMultiply = function(state, move) {
  var cornersPermutation, edgesPermutation, i;
  cornersPermutation = makeArray(8);
  edgesPermutation = makeArray(8);
  for (i = 0; i <= 7; i++) {
    cornersPermutation[i] = state[0][move[0][i]];
    edgesPermutation[i] = state[1][move[1][i]];
  }
  return [cornersPermutation, edgesPermutation];
};

square1Solver_N_CORNERS_PERMUTATIONS = 40320;
square1Solver_N_CORNERS_COMBINATIONS = 70;
square1Solver_N_EDGES_PERMUTATIONS = 40320;
square1Solver_N_EDGES_COMBINATIONS = 70;
square1SolverInitialized = false;
square1Solver_shapes = new Array();
square1Solver_evenShapeDistance = {};
square1Solver_oddShapeDistance = {};
square1Solver_moves1 = makeArray(23);
var square1Solver_moves2;
var square1Solver_cornersPermutationMove;
var square1Solver_cornersCombinationMove;
var square1Solver_edgesPermutationMove;
var square1Solver_edgesCombinationMove;
var square1Solver_cornersDistance;
var square1Solver_edgesDistance;

square1Solver_initialize = function(doneCallback, statusCallback) {
  var combination, corners, depth, distanceTable, edges, fringe, i, iii, initializationLastTime, initializationStartTime, isTopCorner, isTopEdge, j, k, logStatus, move, move01, move03, move10, move30, moveTwist, moveTwistBottom, moveTwistTop, nVisited, newFringe, next, nextBottom, nextCornerPermutation, nextCornersCombination, nextEdgeCombination, nextEdgesPermutation, nextTop, result, state, statusI, _i, _len;
  initializationStartTime = new Date().getTime();
  initializationLastTime = initializationStartTime;
  statusI = 0;

  ini = 0;
  iniParts = new Array();

  logStatus = function(statusString) {
    var initializationCurrentTime, outString;
    statusI++;
    initializationCurrentTime = new Date().getTime();
    outString = "" + statusI + ". " + statusString + " [" + (initializationCurrentTime - initializationLastTime) + "ms split, " + (initializationCurrentTime - initializationStartTime) + "ms total]";
    initializationLastTime = initializationCurrentTime;
    console.log(outString);
    if (statusCallback != null) {
      statusCallback(outString);
    }
  };

  iniParts[ini++] = function() {
  
    logStatus("Initializing Square-1 Solver.");
    
    /* Callback Continuation */ setTimeout(iniParts[ini++], 0);};iniParts[ini++] = function() {

    move10 = [11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    move = move10;
    for (i = 0; i <= 10; i++) {
      square1Solver_moves1[i] = move;
      move = stateMultiply(move, move10);
    }
    move01 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 12];
    move = move01;
    for (i = 0; i <= 10; i++) {
      square1Solver_moves1[11 + i] = move;
      move = stateMultiply(move, move01);
    }
    moveTwist = [0, 1, 19, 18, 17, 16, 15, 14, 8, 9, 10, 11, 12, 13, 7, 6, 5, 4, 3, 2, 20, 21, 22, 23];
    square1Solver_moves1[22] = moveTwist;

    logStatus("Generating shape tables.");
    /* Callback Continuation */ setTimeout(iniParts[ini++], 0);};iniParts[ini++] = function() {

    square1Solver_evenShapeDistance[stateGetShapeIndex(idState)] = 0;
    fringe = new Array();
    fringe.push(idState);
    iii = 0;
    depth = 0;
    while (fringe.length > 0) {
      newFringe = new Array();
      for (_i = 0, _len = fringe.length; _i < _len; _i++) {
        state = fringe[_i];
        if (stateIsTwistable(state)) {
          square1Solver_shapes.push(state);
        }
        for(i = 0; i < square1Solver_moves1.length; i++) {
          if (!(i === 22 && !stateIsTwistable(state))) {
            next = stateMultiply(state, square1Solver_moves1[i]);
            distanceTable = null;
            if (isEvenPermutation(stateGetPiecesPermutation(next))) {
              distanceTable = square1Solver_evenShapeDistance;
            } else {
              distanceTable = square1Solver_oddShapeDistance;
            }
            if (!(distanceTable[stateGetShapeIndex(next)] != null)) {
              distanceTable[stateGetShapeIndex(next)] = depth + 1;
              newFringe.push(next);
            }
          }
        }
      }
      fringe = newFringe;
      depth++;
      if (depth === 10 || depth === 12 || depth === 15) {
        logStatus("Shape Table Depth: " + depth + "/20");
      }
    }
    move30 = [[3, 0, 1, 2, 4, 5, 6, 7], [3, 0, 1, 2, 4, 5, 6, 7]];
    move03 = [[0, 1, 2, 3, 5, 6, 7, 4], [0, 1, 2, 3, 5, 6, 7, 4]];
    moveTwistTop = [[0, 6, 5, 3, 4, 2, 1, 7], [6, 5, 2, 3, 4, 1, 0, 7]];
    moveTwistBottom = [[0, 6, 5, 3, 4, 2, 1, 7], [0, 5, 4, 3, 2, 1, 6, 7]];
    square1Solver_moves2 = [move30, cubeStateMultiply(move30, move30), cubeStateMultiply(cubeStateMultiply(move30, move30), move30), move03, cubeStateMultiply(move03, move03), cubeStateMultiply(cubeStateMultiply(move03, move03), move03), moveTwistTop, moveTwistBottom];


    logStatus("Generating move tables.");
    /* Callback Continuation */ setTimeout(iniParts[ini++], 0);};iniParts[ini++] = function() {

    logStatus("Corner permutation move table...");
    /* Callback Continuation */ setTimeout(iniParts[ini++], 0);};iniParts[ini++] = function() {

    square1Solver_cornersPermutationMove = make2DArray(square1Solver_N_CORNERS_PERMUTATIONS, square1Solver_moves2.length);
    for(i = 0; i < square1Solver_N_CORNERS_PERMUTATIONS; i++) {
      state = [IndexMappingIndexToPermutation(i, 8), makeArrayZeroed(8)];
      for(j = 0; j < square1Solver_moves2.length; j++) {
        square1Solver_cornersPermutationMove[i][j] = IndexMappingPermutationToIndex(cubeStateMultiply(state, square1Solver_moves2[j])[0]);
      }
    }
    
    logStatus("Corner combination move table...");
    /* Callback Continuation */ setTimeout(iniParts[ini++], 0);};iniParts[ini++] = function() {

    square1Solver_cornersCombinationMove = make2DArray(square1Solver_N_CORNERS_COMBINATIONS, square1Solver_moves2.length);
    for(i = 0; i < square1Solver_N_CORNERS_COMBINATIONS; i++) {
      combination = IndexMappingIndexToCombination(i, 4, 8);
      corners = makeArray(8);
      nextTop = 0;
      nextBottom = 4;
      for(j = 0; j < corners.length; j++) {
        if (combination[j]) {
          corners[j] = nextTop++;
        } else {
          corners[j] = nextBottom++;
        }
      }
      state = [corners, makeArray(8)];
      for(j = 0; j < square1Solver_moves2.length; j++) {
        result = cubeStateMultiply(state, square1Solver_moves2[j]);
        isTopCorner = makeArray(8);
        for(k = 0; k < isTopCorner.length; k++) {
          isTopCorner[k] = result[0][k] < 4;
        }
        square1Solver_cornersCombinationMove[i][j] = IndexMappingCombinationToIndex(isTopCorner, 4);
      }
    }

    logStatus("Edges permutation move table...");
    /* Callback Continuation */ setTimeout(iniParts[ini++], 0);};iniParts[ini++] = function() {

    square1Solver_edgesPermutationMove = make2DArray(square1Solver_N_EDGES_PERMUTATIONS, square1Solver_moves2.length);
    for(i = 0; i < square1Solver_N_EDGES_PERMUTATIONS; i++) {
      state = [makeArrayZeroed(8), IndexMappingIndexToPermutation(i, 8)];
      for(j = 0; j < square1Solver_moves2.length; j++) {
        square1Solver_edgesPermutationMove[i][j] = IndexMappingPermutationToIndex(cubeStateMultiply(state, square1Solver_moves2[j])[0]);
      }
    }

    logStatus("Edges combination move table...");
    /* Callback Continuation */ setTimeout(iniParts[ini++], 0);};iniParts[ini++] = function() {

    square1Solver_edgesCombinationMove = make2DArray(square1Solver_N_EDGES_COMBINATIONS, square1Solver_moves2.length);
    for(i = 0; i < square1Solver_N_EDGES_COMBINATIONS - 1 + 1; i++) {
      combination = IndexMappingIndexToCombination(i, 4, 8);
      edges = makeArray(8);
      nextTop = 0;
      nextBottom = 4;
      for(j = 0; j < 8 - 1 + 1; j++) {
        if (combination[j]) {
          edges[j] = nextTop++;
        } else {
          edges[j] = nextBottom++;
        }
      }
      state = [makeArray(8), edges];
      for(j = 0; j < square1Solver_moves2.length - 1 + 1; j++) {
        result = cubeStateMultiply(state, square1Solver_moves2[j]);
        isTopEdge = makeArray(8);
        for(k = 0; k < isTopEdge.length - 1 + 1; k++) {
          isTopEdge[k] = result[1][k] < 4;
        }
        square1Solver_edgesCombinationMove[i][j] = IndexMappingCombinationToIndex(isTopEdge, 4);
      }
    }

    logStatus("Generating prune tables.");
    /* Callback Continuation */ setTimeout(iniParts[ini++], 0);};iniParts[ini++] = function() {

    logStatus("Corners distance prune table...");
    /* Callback Continuation */ setTimeout(iniParts[ini++], 0);};iniParts[ini++] = function() {

    square1Solver_cornersDistance = make2DArray(square1Solver_N_CORNERS_PERMUTATIONS, square1Solver_N_EDGES_COMBINATIONS);
    for(i = 0; i < square1Solver_N_CORNERS_PERMUTATIONS - 1 + 1; i++) {
      for(j = 0; j < square1Solver_N_EDGES_COMBINATIONS - 1 + 1; j++) {
        square1Solver_cornersDistance[i][j] = -1;
      }
    }
    square1Solver_cornersDistance[0][0] = 0;
    while (true) {
      nVisited = 0;
      for(i = 0; i < square1Solver_N_CORNERS_PERMUTATIONS - 1 + 1; i++) {
        for(j = 0; j < square1Solver_N_EDGES_COMBINATIONS - 1 + 1; j++) {
          if (square1Solver_cornersDistance[i][j] === depth) {
            for(k = 0; k < square1Solver_moves2.length - 1 + 1; k++) {
              nextCornerPermutation = square1Solver_cornersPermutationMove[i][k];
              nextEdgeCombination = square1Solver_edgesCombinationMove[j][k];
              if (square1Solver_cornersDistance[nextCornerPermutation][nextEdgeCombination] < 0) {
                con;
                square1Solver_cornersDistance[nextCornerPermutation][nextEdgeCombination] = depth + 1;
                nVisited++;
              }
            }
          }
        }
      }
      depth++;
      if (!(nVisited > 0)) {
        break;
      }
    }

    logStatus("Edges distance prune table...");
    /* Callback Continuation */ setTimeout(iniParts[ini++], 0);};iniParts[ini++] = function() {

    square1Solver_edgesDistance = make2DArray(square1Solver_N_EDGES_PERMUTATIONS, square1Solver_N_CORNERS_COMBINATIONS);
    for(i = 0; i < square1Solver_N_EDGES_PERMUTATIONS - 1 + 1; i++) {
      for(j = 0; j < square1Solver_N_CORNERS_COMBINATIONS - 1 + 1; j++) {
        square1Solver_edgesDistance[i][j] = -1;
      }
    }
    square1Solver_edgesDistance[0][0] = 0;

    depth = 0;
    while (true) {
      nVisited = 0;
      for(i = 0; i < square1Solver_N_EDGES_PERMUTATIONS - 1 + 1; i++) {
        for(j = 0; j < square1Solver_N_CORNERS_COMBINATIONS - 1 + 1; j++) {
          if (square1Solver_edgesDistance[i][j] === depth) {
            for(k = 0; k < square1Solver_moves2.length - 1 + 1; k++) {
              nextEdgesPermutation = square1Solver_edgesPermutationMove[i][k];
              nextCornersCombination = square1Solver_cornersCombinationMove[j][k];
              if (square1Solver_edgesDistance[nextEdgesPermutation][nextCornersCombination] < 0) {
                square1Solver_edgesDistance[nextEdgesPermutation][nextCornersCombination] = depth + 1;
                nVisited++;
              }
            }
          }
        }
      }
      depth++;
      if (!(nVisited > 0)) {
        break;
      }
    }
      
    logStatus("Done initializing Square-1 Solver.");
    /* Callback Continuation */ setTimeout(iniParts[ini++], 0);};iniParts[ini++] = function() {

    square1SolverInitialized = true;
    if (doneCallback != null) {
      doneCallback();
    }
  }

  ini=0;
  iniParts[ini++]();
};

square1SolverSolve = function(state) {
  var bottom, moveIndex, sequence, top, _i, _len;
  sequence = new Array();
  top = 0;
  bottom = 0;
  solution = square1SolverSolution(state);
  for (i = 0; i < solution.length; i++) {
    moveIndex = solution[i];
    if (moveIndex < 11) {
      top += moveIndex + 1;
      top %= 12;
    } else if (moveIndex < 22) {
      bottom += (moveIndex - 11) + 1;
      bottom %= 12;
    } else {
      if (top !== 0 || bottom !== 0) {
        if (top > 6) {
          top = -(12 - top);
        }
        if (bottom > 6) {
          bottom = -(12 - bottom);
        }
        sequence.push("(" + top + ", ", bottom + ")");
        top = 0;
        bottom = 0;
      }
      sequence.push(" / ");
    }
  }
  if (top !== 0 || bottom !== 0) {
    if (top > 6) {
      top = -(12 - top);
    }
    if (bottom > 6) {
      bottom = -(12 - bottom);
    }
    sequence.push("(" + top + ", ", bottom + ")");
  }
  return sequence;
};

square1SolverGenerate = function(state) {
  var bottom, i, sequence, solution, top;
  sequence = new Array();
  top = 0;
  bottom = 0;
  solution = square1SolverSolution(state);
  for (i = solution.length - 1; i >= 0; i--) {
    if (solution[i] < 11) {
      top += 12 - (solution[i] + 1);
      top %= 12;
    } else if (solution[i] < 22) {
      bottom += 12 - ((solution[i] - 11) + 1);
      bottom %= 12;
    } else {
      if (top !== 0 || bottom !== 0) {
        if (top > 6) {
          top = -(12 - top);
        }
        if (bottom > 6) {
          bottom = -(12 - bottom);
        }
        sequence.push("(" + top + ", ", bottom + ")");
        top = 0;
        bottom = 0;
      }
      sequence.push(" / ");
    }
  }
  if (top !== 0 || bottom !== 0) {
    if (top > 6) {
      top = -(12 - top);
    }
    if (bottom > 6) {
      bottom = -(12 - bottom);
    }
    sequence.push("(" + top + ", ", bottom + ")");
  }
  return sequence;
};

square1SolverSolution = function(state) {
  var depth, moveIndex, phase1MoveIndex, phase2MoveMapping, sequence, solution1, solution2, _i, _j, _k, _len, _len2, _len3, _ref, _results;
  if (!square1SolverInitialized) {
    square1Solver_initialize();
  }
  depth = 0;
  _results = [];
  while (true) {
    solution1 = new Array();
    solution2 = new Array();
    if (square1SolverSearch(state, isEvenPermutation(stateGetPiecesPermutation(state)), depth, solution1, solution2)) {
      sequence = new Array();
      for (_i = 0, _len = solution1.length; _i < _len; _i++) {
        moveIndex = solution1[_i];
        sequence.push(moveIndex);
      }
      phase2MoveMapping = [[2], [5], [8], [13], [16], [19], [0, 22, 10], [21, 22, 11]];
      for (_j = 0, _len2 = solution2.length; _j < _len2; _j++) {
        moveIndex = solution2[_j];
        _ref = phase2MoveMapping[moveIndex];
        for (_k = 0, _len3 = _ref.length; _k < _len3; _k++) {
          phase1MoveIndex = _ref[_k];
          sequence.push(phase1MoveIndex);
        }
      }
      return sequence;
    }
    depth++;
    if (depth > 300) {
      return 4 / 0;
    }
  }
  return _results;
};

square1SolverSearch = function(state, stateIsEvenPermutation, depth, solution1, solution2) {
  var distance, i, m, next, sequence2, _i, _len;
  if (depth === 0) {
    if (stateIsEvenPermutation && (stateGetShapeIndex(state) === stateGetShapeIndex(idState))) {
      sequence2 = square1SolverSolution2(stateToCubeState(state), 17);
      if (sequence2 !== null) {
        for (_i = 0, _len = sequence2.length; _i < _len; _i++) {
          m = sequence2[_i];
          solution2.push(m);
        }
        return true;
      }
    }
    return false;
  }
  distance = null;
  if (stateIsEvenPermutation) {
    distance = square1Solver_evenShapeDistance[stateGetShapeIndex(state)];
  } else {
    distance = square1Solver_oddShapeDistance[stateGetShapeIndex(state)];
  }
  if (distance <= depth) {
    for(i = 0; i < square1Solver_moves1.length; i++) {
      if (!(i === 22 && !stateIsTwistable(state))) {
        next = stateMultiply(state, square1Solver_moves1[i]);
        solution1.push(i);
        if (square1SolverSearch(next, isEvenPermutation(stateGetPiecesPermutation(next)), depth - 1, solution1, solution2)) {
          return true;
        }
        solution1.length -= 1;
      }
    }
  }
  return false;
};

square1SolverSolution2 = function(state, maxDepth) {
  var cornersCombination, cornersPermutation, depth, edgesCombination, edgesPermutation, isTopCorner, isTopEdge, k, solution;
  cornersPermutation = IndexMappingPermutationToIndex(state[0]);
  isTopCorner = makeArray(8);
  for(k = 0; k < isTopCorner.length; k++) {
    isTopCorner[k] = state[0][k] < 4;
  }
  cornersCombination = IndexMappingCombinationToIndex(isTopCorner, 4);
  edgesPermutation = IndexMappingPermutationToIndex(state[1]);
  isTopEdge = makeArray(8);
  for(k = 0; k < isTopEdge.length; k++) {
    isTopEdge[k] = state[1][k] < 4;
  }
  edgesCombination = IndexMappingCombinationToIndex(isTopEdge, 4);
  for(depth = 0; depth < maxDepth + 1; depth++) {
    solution = makeArrayZeroed(depth);
    if (square1SolverSearch2(cornersPermutation, cornersCombination, edgesPermutation, edgesCombination, depth, solution)) {
      return solution;
    }
  }
  return null;
};

square1SolverSearch2 = function(cornersPermutation, cornersCombination, edgesPermutation, edgesCombination, depth, solution) {
  var i;
  ss2++;
  if (depth === 0) {
    return (cornersPermutation === 0) && (edgesPermutation === 0);
  }
  if ((square1Solver_cornersDistance[cornersPermutation][edgesCombination] <= depth) && (square1Solver_edgesDistance[edgesPermutation][cornersCombination] <= depth)) {
    for(i = 0; i < square1Solver_moves2.length; i++) {
      if (!((solution.length - depth - 1 >= 0) && (Math.floor(solution[solution.length - depth - 1] / 3) === Math.floor(i / 3)))) {
        solution[solution.length - depth] = i;
        if (square1SolverSearch2(square1Solver_cornersPermutationMove[cornersPermutation][i], square1Solver_cornersCombinationMove[cornersCombination][i], square1Solver_edgesPermutationMove[edgesPermutation][i], square1Solver_edgesCombinationMove[edgesCombination][i], depth - 1, solution)) {
          return true;
        }
      }
    }
  }
  return false;
};

square1SolverGetRandomState = function() {
  var cornersPermutation, edgesPermutation, i, permutation, shape;
  if (!square1SolverInitialized) {
    square1Solver_initialize();
  }
  shape = square1Solver_shapes[randomIntBelow(square1Solver_shapes.length)];
  cornersPermutation = IndexMappingIndexToPermutation(randomIntBelow(square1Solver_N_CORNERS_PERMUTATIONS), 8);
  edgesPermutation = IndexMappingIndexToPermutation(randomIntBelow(square1Solver_N_EDGES_PERMUTATIONS), 8);
  permutation = makeArray(shape.length);
  for(i = 0; i < permutation.length; i++) {
    if (shape[i] < 8) {
      permutation[i] = cornersPermutation[shape[i]];
    } else {
      permutation[i] = 8 + edgesPermutation[shape[i] - 8];
    }
  }
  return permutation;
};

var square1RandomSource = Math;

// If we have a better (P)RNG:
setRandomSource = function(src) {
  square1RandomSource = src;
}

randomIntBelow = function(n) {
  return Math.floor(square1RandomSource.random() * n);
};

isEvenPermutation = function(permutation) {
  var i, j, nInversions;
  nInversions = 0;
  for(i = 0; i < permutation.length; i++) {
    for (j = i + 1; j < permutation.length; j++) {
      if (permutation[i] > permutation[j]) {
        nInversions++;
      }
    }
  }
  return nInversions % 2 === 0;
};

/*
b = idState;
console.log("Identity is twistable: " + stateIsTwistable(b));
square1Solver_initialize();
console.log("Initialized " + square1Solver_shapes.length + " shapes.");
rs = square1SolverGetRandomState();
*/