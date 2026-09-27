
let socket=null,reconnectTimer=null;
function updateConnection(s){const e=document.getElementById("connectionStatus");if(e)e.textContent=s}
function connectFlightWebSocket(){updateConnection("CONNECTING...");const p=location.protocol==="https:"?"wss":"ws";socket=new WebSocket(`${p}://${location.host}/ws/flights`);socket.onopen=()=>{updateConnection("● LIVE");document.getElementById("streamStatus").textContent="Connected"};socket.onmessage=e=>{try{const d=JSON.parse(e.data);renderFlightCards(d); }catch(err){console.error(err)}};socket.onerror=()=>updateConnection("ERROR");socket.onclose=()=>{updateConnection("DISCONNECTED");document.getElementById("streamStatus").textContent="Reconnecting";clearTimeout(reconnectTimer);reconnectTimer=setTimeout(connectFlightWebSocket,3000)}}
connectFlightWebSocket();
