function sendData(conn, type, payload) {
  conn.send({type: type, payload: payload});
}
