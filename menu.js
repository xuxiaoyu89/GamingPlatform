'use strict';

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
    var MENU_URL = 'platform.html';
    var GAME_URL = 'platform_game_vs.html'
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
                    $window.location.replace(MENU_URL);
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
    function setCurrentMatches() {
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
    }


    $scope.goToGame = function (myPlayerId, matchId, turnIndex) {
        //$log.info("in goToGame");
        //$log.info(myPlayerId, matchId);
        //$window.location.href="platform_game.html";
        //$log.info($location.absUrl());

        createSearchObj(AUTO_MATCH, EMAIL_JS_ERRORS, gameId, matchId, turnIndex)
        $location.url('http://rshen1993.github.io/GamingPlatform/platform_game_vs.html').search(searchObject);
        var tempUrl = $location.absUrl();
        $log.info(tempUrl);
        var res = tempUrl.split("#");
        var tempUrl2 = res[1].substring(1);
        window.open(tempUrl2, "_self");
    }




    //for global setting
    var AUTO_MATCH = true;
    var EMAIL_JS_ERRORS = true;
    //for selected game
    var gameId;
    var gameUrl;
    var gameName;
    var gameDmail;
    var matchId;
    var turnIndex;


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
                return;
            }
            if (entry.gameId === $scope.selectdGames.gameId) {
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
            //setCurrentMatches(gameId);
        });
        if(gameId !== undefined){
        	retriveCurrentGames();
        }
    });

    //change & replace URL based on input values: AUTO_MATCH, EMAIL_JS_ERRORS, gameId
    var searchObject = {};
    var searchString;
    //change & replace URL based on input values: AUTO_MATCH, EMAIL_JS_ERRORS, gameId, macthId
    function createSearchObj(AUTO_MATCH, EMAIL_JS_ERRORS, gameId, matchId, turnIndex) {
        var gameIdValue = gameId === undefined ? null : gameId;
        var matchIdValue = matchId === undefined ? null : matchId;
        if (AUTO_MATCH && EMAIL_JS_ERRORS) {
            searchObject = {on: 'AUTO_MATCH,EMAIL_JS_ERRORS', gameId: gameIdValue, matchId: matchIdValue, turnIndex: turnIndex};
            searchString = "?on=".concat("AUTO_MATCH,EMAIL_JS_ERRORS");
        } else if (!AUTO_MATCH && EMAIL_JS_ERRORS) {
            searchObject = {off: 'AUTO_MATCH', on: 'EMAIL_JS_ERRORS', gameId: gameIdValue, matchId: matchIdValue, turnIndex: turnIndex};
            searchString = "?off=".concat("AUTO_MATCH", "&on=EMAIL_JS_ERRORS");
        } else if (!AUTO_MATCH && !EMAIL_JS_ERRORS) {
            searchObject = {off: 'AUTO_MATCH,EMAIL_JS_ERRORS', gameId: gameIdValue, matchId: matchIdValue, turnIndex: turnIndex};
            searchString = "?off=".concat("AUTO_MATCH,EMAIL_JS_ERRORS");
        } else if (AUTO_MATCH && !EMAIL_JS_ERRORS) {
            searchObject = {on: 'AUTO_MATCH', off: 'EMAIL_JS_ERRORS', gameId: gameIdValue, matchId: matchIdValue, turnIndex: turnIndex};
            searchString = "?on=".concat("AUTO_MATCH", "&off=EMAIL_JS_ERRORS");
        }
        
        if(matchIdValue === null) {
            searchString = searchString.concat("&gameId=", gameIdValue);
        } else {
            searchString = searchString.concat("&gameId=", gameIdValue, "&matchId=", matchIdValue);
        }
    }

    //AUTO MATCH button handler
    $scope.autoMatchHandler = function () {
        AUTO_MATCH = true;
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
                            createSearchObj(AUTO_MATCH, EMAIL_JS_ERRORS, gameId, null, null);
                            $location.path('game').search(searchObject);
                            var aurl =$location.absUrl(); 
                            $log.info(aurl);
                           // $window.location.href = aurl ;
                           // window.open(aurl, "_self");
                            //$window.location.replace(aurl);
                            //var tempUrl = $location.absUrl();
                            //var res = tempUrl.split("#");
                            //var tempUrl2 = res[1].substring(1);
                            //window.open(tempUrl2, "_self");
                            
                            //window.location.href();
                        } else {
                            //do sth to make a move in that we can really create this match
                            //In this case, a game with specific matchId should show up 
                            //within the iframe, still, waiting for the user's move
                            matchId = responses[0].matches[0].matchId;  //[0] repersents the first elem in Queue
                            $window.localStorage.setItem(matchId, "1");
                            
                            var matchObj = responses[0].matches[0];
                            var stringMatchObj = JSON.stringify(matchObj);
                            $window.localStorage.setItem("matchInfo", stringMatchObj);
                            //$log.info("JSON.stringify matchInfo: ", stringMatchObj);
                            //stringMatchObj = $window.localStorage.getItem("matchInfo");
                            //matchObj = JSON.parse(stringMatchObj);
                            //$log.info("JSON.parse matchInfo: ", matchObj);



                            createSearchObj(AUTO_MATCH, EMAIL_JS_ERRORS, gameId, matchId, null);
                            $location.url('http://rshen1993.github.io/GamingPlatform/platform_game_vs.html').search(searchObject);
                            var tempUrl = $location.absUrl();
                            var res = tempUrl.split("#");
                            var tempUrl2 = res[1].substring(1);
                            //window.open(tempUrl2, "_self");

                            $log.info("searchObject: ", searchString);
                            var AMurl = GAME_URL.concat(searchString);
                            $log.info("AutoMatch URL: ", AMurl);
                            //$window.location.replace(AMurl);
                            $location.path('game').search(searchObject);
                            var aurl =$location.absUrl(); 
                            $log.info(aurl);
                            //$window.location.href = aurl ;
                            //$window.location.replace(aurl);
                            // window.open(aurl, "_self");
                        }
                    });
        }
    }
	   
});
