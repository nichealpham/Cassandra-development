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

app.directive('onReadFile', function ($parse) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
            var fn = $parse(attrs.onReadFile);

			element.on('change', function(onChangeEvent) {
				var reader = new FileReader();
				reader.onload = function(onLoadEvent) {
					scope.$apply(function() {
						fn(scope, {$fileContent:onLoadEvent.target.result});
					});
				};

        reader.onprogress = function(event) {
          
        };

				reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
			});
		}
	};
});
