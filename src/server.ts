import express from "express";
import { Server } from "socket.io";
import type {} from "socket.io";
import http from "http";
import { log } from "console";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.resolve("public")));

app.get("/", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});
io.attach(server);
server.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});

const used = new Set<number>();
const users = new Set<string>();

function generateUniqueCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000);
  } while (used.has(code));

  used.add(code);
  return code;
}

io.on("connection", (socket) => {
  const uniqueNumber = generateUniqueCode();
  const userName = `${socket.handshake.auth.username}-${uniqueNumber}`;
  users.add(userName);
  console.log(userName, "connected");
  io.emit("users", Array.from(users.values()));

  socket.on("client:typing", (message) => {
    socket.broadcast.emit("server:client-typing", {
      userName,
    });
  });
  socket.on("client:message", (message) => {
    socket.broadcast.emit("server:client-message", { userName, message });
  });
  socket.on("disconnect", () => {
    users.delete(socket.id);
    const number = userName.split("-").pop();
    if (number) {
      used.delete(parseInt(number));
    }
    users.delete(userName);
    io.emit("users", Array.from(users.values()));
  });
});
