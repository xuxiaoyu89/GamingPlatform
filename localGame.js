'use strict';

myAppControllers
.controller('localGameCtrl',
function ($sce, $scope, $rootScope, $log, $window, $routeParams, serverApiService, stateService, platformMessageService) {
	function parseURL() {
	    //BASIC URL PARSING
	    var hashedUrl = entireUrl.split('#')
	    beforeHashUrl = hashedUrl[0];
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
	            if (subparse[0].toLowerCase() === 'matchid') {
	                $scope.matchID = subparse[1];
	            } else if (subparse[0].toLowerCase() === 'gameid') {
	                $scope.gameID = subparse[1];
	            }
	        }
	    }
    }
	parseURL();
});
