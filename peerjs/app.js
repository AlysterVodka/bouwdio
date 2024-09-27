const { PeerServer } = require("peer");

const ps = PeerServer({
  port: 9000,
  path: "/peerjs",
  proxied: true,
});

ps.on("connection", (client) => {
  console.log("connection", client);
});

ps.on("error", (err) => {
  console.log("error", err);
});
