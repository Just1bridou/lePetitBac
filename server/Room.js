const fs = require('fs');
const Player = require('./Player');

const BASIC_WORDS = [
    "Prénom",
    "Fruits & Légumes",
    "Métier",
    "Célebrité"
];

const ROOM_MODE = ["CLASSIC", "RANDOM"]

/**
 * Room Class
 */
class Room {
    constructor() {
        this.code = this.generateRoomToken();
        this.playersList = [];
        this.wordsList = BASIC_WORDS;
        this.actualLetter = "";
        this.historyLetter = [];
        this.actualRound = 1;
        this.maxRound = 3;

        /**
         * Room modes:
         * - CLASSIC
         * - RANDOM
         */
        this.mode = "CLASSIC";

        /**
         * Room states:
         * 
         *  - waiting: in waiting room
         *  - game: in game
         *  - results: results
         *  - final: final results
         */
        this.state = "waiting";
    }

    /**
     * Add player to room
     * @param {Player} player 
     */
    addPlayer(player) {
        this.playersList.push(player)
    }

    /**
     * Generate room token
     * @returns token
     */
    generateRoomToken() {
        var firstPart = (Math.random() * 46656) | 0;
        var secondPart = (Math.random() * 46656) | 0;
        firstPart = ("000" + firstPart.toString(36)).slice(-3);
        secondPart = ("000" + secondPart.toString(36)).slice(-3);
        return firstPart + secondPart;
    }

    /**
     * Start game for all player
     * @param {socket[]} sockets 
     * @param {Player[]} playersList 
     */
    startGame(sockets) {
        this.state = "game"

        this.generateLetter()
        this.generateWordsList()

        this.sendToAll(sockets, 'gameStarting', this, () => {
            this.resetPlayerState()
        })
    }

    /**
     * Send message to all players
     * @param {socket[]} sockets 
     * @param {string} action 
     * @param {{}} params 
     * @param {Callback} cb 
     */
    sendToAll(sockets, action, params, cb = null) {
        for (var i = 0; i < this.playersList.length; i++){
            let uuid = this.playersList[i].uuid
            sockets[uuid].emit(action, params)
        }

        if(cb) {
            cb(true)
        }
    }

    /**
     * Send message to admins
     * @param {socket[]} sockets 
     * @param {string} action 
     * @param {{}} params 
     * @param {Callback} cb 
     */
     sendToAdmins(sockets, action, params, cb = null) {
        for (var i = 0; i < this.playersList.length; i++){
            let uuid = this.playersList[i].uuid
            if(this.playersList[i].admin) {
                sockets[uuid].emit(action, params)
            }
        }

        if(cb) {
            cb(true)
        }
    }

    /**
     * Send message to all players online
     * @param {socket[]} sockets 
     * @param {string} action 
     * @param {{}} params 
     * @param {Callback} cb 
     */
     sendToAllOnline(sockets, action, params, cb = null) {
        for (var i = 0; i < this.playersList.length; i++){
            let uuid = this.playersList[i].uuid
            if(!this.playersList[i].disconnect) {
                sockets[uuid].emit(action, params)
            }
        }

        if(cb) {
            cb(true)
        }
    }

    /**
     * Reset ready state & data for players
     * @param {Player[]} playersList 
     */
    resetPlayerState() {
        for(let player of this.playersList) {
            player.ready = false
            player.dataSend = false
        }
    }

    
    /**
     * Get player in room with UUID
     * @param {UUID} uuid 
     * @param {RoomCode} code 
     * @returns player
     */
    getPlayer(uuid) {
        for(let player of this.playersList) {
            if(player.uuid == uuid) {
                return player
            }
        }

        return null
    }

    /**
     * Kick player from room
     * @param {UUID} uuid 
     * @param {string} cb 
     */
    kickPlayer(sockets, uuid) {
        for (var i = 0; i < this.playersList.length; i++){
            if(this.playersList[i].uuid == uuid) {
                let index = this.playersList.indexOf(this.playersList[i]);

                this.notifyPlayers(sockets, this.playersList[i].pseudo, "KICK")

                if (index > -1) {
                    this.playersList.splice(index, 1);
                }

                sockets[uuid].emit('error', 'kicked')
                this.refreshPlayersList(sockets)
            }
        }
    }

    /**
     * Generate a letter who's not in history
     */
    generateLetter() {
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        let res = ""
        do {
            res = characters.charAt(Math.floor(Math.random() * characters.length))
        } while (this.historyLetter.includes(res))
        this.actualLetter = res
        this.historyLetter.push(res)
    }

    /**
     * Update the max rounds of the game (max rounds : 25)
     * @param {socket[]} sockets 
     * @param {int} newMax 
     */
    updateMaxRound(sockets, newMax) {
        if(newMax > 25) {
            newMax = 25
        }
        this.maxRound = newMax
        this.sendToAll(sockets, "getRounds", this.maxRound)
    }

    /**
     * Player press ready button in waiting room
     * @param {socket[]} sockets 
     * @param {UUID} uuid 
     */
    switchState(sockets, uuid) {
        var allReady = true

        for(let player of this.playersList) {
            if(player.uuid == uuid) {
                player.ready = !player.ready
                this.refreshPlayersList(sockets)
            }

            if(!player.disconnect && !player.ready) {
                allReady = false
            }
        }
        
        if(allReady) {
            this.startGame(sockets)
        }
    }

    /**
     * Player is ready
     * @param {socket[]} sockets 
     * @param {UUID} uuid 
     */
    playerReady(sockets, uuid) {
        var allReady = true

        for(let player of this.playersList) {
            if(player.uuid == uuid) {
                if(!player.ready) {
                    player.ready = true
                    this.refreshPlayersListNextRound(sockets)
                }
            }

            if(!player.disconnect && !player.ready) {
                allReady = false
            }
        }

        if(allReady) {
            this.allPlayersReadyNextRound(sockets)
        }
    }

    /**
     * Update new round
     */
    updateNextRound() {
        this.actualRound = this.actualRound + 1
    }

    /**
     * 
     * @param {Room} room 
     * Compute the score for each player of the round
     */
    reworkScorePlayer() {
        for(let player of this.playersList) {
            player.updateScore(this)
        }
    }

    /**
     * New round
     * @param {socket[]} sockets 
     */
    nextRound(sockets) {
        this.generateLetter()
        this.sendToAll(sockets, "nextRound", this)
        this.resetPlayerState()
    }

    /**
     * Game is finish
     * @param {socket[]} sockets 
     */
    finishGame(sockets) {
        this.sendToAll(sockets, "endResults", this)
    }

    /**
     * Start a new round
     * @param {socket[]} sockets 
     */
    allPlayersReadyNextRound(sockets) {
        this.updateNextRound()
        this.reworkScorePlayer()
        if(this.actualRound <= this.maxRound) {
            this.nextRound(sockets)
        } else {
            this.finishGame(sockets)
        }
    }


    /**
     * Display Result section for all players
     * @param {socket[]} sockets 
     */
    displayResultsAll(sockets) {
        this.sendToAll(sockets, "displayResults", this)
    }

    /**
     * Refresh word list on Waiting screen for all players
     * @param {socket[]} sockets 
     * @param {Player[]} playersList 
     * @param {ROom} room 
     */
    refreshPlayersWordsList(sockets, playersList, room) {
        this.sendToAll(sockets, "wordsList", this)
        this.sendToAdmins(sockets, "gameSettings", this)
    }

    /**
     * 
     * @param {socket[]} sockets 
     * @param {Player[]} playersList 
     */
    refreshPlayersList(sockets) {
        this.sendToAll(sockets, "refreshList", this.playersList)
    }

    /**
     * Refresh player's list on Results section
     * @param {socket[]} sockets 
     */
    refreshPlayersListNextRound(sockets) {
        this.sendToAll(sockets, "refreshNextRound", this.playersList)
    }

    /**
     * Refresh result's line of player for each room players
     * @param {socket[]} sockets 
     * @param {player} player 
     * 
     */
    refreshChoice(sockets, player) {
        this.sendToAll(sockets, "refreshChoice", player)
    }

    /**
     * Change game mode
     * @param {mode} mode 
     * @param {words[]} words 
     */
    changeGameMode(sockets, mode) {
        if(ROOM_MODE.includes(mode)) {
            this.mode = mode
        
            for (var i = 0; i < this.playersList.length; i++){
                let uuid = this.playersList[i].uuid
                sockets[uuid].emit('changeGameMode', this.mode, this.words, this.playersList[i], this)
            }
        }
    }

    /**
     * Generate words list
     */
    generateWordsList() {
        switch (this.mode){
            case "RANDOM":
                this.wordsList = this.getRandomCategories(6)
                break;
        }
    }
    
    /**
     * Get random categories
     * @returns string[]
     */
    getRandomCategories() {
        var newWords = []
        let categoriesRaw = fs.readFileSync('categories.json');
        let categories = JSON.parse(categoriesRaw);
        categories = categories.categories
    
        while(newWords.length != 6) {
            let i = this.getRndInteger(0, categories.length)
            newWords.push(categories[i])
            categories.splice(i, 1)
        }
        return newWords
    }

    /**
     * Add word to words list
     * @param {socket[]} sockets 
     * @param {string} word 
     */
    addWordToWordsList(sockets, word) {
        this.wordsList.push(word)
        room.refreshPlayersWordsList(sockets)
    }

    /**
     * Remove word from words list
     * @param {socket[]} sockets 
     * @param {string} word 
     */
    removeWordFromList(sockets, word) {
        this.wordsList.splice(this.wordsList.indexOf(word), 1);
        this.refreshPlayersWordsList(sockets)
    }
    
    /**
     * Update players result
     * @param {UUID} uuid 
     * @param {data[]} results 
     */
    resultStop(sockets, uuid, results) {
        var allSend = true

        for(let player of this.playersList) {
            if(player.uuid == uuid) {
                player.dataSend = true
                player.data = results
            }

            if(!player.disconnect && !player.dataSend) {
                allSend = false
            }
        }

        if(allSend) {
            this.displayResultsAll(sockets)
        }
    }

    /**
     * Stop all players when someone click on stop
     * @param {socket[]} sockets 
     */
    stopAllPlayers(sockets) {
        this.state = "results"
        this.sendToAll(sockets, "stopRound", this)
    }

    /**
     * Send notification to players
     * @param {Player.pseudo} pseudo 
     * @param {string} reason 
     */
    notifyPlayers(sockets, pseudo, reason, cb = null) {
        for (var i = 0; i < this.playersList.length; i++){
            let uuid = this.playersList[i].uuid
            sockets[uuid].emit('newNotification', pseudo, reason)
        }

        if(cb) {
            cb()
        }
    }

    /**
     * Disconnect player
     * @param {socket[]} sockets 
     * @param {string} uuid 
     * @param {Callback} cb 
     */
    playerLeave(sockets, uuid, cb) {
        for(let player of this.playersList) {
            if(player.uuid == uuid) {
                player.disconnect = true

                this.notifyPlayers(sockets, player.pseudo, "LEAVE", cb)
            } 
        }
    }

    /**
     * Check if all players are offline
     * @returns bool
     */
    allPlayersOffline() {
        var offline = true
        for(let player of this.playersList) {
            if(player.disconnect == false) {
                offline = false
                return offline
            }
        }
        return offline
    }

    /**
     * Replay game
     */
    replayGame(sockets) {
        this.sendToAll(sockets, "replayGame", null)
    }

    /**
     * Reset the game and the player's score
     * @param {Room} room 
     */
    reset() {

        this.actualLetter = ""
        this.historyLetter = []
        this.actualRound = 1
        this.state = "waiting"

        for(let player of this.playersList) {
            player.score = 0
            player.data = []
            player.ready = false
            player.dataSend = false
        }
    }

    /**
     * Get index pos of player
     * @param {UUID} uuid 
     * @returns index of player in room's playersList
     */
    getIndex(uuid) {
        for(let i = 0; i < this.playersList.length; i++) {
            if(this.playersList[i].uuid == uuid) {
                return i
            }
        }
    }

    /**
     * Get random int [min, max[
     * @param {int} min 
     * @param {int} max 
     * @returns rdm(int)
     */
    getRndInteger(min, max) {
        return Math.floor(Math.random() * (max - min) ) + min;
    }
}  

module.exports = Room;