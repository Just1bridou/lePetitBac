document.addEventListener('DOMContentLoaded', ()=> {

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
      // window.location.href = "/r/" + data.code
    })

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