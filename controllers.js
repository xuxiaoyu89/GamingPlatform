var myAppControllers = angular.module('myAppControllers', []);

myAppControllers.controller('MenuCtrl',
function ($sce, $scope, $rootScope, $log, $window, $timeout, $location,
	 platformMessageService, serverApiService) {
    
    $log.info($rootScope.interval);
    if($rootScope.interval !== undefined){
    	clearInterval($rootScope.interval);
    }
    
       
    // initialize icon pool  
    var avatarPool = [];
    avatarPool.push("/GamingPlatform/img/avatar0.gif");
    avatarPool.push("/GamingPlatform/img/a1.jgp");
    avatarPool.push("/GamingPlatform/img/a2.png");
    avatarPool.push("/GamingPlatform/img/a3.png");
    avatarPool.push("/GamingPlatform/img/a4.png");
    avatarPool.push("/GamingPlatform/img/a5.png");
    avatarPool.push("/GamingPlatform/img/a6.png");

    var myPlayerId, accessSignature;
    $scope.displayName, $scope.avatarImageUrl;
    var MENU_URL = 'menu.html';
    var GAME_URL = 'game.html'
    /* Create a user, if necessary, by sending registerPlayer message
     * Store/Check any player information in local storage
     * Initialize closure value: *myPlayerId*, *accessSignature*
     * Initialize $scope value: displayName, avatarImageUrl   */

    /* also Initialize $scope value: myPlayerId, accessSignature
     */

    var playerInfo = window.localStorage.getItem("playerInfo");
    if (playerInfo === undefined || playerInfo === null) {
        var myName = "guest" + Math.floor(Math.random() * 100000);
        var myAvatar = avatarPool[Math.floor(Math.random() * avatarPool.length)];
        serverApiService.sendMessage(
                [{registerPlayer: {displayName: myName, avatarImageUrl: myAvatar}}],
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
                    //$window.location.replace(MENU_URL);
                    $location.path('menu');
                });
    } else {
        playerInfo = JSON.parse(angular.fromJson(playerInfo));
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
    function retriveCurrentGames(){
	    serverApiService.sendMessage([{getPlayerMatches: {getCommunityMatches: false, myPlayerId: myPlayerId, accessSignature: accessSignature}}], function (matches) {
	        $scope.myMatchesPool = matches[0].matches;
	        $log.info($scope.myMatchesPool);
	        setCurrentMatches();
	    });
    }

    /* display the matches of the game user selected($scope.selectdGames = "";)
     * There are 3 kinds of matches:
     *   1. matches which are your turn
     *   2. matches which are not your turn
     *   3. matches which are completed
     */
    /*function setCurrentMatches() {
        var selectedGame = $scope.selectdGames;
        $scope.myTurnMatches = [];
        $scope.oppoTurnMatches = [];
        $scope.endMatches = [];
        $log.info("length:", $scope.myMatchesPool.length);
        $log.info("currentGame: ", $scope.selectdGames);
        for (var i = 0; i < $scope.myMatchesPool.length; i++) {
            var currMatch = $scope.myMatchesPool[i];
            //check if currMatch is a match of selectedGame
            if (selectedGame === null || currMatch.gameId !== selectedGame.gameId) {
                continue;
            }
            // check the last move in history
            var history = currMatch.history;
            var moves = history.moves;
            var lastMove = moves[moves.length - 1];
            var firstOperation = lastMove[0];
            //set opponent, myPlayerId, TurnIndex for currMatch
            currMatch.myPlayerId = myPlayerId;
            if (firstOperation.endMatch === undefined) {
                currMatch.turnIndex = firstOperation.setTurn.turnIndex;
            }
            else {
                currMatch.turnIndex = -1;
            }
            if (currMatch.playersInfo[0].playerId === myPlayerId) {
                if (currMatch.playersInfo[1] === null) {
                    currMatch.opponent = "no opponent";
                }
                else
                    currMatch.opponent = currMatch.playersInfo[1].displayName;
            }
            else
                currMatch.opponent = currMatch.playersInfo[0].displayName;
            //this match has not complete, we should get the turn
            if (firstOperation.endMatch === undefined) {
                var turnIndex = firstOperation.setTurn.turnIndex;
                if (turnIndex === 0) {
                    // it is my turn
                    $scope.myTurnMatches.push(currMatch);
                    $log.info(currMatch);
                }
                else {
                    // it is opponent's turn 
                    $scope.oppoTurnMatches.push(currMatch);
                    $log.info(currMatch);
                }
            }
            //this match has completed
            else {
                $scope.endMatches.push(currMatch);
                $log.info(currMatch);
            }
        }
    }*/

    function updateMatchesPool(){
        //$log.info("in updateMatchesPool");
        if($scope.myMatchesPool.length === 0){
            //$log.info("myMatchesPool is empty");
            return;
        }
        else{
            var maxTime = 0;
            for(var i = 0; i<$scope.myMatchesPool.length; i++){
                var currMatch = $scope.myMatchesPool[i];
                if(currMatch.updatedTimestampMillis > maxTime){
                    maxTime = currMatch.updatedTimestampMillis;
                }
            }
            serverApiService.sendMessage([{getPlayerMatches: {getCommunityMatches: false, myPlayerId: myPlayerId, accessSignature: accessSignature, updatedTimestampMillisAtLeast: maxTime}}], function (matches) {
            var updatedMatches = matches[0].matches;
            //$log.info(updatedMatches);
            //update the myMatchesPool
            for(var i = 0; i<$scope.myMatchesPool.length; i++){
                var match = $scope.myMatchesPool[i];
                for(var j = 0; j<updatedMatches.length; j++){
                    var updatedMatch = updatedMatches[j];
                    if(updatedMatch.matchId === match.matchId){
                        $scope.myMatchesPool[i] = updatedMatch;
                        $log.info("match changed: ", updatedMatch);
                    }
                }
            }
            setCurrentMatches();
        });
        }
    }
    
    $rootScope.menu_interval = setInterval(updateMatchesPool, 10000);

    function setCurrentMatches() {
        if($scope.selectdGames === "" || $scope.selectdGames === null){
            $scope.myTurnMatches = [];
            $scope.oppoTurnMatches = [];
            $scope.endMatches = [];
            return;
        }
        var selectedGame = $scope.selectdGames;
        $scope.myTurnMatches = [];
        $scope.oppoTurnMatches = [];
        $scope.endMatches = [];
        //$log.info("length:", $scope.myMatchesPool.length);
        //$log.info("currentGame: ", $scope.selectdGames);
        for (var i = 0; i < $scope.myMatchesPool.length; i++) {
            var currMatch = $scope.myMatchesPool[i];
            //check if currMatch is a match of selectedGame
            if (selectedGame === null || currMatch.gameId !== selectedGame.gameId) {
                continue;
            }
            //get myTurnIndex use the matchId;
            var myTurnIndex = parseInt($window.localStorage.getItem(currMatch.matchID));
            
            // check the last move in history
            var history = currMatch.history;
            var moves = history.moves;
            var lastMove = moves[moves.length - 1];
            var firstOperation = lastMove[0];
            //set opponent, myPlayerId, TurnIndex for currMatch
            currMatch.myPlayerId = myPlayerId;
            if (firstOperation.endMatch === undefined) {
                currMatch.turnIndex = firstOperation.setTurn.turnIndex;
            }
            else {
                currMatch.turnIndex = -1;
            }
            //set opponent;
            if (currMatch.playersInfo[0].playerId === myPlayerId) {
                if (currMatch.playersInfo[1] === null) {
                    currMatch.opponent = "no opponent";
                }
                else
                    currMatch.opponent = currMatch.playersInfo[1].displayName;
            }
            else
                currMatch.opponent = currMatch.playersInfo[0].displayName;
            //this match has not complete, we should get the turn
            if (firstOperation.endMatch === undefined) {
                var turnIndex = firstOperation.setTurn.turnIndex;
                if (turnIndex === myTurnIndex) {
                    // it is my turn
                    $scope.myTurnMatches.push(currMatch);
                    $log.info(currMatch);
                }
                else {
                    // it is opponent's turn 
                    $scope.oppoTurnMatches.push(currMatch);
                    $log.info(currMatch);
                }
            }
            //this match has completed
            else {
                $scope.endMatches.push(currMatch);
                $log.info(currMatch);
            }
        }
    }


    $scope.goToGame = function (myPlayerId, matchId, turnIndex) {
        // fixed by bbccyy, the previous dircetion is wrong: platform_game_vs.html
        $location.search("matchId",matchId);
        $location.path('game');
    }
    
    $scope.goToStats = function(gameId){
    	 //$location.search("gameId",gameId);
    	 $location.path('stats');
    }


    //for scope setting
    $scope.AUTO_MATCH = true;
    $scope.EMAIL_JS_ERRORS = true;
    
    var setOnandOff = function(AUTO_MATCH_, EMAIL_JS_ERRORS_){
    	if(AUTO_MATCH_ && EMAIL_JS_ERRORS_){
    		$location.search("on","AUTO_MATCH,EMAIL_JS_ERRORS");
    	}else if(!AUTO_MATCH_ && !EMAIL_JS_ERRORS_){
    		$location.search("off","AUTO_MATCH,EMAIL_JS_ERRORS");
    	}else if(!AUTO_MATCH_ && EMAIL_JS_ERRORS_){
    		$location.search("off","AUTO_MATCH");
    		$location.search("on","EMAIL_JS_ERRORS");
    	}else if(AUTO_MATCH_ && !EMAIL_JS_ERRORS_){
    		$location.search("on","AUTO_MATCH");
    		$location.search("off","EMAIL_JS_ERRORS");
    	}
    }
    
    
    //for selected game
    var gameId;
    var gameUrl;
    var gameName;
    var gameDmail;
    var matchId;
    var turnIndex;
    $scope.gameId;


    /* $scope.gamesPool stores a list of games retrived from server
     * for each element in gamesPool: 
     * {gameId: ..., gameUrl:..., GameName:..., gameDeveloperEmail:...}*/
    $scope.gamesPool = [];
    serverApiService.sendMessage([{getGames: {}}], function (games) {
        var tempList = games[0].games;
        for (var i = 0; i < tempList.length; i++) {
            if (tempList[i].gameUrl === undefined)
                continue;
            $scope.gamesPool.push({gameId: tempList[i].gameId, gameUrl: tempList[i].gameUrl,
                GameName: tempList[i].languageToGameName.en,
                gameDeveloperEmail: tempList[i].gameDeveloperEmail});
        }
    });

    /* angular will refresh $scope.selectdGames once a user select
     * a game from the game list. It's initial value is empty.
     * The closure value like "gameId" will then be settled according
     * to this specific game just selected before.  */
    $scope.selectdGames = "";
    $scope.$watch('selectdGames', function () {
        $scope.gamesPool.forEach(function (entry) {
            if ($scope.selectdGames === null) {
                gameId = null;
                gameUrl = null;
                gameName = null;
                gameDmail = null;
                $scope.gameId = null;
                return;
            }
            if (entry.gameId === $scope.selectdGames.gameId) {
                gameId = entry.gameId;
                gameUrl = entry.gameUrl;
                gameName = entry.GameName;
                gameDmail = entry.gameDeveloperEmail;
                $scope.gameId = entry.gameId;
                $location.search("gameId",gameId);
            }
        });
        if(gameId !== undefined){
        	retriveCurrentGames();
        	//save gameurl to local storage
        	window.localStorage.setItem("gameURL", angular.toJson(gameUrl));
        }
    });

    
    $scope.location = $location;
    $scope.$watch( 'location.search()', function( searchObj ) {
    	    if(searchObj.on){
    	    	if(searchObj.on === "AUTO_MATCH,EMAIL_JS_ERRORS"){
    	    		$scope.AUTO_MATCH = true;
	                $scope.EMAIL_JS_ERRORS = true;
    	    	}
    	    	if(searchObj.on === "AUTO_MATCH"){
    	    		$scope.AUTO_MATCH = true;
    	    	}
    	    	if(searchObj.on === "EMAIL_JS_ERRORS"){
    	    		$scope.EMAIL_JS_ERRORS = true;
    	    	}
    	    }
    	    if(searchObj.off){
    	    	if(searchObj.off === "AUTO_MATCH,EMAIL_JS_ERRORS"){
    	    		$scope.AUTO_MATCH = false;
	                $scope.EMAIL_JS_ERRORS = false;
    	    	}
    	    	if(searchObj.off === "AUTO_MATCH"){
    	    		$scope.AUTO_MATCH = false;
    	    	}
    	    	if(searchObj.off === "EMAIL_JS_ERRORS"){
    	    		$scope.EMAIL_JS_ERRORS = false;
    	    	}
    	    }
    	    
    	    //Initialize key-value pairs of AUTO_MATCH and EMAIL_JS_ERRORS in query-string
	    setOnandOff($scope.AUTO_MATCH, $scope.EMAIL_JS_ERRORS);
	    
    });
    
    $scope.$watch('EMAIL_JS_ERRORS', function () {
    	if($scope.EMAIL_JS_ERRORS){
    		// do something if EMAIL_JS_ERRORS is on
            $rootScope.EMAIL_JS_ERRORS = true;
    	}else{
    		// do something if EMAIL_JS_ERRORS is off
            $rootScope.EMAIL_JS_ERRORS = false;
    	}
    });

    //AUTO MATCH button handler
    $scope.autoMatchHandler = function () {
        //AUTO_MATCH = true;
        //alert("hello");
        if (gameId === undefined || gameId === null) {
            alert("Choose a game first please!");
            return;
        } else {
            //try to reserve an AutoMatch first
            serverApiService.sendMessage(
                    [{reserveAutoMatch: {tokens: 0, numberOfPlayers: 2,
                                gameId: gameId,
                                myPlayerId: myPlayerId,
                                accessSignature: accessSignature}}],
                    function (responses) {
                        if (responses[0].matches.length === 0) {
                            //do sth to create a new match, still need a move
                            //In this case, a game should show up within iframe
                            //waiting for the player's move
                            $location.path('game');
                            
                        } else {
                            //do sth to make a move in that we can really create this match
                            //In this case, a game with specific matchId should show up 
                            //within the iframe, still, waiting for the user's move
                            matchId = responses[0].matches[0].matchId;  //[0] repersents the first elem in Queue
                            $window.localStorage.setItem(matchId, "1");
                            
                            var matchObj = responses[0].matches[0];
                            var stringMatchObj = JSON.stringify(matchObj);
                            $window.localStorage.setItem("matchInfo", stringMatchObj);

                            $location.search("matchId",matchId);
                            $location.path('game');
                            
                        }
                    });
        }
    };
    
    //playAgainstComputerHandler;
    $scope.playAgainstComputerHandler = function() {
    	if(gameId === undefined || gameId === null){
    		alert("please select a game!");
    		return;
    	}
    	var playMode = "playAgainstTheComputer";
    	$location.search("playMode", playMode);
    	$location.path('localGame');
    	//alert("play against computer");
    }
    
    //passAndPlayHandler;
    $scope.passAndPlayHandler = function() {
    	if(gameId === undefined || gameId === null){
    		alert("please select a game!");
    		return;
    	}
    	var playMode = "passAndPlay";
    	$location.search("playMode", playMode);
    	$location.path('localGame');
    	//alert("LocalGame");
    }
    
	   
});

myAppControllers
.controller('LocalGameCtrl',
function ($sce, $scope, $rootScope, $log, $window, $routeParams, stateService, serverApiService, platformMessageService) {
  
  if($rootScope.menu_interval !== undefined){
    	clearInterval($rootScope.menu_interval);
    }

  //SOME important VARIABLES
  var state;//current game state
  var turnIndex;//current turn index
  var playersInfo;
  var playerID, matchID, gameID, accessSignature, myPlayerIndex, matchInfo;

  var newmatch = false;//whether to create a new match or not, default set to false

  //CONSTANT VARIABLES
  var MENU_URL = '#/menu';

  //SOME NOT SO IMPORTANT VARS
  $scope.gameStatus = "Loading game, please wait";
  var entireUrl = $window.location.href;
  $log.info("entireUrl: ", entireUrl);
  var beforeHashUrl; //URL: http://rshen1993.github.io/GamingPlatform/index.html?on=AUTO_MATCH,EMAIL_JS_ERRORS
  var platformUrl; //URL: ?matchid=5757715179634688&gameid=5682617542246400
  var platformUrl2; //removes ?, URL: matchid=5757715179634688&gameid=5682617542246400

//===================== JS_ERROR_CATCHING ====================//
// Quick function to both alert and log requested message as error
function alert_log_error(alert, log) {
    //$window.alert(alert);
    $log.error("Alert & Log Error: ", log);
    return;
}

//===================== PARSE URL FOR IDS ====================//
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
            if (subparse[0].toLowerCase() === 'playmode') {
                $scope.playMode = subparse[1];
            } else if (subparse[0].toLowerCase() === 'gameid') {
                $scope.gameID = subparse[1];
            }
        }
    }
}
parseURL();
//===================== GET VARIABLES FROM LOCAL STORAGE ====================//
function getLocalVars() {
    var playerInfo = $window.localStorage.getItem("playerInfo");
    playerInfo = JSON.parse(angular.fromJson(playerInfo));
    $scope.playerID = playerInfo.myPlayerId;
    $scope.accessSignature = playerInfo.accessSignature;
    myPlayerIndex = parseInt($window.localStorage.getItem($scope.matchID));//get myplayerindex from localstorage
    var stringMatchObj = $window.localStorage.getItem("matchInfo");
    $scope.matchInfo = JSON.parse(stringMatchObj);
}
getLocalVars();

//===================== MATCH_MENU: GO BACK ====================//
$scope.leaveGame = function () {
    //var confirmation = $window.confirm("Return to Main Menu?");
    //if(confirmation) {
        $log.info("leaveGame: About to redirect to Main Menu.");
        $window.location.replace(MENU_URL);
    //} else {
    //    $log.info("leaveGame: Canceled return to game.");
    //}
};

//===================== MATCH_MENU: DELETE GAME ===============//
$scope.deleteGame = function () {
    
};
//===================== GET GAME'S URL ===============//
serverApiService.sendMessage(
    [{getGames: {gameId: $scope.gameID}}], //get the game that has id equals to gameID
    function (response) {
        $scope.game = response;
        $scope.gameInfo = response[0].games[0];
        var gameUrl = $scope.gameInfo.gameUrl;
        $scope.gameUrl = $sce.trustAsResourceUrl(gameUrl);//game url to be used for showing the game in iframe
        $window.gameDeveloperEmail = $scope.gameInfo.gameDeveloperEmail;
    });
//====================================================

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
  stateService.setPlayMode($scope.playMode);

  $scope.test = 0;
  platformMessageService.addMessageListener(function (message) {
    if (message.gameReady !== undefined) {
      $scope.test ++;
      $log.info("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!gameReady message: ", $scope.test);
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
        //$window.alert("isMoveOk returned " + message.isMoveOkResult);
      }
    } else if (message.makeMove !== undefined) {
      stateService.makeMove(message.makeMove);
    } else {
      //$window.alert("Platform got: " + angular.toJson(message, true));
    }
  });
});

myAppControllers
.controller('GameCtrl',
function ($sce, $scope, $rootScope, $log, $window, $routeParams, $timeout, serverApiService, platformMessageService) {
  
  if($rootScope.menu_interval !== undefined){
    	clearInterval($rootScope.menu_interval);
    }

  //SOME important VARIABLES
  var state;//current game state
  var turnIndex;//current turn index
  var playersInfo;
  var playerID, matchID, gameID, accessSignature, myPlayerIndex, matchInfo;

  var newmatch = false;//whether to create a new match or not, default set to false

  //CONSTANT VARIABLES
  var MENU_URL = '#/menu';

  //SOME NOT SO IMPORTANT VARS
  $scope.gameStatus = "Loading game, please wait";
  var entireUrl = $window.location.href;
  $log.info("entireUrl: ", entireUrl);
  var beforeHashUrl; //URL: .../GamingPlatform/index.html?on=AUTO_MATCH,EMAIL_JS_ERRORS
  var platformUrl; //URL: ?matchid=5757715179634688&gameid=5682617542246400
  var platformUrl2; //removes ?, URL: matchid=5757715179634688&gameid=5682617542246400

//==========HANDLES DIV RESIZING==================//
    var $doc = $window.document;
    // Cache the div so that the browser doesn't have to find it every time the window is resized.
    var $div_goback = $doc.getElementById('SMPG_game_goback2');
    var $div_delete = $doc.getElementById('SMPG_game_delete2');
    var $div_players = $doc.getElementById('SMPG_game_players');
    var $div_av0 = $doc.getElementById('SMPG_game_av0');
    var $div_av1 = $doc.getElementById('SMPG_game_av1');
    // Run the following when the window is resized, and also trigger it once to begin with.
    //$window.resize(function () {
    //$timeout(function () {
      $log.info("TIMEOUT OCCURRED")
      var height_goback = $div_goback.clientHeight;
      $div_goback.style.fontSize = (height_goback-2)+'px';
      var height_delete = $div_delete.clientHeight;
      $div_delete.style.fontSize = (height_delete-2)+'px';
      var height_players = $div_players.clientHeight;
      if($div_players.clientWidth < $div_players.clientHeight*10) { 
        $div_av0.style.height = ($div_players.clientWidth/10)+'px';
        $div_av0.style.width = ($div_players.clientWidth/10)+'px';
        $div_av1.style.height = ($div_players.clientWidth/10)+'px';
        $div_av1.style.width = ($div_players.clientWidth/10)+'px';
      }
    //}).trigger('resize');​
    //})
  //==========HANDLES DIV RESIZING==================//


//===================== JS_ERROR_CATCHING ====================//
// Quick function to both alert and log requested message as error
function alert_log_error(alert, log) {
    //$window.alert(alert);
    $log.error("Alert & Log Error: ", log);
    return;
}

//===================== PARSE URL FOR IDS ====================//
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
//===================== GET VARIABLES FROM LOCAL STORAGE ====================//
function getLocalVars() {
    var playerInfo = $window.localStorage.getItem("playerInfo");
    playerInfo = JSON.parse(angular.fromJson(playerInfo));
    $scope.playerID = playerInfo.myPlayerId;
    $scope.accessSignature = playerInfo.accessSignature;
    myPlayerIndex = parseInt($window.localStorage.getItem($scope.matchID));//get myplayerindex from localstorage
    var stringMatchObj = $window.localStorage.getItem("matchInfo");
    $scope.matchInfo = JSON.parse(stringMatchObj);
}
getLocalVars();

//===================== CHECK THE VARIABLES ====================//
function checkVars() {
    if ($scope.gameID!==undefined) {
        gameID = $scope.gameID;
        $log.info("GAMEID: ", $scope.gameID);
    } else { alert_log_error("GAMEID required in URL.", "Required URL Format: .../platform_game.html?matchid=1&gameid=2"); }
    if ($scope.matchID!==undefined) {
        matchID = $scope.matchID;
        $log.info("MATCHID: ", $scope.matchID);
    }
    else {
      newmatch = true;//matchID not found in URL, so create new match
      myPlayerIndex = 0;
      turnIndex = 0;
      state = {};
    }
    if ($scope.playerID!==undefined) {
        playerID = $scope.playerID;
        $log.info("PLAYERID: ", $scope.playerID);
    } else { alert_log_error("Cannot find PLAYERID.", "PLAYERID not in LOCALSTORAGE."); }
    if ($scope.accessSignature!==undefined) {
        accessSignature = $scope.accessSignature;
        $log.info("ACCESS_SIGNATURE: ", $scope.accessSignature);
    } else { alert_log_error("Cannot find ACCESSSIGNATURE.", "ACCESSSIGNATURE not in LOCALSTORAGE."); }
    if ($scope.matchInfo!==undefined) {
        matchInfo = $scope.matchInfo;
        $log.info("MATCH_INFO: ", $scope.matchInfo);
    } else { $log.info("MATCHINFO not in LOCALSTORAGE."); }
}
checkVars();

//===================== MATCH_MENU: GO BACK ====================//
$scope.leaveGame = function () {
    //var confirmation = $window.confirm("Return to Main Menu?");
    //if(confirmation) {
        $log.info("leaveGame: About to redirect to Main Menu.");
        $window.location.replace(MENU_URL);
    //} else {
    //    $log.info("leaveGame: Canceled return to game.");
    //}
};

//===================== MATCH_MENU: DELETE GAME ===============//
$scope.deleteGame = function () {
    if($scope.matchID===undefined || $scope.playerID===undefined || $scope.accessSignature===undefined) {
        alert_log_error("Invalid credentials to dismissMatch.", 
            "Cannot dismissMatch because matchID, playerID, or accessSignature is undefined.");
    } else {
        var messageObj = [{dismissMatch:
                        {matchId: $scope.matchID, myPlayerId: $scope.playerID, accessSignature: $scope.accessSignature}
            }];

        var confirmation = $window.confirm("Are you sure you want to delete this game?");
        if (confirmation) {
            $log.info("deleteGame: Deleting.", messageObj);
            $window.localStorage.removeItem($scope.matchID);
            serverApiService.sendMessage(messageObj,
                function (response) {
                    $scope.response = response;
                    $log.info("DismissMatch response: ", JSON.stringify(response));
                    if(response[0]['error']!==undefined) {
                        alert_log_error(response[0]['error'], ["serverAPI failed to dismissMatch.", response[0]['error']]);
                    } else {
                        $log.info("Game successfully deleted, redirecting to Main Menu: ", MENU_URL);
                    }
                    $window.location.replace(MENU_URL);
                });
        } else {
            $log.info("deleteGame: Canceled.");
        }
    }
};

//+++++++++++++++++++ here we can get URL from local storage  ++++++++++++++++++++//


//===================== GET GAME'S URL ===============//
serverApiService.sendMessage(
    [{getGames: {gameId: gameID}}], //get the game that has id equals to gameID
    function (response) {
        $scope.game = response;
        $scope.gameInfo = response[0].games[0];
        var gameUrl = $scope.gameInfo.gameUrl;
        $scope.gameUrl = $sce.trustAsResourceUrl(gameUrl);//game url to be used for showing the game in iframe
        $window.gameDeveloperEmail = $scope.gameInfo.gameDeveloperEmail;
    });
//====================================================



//+++++++++++++++++++ Here we should check if PlayAgainstComputer is on ++++++++++++++++++++//
//Check changes periodically(every 10sec)
$rootScope.interval = setInterval(checkChanges, 10000);

//function for updating match status and game UI
function updateStatus() {
    playersInfo = $scope.matchInfo.playersInfo;//info of two players
    if (playersInfo[0]){
        $scope.image0 = playersInfo[0].avatarImageUrl;
        $scope.player0 = playersInfo[0].displayName;
    }
    if (playersInfo[1]) {
        $scope.image1 = playersInfo[1].avatarImageUrl;
        $scope.player1 = playersInfo[1].displayName;
    }

    var states = $scope.matchInfo.history.stateAfterMoves;//all the states
    state = states[states.length - 1];//current game state

    var moves = $scope.matchInfo.history.moves;//all the moves

    //update status

    //game is ongoing
    if (moves[moves.length - 1][0].setTurn) {
        turnIndex = moves[moves.length - 1][0].setTurn.turnIndex;
        if (playersInfo[turnIndex]) {
            $scope.gameStatus = "Game ongoing, turn of " + playersInfo[turnIndex].displayName;
        }
        else {
            $scope.gameStatus = "Waiting for opponent to join";
        }
    }
    //game ended
    else if (moves[moves.length - 1][0].endMatch) {
        var score = moves[moves.length - 1][0].endMatch.endMatchScores;
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

    //update UI
    var params = {stateAfterMove: state, 
                  turnIndexAfterMove: turnIndex, 
                  yourPlayerIndex: myPlayerIndex, 
                  playersInfo: playersInfo};
    platformMessageService.sendMessage({updateUI: params});
}
//====================== END UPDATESTATUS FUNCTION



//function for checking if there is any change in match state
var numberOfMoves = 0;//number of moves, used to determine if there's any change
var playsound = true;
var latestUpdateTime = 0;//update time millis
function checkChanges() {
    $log.info("checking changes for:", matchID);
//--------------I DON'T REALLY UNDERSTAND THIS PART MYSELF----------------//
    if (newmatch) {
        var params = {stateAfterMove: state, 
                      turnIndexAfterMove: turnIndex, 
                      yourPlayerIndex: myPlayerIndex, 
                      playersInfo: [{playerId: playerID}]};
        platformMessageService.sendMessage({updateUI: params});
    } else {
        //if user just jumped to this page from menu, then pull all matches
        if (latestUpdateTime === 0) {
            serverApiService.sendMessage(
                //get all the matches that is being played or has been played by this player
                [{getPlayerMatches: {gameId: gameID, 
                                      getCommunityMatches: true, 
                                      myPlayerId: playerID, 
                                      accessSignature: accessSignature}}],
                function (response) {
                    $log.info("checkChanges getPlayerMatches response: ", response);
                    var matches = response[0]["matches"];
                    if(matches === undefined) {
                        $log.info("Cannot getPlayerMatches.", response);
                        return;
                    }
                    //search through all matches to find tha match that has matchID
                    var i = 0;
                    while(i<matches.length && matches[i].matchId!==matchID) {
                        if (matches[i].updatedTimestampMillis > latestUpdateTime) {
                            latestUpdateTime = matches[i].updatedTimestampMillis;
                        }
                        i++;
                    }
                    if(i===matches.length && matchInfo!==undefined){ //first time to this match, not reserve sucessfully yet
                    	$scope.matchInfo = matchInfo;
                    	numberOfMoves = $scope.matchInfo.history.moves.length;
                        if (playsound){
                    	   updateStatus();
                           playsound = false;
                        }
                    }
                    else if (matches[i].matchId === matchID) {
                        if (matches[i].updatedTimestampMillis > latestUpdateTime) {
                            latestUpdateTime = matches[i].updatedTimestampMillis;
                        }
                        $scope.matchInfo = matches[i];
                        //if there is a mismatch between local numberOfMoves and match history moves length, 
                        //then update status and UI
                        if ($scope.matchInfo.history.moves.length !== numberOfMoves) {
                            numberOfMoves = $scope.matchInfo.history.moves.length;
                            updateStatus();
                        }
                    }
                }
            );
        }
        //pull matches changed since latestUpdateTime
        else {
            serverApiService.sendMessage(
                //get all the matches that is being played or has been played by this player
                [{getPlayerMatches: {gameId: gameID, 
                                      getCommunityMatches: true, 
                                      myPlayerId: playerID, 
                                      accessSignature: accessSignature, 
                                      updatedTimestampMillisAtLeast: latestUpdateTime}}],
                function (response) {
                    $log.info("checkChanges getPlayerMatches after latestUpdateTime response: ", response);
                    var matches = response[0]["matches"];
                    if(matches === undefined) {
                        $log.info("No match updated since time:", latestUpdateTime, response);
                        return;
                    }
                    //search through all matches to find tha match that has matchID
                    var i = 0;
                    while(i<matches.length && matches[i].matchId!==matchID) {
                        if (matches[i].updatedTimestampMillis > latestUpdateTime) {
                            latestUpdateTime = matches[i].updatedTimestampMillis;
                        }
                        i++;
                    }
                    if (i === matches.length) {
                        $log.info("Your match didn't change");
                    }
                    else if (matches[i].matchId === matchID) {
                        if (matches[i].updatedTimestampMillis > latestUpdateTime) {
                            latestUpdateTime = matches[i].updatedTimestampMillis;
                        }
                        $scope.matchInfo = matches[i];
                        //if there is a mismatch between local numberOfMoves and match history moves length, 
                        //then update status and UI
                        if ($scope.matchInfo.history.moves.length !== numberOfMoves) {
                            numberOfMoves = $scope.matchInfo.history.moves.length;
                            updateStatus();
                        }
                    }
                }
            );
        }
    }
}
//================= END CHECKCHANGES FUNCTION




//platform listen to iframe for player's moves

    var move;//move made by player
    platformMessageService.addMessageListener(function (message) {
        $log.info("PlatformMessageService: got a message.");
        if (message.gameReady !== undefined) {
            checkChanges();
            if (newmatch) {
                $scope.gameStatus = "Game loaded, please make a move";
            }
        }
        //iframe send a move to platform
        else if (message.makeMove !== undefined) {
            $log.info("PlatformMessageService: makeMove.")
            move = message.makeMove;//store the move locally, will be sent to server if isMoveOk
            var params;
            if (move[0].endMatch) {
                params = {move: move, 
                          turnIndexBeforeMove: turnIndex, 
                          turnIndexAfterMove: 1 - turnIndex, 
                          stateBeforeMove: state, 
                          stateAfterMove: {}};
            }
            else {
                params = {move: move, 
                          turnIndexBeforeMove: turnIndex, 
                          turnIndexAfterMove: move[0].setTurn.turnIndex, 
                          stateBeforeMove: state, 
                          stateAfterMove: {}};
            }
            platformMessageService.sendMessage({isMoveOk: params});//let iframe check isMoveOk, will hear back from iframe
        }
        else if (message.isMoveOkResult !== undefined) {
            $log.info("PlatformMessageService: isMoveOkResult.")
            //iframe finish checking isMoveOk and send the result to platform
            //move is ok, send it to server
            if (message.isMoveOkResult === true) {
                if (!newmatch) {
                    //normal move
                    serverApiService.sendMessage(
                        [{madeMove: {matchId: matchID, 
                                      move: move, 
                                      moveNumber: numberOfMoves, 
                                      myPlayerId: playerID, 
                                      accessSignature: accessSignature}}],
                        function (response) {
                            $log.info("PlatformMessageService: isMoveOkResult: ", response);
                            checkChanges();
                        });
                }
                else {
                    //create new match
                    serverApiService.sendMessage(
                        [{newMatch: {gameId: gameID, 
                                      tokens: 0, 
                                      move: move, 
                                      startAutoMatch: {numberOfPlayers: 2}, 
                                      myPlayerId: playerID, 
                                      accessSignature: accessSignature}}],
                        function (response) {
                            $log.info("PlatformMessageService: newmatch: ", response);
                            newmatch = false;//finish crating new match
                            matchID = response[0]["matches"][0].matchId;
                            $scope.matchID = matchID;
                            //var newURL = beforeHashUrl.concat("#game?gameId=",gameID,"&matchid=",matchID);
                            //$window.location.replace(newURL);
                            $window.localStorage.setItem(matchID, "0");//store myplayerindex for this match in local storage
                            checkChanges();
                        });
                }
            }
            //illegal move
            else {
                //throwError("You declared a hacker for a legal move! move=" + move);
            }
        }
        //got a error from iframe and send it to server
         else if (message.emailJavaScriptError !== undefined && $rootScope.EMAIL_JS_ERRORS) {
            serverApiService.sendMessage(
                message,
                function (response) {
                    $log.info("email js error", response);
                });
        }
    });
//====================================================
})
.factory('$exceptionHandler', function ($window, $log) {
  return function (exception, cause) {
    $log.info("Platform had an exception:", exception, cause);
    var exceptionString = angular.toJson({exception: exception, cause: cause, lastMessage: $window.lastMessage}, true);
    var message = 
        {
          emailJavaScriptError: 
            {
              gameDeveloperEmail: "rshen1993@gmail.com", 
              emailSubject: "Error in platform " + $window.location, 
              emailBody: exceptionString
            }
        };
    $window.parent.postMessage(message, "*");
    $window.alert(exceptionString);
  };
});

myAppControllers.controller('StatsCtrl',
        function ($sce, $scope, $rootScope, $log, $window, $timeout, $location,
                serverApiService) {

            //==========HANDLES DIV RESIZING==================//
            var $doc = $window.document;
            // Cache the div so that the browser doesn't have to find it every time the window is resized.
            var $div_goback = $doc.getElementById('SMPG_game_goback2');
            // Run the following when the window is resized, and also trigger it once to begin with.
            //$window.resize(function () {
            //$timeout(function () {
            var height_goback = $div_goback.clientHeight;
            $div_goback.style.fontSize = (height_goback - 2) + 'px';
            //}).trigger('resize');​
            //})
            //==========HANDLES DIV RESIZING==================//

            $scope.leaveGame = function () {
                var MENU_URL = '#/menu';
                $log.info("leaveGame: About to redirect to Main Menu.");
                $window.location.replace(MENU_URL);
            };


            function getLocalVars() {
                var playerInfo = $window.localStorage.getItem("playerInfo");
                playerInfo = JSON.parse(angular.fromJson(playerInfo));
                $scope.playerID = playerInfo.myPlayerId;
                $scope.accessSignature = playerInfo.accessSignature;
                $scope.playerName = playerInfo.displayName;
                $scope.avatarImageUrl = playerInfo.avatarImageUrl;
            }
            getLocalVars();

            var search = $location.search();
            if (search.gameId) {
                $scope.gameId = search.gameId;
            } else {
                alert("Passing a specific gameId in URL please!");
            }

            serverApiService.sendMessage([{getPlayerGameStats: {gameId: $scope.gameId, myPlayerId: $scope.playerID,
                        accessSignature: $scope.accessSignature}}], function (response) {
                var myStatsObj = response[0];
                var playerGameStats = myStatsObj.playerGameStats;
                $scope.rank = playerGameStats.rank;
                $scope.outcomesCount = playerGameStats.outcomesCount;  //Obj{'L':1, 'T':2, 'W':3}
                if ($scope.outcomesCount === undefined || $scope.outcomesCount === null) {
                    $scope.outcomesCount = undefined;
                    $scope.statsIndex = undefined;
                    return;
                }
                //Obj{playerId_1:{W:1, L:1 , T:2}, playerId_2:{L:1, W:2}, playerId_3{T:1}}
                var outcomePer = playerGameStats.outcomesAgainstPlayerIdCount;
                //Array [{playerId:"123", displayName: "haha", avatarImageUrl:"img"},{},{}]
                var opponentsInfo = playerGameStats.opponentsInfo;
                $scope.statsIndex = [];
                for (var i = 0; i < opponentsInfo.length; i++) {
                    var tempId = opponentsInfo[i].playerId;
                    var tempIndex = {playerId: tempId, displayName: opponentsInfo[i].displayName,
                        avatarImageUrl: opponentsInfo[i].avatarImageUrl,
                        outcomes: outcomePer[tempId]};   //the outcomes here is an Obj like {W:1, L:1 , T:2}
                    $scope.statsIndex.push(tempIndex);
                }
            });


        });
