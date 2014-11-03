'use strict';

myAppControllers
.controller('localGameCtrl',
function ($sce, $scope, $rootScope, $log, $window, $routeParams, serverApiService, stateService, platformMessageService) {
	
	$scope.gameUrl = window.localStorage.getItem("gameURL");
	var entireUrl = $window.location.href;
    $log.info("entireUrl: ", entireUrl);
    var beforeHashUrl; //URL: http://rshen1993.github.io/GamingPlatform/index.html?on=AUTO_MATCH,EMAIL_JS_ERRORS
    var platformUrl; //URL: ?matchid=5757715179634688&gameid=5682617542246400
    var platformUrl2; //removes ?, URL: matchid=5757715179634688&gameid=5682617542246400
    var MENU_URL = '#/menu';
	function parseURL() {
	    //BASIC URL PARSING
	    var hashedUrl = entireUrl.split('#');
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
	        	$scope.gameID = subparse[1];
	        }
	    }
    }
	parseURL();
	$scope.playMode = "playAgainstTheComputer";
	stateService.setPlayMode($scope.playMode);
	
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
	    } else {
	      $window.alert("Platform got: " + angular.toJson(message, true));
	    }
	  });
	
	$scope.leaveGame = function () {
	   
	};

	//===================== MATCH_MENU: DELETE GAME ===============//
	$scope.deleteGame = function () {
	    
	};
});
