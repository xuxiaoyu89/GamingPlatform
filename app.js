var myApp = angular.module('myApp', [
'ngRoute',
'myAppControllers'
]);

myApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('menu', {
        templateUrl: 'menu.html',
        controller: 'MenuCtrl'
      }).
      when('game/gameId/:gameId', { //index.html#/game/gameId/xxx
        templateUrl: 'game.html',
        controller: 'GameCtrl'
      }).
      when('game/gameId/:gameId/matchId/:matchId', { //index.html#/game/gameId/xxx/matchId/xxx
        templateUrl: 'game.html',
        controller: 'GameCtrl'
      }).
      otherwise({
        redirectTo: 'menu'
      });
  }]);
