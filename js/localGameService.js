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

});
