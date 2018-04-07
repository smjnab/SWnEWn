
const { JPixi } = require("./lib/jpixi");
const { BaseObjectColl, ColliderTypes } = require("./baseobject");
const { staticObj } = require("./config");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// STATIC OBJECT EXTENSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class StaticObject extends BaseObjectColl {
    /**
     * 
     * @param {string} resourcePath path to image file to use as sprite.
     * @param {Number} posX postition X in world container.
     * @param {Number} posY postition Y in world container.
     * @param {Number} width width of sprite.
     * @param {Number} height height of sprite.
     * @param {World} world what world this object is in.
     */
    constructor(resourcePath, world, posX, posY, width, height, centerAnchor = false) {
        if (!centerAnchor) super(world, posX, posY, width, height, ColliderTypes.Box);
        else super(world, posX, posY, width, height, ColliderTypes.BoxCentered);
        this.world.grid.AddStaticToCell(this);

        this.sprite = JPixi.Sprite.Create(resourcePath, this.prop.x, this.prop.y, this.prop.width, this.prop.height, world.layerMiddle, centerAnchor);
    }

    Update(cell) {
        if (cell.FramesBetweenUpdates(staticObj.collisionUpdateRate)) {
            var player = cell.player[0];
            if (player != undefined && this.world.CollideBoxCircle(this.collider, player.collider)) this.CollisionPlayer(player);

            for (var i = cell.friends.length - 1; i > -1; i--) {
                var friend = cell.friends[i];

                if (this.world.CollideBoxCircle(this.collider, friend.collider)) this.CollisionFriend(friend);
            }

            for (var i = cell.foes.length - 1; i > -1; i--) {
                var foe = cell.foes[i];

                if (this.world.CollideBoxCircle(this.collider, foe.collider)) this.CollisionFoe(foe);
            }
        }
    }

    CollisionPlayer(player) {

        this.OnCollision(player);
    }
    CollisionFriend(friend) {
        this.OnCollision(friend);
    }
    CollisionFoe(foe) {
        this.OnCollision(foe);
    }
    OnCollision(other) {
        if (this.world.collInfo.overlapN.x != 0) {
            other.target.direction.x = 0;
            other.prop.x += this.world.collInfo.overlapV.x * 1.1;
        }

        if (this.world.collInfo.overlapN.y != 0) {
            other.target.direction.y = 0;
            other.prop.y += this.world.collInfo.overlapV.y * 1.1;
        }
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TILING STATIC OBJECT EXTENSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class StaticTiledObject extends BaseObjectColl {
    /**
     * 
     * @param {string} resourcePath path to image file to use as sprite.
     * @param {Number} posX postition X in world container.
     * @param {Number} posY postition Y in world container.
     * @param {Number} width width of sprite.
     * @param {Number} height height of sprite.
     * @param {World} world what world this object is in.
     */
    constructor(resourcePath, world, posX, posY, width, height, centerAnchor = false) {
        if (!centerAnchor) super(world, posX, posY, width, height, ColliderTypes.Box);
        else super(world, posX, posY, width, height, ColliderTypes.BoxCentered);
        this.world.grid.AddStaticToCell(this);

        this.sprite = JPixi.Sprite.CreateTiling(resourcePath, this.prop.x, this.prop.y, this.prop.width, this.prop.height, world.layerMiddle, centerAnchor);
    }

    Update(cell) {
        if (cell.FramesBetweenUpdates(staticObj.collisionUpdateRate)) {
            var player = cell.player[0];
            if (player != undefined && this.world.CollideBoxCircle(this.collider, player.collider)) this.CollisionPlayer(player);

            for (var i = cell.friends.length - 1; i > -1; i--) {
                var friend = cell.friends[i];

                if (this.world.CollideBoxCircle(this.collider, friend.collider)) this.CollisionFriend(friend);
            }

            for (var i = cell.foes.length - 1; i > -1; i--) {
                var foe = cell.foes[i];

                if (this.world.CollideBoxCircle(this.collider, foe.collider)) this.CollisionFoe(foe);
            }
        }
    }

    CollisionPlayer(player) {
        this.OnCollision(player);
    }
    CollisionFriend(friend) {
        this.OnCollision(friend);
    }
    CollisionFoe(foe) {
        this.OnCollision(foe);
    }
    OnCollision(other) {
        if (this.world.collInfo.overlapN.x != 0) {
            other.target.direction.x = 0;
            other.prop.x += this.world.collInfo.overlapV.x;
        }

        if (this.world.collInfo.overlapN.y != 0) {
            other.target.direction.y = 0;
            other.prop.y += this.world.collInfo.overlapV.y;
        }
    }
}


///////////////////////////////////////////////////////////////////////////////
// MODULE EXPORT
///////////////////////////////////////////////////////////////////////////////

module.exports = {
    StaticObject,
    StaticTiledObject
}