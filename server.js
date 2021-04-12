let express = require("express")
let socketio = require("socket.io")
let http = require("http")

const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

let app = express()
let server = http.Server(app)
let io = socketio(server)

app.use("/css", express.static( __dirname + "/css"))
app.use("/js", express.static( __dirname + "/js"))
app.use("/pages", express.static( __dirname + "/pages"))
app.use("/images", express.static( __dirname + "/images/"))
app.use("/avatar", express.static( __dirname + "/avatars/"))

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/pages/game.html")
})

app.get('/r/:code', function (req, res) {
    res.sendFile(__dirname + "/pages/game.html")
});

// roomList contain all rooms of the server
let roomList = []

// sockets contain all player's socket of the server
let sockets = {}

const ROOM_MODE = ["CLASSIC", "RANDOM"]
const AVATARS = [
    "/avatar/burger.png",
    "/avatar/donut.png",
    "/avatar/pizza.png"
]

io.on("connect", (socket) => {

    /**
     * Player wants to created new room
     */
    socket.on("createRoom", (data) => {

        let room = generateRoomToken()
        let uuid = uuidv4()

        let params = {
            "room": room,
            "uuidPlayer": uuid
        }

        let player = {
            "uuid": uuid, 
            "pseudo": data.pseudo, 
            "avatar": AVATARS[getRndInteger(0,AVATARS.length)],
            "modo": true,
            "ready": false,
            "score": 0,
            "dataSend": false,
            "data": [],
        }

        roomList.push(
            {
                "room": room, 
                "playerList": [
                    player
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
                 * Room modes:
                 * - CLASSIC
                 * - RANDOM
                 */
                "mode": "CLASSIC",

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
        
        // Client save UUID in sessionStorage
        socket.emit("saveUUID", player)

        // Room created
        socket.emit("roomCreated", params)
    })

    /**
     * Send game's data to client
     */
    socket.on("getData", (data) => {
        let room = getRoom(roomList, socket.room)
        if(room) {
            let wordList = room.wordList
            let listPlayer = room.playerList
    
            socket.emit("dataSender", room)
            refreshAllPlayersWordsList(sockets, listPlayer, room)
        } else {socket.emit('error', 'serverError')}
    })

    /**
     * Replay an other game
     */
    socket.on("replayRefresh", (data) => {
        let room = getRoom(roomList, socket.room)
        if(room) {
            let listPlayer = room.playerList
            refreshAllPlayersList(sockets, listPlayer)
            refreshAllPlayersWordsList(sockets, listPlayer, room)
        } else {socket.emit('error', 'serverError')}
    })

    /**
     * Add new player to room
     */
    socket.on("newPlayer", (params) => {

        let room = getRoom(roomList, params.room)

        if(room) {
            let listPlayer = room.playerList
            let uuid = uuidv4()

            socket.room = params.room
            socket.uuid = uuid
            sockets[uuid] = socket

            let player = {
                "uuid": uuid, 
                "pseudo": params.pseudo, 
                "avatar": AVATARS[getRndInteger(0,AVATARS.length)],
                "modo": false,
                "ready": false,
                "score": 0,
                "dataSend": false,
                "data": [],
            }

            listPlayer.push(
                player
            )
            socket.emit("saveUUID", player)
            socket.emit("removeModal")

            refreshAllPlayersList(sockets, listPlayer)
            socket.emit('wordList', getRoom(roomList, socket.room))
        } else {socket.emit('error', 'serverError')}
    })

    /**
     * Change rounds of the game
     */
    socket.on('changeMaxRound', (newMax) => {
        let room = getRoom(roomList, socket.room)
        if(room) {
            room.maxRound = newMax
        }
    })

    /**
     * Switch ready state of player
     */
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
                checkRoomMode(room)
                allPlayersReady(sockets, listPlayer)
                room.state = "game"
            }
        } else {socket.emit('error', 'serverError')}
    })

    /**
     * Player ready for next round
     */
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

    /**
     * Stop the game
     */
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

    /**
     * Player disconnect from room
     */
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

    /**
     * Check if room exist
     */
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

    /**
     * Add a new word to wordList
     */
    socket.on("addNewWord", word => {
        let room = getRoom(roomList, socket.room)

        if(room) {
            let wordList = room.wordList
            let listPlayer = room.playerList

            wordList.push(word)
            refreshAllPlayersWordsList(sockets, listPlayer, room)
        } else {socket.emit('error', 'serverError')}
    })

    /**
     * Remove word from wordList
     */
    socket.on("removeWord", word => {
        let room = getRoom(roomList, socket.room)

        if(room) {
            let wordList = room.wordList
            let listPlayer = room.playerList

            wordList.splice(wordList.indexOf(word), 1);
            refreshAllPlayersWordsList(sockets, listPlayer, room)
        } else {socket.emit('error', 'serverError')}
    })

    /**
     * Stop all players (when player click on STOP)
     */
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

    /**
     * When player click on word's case (when player's word is false)
     */
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

    /**
     * Game is replaying
     */
    socket.on("replayGame", (data) => {
        let room = getRoom(roomList, socket.room)
        if(room) {
            let listPlayer = room.playerList
            resetRoom(room)
            replayAllPlayers(room.playerList)
        } else {socket.emit('error', 'serverError')}
    })
    
    /**
     * Kick player from room
     */
    socket.on('kickPlayer', (uuid) => {
        let room = getRoom(roomList, socket.room)
            if(room) {
                let listPlayer = room.playerList
                for (var i = 0; i < listPlayer.length; i++){
                    if(listPlayer[i].uuid == uuid) {
                        let index = listPlayer.indexOf(listPlayer[i]);
                        if (index > -1) {
                            listPlayer.splice(index, 1);
                        }
                        sockets[uuid].emit('error', 'kicked')
                        refreshAllPlayersList(sockets, listPlayer)
                    }
                }
            } else {socket.emit('error', 'serverError')}
    })

    /**
     * Callback ready state of user
     */
    socket.on('userIsReady', (cb) => { 
        let player = getPlayer(socket.uuid, socket.room)
        cb(player.ready); 
    });

    socket.on('userIsAdmin', (cb) => { 
        let player = getPlayer(socket.uuid, socket.room)
        cb(player.modo); 
    });

    /**
     * 
     */
    socket.on("changeMode", (mode) => {
        let room = getRoom(roomList, socket.room)
        if(room) {
            if(ROOM_MODE.includes(mode)) {
                room.mode = mode
            }
            changeGameMode(room.playerList, room.mode, room.wordList, room)
        } else {socket.emit('error', 'serverError')}
    })
})

function checkRoomMode(room) {
    switch (room.mode){
        case "RANDOM":
            room.wordList = getRandomCategories(6)
            break;
    }
}

function getRandomCategories(nb) {
    var newWords = []
    let categoriesRaw = fs.readFileSync('categories.json');
    let categories = JSON.parse(categoriesRaw);
    categories = categories.categories

    while(newWords.length != 6) {
        let i = getRndInteger(0, categories.length)
        newWords.push(categories[i])
        categories.splice(i, 1)
    }
    return newWords
}

function changeGameMode(listPlayer, mode, words, room) {
    for (var i = 0; i < listPlayer.length; i++){
        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('changeGameMode', mode, words, listPlayer[i], room)
    }
}

/**
 * 
 * @param {Room} roomDel 
 * Remove room from roomList
 */
function deleteRoom(room) {
    for (var i = 0; i < roomList.length; i++){
        if(roomList[i].room == room.room) {
            let index = roomList.indexOf(roomList[i]);
            if (index > -1) {
                roomList.splice(index, 1);
            }
        }
    }
}

/**
 * 
 * @param {Room} room 
 * Reset the game and the player's score
 */
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

/**
 * 
 * @param {Room} room 
 * Compute the score for each player of the round
 */
function reworkScorePlayer(room) {
    for(let player of room.playerList) {
        for(let input of player.data) {
            let tempScore = computeNote(input.notes)
            if(tempScore > 0) {
                tempScore = tempScore / countSameWords(input, room.playerList)
            }
            player.score += tempScore
        }
    }
}

function countSameWords(inputPlayer, players) {
    let totalCount = 0
    let wordRef = normalizeWord(inputPlayer.value)

    for(let player of players) {
        for(let input of player.data) {
            if(inputPlayer.pos == input.pos) {
                if(wordRef == normalizeWord(input.value)) {
                    totalCount++
                }
            }            
        }
    }

    return totalCount
}

/**
 * Normalize word
 * @param {String} word 
 * @returns 
 */
function normalizeWord(word) {
    word = word.toLowerCase()
    word = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return word
}

/**
 * 
 * @param {Array[0|1]} notes 
 * @returns Score of the player for one response
 */
function computeNote(notes) {
    let lgt = notes.length
    let zero = 0

    // Compute total of "NO" response
    for(let note of notes) {
        if(note < 1)
            zero++
    }

    // If player's response is 50% yes 50% no
    if(zero == lgt/2) {
        return 50
    } 
    // If player's response is > 50% yes
    else if(zero < lgt/2){
        return 100
    }

    // Else, player's response is < 50% yes
    return 0
}

/**
 * Refresh result's line of player for each room players
 * @param {Array[socket]} sockets 
 * @param {Array[player]} listPlayer 
 * @param {player} player 
 * 
 */
function refreshChoice(sockets, listPlayer, player) {
    for (var i = 0; i < listPlayer.length; i++){
        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('refreshChoice', player)
    }
}

/**
 * Emit "replayGame" to all clients (game is replaying)
 * @param {Array[player]} listPlayer 
 */
function replayAllPlayers(listPlayer) {
    for (var i = 0; i < listPlayer.length; i++){
        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('replayGame', null)
    }
}

/**
 * 
 * @param {Array[socket]} sockets 
 * @param {Array[player]} listPlayer 
 */
function refreshAllPlayersList(sockets, listPlayer) {
    for (var i = 0; i < listPlayer.length; i++){

        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('refreshList', listPlayer)
    }
}

/**
 * 
 * @param {UUID} uuid 
 * @param {RoomCode} code 
 * @returns index of player in room's playerList
 */
function getIndex(uuid, code) {
    let room = getRoom(roomList, code)
    let playerList = room.playerList
    for(let i = 0; i<playerList.length; i++) {
        if(playerList[i].uuid == uuid) {
            return i
        }
    }
}

/**
 * Get player in room with UUID
 * @param {UUID} uuid 
 * @param {RoomCode} code 
 * @returns player
 */
function getPlayer(uuid, code) {
    let room = getRoom(roomList, code)
    let playerList = room.playerList
    for(let i = 0; i<playerList.length; i++) {
        if(playerList[i].uuid == uuid) {
            return playerList[i]
        }
    }
}

/**
 * Refresh player's list on Results section
 * @param {Array[socket]} sockets 
 * @param {Array[player]} listPlayer 
 */
function refreshAllPlayersListNextRound(sockets, listPlayer) {
    for (var i = 0; i < listPlayer.length; i++){
        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('refreshNextRound', listPlayer)
    }
}

/**
 * Refresh word list on Waiting screen for all players
 * @param {Array[socket]} sockets 
 * @param {Array[player]} listPlayer 
 * @param {ROom} room 
 */
function refreshAllPlayersWordsList(sockets, listPlayer, room) {
    for (var i = 0; i < listPlayer.length; i++){

        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('wordList', getRoom(roomList, sockets[uuid].room))

        if(listPlayer[i].modo) {
            sockets[uuid].emit('gameSettings', room) 
        }
    }
}

/**
 * Display Result section for all players
 * @param {Array[socket]} sockets 
 * @param {Room} room 
 */
function displayResultsAll(sockets, room) {
    let listPlayer = room.playerList
    for (var i = 0; i < listPlayer.length; i++){
        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('displayResults', room)
    }
}

/**
 * Start game for all player
 * @param {Array[socket]} sockets 
 * @param {Array[player]} listPlayer 
 */
function allPlayersReady(sockets, listPlayer) {
    for (var i = 0; i < listPlayer.length; i++){

        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('gameStarting', getRoom(roomList, sockets[uuid].room))
    }
    resetReady(listPlayer)
}

/**
 * Start a new round
 * @param {Array[socket]} sockets 
 * @param {Room} room 
 */
function allPlayersReadyNextRound(sockets, room) {
    room.actualRound = room.actualRound + 1
    reworkScorePlayer(room)
    if(room.actualRound <= room.maxRound) {
        nextRound(sockets, room)
    } else {
        finishGame(sockets, room)
    }
}

/**
 * New round
 * @param {Array[socket]} sockets 
 * @param {Room} room 
 */
function nextRound(sockets, room) {
    generateLetter(room)
    let listPlayer = room.playerList
    for (var i = 0; i < listPlayer.length; i++){
        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('nextRound', getRoom(roomList, sockets[uuid].room))
    }
    resetReady(listPlayer)
}

/**
 * Game is finish
 * @param {Array[socket]} sockets 
 * @param {Room} room 
 */
function finishGame(sockets, room) {
    let listPlayer = room.playerList
    for (var i = 0; i < listPlayer.length; i++){

        let uuid = listPlayer[i].uuid
        sockets[uuid].emit('endResults', room)
    }
}

/**
 * Reset ready state & data for players
 * @param {Array[player]} listPlayer 
 */
function resetReady(listPlayer) {
    for (var i = 0; i < listPlayer.length; i++){
        listPlayer[i].ready = false
        listPlayer[i].dataSend = false
    }
}

/**
 * Get room from RoomCode
 * @param {roomList} roomList 
 * @param {RoomCode} code 
 * @returns room
 */
function getRoom(roomList, code) {
    for (var i = 0; i < roomList.length; i++){
        if (roomList[i].room == code){
            return roomList[i]
        }
    }
}

/**
 * Generate room token
 * @returns token
 */
function generateRoomToken() {
    var firstPart = (Math.random() * 46656) | 0;
    var secondPart = (Math.random() * 46656) | 0;
    firstPart = ("000" + firstPart.toString(36)).slice(-3);
    secondPart = ("000" + secondPart.toString(36)).slice(-3);
    return firstPart + secondPart;
}

/**
 * Generate a letter who's not in history
 * @param {Room} room 
 */
function generateLetter(room) {
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let res = ""
    do {
        res = characters.charAt(Math.floor(Math.random() * characters.length))
    } while (room.historyLetter.includes(res))
    room.actualLetter = res
    room.historyLetter.push(res)
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

console.log("Running on port: " + process.env.PORT)

server.listen(process.env.PORT)