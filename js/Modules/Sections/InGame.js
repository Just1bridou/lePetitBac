class SectionInGame {
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
                new Section(null, { "id": "gameContent" })
            ], { "id": "game", "class": "none" }
        )

        document.body.appendChild(section.elem)

        return section
    }

    update() {}

    init() {
        this.stopRound()
    }

    createGame(game) {
        let rounds = this.sectionObj.select('.waitingRound')
        let letter = this.sectionObj.select('.letterDisplay')

        rounds.elem.innerHTML = "Manche " + game.actualRound + '/' + game.maxRound
        letter.elem.innerHTML = game.actualLetter

        this.refreshPlayerList(game.playersList)
        this.generateInput(game.wordsList, game.actualLetter)
    }

    generateInput(wordsList, actualLetter) {
        var gameContent = this.sectionObj.select('#gameContent')
        gameContent.elem.innerHTML = ""

        var inputList = []
        for (let word of wordsList) {

            let div = new Section(null, { "class": "answerContent" })
            let h3 = new H3(word, { "text": "left" })
            let input = new Input({
                "type": "text",
                "placeholder": actualLetter + " ..."
            })

            inputList.push(input.elem)

            gameContent.appendChild(div)
            div.appendChild(h3)
            div.appendChild(input)
        }

        inputList[0].focus()
        inputList[0].addEventListener("keyup", function(event) {
            if (event.keyCode === 13) {
                inputList[1].focus()
            }
        });

        let stopButton = new Button("STOP")
        gameContent.appendChild(stopButton)


        stopButton.onClick(() => {
            this.game.emit('stopAllPlayer', null)
        })

        this.game.on('stopRound', (data) => {
            stopButton.disabled(true);
        })

        // Change input when press enter
        for (let i = 0; i < inputList.length; i++) {
            inputList[i].addEventListener('focus', (event) => {
                inputList[i].addEventListener("keyup", function(event) {
                    if (event.keyCode === 13) {
                        if (i == inputList.length - 1) {
                            inputList[0].focus()
                        } else {
                            inputList[i + 1].focus()
                        }
                    }
                });
            });
        }
    }

    refreshPlayerList(playersList) {
        let countPlayer = this.sectionObj.select('.waiting_numbers')

        let count = 0
        for (let player of playersList) {
            if (!player.disconnect) {
                count++
            }
        }
        countPlayer.elem.innerHTML = count + " JOUEUR(S)"
    }

    /**
     * Stop the round (when someone click on STOP)
     */
    stopRound() {
        this.game.on('stopRound', (data) => {
            var res = []

            var gameContent = this.sectionObj.select('#gameContent')
            let inputs = gameContent.elem.querySelectorAll('input')

            for (let i = 0; i < inputs.length; i++) {
                let notes = []
                for (let player of data.playersList) {

                    if (!player.disconnect) {

                        if (inputs[i].value == "") {
                            notes.push(0)
                        } else {
                            notes.push(1)
                        }
                    }
                }
                let current = {
                    "value": inputs[i].value,
                    "notes": notes,
                    "pos": i
                }

                res.push(current)
            }
            this.game.emit('resultStop', res)
        })
    }
}