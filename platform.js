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
  
  /* also Initialize $scope value: myPlayerId, accessSignature
   */
  
  var playerInfo = window.localStorage.getItem("playerInfo");
  if (playerInfo === undefined || playerInfo === null){
  	var myName = "guest" + Math.floor(Math.random() *  100000 );
  	var myAvatar = avatarPool[Math.floor(Math.random() * avatarPool.length)];
  	serverApiService.sendMessage(
        [{registerPlayer:{displayName: myName, avatarImageUrl: myAvatar}}],
        function (response) {
        	var playerInfo = angular.toJson(response[0].playerInfo, true);
        	window.localStorage.setItem("playerInfo", angular.toJson(playerInfo));
        	myPlayerId = playerInfo.myPlayerId;
        	accessSignature = playerInfo.accessSignature;
        	//added by XXY
        	$scope.myPlayerId = myPlayerId;
        	$scope.accessSignature = accessSignature;
        	$scope.displayName = playerInfo.displayName;
        	$scope.avatarImageUrl = playerInfo.avatarImageUrl;
        });
  }else{
  	myPlayerId = playerInfo.myPlayerId;
    accessSignature = playerInfo.accessSignature;
    $scope.displayName = playerInfo.displayName;
    $scope.avatarImageUrl = playerInfo.avatarImageUrl;
  }
  
  
  /* get all matches of the user,
   * [{getPlayerMatches: {gameId: "...", getCommunityMatches: false, myPlayerId:"...",accessSignature:"..."}}]
   * display the matches according to the game user selected */
  $scope.myMatchesPool = [];
  $scope.myTurnMatches = [];
  $scope.oppoTurnMatches = [];
  $scope.endMatches = [];
  serverApiService.sendMessage([{getPlayerMatches: {getCommunityMatches: false, myPlayerId: myPlayerId, accessSignature:accessSignature}}], function(matches){
    $scope.myMatchesPool = matches[0].matches;
  });
  
  
  
  /* display the matches of the game user selected($scope.selectdGames = "";)
   * There are 3 kinds of matches:
   *   1. matches which are your turn
   *   2. matches which are not your turn
   *   3. matches which are completed
   */
  function setCurrentMatches(selectedGame){
	  for (var i=0; i<$scope.myMatchesPool.length(); i++){
		  var currMatch = $scope.myMatchesPoos[i];
		  //check if currMatch is a match of selectedGame
		  if(selectedGame !== "" && currMatch.gameId !== selectedGame){
			  continue;
		  }
		  // check the last move in history
		  var history = currMatch.history;
		  var moves = history.moves;
		  var lastMove = moves[moves.length-1];
		  var firstOperation = lastMove[0];
		  
		  //this match has not complete, we should get the turn
		  if(firstOperation.endMatch === undefined){
			  var turnIndex = firstOperation.setTurn.turnIndex;
			  if (turnIndex === 0){
				  // it is my turn
				  $scope.myTurnMatches.push(currMatch);
			  }
			  else{
				  // it is opponent's turn 
				  $scope.oppoTurnMatches.push(currMatch);
			  }
		  }
		  //this match has completed
		  else{
			  $scope.endMatches.push(currMatch);
		  }
	  }  
  }
  
  
  
  //for global setting
  var AUTO_MATCH = true;
  var EMAIL_JS_ERRORS = true;
  //for selected game
  var gameId;
  var gameUrl;
  var gameName;
  var gameDmail;
  var macthId;
  var turnIndex;
  
  
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
    	if(entry.GameName === $scope.selectdGames.GameName){
    		gameId = entry.gameId;
    		gameUrl = entry.gameUrl;
    		gameName = entry.GameName;
    		gameDmail = entry.gameDeveloperEmail;
    	}
    	//set current Matches after select
    	/* gameId: "" if selectedGames = ""
    	 *         gameId if selectedGames = entry.gameId
    	 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!         
    	 */ 
    	setCurrentMatches(gameId);
    })
    
  });
  
  //change & replace URL based on input values: AUTO_MATCH, EMAIL_JS_ERRORS, gameId
var searchObject ={};
  //change & replace URL based on input values: AUTO_MATCH, EMAIL_JS_ERRORS, gameId, macthId
  function createSearchObj(AUTO_MATCH, EMAIL_JS_ERRORS, gameId, macthId, turnIndex){
  	var gameIdValue = gameId===undefined ? null : gameId;
  	var macthIdValue = macthId===undefined ? null : macthId;
  	if(AUTO_MATCH && EMAIL_JS_ERRORS){
  		searchObject = {on: 'AUTO_MATCH,EMAIL_JS_ERRORS', gameId: gameIdValue, macthId: macthIdValue, turnIndex: turnIndex};
  	}else if(!AUTO_MATCH && EMAIL_JS_ERRORS){
  		searchObject = {off: 'AUTO_MATCH', on:'EMAIL_JS_ERRORS', gameId: gameIdValue, macthId: macthIdValue, turnIndex: turnIndex};
  	}else if(!AUTO_MATCH && !EMAIL_JS_ERRORS){
  		searchObject = {off: 'AUTO_MATCH,EMAIL_JS_ERRORS', gameId: gameIdValue, macthId: macthIdValue, turnIndex: turnIndex};
  	}else if(AUTO_MATCH && !EMAIL_JS_ERRORS){
  		searchObject = {on: 'AUTO_MATCH', off:'EMAIL_JS_ERRORS', gameId: gameIdValue, macthId: macthIdValue, turnIndex: turnIndex};
  	}
  }
  
  
  //AUTO MATCH button handler
  $scope.autoMatchHandler = function(){
  	AUTO_MATCH = true;
  	if(gameId === undefined){
  		alert("Choose a game first please!");
  		return;
  	}else{
  		//try to reserve an AutoMatch first
  		serverApiService.sendMessage(
  			[{reserveAutoMatch: {tokens:0, numberOfPlayers:2, 
			  		    gameId: gameId, 
			     		    myPlayerId: myPlayerId,
      					    accessSignature: accessSignature}}],
      	    function(responses){
      	    	if(responses[0].matches.length === 0){
      	    		//do sth to create a new match, still need a move
      	    		//In this case, a game should show up within iframe
      	    		//waiting for the player's move
      	    		createSearchObj(AUTO_MATCH, EMAIL_JS_ERRORS, gameId, macthId, 0);
      	    		$location.path('/GamingPlatform/platform_game_vs.html').search(searchObject).replace();
      	    	}else{
      	    		//do sth to make a move in that we can really create this match
      	    		//In this case, a game with specific macthId should show up 
      	    		//within the iframe, still, waiting for the user's move
      	    		macthId = responses[0].matches.macthId;  //[0] repersents the first elem in Queue
      	    		createSearchObj(AUTO_MATCH, EMAIL_JS_ERRORS, gameId, macthId, 1);
      	    		$location.path('/GamingPlatform/platform_game_vs.html').search(searchObject).replace();
      	    	}
      	    });
  	}
  }
	   
	   
	   
	   
	   
  /*var platformUrl = $window.location.search;
  $log.info("Platform URL: ", platformUrl);
  
  var gameUrl = platformUrl.length > 1 ? platformUrl.substring(1) : null;
  $log.info("Game URL: ", gameUrl);
  if (gameUrl === null) {
    $log.error("You must pass a url like this: http://rshen1993.github.io/GamingPlatform/platform_game.html?userid=123&matchid=123");
    $window.alert("You must pass a url like this: http://rshen1993.github.io/GamingPlatform/platform_game.html?userid=123&matchid=123");
    return;
  }
  
  var parsedurl = gameUrl.split('&');
  $log.info("Parsed URL: ", parsedurl);
  var userid;
  var matchid;
  if (parsedurl.length === 2) {
      userid = parsedurl[0];
      matchid = parsedurl[1];
      $log.info("User ID: ", userid);
      $log.info("Match ID: ", matchid);
  } else {
      $window.alert("You must pass a url like this: http://rshen1993.github.io/GamingPlatform/platform_game.html?userid=123&matchid=123");
      return;
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
