
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

var app = express();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 2000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// Routing
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use(express.json());       // to support JSON-encoded bodies
// app.use(express.urlencoded()); // to support URL-encoded bodies

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/cool', function(request, response) {
  var name = request.body.name;
  response.send("Hello " + name + ". Post accepted!");
});

var numUsers = 0;

io.sockets.on('connection', function (socket) {
          // socket.emit : emit to just one socket
          // io.sockets.emit : emit to all sockets
          socket.emit("diag_server-welcome-new-user", "Hello");
          console.log("New user connected...");

          socket.on("testing_emit_to_server", function(data) {
            console.log(data);
          });

          socket.on("save_this_record_to_server", function(data) {
            var record = data;
            console.log("Received record " + record.name);
            var text_content = record.record_data.sampling_frequency + "\r\n";
            for (var loop = 0; loop < record.record_data.data.length; loop++) {
              text_content = text_content + (record.record_data.data[loop] + "\r\n");
            };
            fs.writeFile(__dirname + "\\public" + "\\bin\\saved-records\\" + record.name.split(' ').join('_') + ".txt", text_content, function (err) {
            // fs.writeFile(__dirname + "\\bin\\saved-records\\" + record.name + ".txt", text_content, function (err) {
              if (err) {
                console.log(err);
                socket.emit("save_record_to_server_failed", err);
              } else {
                console.log("Save record successed");
                io.sockets.emit("save_record_to_server_successed", record);
              };
            });
          });

          socket.on("get_this_record_from_server", function(link) {
            var filename = link.substring(link.lastIndexOf('/') + 1);
            fs.readFile(__dirname + "\\public" + "\\bin\\saved-records\\" + filename, 'utf8', function (err, data) {
              if (err) {
                socket.emit("get_this_record_from_server_failed", err);
                console.log(err);
              } else {
                socket.emit("server_retrieve_and_send_back_this_record", data);
                console.log("Read record " + filename + " succeed, length: " + data);
              };
            });
          });

});

server.listen(port, "0.0.0.0", function () {
  console.log('Server listening at port %d', port);
});
