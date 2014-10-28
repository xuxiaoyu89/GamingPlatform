'use strict';

angular.module('myApp', [])
.controller('PlatformCtrl',
function ($sce, $scope, $rootScope, $log, $window, serverApiService, platformMessageService) {

  /**
   *
   *the below variables which are marked as * will be got dynamically from platform or local storage
   *currently hard coded for testing purpose
   *
   */

  var gameID = "5682617542246400";//*
  var matchID = "5757715179634688";//*
  var playerID = "5648554290839552";//*
  var accessSignature = "665eef5138f85e13aa0309aaa0fd8883";//*
  var myPlayerIndex = 0;//*

  var gameUrl;

  var state;//current game state
  var turnIndex;//current turn index
  var playersInfo;



//Get game URL every time the webpage is loaded

  serverApiService.sendMessage(
    [{getGames: {gameId: gameID}}],//get the game that has id equals to gameID
    function (response) {
      $scope.game = response;
      gameUrl = $scope.game[0]["games"][0].gameUrl;
      $scope.gameUrl = $sce.trustAsResourceUrl(gameUrl);//game url to be used for showing the game in iframe
    });
//====================================================



//Check changes periodically(every 1sec)
var interval = setInterval(checkChanges, 1000);



//function for updating match status and game UI

  function updateStatus() {
    serverApiService.sendMessage(
      //get all the matches that is being played or has been played by this player
      [{getPlayerMatches: {gameId: gameID, getCommunityMatches: false, myPlayerId: playerID, accessSignature: accessSignature}}],
      function (response) {
        var matches = response[0]["matches"];

        //search through all matches to find tha match that has matchID
        var i;
        for (i = 0; i < matches.length; i ++) {
          if (matches[i].matchId === matchID) {
            playersInfo = matches[i].playersInfo;//info of two players

            var states = matches[i].history.stateAfterMoves;//all the states
            state = states[states.length-1];//current game state

            var moves = matches[i].history.moves;//all the moves

            //update status

            //game is ongoing
            if (moves[moves.length-1][0].setTurn) {
              turnIndex = moves[moves.length-1][0].setTurn.turnIndex;
              $scope.gameStatus = "Game ongoing, turn of " + playersInfo[turnIndex].displayName;
            }
            //game ended
            else if (moves[moves.length-1][0].endMatch) {
              var score = moves[moves.length-1][0].endMatch.endMatchScores;
              //same score, game ends in tie
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

        //update UI
        var params = {stateAfterMove: state, turnIndexAfterMove: turnIndex, yourPlayerIndex: myPlayerIndex, playersInfo: playersInfo};
        platformMessageService.sendMessage({updateUI: params});
      });
  }
//====================================================



//function for checking if there is any change in match state

  var numberOfMoves;//number of moves, used to determine if there's any change
  function checkChanges() {
    serverApiService.sendMessage(
      //get all the matches that is being played or has been played by this player
      [{getPlayerMatches: {gameId: gameID, getCommunityMatches: false, myPlayerId: playerID, accessSignature: accessSignature}}],
      function (response) {
        var matches = response[0]["matches"];
        //search through all matches to find tha match that has matchID
        var i;
        for (i = 0; i < matches.length; i ++) {
          if (matches[i].matchId === matchID) {
            //if there is a mismatch between local numberOfMoves and match history moves length, then update status and UI
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



//platform listen to iframe for player's moves

  var move;//move made by player
  platformMessageService.addMessageListener(function (message) {
    //iframe send a move to platform
    if (message.makeMove !== undefined) {
      move = message.makeMove;//store the move locally, will be sent to server if isMoveOk
      var params = {move: move, turnIndexBeforeMove: turnIndex, turnIndexAfterMove: move[0].setTurn.turnIndex, stateBeforeMove: state, stateAfterMove: {}};
      platformMessageService.sendMessage({isMoveOk: params});//let iframe check isMoveOk, will hear back from iframe
    }
    //iframe finish checking isMoveOk and send the result to platform
    else if (message.isMoveOkResult !== undefined) {
      //move is ok, send it to server
      if (message.isMoveOkResult === true) {
        serverApiService.sendMessage(
          [{madeMove: {matchId: matchID, move: move, moveNumber: numberOfMoves, myPlayerId: playerID, accessSignature: accessSignature}}],
          function (response) {
            //$log.info("message sent back from madeMove: ",response);
          });
      }
      //illegal move
      else {
        throwError("You declared a hacker for a legal move! move=" + move);
      }
    }
  });
//====================================================
});