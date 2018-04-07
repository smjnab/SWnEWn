const { World } = require("./world");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BASE OBJECT CLASS
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class BaseObject {
    /**
     * 
     * @param {World} world 
     * @param {Number} posX postition X in world container.
     * @param {Number} posY postition Y in world container.
     * @param {Number} width width of sprite.
     * @param {Number} height height of sprite.
     */
    constructor(world, posX, posY, width, height) {
        this.world = world;
        this.prop = new Prop(posX, posY, width, height);

        /**@type {EventTopic[]} */
        this.eventTopics = [];
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // TOPIC PUBLISHING
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    Subscribe(topic, subscriber, subscriberMethod, subscriberMethodName) {
        if (this == subscriber) return;

        this.eventTopics.push(new EventTopic(topic, subscriber, subscriberMethod, subscriberMethodName));
    }

    UnSubscribe(topic, subscriber, subscriberMethodName, removeAllForSubscriber = false) {
        if (this == subscriber) return;
        if (this.eventTopics.length <= 0) return;

        for (var i = this.eventTopics.length - 1; i > -1; i--) {
            var eventTopic = this.eventTopics[i];

            if ((removeAllForSubscriber && eventTopic.subscriber === subscriber) ||
                (eventTopic.topic === topic && eventTopic.subscriber === subscriber && eventTopic.subscriberMethodName === subscriberMethodName)) {
                this.eventTopics.splice(i, 1);
            }
        }
    }

    UnSubscribeAll(subscriber) {
        this.UnSubscribe(undefined, subscriber, undefined, true);
    }

    TopicRemoval(topic, subscriberMethodName = undefined) {
        if (this.eventTopics.length <= 0) return;

        for (var i = this.eventTopics.length - 1; i > -1; i--) {
            var eventTopic = this.eventTopics[i];

            if (eventTopic.topic === topic && (subscriberMethodName == undefined || eventTopic.subscriberMethodName === subscriberMethodName)) {
                this.eventTopics.splice(i, 1);
            }
        }
    }

    Publish(topic, removeSubscribers = true) {
        if (this.eventTopics.length <= 0) return;

        for (var i = this.eventTopics.length - 1; i > -1; i--) {
            var eventTopic = this.eventTopics[i];

            if (eventTopic.topic == topic) {
                eventTopic.subscriberMethod();
            }

            if (removeSubscribers) this.eventTopics.splice(i, 1);
        }
    }
}

/**
 * Class to store typical object properties. These are modified and then later used for sprites, colliders etc.
 */
class Prop {
    /**
     * 
     * @param {Number} posX postition X in world container.
     * @param {Number} posY postition Y in world container.
     * @param {Number} width width of sprite.
     * @param {Number} height height of sprite.
     */
    constructor(posX, posY, width, height) {
        this.x = posX;
        this.y = posY;
        this.width = width;
        this.height = height;
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// COLLIDER OBJECT EXTENSION
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class BaseObjectColl extends BaseObject {
    /**
     * 
     * @param {World} world 
     * @param {Number} posX postition X in world container.
     * @param {Number} posY postition Y in world container.
     * @param {Number} width width of sprite.
     * @param {Number} height height of sprite.
     * @param {ColliderTypes} colliderType type of collider to use for object
     */
    constructor(world, posX, posY, width, height, colliderType) {
        super(world, posX, posY, width, height);

        switch (colliderType) {
            case ColliderTypes.None:
                // TODO ?
                break;
            case ColliderTypes.Box:
                this.collider = this.world.CreateBox(this.prop);
                break;
            case ColliderTypes.BoxCentered:
                this.collider = this.world.CreateBox(this.prop, true);
                break;
            case ColliderTypes.Circle:
                this.collider = this.world.CreateCircle(this.prop);
                break;
        }
    }

    IsDestroyed() {
        if (this.collider != undefined) return false;
        return true;
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  EVENT TOPIC CLASS - MESSAGE NOTIFY BETWEEN OBJECTS.
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class EventTopic {
    constructor(topic, subscriber, subscriberMethod, subscriberMethodName) {
        this.topic = topic;
        this.subscriber = subscriber;
        this.subscriberMethod = subscriberMethod;
        this.subscriberMethodName = subscriberMethodName;
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  TYPES
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const DynamicTypes = {
    Player: 0,
    Friend: 1,
    Foe: 2
}


/**
 * Different collider types an object can use.
 */
const ColliderTypes = {
    None: 0,
    Box: 1,
    BoxCentered: 2,
    Circle: 3
}


///////////////////////////////////////////////////////////////////////////////
// MODULE EXPORT
///////////////////////////////////////////////////////////////////////////////

module.exports = {
    BaseObject,
    Prop,
    BaseObjectColl,
    ColliderTypes,
    DynamicTypes
}