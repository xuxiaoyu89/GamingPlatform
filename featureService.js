'use strict';

angular.module('myApp', [])
.controller('PlatformCtrl',
function ($sce, $scope, $rootScope, $log, $window, serverApiService, platformMessageService) {

  var gameID = "5682617542246400";//game id, this is just an example
  var matchID = "4878221707313152";//match id to be used to get a certain match
  var playerID = "5648554290839552";
  var accessSignature = "665eef5138f85e13aa0309aaa0fd8883";
  var myPlayerIndex = 0;//the player who create game will have player index 0
  var numberOfMoves = 0;//number of moves, used to determine if there's any change

  var gameUrl;

  var state;//current game state
  var turnIndex;//current turn index
  var score;//score, if the game ends
  var playersInfo;





//Get game URL
  serverApiService.sendMessage(
    [{getGames: {gameId: gameID}}],//get the game that has id equals to gameID
    function (response) {
      $scope.game = response;
      gameUrl = $scope.game[0]["games"][0].gameUrl;
      $scope.gameUrl = $sce.trustAsResourceUrl(gameUrl);//game url to be used for showing the game in iframe
    });
//====================================================Game URL got





//Update match status and game UI
  function updateStatus() {
    serverApiService.sendMessage(
      //get all the matches that is being played or has been played by this player
      [{getPlayerMatches: {gameId: gameID, getCommunityMatches: false, myPlayerId: playerID, accessSignature: accessSignature}}],
      function (response) {
        //$log.info(response);
        var matches = response[0]["matches"];
        var i;
        //search through all matches to find tha match that has matchID
        for (i = 0; i < matches.length; i ++) {
          if (matches[i].matchId === matchID) {

            playersInfo = matches[i].playersInfo;//info of two players
            state = matches[i].history.stateAfterMoves[length-1];//current game state

            //game is ongoing
            if (matches[i].history.moves[length-1][0].setTurn) {
              turnIndex = matches[i].history.moves[length-1][0].setTurn.turnIndex;
              $scope.gameStatus = "Game ongoing, turn of " + playersInfo[turnIndex].displayName;
            }
            //game ended
            else if (matches[i].history.moves[length-1][0].endMatch) {
              score = matches[i].history.moves[length-1][0].endMatch.endMatchScores;
              //same score, game end in tie
              if (score[0] === score[1]) {
                $scope.gameStatus = "Game ended in a tie";
              }
              //player 0 has higher socre
              else if (score[0] > score[1]) {
                $scope.gameStatus = "Game won by " + playersInfo[0].displayName;
              }
              //player 1 has higher score
              else {
                $scope.gameStatus = "Game won by " + playersInfo[1].displayName;
              }
            }
            break;
          }
        }
        //params to be used in updateUI
        var params = {stateAfterMove: state, turnIndexAfterMove: turnIndex, yourPlayerIndex: myPlayerIndex, playersInfo: playersInfo};
        platformMessageService.sendMessage({updateUI: params});
      });
  }
//====================================================Update completed





//Check if there is any change in match state
  function checkChanges() {
    serverApiService.sendMessage(
      //get all the matches that is being played or has been played by this player
      [{getPlayerMatches: {gameId: gameID, getCommunityMatches: false, myPlayerId: playerID, accessSignature: accessSignature}}],
      function (response) {
        var matches = response[0]["matches"];
        var i;
        //search through all matches to find tha match that has matchID
        for (i = 0; i < matches.length; i ++) {
          if (matches[i].matchId === matchID) {
            //if there is any change, then update status and UI
            if (matches[i].history.moves.length !== numberOfMoves) {
              numberOfMoves = matches[i].history.moves.length;
              updateStatus();
            }
            break;
          }
        }
      });
  }

//====================================================



  //Check changes periodically(every 1sec)
  var interval = setInterval(checkChanges, 1000);

  /*platformMessageService.addMessageListener(function (message) {
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
    platformMessageService.sendMessage({updateUI: params});
  });*/
});