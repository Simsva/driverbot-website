let interval = null;
window.addEventListener("load", () => {
  interval = setInterval(getInput, 50);
});

window.addEventListener("gamepadconnected", (e) => {
  log(`Gamepad ${e.gamepad.index} (${e.gamepad.id}) connected`);
});

window.addEventListener("gamepaddisconnected", (e) => {
  log(`Gamepad ${e.gamepad.index} (${e.gamepad.id}) disconnected`);
});

// Store all currently pressed keys in pressed
let pressed = {};
window.addEventListener("keydown", (e) => {
  e = e || window.event;
  pressed[e.keyCode] = true;
});

window.addEventListener("keyup", (e) => {
  e = e || window.event;
  delete pressed[e.keyCode];
});

// Un-press all keys on lost focus
window.addEventListener("blur", () => (pressed = {}), false);

function clamp(x, a = 0, b = 1) {
  return Math.max(a, Math.min(x, b));
}

function parseInput(fwAxis, lrAxis) {
  let bytes = [];
  bytes[0] = fwAxis & 0xff;
  bytes[1] = (fwAxis >> 8) & 0xff;
  bytes[2] = lrAxis & 0xff;
  return bytes;
}

// Determine currentGamepad on (dis)connect
function getCurrentGamepad() {
  return Array.from(navigator.getGamepads()).find((x) => x != null);
}

// Left Analog Stick + Right Trigger
function schemeTrigger() {
  let currentGamepad = getCurrentGamepad();
  if (currentGamepad == null) return [0, 90];

  let lTrigger = -currentGamepad.buttons[6].value;
  let rTrigger = currentGamepad.buttons[7].value;
  let xAxis = -currentGamepad.axes[0];

  let fwAxis = Math.round((rTrigger + lTrigger) * 1023);
  let lrAxis = Math.round(xAxis * 90 + 90);

  return [fwAxis, lrAxis];
}

// Only Left Analog Stick
function schemeLeftAnalog() {
  let currentGamepad = getCurrentGamepad();
  if (currentGamepad == null) return [0, 90];

  let xAxis = currentGamepad.axes[0];
  let yAxis = -currentGamepad.axes[1];

  let uFwAxis = Math.round(
    1023 * clamp(Math.sqrt(Math.pow(xAxis, 2) + Math.pow(yAxis, 2)))
  );
  let fwAxis;
  // Minimum speed = 100
  if (uFwAxis < 100) fwAxis = 0;
  else fwAxis = Math.sign(yAxis) * uFwAxis;

  let lrAxis = Math.round(Math.abs((Math.atan2(yAxis, xAxis) * 180) / Math.PI));

  return [fwAxis, lrAxis];
}

// WASD
function schemeKeyboard() {
  let fwAxis = 0,
    lrAxis = 90;
  if ("W".charCodeAt(0) in pressed) fwAxis = 1023;
  else if ("S".charCodeAt(0) in pressed) fwAxis = -1023;

  if ("A".charCodeAt(0) in pressed) lrAxis = 180;
  else if ("D".charCodeAt(0) in pressed) lrAxis = 0;

  return [fwAxis, lrAxis];
}

let oldData = "";
function getInput() {
  const schemes = {
    trigger: schemeTrigger,
    stick: schemeLeftAnalog,
    keyboard: schemeKeyboard,
  };

  let fwAxis = 0,
    lrAxis = 90;
  let data = parseInput(fwAxis, lrAxis);

  let scheme = document.getElementById("controlScheme").value;
  if (scheme != null && scheme !== undefined) {
    [fwAxis, lrAxis] = schemes[scheme]();
    bytes = parseInput(fwAxis, lrAxis);
    data = String.fromCharCode.apply(null, bytes);
  }

  if (clientConnected && data !== oldData) {
    log(`Data: ${fwAxis}|${lrAxis} (${data})`);
    updateUI(fwAxis, lrAxis);

    client.send("data", new Uint8Array(bytes));
    oldData = data;
  }
}
