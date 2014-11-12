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
  
  function getBothPlayers() {
    return (platformGameService.getPlayer0() && platformGameService.getPlayer1());
  }
  $log.info("getBothPlayers: ", getBothPlayers());
  
  $log.info("The Players: ", $scope.player0, $scope.player1);

  //CONSTANT VARIABLES
  var MENU_URL = '#/menu';

  //SOME NOT SO IMPORTANT VARS
  //$scope.gameStatus = "Loading game, please wait";
  var entireUrl = $window.location.href;
  $log.info("entireUrl: ", entireUrl);

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

  //===================== MATCH_MENU: GO BACK ====================//
  $scope.leaveGame = function () {
    $log.info("leaveGame: About to redirect to Main Menu.");
    $window.location.replace(MENU_URL);
  };

  

  $scope.deleteGame = function () {
    if (platformGameServiece.deleteGame()) {
      $window.location.replace(MENU_URL);
    }
  };

  platformGameService.fetchGameUrldev(function(url) {
    $log.info("game.js returned fetchGameUrldev: ", url);
    $scope.gameUrl = $sce.trustAsResourceUrl(url);
  });
  
  platformGameService.beginLoop();
});
