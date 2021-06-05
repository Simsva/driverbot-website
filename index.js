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
  
  format = `<span class="${severityTags[severity]}">[${getTimestamp()} ${severityTags[severity]}] ${message}</span><br/>`;

  if(pageConsole == null)
    pageConsole = document.getElementById("console");
  pageConsole.innerHTML += format;
  pageConsole.scrollTop = pageConsole.scrollHeight;
}

function onConnect() {
  log("Connected!");
  clientConnected = true;

  // Subscribe for logging
  client.subscribe("speed");
  client.subscribe("direction");
  client.subscribe("hello");

  // Default stats
  client.send("speed", "0");
  client.send("direction", "90");
}

// This runs in another dimension or something
function onConnectionLost(response) {
  clientConnected = false;

  if(response.errorCode !== 0) {
    log("Connection lost: " + response.errorMessage, 1);
  } else {
    log("Disconnected", 0);
  }
}

function onMessageArrived(message) {
  let blacklistedTopics = document.getElementById("blacklistedTopics").value.split(/,/);
  if(!(blacklistedTopics.includes(message.destinationName)))
    log("Message: " + message.destinationName + "|" + message.payloadString, 0);

  switch(message.destinationName) {
  case "speed":
    let signedSpeed = parseInt(message.payloadString)/1023 * 100;
    let speedString = signedSpeed < 0 ? " backwards" : " forwards";
    if(signedSpeed == 0) speedString = "";

    document.getElementById("currentSpeed").innerText = Math.abs(signedSpeed).toFixed(2) + "%" + speedString;
    break;

  case "direction":
    let signedDirection = parseInt(message.payloadString) - 90;
    let directionString = signedDirection > 0 ? " left" : " right";
    if(signedDirection == 0) directionString = "";

    document.getElementById("currentDirection").innerHTML = Math.abs(signedDirection).toString() + "&deg;" + directionString;
    break;
  }
}
