'use strict';

myAppControllers
.controller('GameCtrl',
function ($sce, $scope, $rootScope, $log, $window, $route, $routeParams, platformGameService) {
  
  platformGameService.clearInterval();

  $scope.image0 = platformGameService.getImage0;
  $scope.image1 = platformGameService.getImage1;
  $scope.player0 = platformGameService.getPlayer0;
  $scope.player1 = platformGameService.getPlayer1;
  $scope.gameStatus = platformGameService.getGameStatus;

  //CONSTANT VARIABLES
  //var INDEX_URL = "/GamingPlatform/index.html"
  var MENU_URL = '#/menu';

  //SOME URL RELATED VARS
  var entireUrl = $window.location.href;
  $log.info("entireUrl: ", entireUrl);
  //var homepage = $window.location.origin.concat(INDEX_URL,MENU_URL);
  var homepage = entireUrl.split("#")[0].concat(MENU_URL);
  var questionmarkUrl = entireUrl.split("?")[1];
  var andUrl = questionmarkUrl.split("&");
  homepage = homepage.concat("?").concat(andUrl[0]).concat("&").concat(andUrl[1]);
  $log.info("homepage URL: ", homepage);
  
  //==========HANDLES DIV RESIZING==================//
  platformGameService.rescaleDivs();
            $window.onresize = platformGameService.rescaleDivs;
            $window.onorientationchange = platformGameService.rescaleDivs;
            //$doc.addEventListener("orientationchange", rescaleDivs);
  //==========HANDLES DIV RESIZING==================//

  platformGameService.setGame(entireUrl);

  $scope.leaveGame = function () {
    $log.info("leaveGame: About to redirect to Main Menu.");
    $log.info(homepage);
    $window.location.href = homepage;
    platformGameService.resetAll();
    //$window.location.reload();
  };
  
  $scope.deleteGame = function () {
    platformGameService.deleteGame(function (value) {
      if (value) {
        $window.location.href = homepage;
        //$window.location.reload();
        platformGameService.resetAll();
      }
    });
  };

  platformGameService.fetchGameUrl(function(url) {
    $log.info("game.js returned fetchGameUrldev: ", url);
    $scope.gameUrl = $sce.trustAsResourceUrl(url);
  });
  
  platformGameService.beginLoop();
});
