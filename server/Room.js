const BASIC_WORDS = [
    "Prénom",
    "Fruits & Légumes",
    "Métier",
    "Célebrité"
];

class Room {
    constructor(code) {
        this.code = code;
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

    addPlayer(player) {
        this.playersList.push(player)
    }
}  

module.exports = Room;