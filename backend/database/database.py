from pathlib import Path
import sqlite3


BASE_DIR = Path(__file__).resolve().parents[2]

DATABASE_DIR = BASE_DIR / "data"
DATABASE_DIR.mkdir(exist_ok=True)

DATABASE_PATH = DATABASE_DIR / "aviation_analyzer.db"


def get_connection():
    connection = sqlite3.connect(str(DATABASE_PATH))
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_date TEXT NOT NULL,
            changed_modules TEXT,
            affected_modules TEXT,
            risk_score REAL,
            risk_level TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS flights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            flight_id TEXT UNIQUE,
            aircraft TEXT,
            departure TEXT,
            destination TEXT,
            latitude REAL,
            longitude REAL,
            altitude REAL,
            speed REAL,
            status TEXT,
            risk TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id TEXT,
            component TEXT,
            priority TEXT,
            priority_score REAL,
            execution_order INTEGER
        )
    """)

    connection.commit()
    connection.close()


def save_analysis(
    analysis_date,
    changed_modules,
    affected_modules,
    risk_score,
    risk_level
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO analysis_history
        (
            analysis_date,
            changed_modules,
            affected_modules,
            risk_score,
            risk_level
        )
        VALUES (?, ?, ?, ?, ?)
    """, (
        analysis_date,
        changed_modules,
        affected_modules,
        risk_score,
        risk_level
    ))

    connection.commit()
    connection.close()


def get_analysis_history():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM analysis_history
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()

    connection.close()

    return [dict(row) for row in rows]