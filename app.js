var myApp = angular.module('myApp', [
'ngRoute',
'myAppControllers'
]);

myApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/menu', {
        templateUrl: 'menu.html',
        controller: 'MenuCtrl',
        reloadOnSearch: false
      }).
      when('/game', {
        templateUrl: 'game.html',
        controller: 'GameCtrl'
      }).
      when('/localGame', {
          templateUrl: 'localGame.html',
          controller: 'localGameCtrl'
        }).
      when('/stats', {
        templateUrl: 'stats.html',
        controller: 'StatsCtrl'
      }).
      otherwise({
        redirectTo: '/menu'
      });
  }]);
