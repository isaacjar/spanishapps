// game.js

/* =========================
   NORMALIZACIÓN CENTRAL
========================= */
function normalize(str) {return str.normalize("NFD").replace(/([^\u00F1\u00D1])[\u0300-\u036f]/g, "$1").toUpperCase();}

/* =========================
   LÓGICA DEL JUEGO
========================= */
const Game={
  init(words,valid,numLetters,attempts){
    this.words=words||[];
    this.valid=(valid||[]).map(normalize);
    this.numLetters=Number(numLetters);
    this.attempts=Number(attempts);
    this.last=null;
    this.reset();
    if(!localStorage.getItem("stats")) localStorage.setItem("stats",JSON.stringify({played:0,won:0}));
  },
  reset(){
    if(!this.words.length) return;
    do{this.solution=this.words[Math.floor(Math.random()*this.words.length)];}while(this.solution===this.last&&this.words.length>1);
    this.last=this.solution;
    console.log("📝 ",this.solution);
    this.row=0;
    this.col=0;
    this.finished=false;
    this.grid=Array.from({length:this.attempts},()=>Array(this.numLetters).fill(""));
  },
  resetWord(){
    this.reset();
    if(window.UI){UI.renderBoard(this.attempts,this.numLetters);UI.updateBoard();}
  },
  inputLetter(letter){if(this.finished||this.col>=this.numLetters)return;this.grid[this.row][this.col]=letter;this.col++;},
  backspace(){if(this.finished||this.col===0)return;this.col--;this.grid[this.row][this.col]="";},
  submit(){
    if(this.finished) return "finished";
    if(this.col<this.numLetters) return "short";
    const word=this.grid[this.row].join("");
    if(!this.valid.includes(normalize(word))) return "invalid";
    const result=this.check(word);
    // Victoria
    if(normalize(word)===normalize(this.solution)){
      this.finished=true;
      const stats=JSON.parse(localStorage.getItem("stats")||'{"played":0,"won":0}');
      stats.played++;stats.won++;localStorage.setItem("stats",JSON.stringify(stats));
    }else if(this.row+1>=this.attempts){
      this.finished=true;
      const stats=JSON.parse(localStorage.getItem("stats")||'{"played":0,"won":0}');
      stats.played++;localStorage.setItem("stats",JSON.stringify(stats));
    }
    return result;
  },
  check(word){
    const sol=normalize(this.solution).split("");
    const guess=normalize(word).split("");
    const res=Array(this.numLetters).fill("absent");
    const counts={};
    sol.forEach(l=>counts[l]=(counts[l]||0)+1);
    guess.forEach((l,i)=>{if(l===sol[i]){res[i]="correct";counts[l]--;}})
    guess.forEach((l,i)=>{if(res[i]==="correct")return;if(counts[l]>0){res[i]="present";counts[l]--;}})
    return res;
  }
};

window.Game=Game;
window.normalize=normalize;
