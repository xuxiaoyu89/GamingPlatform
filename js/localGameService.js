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
        gameUrl = response[0].games[0].gameUrl;
        $log.info("fetchGameUrldev in local game:",gameUrl);
        callback(gameUrl);
      });
  }


});
