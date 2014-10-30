'use strict';

angular.module('myApp', [])
.controller('PlatformCtrl',
function ($sce, $scope, $rootScope, $log, $window, serverApiService, platformMessageService) {

  //SOME important VARIABLES
  var gameUrl;
  var state;//current game state
  var turnIndex;//current turn index
  var playersInfo;
  var playerID, matchID, gameID, accessSignature, myPlayerIndex, matchInfo;

  var newmatch = false;//whether to create a new match or not, default set to false
  var firstmove = true;//while FIRSTMOVE is true, use MATCHINFO from LOCALSTORAGE


  //URL: ?matchid=5757715179634688&gameid=5682617542246400
  //----------------THESE WILL BE DELETED----------------------//
  //$window.localStorage.setItem("playerID", "5648554290839552");
  //$window.localStorage.setItem("accessSignature", "665eef5138f85e13aa0309aaa0fd8883");
  //$window.localStorage.setItem("5757715179634688", 0);
  //-----------------------------------------------------------//



  //CONSTANT VARIABLES
  var MENU_URL = 'platform.html';

  //BASIC URL PARSING
  var platformUrl = $window.location.search;
  $log.info("Platform URL: ", platformUrl);
  var gameUrl = platformUrl.length > 1 ? platformUrl.substring(1) : null;
  $log.info("Game URL: ", gameUrl);

//===================== JS_ERROR_CATCHING ====================//
// Quick function to both alert and log requested message as error
function alert_log_error(alert, log) {
    $window.alert(alert);
    $log.error(["Alert & Log Error: ", log]);
    return;
}
function getJSError(message) {
    $window.alert("Game JS Error.")
    $log.error("Game JS Error: ", message);
    
    return;
}

//===================== PARSE URL FOR IDS ====================//
function parseURL() {
    if (gameUrl === null) {
        alert_log_error("URL is NULL.", "Required URL Format: .../platform_game.html?matchid=1&gameid=2&turnindex=0");
    }

    var parsedurl = gameUrl.split('&');
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
            } else if (subparse[0].toLowerCase() === 'turnindex') {
                $scope.turnIndex = parseInt(subparse[1]);
                $window.localStorage.setItem($scope.matchID, subparse[1]);
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
    myPlayerIndex=parseInt($window.localStorage.getItem($scope.matchID));//get myplayerindex from localstorage
    var stringMatchObj = $window.localStorage.getItem("matchInfo");
    $scope.matchInfo = JSON.parse(stringMatchObj);
}
getLocalVars();

//===================== CHECK THE VARIABLES ====================//
function checkVars() {
    if ($scope.gameID!==undefined) {
        gameID = $scope.gameID;
        $log.info("GAMEID: ", $scope.gameID);
    } else { alert_log_error("GAMEID required in URL.", "Required URL Format: .../platform_game.html?matchid=1&gameid=2&turnindex=0"); }
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
    if ($scope.turnIndex!==undefined) {
        myPlayerIndex = $scope.turnIndex;
        $log.info("MYPLAYERINDEX: ", $scope.turnIndex);
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
        $log.info("Leaving game, redirecting to Main Menu: ", MENU_URL);
        $window.location.replace(MENU_URL);
};

//===================== MATCH_MENU: DELETE GAME ===============//
$scope.deleteGame = function () {
    if($scope.matchID===undefined || $scope.playerID===undefined || $scope.accessSignature===undefined) {
        alert_log_error("Invalid credentials to dismissMatch.", "Cannot dismissMatch because matchID, playerID, or accessSignature is undefined.");
    }
    var messageObj = [{dismissMatch: 
        {matchId: $scope.matchID, myPlayerId: $scope.playerID, accessSignature: $scope.accessSignature}
    }];
    serverApiService.sendMessage(messageObj,
            function (response) {
                $scope.response = response;
                $log.info("DismissMatch response: ", response);
                $log.info("Deleting game, redirecting to Main Menu: ", MENU_URL);
                $window.location.replace(MENU_URL);
            });
    return;
};



//Get game URL every time the webpage is loaded
serverApiService.sendMessage(
        [{getGames: {gameId: gameID}}], //get the game that has id equals to gameID
        function (response) {
            $scope.game = response;
            gameUrl = $scope.game[0]["games"][0].gameUrl;
            $scope.gameUrl = $sce.trustAsResourceUrl(gameUrl);//game url to be used for showing the game in iframe
        });
//====================================================


//Check changes periodically(every 2sec)
var interval = setInterval(checkChanges, 2000);



//function for updating match status and game UI

function updateStatus() {
    playersInfo = $scope.matchInfo.playersInfo;//info of two players
    $scope.image0 = playersInfo[0].avatarImageUrl;
    $scope.player0 = playersInfo[0].displayName;
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
    var params = {stateAfterMove: state, turnIndexAfterMove: turnIndex, yourPlayerIndex: myPlayerIndex, playersInfo: playersInfo};
    platformMessageService.sendMessage({updateUI: params});
}
//====================== END UPDATESTATUS FUNCTION



//function for checking if there is any change in match state
var numberOfMoves = 0;//number of moves, used to determine if there's any change
function checkChanges() {
//--------------I DON'T REALLY UNDERSTAND THIS PART MYSELF----------------//
    if (newmatch) {
        var params = {stateAfterMove: state, turnIndexAfterMove: turnIndex, yourPlayerIndex: myPlayerIndex, playersInfo: [{playerId: playerID}]};
        platformMessageService.sendMessage({updateUI: params});
    //} else if (firstmove) {
    //firstmove = false;
    //if ($scope.matchInfo.history.moves.length !== numberOfMoves) {
    //  numberOfMoves = $scope.matchInfo.history.moves.length;
    // updateStatus();
    //}
    } else {
        serverApiService.sendMessage(
            //get all the matches that is being played or has been played by this player
            [{getPlayerMatches: {gameId: gameID, getCommunityMatches: true, myPlayerId: playerID, accessSignature: accessSignature}}],
            function (response) {
                $log.info("checkChanges getPlayerMatches response: ", response);
                var matches = response[0]["matches"];
                if(matches===undefined) {
                    alert_log_error("Cannot getPlayerMatches.", "getPlayerMatches returned undefined matches.");
                    return;
                }
                //search through all matches to find tha match that has matchID
                var i = 0;
                while(i<matches.length && matches[i].matchId!==matchID) {
                    i++;
                }
                if (matches[i].matchId === matchID) {
                    $scope.matchInfo = matches[i];
                    //if there is a mismatch between local numberOfMoves and match history moves length, then update status and UI
                    if ($scope.matchInfo.history.moves.length !== numberOfMoves) {
                        numberOfMoves = $scope.matchInfo.history.moves.length;
                        updateStatus();
                    }
                } else if($scope.matchInfo!==undefined) {
                    numberOfMoves = $scope.matchInfo.history.moves.length;
                    updateStatus();
                }
            }
        );
    }
}
//================= END CHECKCHANGES FUNCTION



//platform listen to iframe for player's moves

    var move;//move made by player
    platformMessageService.addMessageListener(function (message) {
        $log.info("PlatformMessageService: got a message.");
        //iframe send a move to platform
        if (message.makeMove !== undefined) {
            $log.info("PlatformMessageService: makeMove.")
            move = message.makeMove;//store the move locally, will be sent to server if isMoveOk
            var params;
            if (move[0].endMatch) {
                params = {move: move, turnIndexBeforeMove: turnIndex, turnIndexAfterMove: 1 - turnIndex, stateBeforeMove: state, stateAfterMove: {}};
            }
            else {
                params = {move: move, turnIndexBeforeMove: turnIndex, turnIndexAfterMove: move[0].setTurn.turnIndex, stateBeforeMove: state, stateAfterMove: {}};
            }
            platformMessageService.sendMessage({isMoveOk: params});//let iframe check isMoveOk, will hear back from iframe
        } else if (message.isMoveOkResult !== undefined) {
            $log.info("PlatformMessageService: isMoveOkResult.")
            //iframe finish checking isMoveOk and send the result to platform
            //move is ok, send it to server
            if (message.isMoveOkResult === true) {
                //normal move
                if (!newmatch) {
                    serverApiService.sendMessage(
                            [{madeMove: {matchId: matchID, move: move, moveNumber: numberOfMoves, myPlayerId: playerID, accessSignature: accessSignature}}],
                            function (response) {
                                $log.info("PlatformMessageService: isMoveOkResult: ", response);
                                checkChanges();
                            });
                } else {
                    //create new match
                    serverApiService.sendMessage(
                            [{newMatch: {gameId: gameID, tokens: 0, move: move, startAutoMatch: {numberOfPlayers: 2}, myPlayerId: playerID, accessSignature: accessSignature}}],
                            function (response) {
                                $log.info("PlatformMessageService: newmatch: ", response);
                                newmatch = false;//finish crating new match
                                matchID = response[0]["matches"][0].matchId;
                                $window.localStorage.setItem(matchID, 0);//store myplayerindex for this match in local storage
                            });
                }
            }
            //illegal move
            else {
                throwError("You declared a hacker for a legal move! move=" + move);
            }
        }
    });
//====================================================
});
