//create game service
'use strict'; 

angular.module('myApp')
.service('localGameService', function($rootScope, $log, $window, $interval, stateService, platformMessageService) {

  
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
