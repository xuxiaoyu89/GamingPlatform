'use strict';

myAppControllers.controller('StatsCtrl',
    function($sce, $scope, $rootScope, $log, $window, $timeout, $location, statsService) {

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

    $scope.leaveGame = function() {
        //var MENU_URL = '#/menu';
        $log.info("leaveGame: About to redirect to Main Menu.");
        statsService.clearAll();
        $location.path('menu');
    };

    $scope.statsIndex = [];
    $scope.outcomesCount;
    statsService.statsNeedGameId();
    statsService.getLocalVars();

    statsService.getStats(function(statsIndex, outcomesCount, rank) {
        $scope.statsIndex = statsIndex;
        $scope.outcomesCount = outcomesCount;
        $scope.rank = rank;
    });
});