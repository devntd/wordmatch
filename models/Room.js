/**
 * Created by dung on 1/6/2015.
 */
function Room(id, playerNumber) {
    this.id = id;
    this.playerNumber = playerNumber;
    this.players = [];
    this.playersInRoom = 1;
    this.status = "waiting";
}

Room.prototype.addPlayer = function (playerID) {
    if (this.status === "waiting") {
        this.players.push(playerID);
    }
};
Room.prototype.getPlayer = function (playerID) {

};
Room.prototype.removePlayer = function (playerID) {

};

module.exports = Room;