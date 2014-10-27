'use strict';

angular.module('myApp', [])
.controller('PlatformCtrl',
function ($sce, $scope, $rootScope, $log, $window, platformMessageService, stateService, serverApiService) {

  var platformUrl = $window.location.search;
  $log.info("Platform URL: ", platformUrl);
  
  var gameUrl = platformUrl.length > 1 ? platformUrl.substring(1) : null;
  $log.info("Game URL: ", gameUrl);
  if (gameUrl === null) {
    $log.error("You must pass a url like this: http://rshen1993.github.io/GamingPlatform/platform_game.html?userid=123&matchid=123");
    $window.alert("You must pass a url like this: http://rshen1993.github.io/GamingPlatform/platform_game.html?userid=123&matchid=123");
    return;
  }
  
  var parsedurl = gameUrl.split('&');
  $log.info("Parsed URL: ", parsedurl);
  var userid;
  var matchid;
  if (parsedurl.length === 2) {
      userid = parsedurl[0];
      matchid = parsedurl[1];
      $log.info("User ID: ", userid);
      $log.info("Match ID: ", matchid);
  } else {
      $window.alert("You must pass a url like this: http://rshen1993.github.io/GamingPlatform/platform_game.html?userid=123&matchid=123");
      return;
  }
  
  
  $scope.gameUrl = $sce.trustAsResourceUrl(gameUrl);
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


    //END GAME
    $scope.endGame = function () {
        var matchState = stateService.getMatchState();
        
        matchState.endMatchScores = [0, 1];
        // Set match to end game???
        $location.path('platform_menu.html');
    };
    //============END GAME
    //DELETE GAME
    $scope.isEndGame = function () {
        var matchState = stateService.getMatchState();
        if (matchState.endMatchScores) {
            return true;
        }
        return false;
    };
    $scope.deleteGame = function () {
        if(!$scope.isEndGame()) {
            
        }
        var dismissMatch = {matchID: "",
            myPlayerId: "",
            accessSignature: ""
                };
        $location.path('platform_menu.html');
    };
    //============DELETE GAME



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
