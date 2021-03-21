import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

// 组件中没有state属性，只包含一个render方法，则可以用函数的形式来写这个组件
// 该函数接受一个props参数，表示父组件传递过来的参数对象
function Square(props) {
  return (
    // 在写组件的模板过程中如果需要嵌入JS代码，则需要用一对{}将JS代码包起来
    // 补充：上条注释有误，经过实践，JS代码并不能在{}中直接使用，暂时不清楚详细用法
    // 此处的onClick由于是写在真实的DOM元素上的，因而代表真实的DOM事件
    // 如需向模板添加类名，则需要使用className=value的方式添加，而不是class=value
    // 如需绑定多个class类名，其中有部分根据变量而定，则可使用es6的模板字符串写法
    <button
      className={`square ${props.isWinnerPiece ? "winner-piece" : ""}`}
      onClick={props.onClick}
    >
      {props.value}
    </button>
  );
}

// 如果组件中不只包含render函数，则使用class方式来写这个组件
// 此时组件中用this.props表示父组件传递过来的参数对象
class Board extends React.Component {
  renderSquare(i) {
    // 自定义方法之一，返回一个模板
    // 向子组件传递参数时，只需在子组件上以“[propName]=propValue”的形式写上即可
    // 父组件不仅能向子组件传递数据，还能传递方法
    // 这里的onClick只是一个变量名，不代表真实的事件
    /* 为了避免函数被立即调用，并且如果函数定义时内部使用了this，
     * 那么最好在绑定事件时将该函数用箭头函数包裹并返回
     */
    return (
      <Square
        key={i}
        isWinnerPiece={this.props.winnerPiece.indexOf(i) > -1}
        value={this.props.squares[i]}
        onClick={() => this.props.onClick(i)}
      />
    );
  }
  renderLine(n) {
    let line = [];
    for (let i = 0; i < 3; i++) {
      line = line.concat(this.renderSquare(n * 3 + i));
    }
    return (
      <div className="status" key={n}>
        {line}
      </div>
    );
  }
  render() {
    let board = [];
    let i = 0;
    while (i < 3) {
      board = board.concat(this.renderLine(i));
      i++;
    }
    return (
      //在生成模板时，可以使用函数返回另一个模板的方式生成主要需要的模板
      <div>
        <div className="status">{this.props.status}</div>
        {/* <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div> */}
        {/* 循环形式 */}
        {board}
      </div>
    );
  }
}

class Game extends React.Component {
  //如果组件中存在state，则需要在constructor中书写对应的state，并且在之前需要调用super()
  constructor(props) {
    super(props);
    this.state = {
      history: [
        {
          squares: Array(9).fill(null),
          stepPosition: undefined,
          winnerPiece: Array(3).fill(undefined),
        },
      ],
      xIsNext: true,
      stepNumber: 0,
      isAscendingOrder: true,
    };
  }
  jumpTo(step) {
    /*
     * 使用this.setState({[propName]:propValue})的方式修改state中的数据，
     * 而不是直接使用this.state.propName=propValue的方式修改
     * 注意：不能在render方法中使用setState
     */
    this.setState({
      stepNumber: step,
      xIsNext: step % 2 === 0,
    });
  }
  handleClick(i) {
    /*
     * 在修改state中的引用数据时，不建议直接在原对象上直接修改，
     * 而是先创建一个需要修改的对象的副本，并用修改后的副本替换原对象
     */
    // 在需要修改对象前，应首先创建好该对象的副本
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    // 创建副本
    const current = history[history.length - 1];
    // console.log(history === this.state.history)  //false
    // console.log(current === this.state.history[this.state.history.length - 1]) //true
    const squares = current.squares.slice();
    const winner = calculateWinner(squares);
    if (winner || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? "X" : "O";
    // 下完棋子后立即检查是否有winner产生
    const updatedWinner = calculateWinner(squares)
    this.setState({
      // concat并不会修改原数组，因而推荐使用concat而不是push
      history: history.concat([
        {
          squares,
          stepPosition: `(${Math.ceil((i + 1) / 3)},${(i % 3) + 1})`,
          // 如果有winner产生则记录对应winner的棋子位置
          winnerPiece: updatedWinner ? updatedWinner[1] : Array(3).fill(undefined)
        },
      ]),
      xIsNext: !this.state.xIsNext,
      stepNumber: history.length,
    });
  }
  changeHistoryRenderOrder() {
    // console.log(this)
    this.setState({
      isAscendingOrder: !this.state.isAscendingOrder,
    });
  }
  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = calculateWinner(current.squares);

    // const moves = history.map((step, move) => {
    //   const desc = move
    //     ? `Go to move# ${move}:${step.stepPosition}`
    //     : "Go to game start";
    //   return (
    //     <li key={move}>
    //       <button
    //         className={move === this.state.stepNumber ? "history-selected" : ""}
    //         onClick={() => this.jumpTo(move)}
    //       >
    //         {desc}
    //       </button>
    //     </li>
    //   );
    // });
    let moves = [];
    history.forEach((step, move) => {
      const desc = move
        ? `Go to move# ${move}:${step.stepPosition}`
        : "Go to game start";
      let curr = (
        <li key={move}>
          <button
            className={move === this.state.stepNumber ? "history-selected" : ""}
            onClick={() => this.jumpTo(move)}
          >
            {desc}
          </button>
        </li>
      );
      if (this.state.isAscendingOrder) {
        moves = moves.concat(curr);
      } else {
        moves = [curr].concat(moves);
      }
    });

    let status;
    if (winner) {
      status = `Winner: ${winner[0]}`;
    } else {
      if(this.state.stepNumber === 9){
        status = '平局'
      }else{
        status = `Next player: ${this.state.xIsNext ? "X" : "O"}`;
      }
    }
    return (
      <div className="game">
        <div className="game-board">
          <Board
            winnerPiece={this.state.history[this.state.stepNumber].winnerPiece}
            squares={current.squares}
            onClick={(i) => this.handleClick(i)}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <button onClick={() => this.changeHistoryRenderOrder()}>
            {this.state.isAscendingOrder ? "升序" : "降序"}
          </button>
          <ol>{moves}</ol>
        </div>
      </div>
    );
  }
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      // 当有winner产生时，同时返回对应位置
      return [squares[a], [a, b, c]];
    }
  }
  return null;
}

ReactDOM.render(<Game />, document.getElementById("root"));

// ========================================
// 新增功能（已实现）
/* [√] 在游戏历史记录列表显示每一步棋的坐标，格式为 (列号, 行号)。
 *  实现：1.在history每一步中定义一个变量保存当前这步棋子的位置
 *       2.根据点击棋盘的位置计算点击的坐标，并保存到对应参数
 *       3.根据history渲染
 */
/* [√] 在历史记录列表中加粗显示当前选择的项目。
 *  实现：1.下棋时默认选择最后一项，查看历史时选择点击项
 *       2.根据stepNumber判断当前进行到的或选择的第几步
 *       3.赋予对应的css类名
 */
/* [√]3.使用两个循环来渲染出棋盘的格子，而不是在代码里写死（hardcode）。
 *  实现：思路简单，只需注意几个注意事项：
 *       1.使用key标识每个部件
 *       2.经过实践发现{}中并不能直接使用JS代码
 */
/* [√]4.添加一个可以升序或降序显示历史记录的按钮。
 *  实现：1.定义一个变量表示渲染历史记录时的顺序
 *       2.用新建的按钮绑定相应事件修改这个变量
 *       3.根据该变量渲染
 */
/* [√]5.每当有人获胜时，高亮显示连成一线的 3 颗棋子。
 *  实现：1.在检查winner的函数中如果有winner产生，返回winner的棋子位置，用一个变量保存该位置
 *       2.渲染时根据是否有winner以及winner的棋子渲染对应的样式
 *       3.为了实现“时间旅行功能”，保存棋子的变量最好设置在history中
 */
/* [√]6.当无人获胜时，显示一个平局的消息。
 *  实现：1.当步数为9但是仍然没有产生赢家，则为平局
 */