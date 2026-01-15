from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json

from stock_analysis.load_stock import Loader
from stock_analysis.indicators import MovingAverage, EMA, RSI, MACD, ATR, BollingerBands
from stock_analysis.process_data import DataProcessor

app = FastAPI()

# CORS for JS requests from same origin or others
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/data")
def get_data(stock: str, params: str = Query("{}")):
    """
    @brief Fetch processed stock data and selected technical indicators.

    @param stock: Stock name (e.g. "Palantir", "Nvidia", "Paypal").
    @param params: JSON string describing which indicators to compute and their parameters.
    @return List of rows as dictionaries, ready to be serialized to JSON for the frontend.
    """
    loader = Loader("./raw_data/")
    df = loader.load_data(stock)

    params_dict = json.loads(params)
    processor = DataProcessor(df)

    if "MA" in params_dict:
        processor.add_indicator(MovingAverage(params_dict["MA"]))
    if "EMA" in params_dict:
        processor.add_indicator(EMA(params_dict["EMA"]))
    if "RSI" in params_dict:
        processor.add_indicator(RSI(params_dict["RSI"]))
    if "MACD" in params_dict:
        macd = params_dict["MACD"]
        processor.add_indicator(MACD(macd["short"], macd["long"], macd["signal"]))
    if "ATR" in params_dict:
        processor.add_indicator(ATR(params_dict["ATR"]))
    if "BB" in params_dict:
        bb = params_dict["BB"]
        processor.add_indicator(BollingerBands(bb["window"], bb["num_std"]))

    final_df = processor.process()
    # DataProcessor already returns a JSON‑safe, Date‑as‑column DataFrame from process_data.py
    return final_df.to_dict(orient="records")


app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
