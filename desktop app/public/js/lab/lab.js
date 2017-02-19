var app = angular.module("app", ['ngRoute', 'ngSanitize', 'ngFileSaver']);

app.service("printService", function () {
  var data = "random";
  var saveProject = function (string) {
    data = string;
  };
  var exportProject = function () {
    return data;
  };
  return {
    set: saveProject,
    return: exportProject
  };
});

app.service ('dsp', function() {
  this.moving_average = function(span, data, scale) {
    if (scale == null) {
      scale = 1;
    };
    for (i = 0; i < data.length - span; i++) {
      var sum = data[i] * scale;

      for (k = 2; k <= span; k++) {
        sum += data[i + k - 1];
      };
      data[i] = Math.floor(sum / (span + scale - 1));
    };
    return data;
  };
  this.down_sampling = function(factor, data) {
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
  this.magnify_maximum = function(data, baseline, power) {
    var new_data = [];
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
  this.cal_mean = function(data) {
    var sum = 0;
    for (i = 0; i < data.length; i++) {
      sum += data[i];
    };
    return sum / data.length;
  };
  this.cal_std = function(data) {
    var mean = this.cal_mean(data);
    var sum_of_sqrt = 0;
    for (i = 0; i < data.length; i++) {
      sum_of_sqrt += Math.pow(data[i] - mean, 2);
    };
    return Math.sqrt(sum_of_sqrt / (data.length - 1));
  };
  this.find_peaks = function(data, min_peak_value, min_peak_distance) {
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
  this.calculate_heart_rates = function(fs, data, baseline, power) {
    var max_hr_hz = 2.5;          // around 180 bpm
    if (baseline == null) {
      baseline = 250;
    };
    if (power == null) {
      power = 4;
    };
    var hrs = [];
    data2 = this.magnify_maximum(data, baseline, power);
    data2 = data;
    var min_peak_value = this.cal_mean(data2) + 1.5 * this.cal_std(data2);
    var min_peak_distance = Math.floor(1 / max_hr_hz * fs);
    try {
      var qrs_locs = this.find_peaks(data2, min_peak_value, min_peak_distance);
    } catch(err) {
      return "---";
    };
    if (qrs_locs.length <= 1) {
      return "---";
    };
    for (i = 0; i < qrs_locs.length - 1; i++) {
      var hr = Math.floor(60 / ((qrs_locs[i + 1] - qrs_locs[i])  / fs));
      hrs.push(hr);
    };
    return hrs;
  };
});

app.factory('socket', function ($rootScope) {
  var socket = io.connect('http://localhost:2000');
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          };
        });
      });
    }
  };
});
