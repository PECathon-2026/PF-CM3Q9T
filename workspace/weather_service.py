import sqlite3
import math
import random
from datetime import datetime, timedelta

DB_PATH = "workspace/weather.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            temp REAL NOT NULL,
            condition TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT UNIQUE NOT NULL,
            country TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT NOT NULL,
            threshold_type TEXT NOT NULL,
            value REAL NOT NULL,
            triggered INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()

# Initialize DB on import
init_db()

class WeatherService:
    CITIES = {
        "london": {"country": "United Kingdom", "lat": 51.5074, "lon": -0.1278, "base_temp": 15},
        "new york": {"country": "United States", "lat": 40.7128, "lon": -74.0060, "base_temp": 22},
        "tokyo": {"country": "Japan", "lat": 35.6762, "lon": 139.6503, "base_temp": 18},
        "sydney": {"country": "Australia", "lat": -33.8688, "lon": 151.2093, "base_temp": 24},
        "cairo": {"country": "Egypt", "lat": 30.0444, "lon": 31.2357, "base_temp": 30},
        "paris": {"country": "France", "lat": 48.8566, "lon": 2.3522, "base_temp": 17},
        "berlin": {"country": "Germany", "lat": 52.5200, "lon": 13.4050, "base_temp": 16},
        "toronto": {"country": "Canada", "lat": 43.6532, "lon": -79.3832, "base_temp": 14}
    }

    @staticmethod
    def calculate_dew_point(temp_c: float, humidity: float) -> float:
        """Calculate dew point using Magnus formula."""
        a = 17.27
        b = 237.7
        alpha = ((a * temp_c) / (b + temp_c)) + math.log(humidity / 100.0)
        dew_point = (b * alpha) / (a - alpha)
        return round(dew_point, 1)

    @staticmethod
    def calculate_heat_index(temp_c: float, humidity: float) -> float:
        """Calculate heat index / feels like temperature."""
        if temp_c < 20:
            return round(temp_c - (100 - humidity) * 0.05, 1)
        return round(temp_c + (humidity * 0.05), 1)

    @staticmethod
    def calculate_air_density(temp_c: float, pressure_hpa: float) -> float:
        """Calculate air density in kg/m^3 using ideal gas law."""
        temp_k = temp_c + 273.15
        p_pa = pressure_hpa * 100.0
        r_spec = 287.058
        density = p_pa / (r_spec * temp_k)
        return round(density, 2)

    @classmethod
    def get_weather(cls, city_name: str):
        key = city_name.strip().lower()
        if key not in cls.CITIES:
            # Generate deterministic pseudo-random values for unknown cities
            random.seed(sum(map(ord, key)))
            info = {
                "country": "Global",
                "lat": round(random.uniform(-60, 60), 2),
                "lon": round(random.uniform(-180, 180), 2),
                "base_temp": round(random.uniform(10, 30), 1)
            }
        else:
            info = cls.CITIES[key]
            random.seed(key + datetime.now().strftime("%Y-%m-%d"))

        temp = round(info["base_temp"] + random.uniform(-4, 4), 1)
        humidity = round(random.uniform(35, 85), 1)
        pressure = round(random.uniform(1008, 1025), 1)
        wind_speed = round(random.uniform(2, 25), 1)
        wind_dir = random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"])
        uv_index = round(random.uniform(1, 11), 1)
        aqi = random.randint(20, 150)
        
        conditions = ["Sunny", "Partly Cloudy", "Clear", "Light Rain", "Overcast", "Breezy"]
        condition = random.choice(conditions)

        dew_point = cls.calculate_dew_point(temp, humidity)
        feels_like = cls.calculate_heat_index(temp, humidity)
        air_density = cls.calculate_air_density(temp, pressure)

        # 5-day forecast
        forecast = []
        today = datetime.now()
        for i in range(1, 6):
            day_date = today + timedelta(days=i)
            f_temp_high = round(temp + random.uniform(0, 5), 1)
            f_temp_low = round(temp - random.uniform(2, 6), 1)
            forecast.append({
                "date": day_date.strftime("%a, %b %d"),
                "high": f_temp_high,
                "low": f_temp_low,
                "condition": random.choice(conditions)
            })

        weather_data = {
            "city": city_name.title(),
            "country": info["country"],
            "coordinates": {"lat": info["lat"], "lon": info["lon"]},
            "current": {
                "temperature": temp,
                "feels_like": feels_like,
                "humidity": humidity,
                "pressure": pressure,
                "wind_speed": wind_speed,
                "wind_direction": wind_dir,
                "uv_index": uv_index,
                "aqi": aqi,
                "condition": condition,
                "dew_point": dew_point,
                "air_density": air_density
            },
            "forecast": forecast
        }

        # Save to search history
        cls.save_history(city_name.title(), temp, condition)
        return weather_data

    @staticmethod
    def save_history(city: str, temp: float, condition: str):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("INSERT INTO history (city, timestamp, temp, condition) VALUES (?, ?, ?, ?)",
                       (city, timestamp, temp, condition))
        conn.commit()
        conn.close()

    @staticmethod
    def get_history(limit=10):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT city, timestamp, temp, condition FROM history ORDER BY id DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [{"city": r[0], "timestamp": r[1], "temp": r[2], "condition": r[3]} for r in rows]

    @staticmethod
    def get_favorites():
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT city, country FROM favorites")
        rows = cursor.fetchall()
        conn.close()
        return [{"city": r[0], "country": r[1]} for r in rows]

    @staticmethod
    def add_favorite(city: str, country: str):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT OR IGNORE INTO favorites (city, country) VALUES (?, ?)", (city, country))
            conn.commit()
        finally:
            conn.close()
        return WeatherService.get_favorites()

    @staticmethod
    def remove_favorite(city: str):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM favorites WHERE city = ?", (city,))
        conn.commit()
        conn.close()
        return WeatherService.get_favorites()