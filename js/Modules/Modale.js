class ModaleManager {
    constructor() {
        this.modale = null
    }

    newModale(params) {
        this.tearDown()
        let bgModale = _('div', document.body, null, null, 'modale_background')
        this.modale = bgModale
        let modaleContent = _('div', bgModale, null, null, "modale_content")

        if(params.title) {
            _('h3', modaleContent, params.title, null, "modale_title")
        }

        if(params.description) {
            if(typeof(params.description) == "string") {
                _('p', modaleContent, params.description, null, "modale_description")
            } else {
                modaleContent.appendChild(params.description)
            }
        }

        if(params.closeButton) {
            let closeButton = _('div', modaleContent, "X", null, "modale_closeButton")
            closeButton.addEventListener('click', () => {
                this.tearDown()
            })
        }

        if(params.closeAfter) {
            setTimeout(() => {
                modaleContent.classList.remove('modale_up')
                setTimeout(() => {
                    this.tearDown()
                }, 500)
            }, params.closeAfter) 
        }

        setTimeout(() => {
            modaleContent.classList.add('modale_up')
        }, 50)
    }

    tearDown() {
        if(this.modale) {
            this.modale.remove()
        }
    }
}