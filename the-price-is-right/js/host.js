function Player(name, conn) {
  this.name = name;
  this.conn = conn;
  this.score = 0;
}

var app = new Vue({
  el: '#app',
  data: {
    peer: new Peer({host: "peer.rishk.me", path: '/', secure: true}),
    players: {},
    started: false
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
      this.sendLeaderboard();
    },
    broadcast(type, payload) {
      Object.entries(this.players).forEach(([_, player]) => {
        sendData(player.conn, type, payload);
      });
    },
    sendLeaderboard() {
      let payload = [];
      Object.entries(this.players).forEach(([_, player]) => {
        payload.push({'name': player.name, 'score': player.score});
      });
      payload.sort((a, b) => {
        return b.score - a.score;
      });
      this.broadcast('LEADERBOARD', payload);
    },
    handleResponse(conn, data) {
      switch (data.type) {
        case 'JOIN':
          this.addPlayer(data.payload, conn);
          break;
      }
    }
  }
});
