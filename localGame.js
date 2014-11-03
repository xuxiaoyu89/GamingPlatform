'use strict';

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
            $scope.gameID = subparse[1];
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
    var confirmation = $window.confirm("Return to Main Menu?");
    if(confirmation) {
        $log.info("leaveGame: About to redirect to Main Menu.");
        $window.location.replace(MENU_URL);
    } else {
        $log.info("leaveGame: Canceled return to game.");
    }
};

//===================== MATCH_MENU: DELETE GAME ===============//
$scope.deleteGame = function () {
    
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


//platform listen to iframe for player's moves

    var move;//move made by player
    platformMessageService.addMessageListener(function (message) {
        $log.info("PlatformMessageService: got a message.");
        if (message.gameReady !== undefined) {
        	$log.info("Get a message: new Match");
            //checkChanges();
            if (newmatch) {
                $scope.gameStatus = "Game loaded, please make a move";
            }
            
            var game = message.gameReady;
            game.isMoveOk = function (params) {
                platformMessageService.sendMessage({isMoveOk: params});
            return true;
            };
            game.updateUI = function (params) {
                platformMessageService.sendMessage({updateUI: params});
            };
            stateService.setGame(game);
        }
        //iframe send a move to platform
        else if (message.makeMove !== undefined) {
            $log.info("PlatformMessageService: makeMove.", message.makeMove);
            move = message.makeMove;//store the move locally, will be sent to server if isMoveOk
            var params;
            if (move[0].endMatch) {
                params = {move: move, turnIndexBeforeMove: turnIndex, turnIndexAfterMove: 1 - turnIndex, stateBeforeMove: state, stateAfterMove: {}};
            }
            else {
                params = {move: move, turnIndexBeforeMove: turnIndex, turnIndexAfterMove: move[0].setTurn.turnIndex, stateBeforeMove: state, stateAfterMove: {}};
            }
            platformMessageService.sendMessage({isMoveOk: params});//let iframe check isMoveOk, will hear back from iframe
        }
        else if (message.isMoveOkResult !== undefined) {
            $log.info("PlatformMessageService: isMoveOkResult.", message.isMoveOkResult)
            //iframe finish checking isMoveOk and send the result to platform
            //move is ok, send it to server
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
});
