import pandas as pd
import os


class Loader:
    """@brief Load raw CSV price data."""

    def __init__(self, default_path: str = "./raw_data/"):
        """
        @brief Create a Loader with a base directory for CSV files.

        @param default_path: Folder where raw CSV files are stored.
        """
        self.path = default_path

    def load_data(self, name: str) -> pd.DataFrame:
        """
        @brief Load a ticker's raw data as a pandas DataFrame.

        @param name: Stock name key (e.g. "Palantir").
        @return DataFrame with Date index and OHLCV columns.
        """
        tickers = {
            "Palantir": "PLTR",
            "Nvidia": "NVDA",
            "Paypal": "PYPL",
        }
        ticker_code = tickers[name]
        file_path = os.path.join(self.path, f"{ticker_code}_raw.csv")
        try:
            return pd.read_csv(file_path, parse_dates=["Date"], index_col="Date")
        except FileNotFoundError:
            raise FileNotFoundError(f"\033[1;31mFile {file_path} not found.\033[0m")