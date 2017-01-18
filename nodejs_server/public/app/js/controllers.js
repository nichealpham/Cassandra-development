var app = angular.module("app")
.controller("mainController", ['$scope', 'socket', '$ionicLoading', function ($scope, socket, $ionicLoading) {
  $scope.pageTitle = "REAL-TIME ECG";
  jQuery(".tab-item").on("click", function () {
    jQuery(".tab-item").removeClass("active");
    jQuery(this).addClass("active");
  });

  $scope.user = {
    name: "Nguyen Pham",
    age: 21,
    phone: "0914 118 896",
    ID: "116 322 92"
  };
  var animateTab = function (tabid) {
    jQuery(".content").css("display", "none");
    jQuery("#tab" + tabid + "View").fadeIn();
  };
  $scope.tab1Clicked = function () {
    $scope.pageTitle = "REAL-TIME ECG";
    animateTab(1);
  };
  $scope.tab2Clicked = function () {
    $ionicLoading.show({
      template: 'Loading...'
    });

    jQuery('#container2_1').highcharts('StockChart', {
                  chart: {
                      zoomType: 'x'
                  },
                  title: {
                      text: 'EKG TIME SERIES',
                      style: { "font-size" : "18px" }
                  },
                  xAxis: {
                    labels: {
                        enabled: false
                    }
                  },
                  legend: {
                      enabled: false
                  },
                  plotOptions: {
                      area: {
                          fillColor: {
                              linearGradient: {
                                  x1: 0,
                                  y1: 0,
                                  x2: 0,
                                  y2: 1
                              },
                              stops: [
                                  [0, Highcharts.getOptions().colors[0]],
                                  [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                              ]
                          },
                          marker: {
                              radius: 2
                          },
                          lineWidth: 2,
                          states: {
                              hover: {
                                  lineWidth: 3
                              }
                          },
                          threshold: null
                      }
                  },

                  series: [{
                      type: 'area',
                      name: 'Data',
                      data: timebin
                  }]
              });
    $scope.pageTitle = "TOTAL RECORD";
    animateTab(2);
    $ionicLoading.hide();
  };
  $scope.tab3Clicked = function () {
    $scope.pageTitle = "PARAMS EXTRACT";
    animateTab(3);
  };
  $scope.actionShow = true;

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
  $scope.actionName = "Run";
  $scope.animate = function () {
    $scope.action += 1;
    if ($scope.action % 2 == 0) {
      $scope.actionName = "Stop";
    }
    else {
      $scope.actionName = "Run";
    }
  };
      var bin = [];
      var fbin = [];
      var timebin = [];
      var peaksbin = [];
      var index = 0;
      var index2 = 0;
      var findex = 0;
      var a = 0;
      $scope.action = 1;
      $scope.dataFromServer = false;
      socket.on('dataFilteredToMobileDeviceSentByServer', function (respone) {
        var result = respone.data;
        fbin.push(result);
        var time = (new Date()).getTime();
        timebin.push([time, result]);
        $scope.dataFromServer = true;
      });
  //    socket.on('dataFromHardwareToMobile', function (respone) {
  //      var result = respone.data;
  //      console.log(result);
  //      fbin.push(result);

//        $scope.dataFromServer = true;
//      });
      Highcharts.setOptions(Highcharts.theme);
          jQuery('#container1_1').highcharts({
              chart: {
                  type: 'spline',
                  events: {
                    load: function () {

                    // set up the updating of the chart each second
                    var series = this.series[0];

                    setInterval(function () {
                    //    if (a === 1 & index < (fbin.length-1)) {
                    if ($scope.dataFromServer == false) {
                      if ($scope.action % 2 == 0) {
                        var x = index, // current time
                            y = Math.random() * 600;
                        series.addPoint([x, y], true, true);
                        var time = (new Date()).getTime();
                        timebin.push([time, y]);
                        index = index + 1;

                      }
                    }
                    else {
                      if (index2 <= fbin.length - 1) {
                        $scope.action = 1; // not allowing the Run button to work anymore
                        var x = index2,
                            y = fbin[index2];
                        series.addPoint([x, y], true, true);

                        index2 = index2 + 1;
                      }

                    }


                    //      }
                    }, 20);
                    }
                    }
              },

                      title: {
                          text: 'Realtime Data',
                          style: { "font-size" : "18px" }
                      },
                      xAxis: {
                          lineWidth: 0,
                          minorGridLineWidth: 0,
                          lineColor: 'transparent',
                          labels: {
                              enabled: false
                          },
                          minorTickLength: 0,
                          tickLength: 0
                      },
                      exporting: {
                          enabled: false
                      },
                      yAxis: {
                          min: 0,
                          lineWidth: 0,
                          minorGridLineWidth: 0,
                          lineColor: 'transparent',
                          labels: {
                              enabled: false
                          },
                          title: "",
                          minorTickLength: 0,
                          tickLength: 0
                      },
                      series: [{
                          name: 'ECG Data',
                          data: (function () {
                              // generate an array of random data
                              var data = [], i;

                              for (i = -79; i < 0; i += 1) {
                                  data.push([
                                      i,
                                      Math.round(Math.random() * 600 + 200)
                                  ]);
                              }
                              return data;
                          }())
                      }]
                  });




}]);
