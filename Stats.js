'use strict';

myAppControllers.controller('StatsCtrl',
function ($sce, $scope, $rootScope, $log, $window, $timeout, $location,
	  serverApiService) {
	 	
	 	
	 	function getLocalVars() {
		    var playerInfo = $window.localStorage.getItem("playerInfo");
		    playerInfo = JSON.parse(angular.fromJson(playerInfo));
		    $scope.playerID = playerInfo.myPlayerId;
		    $scope.accessSignature = playerInfo.accessSignature;
		    $scope.playerName = playerInfo.displayName;
		    $scope.avatarImageUrl = playerInof.avatarImageUrl;
		}
		getLocalVars();
		
		var search = $location.search();
		if(search.gameId){
			$scope.gameId = search.gameId;
		}else{
			alert("Passing a specific gameId in URL please!");
		}
		
	 	serverApiService.sendMessage([{getPlayerGameStats: {gameId: $scope.gameId, myPlayerId:$scope.playerID,
			accessSignature:$scope.accessSignature}}], function(response){
				var myStatsObj = response[0];
				var playerGameStats = myStatsObj.playerGameStats;
				$scope.rank = playerGameStats.rank;
				$scope.outcomesCount = playerGameStats.outcomesCount;  //Obj{'L':1, 'T':2, 'W':3}
				if($scope.outcomesCount===undefined || $scope.outcomesCount===null){
					$scope.outcomesCount = undefined;
					$scope.statsIndex = undefined; 
					return;
				}
				//Obj{playerId_1:{W:1, L:1 , T:2}, playerId_2:{L:1, W:2}, playerId_3{T:1}}
				var outcomePer = playerGameStats.outcomesAgainstPlayerIdCount;
				//Array [{playerId:"123", displayName: "haha", avatarImageUrl:"img"},{},{}]
				var opponentsInfo = playerGameStats.opponentsInfo;
				$scope.statsIndex = [];
				for(var i=0; i<opponentsInfo.length; i++){
					var tempId = opponentsInfo[i].playerId;
					var tempIndex = {playerId:tempId, displayName: opponentsInfo[i].displayName, 
									 avatarImageUrl: opponentsInfo[i].avatarImageUrl, 
									 outcomes: outcomePer[tempId]};   //the outcomes here is an Obj like {W:1, L:1 , T:2}
					$scope.statsIndex.push(tempIndex);
				}
			});
	 	

});
