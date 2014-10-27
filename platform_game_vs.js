'use strict';

angular.module('myApp', [])
.controller('PlatformCtrl',
function ($sce, $scope, $rootScope, $log, $window, platformMessageService, stateService, serverApiService) {

  //Pull IDs from URL
  var platformUrl = $window.location.search;
  $log.info("Platform URL: ", platformUrl);
  
  var gameUrl = platformUrl.length > 1 ? platformUrl.substring(1) : null;
  $log.info("Game URL: ", gameUrl);
  if (gameUrl === null) {
    $log.error("You must pass a url like this: http://rshen1993.github.io/GamingPlatform/platform_game.html?userid=123&matchid=123");
    $log.error("Invalid URL.");
    $window.alert("You must pass a url like this: http://rshen1993.github.io/GamingPlatform/platform_game.html?userid=123&matchid=123");
    return;
  }
  
  var parsedurl = gameUrl.split('&');
  $log.info("Parsed URL: ", parsedurl);
  if (parsedurl.length<2) {
      $log.error("Not enough params in URL");
      $window.alert("You must pass a url like this: http://rshen1993.github.io/GamingPlatform/platform_game.html?userid=123&matchid=123");
      return;
  }
  var subparse, userid, matchid;
  var i;
  for(i=0; i<parsedurl.length; i++) {
      subparse = parsedurl[i].split('=');
      if(subparse.length===2) {
          if(subparse[0]==='userid') {
              userid=subparse[1];
              $log.info("USERID: ", userid)
          } else if(subparse[0]==='matchid') {
              matchid=subparse[1];
              $log.info("MATCHID: ", matchid)
          }
          //==========ANY OTHER IDs?============//
      }
  }
  if(userid===undefined || matchid===undefined) {
      $log.error("USERID or MATCHID could not be determined from URL.");
      $window.alert("You must pass a url like this: http://rshen1993.github.io/GamingPlatform/platform_game.html?userid=123&matchid=123");
      return;
  }

  // GET GAME/MATCH
  serverApiService.sendMessage(
      [{getGames: {gameId: gameID}}],
      function (response) {
        $scope.game = response;
      });
  
  
    
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
