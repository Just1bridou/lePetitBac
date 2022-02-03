class SectionsManager {

    constructor(game) {
        this.game = game

        this.sections = []
        this.allPlayersList = []

        this.sections["login"] = new SectionLogin(game)
        this.sections["join"] = new SectionJoin(game)
        this.sections["waitingRoom"] = new SectionWR(game, this)
        this.sections["inGame"] = new SectionInGame(game, this)
        this.sections["results"] = new SectionResults(game, this)
        this.sections["score"] = new SectionScore(game, this)

        this.init()
        this.hideAll()
        this.initAll()

        this.initErrors()
    }

    init() {
        this.game.on("showSection", name => {
            this.show(name)
        })

        this.game.on("dismissSection", name => {
            this.dismiss(name)
        })

        this.game.on("transitionSection", data => {
            this.transition(data.from, data.to, data.text)
        })

        this.game.on("refreshPlayersList", data => {
            this.refreshAllPlayerList(data)
        })
    }

    initAll() {
        for (let section in this.sections) {
            this.sections[section].init()
        }
    }

    refreshAllPlayerList(data) {
        for (let key in this.allPlayersList) {
            this.allPlayersList[key](data, this.sections[key])
        }
    }

    /**
     * Make transition between two sections
     * @param {Section} toDismiss 
     * @param {Section} toShow 
     * @param {*} data 
     * @param {*} clear 
     * @param {*} text 
     */
    transition(toDismiss, toShow, text = null, fct = null) {
        let hideDiv = _('div', document.body, null, null, 'hideDiv')

        if (text)
            _('div', hideDiv, text, null, 'transitionDiv')

        setTimeout(() => {
            if (fct) {
                fct()
            }

            this.dismiss(toDismiss)
            this.show(toShow)
            scrollTop()
            hideDiv.style.animation = 'reverseFullWidth 1s forwards'
            setTimeout(() => {
                hideDiv.remove()
            }, 1500)
        }, 1600)
    }

    /**
     * Show section
     * @param {Section} section 
     */
    show(section) {
        this.sections[section].update()
        this.getSection(section).classList.remove('none')
    }

    /**
     * Hide section
     * @param {Section} section 
     */
    dismiss(section) {
        this.getSection(section).classList.add('none')
    }

    getSection(section) {
        return this.sections[section].section
    }

    /**
     * Hide all pages
     */
    hideAll() {
        for (let section in this.sections) {
            this.dismiss(section)
        }
    }

    /**
     * Reset pages
     */
    resetAllCat() {
        // reset game
        waitingPlayerList.innerHTML = ""
            //gamePlayerList.innerHTML = ""
    }

    initErrors() {
        this.game.on('error', (error) => {
            switch (error) {
                case 'inGame':
                    this.showError("Game already started :/")
                    break;

                case 'roomExist':
                    this.showError("No Room found :/")
                    break;

                case 'serverError':
                    this.showError("Server Error :/")
                    break;

                case 'kicked':
                    this.showError("Kicked from room :/")
                    break;
            }
        })
    }

    showError(error) {
        this.hideAll()
        var errorPage = document.querySelector('#error')
        errorPage.querySelector('h1').innerHTML = error
        errorPage.classList.remove('none')
    }
}