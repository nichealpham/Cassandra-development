var app = angular.module("app", ['ngRoute', 'ngSanitize', 'ngFileSaver']);

app.config(function ($routeProvider) {
  $routeProvider
    .when("/", {
      templateUrl: "templates/homeTemplate.html",
      controller: "mainController"
    })
    // .when("/laboratory", {
    //   templateUrl: "templates/laboratoryTemplate.html",
    //   controller: "laboratoryController"
    // })
    .when("/personal", {
      templateUrl: "templates/personalTemplate.html",
      controller: "personalController"
    })
    .when("/records", {
      templateUrl: "templates/recordsTemplate.html",
      controller: "recordsController"
    })
    .otherwise(
      { redirectTo: "/"}
    );
});

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
