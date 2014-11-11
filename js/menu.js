myAppControllers.controller('MenuCtrl',
function ($sce, $scope, $rootScope, $log, $window, $timeout, $location, $interval,
     platformMessageService, serverApiService) {
    
    $log.info($rootScope.interval);
    if($rootScope.interval !== undefined){
        $interval.cancel($scope.interval);
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
    
    $rootScope.menu_interval = $interval(updateMatchesPool, 10000);

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
