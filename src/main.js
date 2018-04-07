"use strict";

const { JPixi, App } = require("./lib/jpixi");
const { appConf } = require("./lib/jpixi_config");
const { Player, AI } = require("./dynamicobject");
const { Camera, ResizeTypes } = require("./camera");
const { World } = require("./world");
const { StaticObject, StaticTiledObject } = require("./staticobject");
const { Item } = require("./itemobject");
const { Grid } = require("./grid");


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PIXI
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Test
/**type {PIXI.Sprite} */
//var leaveFullScreen;
/**type {PIXI.Sprite} */
//var enterFullScreen;

/**@type {World} */
var world;

var FPS;


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PIXI EVENTS
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

JPixi.Event.Init(() => {
    var resList = [
        "swnewn_files/images/background.png",
        "swnewn_files/images/drop.png",
        "swnewn_files/images/hamster.png",
        "swnewn_files/images/zoomIn.png",
        "swnewn_files/images/zoomOut.png",
        "swnewn_files/images/black1px.png",
        "swnewn_files/images/white1px.png"
    ];

    JPixi.Resources.AddArray(resList);
});

JPixi.Event.Start(() => {
    // Create world,camera & grid
    world = new World();

    // World ends 32px wide colliders along edges of window.
    var up = new StaticTiledObject("swnewn_files/images/black1px.png", world, 0, -32, appConf.worldWidth, 32);
    up.alpha = 0;
    var right = new StaticTiledObject("swnewn_files/images/black1px.png", world, appConf.worldWidth, 0, 32, appConf.worldHeight);
    right.alpha = 0;
    var down = new StaticTiledObject("swnewn_files/images/black1px.png", world, 0, appConf.worldHeight, appConf.worldWidth, 32);
    down.alpha = 0;
    var left = new StaticTiledObject("swnewn_files/images/black1px.png", world, -32, 0, 32, appConf.worldHeight);
    left.alpha = 0;

    // Friend
    /*  for (var i = 0; i < 500; i++) {
          var friend = new AI("swnewn_files/images/white1px.png", world, Math.random() * appConf.worldWidth, Math.random() * appConf.worldHeight, 8, 8);
          friend.sprite.tint = 0xAADDFF;
      }*/

    // Player
    var player = new Player("swnewn_files/images/white1px.png", world, 960, 640, 24, 24);
    player.sprite.tint = 0x0000FF;
    player.sprite.alpha = 0.3;
    world.camera.SetTarget(player);

    // Psy
    var posX = 8;
    var posY = 8;

    for (var i = 0; i < 68; i++) {
        for (var j = 0; j < 120; j++) {
            var psy = new Item("swnewn_files/images/white1px.png", world, posX, posY, 16, 16, true);
            psy.sprite.alpha = 0;

            posX += 16;
        }
        posX = 8;
        posY += 16;
    }


    // FPS
    //  FPS = JPixi.Text.CreateFPS();

    // Begin game 
    App.AddTicker(delta => {
        //FPS();

        world.Update(delta);
    });
});

JPixi.Event.FullScreen(() => {
    if (leaveFullScreen.visible) {
        leaveFullScreen.visible = false;
        enterFullScreen.visible = true;
    }
    else {
        leaveFullScreen.visible = true;
        enterFullScreen.visible = false;
    }
});

JPixi.Event.Resize(() => {

});

JPixi.Event.Orientation(() => {

});