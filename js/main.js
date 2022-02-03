document.addEventListener('DOMContentLoaded', () => {

    const TIME_BEFORE_STARTING = 6

    var body = document.querySelector('body')

    const Game = new GameManager()
    const Sections = new SectionsManager(Game)

    Game.start()

    /**
     * Start the game
     */
    Game.on('gameStarting', (game) => {

        Sections.sections["waitingRoom"].sectionObj.select(".ready_button").disabled(true)

        let hideDiv = _('div', body, null, null, 'hideDiv')
        let countDiv = _('div', body, null, null, 'countDiv')
        hideDiv.classList.add('completeWidth')
        var counter = TIME_BEFORE_STARTING;


        var interval = setInterval(function() {
            counter--;

            countDiv.innerHTML = counter

            if (counter == 0) {
                // hideDiv.remove()
                hideDiv.style.animation = 'reverseFullWidth 1s forwards'
                setTimeout(() => {
                    hideDiv.remove()
                }, 1500)
                countDiv.remove()

                Sections.dismiss("waitingRoom")
                Sections.show("inGame")
                clearInterval(interval);
                //createGame(game)
                Sections.sections["inGame"].createGame(game)
                scrollTop()
            }
        }, 1000);
    })

    Game.on("recoverInGame", (game) => {
        Sections.hideAll()
        Sections.show("inGame")
        Sections.sections["inGame"].createGame(game)
        scrollTop()
    })

    Game.on("recoverResults", (game) => {
        Sections.hideAll()
        Sections.show("results")
        Sections.sections["results"].displayResults(game)
        scrollTop()
    })

    /**
     * Display results page
     */
    Game.on('displayResults', (room) => {
        Sections.dismiss('inGame')
        Sections.show('results')
        Sections.sections["results"].displayResults(room)
        scrollTop()
    })

    /**
     * Next round
     */
    Game.on('nextRound', (data) => {
        Sections.transition("results", "inGame", "Next Round", () => {
            Sections.sections["inGame"].createGame(data)
        })

    })

    /**
     * Display final results
     */
    Game.on('endResults', (room) => {
        Sections.transition("results", "score", "RESULTS !", () => {
            Sections.sections["score"].displayScore(room)
        })
    })

    /**
     * Replay game
     */
    Game.on('replayGame', (data) => {
        Game.emit('replayRefresh', null)
        Sections.transition("score", "waitingRoom", "REPLAY", () => {
            Sections.sections["waitingRoom"].resetWaitingRoom()
        })
    })

    /**
     * Scroll to top
     */
    function scrollTop() {
        window.scrollTo(0, 0)
    }

})