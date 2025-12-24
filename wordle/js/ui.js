// ui.js

const UI = {
  renderBoard(rows, cols) {
    const board = document.getElementById("board");
    board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    board.innerHTML = "";
    for (let r = 0; r < rows; r++) {
      const row = document.createElement("div");
      row.className = "row";
      row.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      for (let c = 0; c < cols; c++) {
        row.appendChild(document.createElement("div")).className = "cell";
      }
      board.appendChild(row);
    }
  },

  toast(msg) {
    const box = document.getElementById("messageBox");
    box.textContent = msg;
  }
};
