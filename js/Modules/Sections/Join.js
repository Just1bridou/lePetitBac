class SectionJoin {
    constructor(game) {
        this.game = game
        this.sectionObj = this.create()
        this.section = this.sectionObj.elem
    }

    create() {

        let section = new Section(
            new Section(
                new LayoutVertical(
                    [
                        new H3("Rejoindre une partie"),
                        new LayoutVertical([
                            new Input({ "placeholder": "Pseudo", "type": "text" }),
                            new Button("REJOINDRE", { "disabled": true })
                        ], { "class": "modalContentInput" })
                    ], { "align": "center" }
                ), { "class": "modalNewPlayer" }
            ), { "class": "modelHide height_full width_full" }
        )

        document.body.appendChild(section.elem)

        return section
    }

    update() {}

    /**
     * Init join page
     */
    init() {
        let pseudo = this.sectionObj.Section.LayoutVertical.LayoutVertical.Input
        let button = this.sectionObj.Section.LayoutVertical.LayoutVertical.Button

        pseudo.onKeyup((event) => {
            if (pseudo.elem.value != "") {
                button.disabled(false);
            } else {
                button.disabled(true);
            }
        })

        pseudo.onKeyup((event) => {
            if (pseudo.elem.value != "") {
                button.disabled(false);

                if (event.keyCode === 13) {
                    this.game.emit("newPlayer", { "pseudo": pseudo.elem.value, "code": this.game.code })
                }

            } else {
                button.disabled(true);
            }
        })

        button.onClick(() => {
            this.game.emit("newPlayer", { "pseudo": pseudo.elem.value, "code": this.game.code })
        })
    }
}