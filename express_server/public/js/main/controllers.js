var app = angular.module("app")
.controller("mainController", ["$scope", "$http", "$rootScope", "$window", "printService", 'FileSaver', 'Blob', '$location', '$interval', 'socket', function ($scope, $http, $rootScope, $window, printService, FileSaver, Blob, $location, $interval, socket) {

  var innit_login = function() {
    $scope.displayText = "Forgot Password?";
    $scope.displayStyle = "scnd-font-color";
  };
  var login_failed = function() {
    $scope.displayText = "Login unsuccessful ! Please check your email or password.";
    $scope.displayStyle = "material-pink";
  };

  var show_login = function() {
  innit_login();
  $scope.user_email = "";
  $scope.user_password = "";
    jQuery("#divMain").hide();
    jQuery("#divLogin").fadeIn(400);
  };
  var hide_login = function() {
    jQuery("#divLogin").fadeOut(400, function() {
      jQuery("#divMain").fadeIn(400);
    });
  };

  innit_login();

  $scope.performLogin = function() {
      var userInfo = {
        email: $scope.user_email,
        password: $scope.user_password
      };
      if (userInfo.password == 456) {
        login_failed();
      } else {
        $scope.userInfo = userInfo;
        $window.localStorage["cassandra_userInfo"] = JSON.stringify(userInfo);
        hide_login();
      };
    };
  $scope.hide_if_zero = function(array) {
    var len = array.length;
    if (len == 0) {
      return true;
    } else {
      return false;
    };
  };

  $scope.notifications = [
    {
      title: "Version 1.0 publised",
      sender: "Nguyen, Pham",
      action: {
        type: "redirect",
        link: "/personal",
        extra: ""
      }
    },
    {
      title: "New messages received",
      sender: "Hung, Le",
      action: {
        type: "redirect",
        link: "/messages",
        extra: ""
      }
    },
  ];
  $scope.doctors = [];
  $scope.devices = [];
  $scope.messages = [];
  if ($window.localStorage["cassandra_userInfo"]) {
    $scope.userInfo = JSON.parse($window.localStorage["cassandra_userInfo"]);
    hide_login();
    console.log($scope.userInfo);
  };
  $scope.openLaboratory = function() {
    //$location.path("/laboratory");
    $window.open("laboratory.html", "_blank", 'width=1260,height=640');
  };

  $scope.chat_messages = [];

  socket.on("diag_server-welcome-new-user", function(data) {
    var chat_messgae = {
      name: "Server",
      style: "",
      content: "Hello",
      time: new Date()
    };
    $scope.chat_messages.push(chat_messgae);
  });

}])
.controller("personalController", ["$scope", "$http", "$rootScope", "$window", "printService", 'FileSaver', 'Blob', '$location', function ($scope, $http, $rootScope, $window, printService, FileSaver, Blob, $location) {
  console.log("personal");
  if ($window.localStorage["cassandra_userInfo"]) {
    $scope.userInfo = JSON.parse($window.localStorage["cassandra_userInfo"]);
  };
  if ($window.localStorage["cassandra_my_ehealth"]) {
    $scope.ehealth = JSON.parse($window.localStorage["cassandra_my_ehealth"]);
  } else {
    $scope.ehealth = {
      fullname: "Pham Khoi Nguyen",
      date_of_birth: "",
      mssid: "VN-HCM-5400KB",
      sex: "Male",
      occupation: "",
      email: $scope.userInfo.email,
      phone: "",
      country: "",
      city: "",
      address_line_1: "",
      address_line_2: "",
      my_doctors: [
        {
          fullname: "Aurora Anfredyla",
          dssid: "US-MANS-4218LA",
          specity: "Heart disease department",
          work_address: "Arizona state hospital, Losangeles, US",
          phone: "+ (32) 916 112 985",
          email: "auro.andres@arizo.com",
        },
      ],
      location: {lat: "", lng: ""},
      medical_history: {
        history_stroke: false,
        obesity: false,
        high_blood_pressure: false,
        alcoholism: false,
      },
      clinical_symptoms: {
        chest_pain: true,
        shortness_of_breath: false,
        severe_sweating: true,
        dizziness: false,
      },
    };
  };
  $scope.updateInfo = function() {
    $window.localStorage["cassandra_my_ehealth"] = JSON.stringify($scope.ehealth);
  };
  var handle_geolocation = function(position) {

  };
  $scope.get_current_location = function() {
    navigator.geolocation.getCurrentPosition(function success(position) {
      $scope.ehealth.location.lat = position.coords.latitude;
      $scope.ehealth.location.lng = position.coords.longitude;
      console.log(position.coords.longitude);
    }, function error(error) {
      alert("This software version does not support geolocation");
    });
  };

  $scope.init_google_map = function() {
    // var uluru = {lat: -25.363, lng: 131.044};
    var map = new google.maps.Map(document.getElementById('google-map'), {
      zoom: 4,
      center: $scope.ehealth.location
    });
    var marker = new google.maps.Marker({
      position: $scope.ehealth.location,
      map: map
    });
  };
  // $scope.get_current_location();
  // $scope.init_google_map();
  $scope.test = function() {
    console.log($scope.ehealth.clinical_symptoms.dizziness);
  }
}])
.controller("recordsController", ["$scope", "$http", "$rootScope", "$window", "printService", 'FileSaver', 'Blob', '$location', '$interval', 'socket', '$timeout', function ($scope, $http, $rootScope, $window, printService, FileSaver, Blob, $location, $interval, socket, $timeout) {
  $scope.init_chart = function(normal, risk, danger) {
    var chart = new Chartist.Pie('.ct-chart', {
      series: [normal, risk, danger],
      labels: ["Normal", "Risk", "Danger"]
    }, {
      donut: true,
      donutWidth: 42,
      startAngle: 340,
      showLabel: false
    });
    chart.on('draw', function(data) {
      if(data.type === 'slice') {
        // Get the total path length in order to use for dash array animation
        var pathLength = data.element._node.getTotalLength();

        // Set a dasharray that matches the path length as prerequisite to animate dashoffset
        data.element.attr({
          'stroke-dasharray': pathLength + 'px ' + pathLength + 'px'
        });

        // Create animation definition while also assigning an ID to the animation for later sync usage
        var animationDefinition = {
          'stroke-dashoffset': {
            id: 'anim' + data.index,
            dur: 900,
            from: -pathLength + 'px',
            to:  '0px',
            easing: Chartist.Svg.Easing.easeOutQuint,
            // We need to use `fill: 'freeze'` otherwise our animation will fall back to initial (not visible)
            fill: 'freeze'
          }
        };

        // If this was not the first slice, we need to time the animation so that it uses the end sync event of the previous animation
        if(data.index !== 0) {
          animationDefinition['stroke-dashoffset'].begin = 'anim' + (data.index - 1) + '.end';
        }

        // We need to set an initial value before the animation starts as we are not in guided mode which would do that for us
        data.element.attr({
          'stroke-dashoffset': -pathLength + 'px'
        });

        // We can't use guided mode as the animations need to rely on setting begin manually
        // See http://gionkunz.github.io/chartist-js/api-documentation.html#chartistsvg-function-animate
        data.element.animate(animationDefinition, false);
      }
    });

    // For the sake of the example we update the chart every time it's created with a delay of 8 seconds
    chart.on('created', function() {
      if(window.__anim21278907124) {
        clearTimeout(window.__anim21278907124);
        window.__anim21278907124 = null;
      };

    });
  };
  $scope.timer = 0;
  $scope.selected_index = -1;
  if ($window.localStorage["cassandra_records"]) {
    $scope.records = JSON.parse($window.localStorage["cassandra_records"]);
  } else {
    $scope.records = [
      {
        name: "T wave inverted + Arrythmia-100 stay caution",
        date: new Date(),
        fs: 360,
        dur: 60,
        data_link: "http://localhost:2000/bin/saved-records/Tinv.txt",
        description: "1 minute stress test",
        clinical_symptoms: {
          chest_pain: false,
          shortness_of_breath: true,
          severe_sweating: true,
          dizziness: false,
        },
        statistics: [0, 90, 10],
        send_to_doctor: false
      },
      {
        name: "Small ST deviation",
        date: new Date(),
        data_link: "http://localhost:2000/bin/saved-records/small_STD.txt",
        description: "1 minutes of dizziness and sweating",
        clinical_symptoms: {
          chest_pain: false,
          shortness_of_breath: false,
          severe_sweating: true,
          dizziness: true,
        },
        statistics: [80, 20, 0],
        send_to_doctor: false
      },
      {
        name: "Healthy ECG",
        date: new Date(),
        data_link: "http://localhost:2000/bin/saved-records/healthy_ECG.txt",
        description: "My 1 minute ECG while relaxing and watching movies",
        clinical_symptoms: {
          chest_pain: false,
          shortness_of_breath: false,
          severe_sweating: false,
          dizziness: false,
        },
        statistics: [100, 0, 0],
        send_to_doctor: false
      },
      {
        name: "Transient T peaked",
        date: new Date(),
        data_link: "http://localhost:2000/bin/saved-records/transient_T_peak.txt",
        description: "My 1 minute ECG data during treadmill test",
        clinical_symptoms: {
          chest_pain: false,
          shortness_of_breath: false,
          severe_sweating: false,
          dizziness: false,
        },
        statistics: [30, 60, 10],
        send_to_doctor: false
      },
      {
        name: "Suspected NSTEMI",
        date: new Date(),
        data_link: "http://localhost:2000/bin/saved-records/suspected_NSTEMI.txt",
        description: "Hard to breath at night",
        clinical_symptoms: {
          chest_pain: true,
          shortness_of_breath: true,
          severe_sweating: true,
          dizziness: false,
        },
        statistics: [10, 40, 50],
        send_to_doctor: false
      },
      {
        name: "Arrythmia-100",
        date: new Date(),
        data_link: "http://localhost:2000/bin/saved-records/arrythmia_100.txt",
        description: "Resting ECG while listening to music",
        clinical_symptoms: {
          chest_pain: false,
          shortness_of_breath: false,
          severe_sweating: false,
          dizziness: false,
        },
        statistics: [90, 10, 0],
        send_to_doctor: false
      },
      {
        name: "Transient ST devation",
        date: new Date(),
        data_link: "http://localhost:2000/bin/saved-records/transient_ST_deviation.txt",
        description: "My ECG while driving in heavy traffic",
        clinical_symptoms: {
          chest_pain: false,
          shortness_of_breath: false,
          severe_sweating: false,
          dizziness: false,
        },
        statistics: [30, 60, 10],
        send_to_doctor: false
      },
    ];
    $window.localStorage["cassandra_records"] = JSON.stringify($scope.records);
  };
  // $scope.last_index = $scope.records.length - 1;
  // var last_record_id = $scope.records.length - 1;
  // $scope.selected_record = $scope.records[last_record_id];
  // $scope.init_chart($scope.selected_record.statistics[0], $scope.selected_record.statistics[1], $scope.selected_record.statistics[2]);
  $scope.selected_record = {
    name: "No records hovered",
    statistics: [0, 0, 0],
  };
  $scope.cancel_all_timeouts_and_intervals = function() {
    if ($scope.hover_record_timeout) {
      $timeout.cancel($scope.hover_record_timeout);
      $scope.hover_record_timeout = null;
    };
    if ($scope.timer_interval) {
      $interval.cancel($scope.timer_interval);
      $scope.timer_interval = null;
    };
  };
  $scope.display_record_statistics = function(index) {
      $scope.timer = 1;
      $scope.timer_interval = $interval(function() {
        if ($scope.timer > 0) {
          $scope.timer += 1;
        };
        if ($scope.timer == 6) {
          if ($scope.selected_index >= 0) {
            if (index != $scope.selected_index) {
              $scope.selected_record = $scope.records[index];
              $scope.init_chart($scope.selected_record.statistics[0], $scope.selected_record.statistics[1], $scope.selected_record.statistics[2]);
              $scope.cancel_all_timeouts_and_intervals();
              $scope.selected_index = index;
            }
          } else {
            $scope.selected_record = $scope.records[index];
            $scope.init_chart($scope.selected_record.statistics[0], $scope.selected_record.statistics[1], $scope.selected_record.statistics[2]);
            $scope.cancel_all_timeouts_and_intervals();
            $scope.selected_index = index;
          }
        };
      }, 160);
  };
  $scope.mouse_leave_this_record = function() {
    $scope.timer = 0;
    $scope.cancel_all_timeouts_and_intervals();
  };
  $scope.view_this_signal = function(index) {
    // index = $scope.records.length - 1 - index;
    $window.localStorage["cassandra_command_lab_to_run_this_signal"] = $scope.records[index].data_link;
    $window.open("laboratory.html", "_blank", 'width=1260,height=640');
    console.log("Location to record");
  };
  $scope.delete_this_record = function(index) {
    if (confirm("Delete record ?")) {
      $scope.records.splice(index, 1);
      $window.localStorage["cassandra_records"] = JSON.stringify($scope.records);
    };
  };
}]);
