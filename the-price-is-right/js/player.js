const HOST_ID = window.location.href.split("host=")[1];

const State = {
  CONNECTING: 0,
  JOINING:    1,
  JOINED:     2,
  NEW_ROUND:  3,
  SUBMITTED:  4
}

var app = new Vue({
  el: '#app',
  data: {
    peer: new Peer({host: "peer.rishk.me", path: '/', secure: true}),
    conn: null,
    state: State.CONNECTING,
    players: [],
    currItem: {}
  },
  created() {
    this.peer.on('open', function(id) {
      app.conn = app.peer.connect(HOST_ID);
      app.conn.on('open', function() {
        app.state = State.JOINING;
      });
      app.conn.on('data', function(data) {
        app.handleResponse(data);
      });
    });
  },
  methods: {
    joinGame(e) {
      e.preventDefault();

      let name = document.getElementById("nameInput").value.trim();
      sendData(this.conn, 'JOIN', name);
    },
    newRound(item) {
      if (this.state == State.SUBMITTED) {
        this.$refs.priceForm.reset();
      }
      this.state = State.NEW_ROUND;
      this.currItem = item;
    },
    started() {
      return this.state == State.NEW_ROUND || this.state == State.SUBMITTED;
    },
    submitGuess(e) {
      e.preventDefault();
      let priceRegex = /^[0-9]+(\.[0-9][0-9])?$/;
      let guess = document.getElementById('priceInput').value;
      if (!guess.match(priceRegex)) {
        alert("Please enter a valid price.");
        return;
      }
      sendData(this.conn, 'GUESS', parseFloat(guess));
      this.state = State.SUBMITTED;
    },
    handleResponse(data) {
      switch (data.type) {
        case 'PLAYERS':
          this.players = data.payload;
          break;
        case 'JOINED':
          this.state = State.JOINED;
          break;
        case 'NEW_ROUND':
          this.newRound(data.payload);
          break;
        case 'ANSWER':
          Vue.set(this.currItem, 'price', data.payload);
          break;
        case 'ERROR':
          alert(data.payload);
          break;
      }
    }
  }
});
