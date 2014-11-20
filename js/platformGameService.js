'use strict'; 

angular.module('myApp')
.service('platformGameService', function($rootScope, $log, $window, $interval, serverApiService, platformMessageService) {

  var image0, image1;
  var player0 = false;
  var player1 = false;
  var gameStatus = "Loading game, please wait";
  var gameUrl;

  //SOME important VARIABLES
  var state;//current game state
  var turnIndex;//current turn index
  var playersInfo;
  var playerID, matchID, gameID, accessSignature, myPlayerIndex, matchInfo;

  var newmatch = false;//whether to create a new match or not, default set to false

  var timeinterval = 1000;
  
  var MENU_URL = '#/menu';

  var beforeHashUrl; 
  var platformUrl; 
  var platformUrl2;
  
  this.resetAll = function() {
    image0 = undefined;
    image1 = undefined;
    player0 = false;
    player1 = false;
    gameStatus = "Loading game, please wait";
    gameUrl = undefined;
    state = undefined;
    turnIndex = undefined;
    playersInfo = undefined;
    playerID = undefined;
    matchID = undefined;
    gameID = undefined;
    accessSignature = undefined;
    myPlayerIndex = undefined;
    matchInfo = undefined;
    newmatch = false;
    beforeHashUrl = undefined;
    platformUrl = undefined;
    platformUrl2 = undefined;
    numberOfMoves = 0;
    playsound = true;
    latestUpdateTime = 0;
    move = undefined;
    timeinterval = 1000;
  }
  
  this.clearInterval = function() {
    if($rootScope.menu_interval !== undefined){
      $interval.cancel($rootScope.menu_interval);
      $rootScope.menu_interval = undefined;
    }
  }

  //===================== JS_ERROR_CATCHING ====================//
  // Quick function to both alert and log requested message as error
  function alert_log_error(alert, log) {
    $log.error("Alert & Log Error: ", log);
    return;
  }

  function setGame(entireUrl) {
    //================FUNCTION: parseURL()================//
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
        if (subparse[0].toLowerCase() === 'matchid') {
          matchID = subparse[1];
        } else if (subparse[0].toLowerCase() === 'gameid') {
          gameID = subparse[1];
        }
      }
    }
    //================END OF FUNCTION: parseURL()================//



    //================FUNCTION: getLocalVars()================//
    var myPlayerInfo = $window.localStorage.getItem("playerInfo");
    myPlayerInfo = JSON.parse(angular.fromJson(myPlayerInfo));
    playerID = myPlayerInfo.myPlayerId;
    accessSignature = myPlayerInfo.accessSignature;
    myPlayerIndex = parseInt($window.localStorage.getItem(matchID));//get myplayerindex from localstorage
    var stringMatchObj = $window.localStorage.getItem("matchInfo");
    matchInfo = JSON.parse(stringMatchObj);
    //================END OF FUNCTION: getLocalVars()================//



    //================FUNCTION: checkVars()================//
    if (gameID !== undefined) {
      $log.info("GAMEID: ", gameID);
    } else { alert_log_error("GAMEID required in URL.", "Required URL Format: .../platform_game.html?matchid=1&gameid=2"); }
    if (matchID !== undefined) {
      $log.info("MATCHID: ", matchID);
    }
    else {
      newmatch = true;//matchID not found in URL, so create new match
      myPlayerIndex = 0;
      turnIndex = 0;
      state = {};
    }
    if (playerID !== undefined) {
      $log.info("PLAYERID: ", playerID);
    } else { alert_log_error("Cannot find PLAYERID.", "PLAYERID not in LOCALSTORAGE."); }
    if (accessSignature !== undefined) {
      $log.info("ACCESS_SIGNATURE: ", accessSignature);
    } else { alert_log_error("Cannot find ACCESSSIGNATURE.", "ACCESSSIGNATURE not in LOCALSTORAGE."); }
    if (matchInfo !== undefined) {
      $log.info("MATCH_INFO: ", matchInfo);
    } else { $log.info("MATCHINFO not in LOCALSTORAGE."); }
    //================END OF FUNCTION: checkVars()================//
  }

  function deleteGame (callback) {
    if(matchID===undefined || playerID===undefined || accessSignature===undefined) {
      alert_log_error("Invalid credentials to dismissMatch.", 
        "Cannot dismissMatch because matchID, playerID, or accessSignature is undefined.");
      callback(false);
    } else {
      var messageObj = [{dismissMatch:
                      {matchId: matchID, myPlayerId: playerID, accessSignature: accessSignature}}];

      var confirmation = $window.confirm("Are you sure you want to delete this game?");
      if (confirmation) {
        $log.info("deleteGame: Deleting.", messageObj);
        $window.localStorage.removeItem(matchID);
        serverApiService.sendMessage(messageObj,
          function (response) {
            $log.info("DismissMatch response: ", JSON.stringify(response));
            if(response[0]['error']!==undefined) {
              alert_log_error(response[0]['error'], ["serverAPI failed to dismissMatch.", response[0]['error']]);
              callback(false);
            } else {
              $log.info("Game successfully deleted, redirecting to Main Menu: ", MENU_URL);
              callback(true);
            }
          });
      } else {
        $log.info("deleteGame: Canceled.");
        callback(false);
      }
    }
  }
  
  this.fetchGameUrl = function (callback) {
    $log.info("platformGameService getGameUrl");
    serverApiService.sendMessage(
      [{getGames: {gameId: gameID}}],
      function (response) {
        $log.info("getGameUrl response:",response);
        gameUrl = response[0].games[0].gameUrl;
        $log.info("fetchGameUrldev:",gameUrl);
        callback(gameUrl);
      });
  }
  
  
  function beginLoop() {
    $rootScope.interval = $interval(checkChanges, timeinterval);
  }

  var numberOfMoves = 0;//number of moves, used to determine if there's any change
  var playsound = true;
  var latestUpdateTime = 0;//update time millis
  function checkChanges() {
    $log.info("checking changes for:", matchID);
    $interval.cancel($rootScope.interval);
    $rootScope.interval = undefined;
    timeinterval = 2 * timeinterval;
    $rootScope.interval = $interval(checkChanges, timeinterval);
    //--------------I DON'T REALLY UNDERSTAND THIS PART MYSELF----------------//
    if (newmatch) {
      var params = {stateAfterMove: state, 
                    turnIndexAfterMove: turnIndex, 
                    yourPlayerIndex: myPlayerIndex, 
                    playersInfo: [{playerId: playerID}]};
      platformMessageService.sendMessage({updateUI: params});
    //--------------I DON'T REALLY UNDERSTAND THIS PART MYSELF----------------//
    } else {
      if (latestUpdateTime === 0) {
        serverApiService.sendMessage(
          //get all the matches that is being played or has been played by this player
          [{getPlayerMatches: {gameId: gameID, 
                              getCommunityMatches: true, 
                              myPlayerId: playerID, 
                              accessSignature: accessSignature}}],
          function (response) {
            $log.info("checkChanges getPlayerMatches response: ", response);
            var matches = response[0]["matches"];
            if(matches === undefined) {
              $log.info("Cannot getPlayerMatches.", response);
              return;
            }
            //search through all matches to find the match that has matchID
            var i = 0;
            while(i<matches.length && matches[i].matchId!==matchID) {
              if (matches[i].updatedTimestampMillis > latestUpdateTime) {
                  latestUpdateTime = matches[i].updatedTimestampMillis;
              }
              i++;
            }
            if(i===matches.length && matchInfo!==undefined){ //first time to this match, not reserve sucessfully yet
              numberOfMoves = matchInfo.history.moves.length;
              if (playsound){
               updateStatus();
                 playsound = false;
              }
            }
            else if (matches[i].matchId === matchID) {
              if (matches[i].updatedTimestampMillis > latestUpdateTime) {
                latestUpdateTime = matches[i].updatedTimestampMillis;
              }
              matchInfo = matches[i];
              //if there is a mismatch between local numberOfMoves and match history moves length, 
              //then update status and UI
              if (matchInfo.history.moves.length !== numberOfMoves) {
                numberOfMoves = matchInfo.history.moves.length;
                updateStatus();
              }
            }
          }
        );
      }
      //pull matches changed since latestUpdateTime
      else {
        serverApiService.sendMessage(
          //get all the matches that is being played or has been played by this player
          [{getPlayerMatches: {gameId: gameID, 
                              getCommunityMatches: true, 
                              myPlayerId: playerID, 
                              accessSignature: accessSignature, 
                              updatedTimestampMillisAtLeast: latestUpdateTime}}],
          function (response) {
            $log.info("checkChanges getPlayerMatches after latestUpdateTime response: ", response);
            var matches = response[0]["matches"];
            if(matches === undefined) {
              $log.info("No match updated since time:", latestUpdateTime, response);
              return;
            }
            //search through all matches to find tha match that has matchID
            var i = 0;
            while(i<matches.length && matches[i].matchId!==matchID) {
              if (matches[i].updatedTimestampMillis > latestUpdateTime) {
                latestUpdateTime = matches[i].updatedTimestampMillis;
              }
              i++;
            }
            if (i===matches.length) {
              /* Do Something here?*/
            }
            else if (matches[i].matchId === matchID) {
              if (matches[i].updatedTimestampMillis > latestUpdateTime) {
                latestUpdateTime = matches[i].updatedTimestampMillis;
              }
              matchInfo = matches[i];
              //if there is a mismatch between local numberOfMoves and match history moves length, 
              //then update status and UI
              if (matchInfo.history.moves.length !== numberOfMoves) {
                numberOfMoves = matchInfo.history.moves.length;
                updateStatus();
              }
            }
          }
        );
      }
    }
  }

  function updateStatus() {
    playersInfo = matchInfo.playersInfo;//info of two players
    if (playersInfo[0]){
      image0 = playersInfo[0].avatarImageUrl;
      player0 = playersInfo[0].displayName;
      $log.info("platformService updateStatus Player0: ", player0)
    }
    if (playersInfo[1]) {
      image1 = playersInfo[1].avatarImageUrl;
      player1 = playersInfo[1].displayName;
      $log.info("platformService updateStatus Player1: ", player1)
    }

    var states = matchInfo.history.stateAfterMoves;//all the states
    state = states[states.length - 1];//current game state

    var moves = matchInfo.history.moves;//all the moves

    //update status

    //game is ongoing
    if (moves[moves.length - 1][0].setTurn) {
      turnIndex = moves[moves.length - 1][0].setTurn.turnIndex;
      if (playersInfo[turnIndex]) {
        if (turnIndex == myPlayerIndex) {
          gameStatus = "Game ongoing. This is your turn.";
        }
        if (turnIndex == (1 - myPlayerIndex)) {
          gameStatus = "Game ongoing. This is the opponent's turn.";
        }
      }
      else {
        gameStatus = "Waiting for opponent to join";
      }
    }
    //game ended
    else if (moves[moves.length - 1][0].endMatch) {
      var score = moves[moves.length - 1][0].endMatch.endMatchScores;
      //same score, game ends in tie
      if (score[0] === score[1]) {
        gameStatus = "Game ended in a tie";
      }
      //player 0 has higher socre
      else if (score[myPlayerIndex] > score[1 - myPlayerIndex]) {
        gameStatus = "You have won the match!";
      }
      //player 1 has higher score
      else {
        gameStatus = "You have lost the match!";
      }
    }

    //update UI
    var params = {stateAfterMove: state, 
                  turnIndexAfterMove: turnIndex, 
                  yourPlayerIndex: myPlayerIndex, 
                  playersInfo: playersInfo};
    platformMessageService.sendMessage({updateUI: params});
  }

  var move;//move made by player
  platformMessageService.addMessageListener(function (message) {
    $log.info("PlatformMessageService: got a message.",message);
    if (message.gameReady !== undefined) {
      checkChanges();
      if (newmatch) {
        gameStatus = "New game created, please make a move";
      }
    }
    //iframe send a move to platform
    else if (message.makeMove !== undefined) {
      $log.info("PlatformMessageService: makeMove.")
      move = message.makeMove;//store the move locally, will be sent to server if isMoveOk
      var params;
      if (move[0].endMatch) {
        params = {move: move, 
                  turnIndexBeforeMove: turnIndex, 
                  turnIndexAfterMove: 1 - turnIndex, 
                  stateBeforeMove: state, 
                  stateAfterMove: {}};
      }
      else {
        params = {move: move, 
                  turnIndexBeforeMove: turnIndex, 
                  turnIndexAfterMove: move[0].setTurn.turnIndex, 
                  stateBeforeMove: state, 
                  stateAfterMove: {}};
      }
      platformMessageService.sendMessage({isMoveOk: params});//let iframe check isMoveOk, will hear back from iframe
    }
    else if (message.isMoveOkResult !== undefined) {
      $log.info("PlatformMessageService: isMoveOkResult.")
      //iframe finish checking isMoveOk and send the result to platform
      //move is ok, send it to server
      if (message.isMoveOkResult === true) {
        if (!newmatch) {
          //normal move
          serverApiService.sendMessage(
            [{madeMove: {matchId: matchID, 
                        move: move, 
                        moveNumber: numberOfMoves, 
                        myPlayerId: playerID, 
                        accessSignature: accessSignature}}],
            function (response) {
              $log.info("serverApiService: madeMove: ", response);
              checkChanges();
              $interval.cancel($rootScope.interval);
              $rootScope.interval = undefined;
              timeinterval = 1000;
              $rootScope.interval = $interval(checkChanges, timeinterval);
              });
          }
          else {
            //create new match
            serverApiService.sendMessage(
              [{newMatch: {gameId: gameID, 
                          tokens: 0, 
                          move: move, 
                          startAutoMatch: {numberOfPlayers: 2}, 
                          myPlayerId: playerID, 
                          accessSignature: accessSignature}}],
              function (response) {
                $log.info("serverApiService: newmatch: ", response);
                newmatch = false;//finish crating new match
                matchID = response[0]["matches"][0].matchId;
                $window.localStorage.setItem(matchID, "0");//store myplayerindex for this match in local storage
                checkChanges();
                $interval.cancel($rootScope.interval);
                $rootScope.interval = undefined;
                timeinterval = 1000;
                $rootScope.interval = $interval(checkChanges, timeinterval);
              });
          }
      }
      //illegal move
      else {
        //throwError("You declared a hacker for a legal move! move=" + move);
      }
    }
    //got a error from iframe and send it to server
    else if (message.emailJavaScriptError !== undefined && $rootScope.EMAIL_JS_ERRORS) {
      serverApiService.sendMessage(
        message,
        function (response) {
            $log.info("serverApiService: emailjserror: ", response);
        });
    }
  });

  function getImage0() {
    return image0;
  }

  function getImage1() {
    return image1;
  }

  function getPlayer0() {
    return player0;
  }

  function getPlayer1() {
    return player1;
  }

  function getGameStatus() {
    return gameStatus;
  }
  
  function getGameUrl() {
    return gameUrl;
  }


// Cache the div so that the browser doesn't have to find it every time the window is resized.
this.rescaleDivs = function () {
                                var $doc = $window.document;
                                $log.info("Service called rescaleDivs")
                                var div_goback = $doc.getElementById('SMPG_game_goback2');
                                if (div_goback !== undefined) {
                                    var height_goback = div_goback.clientHeight;
                                    div_goback.style.fontSize = (height_goback - 2) + 'px';
                                }
                                var div_delete = $doc.getElementById('SMPG_game_delete2');
                                if (div_delete !== undefined) {
                                    var height_delete = div_delete.clientHeight;
                                    div_delete.style.fontSize = (height_delete - 2) + 'px';
                                }
                                var div_players = $doc.getElementById('SMPG_game_players');
                                var div_av0 = $doc.getElementById('SMPG_game_av0');
                                var div_av1 = $doc.getElementById('SMPG_game_av1');
                                if (div_players!==undefined && div_av0!==undefined) {
                                    var height_players = div_players.clientHeight;
                                    if (div_players.clientWidth < div_players.clientHeight * 10) {
                                        div_av0.style.height = (div_players.clientWidth / 10) + 'px';
                                        div_av0.style.width = (div_players.clientWidth / 10) + 'px';
                                        div_av1.style.height = (div_players.clientWidth / 10) + 'px';
                                        div_av1.style.width = (div_players.clientWidth / 10) + 'px';
                                    }
                                }
                            }



  this.beginLoop = beginLoop;
  this.setGame = setGame;
  this.getImage1 = getImage1;
  this.getImage0 = getImage0;
  this.getPlayer1 = getPlayer1;
  this.getPlayer0 = getPlayer0;
  this.getGameStatus = getGameStatus;
  this.deleteGame = deleteGame;
  this.getGameUrl = getGameUrl;
});
/*.factory('$exceptionHandler', function ($window, $log) {
  return function (exception, cause) {
    $log.info("Platform had an exception:", exception, cause);
    var exceptionString = angular.toJson({exception: exception, cause: cause, lastMessage: $window.lastMessage}, true);
    var message = 
        {
          emailJavaScriptError: 
            {
              gameDeveloperEmail: "rshen1993@gmail.com", 
              emailSubject: "Error in platform " + $window.location, 
              emailBody: exceptionString
            }
        };
    $window.parent.postMessage(message, "*");
    $window.alert(exceptionString);
  };
});*/
