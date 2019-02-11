/// <reference path="../_references.ts" />
class Game {
    constructor() {
        this._selected = [];
        //createWorld
        this._tileMap = new TileMap(15, 15);
        //createEntities
        this._player = new Player("Hero");
        this._tileMap.insertEntities([this._player, new Door(), new Key(), new Goblin(), new Goblin(), new Goblin(), new Goblin(), new Goblin(), new Goblin(), new Goblin(), new Goblin(), new Goblin()]);
        this._colliding = [];
    }
    //Only adding one entity to colliding, TODO
    checkCollisions(entity) {
        let tiles = this._tileMap.getEntityTiles(entity);
        let colliding = [];
        for (let tile of tiles) {
            for (let otherEntity of tile.entities) {
                if (!colliding.includes(otherEntity) && entity !== otherEntity) { //&& otherEntity.constructor.name !== "Ground") {
                    colliding.push(otherEntity);
                    otherEntity.playerCollision();
                }
            }
        }
        this._colliding = colliding;
    }
    get colliding() {
        return this._colliding;
    }
    get tileMap() {
        return this._tileMap;
    }
    newLevel() {
        let level = new TileMap(15, 15);
        level.insertEntities([this._player, new Door(), new Key(), new Goblin(), new Goblin(), new Goblin(), new Goblin(), new Goblin(), new Goblin(), new Goblin(), new Goblin(), new Goblin()]);
        this._colliding = [];
        this._tileMap = level;
    }
    get player() {
        return this._player;
    }
    get selected() {
        return this._selected;
    }
    set selected(tiles) {
        this._selected = tiles;
    }
    updatePlayerMana(tiles) {
        for (let tile of tiles) {
            let vowels = tile.getVowels();
            for (let vowel of vowels) {
                game.player.mana.increase(vowel, 1);
            }
        }
        //temporary hacky solution: removes the e and o added from "HERO". TODO
        game.player.mana.decrease("e", 1);
        game.player.mana.decrease("o", 1);
        console.log(game.player.mana.toString());
    }
    move(entity, newLocation) {
        //check length of intended location
        if (entity.name.length != newLocation.length) {
            return false;
        }
        //check if location contains at least one instance of entity
        let i;
        for (i = newLocation.length - 1; i >= 0; i--) {
            if (newLocation[i].entities.includes(entity)) {
                break;
            }
        }
        if (i == -1) {
            return false;
        }
        //check if selected is in a line
        let xdiff = Math.abs(this._tileMap.getTileLocation(newLocation[0])[0] - this._tileMap.getTileLocation(newLocation[newLocation.length - 1])[0]);
        let ydiff = Math.abs(this._tileMap.getTileLocation(newLocation[0])[1] - this._tileMap.getTileLocation(newLocation[newLocation.length - 1])[1]);
        if ((ydiff != 3 && ydiff != 0) || (xdiff != 3 && xdiff != 0)) {
            return false;
        }
        //if all conditions were met, move to new location
        let oldLocation = this._tileMap.getEntityTiles(entity);
        for (let i = 0; i < newLocation.length; i++) {
            let index = oldLocation[i].entityIndex(entity);
            oldLocation[i].removeEntity(entity);
            oldLocation[i].removeLetterAtIndex(index);
            newLocation[i].addEntity(entity);
            newLocation[i].addLetter(entity.name.charAt(i));
        }
        let curLocation = [];
        for (let i = 0; i < newLocation.length; i++) {
            curLocation.push(this._tileMap.getTileLocation(newLocation[i]));
        }
        entity.location = curLocation;
        this._selected = [];
        if (entity == this._player) {
            this.updatePlayerMana(newLocation);
        }
        return true;
    }
    headshift(entity, mul) {
        let newHead = entity.head;
        newHead[0] += mul * entity.dir[0];
        newHead[1] += mul * entity.dir[1];
        let line = this._tileMap.getTiles(this._tileMap.line(newHead, entity.dir, entity.length));
        if (line.indexOf(null) == -1 && game.move(entity, line)) {
            entity.head = newHead;
            return true;
        }
        else {
            return false;
        }
    }
    changeDir(entity, dir) {
        let line = this._tileMap.getTiles(this._tileMap.line(entity.head, dir, entity.length));
        if (line.indexOf(null) == -1 && game.move(entity, line)) {
            entity.dir = dir;
            return true;
        }
        else {
            return false;
        }
    }
    rotateDir(entity, clockwise) {
        let newdir = this._tileMap.rotateDir(entity.dir, clockwise);
        return this.changeDir(entity, newdir);
    }
}
/// <reference path="../_references.ts" />
class Tile {
    constructor() {
        this._entities = [];
        this._letters = [];
    }
    get letters() {
        return this._letters;
    }
    set letters(letters) {
        this._letters = letters;
    }
    addLetter(letter) {
        this._letters.push(letter);
    }
    removeLetter(letter) {
        let index = this._letters.indexOf(letter);
        this._letters.splice(index, 1);
    }
    removeLetterAtIndex(index) {
        this._letters.splice(index, 1);
    }
    removeTopLetter() {
        this._letters.pop();
    }
    changeLetter(index, newLetter) {
        this._letters[index] = newLetter;
    }
    getTopLetter() {
        return this._letters[this._letters.length - 1];
    }
    get entities() {
        return this._entities;
    }
    set entities(entities) {
        this._entities = entities;
    }
    addEntity(entity) {
        this._entities.push(entity);
    }
    containsEntity(entity) {
        return this._entities.indexOf(entity) != -1;
    }
    removeEntity(entity) {
        for (let i = 0; i < this._entities.length; i++) {
            if (this._entities[i] == entity) {
                this._entities.splice(i, 1);
            }
        }
    }
    entityIndex(entity) {
        return this._entities.indexOf(entity);
    }
    getVowels() {
        let vowels = [];
        for (let letter of this._letters) {
            if ("aieou".includes(letter.toLowerCase())) {
                vowels.push(letter);
            }
        }
        return vowels;
    }
}
/// <reference path="../_references.ts" />
class TileMap {
    constructor(width, height) {
        this._width = width;
        this._height = height;
        this._entities = [];
        this._tiles = new Array(this._width);
        for (let x = 0; x < this._width; x++) {
            this._tiles[x] = new Array(this._height);
            for (let y = 0; y < this._height; y++) {
                let entity = new Ground();
                entity.location.push([x, y]);
                this._tiles[x][y] = new Tile();
                this._tiles[x][y].addLetter(entity.name);
                this._tiles[x][y].addEntity(entity);
                this._entities.push(entity);
            }
        }
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get tiles() {
        return this._tiles;
    }
    get entities() {
        return this._entities;
    }
    randomPosDir() {
        let x = Math.floor(Math.random() * this._width), y = Math.floor(Math.random() * this._height);
        let directions = [-1, 0, 1];
        let xStep = directions[Math.floor((Math.random() * 3))];
        if (xStep == 0) {
            directions = [-1, 1];
        }
        let yStep = directions[Math.floor((Math.random() * directions.length))];
        return [x, y, xStep, yStep];
    }
    rotateDir(dir, clockwise) {
        let cos45 = 0.70710678118;
        let sin45 = 0.70710678118;
        let x = dir[0];
        let y = dir[1];
        if (clockwise) {
            return [Math.round(x * cos45 + y * sin45), Math.round(y * cos45 - x * sin45)];
        }
        else {
            return [Math.round(x * cos45 - y * sin45), Math.round(x * sin45 + y * cos45)];
        }
    }
    insertEntities(entities) {
        for (let i = 0; i < entities.length; i++) {
            this.insertEntity(entities[i]);
        }
    }
    line(head, dir, length) {
        let locations = [];
        let x = head[0];
        let y = head[1];
        for (let i = 0; i < length; i++) {
            locations.push([x, y]);
            x += dir[0];
            y += dir[1];
        }
        return locations;
    }
    insertEntity(entity) {
        let posDir = this.randomPosDir();
        let x = posDir[0], y = posDir[1], xStep = posDir[2], yStep = posDir[3];
        let path = [];
        let i;
        //Does entity name fit?
        for (i = 0; i < entity.name.length; i++) {
            if (x < this.width && x > 0 && y < this.height && y > 0) {
                let tile = this._tiles[x][y];
                if (tile.entities.length == 1 ||
                    tile.getTopLetter() == entity.name.charAt(i)) {
                    tile.addLetter(entity.name.charAt(i));
                    path.push([x, y]);
                    x += xStep;
                    y += yStep;
                }
                else {
                    break;
                }
            }
            else {
                break;
            }
        }
        //If so, add entity to tile.
        if (i == entity.name.length) {
            let currLocation = [];
            for (let location of path) {
                currLocation.push(location);
                let x = location[0];
                let y = location[1];
                this._tiles[x][y].addEntity(entity);
            }
            entity.location = currLocation;
            this._entities.push(entity);
            return true;
        }
        else {
            for (let location of path) {
                let x = location[0];
                let y = location[1];
                this._tiles[x][y].removeTopLetter();
            }
            return this.insertEntity(entity);
        }
    }
    getTileLocation(tile) {
        for (let x = 0; x < this._width; x++) {
            for (let y = 0; y < this._height; y++) {
                if (this._tiles[x][y] == tile) {
                    return [x, y];
                }
            }
        }
    }
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            console.log("out of bounds....");
            return null;
        }
        return this._tiles[x][y];
    }
    getTiles(points) {
        let result = [];
        for (let i = 0; i < points.length; i++) {
            result.push(this.getTile(points[i][0], points[i][1]));
        }
        return result;
    }
    getEntityTiles(entity) {
        let entityTiles = new Array();
        for (let x = 0; x < this._width; x++) {
            for (let y = 0; y < this._height; y++) {
                let curr = this.getTile(x, y);
                if (curr.containsEntity(entity)) {
                    entityTiles.push(curr);
                }
            }
        }
        return entityTiles;
    }
}
/// <reference path="../_references.ts" />
class Entity {
    constructor(name) {
        this._name = name;
        this._location = [];
        this._active = false;
    }
    get name() {
        return this._name;
    }
    set name(name) {
        this._name = name;
    }
    get length() {
        return this._name.length;
    }
    get location() {
        return this._location;
    }
    set location(location) {
        this._location = location;
        if (location.length < 2) {
            return;
        }
        this._head = location[0];
        this._dir = [location[1][0] - this._head[0], location[1][1] - this._head[1]];
    }
    locationIncludes(x, y) {
        for (let i = 0; i < this._location.length; i++) {
            if (this._location[i][0] == x && this._location[i][1] == y) {
                return true;
            }
        }
        return false;
    }
    get head() {
        return this._head;
    }
    set head(head) {
        this._head = head;
    }
    get tail() {
        return [this._head[0] + this.length * this._dir[0], this._head[1] + this.length * this._dir[1]];
    }
    get dir() {
        return this._dir;
    }
    set dir(dir) {
        this._dir = dir;
    }
    get reverseDir() {
        return [this._dir[0] * -1, this._dir[1] * -1];
    }
    get active() {
        return this._active;
    }
    set active(active) {
        this._active = active;
    }
}
/// <reference path="../_references.ts" />
class Ground extends Entity {
    constructor() {
        let randomLetter = Ground.alphabet[Math.floor(Math.random() * Ground.alphabet.length)];
        super(randomLetter);
    }
    playerCollision() {
        // this.name = " ";
        // let tile = game.tileMap.tiles[this.location[0][0]][this.location[0][1]];
        // tile.changeLetter(tile.letters.length-2, this.name);
    }
}
//private static readonly alphabet: string[] = "abcdefghijklmnopqrstuvwxyz".split('');
Ground.alphabet = "bcdfghjklmnpqrstvwxyz".split('');
/// <reference path="../_references.ts" />
class Character extends Entity {
    constructor(name) {
        super(name);
        this._inventory = [];
    }
    attack(enemy) {
        enemy._health -= this._attackDamage;
    }
    addItem(item) {
        this._inventory.push(item);
    }
    //TODO
    die() { }
    playerCollision() {
        while (this.isAlive() && game.player.isAlive()) {
            game.player.attack(this);
            this.attack(game.player);
            console.log("enemy battled");
        }
        if (game.player.isDead()) {
            game.player.die();
        }
    }
    isDead() {
        return !(this._health > 0);
    }
    isAlive() {
        return (this._health > 0);
    }
    get inventory() {
        return this._inventory;
    }
    get health() {
        return this._health;
    }
    set health(health) {
        this._health = health;
    }
    get attackDamage() {
        return this._attackDamage;
    }
    set attackDamage(attackDamage) {
        this._attackDamage;
    }
    inventoryToString() {
        let s = "Inventory: ";
        if (this._inventory.length > 0) {
            s += this._inventory[0].name;
            for (let i = 1; i < this._inventory.length; i++) {
                s += ", " + this._inventory[i].name;
            }
        }
        return s;
    }
}
/// <reference path="../_references.ts" />
class Player extends Character {
    constructor(name) {
        super(name);
        super._health = 10;
        super._attackDamage = 1;
        super._active = true;
        this._party = [];
        this._mana = new Manager();
    }
    get mana() {
        return this._mana;
    }
    playerCollision() { }
}
/// <reference path="../../_references.ts" />
class Goblin extends Character {
    constructor() {
        super("Goblin");
        super._health = 6;
        super._attackDamage = 2;
    }
}
/// <reference path="../../_references.ts" />
class Rat extends Character {
    constructor() {
        super("Rat");
        super._health = 1;
        super._attackDamage = 2;
    }
}
/// <reference path="../_references.ts" />
class Item extends Entity {
    constructor(name) {
        super(name);
    }
    playerCollision() {
        if (!game.player.inventory.includes(this)) {
            game.player.addItem(this);
            console.log(this.name + " added to inventory!");
        }
    }
}
/// <reference path="../_references.ts" />
class Door extends Entity {
    constructor() {
        super("Door");
    }
    playerCollision() {
        for (let item of game.player.inventory) {
            if (item.name == "Key") {
                //remove key from inventory, TODO
                game.newLevel();
            }
        }
    }
}
/// <reference path="../../_references.ts" />
class Key extends Item {
    constructor() {
        super("Key");
    }
}
/// <reference path="./controller/Game.ts" />
/// <reference path="./controller/Tile.ts" />
/// <reference path="./controller/TileMap.ts" />
/// <reference path="./model/Entity.ts" />
/// <reference path="./model/Ground.ts" />
/// <reference path="./model/Character.ts" />
/// <reference path="./model/Player.ts" />
/// <reference path="./model/enemies/Goblin.ts" />
/// <reference path="./model/enemies/Rat.ts" />
/// <reference path="./model/Item.ts" />
/// <reference path="./model/Door.ts" />
/// <reference path="./model/items/Key.ts" />
/// <reference path="../_references.ts" />
class Battle {
    constructor(health, enemyName, countdown) {
        this._startingHealth = health;
        this._health = health;
        this._enemyName = enemyName;
        this._countdown = countdown;
        this._skillQueue = new Array();
    }
    get countdown() {
        return this._countdown;
    }
    get skillQueue() {
        return this._skillQueue;
    }
    get enemyName() {
        return this._enemyName;
    }
    get totalCost() {
        let result = new Manager();
        for (let i = 0; i < this._skillQueue.length; i++) {
            result.add(this._skillQueue[i].cost);
        }
        return result;
    }
    endTurn() {
        for (let i = 0; i < this._skillQueue.length; i++) {
            this._skillQueue[i].execute(this);
        }
        this._player.mana.subtract(this.totalCost);
        this._skillQueue = [];
        if (this._health <= 0) {
            this.victory();
            return;
        }
        this._countdown--;
        if (this.countdown == 0) {
            this.gameover();
        }
    }
    damage(x) {
        this._health -= x;
    }
    spoils() {
        let result = new Manager(this._enemyName);
        let ratio = Math.abs(this._health) / this._startingHealth;
        ratio = Math.max(1, Math.floor(ratio));
        result.multiply(ratio);
        return result;
    }
    victory() {
        //victory code goes here
        this._player.mana.add(this.spoils());
        console.log("battle won!");
    }
    gameover() {
        //game over code goes here
        console.log("battle lost :(");
    }
}
/// <reference path="../_references.ts" />
class Manager {
    constructor(word = "") {
        this._a = 0;
        this._e = 0;
        this._i = 0;
        this._o = 0;
        this._u = 0;
        word = word.toLowerCase();
        for (let i = 0; i < word.length; i++) {
            let char = word.charAt(i);
            if (Manager.vowels.indexOf(char) != -1) {
                this.increase(char, 1);
            }
        }
    }
    get a() {
        return this._a;
    }
    set a(x) {
        this._a = x;
    }
    get e() {
        return this._e;
    }
    set e(x) {
        this._e = x;
    }
    get i() {
        return this._i;
    }
    set i(x) {
        this._i = x;
    }
    get o() {
        return this._o;
    }
    set o(x) {
        this._o = x;
    }
    get u() {
        return this._a;
    }
    set u(x) {
        this._u = x;
    }
    getAmount(which) {
        switch (which.toLowerCase()) {
            case "a":
                return this._a;
            case "e":
                return this._e;
            case "i":
                return this._i;
            case "o":
                return this._o;
            case "u":
                return this._u;
        }
    }
    setAmount(which, x) {
        switch (which.toLowerCase()) {
            case "a":
                this._a = x;
                break;
            case "e":
                this._e = x;
                break;
            case "i":
                this._i = x;
                break;
            case "o":
                this._o = x;
                break;
            case "u":
                this._u = x;
                break;
        }
    }
    increase(which, x) {
        switch (which.toLowerCase()) {
            case "a":
                this._a += x;
                break;
            case "e":
                this._e += x;
                break;
            case "i":
                this._i += x;
                break;
            case "o":
                this._o += x;
                break;
            case "u":
                this._u += x;
                break;
        }
    }
    decrease(which, x) {
        switch (which.toLowerCase()) {
            case "a":
                this._a -= x;
                break;
            case "e":
                this._e -= x;
                break;
            case "i":
                this._i -= x;
                break;
            case "o":
                this._o -= x;
                break;
            case "u":
                this._u -= x;
                break;
        }
    }
    add(other) {
        for (let letter in Manager.vowels) {
            this.increase(letter, other.getAmount(letter));
        }
    }
    subtract(other) {
        for (let letter in Manager.vowels) {
            this.decrease(letter, other.getAmount(letter));
        }
    }
    multiply(scalar) {
        scalar = Math.round(scalar);
        for (let letter in Manager.vowels) {
            this.setAmount(letter, this.getAmount(letter) * scalar);
        }
    }
    fitsInto(other) {
        for (let letter in Manager.vowels) {
            if (this.getAmount(letter) > other.getAmount(letter)) {
                return false;
            }
        }
        return true;
    }
    toString() {
        return "Mana (A: " + this._a + ", " + "E: " + this._e + ", " + "I: " + this._i + ", " + "O: " + this._o + ", " + "U: " + this._u + ")";
    }
}
Manager.vowels = ["a", "e", "i", "o", "u"];
/// <reference path="../_references.ts" />
class Skill {
    constructor(name, effect) {
        this._name = name;
        this._effect = effect;
        this._cost = new Manager(name);
    }
    get name() {
        return this._name;
    }
    get cost() {
        return this._cost;
    }
    execute(b) {
        this._effect.call(this, b);
    }
    static makeDamageEffect(damageAmount) {
        return function (b) {
            b.damage(damageAmount);
        };
    }
}
Skill.vowels = ["a", "e", "i", "o", "u"];
/// <reference path="../_references.ts" />
var skills = {};
function addSkill(s) {
    skills[s.name.toLowerCase()] = s;
}
function addSkills(...s) {
    for (let i = 0; i < s.length; i++) {
        addSkill(s[i]);
    }
}
addSkills(new Skill("Bash", Skill.makeDamageEffect(2)));
class CollisionMenu {
    constructor() {
        this.element = document.getElementById("collision-menu");
        this.colliding = game.colliding.filter(entity => entity.constructor.name !== "Ground");
    }
    //TODO: only showing the top entity of the last tile, pls fix
    getData() {
        let data;
        if (this.colliding.length > 0) {
            let name = this.colliding[this.colliding.length - 1].constructor.name.toLowerCase();
            data = xml.getChild(name);
            if (!data) {
                data = xml.getChild("default");
            }
            return data;
        }
        return null;
    }
    setArt(data) {
        let artContainer = document.getElementById("collision-art");
        if (data !== null) {
            let art = data.getChild("art").DOM.textContent;
            artContainer.innerHTML = "<pre>" + art + "</pre>";
        }
        else {
            artContainer.innerHTML = "";
        }
    }
    setInfo(data) {
        let infoContainer = document.getElementById("collision-info");
        if (data !== null) {
            let entity = this.colliding[this.colliding.length - 1];
            let info = entity.name;
            infoContainer.innerHTML = "<p>" + info + "</p>";
        }
        else {
            infoContainer.innerHTML = "";
        }
    }
    //pulling from xml over and over is bad for performance, TODO
    update() {
        this.colliding = game.colliding.filter(entity => entity.constructor.name !== "Ground");
        let data = this.getData();
        this.setArt(data);
        this.setInfo(data);
    }
}
class PlayerMenu {
    constructor() {
        this.element = document.getElementById("player-menu");
        this.update();
    }
    getData() {
        let data;
        let name = game.player.name.toLowerCase();
        data = xml.getChild(name);
        if (!data) {
            data = xml.getChild("default");
        }
        return data;
    }
    setArt(data) {
        let artContainer = document.getElementById("player-art");
        let art = data.getChild("art").DOM.textContent;
        artContainer.innerHTML = "<pre>" + art + "</pre>";
    }
    setInfo(data) {
        let infoContainer = document.getElementById("player-info");
        let info = game.player.name + ", Health: " + game.player.health + ", Attack: "
            + game.player.attackDamage + "\n" + game.player.mana.toString() + "\n" + game.player.inventoryToString();
        infoContainer.innerHTML = "<p>" + info + "</p>";
    }
    update() {
        let data = this.getData();
        if (data != null) {
            this.setArt(data);
            this.setInfo(data);
        }
    }
}
/// <reference path="../_references.ts" />
let game;
let xml;
let playerMenu;
let collisionMenu;
let music;
let seed = function (sketch) {
    let font;
    let padding;
    let marginY, marginX;
    let COLORS;
    let showEntities;
    let showMana;
    let locationTest;
    // Runs first.
    sketch.preload = function () {
        // customFont = sketch.loadFont("./assets/fonts/Erika_Ormig.ttf");
        xml = sketch.loadXML('./assets/game-entities.xml');
        music = sketch.createAudio('assets/music/Exploratory_Final.mp3');
        game = new Game();
    };
    // Runs once after preload().
    sketch.setup = function () {
        music.loop();
        playerMenu = new PlayerMenu();
        collisionMenu = new CollisionMenu();
        let canvas = sketch.createCanvas(1000, 1000);
        sketch.noLoop();
        canvas.parent('word-search');
        padding = 30;
        marginY = 10;
        marginX = 10;
        showEntities = false;
        showMana = false;
        locationTest = false;
        COLORS = {
            player: sketch.color(0, 0, 0),
            selected: sketch.color(160, 160, 160),
            active: sketch.color(120, 0, 120),
            empty: sketch.color(255, 255, 255),
        };
        sketch.resize();
    };
    //main loop of the application
    sketch.draw = function () {
        sketch.background(255);
        game.checkCollisions(game.player);
        for (let x = 0; x < game.tileMap.width; x++) {
            for (let y = 0; y < game.tileMap.height; y++) {
                let tile = game.tileMap.tiles[x][y];
                sketch.displayTile(tile, x, y);
            }
        }
        collisionMenu.update();
        playerMenu.update();
    };
    // Displays the rectangle and text of a Tile.
    sketch.displayTile = function (tile, x, y) {
        let offset = sketch.offsetMap(x, y);
        let xOff = offset[0];
        let yOff = offset[1];
        sketch.setRectStyle(tile);
        sketch.rect(marginX + x * padding + xOff, marginY + y * padding + yOff, padding, padding, 5); //5 is the roundess/radius of the corners
        sketch.setTextStyle(tile);
        sketch.text(tile.getTopLetter().toUpperCase(), marginX + x * padding + xOff, marginY + y * padding + yOff);
    };
    sketch.offsetMap = function (x, y) {
        let theta = (sketch.frameCount + x + y) / 10;
        let coord = [Math.cos(theta) * 5, Math.sin(theta) * 5];
        // return coord; //uncomment to animate
        return [0, 0];
    };
    sketch.setTextStyle = function (tile) {
        sketch.noStroke();
        sketch.textSize(16);
        // sketch.textFont(customFont);
        sketch.textFont("Courier");
        sketch.textAlign(sketch.CENTER, sketch.CENTER);
        if (tile.getTopLetter() == null) {
            tile.addLetter(" ");
        }
        if (tile.entities.includes(game.player)) {
            sketch.fill(255);
            sketch.textStyle(sketch.BOLD);
        }
        else {
            sketch.fill(0);
            sketch.textStyle(sketch.NORMAL);
        }
        sketch.showColliding(tile);
        if (showEntities) {
            sketch.showAllEntities(tile);
        }
        else if (showMana) {
            sketch.showAllMana(tile);
        }
    };
    sketch.setRectStyle = function (tile) {
        sketch.rectMode(sketch.CENTER);
        sketch.noStroke();
        if (game.selected.includes(tile)) {
            sketch.fill(COLORS.selected);
        }
        else if (tile.entities.includes(game.player)) {
            sketch.fill(COLORS.player);
            if (locationTest) {
                let loc = game.tileMap.getTileLocation(tile);
                if (game.player.locationIncludes(loc[0], loc[1])) {
                    sketch.stroke(sketch.color(0, 255, 255));
                }
            }
        }
        else {
            sketch.fill(COLORS.empty);
        }
    };
    sketch.showColliding = function (tile) {
        for (let entity of tile.entities) {
            if (game.colliding.includes(entity)) {
                sketch.textStyle(sketch.BOLD);
                return;
            }
        }
        sketch.textStyle(sketch.NORMAL);
    };
    sketch.showAllEntities = function (tile) {
        if (tile.entities.length > 1) {
            sketch.textStyle(sketch.BOLD);
        }
        else {
            sketch.textStyle(sketch.NORMAL);
        }
    };
    sketch.showAllMana = function (tile) {
        if (tile.getVowels().length > 0) {
            sketch.textStyle(sketch.BOLD);
        }
        else {
            sketch.textStyle(sketch.NORMAL);
        }
    };
    sketch.keyPressed = function () {
        if (sketch.keyCode === sketch.ENTER) {
            game.move(game.player, game.selected);
        }
        if (sketch.key == "e") { //keyCode 66 = "b"
            showEntities = !showEntities;
        }
        else if (sketch.key == "v") { //keyCode 74 = "l"
            showMana = !showMana;
        }
        else if (sketch.keyCode == 76) { //keyCode 74 = "l"
            locationTest = !locationTest;
        }
        else if (sketch.keyCode === 38) { //down arrow
            game.headshift(game.player, -1);
        }
        else if (sketch.keyCode === 40) { //up arrow
            game.headshift(game.player, 1);
        }
        else if (sketch.keyCode == 37) { //left arrow
            game.rotateDir(game.player, true);
        }
        else if (sketch.keyCode == 39) { //right arrow
            game.rotateDir(game.player, false);
        }
        sketch.draw();
        return false;
    };
    sketch.screenCoordToTile = function (screenX, screenY) {
        let coord = sketch.screenCoordSubmapper(screenX, screenY);
        let offset = sketch.offsetMap(coord[0], coord[1]);
        screenX -= offset[0];
        screenY -= offset[1];
        return sketch.screenCoordSubmapper(screenX, screenY);
    };
    sketch.screenCoordSubmapper = function (screenX, screenY) {
        let x = Math.round(sketch.map(screenX, marginX, marginX + (game.tileMap.width + 1) * padding, 0, game.tileMap.width + 1));
        let y = Math.round(sketch.map(screenY, marginY, marginY + (game.tileMap.height + 1) * padding, 0, game.tileMap.height + 1));
        return [x, y];
    };
    sketch.mouseDragged = function () {
        let mouseX = sketch.mouseX;
        let mouseY = sketch.mouseY;
        let coord = sketch.screenCoordToTile(mouseX, mouseY);
        let x = coord[0];
        let y = coord[1];
        if (x >= 0 && x < game.tileMap.width && y >= 0 && y < game.tileMap.height) {
            let tile = game.tileMap.tiles[x][y];
            if (!game.selected.includes(tile)) {
                game.selected.push(tile);
            }
        }
        sketch.draw();
    };
    // Repeat of mouseDragged, but for individual presses.
    sketch.mousePressed = function () {
        let mouseX = sketch.mouseX;
        let mouseY = sketch.mouseY;
        let coord = sketch.screenCoordToTile(mouseX, mouseY);
        let x = coord[0];
        let y = coord[1];
        if (x >= 0 && x < game.tileMap.width && y >= 0 && y < game.tileMap.height) {
            let tile = game.tileMap.tiles[x][y];
            if (!game.selected.includes(tile)) {
                game.selected.push(tile);
            }
            else {
                let index = game.selected.indexOf(tile);
                game.selected.splice(index, 1);
            }
        }
        sketch.draw();
    };
    // Resizes canvas to match wordsearch length.
    sketch.resize = function () {
        sketch.resizeCanvas(game.tileMap.width * padding + marginX, game.tileMap.height * padding + marginY);
    };
};
let main = new p5(seed);
