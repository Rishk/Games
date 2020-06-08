const HOST_ID = window.location.href.split("host=")[1];

const State = {
  JOINING: 0,
  JOINED: 1,
  STARTED: 2
}

var app = new Vue({
  el: '#app',
  data: {
    peer: new Peer({host: "peer.rishk.me", path: '/', secure: true}),
    conn: null,
    state: State.JOINING,
    leaderboard: []
  },
  created() {
    this.peer.on('open', function(id) {
      app.conn = app.peer.connect(HOST_ID);
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
    handleResponse(data) {
      switch (data.type) {
        case 'LEADERBOARD':
          this.leaderboard = data.payload;
          break;
        case 'JOINED':
          this.state = State.JOINED;
          break;
        case 'ERROR':
          alert(data.payload);
          break;
      }
    }
  }
});
