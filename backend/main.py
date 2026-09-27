from pathlib import Path
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, FileResponse
import asyncio

from backend.api.change_routes import router as change_router
from backend.api.flight_routes import router as flight_router
from backend.api.analysis_routes import router as analysis_router
from backend.api.report_routes import router as report_router
from backend.api.test_routes import router as test_router
from backend.api.status_routes import router as status_router

from backend.simulator.flight_simulator import FlightSimulator


app = FastAPI(
    title="Safety-Critical Aviation Software Change Impact Analyzer",
    description="AI-enabled software change impact analysis for a synthetic aviation environment.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(change_router)
app.include_router(flight_router)
app.include_router(analysis_router)
app.include_router(report_router)
app.include_router(test_router)
app.include_router(status_router)


# Serve frontend and root-level assets
app.mount(
    "/frontend",
    StaticFiles(directory="frontend", html=True),
    name="frontend"
)
app.mount(
    "/css",
    StaticFiles(directory="frontend/css"),
    name="css"
)
app.mount(
    "/js",
    StaticFiles(directory="frontend/js"),
    name="js"
)
app.mount(
    "/images",
    StaticFiles(directory="frontend/images"),
    name="images"
)


from backend.simulator.flight_simulator import shared_simulator

# Pre-warm ML model cache
try:
    from backend.ai.risk_model import RiskModel
    RiskModel().load()
except Exception:
    pass


@app.get("/")
def home():
    return RedirectResponse(url="/frontend/dashboard.html")


@app.get("/{page_name}.html")
def serve_root_html(page_name: str):
    file_path = Path("frontend") / f"{page_name}.html"
    if file_path.exists():
        return RedirectResponse(url=f"/frontend/{page_name}.html")
    raise HTTPException(status_code=404, detail="Page not found")




@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "Aviation Change Impact Analyzer"
    }


@app.websocket("/ws/flights")
async def flight_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            shared_simulator.update_flights()
            data = {
                "flights": shared_simulator.get_snapshot(),
                "simulation": shared_simulator.get_status()
            }
            await websocket.send_json(data)
            await asyncio.sleep(1)
    except Exception:
        try:
            await websocket.close()
        except Exception:
            pass