document.addEventListener('DOMContentLoaded', () => {

    const socket = io()

    var loginInput = document.querySelector('#login_pseudo')
    var createRoom = document.querySelector('#createRoom')

    var player = {}

    loginInput.addEventListener('keyup', (event) => {
        if(loginInput.value != "") {
            createRoom.disabled = false;
        } else {
            createRoom.disabled = true;
        }
    })

    createRoom.addEventListener('click', () => {
        socket.emit("createRoom", { pseudo : loginInput.value})
    })

    socket.on('redirectRoom', (data) => {

        console.log(data)

        sessionStorage.setItem('uuidPlayer', data.uuidPlayer);
        window.location.href = "/r/" + data.code
    })
})