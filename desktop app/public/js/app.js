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
    .when("/medication", {
      templateUrl: "templates/medicationTemplate.html",
      controller: "medicationController"
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
