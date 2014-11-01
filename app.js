var myApp = angular.module('myApp', [
'ngRoute',
'myAppControllers'
]);

myApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/menu', {
        templateUrl: 'menu.html',
        controller: 'MenuCtrl'
      }).
      when('/game', {
        templateUrl: 'game.html',
        controller: 'GameCtrl'
      }).
      when('/stats', {
        templateUrl: 'stats.html',
        controller: 'StatsCtrl'
      }).
      otherwise({
        redirectTo: '/menu'
      });
  }]);
