import os, subprocess, time

html_content = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="frontend/css/leaflet.css">
  <script src="frontend/js/leaflet.js"></script>
  <style>
    body { margin: 0; background: #020914; }
    #map { width: 1000px; height: 500px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { attributionControl: false }).setView([25, 60], 3);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16 }).addTo(map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16 }).addTo(map);
  </script>
</body>
</html>"""

with open('test_esri.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

cmd = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    '--headless=new',
    '--disable-gpu',
    '--window-size=1020,540',
    '--screenshot=C:/Users/dheebiga/OneDrive/Desktop/Aviation/esri_test.png',
    'http://127.0.0.1:8000/frontend/../test_esri.html'
]
subprocess.run(cmd)
time.sleep(2)
print('esri_test.png size:', os.path.getsize('esri_test.png') if os.path.exists('esri_test.png') else 0)
