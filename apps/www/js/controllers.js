app.controller("mainController", function($scope, $timeout, $interval, ionicMaterialInk, ionicMaterialMotion, $ionicLoading, $ionicPopup, $interval, socket, $ionicSideMenuDelegate, $ionicPlatform, $cordovaBluetoothLE) {
  $ionicPlatform.ready(function() {
    ionicMaterialInk.displayEffect();
    ionicMaterialMotion.ripple();
    $scope.devices = {};
    $scope.selectedDevice;
    $scope.selectedService;
    var timeouts = [];
    var intervals = [];
    $scope.$on('ngLastRepeat.deviceList',function(e) {
      $scope.materialize();
    });
    var vw = jQuery(window).width();
    var vh = jQuery(window).height();
    $scope.materialize = function(){
      $timeout(function(){
      //  ionicMaterialMotion.fadeSlideInRight();
        ionicMaterialInk.displayEffect();
        ionicMaterialMotion.ripple();
      },0);
    };
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
    $scope.startScan = function () {
      var params = {
        services:[],
        allowDuplicates: false,
        scanTimeout: 30000,
      };

      if (window.cordova) {
        params.scanMode = bluetoothle.SCAN_MODE_LOW_POWER;
        params.matchMode = bluetoothle.MATCH_MODE_STICKY;
        params.matchNum = bluetoothle.MATCH_NUM_ONE_ADVERTISEMENT;
      }
      $cordovaBluetoothLE.startScan(params).then(null, function(obj) {
          $cordovaBluetoothLE.stopScan().then(null, null);
          alert("Start Scan Error");
        },
        function(obj) {
          if (obj.status == "scanResult")
          {
            $scope.addDevice(obj);
            alert("Start Scan success");
            $cordovaBluetoothLE.stopScan().then(null, null);
          }
          else if (obj.status == "scanStarted")
          {
          }
        }
      );
    };
    function addService(service, device) {
      if (device.services[service.uuid] !== undefined) {
        return;
      }
      device.services[service.uuid] = {uuid : service.uuid, characteristics: {}};
    };

    function addCharacteristic(characteristic, service) {
      if (service.characteristics[characteristic.uuid] !== undefined) {
        return;
      }
      service.characteristics[characteristic.uuid] = {uuid: characteristic.uuid, descriptors: {}, properties: characteristic.properties};
    };

    function addDescriptor(descriptor, characteristic) {
      if (characteristic.descriptors[descriptor.uuid] !== undefined) {
        return;
      }
      characteristic.descriptors[descriptor.uuid] = {uuid : descriptor.uuid};
    };

    $scope.discoverServices = function(address) {
      var params = {
        address: address,
        timeout: 30000
      };

      $cordovaBluetoothLE.discover(params).then(function(obj) {

        var device = $scope.devices[obj.address];

        var services = obj.services;



        for (var i = 0; i < services.length; i++) {
          var service = services[i];

          addService(service, device);

          var serviceNew = device.services[service.uuid];

          var characteristics = service.characteristics;

          for (var j = 0; j < characteristics.length; j++) {
            var characteristic = characteristics[j];

            addCharacteristic(characteristic, serviceNew);

            var characteristicNew = serviceNew.characteristics[characteristic.uuid];

            var descriptors = characteristic.descriptors;

            for (var k = 0; k < descriptors.length; k++) {
              var descriptor = descriptors[k];

              addDescriptor(descriptor, characteristicNew);
            }
          }
        }

        $scope.selectedDevice.services = services;
      }, function(obj) {
        alert("Discover services failed.")
      });
    };
    $cordovaBluetoothLE.initialize({request:true}).then(null,
      function(obj) {
        alert("Can not initiate Bluetooth. Please try again");
      },
      function(obj) {
        //Handle successes
        alert("Inniate BLE success");

      }
    );
    $scope.subscribe = function(address, service, characteristic) {
      var params = {
        address:address,
        service:service,
        characteristic:characteristic,
        timeout: 30000,
      };
      $cordovaBluetoothLE.subscribe(params).then(function(obj) {
        alert("The device is auto unsubscribed. Access is denied.");
      }, function(obj) {
        alert("Error in subscribe for address: " + address +"\nService: " + service + "\nCharacteristics: " + characteristic);
      }, function(obj) {
        if (obj.status == "subscribedResult") {
          var bytes = $cordovaBluetoothLE.encodedStringToBytes(obj.value);
          var bit_a = bytes[0];
          var bit_b = bytes[1];
          var bit_1 = bytes[5];
          var bit_2 = bytes[6];
          var bit_3 = bytes[7];
          var bit_4 = bytes[14];
          var bit_5 = bytes[15];
          var bit_6 = bytes[16];
          var counter = bit_a * Math.pow(2, 8) + bit_b;
          var result1 = bit_1 * Math.pow(2, 16) + bit_2 * Math.pow(2, 8) + bit_3;
          var result2 = bit_4 * Math.pow(2, 16) + bit_5 * Math.pow(2, 8) + bit_6;
          var data = {
            counter: counter,
            value: [result1, result2],
            time: new Date(),
          };
          socket.emit("dataFromPhoneToServer", data);
        } else if (obj.status == "subscribed") {
          alert("Device already subscribed.");
        } else {
          alert("Unexpected subscribe error. Please try again.");
        }
      });
    };
    $scope.prompConnect = function (device) {
      $scope.selectedDevice = $scope.devices[device.address];
      var confirmPopup = $ionicPopup.confirm({
        title: 'Connect to device ' + device.name,
        template: 'Device Address: ' + device.address,
        cssClass: 'my-custom-popup',
      });
      confirmPopup.then(function(res) {
        if(res) {
          var params = {address:device.address, timeout: 30000};
          $cordovaBluetoothLE.connect(params).then(null,
            function(obj) {
              alert("Connect to device failed. Please try again.")
            },
            function(obj) {
              if (obj.status == "connected") {
                alert("Connection success");
                // $scope.discoverServices(device.address);
                $scope.discoverServices(device.address);

              } else {
                alert("Device disconnected");
              }
            }
          );
        };
      });
    };
    $scope.chooseThisService = function(service) {
      $scope.selectedService = service;
    };
    $scope.readThisCharacteristic = function(characteristic) {
      var address = $scope.selectedDevice.address;
      var serviceUUID = $scope.selectedService.uuid;
      var characteristicUUID = characteristic.uuid;

      $scope.subscribe(address, serviceUUID, characteristicUUID);
      timeouts.push(setTimeout(function () {
        jQuery("#pager").velocity({ "margin-left": "-100vw" }, { duration: 300 });
       //  jQuery("#pager").addClass("slide-left-from-0-to-1");
      }, 400));
    };

    $scope.scanDevices = function () {
      $ionicLoading.show({
        template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
      });

      // For example's sake, hide the sheet after two seconds
      timeouts.push(setTimeout(function () {
        $ionicLoading.hide();
        $scope.devices = [
          {
            name: "ECG Wireless Demo",
            address: "VPNH3-NHS-NHGH-DFNHF",
          },
          {
            name: "ECG Bluetooth 4.0",
            address: "NHSN-NHSP-NHSGD-NSHS",
          }
        ];
      }, 2000));
    };
    $scope.subscribeDevice = function (device) {

      var confirmPopup = $ionicPopup.confirm({
        title: 'Connect to device ' + device.name,
        template: 'Device Address: ' + device.address,
        cssClass: 'my-custom-popup',
      });

     confirmPopup.then(function(res) {
       if(res) {
         timeouts.push(setTimeout(function () {
           //ionic.material.ink.displayEffect();
           ionicMaterialInk.displayEffect();
         }, 0));

       } else {

       }
     });


    };
    var measuringChart = function () {
      var gaugeOptions = {

          chart: {
              type: 'solidgauge'
          },

          title: null,

          pane: {
              center: ['50%', '85%'],
              size: '140%',
              startAngle: -90,
              endAngle: 90,
              background: {
                  backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || '#EEE',
                  innerRadius: '60%',
                  outerRadius: '100%',
                  shape: 'arc'
              }
          },

          tooltip: {
              enabled: false
          },

          // the value axis
          yAxis: {
              stops: [
                  [0.2, '#55BF3B'], // green
                  [0.5, '#DDDF0D'], // yellow
                  [0.7, '#DF5353'] // red
              ],
              lineWidth: 0,
              minorTickInterval: null,
              tickAmount: 2,
              title: {
                  y: -90,
                  style: {
    	               color: '#C7F464',

                  },
              },
              labels: {
                style: {
  	               color: 'rgb(243,248,254)',

                },
                y: 20
              }
          },

          plotOptions: {
              solidgauge: {
                  dataLabels: {
                      y: 5,
                      borderWidth: 0,
                      useHTML: true
                  }
              }
          }
      };

      // The speed gauge
      jQuery('#measuring-chart').highcharts(Highcharts.merge(gaugeOptions, {
          yAxis: {
              min: 0,
              max: 200,
              title: {
                  text: 'Heart rate'
              },
          },

          credits: {
              enabled: false
          },

          series: [{
              name: 'Speed',
              data: [80],
              dataLabels: {
                  format: '<div style="text-align:center"><span style="font-size:32px;color:#4ECDC4;">{y}</span><br/>' +
                         '<span style="font-size:16px;" class="primary-text-color">BPM</span></div>'
              },
              tooltip: {
                  valueSuffix: 'BPM'
              }
          }]

      }));

      // The RPM gauge


      // Bring life to the dials
      intervals.push(setInterval(function () {
          // Speed
          var chart = jQuery('#measuring-chart').highcharts(),
              point,
              newVal,
              inc;

          if (chart) {
              point = chart.series[0].points[0];
              inc = Math.round((Math.random() - 0.5) * 100);
              newVal = point.y + inc;

              if (newVal < 0 || newVal > 200) {
                  newVal = point.y - inc;
              }

              point.update(newVal);
          }

          // RPM

      }, 1500));
    };

    $scope.chooseMeasurement = function (measureObj) {
      jQuery("#measuring-chart").css("opacity", 0).hide();
      timeouts.push(setTimeout(function () {
        jQuery("#pager").velocity({ "margin-left": "-200vw" }, { duration: 300 });
      //  jQuery("#pager").removeClass("slide-left-from-0-to-1");
      //  jQuery("#pager").addClass("slide-left-from-1-to-2");
        timeouts.push(setTimeout(function () {
          jQuery("#measuring-chart").show();
          $ionicLoading.show({
            template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
          });

          measuringChart();
        }, 400));
        timeouts.push(setTimeout(function () {
          $ionicLoading.hide();
          $scope.animateMeasuring();
          jQuery("#measuring-chart").addClass("fade-in");
        }, 2000));
      }, 400));

    };
    $scope.proceedToReport = function () {
      timeouts.push(setTimeout(function () {

        jQuery("#pager").velocity({ "margin-left": "-300vw" }, { duration: 300 });
      //  jQuery("#pager").removeClass("slide-left-from-1-to-2");
      //  jQuery("#pager").addClass("slide-left-from-2-to-3");

        timeouts.push(setTimeout(function () {
          $scope.specifyChartistHeightClass("ct-minor-seventh");
          jQuery("#reportChart").show().css("opacity", 0);
          jQuery("#reportStatistic").show().css("opacity", 0);
          $ionicLoading.show({
            template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
          });
          new Chartist.Line('#report-chart', {
          series: [
            [2, 3, 4, 3, 2, 3, 5, 8, 9, 8, 6, 5],
            [0, 1, 2, 4, 3, 2, 2, 4, 7, 9, 8, 7],
            [1, 2, 3, 2, 1, 2, 3, 3, 4, 6, 4, 3]
          ]}, {
            low: 0,
            showPoint: false,
            axisY: {
              scaleMinSpace: 40
            }
          });
        //  $ionicLoading.hide();
        //  jQuery("#reportChart").addClass("fade-in");
        //  jQuery("#reportStatistic").addClass("fade-in");
      }, 400));
      }, 400));
      timeouts.push(setTimeout(function () {
        $ionicLoading.hide();
        jQuery("#reportChart").addClass("fade-in");
        jQuery("#reportStatistic").addClass("fade-in");
      }, 2000));
    };
    $scope.saveAndQuit = function () {
      $ionicLoading.show({
        template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
      });

      timeouts.push(setTimeout(function () {
        jQuery("#reportChart").css("opacity", 0).hide();
        jQuery("#reportStatistic").css("opacity", 0).hide();

    //    jQuery("#pager").removeClass("slide-left-from-2-to-3");

        for (var i = 0; i < timeouts.length; i++) {
          clearTimeout(timeouts[i]);
        };
      //  jQuery("#pager").css({ "margin-left": 0 });
        jQuery("#pager").css({ "margin-left": 0 });
        $ionicLoading.hide();

      }, 2000));

    };
    $scope.specifyChartistHeightClass = function (className) {
      jQuery("#report-chart").addClass(className);
    };
    $scope.backWardFrom1To0 = function () {
      timeouts.push(setTimeout(function () {
      //  jQuery("#pager").velocity({ "margin-left": "+=100vw" }, { duration: 300 });
        jQuery("#pager").removeClass("slide-left-from-1-to-2");
        jQuery("#pager").addClass("slide-back-from-1-to-0");
      }, 400));

    };
    $scope.languageConfig = {
      name: "English",
      page1Title: "Pair devices",
      page2Title: "Select a measurement",
      page3Title: "Measuring",
      page4Title: "My report",
    };
    var measuringInterval = undefined;
    var measuringTimeout = undefined;

    $scope.animateMeasuring = function () {
      clearTimeout(measuringTimeout);
      measuringTimeout = undefined;
      $scope.languageConfig.page3Title = "Measuring";
      measuringInterval = $interval(function() {
        $scope.languageConfig.page3Title += ".";
      }, 400, 5);
      measuringTimeout = setTimeout(function() {
        clearInterval(measuringInterval);
        measuringInterval = undefined;
        $scope.animateMeasuring();
      }, 2000);
    };

    $scope.measurements = [
      {
        description: "Ruby Measurement",
        name: "Custom ON - OFF by user",
      },
      {
        description: "Diamond Measurement",
        name: "Defalut OFF after 1 hour",
      },
      {
        description: "Shaphier Measurement",
        name: "Everyday from 6am to 7am",
      },
    ]

  });
});
