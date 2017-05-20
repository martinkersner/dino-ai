// Martin Kersner, m.kersner@gmail.com
// 2017/05/07

var game = window.dinoGame;
var player = new Player();
var clock = 0;

var actionInterval = 50;
var distSpeedThreshold = 13;

// obstacle auxiliary variables
var obstacleDetected = false;
var obstacle_xPos;
var obstacleHeight;
var obstacleWidth;
var obstacleType;

// Deep Q Learning parameters
var num_inputs = 5; // speed, obstacle distance, obstacle y-position
var num_actions = 3; // JUMP, DUCK, IDLE
var temporal_window = 5; // amount of temporal memory. 0 = agent lives in-the-moment :)
var network_size = num_inputs*temporal_window + num_actions*temporal_window + num_inputs;

// the value function network computes a value of taking any of the possible actions
// given an input state. Here we specify one explicitly the hard way
// but user could also equivalently instead use opt.hidden_layer_sizes = [20,20]
// to just insert simple relu hidden layers.
var layer_defs = [];
layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:network_size});
layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
layer_defs.push({type:'regression', num_neurons:num_actions});

// options for the Temporal Difference learner that trains the above net
// by backpropping the temporal difference learning rule.
var tdtrainer_options = {learning_rate:0.001, momentum:0.0, batch_size:64, l2_decay:0.01};

var opt = {};
opt.temporal_window = temporal_window;
opt.experience_size = 30000;
opt.start_learn_threshold = 1000;
opt.gamma = 0.7;
opt.learning_steps_total = 200000;
opt.learning_steps_burnin = 3000;
opt.epsilon_min = 0.05;
opt.epsilon_test_time = 0.05;
opt.layer_defs = layer_defs;
opt.tdtrainer_options = tdtrainer_options;

var brain = new deepqlearn.Brain(num_inputs, num_actions, opt);

setInterval(function()
  {
    if (!game.started) { // START GAME
      game.playIntro();
      game.play();
    } else if (game.activated) { // PLAYING

      currentSpeed = game.currentSpeed;

      gameStatus = [0, 600, 0, 0, 0]; // 600 is constant width of game
      gameStatus[0] = currentSpeed;

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
        obstacleHeight = obst.typeConfig.height;
        obstacleWidth = obst.typeConfig.width;

        if (obst.typeConfig.type == "CACTUS_LARGE") {
          obstacleType = 1;
        } else if (obst.typeConfig.type == "CACTUS_SMALL") {
          obstacleType = 2;
        } else if (obst.typeConfig.type == "PTERODACTYL") {
          obstacleType = 3;
        }

        gameStatus[1] = obstacleDistance;
        gameStatus[2] = obstacleHeight;
        gameStatus[3] = obstacleWidth;
        gameStatus[4] = obstacleType;
      }

      var action = brain.forward(gameStatus);

      if (action == 0)
        player.do(Player.actions.JUMP);
      else if (action == 1)
        player.do(Player.actions.DUCK);
      else if (action == 2)
        player.do(Player.actions.IDLE);

      if (obstacleDetected) {
        if (game.tRex.xPos > obst.xPos) {
          console.log("positive reward 1");
          brain.backward(0.5);
        }

        if (game.tRex.xPos > obst.xPos + obst.width) {
          console.log("positive reward 2");
          brain.backward(0.5);
        }

        if (game.tRex.yPos > obst.yPos && game.tRex.xPos > obst.xPos) {
          console.log("positive reward 3");
          brain.backward(1);
        }
      }
      //else {
        //brain.backward(game.distanceRan*0.00025);
      //}
    }
    else { // DINO DIED
      brain.backward(-1.0);
      game.restart();
    }

  clock +=1;
  }, actionInterval);
