<a name="RoomManager"></a>

## RoomManager
RoomManager class

**Kind**: global class  

* [RoomManager](#RoomManager)
    * [.getRoom(code)](#RoomManager+getRoom) ⇒
    * [.addRoom(room)](#RoomManager+addRoom)
    * [.deleteRoom(roomDel)](#RoomManager+deleteRoom)
    * [.roomExist(code, success, error)](#RoomManager+roomExist)

<a name="RoomManager+getRoom"></a>

### roomManager.getRoom(code) ⇒
Get room from code

**Kind**: instance method of [<code>RoomManager</code>](#RoomManager)  
**Returns**: room  

| Param | Type |
| --- | --- |
| code | <code>RoomCode</code> | 

<a name="RoomManager+addRoom"></a>

### roomManager.addRoom(room)
Add new room to rooms

**Kind**: instance method of [<code>RoomManager</code>](#RoomManager)  

| Param | Type |
| --- | --- |
| room | [<code>Room</code>](#Room) | 

<a name="RoomManager+deleteRoom"></a>

### roomManager.deleteRoom(roomDel)
**Kind**: instance method of [<code>RoomManager</code>](#RoomManager)  

| Param | Type | Description |
| --- | --- | --- |
| roomDel | [<code>Room</code>](#Room) | Remove room from roomsList |

<a name="RoomManager+roomExist"></a>

### roomManager.roomExist(code, success, error)
**Kind**: instance method of [<code>RoomManager</code>](#RoomManager)  

| Param | Type | Default |
| --- | --- | --- |
| code | <code>code</code> |  | 
| success | <code>Callback</code> |  | 
| error | <code>Callback</code> | <code></code> | 

