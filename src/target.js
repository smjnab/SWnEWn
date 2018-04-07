const { DynamicObject } = require("./dynamicobject");


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TARGET CLASS
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Target {
    /**
     * 
     * @param {DynamicObject} seeker
     * @param {DynamicObject} targetObject 
     * @param {Number} reverse
     */
    constructor(seeker, targetObject = undefined, reverse = false) {
        this.seeker = seeker;
        this.world = this.seeker.world;
        this.distToBeAtDest = 25;

        this.SetTarget(targetObject, undefined, undefined, reverse);
    }

    UpdateDirection(forceUpdate = false) {
        if (!forceUpdate && this.object == this.seeker) return;
        if (!forceUpdate && this.atDestination) return;

        if (!this.reverse) this.direction = this.world.Direction(this.seeker.prop, this.object.prop);
        else this.direction = this.world.Direction(this.seeker.prop, this.object.prop).reverse();

        return true;
    }

    UpdateDistance(forceUpdate = false) {
        if (!forceUpdate && this.object == this.seeker) return;

        this.atDestination = false;

        this.distance = this.world.MagnitudeSqr(this.seeker.prop, this.object.prop);

        if (!forceUpdate && this.distance <= this.distToBeAtDest) this.atDestination = true;

        return true;
    }

    UpdateDirectionAndDistance(forceUpdate = false) {
        this.UpdateDistance(forceUpdate);
        this.UpdateDirection(forceUpdate);
    }

    SetTarget(targetObject, targetDirection = undefined, targetDistance = undefined, reverse = false) {
        if (this.object != undefined && targetObject == this.object) {
            this.reverse = reverse;
            return false;
        }

        if (this.object != undefined && this.object != this.seeker) this.object.UnSubscribe("OnDestroyed", this.seeker, "TargetDestroyed");

        if (targetObject != undefined) this.object = targetObject;
        else this.object = this.seeker;

        if (this.object != this.seeker) this.object.Subscribe("OnDestroyed", this.seeker, () => { this.TargetDestroyed(); }, "TargetDestroyed");

        this.reverse = reverse;

        if (targetDistance == undefined) this.UpdateDistance(true);
        else this.distance = targetDistance;

        if (targetDirection == undefined) this.UpdateDirection(true);
        else this.direction = targetDirection;

        return true;
    }

    TargetDestroyed() {
        this.object = this.seeker;
    }
}


///////////////////////////////////////////////////////////////////////////////
// MODULE EXPORT
///////////////////////////////////////////////////////////////////////////////

module.exports = {
    Target
}