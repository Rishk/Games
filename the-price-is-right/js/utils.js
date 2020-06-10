function sendData(conn, type, payload) {
  conn.send({type: type, payload: payload});
}

function formatPrice(price) {
  if (price == null) {
    return "";
  }
  return `&pound;${price.toFixed(2)}`
}
