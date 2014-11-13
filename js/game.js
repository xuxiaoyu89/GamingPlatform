'use strict';

myAppControllers
.controller('GameCtrl',
function ($sce, $scope, $rootScope, $log, $window, $routeParams, platformGameService) {
  
  platformGameService.clearInterval();

  $scope.image0 = platformGameService.getImage0;
  $scope.image1 = platformGameService.getImage1;
  $scope.player0 = platformGameService.getPlayer0;
  $scope.player1 = platformGameService.getPlayer1;
  $scope.gameStatus = platformGameService.getGameStatus;

  //CONSTANT VARIABLES
  var INDEX_URL = "GamingPlatform/index.html"
  var MENU_URL = '#/menu';

  //SOME URL RELATED VARS
  var entireUrl = $window.location.href;
  $log.info("entireUrl: ", entireUrl);
  var homepage = $window.location.origin.concat(INDEX_URL,MENU_URL);
  //entireUrl.split("#")[0].concat(MENU_URL);
  var questionmarkUrl = entireUrl.split("?")[1];
  var andUrl = questionmarkUrl.split("&");
  homepage = homepage.concat("?").concat(andUrl[0]).concat("&").concat(andUrl[1]);
  $log.info("homepage URL: ", homepage);
  
  //==========HANDLES DIV RESIZING==================//
  var $doc = $window.document;
  // Cache the div so that the browser doesn't have to find it every time the window is resized.
  var $div_goback = $doc.getElementById('SMPG_game_goback2');
  var $div_delete = $doc.getElementById('SMPG_game_delete2');
  var $div_players = $doc.getElementById('SMPG_game_players');
  var $div_av0 = $doc.getElementById('SMPG_game_av0');
  var $div_av1 = $doc.getElementById('SMPG_game_av1');
  // Run the following when the window is resized, and also trigger it once to begin with.
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
  //==========HANDLES DIV RESIZING==================//

  platformGameService.setGame(entireUrl);

  $scope.leaveGame = function () {
    $log.info("leaveGame: About to redirect to Main Menu.");
    $log.info(homepage);
    $window.location.href = homepage;
  };
  
  $scope.deleteGame = function () {
    platformGameService.deleteGame(function (value) {
      if (value) {
        $window.location.href = homepage;
      }
    });
  };

  platformGameService.fetchGameUrl(function(url) {
    $log.info("game.js returned fetchGameUrldev: ", url);
    $scope.gameUrl = $sce.trustAsResourceUrl(url);
  });
  
  platformGameService.beginLoop();
});
