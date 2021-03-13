let express = require("express")
let socketio = require("socket.io")
let http = require("http")
const { v4: uuidv4 } = require('uuid');

let app = express()
let server = http.Server(app)
let io = socketio(server)

app.use("/css", express.static( __dirname + "/css"))
app.use("/js", express.static( __dirname + "/js"))
app.use("/pages", express.static( __dirname + "/pages"))

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/pages/waitingRoom.html")
})

app.get('/r/:code', function (req, res) {
    res.sendFile(__dirname + "/pages/waitingRoom.html")
});

//----------------------------- SOCKETS

let roomList = []
let sockets = {}

io.on("connect", (socket) => {

    socket.on("createRoom", (data) => {

        let room = generateRoomToken()
        let uuid = uuidv4()

        let params = {
            "room": room,
            "uuidPlayer": uuid
        }

        roomList.push(
            {
                "room": room, 
                "playerList": [
                    {
                        "uuid": uuid, 
                        "pseudo": data.pseudo, 
                        "modo": true,
                        "ready": false,
                        "score": 0,
                        "dataSend": false,
                        "data": [],
                    }
                ],

                "wordList": [
                    "Prénom",
                    "Fruits & Légumes",
                    "Métier",
                    "Célebrité"
                ],

                "actualLetter": "",
                "historyLetter": [],

                "actualRound": 1,
                "maxRound": 3,

                /**
                 * Room states:
                 * 
                 *  - waiting: in waiting room
                 *  - game: in game
                 *  - results: results
                 *  - final: final results
                 */
                "state": "waiting"
            }
            );
        
        socket.uuid = uuid
        socket.room = room
        sockets[uuid] = socket
        
        socket.emit("saveUUID", uuid)
        socket.emit("roomCreated", params)
    })

    socket.on("getData", (data) => {
        let room = getRoom(roomList, socket.room)
        if(room) {
            let wordList = room.wordList
            let listPlayer = room.playerList
    
            socket.emit("dataSender", room)
            refreshAllPlayersWordsList(sockets, listPlayer, room)
        } else {socket.emit('error', 'serverError')}
    })

    socket.on("replayRefresh", (data) => {
        let room = getRoom(roomList, socket.room)
        if(room) {
            let listPlayer = room.playerList
            refreshAllPlayersList(sockets, listPlayer)
            refreshAllPlayersWordsList(sockets, listPlayer, room)
        } else {socket.emit('error', 'serverError')}
    })

    socket.on("newPlayer", (params) => {

        let room = getRoom(roomList, params.room)

        if(room) {
            let listPlayer = room.playerList
            let uuid = uuidv4()

            socket.room = params.room
            socket.uuid = uuid
            sockets[uuid] = socket

            listPlayer.push(
                {
                    "uuid": uuid, 
                    "pseudo": params.pseudo, 
                    "modo": false,
                    "ready": false,
                    "score": 0,
                    "dataSend": false,
                    "data": [],
                }
            )
            socket.emit("saveUUID", uuid)
            socket.emit("removeModal")

            refreshAllPlayersList(sockets, listPlayer)
            refreshAllPlayersWordsList(sockets, listPlayer, room)
        } else {socket.emit('error', 'serverError')}
    })

    socket.on('changeMaxRound', (newMax) => {
        let room = getRoom(roomList, socket.room)
        if(room) {
            room.maxRound = newMax
        }
    })

    socket.on("switchState", (data) => {
        let room = getRoom(roomList, socket.room)
        
        if(room) {
            let listPlayer = room.playerList
            var allReady = true
            for (var i = 0; i < listPlayer.length; i++){

                if(listPlayer[i].uuid == socket.uuid) {
                    listPlayer[i].ready = !listPlayer[i].ready
                    refreshAllPlayersList(sockets, listPlayer)
                }

                if(!listPlayer[i].ready)
                    allReady = false
            }
            if(allReady) {
                generateLetter(room)
                allPlayersReady(sockets, listPlayer)
                room.state = "game"
            }
        } else {socket.emit('error', 'serverError')}
    })

    socket.on("nextRoundPlayer", (data) => {
        let room = getRoom(roomList, socket.room)
        if(room) {
            let listPlayer = room.playerList
            var allReady = true
            for (var i = 0; i < listPlayer.length; i++){

                if(listPlayer[i].uuid == socket.uuid) {
                    if(!listPlayer[i].ready) {
                        listPlayer[i].ready = true
                        refreshAllPlayersListNextRound(sockets, listPlayer)
                    }
                }

                if(!listPlayer[i].ready)
                    allReady = false
            }
            if(allReady) {
                allPlayersReadyNextRound(sockets, room)
            }
        } else {socket.emit('error', 'serverError')}
    })

    socket.on("resultStop", (results) => {
        let room = getRoom(roomList, socket.room)

        if(room) {
            let listPlayer = room.playerList

            var allSend = true
            for (var i = 0; i < listPlayer.length; i++){
                if(listPlayer[i].uuid == socket.uuid) {
                    listPlayer[i].dataSend = true//!listPlayer[i].dataSend
                    listPlayer[i].data = results
                }

                if(!listPlayer[i].dataSend)
                allSend = false
            }
            if(allSend) {
                displayResultsAll(sockets, room)
            }
        } else {socket.emit('error', 'serverError')}
    })

    socket.on("disconnect", (data) => {   
        let room = getRoom(roomList, socket.room)
        if(room) {
            let listPlayer = room.playerList
            for (var i = 0; i < listPlayer.length; i++){
                if(listPlayer[i].uuid == socket.uuid) {
                    let index = listPlayer.indexOf(listPlayer[i]);
                    if (index > -1) {
                        listPlayer.splice(index, 1);
                    }
                    
                    /// Nobody in room
                    if(listPlayer.length == 0) {
                        deleteRoom(room)
                    } else {
                        refreshAllPlayersList(sockets, listPlayer)
                    }
                }
            }
        } else {socket.emit('error', 'serverError')}
    })

    function deleteRoom(roomDel) {
        for (var i = 0; i < roomList.length; i++){
            if(roomList[i].room == roomDel.room) {
                let index = roomList.indexOf(roomList[i]);
                if (index > -1) {
                    roomList.splice(index, 1);
                }
            }
        }
    }

    socket.on('checkRoomExist', (room) => {
        for(let r of roomList) {
            if(r.room == room) {
                if(r.state == "waiting") {
                    socket.emit('roomExist', null)
                    return
                } else {
                    socket.emit('error', 'inGame')
                    return
                }
            }
        }
        socket.emit('error', 'roomExist')
    })

    socket.on("addNewWord", word => {
        let room = getRoom(roomList, socket.room)

        if(room) {
            let wordList = room.wordList
            let listPlayer = room.playerList

            wordList.push(word)
            refreshAllPlayersWordsList(sockets, listPlayer, room)
        } else {socket.emit('error', 'serverError')}
    })

    socket.on("removeWord", word => {
        let room = getRoom(roomList, socket.room)

        if(room) {
            let wordList = room.wordList
            let listPlayer = room.playerList

            wordList.splice(wordList.indexOf(word), 1);
            refreshAllPlayersWordsList(sockets, listPlayer, room)
        } else {socket.emit('error', 'serverError')}
    })

    socket.on('stopAllPlayer', data => {
        let room = getRoom(roomList, socket.room)

        if(room) {
            let listPlayer = room.playerList

            for (var i = 0; i < listPlayer.length; i++){
                let uuid = listPlayer[i].uuid
                sockets[uuid].emit('stopRound', room)
            }
        } else {socket.emit('error', 'serverError')}
    })

    socket.on('editUserCase', data => {
        let room = getRoom(roomList, socket.room)
        if(room) {
            let indexPlayer = getIndex(socket.uuid, socket.room)
            let player = getPlayer(data.uuid, socket.room)
            player.index = indexPlayer
            for(let input of player.data) {
                if(input.pos == data.input.pos) {
                if(input.notes[indexPlayer]) {
                    input.notes[indexPlayer] = 0
                } else {
                    input.notes[indexPlayer] = 1
                }

                refreshChoice(sockets, room.playerList, player)
                }
            }
        } else {socket.emit('error', 'serverError')}
    })

    socket.on("replayGame", (data) => {
        let room = getRoom(roomList, socket.room)
        if(room) {
            let listPlayer = room.playerList
            resetRoom(room)
            replayAllPlayers(room.playerList)
        } else {socket.emit('error', 'serverError')}
    })

})

function resetRoom(room) {

    room.actualLetter = ""
    room.historyLetter = []
    room.actualRound = 1
    room.state = "waiting"

    for(let player of room.playerList) {
        player.score = 0
        player.data = []
        player.ready = false
        player.dataSend = false
    }
}

function reworkScorePlayer(room) {
    for(let player of room.playerList) {
        for(let input of player.data) {
            if(noteFavorite(input.notes) == '1') {
                player.score += 10
            } else if(noteFavorite(input.notes) == '5') {
                player.score += 5
            }
        }
    }
}

function noteFavorite(notes) {
    let lgt = notes.length
    let zero = 0
    for(let note of notes) {
        if(note < 1)
            zero++
    }

    if(zero == lgt/2) {
        return "5"
    } else if(zero < lgt/2){
        return "1"
    }
}

function refreshChoice(sockets, listPlayer, player) {
    for (var i = 0; i < listPlayer.length; i++){
        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('refreshChoice', player)
    }
}

function replayAllPlayers(listPlayer) {
    for (var i = 0; i < listPlayer.length; i++){
        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('replayGame', null)
    }
}

function refreshAllPlayersList(sockets, listPlayer) {
    for (var i = 0; i < listPlayer.length; i++){

        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('refreshList', listPlayer)
    }
}

function getIndex(uuid, code) {
    let room = getRoom(roomList, code)
    let playerList = room.playerList
    for(let i = 0; i<playerList.length; i++) {
        if(playerList[i].uuid == uuid) {
            return i
        }
    }
}

function getPlayer(uuid, code) {
    let room = getRoom(roomList, code)
    let playerList = room.playerList
    for(let i = 0; i<playerList.length; i++) {
        if(playerList[i].uuid == uuid) {
            return playerList[i]
        }
    }
}

function refreshAllPlayersListNextRound(sockets, listPlayer) {
    for (var i = 0; i < listPlayer.length; i++){
        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('refreshNextRound', listPlayer)
    }
}

function refreshAllPlayersWordsList(sockets, listPlayer, room) {
    for (var i = 0; i < listPlayer.length; i++){

        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('wordList', getRoom(roomList, sockets[uuid].room))

        if(listPlayer[i].modo) {
            sockets[uuid].emit('gameSettings', room) 
        }
    }
}

function displayResultsAll(sockets, room) {
    let listPlayer = room.playerList
    for (var i = 0; i < listPlayer.length; i++){
        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('displayResults', room)
    }
}

function allPlayersReady(sockets, listPlayer) {
    for (var i = 0; i < listPlayer.length; i++){

        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('gameStarting', getRoom(roomList, sockets[uuid].room))
    }
    resetReady(listPlayer)
}

function allPlayersReadyNextRound(sockets, room) {
    room.actualRound = room.actualRound + 1
    reworkScorePlayer(room)
    if(room.actualRound <= room.maxRound) {
        nextRound(sockets, room)
    } else {
        finishGame(sockets, room)
    }
}

function nextRound(sockets, room) {
    generateLetter(room)
    let listPlayer = room.playerList
    for (var i = 0; i < listPlayer.length; i++){
        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('nextRound', getRoom(roomList, sockets[uuid].room))
    }
    resetReady(listPlayer)
}

function finishGame(sockets, room) {
    let listPlayer = room.playerList
    for (var i = 0; i < listPlayer.length; i++){

        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('endResults', room)
    }
}

function resetReady(listPlayer) {
    for (var i = 0; i < listPlayer.length; i++){
        listPlayer[i].ready = false
        listPlayer[i].dataSend = false
    }
}

function getRoom(roomList, code) {
    for (var i = 0; i < roomList.length; i++){
        if (roomList[i].room == code){
            return roomList[i]
        }
    }
}

function generateRoomToken() {
    var firstPart = (Math.random() * 46656) | 0;
    var secondPart = (Math.random() * 46656) | 0;
    firstPart = ("000" + firstPart.toString(36)).slice(-3);
    secondPart = ("000" + secondPart.toString(36)).slice(-3);
    return firstPart + secondPart;
}

function generateLetter(room) {
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let res = ""
    do {
        res = characters.charAt(Math.floor(Math.random() * characters.length))
    } while (room.historyLetter.includes(res))
    room.actualLetter = res
    room.historyLetter.push(res)
 }

server.listen(1331)