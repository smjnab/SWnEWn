
const { JPixi } = require("./lib/jpixi");
const { BaseObjectColl, ColliderTypes } = require("./baseobject");


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
}


///////////////////////////////////////////////////////////////////////////////
// MODULE EXPORT
///////////////////////////////////////////////////////////////////////////////

module.exports = {
    StaticObject,
    StaticTiledObject
}