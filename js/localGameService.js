//create game service
'use strict'; 

angular.module('myApp')
.service('localGameService', function($rootScope, $log, $window, $interval, stateService, serverApiService, platformMessageService) {

  
  this.clearInterval = function() {
    if($rootScope.menu_interval !== undefined){
      $interval.cancel($rootScope.menu_interval);
    }
  }

  //===================== JS_ERROR_CATCHING ====================//
  // Quick function to both alert and log requested message as error
  function alert_log_error(alert, log) {
    $log.error("Alert & Log Error: ", log);
    return;
  }
  
  var MENU_URL = '#/menu';
  var gameID;
  var playMode;
  var platformUrl;
  var platformUrl2;
  
  var gameStatus = "Loading game, please wait";
  
  this.setLocalGame = function(entireUrl){
    var hashedUrl = entireUrl.split('#')
    var beforeHashUrl = hashedUrl[0];
    $log.info("beforeHash URL: ", beforeHashUrl);
    MENU_URL=beforeHashUrl.concat(MENU_URL);
    $log.info("Menu URL: ", MENU_URL);
    
    platformUrl = hashedUrl[1].split('?');
    $log.info("Platform URL: ", platformUrl);
  
    if (platformUrl.length <2) {
        alert_log_error("URL Invalid.", "Required URL Format: ...#/game?matchid=1&gameid=2");
    } else {
      platformUrl2 = platformUrl[1];
      $log.info("Platform URL2: ", platformUrl2);
    }
    //Split URL and pull params
    var parsedurl = platformUrl2.split('&');
    $log.info("Parsed URL: ", parsedurl);
    var subparse;
    var i;
    for (i = 0; i < parsedurl.length; i++) {
        subparse = parsedurl[i].split('=');
        if (subparse.length === 2) {
            if (subparse[0].toLowerCase() === 'playmode') {
                playMode = subparse[1];
                stateService.setPlayMode(playMode);
            } else if (subparse[0].toLowerCase() === 'gameid') {
                gameID = subparse[1];
            }
        }
    }
  }

  this.fetchGameUrl = function (callback) {
    $log.info("localGameService getGameUrl");
    serverApiService.sendMessage(
      [{getGames: {gameId: gameID}}],
      function (response) {
        $log.info("getGameUrl response in local game:",response);
        var gameUrl = response[0].games[0].gameUrl;
        $log.info("fetchGameUrldev in local game:",gameUrl);
        callback(gameUrl);
      });
  }
  
  this.getGameStatus = function(){
    return gameStatus;
  }
  
  this.getImage0 = function(){
    
    return "img/a3.png";
  }
  this.getImage1 = function(){
    if (playMode === "playAgainstTheComputer"){
      return "img/computer.png";
    }
    return "img/a2.png";
  }
  this.getPlayer0 = function(){
    if(playMode === "playAgainstTheComputer"){
      return "you";
    }
    else{
      return "Player1";
    }
  }
  this.getPlayer1 = function(){
    if(playMode === "playAgainstTheComputer"){
      return "computer";
    }
    return "player2";
  }
  
  //stateService.startNewMatch();
  //$log.info("before setPlayMode!!!!!!!!!!!!!!", playMode);
  //stateService.setPlayMode(playMode);
  
  platformMessageService.addMessageListener(function (message) {
    if (message.gameReady !== undefined) {
      $log.info("gameReady message: ");
      //gotGameReady = true;
      if (playMode === "playAgainstTheComputer"){
        gameStatus = "game ongoing, it's your turn"; 
      }
      else gameStatus = "game ongoing, it's player1's turn";
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
        //$window.alert("isMoveOk returned " + message.isMoveOkResult);
      }
    } else if (message.makeMove !== undefined) {
      var currMove = message.makeMove;
      if(currMove[0].endMatch !== undefined){
        gameStatus = "game ended";
      }
      
      if(currMove[0].setTurn !== undefined){
        if(currMove[0].setTurn.turnIndex == 1){
          if(playMode === "playAgainstTheComputer"){
            gameStatus = "game ongoing, it's the computer's turn";
          }
          else{
            gameStatus = "game ongoing, it's player2's turn";
          }
        }
        else{
          if(playMode === "playAgainstTheComputer"){
            gameStatus = "game ongoing, it's your turn";
          }
          else {
            gameStatus = "game ongoing, it's player1's turn";
          }
        }
      }
      stateService.makeMove(message.makeMove);
    } else {
      //$window.alert("Platform got: " + angular.toJson(message, true));
    }
  });
  


});
