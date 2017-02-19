console.log(process.versions);

const electron = require('electron');

// Module to control application life.
const app = electron.app;
const ipc = electron.ipcMain;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1366, height: 720})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '/public/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Create a server
  mainWindow.webContents.once("did-finish-load", function () {
        var http = require("http");
        var crypto = require("crypto");

        var express = require('express');
        var cookieParser = require('cookie-parser');
        var bodyParser = require('body-parser');
        var port = process.env.PORT || 2000;

        var diag_app = express();

        diag_app.use(bodyParser.json());
        diag_app.use(bodyParser.urlencoded({ extended: false }));
        diag_app.use(cookieParser());

        diag_app.use(function(req, res, next) {
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
          next();
        });

        // var server = http.createServer(function (req, res) {
        //     var port = crypto.randomBytes(16).toString("hex");
        //     ipc.once(port, function (ev, status, head, body) {
        //         //console.log(status, head, body);
        //         res.writeHead("Access-Control-Allow-Origin", "*");
        //         res.end(body);
        //     });
        //     window.webContents.send("request", req, port);
        // });
        // server.listen(1800);
        // console.log("http://localhost:1800/");

        var diag_server = http.createServer(diag_app);

        diag_server.listen(port, "0.0.0.0", function () {
          console.log('Server listening at port %d', port);
        });

        var io = require('socket.io').listen(diag_server);
        io.sockets.on('connection', function (socket) {
          io.sockets.emit("diag_server-welcome-new-user", "Hello");
          console.log("New user connected...");


        });
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
