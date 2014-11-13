'use strict'

angular.module('myApp')
.service('statsService', function($log, $window, $location , serverApiService){
  
  var playerInfo, 
  playerID, 
  accessSignature, 
  playerName, 
  avatarImageUrl, 
  gameId;
  
  
  function getLocalVars() {
      playerInfo = $window.localStorage.getItem("playerInfo");
      playerInfo = JSON.parse(angular.fromJson(playerInfo));
      playerID = playerInfo.myPlayerId;
      accessSignature = playerInfo.accessSignature;
      playerName = playerInfo.displayName;
      avatarImageUrl = playerInfo.avatarImageUrl;
  }
  getLocalVars();
  
  this.getLocalVars = getLocalVars;
  
  var search = $location.search();
  if (search.gameId) {
     gameId = search.gameId;
  } else {
    alert("Passing a specific gameId in URL please!");
  }
  
  this.statsNeedGameId = function(){
    var search = $location.search();
    if (search.gameId) {
       gameId = search.gameId;
    } else {
      alert("Passing a specific gameId in URL please!");
    }
  }

  var rank, outcomesCount;
  var statsIndex = [];
  
  this.clearAll = function(){
    outcomesCount = undefined;
    statsIndex = [];
  }
  
  this.getStats = function(callback){
    serverApiService.sendMessage([{getPlayerGameStats: {gameId: gameId, myPlayerId: playerID,
    accessSignature: accessSignature}}], function (response) {
      var myStatsObj = response[0];
      var playerGameStats = myStatsObj.playerGameStats;
      rank = playerGameStats.rank;
      outcomesCount = playerGameStats.outcomesCount;  //Obj{'L':1, 'T':2, 'W':3}
      if (outcomesCount === undefined || outcomesCount === null) {
          outcomesCount = undefined;
          statsIndex = undefined;
          return;
      }
      //Obj{playerId_1:{W:1, L:1 , T:2}, playerId_2:{L:1, W:2}, playerId_3{T:1}}
      var outcomePer = playerGameStats.outcomesAgainstPlayerIdCount;
      //Array [{playerId:"123", displayName: "haha", avatarImageUrl:"img"},{},{}]
      var opponentsInfo = playerGameStats.opponentsInfo;
      //statsIndex = [];
      for (var i = 0; i < opponentsInfo.length; i++) {
          var tempId = opponentsInfo[i].playerId;
          var tempIndex = {playerId: tempId, displayName: opponentsInfo[i].displayName,
              avatarImageUrl: opponentsInfo[i].avatarImageUrl,
              outcomes: outcomePer[tempId]};   //the outcomes here is an Obj like {W:1, L:1 , T:2}
          statsIndex.push(tempIndex);
      }
      callback(statsIndex, outcomesCount, rank);
    });
  }

});
