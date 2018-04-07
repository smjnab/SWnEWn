const { JPixi } = require("./lib/jpixi");
const { appConf } = require("./lib/jpixi_config");
const { World } = require("./world");
const { DynamicObject } = require("./dynamicobject")
const { Prop } = require("./baseobject")


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CAMERA CLASS
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Camera {
    /**
     * 
     * @param {World} world 
     */
    constructor(world) {
        this.resizePixiObjects = [];

        this.world = world;

        this.AddToResizeList(this.world.container, ResizeTypes.PivotAtHalfSize); //Update pivot to always be 50%/50% when resizing window.
        JPixi.Container.Sort(this.world.container, 0); // Make sure world is below camera and gui.

        this.container = JPixi.Container.Create(appConf.cameraWidth, appConf.cameraHeight);

        //Culling box
        this.sprite = JPixi.Sprite.Create("swnewn_files/images/black1px.png", 0, 0, appConf.cameraWidth, appConf.cameraHeight, this.container);
        this.AddToResizeList(this.sprite, ResizeTypes.FullSize);
        this.sprite.alpha = 0;
        //  this.sprite.tint = 0x00FF00; //Debug
        this.collider = this.world.CreateBox(this.sprite);
        this.AddToResizeList(this.collider, ResizeTypes.Collider);

        this.UpdateSize();
        this.InitPixiResizeCallback();

        this.lastPosX = -1;
        this.lastPosY = -1;
    }

    /**
     * Add a dynamic object as target and camera will use prop of that target to follow it.
     * 
     * @param {DynamicObject} target 
     */
    SetTarget(target) {
        this.targetObject = target;
        this.targetObject.Subscribe("OnDestroyed", this, () => { this.TargetDestroyed(); }, "TargetDestroyed");
    }

    TargetDestroyed() {
        // TODO 
    }

    /** 
     * Register callback to camera when screen resizes.
     */
    InitPixiResizeCallback() {
        JPixi.Event.Resize(() => {
            this.UpdateSize();

            clearInterval(repeat);
            var repeat = setInterval(() => this.ResizeList(), 10);
            setTimeout(() => clearInterval(repeat), 500);
        });
    }

    /** 
     * Update camera's size attributes.
     */
    UpdateSize() {
        this.width = appConf.cameraWidth;
        this.height = appConf.cameraHeight;
        this.halfWidth = appConf.cameraWidth / 2;
        this.halfHeight = appConf.cameraHeight / 2;
        this.lastPosX = 0;
        this.lastPosY = 0;
    }

    /**
     * Resize objects in the resize list to match camera attributes.
     * 
     * @param {PIXI} pixiObject any object where .width/.height/.position/.pivot etc should be modified after cameras.
     * @param {ResizeTypes} resizeType Enmu that picks what type of resize to do on pixiObject.
     * @param {Number} offSetX Offset from camera width. Negative number is offset from right.
     * @param {Number} offSetY Offset from camera height. Negative number is offset from bottom.
     */
    AddToResizeList(pixiObject, resizeType, offSetX = 0, offSetY = 0) {
        this.resizePixiObjects.push({ pixiObject: pixiObject, offSetX: offSetX, offSetY: offSetY, resizeType: resizeType });
    }

    /**
     * Resize objects that uses the camera size for its own size/position etc.
     */
    ResizeList() {
        for (var i = 0; i < this.resizePixiObjects.length; i++) {
            var item = this.resizePixiObjects[i];

            switch (item.resizeType) {
                case ResizeTypes.FullSize:
                    item.pixiObject.width = this.width;
                    item.pixiObject.height = this.height;
                    this.lastPosX = -1;
                    this.lastPosY = -1;
                    break;

                case ResizeTypes.Position:
                    item.pixiObject.position.set(this.width + item.offSetX, this.height + item.offSetY);
                    break;

                case ResizeTypes.PivotAtHalfSize:
                    item.pixiObject.pivot.set(-this.halfWidth, -this.halfHeight);
                    break;

                case ResizeTypes.Collider:
                    this.collider = this.world.CreateBox(this.sprite);
                    break;
            }
        }
    }

    Update() {
        // Check if camera is at edge of world. 
        this.right = appConf.worldWidth > this.halfWidth + this.targetObject.prop.x;
        this.left = this.targetObject.prop.x - this.world.container.x > this.width;
        this.bottom = appConf.worldHeight > this.halfHeight + this.targetObject.prop.y;
        this.top = this.targetObject.prop.y - this.world.container.y > this.height;

        var posX;
        var posY;

        // Clamp camera position to within world limits.
        if (!this.top) posY = -this.halfHeight;
        else if (!this.bottom) posY = this.halfHeight - appConf.worldHeight;
        if (!this.right) posX = this.halfWidth - appConf.worldWidth;
        else if (!this.left) posX = -this.halfWidth;

        // Move camera freely while within world limits.
        if (this.right && this.left) posX = -this.targetObject.prop.x;
        if (this.top && this.bottom) posY = -this.targetObject.prop.y;

        //Update camera and culling when cam moved.
        if (posX != this.lastPosX || posY != this.lastPosY) {
            this.world.container.x = posX;
            this.world.container.y = posY;

            this.collider.Position(Math.abs(this.halfWidth + posX), Math.abs(this.halfHeight + posY));

            this.lastPosX = posX;
            this.lastPosY = posY;
        }
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RESIZE ENUM
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const ResizeTypes = {
    FullSize: 0,
    Position: 1,
    PivotAtHalfSize: 2,
    Collider: 3
}


///////////////////////////////////////////////////////////////////////////////
// MODULE EXPORT
///////////////////////////////////////////////////////////////////////////////

module.exports = {
    Camera,
    ResizeTypes
}