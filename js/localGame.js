'use strict';

myAppControllers
.controller('LocalGameCtrl',
function ($sce, $scope, $rootScope, $log, $window, $routeParams, stateService, localGameService, serverApiService, platformMessageService) {
  /*
  if($rootScope.menu_interval !== undefined){
      clearInterval($rootScope.menu_interval);
    }
  */
  
  $scope.localGameStatus = localGameService.getGameStatus;
  $scope.image0 = localGameService.getImage0;
  $scope.image1 = localGameService.getImage1;
  $scope.player0 = localGameService.getPlayer0;
  $scope.player1 = localGameService.getPlayer1;
  
  //SOME important VARIABLES
  var state;//current game state
  var turnIndex;//current turn index
  var playersInfo;
  var playerID, matchID, gameID, accessSignature, myPlayerIndex, matchInfo;
  var newmatch = false;//whether to create a new match or not, default set to false
  
  
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


  //CONSTANT VARIABLES
  var MENU_URL = '#/menu';

  //SOME NOT SO IMPORTANT VARS
  //$scope.gameStatus = "Loading game, please wait";
  var entireUrl = $window.location.href;
  $log.info("entireUrl: ", entireUrl);
  var beforeHashUrl; //URL: http://rshen1993.github.io/GamingPlatform/index.html?on=AUTO_MATCH,EMAIL_JS_ERRORS
  //var platformUrl; //URL: ?matchid=5757715179634688&gameid=5682617542246400
  //var platformUrl2; //removes ?, URL: matchid=5757715179634688&gameid=5682617542246400
  var homepage = entireUrl.split("#")[0].concat(MENU_URL);
  var questionmarkUrl = entireUrl.split("?")[1];
  var andUrl = questionmarkUrl.split("&");
  homepage = homepage.concat("?").concat(andUrl[0]).concat("&").concat(andUrl[1]);
  


//==========HANDLES DIV RESIZING==================//
            var $doc = $window.document;
            // Cache the div so that the browser doesn't have to find it every time the window is resized.
            function rescaleDivs() {
                    $log.info("called rescaleDivs")
                    var $div_goback = $doc.getElementById('SMPG_game_goback2');
                    var height_goback = $div_goback.clientHeight;
                    $div_goback.style.fontSize = (height_goback - 2) + 'px';
            }
            rescaleDivs();
            $window.onresize = rescaleDivs;
            $window.onorientationchange = rescaleDivs;
            $log.info("onresize: ", $window.onresize);
            $log.info("onorientationchange: ", $window.onorientationchange);
            $doc.addEventListener("orientationchange", rescaleDivs);
            //==========HANDLES DIV RESIZING==================//


//===================== JS_ERROR_CATCHING ====================//
// Quick function to both alert and log requested message as error
function alert_log_error(alert, log) {
    //$window.alert(alert);
    $log.error("Alert & Log Error: ", log);
    return;
}

localGameService.setLocalGame(entireUrl);

//get the url of the game;
localGameService.fetchGameUrl(function(url){
  $scope.gameUrl = $sce.trustAsResourceUrl(url);
});



/*
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
*/

//===================== MATCH_MENU: GO BACK ====================//
$scope.leaveGame = function () {
    //var confirmation = $window.confirm("Return to Main Menu?");
    //if(confirmation) {
        $log.info("leaveGame: About to redirect to Main Menu.");
        //$window.location.replace(MENU_URL);
        
        $window.location.href = homepage;
        $window.location.reload();
    //} else {
    //    $log.info("leaveGame: Canceled return to game.");
    //}
};

//===================== MATCH_MENU: DELETE GAME ===============//
$scope.deleteGame = function () {
    
};

/*
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
*/

/*
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
  */
});
