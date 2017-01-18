// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 2000;
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

server.listen(port, "0.0.0.0", function () {
  console.log('Server listening at port %d', port);
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Chatroom

var numUsers = 0;

io.sockets.on('connection', function (socket) {
  console.log("New user connected...");
  var addedUser = false;

  ///////////////////////////////////
    // DATA STREAMMING
  ///////////////////////////////////

  socket.on('init', function () {
      socket.emit('LED', true);
  });
  socket.on('dataFromPhoneToServer', function (respone) {
    io.sockets.emit("dataFromServerToWebsite", respone);
  });

  socket.on("dataFilteredToMobileDeviceButFirstToServer", function (respone) {
    io.sockets.emit("dataFilteredToMobileDeviceSentByServer", respone);
  });

  socket.on('temp', function (temp) {
      socket.broadcast.emit('datasent', temp);
      //console.log(temp);
  });
  socket.on("appFakeNotifyWebToStartToServer", function (respone) {
    io.sockets.emit("appFakeNotifyWebToStartByServer", respone);
  });

  socket.on("appFakeNotifyWebToStopToServer", function (respone) {
    io.sockets.emit("appFakeNotifyWebToStopByServer", respone);
  });

  socket.on('toMobile', function (temp) {
      io.sockets.emit('dataFromHardwareToMobile', {data: temp} );
      console.log(temp);
  });

  // CHAT APP
  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
