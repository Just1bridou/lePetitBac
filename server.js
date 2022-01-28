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

const Player = require("./server/Player")
const Room = require('./server/Room')

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/pages/game.html")
})

app.get('/r/:code', function (req, res) {
    res.sendFile(__dirname + "/pages/game.html")
});

// roomsList contain all rooms of the server
var roomsList = []

// sockets contain all player's socket of the server
var sockets = {}


app.get("/json", (req, res) => {
    res.json(roomsList)
})

const ROOM_MODE = ["CLASSIC", "RANDOM"]
// const AVATARS = [
//     "/avatar/burger.png",
//     "/avatar/donut.png",
//     "/avatar/pizza.png"
// ]
const AVATARS = ["avatar_triangle", "avatar_round", "avatar_square"]


io.on("connect", (socket) => {

    /**
     * Player wants to created new room
     */
    socket.on("createRoom", (data) => {

        let code = generateRoomToken()
        let uuid = uuidv4()

        let params = {
            "code": code,
            "uuidPlayer": uuid
        }

        let classRdm = AVATARS[getRndInteger(0, 3)]
        let colorRdm = "rgb("+getRndInteger(0, 255)+","+getRndInteger(0, 255)+","+getRndInteger(0, 255)+")"

        let player = new Player(uuid, data.pseudo, classRdm, colorRdm, true)
        let room = new Room(code)

        room.addPlayer(player)
        roomsList.push(room)
        
        socket.uuid = uuid
        socket.code = code
        sockets[uuid] = socket
        
        // Client save UUID in sessionStorage
        socket.emit("savePlayerInformations", player, code)

        // Room created
        socket.emit("roomCreated", params)
    })

    /**
     * Send game's data to client
     */
    socket.on("getData", (data) => {
        let room = getRoom(roomsList, socket.code)
        if(room) {    
            socket.emit("dataSender", room)
            refreshAllPlayersWordsList(sockets, room.playersList, room)
        } else {socket.emit('error', 'serverError')}
    })

    socket.on("reconnectPlayer", (data) => {

        console.log(data)

        if(data.code == undefined || data.code == 'null')
            return

        //console.log(data)
        let room = getRoom(roomsList, data.code)

        if(room) {
            console.log("room")
            let player = getPlayer(data.uuid, room.code)
            
            if(player == undefined) 
            return

            socket.uuid = data.uuid
            socket.code = room.code
            sockets[data.uuid] = socket

            socket.emit("savePlayerInformations", player, room.code)
            
            player.disconnect = false
            switch(room.state) {
                case "waiting":
                    console.log("state waiting")
                    socket.emit("recoverRefresh", room)
                    refreshAllPlayersWordsList(sockets, room.playersList, room)
                    socket.emit("removeModal")
                    socket.emit("initWaitingRoom")
                    refreshAllPlayersList(sockets, room.playersList)
                    socket.emit('wordsList', room)
                    notifyPlayers(room.playersList, player.pseudo, "RELOADED")
                    break;
                case "game":
                    socket.emit("removeModal")
                    socket.emit('recoverGamePage', room)
                    notifyPlayers(room.playersList, player.pseudo, "RELOADED")
                    break;
                case "results":
                    console.log("state res")
                    socket.emit("removeModal")
                    socket.emit('displayResults', room)
                    notifyPlayers(room.playersList, player.pseudo, "RELOADED")
                    break;
                case "final":
                    console.log("state fin")

                    break;
            }

        } // else {socket.emit('error', 'serverError')}
    })

    /**
     * Replay an other game
     */
    socket.on("replayRefresh", (data) => {
        let room = getRoom(roomsList, socket.code)
        if(room) {
            let playersList = room.playersList
            refreshAllPlayersList(sockets, playersList)
            refreshAllPlayersWordsList(sockets, playersList, room)
        } else {socket.emit('error', 'serverError')}
    })

    /**
     * Add new player to room
     */
    socket.on("newPlayer", (params) => {

        let room = getRoom(roomsList, params.code)

        if(room) {
            let uuid = uuidv4()

            socket.code = params.code
            socket.uuid = uuid
            sockets[uuid] = socket

            let classRdm = AVATARS[getRndInteger(0, 3)]
            let colorRdm = "rgb("+getRndInteger(0, 255)+","+getRndInteger(0, 255)+","+getRndInteger(0, 255)+")"

            let player = new Player(uuid, params.pseudo, classRdm, colorRdm)

            room.addPlayer(player)

            socket.emit("savePlayerInformations", player, room.code)
            socket.emit("removeModal")
            socket.emit("initWaitingRoom")

            refreshAllPlayersList(sockets, room.playersList)
            socket.emit('wordsList', getRoom(roomsList, socket.code))
            notifyPlayers(room.playersList, player.pseudo, "JOIN")
        } else {socket.emit('error', 'serverError')}
    })

    /**
     * Change rounds of the game
     */
    socket.on('changeMaxRound', (newMax) => {
        let room = getRoom(roomsList, socket.code)
        if(room) {
            room.maxRound = newMax
            for(let player of room.playersList) {
                sockets[player.uuid].emit('getRounds', room.maxRound)
            }
        }
    })

    socket.on("getRounds", (cb) => {
        let room = getRoom(roomsList, socket.code)
        if(room) {
            cb(room.maxRound)
        }
    })

    /**
     * Switch ready state of player
     */
    socket.on("switchState", (data) => {
        let room = getRoom(roomsList, socket.code)
        
        if(room) {
            let playersList = room.playersList
            var allReady = true
            for (var i = 0; i < playersList.length; i++){

                if(playersList[i].uuid == socket.uuid) {
                    playersList[i].ready = !playersList[i].ready
                    refreshAllPlayersList(sockets, playersList)
                }

                if(!playersList[i].disconnect && !playersList[i].ready)
                    allReady = false
            }
            if(allReady) {
                generateLetter(room)
                checkRoomMode(room)
                allPlayersReady(sockets, playersList)
                room.state = "game"
            }
        } else {socket.emit('error', 'serverError')}
    })

    /**
     * Player ready for next round
     */
    socket.on("nextRoundPlayer", (data) => {
        let room = getRoom(roomsList, socket.code)
        if(room) {
            let playersList = room.playersList
            var allReady = true
            for (var i = 0; i < playersList.length; i++){

                if(playersList[i].uuid == socket.uuid) {
                    if(!playersList[i].ready) {
                        playersList[i].ready = true
                        refreshAllPlayersListNextRound(sockets, playersList)
                    }
                }

                if(!playersList[i].disconnect && !playersList[i].ready)
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
        let room = getRoom(roomsList, socket.code)

        if(room) {
            let playersList = room.playersList

            var allSend = true
            for (var i = 0; i < playersList.length; i++){
                if(playersList[i].uuid == socket.uuid) {
                    playersList[i].dataSend = true//!playersList[i].dataSend
                    playersList[i].data = results
                }

                if(!playersList[i].disconnect && !playersList[i].dataSend)
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
        let room = getRoom(roomsList, socket.code)
        if(room) {
            let playersList = room.playersList
            for (var i = 0; i < playersList.length; i++){
                if(playersList[i].uuid == socket.uuid) {
                    let index = playersList.indexOf(playersList[i]);
                    notifyPlayers(playersList, playersList[i].pseudo, "LEAVE")
                    // if (index > -1) {
                    //     playersList.splice(index, 1);
                    // }
                    playersList[i].disconnect = true
                    
                    /// Nobody in room
                    if(allPlayersOffline(playersList)) {
                        console.log("delete room")
                        deleteRoom(room)
                    } else {
                        refreshAllPlayersList(sockets, playersList)
                    }
                }
            }
        } else {socket.emit('error', 'serverError')}
    })

    function allPlayersOffline(playersList) {
        var offline = true
        for(let p of playersList) {
            if(p.disconnect == false) {
                offline = false
            }
        }
        return offline
    }

    /**
     * Check if room exist
     */
    socket.on('checkRoomExist', (room) => {
        for(let r of roomsList) {
            if(r.code == room) {
                // if(r.state == "waiting") {
                    socket.emit('roomExist', null)
                    return
                // } else {
                //     socket.emit('error', 'inGame')
                //     return
                // }
            }
        }
        socket.emit('error', 'roomExist')
    })

    /**
     * Add a new word to wordsList
     */
    socket.on("addNewWord", word => {
        let room = getRoom(roomsList, socket.code)

        if(room) {
            let wordsList = room.wordsList
            let playersList = room.playersList

            wordsList.push(word)
            refreshAllPlayersWordsList(sockets, playersList, room)
        } else {socket.emit('error', 'serverError')}
    })

    /**
     * Remove word from wordsList
     */
    socket.on("removeWord", word => {
        let room = getRoom(roomsList, socket.code)

        if(room) {
            let wordsList = room.wordsList
            let playersList = room.playersList

            wordsList.splice(wordsList.indexOf(word), 1);
            refreshAllPlayersWordsList(sockets, playersList, room)
        } else {socket.emit('error', 'serverError')}
    })

    /**
     * Stop all players (when player click on STOP)
     */
    socket.on('stopAllPlayer', data => {
        let room = getRoom(roomsList, socket.code)

        if(room) {
            room.state="results"
            let playersList = room.playersList

            for (var i = 0; i < playersList.length; i++){
                let uuid = playersList[i].uuid
                sockets[uuid].emit('stopRound', room)
            }
        } else {socket.emit('error', 'serverError')}
    })

    /**
     * When player click on word's case (when player's word is false)
     */
    socket.on('editUserCase', data => {
        let room = getRoom(roomsList, socket.code)
        if(room) {
            let indexPlayer = getIndex(socket.uuid, socket.code)
            let player = getPlayer(data.uuid, socket.code)
            player.index = indexPlayer
            for(let input of player.data) {
                if(input.pos == data.input.pos) {
                if(input.notes[indexPlayer]) {
                    input.notes[indexPlayer] = 0
                } else {
                    input.notes[indexPlayer] = 1
                }

                refreshChoice(sockets, room.playersList, player)
                }
            }
        } else {socket.emit('error', 'serverError')}
    })

    /**
     * Game is replaying
     */
    socket.on("replayGame", (data) => {
        let room = getRoom(roomsList, socket.code)
        if(room) {
            let playersList = room.playersList
            resetRoom(room)
            replayAllPlayers(room.playersList)
        } else {socket.emit('error', 'serverError')}
    })
    
    /**
     * Kick player from room
     */
    socket.on('kickPlayer', (uuid) => {
        let room = getRoom(roomsList, socket.code)
            if(room) {
                let playersList = room.playersList
                for (var i = 0; i < playersList.length; i++){
                    if(playersList[i].uuid == uuid) {
                        let index = playersList.indexOf(playersList[i]);
                        notifyPlayers(playersList, playersList[i].pseudo, "KICK")
                        if (index > -1) {
                            playersList.splice(index, 1);
                        }
                        sockets[uuid].emit('error', 'kicked')
                        refreshAllPlayersList(sockets, playersList)
                    }
                }
            } else {socket.emit('error', 'serverError')}
    })

    /**
     * Callback ready state of user
     */
    socket.on('userIsReady', (cb) => { 
        let player = getPlayer(socket.uuid, socket.code)
        cb(player.ready); 
    });

    socket.on('userIsAdmin', (cb) => { 
        let player = getPlayer(socket.uuid, socket.code)
        cb(player.admin); 
    });

    /**
     * 
     */
    socket.on("changeMode", (mode) => {
        let room = getRoom(roomsList, socket.code)
        if(room) {
            if(ROOM_MODE.includes(mode)) {
                room.mode = mode
            }
            changeGameMode(room.playersList, room.mode, room.wordsList, room)
        } else {socket.emit('error', 'serverError')}
    })
})

function notifyPlayers(playersList, pseudo, reason) {
    for (var i = 0; i < playersList.length; i++){
        let uuid = playersList[i].uuid
        sockets[uuid].emit('newNotification', pseudo, reason)
    }
}

function checkRoomMode(room) {
    switch (room.mode){
        case "RANDOM":
            room.wordsList = getRandomCategories(6)
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

function changeGameMode(playersList, mode, words, room) {
    for (var i = 0; i < playersList.length; i++){
        let uuid = playersList[i].uuid
        sockets[uuid].emit('changeGameMode', mode, words, playersList[i], room)
    }
}

/**
 * 
 * @param {Room} roomDel 
 * Remove room from roomsList
 */
function deleteRoom(room) {
    for (var i = 0; i < roomsList.length; i++){
        if(roomsList[i].code == room.code) {
            let index = roomsList.indexOf(roomsList[i]);
            if (index > -1) {
                roomsList.splice(index, 1);
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

    for(let player of room.playersList) {
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
    for(let player of room.playersList) {
        for(let input of player.data) {
            let tempScore = computeNote(input.notes)
            if(tempScore > 0) {
                tempScore = tempScore / countSameWords(input, room.playersList)
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
 * @param {Array[player]} playersList 
 * @param {player} player 
 * 
 */
function refreshChoice(sockets, playersList, player) {
    for (var i = 0; i < playersList.length; i++){
        let uuid = playersList[i].uuid
        sockets[uuid].emit('refreshChoice', player)
    }
}

/**
 * Emit "replayGame" to all clients (game is replaying)
 * @param {Array[player]} playersList 
 */
function replayAllPlayers(playersList) {
    for (var i = 0; i < playersList.length; i++){
        let uuid = playersList[i].uuid
        sockets[uuid].emit('replayGame', null)
    }
}

/**
 * 
 * @param {Array[socket]} sockets 
 * @param {Array[player]} playersList 
 */
function refreshAllPlayersList(sockets, playersList) {
    for (var i = 0; i < playersList.length; i++){

        let uuid = playersList[i].uuid
        sockets[uuid].emit('refreshList', playersList)
    }
}

/**
 * 
 * @param {UUID} uuid 
 * @param {RoomCode} code 
 * @returns index of player in room's playersList
 */
function getIndex(uuid, code) {
    let room = getRoom(roomsList, code)
    let playersList = room.playersList
    for(let i = 0; i<playersList.length; i++) {
        if(playersList[i].uuid == uuid) {
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
    let room = getRoom(roomsList, code)
    if(room) {
        let playersList = room.playersList
        for(let i = 0; i<playersList.length; i++) {
            if(playersList[i].uuid == uuid) {
                return playersList[i]
            }
        }
    }
    return null
}

/**
 * Refresh player's list on Results section
 * @param {Array[socket]} sockets 
 * @param {Array[player]} playersList 
 */
function refreshAllPlayersListNextRound(sockets, playersList) {
    for (var i = 0; i < playersList.length; i++){
        let uuid = playersList[i].uuid
        sockets[uuid].emit('refreshNextRound', playersList)
    }
}

/**
 * Refresh word list on Waiting screen for all players
 * @param {Array[socket]} sockets 
 * @param {Array[player]} playersList 
 * @param {ROom} room 
 */
function refreshAllPlayersWordsList(sockets, playersList, room) {
    for (var i = 0; i < playersList.length; i++){

        let uuid = playersList[i].uuid
        sockets[uuid].emit('wordsList', getRoom(roomsList, sockets[uuid].code))

        if(playersList[i].admin) {
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
    let playersList = room.playersList
    for (var i = 0; i < playersList.length; i++){
        let uuid = playersList[i].uuid
        sockets[uuid].emit('displayResults', room)
    }
}

/**
 * Start game for all player
 * @param {Array[socket]} sockets 
 * @param {Array[player]} playersList 
 */
function allPlayersReady(sockets, playersList) {
    for (var i = 0; i < playersList.length; i++){

        let uuid = playersList[i].uuid
        sockets[uuid].emit('gameStarting', getRoom(roomsList, sockets[uuid].code))
    }
    resetReady(playersList)
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
    let playersList = room.playersList
    for (var i = 0; i < playersList.length; i++){
        let uuid = playersList[i].uuid
        sockets[uuid].emit('nextRound', getRoom(roomsList, sockets[uuid].code))
    }
    resetReady(playersList)
}

/**
 * Game is finish
 * @param {Array[socket]} sockets 
 * @param {Room} room 
 */
function finishGame(sockets, room) {
    let playersList = room.playersList
    for (var i = 0; i < playersList.length; i++){

        let uuid = playersList[i].uuid
        sockets[uuid].emit('endResults', room)
    }
}

/**
 * Reset ready state & data for players
 * @param {Array[player]} playersList 
 */
function resetReady(playersList) {
    for (var i = 0; i < playersList.length; i++){
        playersList[i].ready = false
        playersList[i].dataSend = false
    }
}

/**
 * Get room from RoomCode
 * @param {roomsList} roomsList 
 * @param {RoomCode} code 
 * @returns room
 */
function getRoom(roomsList, code) {
    for (var i = 0; i < roomsList.length; i++){
        if (roomsList[i].code == code){
            return roomsList[i]
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