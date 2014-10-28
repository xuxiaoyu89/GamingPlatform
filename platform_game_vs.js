'use strict';

angular.module('myApp', [])
.controller('PlatformCtrl',
function ($sce, $scope, $rootScope, $log, $window, $location, platformMessageService, stateService, serverApiService) {
    //CONSTANT VARIABLES
    var MENU_URL = 'match_menu.html';

    //BASIC URL PARSING
    var platformUrl = $window.location.search;
    $log.info("Platform URL: ", platformUrl);
    var gameUrl = platformUrl.length > 1 ? platformUrl.substring(1) : null;
    $log.info("Game URL: ", gameUrl);

    //===================== PARSE URL FOR IDS ====================//
    function parseURL() {
        if (gameUrl === null) {
            $log.error("Ex URL: .../platform_game.html?userid=0&matchid=1&gameid=2&signature=3");
            $log.error("Invalid URL.");
            $window.alert("Ex URL: .../platform_game.html?userid=0&matchid=1&gameid=2&signature=3");
            return;
        }

        var parsedurl = gameUrl.split('&');
        $log.info("Parsed URL: ", parsedurl);
        if (parsedurl.length < 2) {
            $log.error("Not enough params in URL");
            $window.alert("Ex URL: .../platform_game.html?userid=0&matchid=1&gameid=2&signature=3");
            return;
        }
        var subparse, userid, matchid, gameid, signature;
        var i;
        for (i = 0; i < parsedurl.length; i++) {
            subparse = parsedurl[i].split('=');
            if (subparse.length === 2) {
                if (subparse[0] === 'userid') {
                    $scope.userid = subparse[1];
                    $log.info("USERID: ", $scope.userid);
                } else if (subparse[0] === 'matchid') {
                    $scope.matchid = subparse[1];
                    $log.info("MATCHID: ", $scope.matchid);
                } else if (subparse[0] === 'gameid') {
                    $scope.gameid = subparse[1];
                    $log.info("GAMEID: ", $scope.gameid);
                } else if (subparse[0] === 'signature') {
                    $scope.signature = subparse[1];
                    $log.info("ACCESS SIGNATURE: ", $scope.signature);
                }
                //==========ANY OTHER IDs?============//
            }
        }
    }
    parseURL();
    if ($scope.userid === undefined ||
            $scope.matchid === undefined ||
            $scope.gameid === undefined ||
            $scope.signature === undefined) {
        $log.error("USERID, MATCHID, GAMEID, or ACCESS SIGNATURE undefined.");
        $window.alert("Ex URL: .../platform_game.html?userid=0&matchid=1&gameid=2&signature=3");
        return;
    }

    //===================== GET GAME/MATCH ====================//



    //===================== MATCH_MENU OPTIONS ================//
    //LEAVE GAME
    $scope.leaveGame = function () {
        $log.info("Leaving game, redirecting to Main Menu: ", MENU_URL);
        $window.location.replace(MENU_URL);
    };

    //END GAME
    $scope.endGame = function () {
        var matchState = stateService.getMatchState();
        matchState.endMatchScores = [0, 1];
        // Set match to end game???
        $log.info("Ending game, redirecting to Main Menu: ", MENU_URL);
        //$window.location.replace(MENU_URL);
    };
    $scope.isEndGame = function () {
        var matchState = stateService.getMatchState();
        if (matchState.endMatchScores) {
            return true;
        }
        //return false;
        return true;
    };

    //DELETE GAME
    $scope.deleteGame = function () {
        if (!$scope.isEndGame()) {
            return;
        }
        var messageObj = [{dismissMatch: 
            {matchId: $scope.matchid, myPlayerId: $scope.userid, accessSignature: $scope.signature}
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

    //===================== OLD CODE ================//
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
        }
    });
});
