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
        var fs = require('fs');

        var diag_app = express();

        diag_app.use(bodyParser.json());
        diag_app.use(bodyParser.urlencoded({ extended: false }));
        diag_app.use(cookieParser());
        diag_app.use(express.static(path.join(__dirname, 'socket-public')));

        diag_app.use(function(req, res, next) {
          res.header("Access-Control-Allow-Origin", "*");
          res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
          next();
        });

        var diag_server = http.createServer(diag_app);

        diag_server.listen(port, "0.0.0.0", function () {
          console.log('Server listening at port %d', port);
        });

        var io = require('socket.io').listen(diag_server);
        io.sockets.on('connection', function (socket) {
          // socket.emit : emit to just one socket
          // io.sockets.emit : emit to all sockets
          socket.emit("diag_server-welcome-new-user", "Hello");
          console.log("New user connected...");
          var moving_average = function(span, scale, data) {
            var output = [];
            if (scale == null) {
              scale = 1;
            };
            for (i = 0; i < data.length - span; i++) {
              var sum = data[i] * scale;
              for (k = 2; k <= span; k++) {
                sum += data[i + k - 1];
              };
              var result = Math.floor(sum / (span + scale - 1));
              if (result) {
                output.push(result);
              } else {
                output.push(null);
              };
            };
            return data;
          };
          var down_sampling = function(factor, data) {
            factor = Math.round(factor);
            if (factor <= 1) {
              return data;
            };
            var result = [];
            for (i = 0; i < data.length - factor; i += factor) {
              var value = 0;
              for (k = 1; k <= factor; k++) {
                value += data[i + k - 1];
              };
              value = Math.floor(value / factor);
              result.push(value);
            };
            return result;
          };
          var magnify_maximum = function(data, baseline, power) {
            var new_data = [];
            if (baseline == null) {
              baseline = 250;
            };
            if (power == null) {
              power = 4;
            };
            for (i = 1; i < data.length - 1; i++) {
              if ((data[i] > data[i - 1]) && (data[i] > data[i + 1])) {
                var value = Math.pow((Math.pow(data[i] - data[i - 1], power) + Math.pow(data[i] - data[i + 1], power)), 1 / power)  + baseline;
                new_data.push(value);
              } else {
                new_data.push(baseline);
              };
            };
            return new_data;
          };
          var cal_mean = function(data) {
            var sum = 0;
            var deduce = 0;
            for (i = 0; i < data.length; i++) {
              if (data[i]) {
                sum += data[i];
              } else {
                deduce += 1;
              };
            };
            return sum / (data.length - deduce);
          };
          var cal_std = function(data) {
            var mean = cal_mean(data);
            var sum_of_sqrt = 0;
            var deduce = 0;
            for (i = 0; i < data.length; i++) {
              if (data[i]) {
                sum_of_sqrt += Math.pow(data[i] - mean, 2);
              } else {
                deduce += 1;
              };
            };
            return Math.sqrt(sum_of_sqrt / (data.length - deduce - 1));
          };
          var find_max = function(data) {
            var max = data[0];
            for (i = 0; i < data.length; i++) {
              if (data[i] > max) {
                max = data[i];
              };
            };
            return max;
          };
          var find_min = function(data) {
            var min = data[0];
            for (i = 0; i < data.length; i++) {
              if (data[i] < min) {
                min = data[i];
              };
            };
            return min;
          };
          var find_peaks = function(data, min_peak_value, min_peak_distance) {
            var peak_locs = [];
            for (i = 1; i < data.length - 1; i++) {
              if ((data[i] > data[i - 1]) && (data[i] > data[i + 1])) {
                peak_locs.push(i);
              };
            };
            if (min_peak_value != null) {
              var new_peak_locs = [];
              for (i = 0; i < peak_locs.length; i++) {
                if (data[peak_locs[i]] >= min_peak_value) {
                  new_peak_locs.push(peak_locs[i]);
                };
              };
              peak_locs = new_peak_locs;
            };
            if (min_peak_distance != null) {
              var new_peak_locs = [peak_locs[0]];
              var last_peak_index = peak_locs[0];

              for (i = 1; i < peak_locs.length; i++) {
                if ((peak_locs[i] - last_peak_index) > min_peak_distance) {
                  new_peak_locs.push(peak_locs[i]);
                  last_peak_index = peak_locs[i];
                };
              };

              peak_locs = new_peak_locs;
            };
            return peak_locs;
          };
          var qrs_detect = function(fs, data, baseline, power) {
            var max_hr_hz = 3;          // around 180 bpm
            if (baseline == null) {
              baseline = 250;
            };
            if (power == null) {
              power = 4;
            };
            data2 = magnify_maximum(data, baseline, power);
            var min_peak_value = cal_mean(data2) + 1.5 * cal_std(data2);
            var min_peak_distance = Math.floor(1 / max_hr_hz * fs);
            try {
              var qrs_locs = find_peaks(data2, min_peak_value, min_peak_distance);
            } catch(err) {
              return null;
            };
            return qrs_locs;
          };
          var t_peaks_detect = function(fs, ecg_data, qrs_locs, baseline, power) {
            if (baseline == null) {
              baseline = 250;
            };
            if (power == null) {
              power = 4;
            };
            if (qrs_locs == null) {
              qrs_locs = qrs_detect(fs, ecg_data, baseline, power);
            };
            var t_peaks = [];
            var t_locs = [];
            for (var hk = 0; hk < qrs_locs.length - 1; hk++) {
              var qrs = ecg_data[qrs_locs[hk]];
              var qrs_leng = qrs_locs[hk + 1] - qrs_locs[hk];
              var step = qrs_leng;
              step = Math.ceil(step / 2);
              step += qrs_locs[hk];
              var iso = ecg_data[step];
              var qrs_amplitude = Math.abs(qrs - iso) + 250;   // 250 is the baseline
              var segment = [];
              var index_to_start  = Math.floor(0.15 * qrs_leng) + qrs_locs[hk];
              var index_to_end    = Math.floor(0.5 * qrs_leng) + qrs_locs[hk];
              for (var lm = index_to_start; lm < index_to_end; lm++) {
                var value = ecg_data[lm] - iso;
                segment.push(Math.abs(value));
              };
              var t_amplitude_abs = this.find_max(segment);
              var t_loc = segment.indexOf(t_amplitude_abs) + index_to_start;
              var t_amplitude = ecg_data[t_loc] - iso;
              t_peaks.push(Math.floor(t_amplitude / qrs_amplitude * 100));
              t_locs.push(t_loc);
            };
            return [t_peaks, t_locs];
          };

          socket.on("calculate_heart_rate", function(data) {
            // fs, ecg_data, qrs_locs, baseline, power
            var fs = data[0], ecg_data = data[1];
            var hrs = [];
            baseline = 250;
            power = 4;
            qrs_locs = qrs_detect(fs, ecg_data, baseline, power);
            if (qrs_locs.length <= 1) {
              return "---";
            };
            for (i = 0; i < qrs_locs.length - 1; i++) {
              var hr = Math.floor(60 / ((qrs_locs[i + 1] - qrs_locs[i])  / fs));
              hrs.push(hr);
            };
            socket.emit("result_from_calculate_heart_rate", hrs);
          });
          socket.on("calculate_ST_deviation", function(data) {
            var fs = data[0], ecg_data = data[1];
            var baseline = 250;
            var power = 4;
            var qrs_locs = qrs_detect(fs, ecg_data, baseline, power);
            var ohyeah = t_peaks_detect(fs, ecg_data, qrs_locs, baseline, power);
            var t_locs = ohyeah[1];
            var std_bin = [];
            for (var hk = 0; hk < t_locs.length; hk++) {
              var std = 0;
              var rt_length = t_locs[hk] - qrs_locs[hk];
              var st_index_start = Math.ceil(rt_length / 3) + qrs_locs[hk];
              var st_index_end = Math.ceil(rt_length / 3 * 2) + qrs_locs[hk];
              var iso_index = Math.ceil((qrs_locs[hk] + qrs_locs[hk + 1]) / 2);
              var iso = ecg_data[iso_index];
              var qrs_amplitude = Math.abs(ecg_data[qrs_locs[hk]] - iso) + 250;

              for (var lm = st_index_start; lm < st_index_end; lm++) {
                std += (ecg_data[lm] - iso);
              };
              std = std / (st_index_end - st_index_start);
              std = Math.floor(std / qrs_amplitude * 100);
              std_bin.push(std);
            };
            socket.emit("result_from_calculate_ST_deviation", std_bin);
          });
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
