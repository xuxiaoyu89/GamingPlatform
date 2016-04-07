'use strict';

myAppControllers.controller('LocalGameCtrl',
function($sce, $scope, $rootScope, $log, $window, $routeParams, stateService, localGameService, serverApiService, platformMessageService) {
    $scope.localGameStatus = localGameService.getGameStatus;
    $scope.image0 = localGameService.getImage0;
    $scope.image1 = localGameService.getImage1;
    $scope.player0 = localGameService.getPlayer0;
    $scope.player1 = localGameService.getPlayer1;

    //SOME important VARIABLES
    var state; //current game state
    var turnIndex; //current turn index
    var playersInfo;
    var playerID, matchID, gameID, accessSignature, myPlayerIndex, matchInfo;
    var newmatch = false; //whether to create a new match or not, default set to false


    //===================== GET VARIABLES FROM LOCAL STORAGE ====================//
    function getLocalVars() {
        var playerInfo = $window.localStorage.getItem("playerInfo");
        playerInfo = JSON.parse(angular.fromJson(playerInfo));
        $scope.playerID = playerInfo.myPlayerId;
        $scope.accessSignature = playerInfo.accessSignature;
        myPlayerIndex = parseInt($window.localStorage.getItem($scope.matchID)); //get myplayerindex from localstorage
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
    localGameService.fetchGameUrl(function(url) {
        $scope.gameUrl = $sce.trustAsResourceUrl(url);
    });

    //===================== MATCH_MENU: GO BACK ====================//
    $scope.leaveGame = function() {
        //$log.info("leaveGame: About to redirect to Main Menu.");
        //$window.location.replace(MENU_URL);

        $window.location.href = homepage;
        $window.location.reload();

    };

});