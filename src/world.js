const { JPixi } = require("./lib/jpixi");
const { appConf } = require("./lib/jpixi_config");
const { Camera } = require("./camera");
const SAT = require("sat");
const { Grid } = require("./grid");
const { BaseObject, BaseObjectColl, Prop } = require("./baseobject");
const { world } = require("./config");


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EASIER ACCESS TO PHYSICS POSITION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Set position.
 * @extends {SAT.Box}
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 */
SAT.Box.prototype.Position = function (x, y, width = 0, height = 0) {
    this.pos.x = x;
    this.pos.y = y;
};

/**
 * Set position.
 * @extends {SAT.Polygon}
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 */
SAT.Polygon.prototype.Position = function (x, y, width = 0, height = 0) {
    this.pos.x = x;
    this.pos.y = y;
};

/**
 * Set position.
 * @extends {SAT.Circle}
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} height
 */
SAT.Circle.prototype.Position = function (x, y, width = 0, height = 0) {
    this.pos.x = x;
    this.pos.y = y;
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LIMIT ENUM
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const LimitTypes = {
    Top: 0,
    Right: 1,
    Bottom: 2,
    Left: 3,
    None: 4
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WORLD CLASS
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class World {
    constructor() {
        this.container = JPixi.Container.Create(appConf.worldWidth, appConf.worldHeight, -appConf.cameraWidth / 2, -appConf.cameraHeight / 2);
        this.camera = new Camera(this);
        this.grid = new Grid(world.cellCount, this);
        this.collInfo = new SAT.Response();
        this.vA = new SAT.Vector();
        this.vB = new SAT.Vector();

        this.delta = 1;
        this.count = 0;

        this.layerBottom = JPixi.Container.Create(appConf.worldWidth, appConf.worldHeight, 0, 0, this.container);
        this.layerBottomDecals = JPixi.Container.Create(appConf.worldWidth, appConf.worldHeight, 0, 0, this.container);
        this.layerMiddle = JPixi.Container.Create(appConf.worldWidth, appConf.worldHeight, 0, 0, this.container);
        this.layerPlayer = JPixi.Container.Create(appConf.worldWidth, appConf.worldHeight, 0, 0, this.container);
        this.layerTop = JPixi.Container.Create(appConf.worldWidth, appConf.worldHeight, 0, 0, this.container);
        this.layerTopDecals = JPixi.Container.Create(appConf.worldWidth, appConf.worldHeight, 0, 0, this.container);

        this.container.setChildIndex(this.grid.container, 0);
        this.container.setChildIndex(this.layerBottom, 1);
        this.container.setChildIndex(this.layerBottomDecals, 2);
        this.container.setChildIndex(this.layerMiddle, 3);
        this.container.setChildIndex(this.layerPlayer, 4);
        this.container.setChildIndex(this.layerTop, 5);
        this.container.setChildIndex(this.layerTopDecals, 6);
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // PHYSICS
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Create a SAT Box Collider.
     * 
     * @param {Prop} prop
     */
    CreateBox(prop, centerAnchor = false) {
        var collider = new SAT.Box(new SAT.Vector(prop.x, prop.y), prop.width, prop.height).toPolygon();
        if (centerAnchor) collider.setOffset(new SAT.Vector(-prop.width / 2, -prop.height / 2));

        return collider;
    }

    /**
     * Create a SAT Circle Collider.
     * 
     * @param {Prop} prop
     */
    CreateCircle(prop) {
        return new SAT.Circle(new SAT.Vector(prop.x, prop.y), prop.width / 2);
    }

    /**
     * 
     * @param {SAT.Polygon} colliderA
     * @param {SAT.Circle} colliderB
     */
    CollideBoxCircle(colliderA, colliderB) {
        if (colliderA == undefined || colliderB == undefined) return false;

        this.collInfo.clear();
        var collision = SAT.testPolygonCircle(colliderA, colliderB, this.collInfo);

        return collision;
    }

    /**
     * 
     * @param {SAT.Polygon} colliderA
     * @param {SAT.Polygon} colliderB
     */
    CollideBoxBox(colliderA, colliderB) {
        if (colliderA == undefined || colliderB == undefined) return false;

        this.collInfo.clear();
        var collision = SAT.testPolygonPolygon(colliderA, colliderB, this.collInfo);

        return collision;
    }

    /**
     * 
     * @param {SAT.Circle} colliderA
     * @param {SAT.Circle} colliderB
     */
    CollideCircleCircle(colliderA, colliderB) {
        if (colliderA == undefined || colliderB == undefined) return false;

        this.collInfo.clear();
        var collision = SAT.testCircleCircle(colliderA, colliderB, this.collInfo);

        return collision;
    }

    /**
     * 
     * @param {Prop} propA
     * @param {Prop} propB
     */
    Direction(propA, propB) {
        this.UpdateVAVB(propA, propB);
        return this.vB.sub(this.vA).normalize().clone();
    }

    /**
     * 
     * @param {Prop} propA
     * @param {Prop} propB
     */
    DirectionAndMagnitude(propA, propB) {
        return {
            direction: this.Direction(propA, propB),
            magnitude: this.Magnitude(propA, propB)
        };
    }

    /**
     * 
     * @param {Prop} propA
     * @param {Prop} propB
     */
    DirectionAndMagnitudeSqr(propA, propB) {
        return {
            direction: this.Direction(propA, propB),
            magnitude: this.MagnitudeSqr(propA, propB)
        };
    }

    /**
    * 
    * @param {Prop} propA
    * @param {Prop} propB
    */
    Magnitude(propA, propB) {
        this.UpdateVAVB(propA, propB);
        return this.vA.sub(this.vB).len();
    }

    /**
    * 
    * @param {Prop} propA
    * @param {Prop} propB
    */
    MagnitudeSqr(propA, propB) {
        this.UpdateVAVB(propA, propB);
        return this.vA.sub(this.vB).len2();
    }

    /**
     * 
     * @param {Prop} propA normalized
     * @param {Prop} propB normalized
     */
    Dot(propA, propB) {
        this.UpdateVAVB(propA, propB);

        return this.vA.dot(this.vB);
    }

    /**
     * Update vA and vB values.
     * 
     * @param {Prop} propA
     * @param {Prop} propB
     */
    UpdateVAVB(propA, propB) {
        if (propA == undefined || propB == undefined) {
            this.vA.x = 0;
            this.vA.y = 0;
            this.vB.x = 0;
            this.vB.y = 0;
            return;
        }

        this.vA.x = propA.x;
        this.vA.y = propA.y;
        this.vB.x = propB.x;
        this.vB.y = propB.y;
    }

    /**
     * 
     * @param {BaseObjectColl} baseObjectCollA
     * @param {BaseObjectColl[]} baseObjectsCollB
     */
    Closest(baseObjectCollA, baseObjectsCollB) {
        var baseObjectCollB;
        var shortest;
        var found = false;

        for (var i = 0; i < baseObjectsCollB.length; i++) {
            var gameObject = baseObjectsCollB[i];
            var magSqr = this.MagnitudeSqr(baseObjectCollA.prop, gameObject.prop);

            if (magSqr != 0 && (magSqr < shortest || shortest === undefined)) {
                baseObjectCollB = gameObject;
                shortest = magSqr;
                found = true;
            }
        }

        return { found: found, object: baseObjectCollB, distance: shortest };
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // WORLD UPDATE
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    Update(delta) {
        this.count++;
        if (this.count > 3600) this.count = 1;

        this.delta = delta;
        this.grid.Update();
        this.camera.Update();
    }


    /**
     * Check for world boundaries. Important to not use world.container as boundary constantly updates when camera moves.
     * 
     * @param {PIXI} objectToCheck PIXI object with x,y,width and height.
     */
    Limits(objectToCheck) {
        if (objectToCheck.y < 1) return LimitTypes.Top;
        else if (objectToCheck.y + objectToCheck.height >= appConf.worldHeight) return LimitTypes.Bottom;

        if (objectToCheck.x + objectToCheck.width >= appConf.worldWidth) return LimitTypes.Right;
        else if (objectToCheck.x < 1) return LimitTypes.Left;

        return LimitTypes.None;
    }
}


///////////////////////////////////////////////////////////////////////////////
// MODULE EXPORT
///////////////////////////////////////////////////////////////////////////////

module.exports = {
    World,
    LimitTypes
}