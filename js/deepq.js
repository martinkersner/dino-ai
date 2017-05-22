// Martin Kersner, m.kersner@gmail.com
// 2017/05/07

var game = window.dinoGame;
var player = new Player();
var clock = 0;

var actionInterval = 50;

function sigmoid(t) {
  return 1/(1+Math.pow(Math.E, -t));
}

// obstacle auxiliary variables
var obstacleDetected = false;
var obstacle_xPos;
var obst;
var trex_xPos;
var feature_history = [];
//var avg = [6.175325951887915,434.9119005894536,9.353512824597738,18.91190058945356,0.6445754341245818,553.1105623705591,5.0758324040146565,10.260474749083958,0.3466624183527163]
//var std = [0.11507956470875452,214.75567671662398,10.88515624967912,21.91747480737234,0.7992795658365198,95.53521060230698,9.29158670644035,18.724881209875324,0.6664138865328865];
var avg = [6.175325951887915,434.9119005894536,9.353512824597738,18.91190058945356,0.6445754341245818];//,553.1105623705591,5.0758324040146565,10.260474749083958,0.3466624183527163]
var std = [0.11507956470875452,214.75567671662398,10.88515624967912,21.91747480737234,0.7992795658365198];//,95.53521060230698,9.29158670644035,18.724881209875324,0.6664138865328865];


// Deep Q Learning parameters
var num_inputs = 5; // speed, obstacle distance, obstacle y-position
var num_actions = 2; // JUMP, DUCK, IDLE
var temporal_window = 3; // amount of temporal memory. 0 = agent lives in-the-moment :)
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
var tdtrainer_options = {learning_rate:0.01, momentum:0.9, batch_size:64, l2_decay:0.01};

var opt = {};
opt.temporal_window = temporal_window;
opt.experience_size = 30000;
opt.start_learn_threshold = 1000;
//opt.start_learn_threshold = 10;
opt.gamma = 0.7;
opt.learning_steps_total = 200000;
opt.learning_steps_burnin = 3000;
opt.epsilon_min = 0.05;
opt.epsilon_test_time = 0.05;
opt.layer_defs = layer_defs;
opt.tdtrainer_options = tdtrainer_options;

var brain = new deepqlearn.Brain(num_inputs, num_actions, opt);

function getObstacleType(obst) {
  if (obst.typeConfig.type == "CACTUS_LARGE") {
    return 1;
  } else if (obst.typeConfig.type == "CACTUS_SMALL") {
    return 2;
  } else if (obst.typeConfig.type == "PTERODACTYL") {
    return 3;
  }
}

setInterval(function()
  {
    if (!game.started) { // START GAME
      game.playIntro();
      game.play();
    } else if (game.activated) { // PLAYING

      currentSpeed = game.currentSpeed;

      gameStatus = [0,
                    game.dimensions["WIDTH"], 0, 0, 0, // the first obstacle
      ];
                    //game.dimensions["WIDTH"], 0, 0, 0]; // the second obstacle
      gameStatus[0] = currentSpeed;

      // NO OBSTACLES
      if (game.horizon.obstacles.length == 0) {
        obstacleDetected = false;
      }
      // APPROACHING THE FIRST OBSTACLE
      //else if (game.horizon.obstacles.length == 1) {
      else {
        obst = game.horizon.obstacles[0];
        trex_xPos = game.tRex.xPos;

        gameStatus[1] = obst.xPos - trex_xPos;
        gameStatus[2] = obst.typeConfig.width;
        gameStatus[3] = obst.typeConfig.height;
        gameStatus[4] = getObstacleType(obst);

        if (trex_xPos < obst.xPos) {
          obstacleDetected = true;
        }
      }
      // APPROACHING THE SECOND OBSTACLE
      //else if (game.horizon.obstacles.length >= 2) {
        //obst0 = game.horizon.obstacles[0];
        //obst1 = game.horizon.obstacles[1];
        //trex_xPos = game.tRex.xPos;

        //gameStatus[1] = obst0.xPos - trex_xPos;
        //gameStatus[2] = obst0.typeConfig.width;
        //gameStatus[3] = obst0.typeConfig.height;
        //gameStatus[4] = getObstacleType(obst0);

        //gameStatus[5] = obst1.xPos - trex_xPos;
        //gameStatus[6] = obst1.typeConfig.width;
        //gameStatus[7] = obst1.typeConfig.height;
        //gameStatus[8] = getObstacleType(obst1);

        //if (trex_xPos < obst0.xPos || trex_xPos < obst1.xPos) {
          //obstacleDetected = true;
        //}
      //}

      //feature_history.push(gameStatus);
      var gameStatus_avg = gameStatus.map(function(n, i) { return n - avg[i]; });
      var gameStatus_norm = gameStatus_avg.map(function(n, i) { return n / std[i]; })
      var gameStatus_sigm = gameStatus_norm.map(sigmoid);
      var action = brain.forward(gameStatus_sigm);

      if (action == 0)
        player.do(Player.actions.JUMP);
      else if (action == 1)
        player.do(Player.actions.IDLE);
      //else if (action == 2)
        //player.do(Player.actions.DUCK);

      if (obstacleDetected) {
          var obst0 = game.horizon.obstacles[0];
          var tRex_xPos = game.tRex.xPos;

          if (tRex_xPos >= obst0.xPos) {
            //console.log("positive reward 1");
            brain.backward(5);
            //brain.backward(50);
          }

          if (tRex_xPos >= (obst0.xPos + obst0.width)) {
            //console.log("positive reward 2");
            brain.backward(10);
            //brain.backward(50);
          }
      }
    }
    else { // DINO DIED
      //console.log("negative reward");
      //if (game.horizon.obstacles[0].xPos;
      brain.backward(-1.0);
      game.restart();
    }

  clock +=1;
  }, actionInterval);
