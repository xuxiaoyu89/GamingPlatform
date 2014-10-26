'use strict';

angular.module('myApp', [])
.controller('PlatformCtrl',
function ($sce, $scope, $rootScope, $log, $window, $timeout, serverApiService, platformMessageService, stateService) {

  var gameID = 5682617542246400;//game id, this is just an example
  var matchID;//match id to be used to get a certain match
  var userID;//user id
  
  var gameUrl;

  serverApiService.sendMessage(
      [{getGames: {}}],
      function (response) {
        $scope.games = response;
      });

  $log.info($scope.games);//This doesn't work

  wait();//This works, see below


  function wait() {
    if ($scope.games === undefined) {
      $timeout(function() {wait();}, 200);
    }else{
      done();
    }
  }

  function done() {
    $log.info($scope.games[0]["games"]);
    var i;
    for (i = 0; i < $scope.games[0]["games"].length; i++) {
      if ($scope.games[0]["games"][i].gameId == gameID) {
        gameUrl = $scope.games[0]["games"][i].gameUrl;
        break;
      }
    }
    $scope.gameUrl = $sce.trustAsResourceUrl(gameUrl);
  }





//==========================================================================








  var gotGameReady = false;
  $scope.startNewMatch = function () {
    stateService.startNewMatch();
  };
  $scope.getStatus = function () {
    if (!gotGameReady) {
      return "Waiting for 'gameReady' message from the game...";
    }
    var matchState = stateService.getMatchState();
    if (matchState.endMatchScores) {
      return "Match ended with scores: " + matchState.endMatchScores;
    }
    return "Match is ongoing! Turn of player index " + matchState.turnIndex;
  };
  $scope.playMode = "passAndPlay";
  stateService.setPlayMode($scope.playMode);
  $scope.$watch('playMode', function() {
    stateService.setPlayMode($scope.playMode);
  });

  platformMessageService.addMessageListener(function (message) {
    if (message.gameReady !== undefined) {
      gotGameReady = true;
      var game = message.gameReady;
      game.isMoveOk = function (params) {
        platformMessageService.sendMessage({isMoveOk: params});
        return true;
      };
      game.updateUI = function (params) {
        platformMessageService.sendMessage({updateUI: params});
      };
      stateService.setGame(game);
    } else if (message.isMoveOkResult !== undefined) {
      if (message.isMoveOkResult !== true) {
        $window.alert("isMoveOk returned " + message.isMoveOkResult);
      }
    } else if (message.makeMove !== undefined) {
      stateService.makeMove(message.makeMove);
    }
  });
});