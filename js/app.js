'use strict';

var myApp = angular.module('myApp', [
'ngRoute',
'myAppControllers'
]);

myApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/menu', {
        templateUrl: 'partials/menu.html',
        controller: 'MenuCtrl',
        reloadOnSearch: false
      }).
      when('/game', {
        templateUrl: 'partials/game.html',
        controller: 'GameCtrl'
      }).
      when('/localGame', {
          templateUrl: 'partials/localGame.html',
          controller: 'LocalGameCtrl'
        }).
      when('/stats', {
        templateUrl: 'partials/stats.html',
        controller: 'StatsCtrl'
      }).
      otherwise({
        redirectTo: '/menu'
      });
  }]);
