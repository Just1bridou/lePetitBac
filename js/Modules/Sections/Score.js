class SectionScore {
    constructor(game, sub) {
        this.game = game
        this.sub = sub
        this.sectionObj = this.create()
        this.section = this.sectionObj.elem
    }

    create() {

        let section = new LayoutVertical(
            [
                new Container(null, { "class": "scoreBackground" }),
                new H1("Fin de la partie"),
                new Container(null, { "class": "replayDiv" }),
                new Container(null, { "class": "top" }),
            ], { "id": "score", "class": "none" }
        )

        document.body.appendChild(section.elem)

        return section
    }

    update() {}

    init() {}

    displayScore(room) {
        var replayDiv = this.sectionObj.select('.replayDiv')
        var top = this.sectionObj.select('.top')

        replayDiv.elem.innerHTML = ""
        top.elem.innerHTML = ""

        room.playersList.sort(function(a, b) {
            return b.score - a.score;
        });

        let replayButton = new Button("REJOUER", { "class": "replayButton" })
        replayDiv.appendChild(replayButton)

        replayButton.onClick(() => {
            this.game.emit('replayGame', null)
        })

        let posScore = 0;
        for (let player of room.playersList) {

            if (player.disconnect) {
                break;
            }

            if (posScore == 0)
                this.createPlayerResultDiv(player, "gold", 1)
            if (posScore == 1)
                this.createPlayerResultDiv(player, "silver", 2)
            if (posScore == 2)
                this.createPlayerResultDiv(player, "copper", 3)
            if (posScore >= 3)
                this.createPlayerResultDiv(player, "other", posScore + 1)

            posScore++
        }
    }

    createPlayerResultDiv(player, rank, nb) {
        var top = this.sectionObj.select('.top')

        let div = new Container(null, { "class": rank })
        let hash = new Container(new Span("#" + nb), { "class": "rank" })
        let pseudo = new Container(new Span(player.pseudo), { "class": "topPseudo" })
        let pos = new Container(new Span(Math.round(player.score) + " PTS."), { "class": "topScore" })

        top.appendChild(div)
        div.appendChild(hash)
        div.appendChild(pseudo)
        div.appendChild(pos)
    }
}