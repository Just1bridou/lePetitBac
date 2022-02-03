class GameManager {
    constructor() {
        this.socket = io()
        this.name = "LE PETIT BAC"
        this.uuid = sessionStorage.getItem('uuidPlayer');
        this.code = window.location.pathname.split('/')[2]
        this.init()
        this.initNotification()
    }

    init() {
        /**
         * Save player's UUID on sessionStorage
         */
        this.socket.on('savePlayerInformations', (player, code) => {
            sessionStorage.setItem('uuid', player.uuid);
            sessionStorage.setItem('code', code);
            sessionStorage.setItem('player', JSON.stringify(player))

            this.code = code

            this.socket.code = code
            this.socket.uuid = player.uuid
        })
    }

    /**
     * Check if player is actual player
     * @param {player} player 
     * @returns bool
     */
    isActualPlayer(player) {
        if (player.uuid == sessionStorage.getItem('uuid')) {
            return true
        }
        return false
    }

    /**
     * Check if player is admin
     * @param {player} player 
     * @returns bool
     */
    isAdmin(player) {
        if (player.admin) {
            return true
        }
        return false
    }

    start() {

        this.on('browserConnection', (data) => {
            this.emit("browserConnection", this.code)
        })

        if (sessionStorage.getItem('uuid')) {

            let tCode = this.code
            if (tCode == undefined || tCode == 'null') {
                tCode = sessionStorage.getItem('code')
            }

            this.code = tCode
            this.socket.code = tCode
            this.emit('reconnectPlayer', {
                code: tCode,
                uuid: sessionStorage.getItem('uuid')
            })
        } else {
            this.emit("browserConnection", this.code)
        }
    }

    emit(name, data = null) {
        // console.log("Emit: ", name)
        this.socket.emit(name, data)
    }

    on(name, cb) {
        this.socket.on(name, res => {
            // console.log("On: ", name)
            cb(res)
        })
    }

    initNotification() {
        this.on('newNotification', (data) => {
            switch (data.reason) {
                case "JOIN":
                    this.createNotification(data.pseudo + " joined !")
                    break;

                case "KICK":
                    this.createNotification(data.pseudo + " has been kicked !")
                    break;

                case "LEAVE":
                    this.createNotification(data.pseudo + " leaved")
                    break;

                case "RELOADED":
                    this.createNotification(data.pseudo + " reload the page")
                    break;
            }
        })
    }

    createNotification(text) {
        let notificationsSection = document.querySelector('#notifications')
        let div = new Container(null, { 'class': 'notification' })
        let textDiv = new H2(text)

        div.appendChild(textDiv)
        notificationsSection.appendChild(div.elem)

        setTimeout(() => {
            div.classAdd('notificationPop')
        }, 50)

        setTimeout(() => {
            div.classRemove('notificationPop')
            setTimeout(() => {
                div.elem.remove()
            }, 500)
        }, 3000)
    }
}