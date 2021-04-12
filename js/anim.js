document.addEventListener('DOMContentLoaded', () => {
    var tabGameButton = document.querySelector('.titleGame')
    var tabConfButton = document.querySelector('.titleConf')

    var tabGame = document.querySelector('.borderContainerTab')
    var tabConf = document.querySelector('.borderContainerTabConf')

    tabGameButton.addEventListener('click', () => {
        tabGame.classList.remove('none')
        tabConf.classList.add('none')

        tabGameButton.classList.remove('darkGreenTabs')
        tabConfButton.classList.add('darkBlueTabs')
    })

    tabConfButton.addEventListener('click', () => {
        tabConf.classList.remove('none')
        tabGame.classList.add('none')

        tabConfButton.classList.remove('darkBlueTabs')
        tabGameButton.classList.add('darkGreenTabs')
    })
})