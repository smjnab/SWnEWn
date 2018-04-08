
const { JPixi } = require("./lib/jpixi");
const { BaseObjectColl, ColliderTypes } = require("./baseobject");
const { item } = require("./config");


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ITEM OBJECT EXTENSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Item extends BaseObjectColl {
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
        this.world.grid.AddItemToCell(this);

        this.sprite = JPixi.Sprite.Create(resourcePath, this.prop.x, this.prop.y, this.prop.width, this.prop.height, this.world.layerBottomDecals, centerAnchor);
    }

    Destroy() {
        this.world.layerBottomDecals.removeChild(this.sprite);

        this.collider = undefined;
        this.prop = undefined;
        this.sprite = undefined;

        this.Publish("OnDestroyed");
        this.eventTopics = [];
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PSY OBJECT EXTENSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Psy extends Item {
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
        super(resourcePath, world, posX, posY, width, height, centerAnchor);
    }

    Update(cell) {
        if (cell.FramesBetweenUpdates(item.interactUpdateRate)) {
            var player = cell.player[0];

            if (player != undefined && this.world.CollideBoxCircle(this.collider, player.collider)) this.CollisionPlayer();
        }
    }

    CollisionPlayer() {
        this.sprite.tint = 0x0000FF * Math.random();
        this.sprite.alpha = 1;
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// STAR OBJECT EXTENSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Star extends Item {
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
        super(resourcePath, world, posX, posY, width, height, centerAnchor);

        this.sprite.tint = 0xAADDFF;
    }

    Update(cell) {
        if (cell.FramesBetweenUpdates(item.interactUpdateRate)) {
            var player = cell.player[0];
            if (player != undefined && this.world.CollideBoxCircle(this.collider, player.collider)) this.CollisionPlayer(player);
        }
    }

    CollisionPlayer(player) {
        this.Destroy();
        player.UpdateScore(1);
        player.AddFriend();
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// POWER UP OUT OF PHASE OBJECT EXTENSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class PowerUp extends Item {
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
        super(resourcePath, world, posX, posY, width, height, centerAnchor);
    }

    Update(cell) {
        if (cell.FramesBetweenUpdates(item.interactUpdateRate)) {
            var player = cell.player[0];
            if (player != undefined && this.world.CollideBoxCircle(this.collider, player.collider)) this.CollisionPlayer(player);
        }
    }

    CollisionPlayer(player) {
        player.UpdateScore(10);
        this.Destroy();
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// POWER UP OUT OF PHASE OBJECT EXTENSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class PUOutOfPhase extends PowerUp {
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
        super(resourcePath, world, posX, posY, width, height, centerAnchor);

        this.sprite.tint = 0xFF00FF;
    }

    CollisionPlayer(player) {
        super.CollisionPlayer(player);
        player.PUOutOfPhase();
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// POWER UP REPEL OBJECT EXTENSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class PURepel extends PowerUp {
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
        super(resourcePath, world, posX, posY, width, height, centerAnchor);

        this.sprite.tint = 0xFFFF00;
    }

    CollisionPlayer(player) {
        super.CollisionPlayer(player);
        player.PURepel();
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// POWER UP FREEZE OBJECT EXTENSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class PUFreeze extends PowerUp {
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
        super(resourcePath, world, posX, posY, width, height, centerAnchor);

        this.sprite.tint = 0x00FF2F;
    }

    CollisionPlayer(player) {
        super.CollisionPlayer(player);
        player.PUFreeze();
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// POWER UP MUNCH OBJECT EXTENSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class PUMunch extends PowerUp {
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
        super(resourcePath, world, posX, posY, width, height, centerAnchor);

        this.sprite.tint = 0xAF2F2F;
    }

    CollisionPlayer(player) {
        super.CollisionPlayer(player);
        player.PUMunch();
    }
}


///////////////////////////////////////////////////////////////////////////////
// MODULE EXPORT
///////////////////////////////////////////////////////////////////////////////

module.exports = {
    Item,
    Psy,
    Star,
    PUOutOfPhase,
    PURepel,
    PUFreeze,
    PUMunch
}