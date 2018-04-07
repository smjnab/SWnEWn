/**
 * General config for PIXI application. Keep ratio for camera settings at same ratio.
 * 
 * @property {string} elementID ID to render PIXI App in.
 * @property {string} readyEvent ID to render PIXI App in.
 * @property {boolean} antialias Antialias the rendering.
 * @property {boolean} transparent Make background transparent.
 * @property {number} resolution Multiplier for width/height.
 * @property {boolean} autoResize 
 */
const appConf = {
    elementID: "pixi",
    eventInit: "PixiInit",
    eventStart: "PixiStart",
    eventResize: "PixiResize",
    eventOrientation: "PixiOrientation",
    eventFullScreen: "PixiFullScreen",
    minCamWidth: 640,
    maxCamWidth: 1024,
    cameraWidth: 1280,
    cameraHeight: 720,
    worldWidth: 1920,   // 1024,3840
    worldHeight: 1080,   //576,2160
    backgroundColor: 0x000000,
    transparent: false,
    resolution: window.devicePixelRatio,
    autoResize: true
}


///////////////////////////////////////////////////////////////////////////////
// MODULE EXPORT
///////////////////////////////////////////////////////////////////////////////

module.exports = {
    appConf: appConf
}