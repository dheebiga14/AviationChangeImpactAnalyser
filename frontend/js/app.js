
function updateClock(){const e=document.getElementById("topDate");if(e)e.textContent=new Date().toLocaleString("en-IN",{month:"short",day:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});}
updateClock();setInterval(updateClock,1000);
async function api(path){const r=await fetch(path);if(!r.ok)throw new Error("API "+r.status);return r.json();}
