const SAT = require("sat");
const { JPixi } = require("./lib/jpixi");
const { World } = require("./world");
const { appConf } = require("./lib/jpixi_config");
const { DynamicTypes, Prop } = require("./baseobject");


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GRID CLASS
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Grid {
    /**
     * 
     * @param {Number} cellCount 
     * @param {World} world
     */
    constructor(cellCount = 25, world) {
        this.container = JPixi.Container.Create(appConf.worldWidth, appConf.worldHeight, 0, 0, world.container);
        this.world = world;

        /**@type {Cell[]} */
        this.cells = [];
        this.cellCount = cellCount;
        this.sqrCell = Math.sqrt(cellCount);

        // Create the grid 
        var x = appConf.worldWidth / this.sqrCell;
        var y = appConf.worldHeight / this.sqrCell;

        var index = 0;

        for (var i = 0; i < this.sqrCell; i++) {
            for (var j = 0; j < this.sqrCell; j++) {
                this.cells[index] = new Cell(world, this, index, j * x, i * y, x, y);
                index++;
            }
        }
    }

    /**
     * Adds static object to the grid. Call only at start of game.
     * 
     * @param {BaseObject} objectToAdd 
     */
    AddStaticToCell(objectToAdd) {
        this.cells.forEach(cell => {
            if (this.world.CollideBoxBox(cell.collider, objectToAdd.collider)) cell.staticObjs.push(objectToAdd);
        });
    }

    /**
    * Adds static items to the grid. Call only at start of game.
    * 
    * @param {BaseObject} objectToAdd 
    */
    AddItemToCell(objectToAdd) {
        this.cells.forEach(cell => {
            if (this.world.CollideBoxBox(cell.collider, objectToAdd.collider)) cell.items.push(objectToAdd);
        });
    }

    AddPlayerToCell(objectToAdd) {
        var cells = this.LocateCells(objectToAdd);

        for (var i = 0; i < cells.length; i++) {
            cells[i].player[0] = objectToAdd;
        }
    }

    AddFriendToCell(objectToAdd) {
        var cells = this.LocateCells(objectToAdd);

        for (var i = 0; i < cells.length; i++) {
            cells[i].friends.push(objectToAdd);
        }
    }

    AddFoeToCell(objectToAdd) {
        var cells = this.LocateCells(objectToAdd);

        for (var i = 0; i < cells.length; i++) {
            cells[i].foes.push(objectToAdd);
        }
    }


    /**
     * Find the cells an object currently is in.
     * 
     * @param {BaseObject} objectToAdd 
     */
    LocateCells(objectToAdd) {
        if (objectToAdd.cellEdgeDist > 0) return [];

        var inCell = false;
        var cell;
        var cells = [];
        var foundObject = false;
        var checkSurroundingCells = false;

        // Check current known cells for the object.
        for (var i = 0; i < this.cellCount; i++) {
            if (objectToAdd.cellsActive[i] === false) continue;

            cell = this.cells[i];
            inCell = this.world.CollideBoxCircle(cell.collider, objectToAdd.collider);

            // Object remains in cell.
            if (inCell) {
                foundObject = true;

                // Object on or over cell edge, check surrounding cells as well.
                if (this.CalculateNearestCellEdge(objectToAdd)) checkSurroundingCells = true;
            }

            // Object no longer in cell.
            else {
                objectToAdd.cellsActive[cell.index] = false;
            }
        }

        // Check previously known list of surrounding cells.
        if (checkSurroundingCells) {
            var index = 0;
            var foundInNewCell = false;

            for (var i = 0; i < objectToAdd.surroundingCells.length; i++) {
                index = objectToAdd.surroundingCells[i];

                if (objectToAdd.cellsActive[index] === true) continue; //Don't re-check the previously known cells.

                cell = this.cells[index];
                inCell = this.world.CollideBoxCircle(cell.collider, objectToAdd.collider);

                if (inCell) {
                    foundObject = true;

                    cells.push(cell);
                    objectToAdd.cellsActive[cell.index] = true;

                    this.CalculateNearestCellEdge(objectToAdd);

                    foundInNewCell = true;
                }
            }

            // Update list of surrounding cells.
            if (foundInNewCell || objectToAdd.surroundingCells.length <= 0) {
                objectToAdd.surroundingCells = this.GetSurroundingCells(objectToAdd.cellsActive);
            }
        }

        // Check rest of the grid for the object. This should only occure on initial launch.
        if (!foundObject) {
            for (var i = 0; i < this.cellCount; i++) {

                if (objectToAdd.cellsActive[index] === true) continue; //Don't re-check the previously known cells.

                cell = this.cells[i];
                inCell = this.world.CollideBoxCircle(cell.collider, objectToAdd.collider);

                if (inCell) {
                    foundObject = true;

                    cells.push(cell);
                    objectToAdd.cellsActive[cell.index] = true;

                    this.CalculateNearestCellEdge(objectToAdd);
                }
            }

            objectToAdd.surroundingCells = this.GetSurroundingCells(objectToAdd.cellsActive);
        }

        return cells;
    }

    /**
     * Get the closest distance to edge and check if near edge. Distance is used by object to know when to check for cell again.
     * 
     * @param {BaseObject} objectToAdd 
     */
    CalculateNearestCellEdge(objectToAdd) {
        var dist = this.world.collInfo.overlap;
        var objectSize = objectToAdd.collider.r * 2;

        objectToAdd.cellEdgeDist = dist - objectSize;

        if (dist <= objectSize) {
            objectToAdd.cellEdgeDist = 1;
            return true;
        }

        return false;
    }

    /**
    * For each current active cell of an object, get the surrounding cells and merge them into one array of cells.
    * 
    * @param {Boolean[]} cellsActive 
    */
    GetSurroundingCells(cellsActive) {

        var mergedIndexList = [];
        var count = 0;

        for (var i = 0; i < this.cellCount; i++) {
            // Skip all false cells for this object.
            if (!cellsActive[i]) continue;

            mergedIndexList[count] = this.CreateSurroundingCellsList(i);
            count++;
        }

        if (count === 1) return mergedIndexList[0];
        else if (count === 2) return this.MergeArrays(mergedIndexList[0], mergedIndexList[1]);
        else if (count === 3) return this.MergeArrays(mergedIndexList[0], mergedIndexList[1], mergedIndexList[2]);
        else if (count === 4) return this.MergeArrays(mergedIndexList[0], mergedIndexList[1], mergedIndexList[2], mergedIndexList[3]);
        else return mergedIndexList;
    }

    /**
     * Calculate the cells surrounding a specific cell.
     * 
     * @param {Number} currentCellIndex 
     */
    CreateSurroundingCellsList(currentCellIndex) {
        /// Create a list of possible surrounding cells.
        var indexList = [
            currentCellIndex - this.sqrCell - 1,
            currentCellIndex - this.sqrCell,
            currentCellIndex - this.sqrCell + 1,
            currentCellIndex - 1,
            currentCellIndex,
            currentCellIndex + 1,
            currentCellIndex + this.sqrCell - 1,
            currentCellIndex + this.sqrCell,
            currentCellIndex + this.sqrCell + 1,
        ];

        /// Remove all cells that are out of bounds.
        if (indexList[8] >= this.cellCount) {
            for (var i = 8; i > 1; i--) {
                if (indexList[i] >= this.cellCount) indexList.pop();
            }
        }
        else {
            for (var i = 0; i < indexList.length; i++) {
                if (indexList[0] < 0) indexList.shift();
            }
        }

        /// Remove all cells that are not surrounding current cell.
        var indexZeroAsOne = currentCellIndex + 1;
        var cleanIndexList = [];

        for (var i = 0; i < indexList.length; i++) {
            // Current Index is on the far left.
            if (indexZeroAsOne % this.sqrCell === 1 && indexList[i] == currentCellIndex) {
                cleanIndexList.push(indexList[i + 2]);
                if (indexList[i - 1] != undefined) cleanIndexList.push(indexList[i - 1]);
                if (indexList[i - 4] != undefined) cleanIndexList.push(indexList[i - 4]);
            }

            // Current Index is on the far right.
            else if (indexZeroAsOne % this.sqrCell === 0 && indexList[i] == currentCellIndex) {
                cleanIndexList.push(indexList[i - 2]);
                if (indexList[i + 1] != undefined) cleanIndexList.push(indexList[i + 1]);
                if (indexList[i + 4] != undefined) cleanIndexList.push(indexList[i + 4]);
            }
        }

        if (cleanIndexList.length > 0) {
            for (var i = 0; i < cleanIndexList.length; i++) {
                var index = indexList.indexOf(cleanIndexList[i]);
                if (index > -1) indexList.splice(index, 1);
            }
        }

        return indexList;
    }

    /**
     * Merge two or more arrays, fetched from:
     * 
     * https://codegolf.stackexchange.com/a/17129
     */
    MergeArrays() {
        var args = arguments;
        var hash = {};
        var arr = [];
        for (var i = 0; i < args.length; i++) {
            for (var j = 0; j < args[i].length; j++) {
                if (hash[args[i][j]] !== true) {
                    arr[arr.length] = args[i][j];
                    hash[args[i][j]] = true;
                }
            }
        }

        return arr;
    }

    /** 
     * Trigger the cell update that in turns trigger all object updates.
     */
    Update() {
        for (var i = 0; i < this.cellCount; i++) {
            this.cells[i].Update();
        }
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CELL CLASS
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


class Cell {
    /**
     * @param {World} world
     * @param {Grid} grid
     * @param {Number} index 
     * @param {Number} posX
     * @param {Number} posY
     * @param {Number} width
     * @param {Number} height
     */
    constructor(world, grid, index, posX, posY, width, height) {
        this.world = world;
        this.index = index;
        this.prop = new Prop(posX, posY, width, height);
        //this.sprite = JPixi.Sprite.Create("swnewn_files/images/black1px.png", this.prop.x, this.prop.y, this.prop.width, this.prop.height, grid.container);//Debug
        // this.sprite.tint = 0xFF0000 * Math.random(); //Debug
        // this.sprite.alpha = 0.3; //Debug

        this.collider = world.CreateBox(this.prop);

        this.staticObjs = [];
        this.player = [];
        this.friends = [];
        this.foes = [];
        this.items = [];

        this.updateRate = 1;
        this.count = Math.floor(Math.random() * grid.cellCount);
    }

    /** 
     * Trigger all objects Update methods and pass in the list of all other objects in this cell.
     */
    Update() {
        this.count++;
        if (this.count > 3600) this.count = 1;

        // Every 12 frame, check if cell is within camera view. If outside, limit updates.
        if (this.FramesBetweenUpdates(12)) {
            if (!this.world.CollideBoxBox(this.collider, this.world.camera.collider)) this.updateRate = 1;
            else this.updateRate = 1;
        }

        // Update all objects in cell.
        if (this.FramesBetweenUpdates(this.updateRate)) {
            var playerUpdated = false;
            var friendUpdated = false;
            var foeUpdated = false;

            //Player list.
            var player = this.player[0];

            if (player != undefined) {
                if (!player.cellsActive[this.index] || player.IsDestroyed()) {
                    this.player = [];
                    return;
                }

                player.FirstPass();
                player.Update(this);

                playerUpdated = true;
            }

            // Friend list.
            for (var i = this.friends.length - 1; i > -1; i--) {
                var friend = this.friends[i];

                if (!friend.cellsActive[this.index] || friend.IsDestroyed()) {
                    this.friends.splice(i, 1);
                    continue;
                }

                friend.FirstPass();
                friend.Update(this);

                friendUpdated = true;
            }

            // Foe list.
            for (var i = this.foes.length - 1; i > -1; i--) {
                var foe = this.foes[i];

                if (!foe.cellsActive[this.index] || foe.IsDestroyed()) {
                    this.foes.splice(i, 1);
                    continue;
                }

                foe.FirstPass();
                foe.Update(this);

                foeUpdated = true;
            }

            if (playerUpdated || friendUpdated || foeUpdated) {
                // Item list.
                for (var i = this.items.length - 1; i > -1; i--) {
                    var item = this.items[i];

                    if (item.IsDestroyed()) {
                        this.items.splice(i, 1);
                        continue;
                    }

                    item.Update(this);
                }

                // Static list.
                for (var i = this.staticObjs.length - 1; i > -1; i--) {
                    var staticObj = this.staticObjs[i];

                    if (staticObj.IsDestroyed()) {
                        this.staticObjs.splice(i, 1);
                        continue;
                    }

                    staticObj.Update(this);
                }
            }
        }
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // HELPERS
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    FramesBetweenUpdates(rate) {
        if (this.count % rate === 0) {
            return true;
        }

        return false;
    }
}


///////////////////////////////////////////////////////////////////////////////
// MODULE EXPORT
///////////////////////////////////////////////////////////////////////////////

module.exports = {
    Grid,
    Cell
}