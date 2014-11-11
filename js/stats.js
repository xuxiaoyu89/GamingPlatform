'use strict';

myAppControllers.controller('StatsCtrl',
        function ($sce, $scope, $rootScope, $log, $window, $timeout, $location,
                serverApiService) {

            //==========HANDLES DIV RESIZING==================//
            var $doc = $window.document;
            // Cache the div so that the browser doesn't have to find it every time the window is resized.
            function rescaleDivs() {
            var $div_goback = $doc.getElementById('SMPG_game_goback2');
            // Run the following when the window is resized, and also trigger it once to begin with.
            //$window.resize(function () {
            //$timeout(function () {
            var height_goback = $div_goback.clientHeight;
            $div_goback.style.fontSize = (height_goback - 2) + 'px';
            //}).trigger('resize');​
            //})
            }
            rescaleDivs();
            $log.info($window.onresize);
            $log.info($window.onorientationchange);
            doc.addEventListener("orientationchange", rescale);
            //==========HANDLES DIV RESIZING==================//

            $scope.leaveGame = function () {
                var MENU_URL = '#/menu';
                $log.info("leaveGame: About to redirect to Main Menu.");
                $window.location.replace(MENU_URL);
            };


            function getLocalVars() {
                var playerInfo = $window.localStorage.getItem("playerInfo");
                playerInfo = JSON.parse(angular.fromJson(playerInfo));
                $scope.playerID = playerInfo.myPlayerId;
                $scope.accessSignature = playerInfo.accessSignature;
                $scope.playerName = playerInfo.displayName;
                $scope.avatarImageUrl = playerInfo.avatarImageUrl;
            }
            getLocalVars();

            var search = $location.search();
            if (search.gameId) {
                $scope.gameId = search.gameId;
            } else {
                alert("Passing a specific gameId in URL please!");
            }

            serverApiService.sendMessage([{getPlayerGameStats: {gameId: $scope.gameId, myPlayerId: $scope.playerID,
                        accessSignature: $scope.accessSignature}}], function (response) {
                var myStatsObj = response[0];
                var playerGameStats = myStatsObj.playerGameStats;
                $scope.rank = playerGameStats.rank;
                $scope.outcomesCount = playerGameStats.outcomesCount;  //Obj{'L':1, 'T':2, 'W':3}
                if ($scope.outcomesCount === undefined || $scope.outcomesCount === null) {
                    $scope.outcomesCount = undefined;
                    $scope.statsIndex = undefined;
                    return;
                }
                //Obj{playerId_1:{W:1, L:1 , T:2}, playerId_2:{L:1, W:2}, playerId_3{T:1}}
                var outcomePer = playerGameStats.outcomesAgainstPlayerIdCount;
                //Array [{playerId:"123", displayName: "haha", avatarImageUrl:"img"},{},{}]
                var opponentsInfo = playerGameStats.opponentsInfo;
                $scope.statsIndex = [];
                for (var i = 0; i < opponentsInfo.length; i++) {
                    var tempId = opponentsInfo[i].playerId;
                    var tempIndex = {playerId: tempId, displayName: opponentsInfo[i].displayName,
                        avatarImageUrl: opponentsInfo[i].avatarImageUrl,
                        outcomes: outcomePer[tempId]};   //the outcomes here is an Obj like {W:1, L:1 , T:2}
                    $scope.statsIndex.push(tempIndex);
                }
            });


        });
