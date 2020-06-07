const HOST_ID = window.location.href.split("host=")[1];

var app = new Vue({
  el: '#app',
  data: {
    peer: new Peer({host: "peer.rishk.me", port: 80, path: '/'}),
    conn: null,
    joined: false,
    leaderboard: []
  },
  created() {
    this.peer.on('open', function(id) {
      app.conn = app.peer.connect(HOST_ID);
    });
  },
  methods: {
    joinGame(e) {
      e.preventDefault();
      let name = document.getElementById("nameInput").value.trim();

      this.conn.on('data', function(data) {
        app.handleResponse(data);
      });

      this.conn.send({type: 'JOIN', payload: {name: name}});
      this.joined = true;
    },
    handleResponse(data) {
      switch (data.type) {
        case 'LEADERBOARD':
          this.leaderboard = data.payload;
          break;
      }
    }
  }
});
