window.onload = function(){
  var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });

  function preload() {

      game.load.image('bg', 'assets/bg.jpg');
      game.load.image('bullet', 'assets/bullet.png');
      game.load.image('bullet-enemy', 'assets/bullet_enemy.png');
  		game.load.image('ship', 'assets/ship_one.png');
      game.load.image('enemy-orange-1', 'assets/orange_1.png');
      game.load.image('beam', 'assets/beams.png');

  }

  var player;
  var cursors;
  var fireButton;
  var bullets;
  var allyShootTimer;

  var enemies;
  var enemyBullets;
  var background;

  var MAXHEALTH = 100;

  function create() {

      //  We're going to be using physics, so enable the Arcade Physics system
      game.physics.startSystem(Phaser.Physics.ARCADE);

      //  A simple background for our game
      background = game.add.sprite(0, -1819 + 600, 'bg');

      // The player and its settings
      var playerOps = {
        health: MAXHEALTH,
        fireRate: 100,
        scale: 0.5,
        weapon: new Weapon.SingleBullet(game, 0, 100, 400)
      }
      player =  new Ship(game, game.world.width/2, game.world.height - 150, 'ship', playerOps, {});
      player.body.setSize(20, 30, 0,5);

      enemies = game.add.group();
      var enemyOps = {
        health: 1000,
        fireRate: 500,
        angle: 180,
        fireRate: 1000,
        weapon: new Weapon.SingleBullet(game, 0, 1500, 100)
      }

      enemy = new Ship(game, game.world.width/2, 150, 'enemy-orange-1', enemyOps, {});
      enemies.add(enemy);



      //  Our controls.
      cursors = game.input.keyboard.createCursorKeys();
      fireButton = game.input.keyboard.addKey(Phaser.Keyboard.CONTROL);

  }

  function update() {

  		moveBackground(background);


      //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
      game.physics.arcade.overlap(enemies, bullets, hitEnemies, null, this);
      game.physics.arcade.overlap(enemyBullets, player, hitEnemies, null, this);

      //  Reset the players velocity (movement)
      player.body.velocity.setTo(0,0);


      handleMovement();

      //  Fire bullet
      if (fireButton.isDown) {
          fireBullet();
      }

      handleHealthBar(player, "bottom");
      handleHealthBar(enemy, "top");

  }

  function render(){
    game.debug.bodyInfo(player, 32, 32);

    game.debug.body(player);
    game.debug.body(enemy);
  }

  function hitEnemies(enemy, bullet){
    enemy.health -= bullet.power || 1;
    bullet.kill();
  }

  function handleHealthBar(actor, position){

    var hp = actor.health/actor.maxHealth * 100;
    var colour = utils.rgbToHex((hp > 50 ? 1-2*(hp-50)/100.0 : 1.0) * 255, (hp > 50 ? 1.0 : 2*hp/100.0) * 255, 0);

    var x,y;
    if(position === "top"){
      y = 20;
    } else {
      y = game.world.height - 20;
    }
    x = 0;

    if(!actor.healthbar){
      //initialise healthbar
      actor.healthbar = game.add.graphics(0, 0);
    }

    actor.healthbar.clear();
    actor.healthbar.beginFill(colour);
    actor.healthbar.lineStyle(10, colour, 1);
    actor.healthbar.moveTo(x,y);
    actor.healthbar.lineTo(actor.health/actor.maxHealth * game.world.width, y);
    actor.healthbar.endFill();

    actor.lastHealth = actor.health;

  }

  function handleMovement(){
    var cursorPress = false

    if (cursors.left.isDown){
        cursorPress = true;

        //  Move to the left
        player.body.velocity.x = -150;
    }

    if (cursors.right.isDown){
        cursorPress = true;
        player.body.velocity.x = 150;
    }

    if (cursors.up.isDown){
        cursorPress = true;
        player.body.velocity.y = -150
    }

    if (cursors.down.isDown){
        cursorPress = true;
        player.body.velocity.y = 150
    }

    if(!cursorPress){
        //  Stand still
        player.frame = 4;
    }
  }

  function fireBullet() {
    player.weapon.fire({x:player.x, y:player.y});
  }

  function moveBackground(bg){
  	if(bg.y <= 600){
  		bg.y += 0.1
  	}
  }

}

Ship = function(game, x, y, sprite, options, actions){
  Phaser.Sprite.call(this, game, x, y, sprite);

  if(!options){
    options = {}
  }

  options.health = options.health || 100;
  this.health = options.health;
  this.maxHealth = options.health;
  this.lastHealth = options.health;

  options.maxHealth = options.maxHealth || options.health;
  this.maxHealth = options.maxHealth;


  options.fireRate = options.fireRate || 100;
  this.fireRate = options.fireRate
  this.nextFire = 0;

  options.scale = options.scale || 1;
  this.scale.setTo(options.scale, options.scale);

  options.anchor = options.anchor || [0.5,0.5]
  this.anchor.setTo(options.anchor[0], options.anchor[1]);

  options.angle = options.angle || 0;
  this.angle = options.angle;

  if(options.weapon){
    this.weapon = options.weapon;
  }

  game.physics.arcade.enable(this);

  this.body.collideWorldBounds = true;

  game.add.existing(this);
}
Ship.prototype = Object.create(Phaser.Sprite.prototype);
Ship.prototype.constructor = Ship;


Bullet = function(game, sprite) {
  Phaser.Sprite.call(this, game, 0,0, sprite);
  this.anchor.set(0.5);
  this.checkWorldBounds = true;
  this.outOfBoundsKill = true;
  this.exists = false;

  this.tracking = true;
  this.scaleSpeed = 0;
}
Bullet.prototype = Object.create(Phaser.Sprite.prototype);
Bullet.prototype.constructor = Bullet;
Bullet.prototype.fire = function(x, y, angle, speed, gx, gy) {
  gx = gx || 0;
  gy = gy || 0;

  this.reset(x,y);
  this.scale.set(1);

  this.game.physics.arcade.velocityFromAngle(angle, speed, this.body.velocity);

  this.angle = angle;

  this.body.gravity.set(gx, gy);
}
Bullet.prototype.update = function(){
  if(this.tracking){
    this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x);
  }
  if(this.scaleSpeed>0){
    this.scale.x += this.scaleSpeed;
    this.scale.y += this.scaleSpeed;
  }
}

var Weapon = {};
Weapon.SingleBullet = function (game, nextFire, bulletSpeed, fireRate) {

    Phaser.Group.call(this, game, game.world, 'Single Bullet', false, true, Phaser.Physics.ARCADE);

    this.nextFire = nextFire || 0;
    this.bulletSpeed = bulletSpeed || 600;
    this.fireRate = fireRate || 100;

    for (var i = 0; i < 64; i++)
    {
        this.add(new Bullet(game, 'bullet'), true);
    }

    return this;

};
Weapon.SingleBullet.prototype = Object.create(Phaser.Group.prototype);
Weapon.SingleBullet.prototype.constructor = Weapon.SingleBullet;

Weapon.SingleBullet.prototype.fire = function (source) {

    if (this.game.time.time < this.nextFire) { return; }

    var x = source.x + 10;
    var y = source.y + 10;

    this.getFirstExists(false).fire(x, y, -90, this.bulletSpeed, 0, 0);

    this.nextFire = this.game.time.time + this.fireRate;

};



var utils = {
  rgbToHex: function (r, g, b) {
    return "0x" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
}
