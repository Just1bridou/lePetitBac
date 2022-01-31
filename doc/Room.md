<a name="Room"></a>

## Room
Room Class

**Kind**: global class  

* [Room](#Room)
    * [.mode](#Room+mode)
    * [.state](#Room+state)
    * [.addPlayer(player)](#Room+addPlayer)
    * [.generateRoomToken()](#Room+generateRoomToken) ⇒
    * [.startGame(sockets, playersList)](#Room+startGame)
    * [.sendToAll(sockets, action, params, cb)](#Room+sendToAll)
    * [.sendToAdmins(sockets, action, params, cb)](#Room+sendToAdmins)
    * [.sendToAllOnline(sockets, action, params, cb)](#Room+sendToAllOnline)
    * [.resetPlayerState(playersList)](#Room+resetPlayerState)
    * [.getPlayer(uuid, code)](#Room+getPlayer) ⇒
    * [.kickPlayer(uuid, cb)](#Room+kickPlayer)
    * [.generateLetter()](#Room+generateLetter)
    * [.updateMaxRound(sockets, newMax)](#Room+updateMaxRound)
    * [.switchState(sockets, uuid)](#Room+switchState)
    * [.playerReady(sockets, uuid)](#Room+playerReady)
    * [.updateNextRound()](#Room+updateNextRound)
    * [.reworkScorePlayer(room)](#Room+reworkScorePlayer)
    * [.nextRound(sockets)](#Room+nextRound)
    * [.finishGame(sockets)](#Room+finishGame)
    * [.allPlayersReadyNextRound(sockets)](#Room+allPlayersReadyNextRound)
    * [.displayResultsAll(sockets)](#Room+displayResultsAll)
    * [.refreshPlayersWordsList(sockets, playersList, room)](#Room+refreshPlayersWordsList)
    * [.refreshPlayersList(sockets, playersList)](#Room+refreshPlayersList)
    * [.refreshPlayersListNextRound(sockets)](#Room+refreshPlayersListNextRound)
    * [.refreshChoice(sockets, player)](#Room+refreshChoice)
    * [.changeGameMode(mode, words)](#Room+changeGameMode)
    * [.generateWordsList()](#Room+generateWordsList)
    * [.getRandomCategories()](#Room+getRandomCategories) ⇒
    * [.addWordToWordsList(sockets, word)](#Room+addWordToWordsList)
    * [.removeWordFromList(sockets, word)](#Room+removeWordFromList)
    * [.resultStop(uuid, results)](#Room+resultStop)
    * [.stopAllPlayers(sockets)](#Room+stopAllPlayers)
    * [.notifyPlayers(pseudo, reason)](#Room+notifyPlayers)
    * [.playerLeave(sockets, uuid, cb)](#Room+playerLeave)
    * [.allPlayersOffline()](#Room+allPlayersOffline) ⇒
    * [.replayGame()](#Room+replayGame)
    * [.reset(room)](#Room+reset)
    * [.getIndex(uuid)](#Room+getIndex) ⇒
    * [.getRndInteger(min, max)](#Room+getRndInteger) ⇒

<a name="Room+mode"></a>

### room.mode
Room modes:- CLASSIC- RANDOM

**Kind**: instance property of [<code>Room</code>](#Room)  
<a name="Room+state"></a>

### room.state
Room states: - waiting: in waiting room - game: in game - results: results - final: final results

**Kind**: instance property of [<code>Room</code>](#Room)  
<a name="Room+addPlayer"></a>

### room.addPlayer(player)
Add player to room

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| player | [<code>Player</code>](#Player) | 

<a name="Room+generateRoomToken"></a>

### room.generateRoomToken() ⇒
Generate room token

**Kind**: instance method of [<code>Room</code>](#Room)  
**Returns**: token  
<a name="Room+startGame"></a>

### room.startGame(sockets, playersList)
Start game for all player

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 
| playersList | [<code>Array.&lt;Player&gt;</code>](#Player) | 

<a name="Room+sendToAll"></a>

### room.sendToAll(sockets, action, params, cb)
Send message to all players

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type | Default |
| --- | --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> |  | 
| action | <code>string</code> |  | 
| params | <code>Object</code> |  | 
| cb | <code>Callback</code> | <code></code> | 

<a name="Room+sendToAdmins"></a>

### room.sendToAdmins(sockets, action, params, cb)
Send message to admins

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type | Default |
| --- | --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> |  | 
| action | <code>string</code> |  | 
| params | <code>Object</code> |  | 
| cb | <code>Callback</code> | <code></code> | 

<a name="Room+sendToAllOnline"></a>

### room.sendToAllOnline(sockets, action, params, cb)
Send message to all players online

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type | Default |
| --- | --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> |  | 
| action | <code>string</code> |  | 
| params | <code>Object</code> |  | 
| cb | <code>Callback</code> | <code></code> | 

<a name="Room+resetPlayerState"></a>

### room.resetPlayerState(playersList)
Reset ready state & data for players

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| playersList | [<code>Array.&lt;Player&gt;</code>](#Player) | 

<a name="Room+getPlayer"></a>

### room.getPlayer(uuid, code) ⇒
Get player in room with UUID

**Kind**: instance method of [<code>Room</code>](#Room)  
**Returns**: player  

| Param | Type |
| --- | --- |
| uuid | <code>UUID</code> | 
| code | <code>RoomCode</code> | 

<a name="Room+kickPlayer"></a>

### room.kickPlayer(uuid, cb)
Kick player from room

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| uuid | <code>UUID</code> | 
| cb | <code>string</code> | 

<a name="Room+generateLetter"></a>

### room.generateLetter()
Generate a letter who's not in history

**Kind**: instance method of [<code>Room</code>](#Room)  
<a name="Room+updateMaxRound"></a>

### room.updateMaxRound(sockets, newMax)
Update the max rounds of the game (max rounds : 25)

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 
| newMax | <code>int</code> | 

<a name="Room+switchState"></a>

### room.switchState(sockets, uuid)
Player press ready button in waiting room

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 
| uuid | <code>UUID</code> | 

<a name="Room+playerReady"></a>

### room.playerReady(sockets, uuid)
Player is ready

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 
| uuid | <code>UUID</code> | 

<a name="Room+updateNextRound"></a>

### room.updateNextRound()
Update new round

**Kind**: instance method of [<code>Room</code>](#Room)  
<a name="Room+reworkScorePlayer"></a>

### room.reworkScorePlayer(room)
**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type | Description |
| --- | --- | --- |
| room | [<code>Room</code>](#Room) | Compute the score for each player of the round |

<a name="Room+nextRound"></a>

### room.nextRound(sockets)
New round

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 

<a name="Room+finishGame"></a>

### room.finishGame(sockets)
Game is finish

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 

<a name="Room+allPlayersReadyNextRound"></a>

### room.allPlayersReadyNextRound(sockets)
Start a new round

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 

<a name="Room+displayResultsAll"></a>

### room.displayResultsAll(sockets)
Display Result section for all players

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 

<a name="Room+refreshPlayersWordsList"></a>

### room.refreshPlayersWordsList(sockets, playersList, room)
Refresh word list on Waiting screen for all players

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 
| playersList | [<code>Array.&lt;Player&gt;</code>](#Player) | 
| room | <code>ROom</code> | 

<a name="Room+refreshPlayersList"></a>

### room.refreshPlayersList(sockets, playersList)
**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 
| playersList | [<code>Array.&lt;Player&gt;</code>](#Player) | 

<a name="Room+refreshPlayersListNextRound"></a>

### room.refreshPlayersListNextRound(sockets)
Refresh player's list on Results section

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 

<a name="Room+refreshChoice"></a>

### room.refreshChoice(sockets, player)
Refresh result's line of player for each room players

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 
| player | <code>player</code> | 

<a name="Room+changeGameMode"></a>

### room.changeGameMode(mode, words)
Change game mode

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| mode | <code>mode</code> | 
| words | <code>Array.&lt;words&gt;</code> | 

<a name="Room+generateWordsList"></a>

### room.generateWordsList()
Generate words list

**Kind**: instance method of [<code>Room</code>](#Room)  
<a name="Room+getRandomCategories"></a>

### room.getRandomCategories() ⇒
Get random categories

**Kind**: instance method of [<code>Room</code>](#Room)  
**Returns**: string[]  
<a name="Room+addWordToWordsList"></a>

### room.addWordToWordsList(sockets, word)
Add word to words list

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 
| word | <code>string</code> | 

<a name="Room+removeWordFromList"></a>

### room.removeWordFromList(sockets, word)
Remove word from words list

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 
| word | <code>string</code> | 

<a name="Room+resultStop"></a>

### room.resultStop(uuid, results)
Update players result

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| uuid | <code>UUID</code> | 
| results | <code>Array.&lt;data&gt;</code> | 

<a name="Room+stopAllPlayers"></a>

### room.stopAllPlayers(sockets)
Stop all players when someone click on stop

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 

<a name="Room+notifyPlayers"></a>

### room.notifyPlayers(pseudo, reason)
Send notification to players

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| pseudo | <code>Player.pseudo</code> | 
| reason | <code>string</code> | 

<a name="Room+playerLeave"></a>

### room.playerLeave(sockets, uuid, cb)
Disconnect player

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| sockets | <code>Array.&lt;socket&gt;</code> | 
| uuid | <code>string</code> | 
| cb | <code>Callback</code> | 

<a name="Room+allPlayersOffline"></a>

### room.allPlayersOffline() ⇒
Check if all players are offline

**Kind**: instance method of [<code>Room</code>](#Room)  
**Returns**: bool  
<a name="Room+replayGame"></a>

### room.replayGame()
Replay game

**Kind**: instance method of [<code>Room</code>](#Room)  
<a name="Room+reset"></a>

### room.reset(room)
Reset the game and the player's score

**Kind**: instance method of [<code>Room</code>](#Room)  

| Param | Type |
| --- | --- |
| room | [<code>Room</code>](#Room) | 

<a name="Room+getIndex"></a>

### room.getIndex(uuid) ⇒
Get index pos of player

**Kind**: instance method of [<code>Room</code>](#Room)  
**Returns**: index of player in room's playersList  

| Param | Type |
| --- | --- |
| uuid | <code>UUID</code> | 

<a name="Room+getRndInteger"></a>

### room.getRndInteger(min, max) ⇒
Get random int [min, max[

**Kind**: instance method of [<code>Room</code>](#Room)  
**Returns**: rdm(int)  

| Param | Type |
| --- | --- |
| min | <code>int</code> | 
| max | <code>int</code> | 

