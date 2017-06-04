// Martin Kersner, m.kersner@gmail.com
// 2017/05/07

var actionInterval = 20;

// generate several games
var numGames = 4;
var games  = new Array();

for (var i = 0; i < numGames; ++i) {
  var dinoName = ".dino" + i;
  games.push(new Runner(dinoName));
}

//var game = games[0];
var player = new Player();

function sigmoid(t) {
  return 1/(1+Math.pow(Math.E, -t));
}

// obstacle auxiliary variables
//var avg = [6.175325951887915,434.9119005894536,9.353512824597738,18.91190058945356,0.6445754341245818];
//var std = [0.11507956470875452,214.75567671662398,10.88515624967912,21.91747480737234,0.7992795658365198];

// Deep Q Learning parameters
var num_inputs = 5; // speed, obstacle distance, obstacle y-position
var num_actions = 2; // JUMP, IDLE, DUCK
var temporal_window = 1;
var network_size = num_inputs*temporal_window + num_actions*temporal_window + num_inputs;

var layer_defs = [];
layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:network_size});
layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
layer_defs.push({type:'fc', num_neurons: 50, activation:'relu'});
layer_defs.push({type:'regression', num_neurons:num_actions});

var tdtrainer_options = {learning_rate:0.01, momentum:0.9, batch_size:64, l2_decay:0.01};

var opt = {};
opt.temporal_window = temporal_window;
opt.experience_size = 30000;
opt.start_learn_threshold = 1000;
//opt.start_learn_threshold = 70;
opt.gamma = 0.7;
opt.learning_steps_total = 200000;
opt.learning_steps_burnin = 3000;
opt.epsilon_min = 0.05;
opt.epsilon_test_time = 0.05;
opt.layer_defs = layer_defs;
opt.tdtrainer_options = tdtrainer_options;
opt.random_action_distribution = [0.1, 0.9];

var brain = new deepqlearn.Brain(num_inputs, num_actions, opt);

function getObstacleType(obst) {
  if (obst.typeConfig.type == "CACTUS_LARGE") {
    return 0;
  } else if (obst.typeConfig.type == "CACTUS_SMALL") {
    return 1;
  } else if (obst.typeConfig.type == "PTERODACTYL") {
    return 2;
  }
}

function makeStep(idx) {
  var obstacleDetected = false;

  if (!games[idx].started) { // START GAME
    games[idx].playIntro();
    games[idx].play();
  } else if (games[idx].activated) { // PLAYING
    var currentSpeed = games[idx].currentSpeed;

    var gameStatus = [0, 1, 0, 0, 0];
    gameStatus[0] = currentSpeed / games[idx].config.MAX_SPEED;

    // NO OBSTACLES
    if (games[idx].horizon.obstacles.length == 0) {
      obstacleDetected = false;
    }
    // APPROACHING THE FIRST OBSTACLE
    else {
      var obst = games[idx].horizon.obstacles[0];
      var tRex_xPos = games[idx].tRex.xPos;

      gameStatus[1] = (obst.xPos - tRex_xPos)/games[idx].dimensions["WIDTH"];
      var tmpIdx = getObstacleType(games[idx].horizon.obstacles[0]);
      gameStatus[2+tmpIdx] = 1;

      if (tRex_xPos < obst.xPos) {
        obstacleDetected = true;
      }
    }

    //var gameStatus_avg = gameStatus.map(function(n, i) { return n - avg[i]; });
    //var gameStatus_norm = gameStatus_avg.map(function(n, i) { return n / std[i]; })
    //var gameStatus_sigm = gameStatus_norm.map(sigmoid);

    // FORWARD
    var action = brain.forward(gameStatus);

    if (action == 0)
      player.do(Player.actions.JUMP);
    else if (action == 1)
      player.do(Player.actions.IDLE);

    var nothing = true;

    if (obstacleDetected) {
      var obst0 = games[idx].horizon.obstacles[0];
      var tRex_xPos = games[idx].tRex.xPos;

      if ((tRex_xPos+50) >= (obst0.xPos + obst0.width)) {
        brain.backward(10.0);
        console.log(idx);
      }
      else {
        nothing = false;
      }
    }

    if (nothing) {
      brain.backward(0.0);
    }
  }
  // DINO DIED
  else {
    brain.backward(-1.0);
    games[idx].restart();
  }
}

setInterval(function() {
  makeStep(0);
  makeStep(1);
  makeStep(2);
  makeStep(3);
}, actionInterval);
