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
    $window.open("laboratory.html", "_blank", 'width=1280,height=680');
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
}]);
