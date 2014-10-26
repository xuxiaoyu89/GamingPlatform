'use strict';

angular.module('myApp', [])
.controller('PlatformCtrl',
function ($sce, $scope, $rootScope, $log, $window,$timeout, $location,
	 platformMessageService, stateService, serverApiService) {
	   
	// initialize icon pool  
  var avatarPool = [];
  avatarPool.push("http://upload.wikimedia.org/wikipedia/commons/f/f6/Choice_toxicity_icon.png");
  avatarPool.push("http://icons.iconarchive.com/icons/iconshock/free-folder/256/folder-customer-icon.png");
  avatarPool.push("https://cdn4.iconfinder.com/data/icons/artcore/512/firefox.png");
  avatarPool.push("http://upload.wikimedia.org/wikipedia/commons/d/d5/Apple_icon_1.png");
  avatarPool.push("http://img0.pconline.com.cn/pconline/1312/27/4072897_49_thumb.gif");
  avatarPool.push("http://www.qqw21.com/article/UploadPic/2012-7/2012710173349335.jpg");
  avatarPool.push("http://p1.qq181.com/cms/120507/2012050705565179943.jpg");
    
  var myPlayerId, accessSignature;
  $scope.displayName, $scope.avatarImageUrl;  
  
  /* Create a user, if necessary, by sending registerPlayer message
   * Store/Check any player information in local storage
   * Initialize closure value: *myPlayerId*, *accessSignature*
   * Initialize $scope value: displayName, avatarImageUrl   */
  var playerInfo = window.localStorage.getItem("playerInfo");
  if (playerInfo === undefined){
  	var myName = "guest" + Math.floor(Math.random() *  100000 );
  	var myAvatar = avatarPool[Math.floor(Math.random() * avatarPool.length)];
  	serverApiService.sendMessage(
        [{registerPlayer:{displayName: myName, avatarImageUrl: myAvatar}}],
        function (response) {
        	var playerInfo = angular.toJson(response[0].playerInfo, true);
        	window.localStorage.setItem("playerInfo", angular.toJson(playerInfo));
        	myPlayerId = playerInfo.myPlayerId;
        	accessSignature = playerInfo.accessSignature;
        	$scope.displayName = playerInfo.displayName;
        	$scope.avatarImageUrl = playerInfo.avatarImageUrl;
        });
  }else{
  	myPlayerId = playerInfo.myPlayerId;
    accessSignature = playerInfo.accessSignature;
    $scope.displayName = playerInfo.displayName;
    $scope.avatarImageUrl = playerInfo.avatarImageUrl;
  }
  
  //for global setting
  var AUTO_MATCH = true;
  var EMAIL_JS_ERRORS = true;
  //for selected game
  var gameId;
  var gameUrl;
  var gameName;
  var gameDmail;
  
  /* $scope.gamesPool stores a list of games retrived from server
   * for each element in gamesPool: 
   * {gameId: ..., gameUrl:..., GameName:..., gameDeveloperEmail:...}*/
  $scope.gamesPool = [];
  serverApiService.sendMessage([{getGames: {}}], function(games){
  	var tempList = games[0].games;
  	for(var i=0; i<tempList.length; i++){
  		if(tempList[i].gameUrl === undefined)
  			continue;
  		$scope.gamesPool.push({gameId: tempList[i].gameId, gameUrl: tempList[i].gameUrl, 
  			GameName:tempList[i].languageToGameName.en, 
  			gameDeveloperEmail: tempList[i].gameDeveloperEmail});
  	}
  });
  
  /* angular will refresh $scope.selectdGames once a user select
   * a game from the game list. It's initial value is empty.
   * The closure value like "gameId" will then be settled according
   * to this specific game just selected before.  */
  $scope.selectdGames = "";
  $scope.$watch('selectdGames', function() {
    $scope.gamesPool.forEach(function(entry){
    	if(entry.GameName === $scope.selectdGames){
    		gameId = entry.gameId;
    		gameUrl = entry.gameUrl;
    		gameName = entry.GameName;
    		gameDmail = entry.gameDeveloperEmail;
    	}	
    })
    
  });
  
  //change & replace URL based on input values: AUTO_MATCH, EMAIL_JS_ERRORS, gameId
  function resetUrl(AUTO_MATCH, EMAIL_JS_ERRORS, gameId){
  	var searchObject ={};
  	var gameIdValue = gameId===undefined ? null : gameId;
  	if(AUTO_MATCH && EMAIL_JS_ERRORS){
  		searchObject = {on: 'AUTO_MATCH', on:'EMAIL_JS_ERRORS', gameId: gameIdValue};
  	}else if(!AUTO_MATCH && EMAIL_JS_ERRORS){
  		searchObject = {off: 'AUTO_MATCH', on:'EMAIL_JS_ERRORS', gameId: gameIdValue};
  	}else if(!AUTO_MATCH && !EMAIL_JS_ERRORS){
  		searchObject = {off: 'AUTO_MATCH', off:'EMAIL_JS_ERRORS', gameId: gameIdValue};
  	}else if(AUTO_MATCH && !EMAIL_JS_ERRORS){
  		searchObject = {on: 'AUTO_MATCH', off:'EMAIL_JS_ERRORS', gameId: gameIdValue};
  	}
  	$location.search(searchObject).replace();
  }
  
  //AUTO MATCH button handler
  $scope.autoMatchHandler = function(){
  	AUTO_MATCH = !AUTO_MATCH;
  	resetUrl(AUTO_MATCH, EMAIL_JS_ERRORS, gameId);
  }
	   
	   
	   
	   
	   
  /*var platformUrl = $window.location.search;
  $log.info("Platform URL: ", platformUrl);
  
  var gameUrl = platformUrl.length > 1 ? platformUrl.substring(1) : null;
  $log.info("Game URL: ", gameUrl);
  if (gameUrl === null) {
    $log.error("You must pass a url like this: ...platform.html?userid=123&matchid=123");
    $window.alert("You must pass a url like this: ...platform.html?userid=123&matchid=123");
    return;
  }
  
  var parsedurl = gameUrl.split('&');
  $log.info("Parsed URL: ", parsedurl);
  var userid;
  var matchid;
  if (parsedurl !== null || parsedurl.length === 2) {
      userid = parsedurl[0];
      matchid = parsedurl[1];
      $log.info("User ID: ", userid);
      $log.info("Match ID: ", matchid);
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
  };*/
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
