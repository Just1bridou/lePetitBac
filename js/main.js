document.addEventListener('DOMContentLoaded', () => {

    const socket = io()
    
    const TIME_BEFORE_STARTING = 6

    var body = document.querySelector('body')
    
    var uuid = sessionStorage.getItem('uuidPlayer');
    var room = window.location.pathname.split('/')[2]

    // Login
    var loginSection = document.querySelector('#login')
    var loginInput = loginSection.querySelector('#login_pseudo')
    var createRoom = loginSection.querySelector('#createRoom')

    // Waiting Room
    var waitingRoomSection = document.querySelector('#waitingRoom')
 
    var waitingPlayerList = waitingRoomSection.querySelector('#player_list')

    var waitingTitle = document.querySelectorAll('.waiting_title')
    var waitingRound = document.querySelectorAll('.waitingRound')
    var waitingNumbers = document.querySelectorAll('.waiting_numbers')

    var copyLink = waitingRoomSection.querySelector('.copyLink')
    var clickMe = waitingRoomSection.querySelector('.clickMe')
    var link = waitingRoomSection.querySelector('#join_link')
    var ready_button = waitingRoomSection.querySelector('#ready_button')
    var words_div = waitingRoomSection.querySelector('#wordDiv')

    var gameSettings = waitingRoomSection.querySelector('#gameSettings')
    var gameContainer = waitingRoomSection.querySelector('#gameContainer')
    var partieRoundNb = waitingRoomSection.querySelector('.partie')

    var configrationModes = document.querySelectorAll('.modeDiv')

    // Game
    var gameSection = document.querySelector('#game')
    var gameContent = gameSection.querySelector('#gameContent')
    var gamePlayerList = gameSection.querySelector('#player_list')
    var letterDisplay = document.querySelectorAll('.letterDisplay')

    // Results
    var resultSection = document.querySelector('#result')
    var resultContent = document.querySelector('#resultContent')
    var playerNextRound = document.querySelector('#playerNextRound')

    // Score
    var scoreSection = document.querySelector('#score')
    var top = scoreSection.querySelector('.top')
    var replayDiv = scoreSection.querySelector('.replayDiv')

    // Errors
    var errorPage = document.querySelector('#error')

    // Notifications
    var notificationsSection = document.querySelector('#notifications')

    if(sessionStorage.getItem('uuid')) {
        console.log('was a refresh')
    } else {
        console.log('its new player')
    }
    
    /**
     * Init login page
     */
    initLogin()
    
    /**
     * Check if room exist
     */
    if(room) {
        socket.emit('checkRoomExist', room)
    } else {
        show(loginSection)
    }

    /**
     * Create modal connect
     */
    socket.on('roomExist', (data) => {
        newModalConnect()
    })

    /**
     * Display errors
     */
    socket.on('error', (error) => {
        switch(error) {
            case 'inGame':
                showError("Game already started :/")
                break;
        
            case 'roomExist':
                showError("No Room found :/")
                break;

            case 'serverError':
                showError("Server Error :/")
                break;

            case 'kicked':
                showError("Kicked from room :/")
                break;
        } 
    })

    /**
     * Save player's UUID on sessionStorage
     */
    socket.on('saveUUID', (player) => {
        sessionStorage.setItem('uuid', player.uuid);
        sessionStorage.setItem('player', JSON.stringify(player))
    })

    /**
     * Get room's data and init waiting room
     */
    socket.on('dataSender', (data) => {
        refreshPlayerList(data.playerList, waitingPlayerList)
        initWaitingRoom()
        transitionRound(loginSection, waitingRoomSection, null, null, 'JOINED !')
    })

    /**
     * Refresh words list
     */
    socket.on('wordList', (data) => {
        if(data)
        refreshWordList(data.wordList)
    })

    socket.on('changeGameMode', (mode, words, player, room) =>{

        switchMode(mode)

        switch(mode) {
            case "CLASSIC":
                createClassicPannel(mode, words, player, room)
                break;

            case "RANDOM":
                randomModeMessage()
                break;
        }
    })

    /**
     * Create setting for the game 
     * - Add / remove words
     * - Change rounds
     */
    socket.on("gameSettings", (room) => {
        createPannelSetting(room)
    })

    /**
     * Refresh players list
     */
    socket.on('refreshList', (list) => {
        waitingPlayerList.innerHTML = ""
        refreshPlayerList(list, waitingPlayerList)
    })

    /**
     * Start the game
     */
    socket.on('gameStarting', (game) => {
        ready_button.disabled = true

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
                dismiss(waitingRoomSection)
                show(gameSection)
                clearInterval(interval);
                createGame(game)
            }
        }, 1000);
    })

    /**
     * Stop the round (when someone click on STOP)
     */
    socket.on('stopRound', (data) => {
        var res = []
        let inputs = gameContent.querySelectorAll('input')

        for(let i=0; i < inputs.length; i++) {
            let notes = []
            for(let player in data.playerList) {
                if(inputs[i].value == "") {
                    notes.push(0)
                } else {
                    notes.push(1)
                }
            }
            let current = {
                "value":inputs[i].value, 
                "notes":notes,
                "pos":i
            }
            res.push(current)
        }
        socket.emit('resultStop', res)
    })

    /**
     * Display results page
     */
    socket.on('displayResults', (room) => {
        let listPlayer = room.playerList
        var clicked = false
        dismiss(gameSection)
        scrollTop()
        show(resultSection)

        for(var i=0; i< room.wordList.length; i++) {

            let div = _('div', resultContent, null, null, "wordResults")
            _("h2", div, room.wordList[i])
            
            let table = _('div', div, null, null, "tableResults")

            let info = _("div", table, null, null, "tableInfos")

            _("div", info, "Joueur", null, "tableInfosContent")
            _("div", info, "Mot", null, "tableInfosContent")
            _("div", info, "Réponse juste ?", null, "tableInfosContent")
            _("div", info, "Notes", null, "infoNotes")

            for(let player of listPlayer) {

                let input = player.data[i]
                let inputNotes = input.notes

                let tr = _('div', table, null, null, "lineContent")

                _("div", tr, player.pseudo)
                let value = _("div", tr, input.value)

                let userDivContent = _("div", tr)
                let userDiv = _("div", userDivContent, null, null, 'userCase')

                isCanceled(value, inputNotes)

                userDiv.addEventListener('click', () => {
                    socket.emit('userIsReady', ready => {
                        if(!ready) {
                            userDiv.classList.toggle('falseCase')
                            socket.emit('editUserCase', {
                                'uuid': player.uuid,
                                'input': input
                            } )
                        }
                    });
                })

                if(!inputNotes[0]) {
                    userDiv.classList.add('falseCase')
                }
                
                let resultsContent = _("div", tr, null, null, 'resultsContent')
                for(let i = 0; i < inputNotes.length; i++) {
                    let r = _("div", resultsContent, null, null, 'resCase')
                    if(inputNotes[i]) {
                        r.classList.remove('falseCase')
                    } else {
                        r.classList.add('falseCase')
                    }

                    socket.on('refreshChoice', (playerReceive) => {
                        if(player.uuid == playerReceive.uuid) {
                            for(let np of playerReceive.data) {
                                if(input.pos == np.pos && playerReceive.index == i) {
                                    if(np.notes[playerReceive.index]) {
                                        r.classList.remove('falseCase')
                                    } else {
                                        r.classList.add('falseCase')
                                    }
                                    isCanceled(value, np.notes)
                                }
                            }
                        }
                    })
                }
            }
        }

        playerNextRound.innerHTML = ""

        let nr = _("button", playerNextRound, 'Ready', null, 'nextRoundButton')
        nr.addEventListener('click', () => {
            clicked = true
            nr.classList.add('clickedNR')
            socket.emit("nextRoundPlayer", null)

            document.querySelectorAll('.userCase').forEach(userCase => {
                userCase.classList.add('noClick')
            })
        })

        setupPlayersState(room.playerList)

        socket.on('refreshNextRound', (data) => {
            
            playerNextRound.innerHTML = ""

            let nr = _("button", playerNextRound, 'Ready', null, 'nextRoundButton')
            if(clicked) {
                nr.disabled = true
                nr.classList.add('clickedNR')
            }
            nr.addEventListener('click', () => {
                clicked = true
                nr.classList.add('clickedNR')
                socket.emit("nextRoundPlayer", null)
            })

            setupPlayersState(data)
        })

    })

    /**
     * Next round
     */
    socket.on('nextRound', (data) => {
        transitionRound(resultSection, gameSection, data, true, 'NEXT ROUND')
    })

    /**
     * Display final results
     */
    socket.on('endResults', (room) => {
        room.playerList.sort(function(a, b){
            return b.score - a.score;
        });

        let replayButton = _('button', replayDiv, 'REJOUER', null, 'replayButton')
        replayButton.addEventListener('click', () => {
            socket.emit('replayGame', null)
        })

        for(let i=0; i<room.playerList.length; i++) {

            if(i==0)
            createPlayerResultDiv(room.playerList[0], "gold", 1)
            if(i==1)
            createPlayerResultDiv(room.playerList[1], "silver", 2)
            if(i==2)
            createPlayerResultDiv(room.playerList[2], "copper", 3)
            if(i>=3)
            createPlayerResultDiv(room.playerList[i], "other", i+1)

        }

        transitionRound(resultSection, scoreSection, null, null, 'RESULTS')
    })

    /**
     * Replay game
     */
    socket.on('replayGame', (data) => {
        resetAllCat()
        transitionRound(scoreSection, waitingRoomSection, null, null, 'REPLAY')
        socket.emit('replayRefresh', null)
        resetWaitingRoom()
    })

    socket.on('newNotification', (pseudo, reason) => {
        switch(reason) {
            case "JOIN":
                createNotification(pseudo + " joined !")
                break;

            case "KICK":
                createNotification(pseudo + " has been kicked !")
                break;

            case "LEAVE":
                createNotification(pseudo + " leaved")
                break;
        }
    })

    function createNotification(text) {
        let div = _('div', notificationsSection, null, null, 'notification')
        _('h2', div, text)

        setTimeout(() => {
            div.classList.add('notificationPop')
        },50)

        setTimeout(() => {
            div.classList.remove('notificationPop')
            setTimeout(() => {
                div.remove()
            },500)
        },3000)
    }

    function createClassicPannel(mode, words, player, room) {
        refreshWordList(words)
        if (isAdmin(player)) {
            createInputWord(room)
        }
    }

    function createPannelSetting(room) {
        let wordList = room.wordList

        refreshWordList(wordList, true)
        createInputWord(room)
    }

    function createInputWord(room) {

        let cb = document.querySelector('.settingsControls')
        if(cb) {
            cb.remove()
        }

        partieRoundNb.innerHTML = ""
        _('h1', partieRoundNb, 'PARTIE')

        let controlBox = _('div', gameSettings.querySelector('.gameContentTab'), null, null, "settingsControls")
        let inputNewWord = _('input', controlBox)
        inputNewWord.placeholder = "Ajouter un mot ..."
        let addWordButton = _('button', controlBox, "Ajouter")
        addWordButton.disabled = true

        let inputRound = _('input', partieRoundNb, null, null, 'inputNbRound')
        inputRound.value = room.maxRound
        inputRound.type = 'number'
        inputRound.max = 10
        inputRound.min = 1
        _('span', partieRoundNb, 'rounds', null, 'spanNbRound')

        inputRound.addEventListener('change', () => {
            socket.emit('changeMaxRound', inputRound.value)
        })

        inputNewWord.focus()

        inputNewWord.addEventListener("keyup", function(event) {
            if (event.keyCode === 13 ) {
                addNewWord(inputNewWord.value)
                inputNewWord.focus()
            }
        });

        inputNewWord.addEventListener('keyup', (event) => {
            if(inputNewWord.value != "") {
                addWordButton.disabled = false;
            } else {
                addWordButton.disabled = true;
            }
        })
    
        addWordButton.addEventListener('click', () => {
            addNewWord(inputNewWord.value)
        })
    }

    /**
     * Cancel a word if total false notes > 50%
     * @param {Element} el 
     * @param {Array[int]} notes 
     */
    function isCanceled(el, notes) {

        let totalPos = 0
        for (let note of notes) {
            if(note)
            totalPos++
        }

        if(totalPos < notes.length / 2) {
            el.classList.add('canceledWord')
        } else {
            el.classList.remove('canceledWord')
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
    function transitionRound(toDismiss, toShow, data, clear = null, text=null) {
        let hideDiv = _('div', body, null, null, 'hideDiv')

        if(text)
            _('div', hideDiv, text, null, 'transitionDiv')

        setTimeout(() => {
            if(clear) 
                resetAllCat()
            if(data)
                createGame(data)
            dismiss(toDismiss)
            show(toShow)
            scrollTop()
            hideDiv.style.animation = 'reverseFullWidth 1s forwards'
            setTimeout(() => {
                hideDiv.remove()
            }, 1500)
        }, 1600)
    }

    /**
     * Check if player is actual player
     * @param {player} player 
     * @returns bool
     */
    function isActualPlayer(player) {
        if(player.uuid == sessionStorage.getItem('uuid')) {
            return true
        }
        return false
    }

    /**
     * Check if player is admin
     * @param {player} player 
     * @returns bool
     */
    function isAdmin(player) {
        if(player.modo) {
            return true
        }
        return false
    }

    /**
     * Scroll to top
     */
    function scrollTop() {
        window.scrollTo(0, 0)
    }

    /**
     * Init login page
     */
    function initLogin() {
        loginInput.addEventListener('keyup', (event) => {
            if(loginInput.value != "") {
                createRoom.disabled = false;
                
                if (event.keyCode === 13 ) {
                    socket.emit("createRoom", { pseudo : loginInput.value})
                }

            } else {
                createRoom.disabled = true;
            }
        })
    
        createRoom.addEventListener('click', () => {
            socket.emit("createRoom", { pseudo : loginInput.value})
        })

        socket.on('roomCreated', (data) => {
            room = data.room
            socket.emit("getData", null)
        })
    }

    /**
     * 
     */
    function initConfiguration() {
        socket.emit('userIsAdmin', admin => {
            if(admin) {
                configrationModes.forEach(mode => {

                    mode.classList.add('clickable')

                    mode.addEventListener('click', () => {

                        socket.emit('changeMode', mode.getAttribute('value'))

                    })
                })
            }
        });
    }

    /**
     * Init waiting room page
     */
    function initWaitingRoom() {
        for(let title of waitingTitle) {
            title.innerHTML = "PARTIE <span class='tonalite'>#</span>" + room
        }

        let path = location.protocol + '//' + location.host
        link.value = path + '/r/' + room
    
        link.addEventListener('click', () => {
            link.select();
            link.setSelectionRange(0, 99999);
            document.execCommand("copy");
        })

        link.addEventListener('click', () => {
            let save = clickMe.innerHTML
            clickMe.innerHTML = "COPIÉ !"
            setTimeout(() => {
                clickMe.innerHTML = save
            },2000)
        })

        ready_button.disabled = false
        ready_button.classList.remove('ready_click')
    
        ready_button.addEventListener('click', () => {
            ready_button.classList.toggle('ready_click')
            socket.emit("switchState", null)
        })

        initConfiguration()
    }

    /**
     * Reset waiting room page
     */
    function resetWaitingRoom() {
        ready_button.disabled = false
        ready_button.classList.remove('ready_click')
    }

    /**
     * Refresh player list
     * @param {Array[player]} playerList 
     * @param {DOM Element} elem 
     */
    function refreshPlayerList(playerList, elem) {
        let localPlayer = JSON.parse(sessionStorage.getItem('player'))
        
        for(let nb of waitingNumbers) {
            nb.innerHTML = playerList.length + " JOUEUR(S)"
        }
        for(let player of playerList) {
            let playerLi = createPlayerDiv(player, elem)

            if(isAdmin(localPlayer)) {
                if(!isActualPlayer(player)) {
                   let kickPlayer = _('div', playerLi, 'KICK', null, 'kickPlayer')
                   kickPlayer.addEventListener('click', () => {
                       socket.emit('kickPlayer', player.uuid)
                   })
                }
            }

            if(!player.ready) {
                playerLi.classList.add("unready")
            } else {
                playerLi.classList.remove("unready")
            }
        }
    }

    /**
     * Create player div in player list
     * @param {*} pseudo 
     * @param {DOM Element} elem 
     * @returns DOM Element
     */
    function createPlayerDiv(player, elem) {
        let div = _('div', elem, null, null, 'playerDivContent')
        let avatar = _("img", div)
        avatar.src = player.avatar
        _("h2", div, player.pseudo)

        return div
    }

    /**
     * Refresh word list
     * @param {Array[word]} wordList 
     * @param {*} isAdmin 
     */
    function refreshWordList(wordList, isAdmin = false) {
        words_div.innerHTML = ""

        for(let word of wordList) {
            let wordContainer = _('div', words_div, null, null, "wordContainer")
            _("div", wordContainer, word, null, "wordPartie")

            if(isAdmin) {
                wordContainer.classList.add('adminClassRemove')

                wordContainer.addEventListener('click', () => {
                    socket.emit('removeWord', word)
                })
            }
        }

        words_div.scrollTop = words_div.scrollHeight;
    }

    function randomModeMessage() {
        let cb = document.querySelector('.settingsControls')
        if(cb) {
            cb.remove()
        }
        words_div.innerHTML = ""
        _('h2', words_div, "Mode Aléatoire !")
        _('p', words_div, "Les catégories restent inconnues jusqu'au 1er round")
    }

    function switchMode(modeWord) {
        configrationModes.forEach(mode => {

            mode.classList.remove('selectedMode')

            if(mode.getAttribute('value') == modeWord) {
                mode.classList.add('selectedMode')
            }
        });
    }

    /**
     * Create modal to join the room
     */
    function newModalConnect() {
        let pseudo = document.createElement('input')
        pseudo.placeholder = "Pseudo"
        let button = document.createElement('button')
        button.innerHTML = "VALIDER"
        button.disabled = true

        var hiden = _('div', body, null, null, "modelHide")
        var div = _('div', hiden, null, null, "modalNewPlayer")
        _('h3', div, "Rejoindre")

        let inputContainer = _('div', div, null, null, 'modalContentInput')
        inputContainer.appendChild(pseudo)
        inputContainer.appendChild(button)

        pseudo.addEventListener('keyup', (event) => {
            if(pseudo.value != "") {
                button.disabled = false;
            } else {
                button.disabled = true;
            }
        })

        pseudo.addEventListener('keyup', (event) => {
            if(pseudo.value != "") {
                button.disabled = false;
                
                if (event.keyCode === 13 ) {
                    socket.emit("newPlayer", {"pseudo": pseudo.value, "room": room})
                }

            } else {
                button.disabled = true;
            }
        })

        button.addEventListener('click', () => {
            socket.emit("newPlayer", {"pseudo": pseudo.value, "room": room})
        })

        socket.on('removeModal', () => {
            hiden.remove()
            initWaitingRoom()
            show(waitingRoomSection)
        })
    }

    /**
     * Create game page
     * @param {*} game 
     */
    function createGame(game) {
        for(let wr of waitingRound) {
            wr.innerHTML = "Manche " + game.actualRound + '/' + game.maxRound
        }

        for(let ld of letterDisplay) {
            ld.innerHTML = game.actualLetter
        }

        generateInput(game.wordList, game.actualLetter)
    }
 
    /**
     * Setup players state 
     * @param {Array[player]} playerList 
     */
    function setupPlayersState(playerList) {
        for(player of playerList) {

            let contentNR = _('div', playerNextRound, null, null , 'contentNR')
            let playerDiv = _('div', contentNR, player.pseudo, null , 'playerNR')
            let stateNR = _('div', contentNR, 'En Attente', null , 'stateNR')

            if(player.ready) {
                contentNR.classList.add('readyNR')
                stateNR.innerHTML = "PRÊT"
            } else {
                contentNR.classList.remove('readyNR')
                stateNR.innerHTML = "EN ATTENTE"
            }
        }
    }

    /**
     * Create div for player on final results page
     * @param {player} player 
     * @param {*} rank 
     * @param {*} nb 
     */
    function createPlayerResultDiv(player, rank, nb) {
        let div = _('div', top, null, null, rank)
        _('div', div, '#' + nb, null, "rank")
        _('div', div, player.pseudo, null, 'topPseudo')
        _('div', div, Math.round(player.score) + " PTS.", null, 'topScore')
    }

    /**
     * Reset pages
     */
    function resetAllCat() {
        // reset waiting

        // reset game
        gameContent.innerHTML = ""
        waitingPlayerList.innerHTML = ""
        //gamePlayerList.innerHTML = ""

        // reset results
        resultContent.innerHTML = ""
        playerNextRound.innerHTML = ""

        // reset score
        replayDiv.innerHTML = ""
        top.innerHTML = ""

    }

    /**
     * Hide all pages
     */
    function hideAll() {
        dismiss(loginSection)
        dismiss(waitingRoomSection)
        dismiss(gameSection)
        dismiss(errorPage)
        dismiss(resultSection)
        dismiss(scoreSection)
    }

    /**
     * Create input on game
     * @param {Array[word]} wordList 
     * @param {*} actualLetter 
     */
    function generateInput(wordList, actualLetter) {
        var inputList = []
        for(let word of wordList) {
            let div = _('div', gameContent, null, null, "answerContent")
            _('h3', div, word)
            let input = _('input', div)
            input.type = "text"
            input.placeholder = actualLetter + " ..."
            inputList.push(input)
        }
        inputList[0].focus()
        inputList[0].addEventListener("keyup", function(event) {
            if (event.keyCode === 13) {
                inputList[1].focus()
            }
        });

        // Stop button
        let stop = _('button', gameContent, "STOP")

        stop.addEventListener('click', () => {
            socket.emit('stopAllPlayer', null)
        })

        socket.on('stopRound', (data) => {
            stop.disabled = true;
        })

        // Change input when press enter
        for(let i = 0; i<inputList.length; i++) {
            inputList[i].addEventListener('focus', (event) => {
                console.log('focus')
                inputList[i].addEventListener("keyup", function(event) {
                    if (event.keyCode === 13 ) {
                        if(i == inputList.length - 1) {
                            inputList[0].focus()
                        } else {
                            inputList[i+1].focus()
                        }
                    }
                });
            });
        }
    }

    /**
     * Show section
     * @param {Section} section 
     */
    function show(section) {
        section.classList.remove('none')
    }

    /**
     * Hide section
     * @param {Section} section 
     */
    function dismiss(section) {
        section.classList.add('none')
    }

    /**
     * Display error
     * @param {String} error 
     */
    function showError(error) {
        hideAll()
        errorPage.querySelector('h1').innerHTML = error
        show(errorPage)
    }

    /**
     * Add new word to word list
     * @param {New word} value 
     */
    function addNewWord(value) {
        if(value != "") {
            socket.emit('addNewWord', value)
            value = ""
        }
    }

})

function _(tag, parent, text=null,  id=null, classs=null) {
	let element = document.createElement(tag)
	if (text)
		element.appendChild(document.createTextNode(text))
	parent.appendChild(element)
	if (id)
		element.id = id
	if (classs)
		element.classList.add(classs)
	return element
}