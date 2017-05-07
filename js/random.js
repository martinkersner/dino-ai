// Martin Kersner, m.kersner@gmail.com
// 2017/05/07

var game = window.dinoGame;
var player = new Player();

var actionInterval = 150;

setInterval(function()
  {
    if (!game.started) { // START GAME
      game.playIntro();
      game.play();
    } else if (game.activated) { // PLAYING
      var r = Math.random();

      // uniform distribution of three actions (IDLE, JUMP and DUCK)
      //if (r < 0.33)
      //  player.do(Player.actions.IDLE);
      //else if (r < 0.66)
      //  player.do(Player.actions.JUMP);
      //else
      //  player.do(Player.actions.DUCK);
      
      // uniform distribution of two actions (JUMP and DUCK)
      if (r < 0.5) 
        player.do(Player.actions.JUMP);
      else
        player.do(Player.actions.DUCK);
    }
    else { // DIED
      game.restart();
    }
  }, actionInterval);
