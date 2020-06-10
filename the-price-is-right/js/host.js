function Player(name, conn) {
  this.name = name;
  this.conn = conn;
  this.score = 0;
  this.guess = null;
  this.getDifference = function(actual) {
    return Math.abs(this.guess - actual).toFixed(2);
  }
}

function getRandomProduct() {
  return {
    name: 'Tesco Organic Fair Trade Bananas 5 Pack',
    price: 1.34,
    imageURL: 'https://img.tesco.com/Groceries/pi/148/0000003341148/IDShot_225x225.jpg'
  };
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
      this.currItem = getRandomProduct();
      this.guesses = 0;
      Object.entries(this.players).forEach(([_, player]) => {
        Vue.set(player, 'guess', null);
      });
      this.sendPlayerData();
      this.broadcast('NEW_ROUND', {name: this.currItem.name,
                                   imageURL: this.currItem.imageURL});
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
    sendPlayerData() {
      let leaderboard = [];
      Object.entries(this.players).forEach(([_, player]) => {
        leaderboard.push({name:  player.name,
                          score: player.score,
                          guess: player.guess});
      });
      leaderboard.sort((a, b) => {
        return b.score - a.score;
      });
      this.broadcast('PLAYERS', leaderboard);
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
