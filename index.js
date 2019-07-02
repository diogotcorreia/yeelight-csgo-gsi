// Imports
const YeeDevice = require('yeelight-platform').Device;
const server = require('./server');

// Config
const HOST = '192.168.1.101';

// Global variables
const device = new YeeDevice({ host: HOST, port: 55443 });
var ID = 1;

var ingame = true;
var currentGamePhase = '';
var currentRoundPhase = '';
var bombPlanted = false;
var bombTimer = null;

function handleGSI(data) {
  if (data.map) {
    ingame = true;
  } else if (ingame) {
    ingame = false;
    currentGamePhase = '';
    currentRoundPhase = '';
    bombPlanted = false;
    device.sendCommand({
      id: ID++,
      method: 'set_scene',
      params: [
        'cf',
        0,
        0,
        `5000, 1, ${getColorFromRGB(255, 0, 0)}, 100, 5000, 1, ${getColorFromRGB(
          0,
          255,
          0
        )}, 10, 5000, 1, ${getColorFromRGB(0, 0, 255)},100, 5000, 1, ${getColorFromRGB(
          255,
          255,
          0
        )}, 100`,
      ],
    });
  }

  if (ingame) {
    handleGamePhase(data.map.phase);
    handleRoundPhase(data.round ? data.round.phase || '' : '', data);
    handleBomb(data.round ? data.round.bomb || '' : '', data);
  }
}

server(handleGSI);

function handleGamePhase(data) {
  if (data === currentGamePhase) return;
  currentGamePhase = data;
  if (data == 'warmup')
    device.sendCommand({
      id: ID++,
      method: 'set_rgb',
      params: [getColorFromRGB(255, 117, 186), 'smooth', 500],
    });
}

function handleRoundPhase(data, allData) {
  if (data === currentRoundPhase) return;
  currentRoundPhase = data;
  if (data == 'freezetime')
    device.sendCommand({
      id: ID++,
      method: 'set_rgb',
      params: [getColorFromRGB(0, 33, 255), 'smooth', 500],
    });
  else if (data == 'live')
    device.sendCommand({
      id: ID++,
      method: 'set_rgb',
      params: [getColorFromRGB(123, 0, 255), 'smooth', 500],
    });
  else if (data == 'over') {
    bombPlanted = false;
    if (bombTimer !== null) {
      clearTimeout(bombTimer);
      bombTimer = null;
    }
    if (allData.round.win_team == 'T')
      device.sendCommand({
        id: ID++,
        method: 'set_rgb',
        params: [getColorFromRGB(255, 182, 0), 'smooth', 500],
      });
    else
      device.sendCommand({
        id: ID++,
        method: 'set_rgb',
        params: [getColorFromRGB(0, 120, 255), 'smooth', 500],
      });
  }
}

function handleBomb(bombStatus, data) {
  if (bombStatus !== 'planted') {
    bombPlanted = false;
    return;
  }
  if (bombPlanted) return;
  bombPlanted = true;
  var timeLeft = 40 - (new Date().getTime() / 1000 - data.provider.timestamp);
  bombTimer = setTimeout(() => {
    device.sendCommand({
      id: ID++,
      method: 'set_rgb',
      params: [getColorFromRGB(255, 0, 255), 'sudden', 0],
    });
    bombTimer = null;
  }, (timeLeft - 5) * 1000);
  sendBombTickingFlow();
}

device.connect();
device.on('connected', () => {
  console.log('Connected to Yeelight at ' + HOST);
});

function getColorFromRGB(r, g, b) {
  return r * 65536 + g * 256 + b;
}

function sendBombTickingFlow() {
  device.sendCommand({
    id: ID++,
    method: 'start_cf',
    params: [
      0,
      0,
      `600, 1, ${getColorFromRGB(255, 0, 0)}, 100, 400, 1, ${getColorFromRGB(255, 153, 0)}, 100`,
    ],
  });
}
