const { v4: uuidv4 } = require('uuid');
const AVATARS = ["avatar_triangle", "avatar_round", "avatar_square"]

/**
 * Player Class
 */
class Player {
    constructor(pseudo, admin = false) {
        this.uuid = uuidv4();
        this.pseudo = pseudo;
        this.avatar_shape = this.generateRandomAvatarShape();
        this.avatar_color = this.generateRandomAvatarColor();
        this.admin = admin;
        this.ready = false;
        this.score = 0;
        this.dataSend = false;
        this.data = [];
        this.disconnect = false;
    }

    toggleReady() {
        this.ready = this.ready;
    }

    reset() {
        this.score = 0;
        this.dataSend = false;
        this.data = [];
        this.disconnect = false;
    }

    resetReady() {
        this.ready = false;
    }

    /**
     * Generate random avatar between triangle, square. round
     * @returns AVATARS[x]
     */
    generateRandomAvatarShape() {
        return AVATARS[this.getRndInteger(0, 3)]
    }

    /**
     * Generate random color for avatar
     * @returns color rgb()
     */
     generateRandomAvatarColor() {
        return "rgb("+this.getRndInteger(0, 255)+","+this.getRndInteger(0, 255)+","+this.getRndInteger(0, 255)+")"
    }

    /**
     * Update resultCase when someone switch state of it
     * @param {Room} room 
     */
    editUserCase(sockets, data, indexPlayer, player, room) {  
        player.index = indexPlayer

        for(let input of player.data) {
            if(input.pos == data.input.pos) {
            if(input.notes[player.index]) {
                input.notes[player.index] = 0
            } else {
                input.notes[player.index] = 1
            }

            room.refreshChoice(sockets, player)
            }
        }
    }

    /**
     * Compute score of player
     * @param {Room} room 
     */
    updateScore(room) {
        for(let input of this.data) {
            let tempScore = this.computeNote(input.notes)
            if(tempScore > 0) {
                tempScore = tempScore / this.countSameWords(input, room.playersList)
            }
            this.score += tempScore
        }
    }

    /**
     * 
     * @param {(0|1)} notes 
     * @returns Score of the player for one response
     */
    computeNote(notes) {
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
     * 
     * @param {input} inputPlayer 
     * @param {Player[]} players 
     * @returns int
     */
    countSameWords(inputPlayer, players) {
        let totalCount = 0
        let wordRef = this.normalizeWord(inputPlayer.value)
    
        for(let player of players) {
            for(let input of player.data) {
                if(inputPlayer.pos == input.pos) {
                    if(wordRef == this.normalizeWord(input.value)) {
                        totalCount++
                    }
                }            
            }
        }
    
        return totalCount
    }

    /**
     * Normalize word
     * @param {string} word 
     * @returns string
     */
    normalizeWord(word) {
        word = word.toLowerCase()
        word = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        return word
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

module.exports = Player;