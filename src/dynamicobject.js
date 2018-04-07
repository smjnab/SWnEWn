const { JPixi } = require("./lib/jpixi");
const { appConf } = require("./lib/jpixi_config");
const { World, LimitTypes } = require("./world");
const { BaseObject, BaseObjectColl, ColliderTypes, Prop, DynamicTypes } = require("./baseobject");
const { StaticObject } = require("./staticobject");
const { Grid, Cell } = require("./grid");
const { ai, player } = require("./config");
const SAT = require("sat");
const { Target } = require("./target");


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DYNAMIC OBJECT CLASS
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class DynamicObject extends BaseObjectColl {
    /**
     * 
     * @param {string} resourcePath path to image file to use as sprite.
     * @param {Number} posX postition X in world container.
     * @param {Number} posY postition Y in world container.
     * @param {Number} width width of sprite.
     * @param {Number} height height of sprite.
     * @param {World} world what world this object is in.
     */
    constructor(resourcePath, world, posX, posY, width, height) {
        super(world, posX, posY, width, height, ColliderTypes.Circle);

        this.sprite = JPixi.Sprite.Create(resourcePath, this.prop.x, this.prop.y, this.prop.width, this.prop.height, this.world.layerMiddle, true);

        this.collider.r = this.collider.r * 1.25;
        this.updateRate = 1;

        this.firstPass = true;
        this.lastWorldCount = 0;

        this.speed = 0;

        this.target = new Target(this);

        // Track current cells(s) and surrounding cells.
        this.cellEdgeDist = 0; // Counts down with movement and re-checks when 0 or lower.
        this.surroundingCells = [];
        this.cellsActive = [];
        for (var i = 0; i < this.world.grid.cellCount; i++)
            this.cellsActive[i] = false;
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // DESTROY
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    Destroy() {
        this.target.object.UnSubscribeAll(this);
        this.target = undefined;

        this.collider = undefined;
        this.prop = undefined;
        this.sprite = undefined;

        this.Publish("OnDestroyed");
        this.eventTopics = [];
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // OBJECT UPDATE
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    FirstPass() {
        this.firstPass = false;

        if (this.lastWorldCount != this.world.count) {
            this.firstPass = true;
            this.lastWorldCount = this.world.count;
        }
    }

    UpdateMovement(cell) {
        if (!this.firstPass) return;

        this.updateRate = cell.updateRate;

        if (this.dynamicType === DynamicTypes.Player) {
            this.target.UpdateDirectionAndDistance();
        }
        else if (cell.FramesBetweenUpdates(ai.directionUpdateRate)) {
            this.target.UpdateDirectionAndDistance();
        }

        if (this.UpdateProp()) {
            this.SyncSpriteAndColliderWithProp();
        }

        this.UpdateActiveCells(cell);
    }

    UpdateProp() {
        if (this.target.atDestination || this.speed == 0) return false;

        var prevX = this.prop.x;
        var prevY = this.prop.y;

        this.prop.x += this.target.direction.x * this.speed * this.updateRate * this.world.delta;
        this.prop.y += this.target.direction.y * this.speed * this.updateRate * this.world.delta;

        if (this.target.direction.x != 0) this.cellEdgeDist -= Math.abs(prevX - this.prop.x);
        if (this.target.direction.y != 0) this.cellEdgeDist -= Math.abs(prevY - this.prop.y);

        return true;
    }

    SyncSpriteAndColliderWithProp() {
        this.sprite.position.set(this.prop.x, this.prop.y);
        this.sprite.width = this.prop.width;
        this.sprite.height = this.prop.height;
        this.collider.Position(this.prop.x, this.prop.y, this.prop.width, this.prop.height);
    }

    UpdateActiveCells(cell) {
        if (this.dynamicType === DynamicTypes.Player && cell.FramesBetweenUpdates(player.cellUpdateRate)) {
            this.world.grid.AddPlayerToCell(this);
        }

        if (cell.FramesBetweenUpdates(ai.cellUpdateRate)) {
            if (this.dynamicType === DynamicTypes.Foe) this.world.grid.AddFoeToCell(this);
            else this.world.grid.AddFriendToCell(this);
        }
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // COLLISIONS
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    CollisionStatic(collInfo) {
        if (collInfo.overlapN.x != 0) {
            this.target.direction.x = 0;
            this.prop.x += collInfo.overlapV.x * 1.1;
        }

        if (collInfo.overlapN.y != 0) {
            this.target.direction.y = 0;
            this.prop.y += collInfo.overlapV.y * 1.1;
        }
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // HELPERS
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Get the closest object in this and the surrounding cells. Distance is sqr magnitude!
     * 
     * @param {DynamicTypes} dynamicType 
     */
    GetClosestDynamicObject(dynamicType) {
        var distance;
        var objAndDist = { found: false, object: undefined, distance: undefined };
        var closest;

        for (var i = 0; i < this.surroundingCells.length; i++) {
            var index = this.surroundingCells[i];
            var cell = this.world.grid.cells[index];

            if (dynamicType == DynamicTypes.Friend) closest = this.world.Closest(this, cell.friends);
            else if (dynamicType == DynamicTypes.Foe) closest = this.world.Closest(this, cell.foes);
            else closest = this.world.Closest(this, cell.player);

            if (closest.found && (closest.distance < distance || distance === undefined)) {
                distance = closest.distance;
                objAndDist = closest;
            }
        }

        return objAndDist;
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PLAYER EXTENSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Player extends DynamicObject {

    /**
     * 
     * @param {string} resourcePath 
     * @param {World} world 
     * @param {Number} posX 
     * @param {Number} posY
     * @param {Number} width
     * @param {Number} height
     */
    constructor(resourcePath, world, posX, posY, width, height) {
        super(resourcePath, world, posX, posY, width, height);
        this.world.grid.AddPlayerToCell(this);
        this.dynamicType = DynamicTypes.Player;

        this.speed = player.speed;

        this.sprite.parent.removeChild(this.sprite);
        this.sprite.setParent(this.world.layerPlayer);
        this.world.container.interactive = true;

        this.playerTarget = new BaseObject(this.world, 960, 640, 0, 0);
        this.target.SetTarget(this.playerTarget);

        this.speed = 0;

        this.world.container.on("pointerdown", event => { event.stopPropagation(); this.OnPointerDown(event); });
        this.world.container.on("pointermove", event => { event.stopPropagation(); this.OnPointerMove(event); });
        this.world.container.on("pointerup", event => { event.stopPropagation(); this.OnPointerUp(event); });

        this.friend = undefined;
    }

    OnPointerDown(event) {
        var localPoint = event.data.getLocalPosition(this.world.container);

        if (this.target.distance > 20000) this.speed = 7;
        else if (this.target.distance > 15000) this.speed = 5;
        else if (this.target.distance > 10000) this.speed = 3;
        else if (this.target.distance > 6000) this.speed = 2;
        else if (this.target.distance > 2000) this.speed = 1;
        else this.speed = player.speed;

        this.playerTarget.prop.x = localPoint.x;
        this.playerTarget.prop.y = localPoint.y;
    }

    OnPointerMove(event) {
        var localPoint = event.data.getLocalPosition(this.world.container);

        if (this.speed != 0 && this.target.distance > 20000) this.speed = 7;
        else if (this.speed != 0 && this.target.distance > 15000) this.speed = 5;
        else if (this.speed != 0 && this.target.distance > 10000) this.speed = 3;
        else if (this.speed != 0 && this.target.distance > 6000) this.speed = 2;
        else if (this.speed != 0 && this.target.distance > 2000) this.speed = 1;
        else if (this.speed != 0) this.speed = player.speed;

        this.playerTarget.prop.x = localPoint.x;
        this.playerTarget.prop.y = localPoint.y;
    }


    OnPointerUp(event) {
        this.speed = 0;
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // OBJECT UPDATE
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    Update(cell) {

        if (cell.FramesBetweenUpdates(player.interactUpdateRate)) {

            // Item interaction
            for (var i = cell.items.length - 1; i > -1; i--) {
                var item = cell.items[i];

                if (this.world.CollideBoxCircle(item.collider, this.collider)) this.CollisionItem(item);
            }

            /* for (var i = cell.friends.length - 1; i > -1; i--) {
                  var friend = cell.friends[i];
  
                  if (this.world.CollideCircleCircle(friend.collider, this.collider)) this.CollisionFriend(friend);
              }*/
        }

        // Static interaction
        for (var i = cell.staticObjs.length - 1; i > -1; i--) {
            var staticObj = cell.staticObjs[i];

            if (this.world.CollideBoxCircle(staticObj.collider, this.collider)) this.CollisionStatic(this.world.collInfo);
        }

        if (this.IsDestroyed()) return;

        this.UpdateMovement(cell);
    }

    CollisionItem(item) {
        item.sprite.tint = 0x0000FF * Math.random();
        item.sprite.alpha = 1;
    }

    CollisionFriend(friend) {
        if (this.friend != undefined && this.friend != friend) {
            friend.Destroy();

            this.friend.prop.width += 0.3;
            this.friend.prop.height += 0.3;
        }
        else {
            friend.target.SetTarget(this);
            friend.speed = 12;
            this.friend = friend;
            this.friend.sprite.alpha = 0.2;
        }
    }

    Destroy() {
        this.world.layerPlayer.removeChild(this.sprite);
        super.Destroy();
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// AI EXTENSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class AI extends DynamicObject {

    /**
     * 
     * @param {string} resourcePath 
     * @param {World} world 
     * @param {Number} posX 
     * @param {Number} posY
     * @param {Number} width
     * @param {Number} height
     */
    constructor(resourcePath, world, posX, posY, width, height) {
        super(resourcePath, world, posX, posY, width, height);
        this.world.grid.AddFriendToCell(this);
        this.dynamicType = DynamicTypes.Friend;

        this.speed = ai.speed;

        this.sprite.parent.removeChild(this.sprite);
        this.sprite.setParent(this.world.layerMiddle);
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // OBJECT UPDATE
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    Update(cell) {
        // Static interaction
        /* for (var i = cell.staticObjs.length - 1; i > -1; i--) {
             var staticObj = cell.staticObjs[i];
 
             if (this.world.CollideBoxCircle(staticObj.collider, this.collider)) this.CollisionStatic(this.world.collInfo);
         }*/

        if (this.IsDestroyed()) return;

        this.UpdateMovement(cell);
    }

    Destroy() {
        this.world.layerMiddle.removeChild(this.sprite);
        super.Destroy();
    }
}


///////////////////////////////////////////////////////////////////////////////
// MODULE EXPORT
///////////////////////////////////////////////////////////////////////////////

module.exports = {
    Player,
    AI
}