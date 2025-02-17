const BASE_URL = "https://games.rishk.me/the-price-is-right"

function Player(name, conn) {
  this.name = name;
  this.conn = conn;
  this.score = 0;
  this.guess = null;
  this.getDifference = function(actual) {
    return parseFloat(Math.abs(this.guess - actual).toFixed(2));
  }
}

async function getRandomProduct() {
  let output = {}
  let data = await fetch("https://products.rishk.me")
  .then(res => res.json())
  .catch(err => { throw err });
  output.name = data.Name;
  output.price = parseFloat(data.Price);
  output.imageURL = data.ImageURL;
  return output;
}

function copyToClipboard(text) {
  let input_elem = document.createElement("input");
  document.body.appendChild(input_elem);
  input_elem.setAttribute("value", text);
  input_elem.select();
  document.execCommand("copy");
  document.body.removeChild(input_elem);
}

var app = new Vue({
  el: '#app',
  data: {
    peer: new Peer({host: "peer.rishk.me", path: '/', secure: true}),
    players: {},
    started: false,
    currItem: {},
    guesses: 0
  },
  created() {
    this.peer.on('connection', function(conn) {
      conn.on('open', function() {
        conn.on('data', function(data) {
          app.handleResponse(conn, data);
        });
      });
    });
  },
  methods: {
    getInviteURL() {
      return `${BASE_URL}/player?host=${this.peer.id}`;
    },
    copyInviteURL() {
      copyToClipboard(this.getInviteURL());
    },
    addPlayer(name, conn) {
      if (this.started) {
        sendData(conn, 'ERROR', 'Game has already started...');
        return;
      }

      Vue.set(this.players, conn.peer, new Player(name, conn));
      sendData(conn, 'JOINED', {});
      this.sendPlayerData();
    },
    addGuess(guess, conn) {
      let player = this.players[conn.peer];
      if (player.guess !== null) {
        // Player has already guessed.
        return;
      }

      Vue.set(player, 'guess', guess);
      this.guesses++;
      if (this.allGuessed()) {
        this.endRound();
      }
    },
    allGuessed() {
      return this.guesses == Object.keys(this.players).length;
    },
    newRound() {
      this.guesses = 0;
      Object.entries(this.players).forEach(([_, player]) => {
        Vue.set(player, 'guess', null);
      });
      this.sendPlayerData();
      getRandomProduct().then(data => {
        this.currItem = data
        this.broadcast('NEW_ROUND', {name: this.currItem.name,
                                     imageURL: this.currItem.imageURL});
      });
    },
    endRound() {
      let price = this.currItem.price;
      let bestScore = Infinity;
      Object.entries(this.players).forEach(([_, player]) => {
        bestScore = Math.min(bestScore, player.getDifference(price));
      });
      Object.entries(this.players).forEach(([_, player]) => {
        if (player.getDifference(price) == bestScore) {
          player.score++;
        }
      });
      this.sendPlayerData();
      this.broadcast('ANSWER', this.currItem.price);
    },
    broadcast(type, payload) {
      Object.entries(this.players).forEach(([_, player]) => {
        sendData(player.conn, type, payload);
      });
    },
    getLeaderboard() {
      let leaderboard = [];
      Object.entries(this.players).forEach(([_, player]) => {
        leaderboard.push({name:  player.name,
                          score: player.score,
                          guess: player.guess});
      });
      leaderboard.sort((a, b) => {
        return b.score - a.score;
      });
      return leaderboard;
    },
    sendPlayerData() {
      this.broadcast('PLAYERS', this.getLeaderboard());
    },
    handleResponse(conn, data) {
      switch (data.type) {
        case 'JOIN':
          this.addPlayer(data.payload, conn);
          break;
        case 'GUESS':
          this.addGuess(data.payload, conn);
          break;
      }
    },
    startGame() {
      this.started = true;
      this.newRound();
    }
  }
});
