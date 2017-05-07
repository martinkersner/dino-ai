// Martin Kersner, m.kersner@gmail.com
// 2017/05/07

var game = window.dinoGame;
var player = new Player();

var actionInterval = 50;
var distSpeedThreshold = 13;

// obstacle auxiliary variables
var obstacleDetected = false;
var obstacle_xPos;

setInterval(function()
  {
    if (!game.started) { // START GAME
      game.playIntro();
      game.play();
    } else if (game.activated) { // PLAYING

      currentSpeed = game.currentSpeed;
      tRex_yPos = 93 - game.tRex.yPos; // game default is 93

      // NO OBSTACLES
      if (game.horizon.obstacles.length == 0) {
        obstacleDetected = false;
      }
      // APPROACHING FIRST OBSTACLE
      else if (game.horizon.obstacles.length > 0) {
        obstacle_xPos = game.horizon.obstacles[0].xPos + game.horizon.obstacles[0].width;

        if (game.tRex.xPos < obstacle_xPos) {
          obstacleDetected = true;
          obst = game.horizon.obstacles[0];
        }
      }
      // APPROACHING SECOND OBSTACLE
      else if (game.horizon.obstacles.length > 1) {
        obstacle_xPos = game.horizon.obstacles[0].xPos;

        if (game.tRex.xPos > obstacle_xPos) {
          obstacleDetected = true;
          obst = game.horizon.obstacles[1];
        }
      }

      if (obstacleDetected) {
        obstacleDistance = obst.xPos - game.tRex.xPos;
        if ((obstacleDistance/currentSpeed) < distSpeedThreshold)
          player.do(Player.actions.JUMP);
      }
    }
    else { // DIED
      game.restart();
    }
  }, actionInterval);
