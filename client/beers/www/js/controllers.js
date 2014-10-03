angular.module('starter.controllers', [])

.controller('AppCtrl', function($rootScope, $scope, $ionicModal, $timeout, $http, $ionicPlatform) {
  $rootScope.apiURL = "http://178.62.27.239:8080/api/"; //"http://localhost:8080/api/"; //

  // Form data for the login modal
  $scope.loginData = {};
  $scope.types = [];

  // Create the login modal that we will use later

  $ionicPlatform.ready(function() {
    if (typeof device != "undefined")
    {
      $rootScope.uuid = device.uuid;
    }
  });

  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $http.get($rootScope.apiURL + "types")
    .success(function(data) {
      if (data) $scope.types = data;
    });

  $http.get($rootScope.apiURL + "breweries")
    .success(function(data) {
      if (data) $scope.breweries = data;
    });

  $rootScope.myVotes = JSON.parse(window.localStorage.getItem("myvotes") || "{}");

  $rootScope.yourScore = function (drinkId) {
    var out = 0;
    out = $rootScope.myVotes[drinkId] || 0;
    return out;
  }

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('BrowseCtrl', function($rootScope, $scope, $http, $stateParams, $ionicLoading) {
  $scope.data = [];
  $scope.filterText = "";
  $scope.filter = { name: "" };
  $scope.query = null;
  $scope.header = "All Drinks";

  if (!!$stateParams.typeId)
  {
    $scope.query = { "type" : $stateParams.typeId };
    $scope.header = $stateParams.typeId;
  }
  else if (!!$stateParams.breweryId)
  {
    $scope.query = { "brewery" : $stateParams.breweryId };
    $scope.header = $stateParams.breweryId;
  }
  else if (!!$stateParams.top)
  {
    $scope.header = "Top Rated";
  }
  else if (!!$stateParams.mine)
  {
    $scope.header = "My Votes";
  }

  $scope.viewDrink = function(drinkId) {
    window.location.hash = "#/app/drink/" + drinkId;
  };

  $scope.getData = function() {
    function _proc (data)
    {
      for (var i=0; i < data.length; i++)
      {
        data[i].name = data[i].no + " : " + data[i].name;
        data[i].my = $rootScope.yourScore(data[i]._id);
      }
    }
    $ionicLoading.show({
      template: 'Loading...'
    });
    if ($scope.query)
    {
      $http.post($rootScope.apiURL + "drinks/query", $scope.query)
        .success(function(data) {
          _proc(data);
          if (data) $scope.data = data;
        })
        .finally(function() {
          $ionicLoading.hide();
          $scope.$broadcast('scroll.refreshComplete');
        });
    }
    else if (!!$stateParams.top) {
      $http.get($rootScope.apiURL + "drinks/top")
        .success(function(data) {
          _proc(data);
          if (data) $scope.data = data;
        })
        .finally(function() {
          $ionicLoading.hide();
          $scope.$broadcast('scroll.refreshComplete');
        });
    }
    else if (!!$stateParams.allType) {
      var q = {};
      if ($stateParams.allType == "beer")
      {
        q = { "type": { "$ne": "cider" } };
      }
      else
      {
        q = { "type": "cider" };
      }
      $http.post($rootScope.apiURL + "drinks/query", q)
        .success(function(data) {
          _proc(data);
          if (data) $scope.data = data;
        })
        .finally(function() {
          $ionicLoading.hide();
          $scope.$broadcast('scroll.refreshComplete');
        });
    }
    else if (!!$stateParams.mine) {
      $http.post($rootScope.apiURL + "drinks/my", { user: $rootScope.uuid })
        .success(function(data) {
          _proc(data);
          if (data) $scope.data = data;
        })
        .finally(function() {
          $ionicLoading.hide();
          $scope.$broadcast('scroll.refreshComplete');
        });
    }
    else
    {
      $http.get($rootScope.apiURL + "drinks")
        .success(function(data) {
          _proc(data);
          if (data) $scope.data = data;
        })
        .finally(function() {
          $ionicLoading.hide();
          $scope.$broadcast('scroll.refreshComplete');
        });
    }
  };

  $scope.getData();
})

.controller('DrinkCtrl', function($rootScope, $scope, $http, $stateParams, $ionicLoading, $timeout) {
  $scope.data = [];
  $scope.displayScore = 0;
  $scope.voted = false;

  $scope.highLight = function(num, type) {
    var cls = "not-scored";
    type = type || "my";
    if (type == "my")
    {
      if ($scope.displayScore >= num)
      {
        cls = "voted";
      }
    }
    else
    {
      if ($scope.data.avg >= num)
      {
        cls = "scored";
      }
    }
    return cls;
  }

  $scope.getData = function() {
    $http.get($rootScope.apiURL + "drinks/" + $stateParams.drinkId)
      .success(function(data) {
        if (data) {
          $scope.data = data;
          $scope.displayScore = $rootScope.myVotes[$stateParams.drinkId] || data.avg;
          $scope.voted = !!$rootScope.myVotes[$stateParams.drinkId];
          $timeout(function() {
            for (var i=1; i < 6; i++) $scope.highLight(i);
          }, 100);
        }
      })
      .finally(function() {

      });
  };

  $scope.rate = function(score) {
    var vote = {
      drinkId: $scope.data._id,
      score: score,
      user: $rootScope.uuid
    };

    if ($scope.voted) return false;

    if (confirm("Do you really wish to vote " + score + " for " + $scope.data.name + "?")) {
      $ionicLoading.show({
        template: 'Voting...'
      });
      $http.post($rootScope.apiURL + "vote", vote)
        .finally(function() {
          $rootScope.myVotes[$scope.data._id] = score;
          $scope.displayScore = score;
          $scope.voted = true;
          window.localStorage.setItem("myvotes", JSON.stringify($rootScope.myVotes));
          $timeout(function() {
            for (var i=1; i < 6; i++) $scope.highLight(i);
            $ionicLoading.hide();
          }, 100);

        });
    }
  };

  $scope.getData();
})

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
});
