const express = require("express");
const socketio = require("socket.io");
const http = require("http");

const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const PORT = process.env.PORT || 5000;

const router = require("./router");
const ignoreFavicon = require("./ignoreFavicon");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const cors = require("cors");

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    console.log("User has joined");
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);
    if (error) {
      console.log("Error coeg");
    }
    console.log("Added coeg");

    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to room ${room}`,
    });
    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: `user ${name} has joined.`,
    });

    socket.join(user.room);

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    // console.log(socket.id);
    const user = getUser(socket.id);
    // console.log(user);

    io.to(user.room).emit("message", { user: user.name, text: message });
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left.`,
      });
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

app.use(router);
app.use(cors());
app.use(ignoreFavicon);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
