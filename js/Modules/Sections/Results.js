class SectionResults {
    constructor(game, sub) {
        this.game = game
        this.sub = sub
        this.sectionObj = this.create()
        this.section = this.sectionObj.elem
    }

    create() {

        let section = new LayoutVertical(
            [
                new LayoutHorizontal([
                    new H3(null, { "class": "waitingRound" }),
                    new Section(
                        new H3(null, { "class": "letterDisplay" }), { "class": "letterDisplay_container" },
                    ),
                    new H3(null, { "class": "waiting_numbers" }),
                ], {
                    "class": "header",
                    "align": "center",
                }),
                new Section(null, { "id": "resultContent" }),
                new Section(null, { "id": "playerNextRound" }),
            ], { "id": "result", "class": "none" }
        )

        document.body.appendChild(section.elem)

        return section
    }

    update() {}

    init() {}

    /**
     * Display the results of players
     * @param {Room} room 
     */
    displayResults(room) {
        console.log(room)

        this.refreshHeader(room)

        var resultContent = this.sectionObj.select('#resultContent')
        resultContent.elem.innerHTML = ""

        /**
         * Create all results container
         */
        for (var i = 0; i < room.wordsList.length; i++) {

            let divContainer = new Container(null, { "class": "wordResults" })
            let wordTitle = new H2(room.wordsList[i])

            let table = new Container(null, { "class": "tableResults" })
            let info = new Container(null, { "class": "tableInfos" })

            let joueur = new Container(
                new Span("Joueur"), {
                    "class": "tableInfosContent"
                })

            let mot = new Container(
                new Span("Mot"), {
                    "class": "tableInfosContent"
                })

            let reponseChoice = new Container(
                new Span("Réponse juste ?"), {
                    "class": "tableInfosContent"
                })

            let notes = new Container(
                new Span("Notes"), {
                    "class": "infoNotes"
                })

            resultContent.appendChild(divContainer)
            divContainer.appendChild(wordTitle)
            divContainer.appendChild(table)

            table.appendChild(info)

            info.appendChild(joueur)
            info.appendChild(mot)
            info.appendChild(reponseChoice)
            info.appendChild(notes)

            console.log("playerlist :")
            console.log(room.playersList)

            for (let player of room.playersList) {

                if (!player.disconnect && player.data.length > 0) {

                    console.log("create input for : " + player.pseudo)

                    let input = player.data[i]
                    let inputNotes = input.notes

                    let tr = new Container(null, { "class": "lineContent" })
                    table.appendChild(tr)

                    let playerPseudo = new Container(new Span(player.pseudo))
                    tr.appendChild(playerPseudo)

                    let value = new Container(new Span(input.value))
                    tr.appendChild(value)

                    let userDivContent = new Container(null)
                    tr.appendChild(userDivContent)

                    let userDiv = new Container(null, { "class": "userCase" })
                    userDivContent.appendChild(userDiv)

                    this.isCanceled(value, inputNotes)

                    userDiv.onClick(() => {
                        this.game.emit('userIsReady', ready => {
                            if (!ready) {
                                userDiv.classToggle('falseCase')
                                this.game.emit('editUserCase', {
                                    'uuid': player.uuid,
                                    'input': input
                                })
                            }
                        });
                    })

                    if (!inputNotes[0]) {
                        userDiv.classAdd('falseCase')
                    }

                    let resultContent = new Container(null, { "class": "resultsContent" })
                    tr.appendChild(resultContent)

                    console.log(player.data)
                    console.log(i)
                    console.log(player.data[i])
                    console.log(inputNotes)
                    for (let i = 0; i < inputNotes.length; i++) {

                        let resCase = new Container(null, { "class": "resCase" })
                        resultContent.appendChild(resCase)

                        if (inputNotes[i]) {
                            resCase.classRemove('falseCase')
                        } else {
                            resCase.classAdd('falseCase')
                        }

                        this.game.on('refreshChoice', (playerReceive) => {
                            if (player.uuid == playerReceive.uuid) {
                                for (let np of playerReceive.data) {
                                    if (input.pos == np.pos && playerReceive.index == i) {
                                        if (np.notes[playerReceive.index]) {
                                            resCase.classRemove('falseCase')
                                        } else {
                                            resCase.classAdd('falseCase')
                                        }
                                        this.isCanceled(value, np.notes)
                                    }
                                }
                            }
                        })
                    }
                }
            }
        }

        var clicked = false
        var playerNextRound = this.sectionObj.select('#playerNextRound')

        playerNextRound.elem.innerHTML = ""

        let buttonReady = new Button("Prêt", { "class": "nextRoundButton" })
        playerNextRound.appendChild(buttonReady)

        buttonReady.onClick(() => {
            clicked = true
            buttonReady.classAdd('clickedNR')
            this.game.emit("nextRoundPlayer", null)

            document.querySelectorAll('.userCase').forEach(userCase => {
                userCase.classList.add('noClick')
            })
        })

        this.setupPlayersState(room.playersList)

        this.game.on('refreshNextRound', (data) => {

            playerNextRound.elem.innerHTML = ""

            let buttonReady = new Button("PRÊT", { "class": "nextRoundButton" })
            playerNextRound.appendChild(buttonReady)

            if (clicked) {
                buttonReady.disabled(true)
                buttonReady.classAdd('clickedNR')
            }
            buttonReady.onClick(() => {
                clicked = true
                buttonReady.classAdd('clickedNR')
                this.game.emit("nextRoundPlayer", null)
            })

            this.setupPlayersState(data)
        })

    }

    /**
     * Cancel a word if total false notes > 50%
     * @param {Element} el 
     * @param {Array[int]} notes 
     */
    isCanceled(el, notes) {

        let totalPos = 0
        for (let note of notes) {
            if (note)
                totalPos++
        }

        if (totalPos < notes.length / 2) {
            el.classAdd('canceledWord')
        } else {
            el.classRemove('canceledWord')
        }
    }

    setupPlayersState(playersList) {
        var playerNextRound = this.sectionObj.select('#playerNextRound')

        let recapTitle = new H2("Récapitulatif", { "class": "recapTitle" })
        playerNextRound.appendChild(recapTitle)

        for (let player of playersList) {

            if (!player.disconnect) {

                let infoContainer = new LayoutHorizontal([
                    new H3(player.pseudo, {
                        "text": "center",
                        "class": "flex_3"
                    }),
                    new H3(player.score + " PTS.", {
                        "text": "left",
                        "class": "flex_2"
                    }),
                    new Container(new Span('PAS PRÊT'), {
                        "text": "right",
                        "class": "stateNR flex_6 statusReady"
                    })
                ], {
                    "class": "recapPlayer p10 pl20 pr20 mt20",
                    "justify": "between"
                })

                playerNextRound.appendChild(infoContainer)

                let status = infoContainer.select(".stateNR")

                if (player.ready) {
                    infoContainer.classAdd('readyNR')
                    status.elem.innerHTML = "PRÊT"
                } else {
                    infoContainer.classRemove('readyNR')
                    status.elem.innerHTML = "PAS PRÊT"
                }
            }
        }
    }

    refreshHeader(room) {
        let rounds = this.sectionObj.select('.waitingRound')
        let letter = this.sectionObj.select('.letterDisplay')

        rounds.elem.innerHTML = "Manche " + room.actualRound + '/' + room.maxRound
        letter.elem.innerHTML = room.actualLetter

        this.refreshCountPlayer(room.playersList)
    }

    refreshCountPlayer(playersList) {
        let countPlayer = this.sectionObj.select('.waiting_numbers')

        let count = 0
        for (let player of playersList) {
            if (!player.disconnect) {
                count++
            }
        }
        countPlayer.elem.innerHTML = count + " JOUEUR(S)"
    }
}