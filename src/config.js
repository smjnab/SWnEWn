"use strict";

module.exports = {
    p: {
        root: "swnewnfiles/",
        lib: "swnewn_files/lib/",
        img: "swnewn_files/images/"
    },

    // DynamicObject AI
    ai: {
        cellUpdateRate: 2, // How often to check for cells object is in. 6 = ten times a sec at 60 frames.
        directionUpdateRate: 2, // How often to run a check to see if object needs to be reset.
        interactUpdateRate: 2, // How often to check if colliding with another dynamic object.
        speed: 0.3,   // Default speed of AI objects
        friend: {
            speed: 3
        }
    },

    // DynamicObject Player
    player: {
        cellUpdateRate: 2,  // How often to check for cells player is in. 1 = every frame, 2 = every other etc
        speed: 1  // Default movement speed. direction * speed * updaterate * delta
    },

    item: {
        interactUpdateRate: 2
    },

    staticObj: {
        collisionUpdateRate: 2
    },

    // World
    world: {
        cellCount: 64 // How many cells to use for grid.
    }
}