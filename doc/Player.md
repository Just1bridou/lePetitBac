<a name="Player"></a>

## Player
Player Class

**Kind**: global class  

* [Player](#Player)
    * [.generateRandomAvatarShape()](#Player+generateRandomAvatarShape) ⇒
    * [.generateRandomAvatarColor()](#Player+generateRandomAvatarColor) ⇒
    * [.editUserCase(room)](#Player+editUserCase)
    * [.updateScore(room)](#Player+updateScore)
    * [.computeNote(notes)](#Player+computeNote) ⇒
    * [.countSameWords(inputPlayer, players)](#Player+countSameWords) ⇒
    * [.normalizeWord(word)](#Player+normalizeWord) ⇒
    * [.getRndInteger(min, max)](#Player+getRndInteger) ⇒

<a name="Player+generateRandomAvatarShape"></a>

### player.generateRandomAvatarShape() ⇒
Generate random avatar between triangle, square. round

**Kind**: instance method of [<code>Player</code>](#Player)  
**Returns**: AVATARS[x]  
<a name="Player+generateRandomAvatarColor"></a>

### player.generateRandomAvatarColor() ⇒
Generate random color for avatar

**Kind**: instance method of [<code>Player</code>](#Player)  
**Returns**: color rgb()  
<a name="Player+editUserCase"></a>

### player.editUserCase(room)
Update resultCase when someone switch state of it

**Kind**: instance method of [<code>Player</code>](#Player)  

| Param | Type |
| --- | --- |
| room | [<code>Room</code>](#Room) | 

<a name="Player+updateScore"></a>

### player.updateScore(room)
Compute score of player

**Kind**: instance method of [<code>Player</code>](#Player)  

| Param | Type |
| --- | --- |
| room | [<code>Room</code>](#Room) | 

<a name="Player+computeNote"></a>

### player.computeNote(notes) ⇒
**Kind**: instance method of [<code>Player</code>](#Player)  
**Returns**: Score of the player for one response  

| Param | Type |
| --- | --- |
| notes | <code>0</code> \| <code>1</code> | 

<a name="Player+countSameWords"></a>

### player.countSameWords(inputPlayer, players) ⇒
**Kind**: instance method of [<code>Player</code>](#Player)  
**Returns**: int  

| Param | Type |
| --- | --- |
| inputPlayer | <code>input</code> | 
| players | [<code>Array.&lt;Player&gt;</code>](#Player) | 

<a name="Player+normalizeWord"></a>

### player.normalizeWord(word) ⇒
Normalize word

**Kind**: instance method of [<code>Player</code>](#Player)  
**Returns**: string  

| Param | Type |
| --- | --- |
| word | <code>string</code> | 

<a name="Player+getRndInteger"></a>

### player.getRndInteger(min, max) ⇒
Get random int [min, max[

**Kind**: instance method of [<code>Player</code>](#Player)  
**Returns**: rdm(int)  

| Param | Type |
| --- | --- |
| min | <code>int</code> | 
| max | <code>int</code> | 

