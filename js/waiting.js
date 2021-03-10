document.addEventListener('DOMContentLoaded', () => {

    const socket = io()
    
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

    // Errors
    var errorPage = document.querySelector('#error')

    if(sessionStorage.getItem('uuid')) {
        console.log('was a refresh')
    } else {
        console.log('its new player')
    }

    initLogin()

    if(room) {
        socket.emit('checkRoomExist', room)
    } else {
        show(loginSection)
    }

    socket.on('roomExist', (data) => {
        newModalConnect()
    })

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
        } 
    })

    function showError(error) {
        hideAll()
        errorPage.querySelector('h1').innerHTML = error
        show(errorPage)
    }

    socket.on('serverError', (data) => {
        hideAll()
    })

    socket.on('saveUUID', (uuid) => {
        sessionStorage.setItem('uuid', uuid);
    })

    socket.on('dataSender', (data) => {
        refreshPlayerList(data.playerList, waitingPlayerList)
        initWaitingRoom()
        dismiss(loginSection)
        show(waitingRoomSection)
    })

    socket.on('wordList', (data) => {
        if(data)
        refreshWordList(data.wordList)
    })

    socket.on("gameSettings", (wordList) => {

        let cb = document.querySelector('.settingsControls')
        if(cb) {
            cb.remove()
        }

        refreshWordList(wordList, true)

        let controlBox = _('div', gameSettings, null, null, "settingsControls")
        let inputNewWord = _('input', controlBox)
        inputNewWord.placeholder = "Ajouter un mot ..."
        let addWordButton = _('button', controlBox, "Ajouter")
        addWordButton.disabled = true

        inputNewWord.focus()

        inputNewWord.addEventListener("keyup", function(event) {
            if (event.keyCode === 13 ) {
                sendData(inputNewWord.value)
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
            sendData(inputNewWord.value)
        })
    })

    function sendData(value) {
        if(value != "") {
            socket.emit('addNewWord', value)
            value = ""
        }
    }

    socket.on('refreshList', (list) => {
        waitingPlayerList.innerHTML = ""
        refreshPlayerList(list, waitingPlayerList)
    })

    socket.on('gameStarting', (game) => {
        ready_button.disabled = true
        console.log("GAME STARTING")

        let hideDiv = _('div', body, null, null, 'hideDiv')
        let countDiv = _('div', body, null, null, 'countDiv')
        hideDiv.classList.add('completeWidth')
        var counter = 6;
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

    function transitionRound(toDismiss, toShow, data) {
        let hideDiv = _('div', body, null, null, 'hideDiv')
        setTimeout(() => {
            resetAllCat()
            createGame(data)
            dismiss(toDismiss)
            show(toShow)
            scrollTop()
            hideDiv.style.animation = 'reverseFullWidth 1s forwards'
            setTimeout(() => {
                hideDiv.remove()
            }, 1500)
        }, 2100)
    }

    function scrollTop() {
        window.scrollTo(0, 0)
    }

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

    function initWaitingRoom() {
        for(let title of waitingTitle) {
            title.innerHTML = title.innerHTML + "PARTIE <span class='tonalite'>#</span>" + room
        }
        link.value = window.location + 'r/' + room
    
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
    
        ready_button.addEventListener('click', () => {
            ready_button.classList.toggle('ready_click')
            socket.emit("switchState", null)
        })
    }

    function refreshPlayerList(playerList, elem) {
        for(let nb of waitingNumbers) {
            nb.innerHTML = playerList.length + " JOUEUR(S)"
        }
        for(player of playerList) {
            let playerLi = createPlayerDiv(player.pseudo, elem)
            if(!player.ready) {
                playerLi.classList.add("unready")
            } else {
                playerLi.classList.remove("unready")
            }
        }
    }

    function createPlayerDiv(pseudo, elem) {
        let div = _('div', elem, null, null, 'playerDivContent')
        let h2 = _("h2", div, pseudo)

        return div
    }

    function refreshWordList(wordList, isAdmin = false) {
        words_div.innerHTML = ""

     //   words_div.classList.add('loadingWords')
      //  settingsControls.classList.add('loadingWords')

        for(let word of wordList) {
            let wordContainer = _('div', words_div, null, null, "wordContainer")
            _("div", wordContainer, word, null, "wordPartie")

            if(isAdmin) {
                //let remove = _('div', wordContainer, 'X', null, "removeButton")
                wordContainer.classList.add('adminClassRemove')

                wordContainer.addEventListener('click', () => {
                    socket.emit('removeWord', word)
                })
            }
        }

        words_div.scrollTop = words_div.scrollHeight;

       // words_div.classList.remove('loadingWords')
      //  settingsControls.classList.remove('loadingWords')

    }

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

        button.addEventListener('click', () => {
            socket.emit("newPlayer", {"pseudo": pseudo.value, "room": room})
        })

        socket.on('removeModal', () => {
            hiden.remove()
            initWaitingRoom()
            show(waitingRoomSection)
        })
    }

    function createGame(game) {
       // refreshPlayerList(game.playerList, gameSection.querySelector('#player_list'))
       
        for(let wr of waitingRound) {
            wr.innerHTML = "Manche " + game.actualRound + '/' + game.maxRound
        }

        for(let ld of letterDisplay) {
            ld.innerHTML = game.actualLetter
        }

        generateInput(game.wordList, game.actualLetter)
    }

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
                _("div", tr, input.value)

                let userDivContent = _("div", tr)
                let userDiv = _("div", userDivContent, null, null, 'userCase')

                userDiv.addEventListener('click', () => {
                    userDiv.classList.toggle('falseCase')
                    socket.emit('editUserCase', {
                        'uuid': player.uuid,
                        'input': input
                    } )
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
        })

        nextRoundSetup(room.playerList)

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

            nextRoundSetup(data)
        })

    })

    function nextRoundSetup(playerList) {
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

    socket.on('nextRound', (data) => {
        transitionRound(resultSection, gameSection, data)
    })

    socket.on('endResults', (room) => {
        room.playerList.sort(function(a, b){
            return b.score - a.score;
        });

        for(let i=0; i<room.playerList.length; i++) {

            if(i==0)
            createDiv(room.playerList[0], "gold", 1)
            if(i==1)
            createDiv(room.playerList[1], "silver", 2)
            if(i==2)
            createDiv(room.playerList[2], "copper", 3)
            if(i>=3)
            createDiv(room.playerList[i], "other", 0)

        }
        hideAll()
        show(scoreSection)
    })

    function createDiv(player, rank, nb) {
        let div = _('div', top, null, null, rank)
        _('div', div, '#' + nb, null, "rank")
        _('div', div, player.pseudo, null, 'topPseudo')
        console.log(player.score)
        _('div', div, player.score + "", null, 'topScore')
    }

    function resetAllCat() {
        // reset waiting

        // reset game
        gameContent.innerHTML = ""
        waitingPlayerList.innerHTML = ""
        //gamePlayerList.innerHTML = ""

        // reset results
        resultContent.innerHTML = ""
        playerNextRound.innerHTML = ""

    }

    function hideAll() {
        dismiss(loginSection)
        dismiss(waitingRoomSection)
        dismiss(gameSection)
        dismiss(errorPage)
        dismiss(resultSection)
        dismiss(scoreSection)
    }

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

    function show(section) {
        section.classList.remove('none')
    }

    function dismiss(section) {
        section.classList.add('none')
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