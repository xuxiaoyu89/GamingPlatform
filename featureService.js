'use strict';

angular.module('myApp', [])
.controller('PlatformCtrl',
function ($sce, $scope, $rootScope, $log, $window, serverApiService, platformMessageService, stateService) {

  var gameID = "5682617542246400";//game id, this is just an example
  var matchID = "4878221707313152";//match id to be used to get a certain match
  var playerID = "5648554290839552";//player id
  var accessSignature = "665eef5138f85e13aa0309aaa0fd8883";

  var gameUrl;
  var gameStatus;

//Get game URL
  serverApiService.sendMessage(
    [{getGames: {gameId: gameID}}],
    function (response) {
      $scope.game = response;
      gameUrl = $scope.game[0]["games"][0].gameUrl;
      $scope.gameUrl = $sce.trustAsResourceUrl(gameUrl);
    });
//====================================================Game URL got

//Get match status  
  serverApiService.sendMessage(
    [{getPlayerMatches: {gameId: gameID, getCommunityMatches: false, myPlayerId: playerID,accessSignature: accessSignature}}],
    function (response) {
      var matches = response[0]["matches"];
      for (var i = 0; i < matches.length; i ++) {
        if (matches[i].matchId === matchID) {
          gameStatus = matches[i].history.moves[length-1][0];
          if (matches[i].history.moves[length-1][0].setTurn) {
            $log.info()
          }
        }
      }
    });
//====================================================


  






  /*var gotGameReady = false;
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
  });*/
});