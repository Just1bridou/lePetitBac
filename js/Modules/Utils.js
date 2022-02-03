/**
 * Scroll to top
 */
 function scrollTop() {
    window.scrollTo(0, 0)
}

function _(tag, parent, text=null,  id=null, classs=null) {
	let element = document.createElement(tag)
	if (text)
		element.appendChild(document.createTextNode(text))
	if(parent)
		parent.appendChild(element)
	if (id)
		element.id = id
	if (classs)
		element.classList.add(classs)
	return element
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}