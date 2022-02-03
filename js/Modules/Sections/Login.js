class SectionLogin {
    constructor(game) {
        this.game = game
        this.sectionObj = this.create()
        this.section = this.sectionObj.elem
    }

    create() {

        let section = new Section(
            new Center(
                new LayoutVertical(
                    [
                        new H1(this.game.name),
                        new Input({
                            "placeholder": "Pseudo ...",
                            "id": "login_pseudo",
                            "type": "text"
                        }),
                        new Button("Créer une partie", {
                            "id": "createRoom"
                        })
                    ]
                ), true, true, {
                    "class": "w40"
                }
            ), {
                "height": "full",
                "width": "full",
                "class": "none login"
            }
        )

        document.body.appendChild(section.elem)

        return section
    }

    update() {}

    /**
     * Init login page
     */
    init() {
        var input = this.sectionObj.Center.LayoutVertical.Input.elem
        var button = this.sectionObj.Center.LayoutVertical.Button.elem

        input.addEventListener('keyup', (event) => {
            if (input.value != "") {
                button.disabled = false;

                if (event.keyCode === 13) {
                    this.game.emit("createRoom", { pseudo: input.value })
                }

            } else {
                button.disabled = true;
            }
        })

        button.addEventListener('click', () => {
            this.game.emit("createRoom", { pseudo: input.value })
        })

        this.game.on('roomCreated', (data) => {
            this.game.room = data.room
            this.game.emit("getData", null)
        })
    }
}