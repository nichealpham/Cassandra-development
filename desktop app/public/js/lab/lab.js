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
  this.moving_average = function(span, data) {
    for (i = 0; i < data.length - span; i++) {
      var sum = data[i] * 10;

      for (k = 2; k <= span; k++) {
        sum += data[i + k - 1];
      };
      data[i] = Math.floor(sum / (span + 9));
    };
    return data;
  };
  this.lowpass_filter = function(order, cutoff, fs, data) {
    var firCalculator = new Fili.firCoeffs();

    // calculate filter coefficients
    var firFilterCoeffs = firCalculator.lowpass({
        order: order,
        Fs: fs,
        Fc: cutoff
      });

    // create a filter instance from the calculated coeffs
    var firFilter = new Fili.FirFilter(filterCoeffs);

    return filter.multiStep(data);
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
