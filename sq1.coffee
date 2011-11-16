
###
    From QBX
    TODO: See if this actually helps.
###
makeArray = (len) ->
    array = new Array
    array.length = len
    return array

makeArrayZeroed = (len) ->
    array = makeArray(len)
    if len > 0
        for i in [0..(len-1)]
            array[i] = 0
    return array

make2DArray = (lenOuter, lenInner) ->
    outer = makeArray(lenOuter)
    for i in [0..(lenOuter-1)]
        outer[i] = makeArray(lenInner)
    return outer

###
    STATE
###

logFirst100Count = 0
logFirst100 = (str) ->
    if (++logFirst100Count < 100)
        console.log(str)

class IndexMapping

    #public static int permutationToIndex(byte[] permutation) {
    permutationToIndex: (permutation) ->
        index = 0

        if permutation.length == 0
            return index

        for i in [0..(permutation.length-2)]
            index *= permutation.length - i
            for j in [(i+1)..(permutation.length-1)]
                if (permutation[i] > permutation[j])
                    index++

        return index

    # public static byte[] indexToPermutation(int index, int length) {
    indexToPermutation: (index, length) ->
        permutation = makeArray(length)
        permutation[length - 1] = 0
        for i in [(length - 2)..0]
            permutation[i] = index % (length - i); #TODO check cast
            index = Math.floor(index/(length - i))
            for j in [(i + 1)..(length-1)]
                if (permutation[j] >= permutation[i])
                    permutation[j]++

        return permutation

    ###


    // even permutation
    public static int evenPermutationToIndex(byte[] permutation) {
        int index = 0
        for (int i = 0; i < permutation.length - 2; i++) {
            index *= permutation.length - i
            for (int j = i + 1; j < permutation.length; j++) {
                if (permutation[i] > permutation[j]) {
                    index++
                }
            }
        }

        return index
    }

    public static byte[] indexToEvenPermutation(int index, int length) {
        int sum = 0
        byte[] permutation = new byte[length]

        permutation[length - 1] = 1
        permutation[length - 2] = 0
        for (int i = length - 3; i >= 0; i--) {
            permutation[i] = (byte) (index % (length - i))
            sum += permutation[i]
            index /= length - i
            for (int j = i + 1; j < length; j++) {
                if (permutation[j] >= permutation[i]) {
                    permutation[j]++
                }
            }
        }

        if (sum % 2 != 0) {
            byte temp = permutation[permutation.length - 1]
            permutation[permutation.length - 1] = permutation[permutation.length - 2]
            permutation[permutation.length - 2] = temp
        }

        return permutation
    }
    ###

    # public static int orientationToIndex(byte[] orientation, int nValues) {
    orientationToIndex: (orientation, nValues) ->
        index = 0
        for i in [0..(orientation.length-1)]
            index = nValues * index + orientation[i]

        return index

    ###

    public static byte[] indexToOrientation(int index, int nValues, int length) {
        byte[] orientation = new byte[length]
        for (int i = length - 1; i >= 0; i--) {
            orientation[i] = (byte) (index % nValues)
            index /= nValues
        }

        return orientation
    }

    // zero sum orientation
    public static int zeroSumOrientationToIndex(byte[] orientation, int nValues) {
        int index = 0
        for (int i = 0; i < orientation.length - 1; i++) {
            index = nValues * index + orientation[i]
        }

        return index
    }

    public static byte[] indexToZeroSumOrientation(int index, int nValues, int length) {
        byte[] orientation = new byte[length]
        orientation[length - 1] = 0
        for (int i = length - 2; i >= 0; i--) {
            orientation[i] = (byte) (index % nValues)
            index /= nValues

            orientation[length - 1] += orientation[i]
        }
        orientation[length - 1] = (byte) ((nValues - orientation[length - 1] % nValues) % nValues)

        return orientation
    }

###
    # combinations
    # private static int nChooseK(int n, int k) {
    nChooseK: (n, k) ->
        value = 1

        for i in [0..(k-1)]
            value *= n - i

        for i in [0..(k-1)]
            value /= k - i

        return value
    
    # public static int combinationToIndex(boolean[] combination, int k) {
    combinationToIndex: (combination, k) ->
        index = 0
        for i in [(combination.length - 1)..0]
            if (combination[i])
                index += @nChooseK(i, k--)
            if (k <= 0)
                break

        return index

    # public static boolean[] indexToCombination(int index, int k, int length) {
    indexToCombination: (index, k, length) ->
        combination = makeArray(length)
        for i in [(length - 1)..0]
            if (index >= @nChooseK(i, k))
                combination[i] = true
                index -= @nChooseK(i, k--)
            if !(k > 0)
                break

        return combination

numStates = 0
ss1 = 0
ss2 = 0

class State
    # public Permutation
    constructor: (@permutation) ->
        #if (++numStates % 1000 == 0)
            #console.log(numStates)
    
    # Solved
    id: new State ([
        0,  8,  1,  1,  9,  2,  2, 10,  3,  3, 11,  0,
        4, 12,  5,  5, 13,  6,  6, 14,  7,  7, 15,  4
        ])

    # public boolean
    isTwistable: ->
        return @permutation[1] != @permutation[2] &&
           @permutation[7] != @permutation[8] &&
           @permutation[13] != @permutation[14] &&
           @permutation[19] != @permutation[20]

    # public State multiply(State move)
    multiply: (move) ->
        permutation = makeArray(24)
        for i in [0..(permutation.length-1)]
            permutation[i] = @permutation[move.permutation[i]]
        return new State permutation


    # public int getShapeIndex()
    getShapeIndex: ->
        cuts = makeArray(24)
        for i in [0..(cuts.length-1)]
            cuts[i] = 0
        
        for i in [0..11]
            next = (i + 1) % 12
            if (@permutation[i] != @permutation[next])
                cuts[i] = 1
        
        for i in [0..11]
            next = (i + 1) % 12
            if (@permutation[12 + i] != @permutation[12 + next])
                cuts[12 + i] = 1
        
        #TODO
        return IndexMapping::orientationToIndex(cuts, 2)


    # public byte[] getPiecesPermutation() {
    getPiecesPermutation: ->
        permutation = makeArray(16)
        nextSlot = 0 #int

        for i in [0..11]
            next = (i + 1) % 12
            if (@permutation[i] != @permutation[next])
                permutation[nextSlot++] = @permutation[i]

        for i in [0..11]
            next = 12 + (i + 1) % 12
            if (@permutation[12 + i] != @permutation[next])
                permutation[nextSlot++] = @permutation[12 + i]

        return permutation
    
    # public CubeState toCubeState() {
    toCubeState: ->
        cornerIndices = [0, 3, 6, 9, 12, 15, 18, 21]

        cornersPermutation = makeArray(8)
        for i in [0..(cornersPermutation.length-1)]
            cornersPermutation[i] = @permutation[cornerIndices[i]]

        edgeIndices = [1, 4, 7, 10, 13, 16, 19, 22]

        edgesPermutation = makeArray(8)
        for i in [0..(edgesPermutation.length-1)]
            edgesPermutation[i] = @permutation[edgeIndices[i]] - 8 #TODO: Check byte cast

        return new CubeState(cornersPermutation, edgesPermutation)

class CubeState

    constructor: (@cornersPermutation, @edgesPermutation) ->

    multiply: (move) ->
        cornersPermutation = makeArray(8)
        edgesPermutation = makeArray(8)

        for i in [0..7]
            cornersPermutation[i] = @cornersPermutation[move.cornersPermutation[i]]
            edgesPermutation[i] = @edgesPermutation[move.edgesPermutation[i]]

        return new CubeState(cornersPermutation, edgesPermutation)

class Square1Solver
    
    N_CORNERS_PERMUTATIONS: 40320
    N_CORNERS_COMBINATIONS: 70
    N_EDGES_PERMUTATIONS: 40320
    N_EDGES_COMBINATIONS: 70

    constructor: ->
        @initialized = false
    
    ###
    private State[] moves1
    private ArrayList<State> shapes
    private HashMap<Integer, Integer> evenShapeDistance
    private HashMap<Integer, Integer> oddShapeDistance

    private CubeState[] moves2
    private int[][] cornersPermutationMove
    private int[][] cornersCombinationMove
    private int[][] edgesPermutationMove
    private int[][] edgesCombinationMove
    private byte[][] cornersDistance
    private byte[][] edgesDistance
    ###

    @instance: null    

    @get: ->
        if not instance?
            instance = new @
        return instance


    initialize: ->
        
        # Phase 1

        @moves1 = makeArray(23)

        move10 = new State([
            11,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10,
            12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
        ])

        move = move10
        for i in [0..10]
            @moves1[i] = move
            move = move.multiply(move10)

        move01 = new State([
             0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11,
            13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 12,
        ])

        move = move01
        for i in [0..10]
            @moves1[11 + i] = move
            move = move.multiply(move01)

        moveTwist = new State([
             0,  1, 19, 18, 17, 16, 15, 14,  8,  9, 10, 11,
            12, 13,  7,  6,  5,  4,  3,  2, 20, 21, 22, 23,
        ])

        @moves1[22] = moveTwist

        # for i in @moves1
        #    console.log(i.permutation.toString())

        # shape tables
        @shapes = new Array()

        @evenShapeDistance = {}
        @oddShapeDistance = {}

        @evenShapeDistance[State::id.getShapeIndex()] = 0

        console.log("Identity: " + State::id.permutation)
        console.log("Identity Shape: " + State::id.getShapeIndex())

        fringe = new Array()
        fringe.push(State::id)

        iii = 0
        depth = 0
        while (fringe.length > 0)

            newFringe = new Array()
            for state in fringe
                if (state.isTwistable())
                    #console.log(state.permutation.toString())
                    @shapes.push(state)

                for i in [0..(@moves1.length-1)]
                    if !(i == 22 && !state.isTwistable())

                        next = state.multiply(@moves1[i])

                        distanceTable = null
                        if isEvenPermutation(next.getPiecesPermutation())
                            distanceTable = @evenShapeDistance
                        else
                            distanceTable = @oddShapeDistance
                        
                        #console.log("LOod: " + next.getPiecesPermutation())
                        #console.log("ROod: " + isEvenPermutation(next.getPiecesPermutation()))
                        #console.log("DOod: " + next.getShapeIndex())
                        #console.log("FOod: " + distanceTable[next.getShapeIndex()])
                        #console.log("Ood: " + (distanceTable[next.getShapeIndex()])?)
                        if !((distanceTable[next.getShapeIndex()])?)

                            distanceTable[next.getShapeIndex()] = depth + 1
                            newFringe.push(next)
                            #TODOconsole.log(next.getPiecesPermutation())
                            #TODOconsole.log(next.getShapeIndex())

            fringe = newFringe
            depth++

        console.log("Too" + @shapes[0].getPiecesPermutation())

        #console.log(@oddShapeDistance)

        # Phase 2

        # moves
        move30 =          new CubeState([3, 0, 1, 2, 4, 5, 6, 7 ], [3, 0, 1, 2, 4, 5, 6, 7 ])
        move03 =          new CubeState([0, 1, 2, 3, 5, 6, 7, 4 ], [0, 1, 2, 3, 5, 6, 7, 4 ])
        moveTwistTop =    new CubeState([0, 6, 5, 3, 4, 2, 1, 7 ], [6, 5, 2, 3, 4, 1, 0, 7 ])
        moveTwistBottom = new CubeState([0, 6, 5, 3, 4, 2, 1, 7 ], [0, 5, 4, 3, 2, 1, 6, 7 ])

        @moves2 = [
            move30,
            move30.multiply(move30),
            move30.multiply(move30).multiply(move30),
            move03,
            move03.multiply(move03),
            move03.multiply(move03).multiply(move03),
            moveTwistTop,
            moveTwistBottom,
        ]

        

        # move tables
        @cornersPermutationMove = make2DArray(@N_CORNERS_PERMUTATIONS, @moves2.length)

        for i in [0..(@N_CORNERS_PERMUTATIONS-1)]
            state = new CubeState(IndexMapping::indexToPermutation(i, 8), makeArrayZeroed(8))
            for j in [0..(@moves2.length-1)]
        
                @cornersPermutationMove[i][j] = IndexMapping::permutationToIndex(state.multiply(@moves2[j]).cornersPermutation)
                #logFirst100("ST: " + JSON.stringify(state.multiply(@moves2[j])) + ", " + @cornersPermutationMove[i][j])


        @cornersCombinationMove = make2DArray(@N_CORNERS_COMBINATIONS, @moves2.length)

        for i in [0..(@N_CORNERS_COMBINATIONS-1)]
            combination = IndexMapping::indexToCombination(i, 4, 8)

            corners = makeArray(8)
            nextTop = 0
            nextBottom = 4

            for j in [0..(corners.length-1)]
                if (combination[j])
                    corners[j] = nextTop++
                else
                    corners[j] = nextBottom++

            state = new CubeState(corners, makeArray(8))
            for j in [0..(@moves2.length-1)]
                result = state.multiply(@moves2[j])

                isTopCorner = makeArray(8); # boolean[]
                for k in [0..(isTopCorner.length-1)]
                    isTopCorner[k] = result.cornersPermutation[k] < 4

                @cornersCombinationMove[i][j] = IndexMapping::combinationToIndex(isTopCorner, 4)

        @edgesPermutationMove = make2DArray(@N_EDGES_PERMUTATIONS, @moves2.length)

        for i in [0..(@N_EDGES_PERMUTATIONS-1)]
            state = new CubeState(makeArrayZeroed(8), IndexMapping::indexToPermutation(i, 8))
            for j in [0..(@moves2.length-1)]
        
                @edgesPermutationMove[i][j] = IndexMapping::permutationToIndex(state.multiply(@moves2[j]).edgesPermutation)



        @edgesCombinationMove = make2DArray(@N_EDGES_COMBINATIONS, @moves2.length)

        for i in [0..(@N_EDGES_COMBINATIONS-1)]
            combination = IndexMapping::indexToCombination(i, 4, 8)

            edges = makeArray(8)
            nextTop = 0
            nextBottom = 4

            for j in [0..(8-1)]
                if (combination[j])
                    edges[j] = nextTop++
                else
                    edges[j] = nextBottom++

            state = new CubeState(makeArray(8), edges)
            for j in [0..(@moves2.length-1)]
                result = state.multiply(@moves2[j])

                isTopEdge = makeArray(8)
                for k in [0..(isTopEdge.length-1)]
                    isTopEdge[k] = result.edgesPermutation[k] < 4

                @edgesCombinationMove[i][j] = IndexMapping::combinationToIndex(isTopEdge, 4)


        # prune tables
        @cornersDistance = make2DArray(@N_CORNERS_PERMUTATIONS, @N_EDGES_COMBINATIONS)
        for i in [0..(@N_CORNERS_PERMUTATIONS-1)]
            for j in [0..(@N_EDGES_COMBINATIONS-1)]
                @cornersDistance[i][j] = -1
        @cornersDistance[0][0] = 0

        while (true)
            nVisited = 0

            for i in [0..(@N_CORNERS_PERMUTATIONS-1)]
                for j in [0..(@N_EDGES_COMBINATIONS-1)]
                    if (@cornersDistance[i][j] == depth)
                        for k in [0..(@moves2.length-1)]
                            nextCornerPermutation = @cornersPermutationMove[i][k]
                            nextEdgeCombination = @edgesCombinationMove[j][k]
                            if (@cornersDistance[nextCornerPermutation][nextEdgeCombination] < 0)
                                con
                                @cornersDistance[nextCornerPermutation][nextEdgeCombination] = depth + 1 #TODO: casting
                                nVisited++

            depth++
            if !(nVisited > 0)
                break


        @edgesDistance = make2DArray(@N_EDGES_PERMUTATIONS, @N_CORNERS_COMBINATIONS)
        for i in [0..(@N_EDGES_PERMUTATIONS-1)]
            for j in [0..(@N_CORNERS_COMBINATIONS-1)]
                @edgesDistance[i][j] = -1
        @edgesDistance[0][0] = 0

        depth = 0
        while (true)
            nVisited = 0

            for i in [0..(@N_EDGES_PERMUTATIONS-1)]
                for j in [0..(@N_CORNERS_COMBINATIONS-1)]
                    if (@edgesDistance[i][j] == depth)
                        for k in [0..(@moves2.length-1)]
                            nextEdgesPermutation = @edgesPermutationMove[i][k]
                            nextCornersCombination = @cornersCombinationMove[j][k]
                            #console.log("RR: " + i, j, k, nextEdgesPermutation, nextCornersCombination, (depth+1))
                            if (@edgesDistance[nextEdgesPermutation][nextCornersCombination] < 0)
                                @edgesDistance[nextEdgesPermutation][nextCornersCombination] = depth + 1 #TODO: casting
                                nVisited++

            depth++
            if !(nVisited > 0)
                break

        #console.log(@oddShapeDistance)

        @initialized = true


    solve: (state) ->
        sequence = new Array()

        top = 0
        bottom = 0
        for moveIndex in @solution(state)
            if (moveIndex < 11)
                top += moveIndex + 1
                top %= 12
            else if (moveIndex < 22)
                bottom += (moveIndex - 11) + 1
                bottom %= 12
            else
                if (top != 0 || bottom != 0)
                    if (top > 6)
                        top = -(12 - top)
                    if (bottom > 6)
                        bottom = -(12 - bottom)
                    sequence.push("(" + top + ", ", bottom + ")")
                    top = 0
                    bottom = 0
                sequence.push("/")

        if (top != 0 || bottom != 0)
            if (top > 6)
                top = -(12 - top)
            if (bottom > 6)
                bottom = -(12 - bottom)

            sequence.push("(" + top + ", ", bottom + ")")

        return sequence
    
    generate: (state) ->
        
        sequence = new Array()

        top = 0
        bottom = 0
        solution = @solution(state)
        for i in [(solution.length - 1)..0]
            if (solution[i] < 11)
                top += 12 - (solution[i] + 1)
                top %= 12
            else if (solution[i] < 22)
                bottom += 12 - ((solution[i] - 11) + 1)
                bottom %= 12
            else
                if (top != 0 || bottom != 0)
                    if (top > 6)
                        top = -(12 - top)
                    if (bottom > 6)
                        bottom = -(12 - bottom)
                    sequence.push("(" + top + ", ", bottom + ")")
                    top = 0
                    bottom = 0
                sequence.push("/")

        if (top != 0 || bottom != 0)
            if (top > 6)
                top = -(12 - top)
            if (bottom > 6)
                bottom = -(12 - bottom)
            sequence.push("(" + top + ", ", bottom + ")")

        return sequence

    solution: (state) ->

        console.log(state.getPiecesPermutation())

        if (!@initialized)
            @initialize()

        #console.log("111")

        depth = 0
        while (true)

            #console.log("222")
            solution1 = new Array()
            solution2 = new Array()
            if (@search(state, isEvenPermutation(state.getPiecesPermutation()), depth, solution1, solution2))
                console.log("555")
                sequence = new Array()
                for moveIndex in solution1
                    sequence.push(moveIndex)

                phase2MoveMapping = [
                    [  2 ],
                    [  5 ],
                    [  8 ],
                    [ 13 ],
                    [ 16 ],
                    [ 19 ],
                    [  0, 22, 10 ],
                    [ 21, 22, 11 ]
                ]

                for moveIndex in solution2
                    for phase1MoveIndex in phase2MoveMapping[moveIndex]
                        sequence.push(phase1MoveIndex)

                return sequence
            
            depth++
            #console.log("Depth: " + depth)
            if depth > 300
                return 4/0

            #console.log("444")
    
    search: (state, stateIsEvenPermutation, depth, solution1, solution2) ->

        #if (++ss1 % 10 == 0)
            #console.log("Search: " + ss1, state.getShapeIndex())

        #console.log("333")
        if (depth == 0)
            #console.log("Depth 0, " + state.permutation, stateIsEvenPermutation, state.getShapeIndex(),  State::id.getShapeIndex())
            if (stateIsEvenPermutation && (state.getShapeIndex() == State::id.getShapeIndex()))
                #console.log("AAA")
                sequence2 = @solution2(state.toCubeState(), 17)
                if (sequence2 != null)
                    for m in sequence2
                        solution2.push(m)
                    return true
            return false
        

        #console.log("666")
        #console.log(state)
        # console.log(state.getShapeIndex())
        # console.log(stateIsEvenPermutation)

        #console.log(@initialized)
        #console.log(@evenShapeDistance)


        distance = null
        if stateIsEvenPermutation
            distance = @evenShapeDistance[state.getShapeIndex()]
        else
            distance = @oddShapeDistance[state.getShapeIndex()]

        if (distance <= depth)
            for i in [0..(@moves1.length-1)]
                if !(i == 22 && !state.isTwistable())
                    next = state.multiply(@moves1[i])

                    solution1.push(i)
                    if (@search(next, isEvenPermutation(next.getPiecesPermutation()), depth - 1, solution1, solution2))
                        return true
                    solution1.length -= 1
        return false



    # private int[] solution2(CubeState state, int maxDepth) {
    solution2: (state, maxDepth) ->

        cornersPermutation = IndexMapping::permutationToIndex(state.cornersPermutation);

        isTopCorner = makeArray(8);
        for k in [0..(isTopCorner.length-1)]
            isTopCorner[k] = state.cornersPermutation[k] < 4
        cornersCombination = IndexMapping::combinationToIndex(isTopCorner, 4)

        edgesPermutation = IndexMapping::permutationToIndex(state.edgesPermutation)

        isTopEdge = makeArray(8);
        for k in [0..(isTopEdge.length-1)]
            isTopEdge[k] = state.edgesPermutation[k] < 4

        edgesCombination = IndexMapping::combinationToIndex(isTopEdge, 4)

        for depth in [0..(maxDepth)]
            solution = makeArrayZeroed(depth)

            #console.log("Oink: " + cornersPermutation, cornersCombination, edgesPermutation, edgesCombination, depth, solution)

            if (@search2(cornersPermutation, cornersCombination, edgesPermutation, edgesCombination, depth, solution))
                return solution

        return null

    search2: (cornersPermutation, cornersCombination, edgesPermutation, edgesCombination, depth, solution) ->

        ss2++
        #if (ss2 < 10)
            #console.log("Search 2: " + ss2, cornersPermutation, cornersCombination, edgesPermutation, edgesCombination, depth, solution)

        if (depth == 0)
            return (cornersPermutation == 0) && (edgesPermutation == 0)

        #console.log(999)

        #console.log("Fi: " + depth, (@cornersDistance[cornersPermutation][edgesCombination]), (@edgesDistance[edgesPermutation][cornersCombination]))

        if ((@cornersDistance[cornersPermutation][edgesCombination] <= depth) && (@edgesDistance[edgesPermutation][cornersCombination] <= depth))
            for i in [0..(@moves2.length-1)]
                if !((solution.length - depth - 1 >= 0) && (Math.floor(solution[solution.length - depth - 1] / 3) == Math.floor(i / 3)))
                    solution[solution.length - depth] = i
                    if (@search2(@cornersPermutationMove[cornersPermutation][i], @cornersCombinationMove[cornersCombination][i], @edgesPermutationMove[edgesPermutation][i], @edgesCombinationMove[edgesCombination][i], depth - 1, solution))
                        return true

        return false
    
    getRandomState: () ->

        if (!@initialized)
            @initialize()

        #console.log("Goo: " + @shapes.length)
        shape = @shapes[randomIntBelow(@shapes.length)]
        cornersPermutation = IndexMapping::indexToPermutation(randomIntBelow(@N_CORNERS_PERMUTATIONS), 8)
        edgesPermutation = IndexMapping::indexToPermutation(randomIntBelow(@N_EDGES_PERMUTATIONS), 8)

        permutation = makeArray(shape.permutation.length)
        for i in [0..(permutation.length-1)]
            if (shape.permutation[i] < 8)
                permutation[i] = cornersPermutation[shape.permutation[i]]
            else
                permutation[i] = 8 + edgesPermutation[shape.permutation[i] - 8]

        #console.log(permutation)
        #console.log(permutation.length)
        return new State(permutation)

randomIntBelow = (n) ->
    return Math.floor(Math.random()*n)
    #TODO
    #console.log(Math.floor(n/5))
    #return Math.floor(n/5)

# private boolean isEvenPermutation(byte[] permutation) {
isEvenPermutation = (permutation) -> 
    nInversions = 0
    for i in [0..(permutation.length-1)]
        for j in [(i+1)..(permutation.length-1)]
            if (permutation[i] > permutation[j])
                nInversions++

    return nInversions % 2 == 0

b = State::id
console.log("Identity is twistable: " + b.isTwistable())
#console.log(b.toCubeState())
for i in 5
    console.log(4)
f = new Square1Solver
f.initialize()
console.log("Initialized " + f.shapes.length + " shapes.")
rs = f.getRandomState()
#console.log(rs)
document.write(f.generate(rs).join(""))
document.write(f.generate(rs).join(""))
document.write(f.generate(rs).join(""))
document.write(f.generate(rs).join(""))
document.write(f.generate(rs).join(""))
document.write(f.generate(rs).join(""))
document.write(f.generate(rs).join(""))
document.write(f.generate(rs).join(""))
document.write(f.generate(rs).join(""))
document.write(f.generate(rs).join(""))
document.write(f.generate(rs).join(""))
document.write(f.generate(rs).join(""))
document.write(f.generate(rs).join(""))