class Player {
    constructor(uuid, pseudo, avatar_shape, avatar_color, admin = false) {
        this.uuid = uuid;
        this.pseudo = pseudo;
        this.avatar_shape = avatar_shape;
        this.avatar_color = avatar_color;
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
}  

module.exports = Player;