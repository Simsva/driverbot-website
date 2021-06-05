// TODO: Move to a config file
const host = "127.0.0.1";
const port = 8883;
const clientId = "controller";

let pageConsole = null;

let client = new Paho.MQTT.Client(host, port, clientId);
let clientConnected = false;

client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

client.connect({onSuccess: onConnect});

// TODO: Does Date.format exist?
function getTimestamp() {
  let time = new Date(Date.now());
  return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`;
}

function log(message, severity=0) {
  const consoleFunctions = [console.log, console.warn, console.error];
  const severityTags = ["INFO", "WARN", "ERR"];

  // Log in developer console
  if(severity < consoleFunctions.length) {
    consoleFunctions[severity](message);
  } else {
    console.error("Invalid severity level!");
  }
  
  // Update on-page console
  format = `<span class="${severityTags[severity]}">[${getTimestamp()} ${severityTags[severity]}] ${message}</span><br/>`;

  if(pageConsole == null)
    pageConsole = document.getElementById("console");
  pageConsole.innerHTML += format;

  // Automatically scroll to the bottom
  pageConsole.scrollTop = pageConsole.scrollHeight;
}

function updateUI(speed, direction) {
  // Speed
  let signedSpeed = speed/1023 * 100;
  let speedString = signedSpeed < 0 ? " backwards" : " forwards";
  if(signedSpeed == 0) speedString = "";

  document.getElementById("currentSpeed").innerText = Math.abs(signedSpeed).toFixed(2) + "%" + speedString;
  
  // Direction
  let signedDirection = direction - 90;
  let directionString = signedDirection > 0 ? " left" : " right";
  if(signedDirection == 0) directionString = "";

  document.getElementById("currentDirection").innerHTML = Math.abs(signedDirection).toString() + "&deg;" + directionString;
}

function onConnect() {
  log("Connected!");
  clientConnected = true;

  // ESP8266 sends "hello" on startup
  client.subscribe("hello");

  // Default inputs
  client.send("data", new Uint8Array([0, 0, 90]));
}

// This runs in another dimension or something
function onConnectionLost(response) {
  clientConnected = false;

  if(response.errorCode !== 0) {
    log("Connection lost: " + response.errorMessage, 2);
  } else {
    log("Connection lost!", 2);
  }
}

function onMessageArrived(message) {
  let blacklistedTopics = document.getElementById("blacklistedTopics").value.split(/,/);
  if(!blacklistedTopics.includes(message.destinationName))
    log("Message: " + message.destinationName + "|" + message.payloadString, 0);
}
