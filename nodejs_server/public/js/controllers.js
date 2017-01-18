var app = angular.module("app")
.controller("mainController", ['$scope', 'socket', '$ionicLoading', '$ionicSideMenuDelegate', '$ionicPlatform', '$ionicPopup', '$interval', '$timeout', function ($scope, socket, $ionicLoading, $ionicSideMenuDelegate, $ionicPlatform, $ionicPopup, $interval, $timeout) {
  $ionicPlatform.ready(function() {
    // initializa BLE, must be called before anything else
    $scope.dialog = "no action fired yet.";
    $scope.debugObj;


    // Core variables
    var bin = [];
    var fbin = [];
    var timebin = [];
    var peaksbin = [];
    var index = 0;
    var index2 = 0;
    var findex = 0;
    var a = 0;
    $scope.data = []; // save data for plot

    $scope.databin = []; // databin
    $scope.runningIndex = 0;
    $scope.shouldUpdateDygraph = false;

    $scope.pageTitle = "REAL-TIME ECG";
    $scope.actionShow = true;
    $scope.actionName = "Run";
    $scope.action = 1;
    $scope.dataFromBLE = false;
    $scope.user = {
      name: "Nguyen Pham",
      age: 21,
      phone: "0914 118 896",
      ID: "11632292"
    };
    $scope.dygraphInterval;
    $scope.dygraphtimeOut;
    $scope.g1;
    $scope.devices = {};
    $scope.selectedDevice;
    $scope.selectedService;
    $scope.testDataBLE = [];
    $scope.selectedCharacteristicUUID;
    $scope.enableBytes = new Uint8Array([1, 0,]);
    $scope.debugObj = [];
    $scope.addDevice = function (obj) {
      if (obj.status == "scanStarted") {
        return;
      }

      if ($scope.devices[obj.address] !== undefined) {
        return;
      }
  // initiate blank services
  // need it to read value
      obj.services = {};
      $scope.devices[obj.address] = obj;
    };

    var data = [];
    var t = new Date();
    for (var i = 249; i >= 0; i--) {
      var x = new Date(t.getTime() - i * 20);
    //  data.push([x, Math.random() * 8000 + 140000]);
      $scope.data.push([x, Math.random() * 3500 + 140000]);
    };
    smoothPlotter.smoothing = parseFloat(0.4);
    $scope.initiateDygraph = function () {
      $scope.g1 = new Dygraph(document.getElementById("container1_1"), $scope.data,
      {
        title: "Real - time Data",
        drawPoints: false,
        ylabel: 'Signal strength',
        showRoller: false,
    //    valueRange: [0, 1000],
        labels: ['Time', 'Real time EKG data'],
        legend: 'always',
        labelsDivStyles: { 'textAlign': 'right' },
        drawXAxis: true,
        drawYAxis: true,
        plotter: smoothPlotter,
        color: '#009688',
        strokeWidth: 2,
        animatedZoom: false,
        gridLineColor: '#ddd'
      });
    };
    $scope.updateDyGraph = function () {
    //  if (value == null) {
        $scope.dygraphInterval = setInterval(function() {
          if ($scope.shouldUpdateDygraph) {
            var len = $scope.databin.length;
            if ($scope.runningIndex <= (len - 1)) {
              $scope.data.splice(0, 1);
              var x = new Date();
              var y = $scope.databin[$scope.runningIndex][1];
              $scope.data.push([x, y]);
              $scope.g1.updateOptions( { 'file': $scope.data } );
              $scope.runningIndex += 1;
            }
          }


        }, 8);
    //  }
    //  else {
        // neu co dc value, then push the value into it and update the graph only once


    //    if (value < 137500) {
    //      value = 140500;
    //    }
    //  //  data.splice(0, 1);
    //    $scope.data.splice(0, 1);
    //    var x = new Date();  // current time
    //    var y = value;
    //  //  data.push([x, y]);
    //    $scope.data.push([x, y]);
    //    $scope.g1.updateOptions( { 'file': $scope.data } );

    //  };

    };
    $scope.updateDyGraph();
    jQuery(".tab-item").on("click", function () {
      jQuery(".tab-item").removeClass("active");
      jQuery(this).addClass("active");
    });
    var animateTab = function (tabid) {
      jQuery(".content").css("display", "none");
      jQuery("#tab" + tabid + "View").fadeIn();
    };
    $scope.tab1Clicked = function () {
      animateTab(1);
      $scope.pageTitle = "REAL-TIME ECG";
      $scope.initiateDygraph();
    };
    $scope.toggleLeftSideMenu = function () {
      $ionicSideMenuDelegate.toggleLeft();
    };
    $scope.toggleRightSideMenu = function () {
      $ionicSideMenuDelegate.toggleRight();
    };
    $scope.tab1Clicked = function () {
      $scope.pageTitle = "REAL-TIME ECG";
      animateTab(1);
    };
    $scope.tab3Clicked = function () {
      $scope.pageTitle = "PARAMS EXTRACT";
      animateTab(3);
    };

    $scope.changeChartHeightPortrait = function () {
      jQuery(".chartContainer").height(jQuery(window).height() - 172);

    };
    jQuery("#tab1View").css("display", "inline-block");
    $scope.changeChartHeightLandscape = function () {
      jQuery(".chartContainer").height(jQuery(window).height());
    };
    $scope.changeChartHeightPortrait();
    window.addEventListener("orientationchange", function() {
    // Announce the new orientation number
      if(window.innerHeight > window.innerWidth){
        console.log("Portrait");
        jQuery("#headerBar").css("display" , "inline-block");
        jQuery("#tabBar").css("display" , "inline-block");
        jQuery(".chartContainer").removeClass("chartContainer_Lanscaped");
        $scope.changeChartHeightPortrait();
        $scope.actionShow = true;
      }
      else {
        console.log("Landscape!");
        jQuery("#headerBar").css("display","none");
        jQuery("#tabBar").css("display","none");
        jQuery(".chartContainer").addClass("chartContainer_Lanscaped");
        $scope.changeChartHeightLandscape();
        $scope.actionShow = false;
      }
    }, false);
    $scope.tab2Clicked = function () {
      animateTab(2);

      $scope.pageTitle = "TOTAL RECORD";

      $ionicLoading.show({
        template: 'Loading...'
      });
      if (timebin.length > 0) {


      };


      $ionicLoading.hide();
    };
    // Core variables



    $scope.animate = function () {


      $scope.action += 1;
      if ($scope.action % 2 == 0) {
        // Run the DyGraph update function
        $scope.shouldUpdateDygraph = true;
        $scope.actionName = "Stop";


      }
      else {
        // Stope the updateDyGraph function
        $scope.shouldUpdateDygraph = false;
  //      $timeout.cancel($scope.dygraphtimeOut);
  //      $scope.dialog = "View data array";
  //      $scope.debugObj = data;
        $scope.actionName = "Run";




      }
    };
    // Lay data from Rasperry Pi, must not delete
    socket.on('dataFilteredToMobileDeviceSentByServer', function (respone) {
      var result = respone.data;
      fbin.push(result);
      var time = (new Date()).getTime();
      timebin.push([time, result]);
      $scope.dataFromBLE = true;
    });
    socket.on('datasent', function (respone) {
      var x = new Date();  // current time
      var y = respone;
      $scope.databin.push([x, y]);
    });
    socket.on('dataFromServerToWebsite', function (respone) {
  //    var x = new Date();
      var y1 = respone.value[0];
      if (y1 > 4000000) {
        var count = respone.counter;
        $scope.databin.push([count, y1]);
        var y2 = respone.value[1];
        $scope.databin.push([count, y2]);
        $scope.debugObj.push(respone);
      }

  //    if (y > 2000000) {
  //    $scope.debugObj.push(respone);
  //    };

    });
    // First time action
    $scope.initiateDygraph();














  });





}]);
