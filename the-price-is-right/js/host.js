function Player(name, conn) {
  this.name = name;
  this.conn = conn;
  this.score = 0;
}

var app = new Vue({
  el: '#app',
  data: {
    peer: new Peer({host: "peer.rishk.me", port: 80, path: '/'}),
    players: {}
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
      Vue.set(this.players, conn.peer, new Player(name, conn));
      this.sendLeaderboard();
    },
    broadcast(type, payload) {
      Object.entries(this.players).forEach(([_, player]) => {
        player.conn.send({type: type, payload: payload});
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
          this.addPlayer(data.payload.name, conn);
          break;
      }
    }
  }
});
