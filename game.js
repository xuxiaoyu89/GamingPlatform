'use strict';

myAppControllers
.controller('GameCtrl',
function ($sce, $scope, $rootScope, $log, $window, $routeParams, serverApiService, platformMessageService) {
  
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
    var div2 = $doc.getElementById('SMPG_game_goback2');
    // Run the following when the window is resized, and also trigger it once to begin with.
    //$(window).resize(function () {
      // Get the current height of the div and save it as a variable.
      var height2 = div2.clientHeight;
      $log.info("DIV 2: ", height2);
      div2.css({'font-size': 50 +'px'});
      // Set the font-size and line-height of the text within the div according to the current height.
      //$div.css({
      //'font-size': (height/2) + 'px',
      //'line-height': height + 'px'
      //})
    //}).trigger('resize');​
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
                            var newURL = beforeHashUrl.concat("#game?gameId=",gameID,"&matchid=",matchID);
                            $window.location.replace(newURL);
                            $window.localStorage.setItem(matchID, "0");//store myplayerindex for this match in local storage
                            checkChanges();
                        });
                }
            }
            //illegal move
            else {
                throwError("You declared a hacker for a legal move! move=" + move);
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
