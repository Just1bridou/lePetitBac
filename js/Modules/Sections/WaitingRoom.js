class SectionWR {
    constructor(game, sub) {
        this.game = game
        this.sub = sub
        this.sectionObj = this.create()
        this.section = this.sectionObj.elem
    }

    create() {

        let section = new Section(
            new LayoutVertical(
                [
                    /**
                     * Header section
                     */
                    new Header(
                        new LayoutHorizontal(
                            [
                                new H4("PETITBAC.IO", { "class": "waiting_title flex_1" }),
                                new LayoutVertical([
                                    new Text("Cliquer ici pour copier le lien", { "class": "clickMe" }),
                                    new Input({ "type": "text", "id": "join_link" })
                                ], { "class": "copyLink" }),
                                new H4("", { "class": "waiting_numbers flex_1" })
                            ], { "justify": "between", "align": "center" }
                        ),
                    ),

                    /**
                     * Body section
                     */
                    new LayoutHorizontal(
                        [
                            /**
                             * Left pannel
                             */
                            new LayoutVertical(
                                [
                                    new Canvas(),

                                    /**
                                     * PLayers list
                                     */
                                    new Container(
                                        null, { "id": "player_list" }
                                    ),

                                    /**
                                     * Ready button
                                     */
                                    new Container(
                                        new Button(
                                            "Prêt", { "class": "ready_button" }
                                        ), { "class": "ready_button_container" }
                                    ),
                                ], {
                                    "justify": "between",
                                    "class": "flex_1 playerDiv w100 h100",
                                }
                            ),

                            /**
                             * Right pannel
                             */
                            new LayoutVertical(
                                [
                                    /**
                                     * Tabs div
                                     */
                                    new LayoutHorizontal(
                                        [
                                            new Container(new Text("PARTIE"), { "class": "titleGame" }),
                                            new Container(new Text("CONFIGURATION"), { "class": "titleConf" }),
                                        ], { "class": "tabs" }
                                    ),

                                    /**
                                     * Words container div
                                     */
                                    new Container(
                                        new Container(
                                            new UL(null, { "id": "wordDiv" }), { "class": "gameContentTab" }
                                        ), { "class": "borderContainerTab" }
                                    ),

                                    /**
                                     * Configuration div
                                     */
                                    new Container(
                                        new LayoutVertical(
                                            [
                                                /**
                                                 * Mode selector
                                                 */
                                                new Container(
                                                    new LayoutVertical([
                                                        new H4("Mode :"),
                                                        new LayoutHorizontal([
                                                            new LayoutVertical([
                                                                new Img("/images/crayon2.png"),
                                                                new Container(new Text("CLASSIQUE"), { "class": "modeTitle" })
                                                            ], { "class": "modeDiv classicMode selectedMode", "value": "CLASSIC" }),

                                                            new LayoutVertical([
                                                                new Container(new Text("?", { "class": "modeContent" })),
                                                                new Container(new Text("ALÉATOIRE"), { "class": "modeTitle" })
                                                            ], { "class": "modeDiv randomMode", "value": "RANDOM" })
                                                        ], { "class": "modeChoiceContent" })
                                                    ])
                                                ),

                                                /**
                                                 * Round selector
                                                 */
                                                new LayoutVertical([
                                                    new H4("Manches :"),
                                                    new Container(null, { "class": "partie" })
                                                ], { "class": "gameConfiguration" }),
                                            ], { "class": "gameContentTab" }
                                        ), {
                                            "class": "borderContainerTabConf none"
                                        }
                                    )
                                ], {
                                    "class": "gameSettings flex_1 h100",
                                }
                            )
                        ], { "class": "body h100" },
                    )
                ], { "class": "h100" },
            ), {
                "height": "full",
                "width": "full",
                "class": "none waitingRoom"
            }
        )

        document.body.appendChild(section.elem)

        return section
    }

    update() {
        let link = this.sectionObj.select('#join_link')
        let path = location.protocol + '//' + location.host
        link.elem.value = path + '/r/' + this.game.code

        this.initConfiguration()
    }

    /**
     * Init waiting room page
     */
    init() {
        let link = this.sectionObj.select('#join_link')
        let ready_button = this.sectionObj.select('.ready_button')
        let clickMe = this.sectionObj.select('.clickMe').elem

        let path = location.protocol + '//' + location.host
        link.elem.value = path + '/r/' + this.game.code

        link.onClick(() => {
            link.elem.select();
            link.elem.setSelectionRange(0, 99999);
            document.execCommand("copy");
        })

        link.onClick(() => {
            let save = clickMe.innerHTML
            clickMe.innerHTML = "COPIÉ !"
            setTimeout(() => {
                clickMe.innerHTML = save
            }, 2000)
        })

        ready_button.disabled(false)
        ready_button.classRemove('ready_click')

        ready_button.onClick(() => {
            ready_button.classToggle('ready_click')
            this.game.emit("switchState", null)
        })

        this.initTabs()

        this.game.on('refreshWordsList', (words) => {
            this.refreshWordsList(words)
        })

        this.game.on('adminSettings', (room) => {
            this.adminConfiguration(room)
        })

        this.game.on('refreshList', (list) => {
            let waitingList = this.sectionObj.select('#player_list').elem
            waitingList.innerHTML = ""
            this.refreshPlayerList(list)
        })
    }

    /**
     * Init tabs switch
     */
    initTabs() {
        var tabGameButton = this.sectionObj.select('.titleGame')
        var tabConfButton = this.sectionObj.select('.titleConf')

        var tabGame = this.sectionObj.select('.borderContainerTab')
        var tabConf = this.sectionObj.select('.borderContainerTabConf')

        tabGameButton.onClick(() => {
            tabGame.classRemove('none')
            tabConf.classAdd('none')

            tabGameButton.classRemove('darkGreenTabs')
            tabConfButton.classAdd('darkBlueTabs')
        })

        tabConfButton.onClick(() => {
            tabConf.classRemove('none')
            tabGame.classAdd('none')

            tabConfButton.classRemove('darkBlueTabs')
            tabGameButton.classAdd('darkGreenTabs')
        })
    }

    /**
     * Events for configuration page
     */
    initConfiguration() {
            /**
             * Get actuals rounds
             */
        this.game.emit('getRounds', (rounds) => {
            this.editRoundSpan(rounds)
        });

        /**
         * On rounds change
         */
        this.game.on('getRounds', (rounds) => {
            this.editRoundSpan(rounds)
        });

        /**
         * On game mode change
         */
        this.game.on('changeGameMode', (data) => {
            console.log("change mode")

            this.switchMode(data.mode)

            switch (data.mode) {
                case "CLASSIC":
                    this.refreshWordsList(data.words)
                    break;

                case "RANDOM":
                    this.randomMode()
                    break;
            }
        })
    }

    editRoundSpan(rounds) {
        var partieRoundNb = this.sectionObj.select('.partie')

        let span = document.querySelector('.spanNbRound')
        if (span) {
            span.innerHTML = rounds + " manches"
        } else {
            let span = new Span(rounds + " manches", { "class": "spanNbRound" })
            partieRoundNb.appendChild(span)
        }
    }

    /**
     * Switch class between modes div
     * @param {string} modeWord 
     */
    switchMode(modeWord) {
        let configrationModes = this.sectionObj.selectAll('.modeDiv')

        configrationModes.forEach(mode => {

            mode.classRemove('selectedMode')

            if (mode.getAttribute('value') == modeWord) {
                mode.classAdd('selectedMode')
            }
        });
    }

    /**
     * Display the random message rule
     */
    randomMode() {
        console.log("random")

        let words_div = this.sectionObj.select('#wordDiv')
        let cb = document.querySelector('.settingsControls')

        if (cb) {
            cb.classList.add('none')
        }

        words_div.elem.innerHTML = ""

        words_div.appendChild(new H2("Mode Aléatoire !"))
        words_div.appendChild(new P("Les catégories restent inconnues jusqu'au 1er round"))
    }

    /**
     * Refresh words div
     * @param {string[]} wordsList 
     */
    refreshWordsList(wordsList) {
        let cb = document.querySelector('.settingsControls')

        if (cb) {
            cb.classList.remove('none')
        }

        let words_div = this.sectionObj.select('#wordDiv')

        words_div.elem.innerHTML = ""

        for (let word of wordsList) {

            let wordContainer = new Container(null, { "class": "wordContainer" })
            let wordText = new Container(new Span(word), { "class": "wordPartie" })
                //div.classList.add('adminClassRemove')
            if (this.game.isAdmin(JSON.parse(sessionStorage.getItem('player')))) {
                this.wordUpdate(wordContainer.elem)
            }

            wordContainer.appendChild(wordText)
            wordDiv.appendChild(wordContainer.elem)
        }

        words_div.scrollTop = words_div.scrollHeight;
    }

    wordUpdate(div) {
        div.classList.add('adminClassRemove')

        div.addEventListener('click', () => {
            this.game.emit('removeWord', div.querySelector('span').innerText)
        })
    }

    /**
     * Create all inputs for admins
     */
    adminConfiguration(room) {

        /**
         * Input to add new word
         */

        let partieRoundNb = this.sectionObj.select('.partie')
        let contentTab = this.sectionObj.select('.gameContentTab')

        let cb = document.querySelector('.settingsControls')
        if (cb) {
            cb.remove()
        }

        partieRoundNb.innerHTML = ""

        let controlBox = new Container(null, { "class": "settingsControls" })
        let inputNewWord = new Input({ "placeholder": "Ajouter une catégorie ..." })
        let addWordButton = new Button("Ajouter" /*, { "disabled": true }*/ )

        contentTab.appendChild(controlBox)
        controlBox.appendChild(inputNewWord)
        controlBox.appendChild(addWordButton)

        let inputRound = new Input({
            "class": "inputNbRound",
            "value": room.maxRound,
            "type": "number",
            "max": 25,
            "min": 1,
        })

        partieRoundNb.appendChild(inputRound)

        inputRound.elem.addEventListener('change', () => {
            this.game.emit('changeMaxRound', inputRound.elem.value)
        })

        inputNewWord.elem.focus()

        inputNewWord.onKeyup((event) => {
            if (event.keyCode == 13) {
                if (inputNewWord.elem.value != "") {
                    this.game.emit('addNewWord', inputNewWord.elem.value)
                    inputNewWord.elem.value = ""
                }
            }
        });

        addWordButton.onClick(() => {
            if (inputNewWord.elem.value != "") {
                this.game.emit('addNewWord', inputNewWord.elem.value)
                inputNewWord.elem.value = ""
            }
        })

        /**
         * Channge game mode
         */

        let configrationModes = this.sectionObj.selectAll('.modeDiv')

        configrationModes.forEach(mode => {
            mode.classAdd('clickable')
            mode.onClick(() => {
                this.game.emit('changeMode', mode.elem.getAttribute('value'))
            })
        })
    }


    /**
     * Refresh players list
     * @param {Player[]} playersList 
     */
    refreshPlayerList(playersList) {

        console.log("waitingroom")
        console.log(playersList)

        let waitingPlayerList = this.sectionObj.select('#player_list')
        let countPlayer = this.sectionObj.select('.waiting_numbers')
        let localPlayer = JSON.parse(sessionStorage.getItem('player'))

        let count = 0
        for (let player of playersList) {
            if (!player.disconnect) {
                count++
            }
        }
        countPlayer.elem.innerHTML = count + " JOUEUR(S)"

        for (let player of playersList) {
            if (player.disconnect) { break }

            console.log("create div for : " + player.pseudo)

            let playerLi = this.createPlayerDiv(player)
            waitingPlayerList.appendChild(playerLi)

            if (this.game.isAdmin(localPlayer)) {
                if (!this.game.isActualPlayer(player)) {

                    let kickPlayer = new Container(new Span("KICK"), { "class": "kickPlayer" })
                    playerLi.appendChild(kickPlayer)

                    kickPlayer.onClick(() => {
                        this.game.emit('kickPlayer', player.uuid)
                    })
                }
            }

            if (!player.ready) {
                playerLi.classAdd("unready")
            } else {
                playerLi.classRemove("unready")
            }
        }
    }

    /**
     * Create player's div
     * @param {Player} player 
     * @returns Container
     */
    createPlayerDiv(player) {

        let div = new Container(null, { "class": "playerDivContent" })
        let avatarContainer = new Container(null, { "class": "avatarContainer" })

        let avatar = this.generateAvatar(player)
        let pseudo = new H2(player.pseudo)

        div.appendChild(avatarContainer)
        div.appendChild(pseudo)
        avatarContainer.appendChild(avatar)

        return div
    }

    generateAvatar(player) {
        let avatar = new Container()

        avatar.classAdd(player.avatar_shape)

        if (player.avatar_shape == "avatar_triangle") {
            avatar.elem.style.borderBottomColor = player.avatar_color
        } else {
            avatar.elem.style.backgroundColor = player.avatar_color
        }

        return avatar
    }

    resetWaitingRoom() {
        let ready_button = this.sectionObj.select('.ready_button')

        ready_button.disabled(false)
        ready_button.classRemove('ready_click')

        this.game.on('updateGameMode', null);
    }
}