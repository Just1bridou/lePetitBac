class Progress {
    constructor(elem) {
        this.main = elem
        this.progress = null
        this.nbContainer = null
        this.nb = 0
        this.init(elem)

    }

    init(elem) {
        elem.classList.add('pg_main')
        let progress = _('section', elem, null, null, "pg_progress")
        this.progress = progress
        
        let nbContainer = _('h3', elem, null, null, "pg_nbContainer")
        this.nbContainer = nbContainer
    }

    update(nb) {
        this.progress.style.width = nb + "%"
        this.nbContainer.innerHTML = nb + "%"
    }

    remove() {
        this.main.remove()
    }
}