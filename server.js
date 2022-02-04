let express = require("express")
let socketio = require("socket.io")
let http = require("http")

const dotenv = require('dotenv');

dotenv.config();

let app = express()
let server = http.Server(app)
let io = socketio(server)

app.use("/css", express.static(__dirname + "/css"))
app.use("/js", express.static(__dirname + "/js"))
app.use("/pages", express.static(__dirname + "/pages"))
app.use("/images", express.static(__dirname + "/images/"))
app.use("/avatar", express.static(__dirname + "/avatars/"))

const RoomManagerClass = require('./server/RoomManager')
const Player = require("./server/Player")
const Room = require('./server/Room')

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/pages/game.html")
})

app.get('/r/:code', function(req, res) {
    res.sendFile(__dirname + "/pages/game.html")
});

// RoomManager.rooms contain all rooms of the server
var RoomManager = new RoomManagerClass()

// sockets contain all player's socket of the server
var sockets = {}


app.get("/json", (req, res) => {
    res.json(RoomManager.rooms)
})

io.on("connect", (socket) => {

    /**
     * Init login / join page
     */
    socket.on("browserConnection", (code) => {
        RoomManager.roomExist(code, (room) => {
            socket.emit('showSection', 'join')
        }, () => {
            socket.emit('showSection', 'login')
        })
    })

    /**
     * Player wants to created new room
     */
    socket.on("createRoom", (data) => {

        let player = new Player(data.pseudo, true)
        let room = new Room()

        room.addPlayer(player)
        RoomManager.addRoom(room)

        socket.uuid = player.uuid
        socket.code = room.code
        sockets[player.uuid] = socket

        /**
         * Send player information to localStorage's client
         */
        socket.emit("savePlayerInformations", player, room.code)

        /**
         * Switch to waiting room screen
         */
        socket.emit("transitionSection", {
            from: "login",
            to: "waitingRoom",
            text: "Joined !"
        })

        /**
         * Refresh words list
         */
        room.refreshPlayersWordsList(sockets)

        /**
         * Send to admins configuration pannel
         */
        room.sendToAdmins(sockets, "adminSettings", room)

        /**
         * Refresh players list
         */
        room.refreshPlayersList(sockets)
    })

    /**
     * Add new player to room
     */
    socket.on("newPlayer", (params) => {

        RoomManager.roomExist(params.code, (room) => {
            let player = new Player(params.pseudo)
            room.addPlayer(player)

            socket.code = params.code
            socket.uuid = player.uuid
            sockets[player.uuid] = socket

            switch (room.state) {
                case "waiting":

                    socket.emit("savePlayerInformations", player, room.code)

                    socket.emit("transitionSection", {
                        from: "join",
                        to: "waitingRoom",
                        text: "Joined !"
                    })

                    room.refreshPlayersWordsList(sockets)

                    if (player.admin) { socket.emit('adminSettings', room) }

                    room.refreshPlayersList(sockets)

                    room.notifyPlayers(sockets, player.pseudo, "JOIN")
                    break;

                case "game":
                    recoverInGame(sockets, socket, room, player)
                    break;

                case "results":
                    recoverResults(sockets, socket, room, player)
                    break;

                case "final":
                    break;
            }

        }, () => {
            socket.emit('error', 'serverError')
        })
    })

    socket.on("reconnectPlayer", data => {

        console.log(data)

        if (data.code == undefined || data.code == 'null') {
            socket.emit("browserConnection", null)
            return
        }

        RoomManager.roomExist(data.code, (room) => {

            let player = room.getPlayer(data.uuid)

            if (player == undefined || player == null) {
                socket.emit("browserConnection", null)
                return
            }

            socket.uuid = data.uuid
            socket.code = room.code
            sockets[data.uuid] = socket

            socket.emit("savePlayerInformations", player, room.code)

            player.disconnect = false

            console.log(room.state)
            switch (room.state) {
                case "waiting":

                    socket.emit("savePlayerInformations", player, room.code)

                    socket.emit("showSection", "waitingRoom")

                    room.refreshPlayersWordsList(sockets)

                    if (player.admin) { socket.emit('adminSettings', room) }

                    room.refreshPlayersList(sockets)
                    room.notifyPlayers(sockets, player.pseudo, "RELOADED")
                    break;

                case "game":
                    recoverInGame(sockets, socket, room, player)
                    break;

                case "results":
                    recoverResults(sockets, socket, room, player)
                    break;

                case "final":
                    break;
            }
        }, () => {
            socket.emit("browserConnection", null)
        })
    })

    function recoverInGame(sockets, socket, room, player) {
        socket.emit("savePlayerInformations", player, room.code)
        socket.emit("recoverInGame", room)
        room.notifyPlayers(sockets, player.pseudo, "RELOADED")
    }

    function recoverResults(sockets, socket, room, player) {
        socket.emit("savePlayerInformations", player, room.code)
        socket.emit("recoverResults", room)
        player.ready = true
        room.notifyPlayers(sockets, player.pseudo, "RELOADED")
    }

    /**
     * Replay an other game
     */
    socket.on("replayRefresh", (data) => {
        RoomManager.roomExist(socket.code, (room) => {
            room.refreshPlayersList(sockets)
        }, () => {
            socket.emit('error', 'serverError')
        })
    })

    /**
     * Change rounds of the game
     */
    socket.on('changeMaxRound', (newMax) => {
        RoomManager.roomExist(socket.code, (room) => {
            room.updateMaxRound(sockets, newMax)
        })
    })

    socket.on("getRounds", (cb) => {
        RoomManager.roomExist(socket.code, (room) => {
            cb(room.maxRound)
        })
    })

    /**
     * Switch ready state of player
     */
    socket.on("switchState", () => {
        RoomManager.roomExist(socket.code, (room) => {
            room.switchState(sockets, socket.uuid)
        }, () => {
            socket.emit('error', 'serverError')
        })
    })

    /**
     * Player ready for next round
     */
    socket.on("nextRoundPlayer", () => {
        RoomManager.roomExist(socket.code, (room) => {
            room.playerReady(sockets, socket.uuid)
        }, () => {
            socket.emit('error', 'serverError')
        })
    })

    /**
     * Stop the game
     */
    socket.on("resultStop", (results) => {
        RoomManager.roomExist(socket.code, (room) => {
            room.resultStop(sockets, socket.uuid, results)
        }, () => {
            socket.emit('error', 'serverError')
        })
    })

    /**
     * Player disconnect from room
     */
    socket.on("disconnect", (data) => {
        RoomManager.roomExist(socket.code, (room) => {
            room.playerLeave(sockets, socket.uuid, () => {
                if (room.allPlayersOffline()) {
                    RoomManager.deleteRoom(room)
                } else {
                    room.refreshPlayersList(sockets)
                }
            })
        }, () => {
            socket.emit('error', 'serverError')
        })
    })

    /**
     * Check if room exist
     */
    socket.on('checkRoomExist', (code) => {
        RoomManager.roomExist(code, () => {
            socket.emit('roomExist', null)
        }, () => {
            socket.emit('error', 'roomExist')
        })
    })

    /**
     * Add a new word to wordsList
     */
    socket.on("addNewWord", word => {
        RoomManager.roomExist(socket.code, (room) => {
            room.addWordToWordsList(sockets, word)
        }, () => {
            socket.emit('error', 'serverError')
        })
    })

    /**
     * Remove word from wordsList
     */
    socket.on("removeWord", (word) => {
        RoomManager.roomExist(socket.code, (room) => {
            room.removeWordFromList(sockets, word)
        }, () => {
            socket.emit('error', 'serverError')
        })
    })

    /**
     * Stop all players (when player click on STOP)
     */
    socket.on('stopAllPlayer', (data) => {
        RoomManager.roomExist(socket.code, (room) => {
            room.stopAllPlayers(sockets)
        }, () => {
            socket.emit('error', 'serverError')
        })
    })

    /**
     * When player click on word's case (when player's word is false)
     */
    socket.on('editUserCase', (data) => {
        RoomManager.roomExist(socket.code, (room) => {
            let indexPlayer = room.getIndex(socket.uuid)
            let player = room.getPlayer(data.uuid)
            player.editUserCase(sockets, data, indexPlayer, player, room)
        }, () => {
            socket.emit('error', 'serverError')
        })
    })

    /**
     * Game is replaying
     */
    socket.on("replayGame", () => {
        RoomManager.roomExist(socket.code, (room) => {
            room.reset()
            room.replayGame(sockets)
        }, () => {
            socket.emit('error', 'serverError')
        })
    })

    /**
     * Kick player from room
     */
    socket.on('kickPlayer', (uuid) => {
        RoomManager.roomExist(socket.code, (room) => {
            room.kickPlayer(sockets, uuid)
        }, () => {
            socket.emit('error', 'serverError')
        })
    })

    /**
     * Callback ready state of user
     */
    socket.on('userIsReady', (cb) => {
        RoomManager.roomExist(socket.code, (room) => {
            let player = room.getPlayer(socket.uuid)
            cb(player.ready);
        })
    });

    socket.on('userIsAdmin', (cb) => {
        RoomManager.roomExist(socket.code, (room) => {
            let player = room.getPlayer(socket.uuid)
            cb(player.admin);
        })
    });

    /**
     * Change room's mode (RANDOM/CLASIC)
     */
    socket.on("changeMode", (mode) => {
        RoomManager.roomExist(socket.code, (room) => {
            room.changeGameMode(sockets, mode)
        }, () => {
            socket.emit('error', 'serverError')
        })
    })

    /**
     * Change room's mode (RANDOM/CLASIC)
     */
    socket.on("updateGameMode", (mode) => {
        RoomManager.roomExist(socket.code, (room) => {
            room.changeGameMode(sockets, mode)
        }, () => {
            socket.emit('error', 'serverError')
        })
    })
})

console.log("Running on port: " + process.env.PORT)

server.listen(process.env.PORT)