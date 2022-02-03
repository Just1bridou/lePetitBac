class PlaylistManager {
    constructor(game) {
        this.modaleManager = new ModaleManager()
        this.game = game
    }

    getAllPlaylists(cb, limit = 10) {
        this.game.emit("getAllPlaylists", limit)
        this.game.on("getAllPlaylists", data => {
            cb(data)
        })
    }

    searchNewPlaylist(url, cb) {
        this.game.emit("searchNewPlaylist", url)
        this.game.on("searchNewPlaylist", data => {
            cb(data)
        })
    }

    addPlaylist(url, cb) {
        this.game.emit("addPlaylist", url)
        this.game.on("addPlaylist", data => {
            cb(data)
        })
    }

    playlistResults(res) {
        
        console.log(res)
        if(res.playlist.length > 0) {

            let playlistsContent = _('ul', null, null, null, 'list_content')

            for(let playlist of res.playlist) {
                let content = _('div', playlistsContent, null, null, 'list_contentPlaylist')
                _('span', content, playlist.name)
                _('span', content, " (" + playlist.songs.length + " songs)")

                content.addEventListener("click", () => {
                    // TODO: Change room playlist to playlist with id (emit event)
                    console.log("Change room playlist to: ", playlist.id)
                })
            }

            this.modaleManager.newModale({
                title: "Playlist",
                description: playlistsContent,
                closeButton: true
            })

        } else {
            let playlistsContent = _('div')
            _('div', playlistsContent, "No playlist found")

            let button = _('button', playlistsContent, "Add playlist", null, "button_addNewPlaylist")
            
            let form = _('div', null, null, null, "form_newPlaylist")
            let form_input = _('input', form)
            let form_button = _('button', form, "Ajouter")
            form_input.value = res.url
            form_button.addEventListener('click', () => {
                console.log("Add new playlist: ", res.url)
            })

            button.addEventListener('click', () => {
                this.modaleManager.newModale({
                    title: "Add new playlist",
                    description: form,
                    closeButton: true
                })
            })

            this.modaleManager.newModale({
                title: "Playlist",
                description: playlistsContent,
                closeButton: true
            })
        }
    }
}