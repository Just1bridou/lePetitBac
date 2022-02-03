/**
 * RoomManager class
 */
class RoomManager {
    constructor() {
        this.rooms = []
    }

    /**
     * Get room from code
     * @param {RoomCode} code 
     * @returns room
     */
    getRoom(code) {
        for (let room of this.rooms) {
            if (room.code == code) {
                return room
            }
        }
    }

    /**
     * Add new room to rooms
     * @param {Room} room 
     */
    addRoom(room) {
        this.rooms.push(room)
    }

    /**
     * 
     * @param {Room} roomDel 
     * Remove room from roomsList
     */
    deleteRoom(room) {
        for (var i = 0; i < this.rooms.length; i++) {
            if (this.rooms[i].code == room.code) {
                let index = this.rooms.indexOf(this.rooms[i]);
                if (index > -1) {
                    this.rooms.splice(index, 1);
                }
            }
        }
    }

    /**
     * 
     * @param {code} code 
     * @param {Callback} success 
     * @param {Callback} error 
     */
    roomExist(code, success, error = null) {
        let room = this.getRoom(code)
        if (room) {
            success(room)
        } else {
            if (error)
                error()
        }
    }
}

module.exports = RoomManager;