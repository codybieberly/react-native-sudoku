import React, { Component } from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    TextInput,
    View,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import Dimensions from 'Dimensions';
const { width } = Dimensions.get('window');
const difficulty = 0.5; // map this to state value to create different difficulties based on user setting

export default class Sudoku extends Component {
    constructor(props) {
        super(props);
        this.state = {
            valMatrix: {},
            answerGenerated: false,
            showClear: true,
            answers: [],
            errorText: '',
        };
        this.buildCacheMatrix = this.buildCacheMatrix.bind(this);
        this.resetBoard = this.resetBoard.bind(this);
        this.onChangeText = this.onChangeText.bind(this);
        this.inputVal = this.inputVal.bind(this);
        this.getValidInputs = this.getValidInputs.bind(this);
        this.findInvalidInput = this.findInvalidInput.bind(this);
        this.getRandomInt = this.getRandomInt.bind(this);
        this.validateRow = this.validateRow.bind(this);
        this.validateCol = this.validateCol.bind(this);
        this.validateSect = this.validateSect.bind(this);
        this.validateInput = this.validateInput.bind(this);
        this.getBoard = this.getBoard.bind(this);
        this.getSolvedBoard = this.getSolvedBoard.bind(this);
        this.solve = this.solve.bind(this);
        this.newGame = this.newGame.bind(this);
        this.getHint = this.getHint.bind(this);
        this.solveBoard = this.solveBoard.bind(this);
        this.getNextKey = this.getNextKey.bind(this);
        this.generateAnswers = this.generateAnswers.bind(this);
        this.renderBlock = this.renderBlock.bind(this);
        this.renderColumns = this.renderColumns.bind(this);
        this.renderRow = this.renderRow.bind(this);
        this.renderBoard = this.renderBoard.bind(this);
    }

    componentWillMount() {
        this.buildCacheMatrix();
        this.generateAnswers(0, 0);
    }

    buildCacheMatrix() {
        this.matrix = { 'row': {}, 'col': {}, 'sect': {} };

        // row/col cache matrix
        for ( let i = 0; i < 9; i++ ) {
            this.matrix.row[i] = [];
            this.matrix.col[i] = [];
        }

        // section matrix
        for ( let row = 0; row < 3; row++ ) {
            this.matrix.sect[row] = [];
            for ( let col = 0; col < 3; col++ ) {
                this.matrix.sect[row][col] = [];
            }
        }
    }

    resetBoard() {
        let valMatrix = {};
        this.buildCacheMatrix();
        for ( let row = 0; row < 9; row++ ) {
            for ( let col = 0; col < 9; col++ ) {
                let stateKey = row + '-' + col;
                valMatrix[stateKey] = '';
            }
        }
        this.setState({valMatrix, answerGenerated: false, showClear: false, errorText: ''});
    }

    onChangeText(key, val) {
        let { board } = this.getBoard(),
            row = key.charAt(0),
            col = key.charAt(2),
            valMatrix = this.state.valMatrix,
            sectRow = Math.floor(row / 3),
            sectCol = Math.floor(col / 3),
            color = 'white';
        if ((sectRow + sectCol) % 2 === 0) color = 'lightgrey';
        valMatrix[key] = val;
        this.setState({valMatrix, showClear: true});

        // validate user's input here, if wrong, turn block red
        if (!this.validateInput(board, row, col, parseInt(val))) color = 'red';
        this.refs[key].setNativeProps({style: {backgroundColor: color}});
    }

    inputVal(val, row, col) {
        let valMatrix = this.state.valMatrix,
            key = row.toString() + '-' + col.toString();
        if (!val) val = '';
        valMatrix[key] = val.toString();
        this.setState({valMatrix});
    }

    getValidInputs(row, col) {
        let val,
            validNums = [1, 2, 3, 4, 5, 6, 7, 8, 9],
            sectRow = Math.floor( row / 3 ),
            sectCol = Math.floor( col / 3 );

        // remove existing numbers from current column
        for (let i = 0; i < 9; i++) {
            val = parseInt(this.matrix.col[col][i]);
            if (val > 0) {
                if (validNums.indexOf(val) > -1) {
                    validNums.splice(validNums.indexOf(val), 1);
                }
            }
        }

        // remove existing numbers from current row
        for (let i = 0; i < 9; i++) {
            val = parseInt(this.matrix.row[row][i]);
            if (val > 0) {
                if (validNums.indexOf(val) > -1) {
                    validNums.splice(validNums.indexOf(val), 1);
                }
            }
        }

        // remove existing numbers from current section
        for (let i = 0; i < 9; i++) {
            val = parseInt(this.matrix.sect[sectRow][sectCol][i]);
            if (val > 0) {
                if (validNums.indexOf(val) > -1) {
                    validNums.splice(validNums.indexOf(val), 1);
                }
            }
        }

        // shuffle order that inputs are chosen
        for (let i = validNums.length - 1; i > 0; i--) {
            let rand = this.getRandomInt(0, i),
                temp = validNums[i];
            validNums[i] = validNums[rand];
            validNums[rand] = temp;
        }

        return validNums;
    }

    findInvalidInput() {
        // let solvedBoard = this.getSolvedBoard();
        if (this.state.answerGenerated) {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    let key = row + '-' + col;
                    if (this.state.valMatrix[key] && this.state.valMatrix[key] !== this.matrix.row[row][col]) {
                        console.log('invalid val!!! @ ' + key);
                    }
                }
            }
        }
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max + 1)) + min;
    }

    validateRow(board, row, val) {
        for (let i = 0; i < board[row].length; i++) {
            // invalid input
            if(board[row][i] === val) {
                return false;
            }
        }
        // validated
        return true;
    }

    validateCol(board, col, val) {
        for (let i = 0; i < board.length; i++) {
            // invalid input
            if(board[i][col] === val) {
                return false;
            }
        }
        // validated
        return true;
    }

    validateSect(board, row, col, val) {
        let colCorner = 0,
            rowCorner = 0,
            squareSize = 3;

        // find first col
        while(col >= colCorner + squareSize) {
            colCorner += squareSize;
        }

        // find first row
        while(row >= rowCorner + squareSize) {
            rowCorner += squareSize;
        }

        // loop over rows
        for (let i = rowCorner; i < rowCorner + squareSize; i++) {
            // loop over cols
            for (let j = colCorner; j < colCorner + squareSize; j++) {
                // invalid input
                if(board[i][j] === val) {
                    return false;
                }
            }
        }
        // validated
        return true;
    }

    validateInput(board, row, col, val) {
        if(this.validateRow(board, row, val) &&
            this.validateCol(board, col, val) &&
            this.validateSect(board, row, col, val)) {
            return true;
        } else {
            return false;
        }
    }

    getBoard() {
        let emptyPositions = [],
            board = [];

        // loop over blocks, build array of rows and array of empty coordinate keys
        for (let i = 0; i < 9; i++) {
            let row = [];
            for (let j = 0; j < 9; j++) {
                let key = i.toString() + '-' + j.toString();
                // if block already has value, use it, otherwise insert 0 and add key to emptyPosition array
                if (this.state.valMatrix[key]) {
                    row.push(parseInt(this.state.valMatrix[key]));
                } else {
                    row.push(0);
                    emptyPositions.push(key);
                }
            }
            board.push(row);
        }

        return { board, emptyPositions };
    }

    getSolvedBoard() {
        let { board, emptyPositions } = this.getBoard(),
            limit = 9,
            row, col, val, found;
        for (let i = 0; i < emptyPositions.length;) {
            if (!emptyPositions[i]) {
                // TODO: find unsolvable puzzle for testing
                // unsolvable puzzle. find invalid block here.
                // this.findInvalidInput();
                this.setState({errorText: 'Invalid puzzle. Remove inputs.'});
                break;
            }
            row = parseInt(emptyPositions[i].charAt(0));
            col = parseInt(emptyPositions[i].charAt(2));
            // iterate
            val = board[row][col] + 1;
            found = false;
            // try, try again
            while(!found && val <= limit) {
                // if valid input, set and move on
                if(this.validateInput(board, row, col, val)) {
                    found = true;
                    board[row][col] = val;
                    i++;
                } else {
                    // next
                    val++;
                }
            }
            // reset val and backtrack
            if(!found) {
                board[row][col] = 0;
                i--;
            }
        }
        return board;
    }

    solve() {
        if (this.state.answerGenerated) {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (this.matrix.row[row][col]) this.inputVal(this.matrix.row[row][col], row, col);
                }
            }
        } else {
            const board = this.getSolvedBoard();
            this.solveBoard(board);
        }
    }

    newGame() {
        this.generateAnswers(0, 0);
        this.setState({showClear: true});
    }

    getHint() {
        const { emptyPositions } = this.getBoard();
        let emptyKey, row, col, val;
        if (emptyPositions.length) {
            emptyKey = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
            row = parseInt(emptyKey.charAt(0));
            col = parseInt(emptyKey.charAt(2));
        }
        if (this.state.answerGenerated) {
            val = this.matrix.row[row][col];
        } else {
            const solvedBoard = this.getSolvedBoard();
            val = solvedBoard[row][col];
        }
        if (val) this.inputVal(val, row, col);
    }

    solveBoard(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col]) this.inputVal(board[row][col], row, col);
            }
        }
        this.setState({showClear: true});
    }

    getNextKey(row, col) {
        let stepRow, stepCol;
        for (let i = (col + 9 * row); i < 81; i++) {
            stepRow = Math.floor(i / 9);
            stepCol = i % 9;
            if (!this.matrix.row[stepRow][stepCol]) {
                return stepRow + '-' + stepCol;
            }
        }
    }

    generateAnswers(row, col) {
        let blockRow, blockCol, nextKey, validInputs, sectRow, sectCol, sectIdx, nextVal;
        nextKey = this.getNextKey(row, col);

        if (!nextKey) {
            // solved
            this.setState({answerGenerated: true});
            return true;
        } else {
            blockRow = parseInt(nextKey.charAt(0));
            blockCol = parseInt(nextKey.charAt(2));
            validInputs = this.getValidInputs(blockRow, blockCol);

            // find segment
            sectRow = Math.floor( blockRow / 3 );
            sectCol = Math.floor( blockCol / 3 );
            sectIdx = (blockRow % 3) * 3 + (blockCol % 3);

            // loop over valid inputs
            for (let i = 0; i < validInputs.length; i++) {
                nextVal = validInputs[i];
                // update state
                if (Math.random() > difficulty) this.inputVal(nextVal, blockRow, blockCol);

                // update cache matrix for validation later
                this.matrix.row[blockRow][blockCol] = nextVal;
                this.matrix.col[blockCol][blockRow] = nextVal;
                this.matrix.sect[sectRow][sectCol][sectIdx] = nextVal;

                // backtrack
                if (this.generateAnswers(blockRow, blockCol)) {
                    return true;
                } else {
                    // remove from state
                    this.inputVal(0, blockRow, blockCol);
                    // remove from matrices
                    this.matrix.row[blockRow][blockCol] = '';
                    this.matrix.col[blockCol][blockRow] = '';
                    this.matrix.sect[sectRow][sectCol][sectIdx] = '';
                }
            }
        }
    }

    renderBlock(row, col) {
        let key = row + '-' + col,
            sectRow = Math.floor(row / 3),
            sectCol = Math.floor(col / 3),
            color = 'white';
        if ((sectRow + sectCol) % 2 === 0) color = 'lightgrey';
        return (
            <View key={key} style={[styles.block, {backgroundColor: color}]} ref={row + '-' + col}>
                <TextInput
                    clearTextOnFocus={true}
                    keyboardType={'numeric'}
                    style={styles.textInput}
                    maxLength={1}
                    value={this.state.valMatrix[key]}
                    onChangeText={(val) => this.onChangeText(key, val)}
                />
            </View>
        );
    }

    renderColumns(row) {
        let blocks = [];
        for ( let column = 0; column < 9; column++ ) {
            blocks.push(this.renderBlock(row, column));
        }
        return blocks;
    }

    renderRow(row) {
        return (
            <View key={row} style={{flexDirection: 'row'}}>
                {this.renderColumns(row)}
            </View>
        )
    }

    renderBoard() {
        let board = [];
        for ( let row = 0; row < 9; row++ ) {
            board.push(this.renderRow(row));
        }
        return board;
    }

    render() {
        return (
            <View style={styles.container}>
                <ScrollView scrollEnabled={false}>
                    <View style={styles.header}>
                        {this.state.showClear ?
                            <TouchableOpacity onPress={() => this.resetBoard()} style={styles.touchBox}>
                                <Text>Clear Board</Text>
                            </TouchableOpacity>
                        :
                            <TouchableOpacity onPress={() => this.newGame()} style={styles.touchBox}>
                                <Text>New Game</Text>
                            </TouchableOpacity>
                        }
                        <View style={styles.alignRight}>
                            <View style={styles.row}>
                                <TouchableOpacity onPress={() => this.getHint()} style={[styles.touchBox, {marginRight: 20}]}>
                                    <Text>Get Hint</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => this.solve()} style={styles.touchBox}>
                                    <Text>Solve</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    <View style={styles.board}>
                        {this.renderBoard()}
                    </View>
                    <Text style={styles.errorText}>{this.state.errorText}</Text>
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        width: width,
    },
    header: {
        height: 50,
        flexDirection: 'row',
    },
    board: {
        width: width,
        borderWidth: 0.5,
        borderTopWidth: 0.5,
        borderBottomWidth: 0.5
    },
    textInput: {
        paddingBottom: 4,
        height: 40,
        fontSize: 23,
        textAlign: 'center',
    },
    block: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        borderWidth: 0.5,
        height: 35,
        width: width / 9,
    },
    alignRight: {
        flexGrow: 1,
        alignItems: 'flex-end',
    },
    touchBox: {
        padding: 15,
    },
    row: {
        flexDirection: 'row',
    },
    errorText: {
        color: 'red',
        fontSize: 11,
        textAlign: 'center',
    },
});

AppRegistry.registerComponent('sudoku', () => Sudoku);
