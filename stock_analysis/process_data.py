from typing import List
import numpy as np
import pandas as pd


class DataProcessor:
    """@brief Process raw stock data by applying indicators."""

    def __init__(self, df: pd.DataFrame):
        """
        @brief Initialize a DataProcessor for a given raw price dataframe.

        @param df: Input pandas DataFrame containing at least OHLCV columns.
        """
        self.df = df
        self.indicators: List[object] = []

    def add_indicator(self, indicator: object) -> None:
        """
        @brief Register an indicator instance to be applied during processing.

        @param indicator: Indicator object exposing a compute(df) -> df method.
        """
        self.indicators.append(indicator)

    def process(self) -> pd.DataFrame:
        """
        @brief Apply all registered indicators and return a cleaned DataFrame.

        @return pandas DataFrame with indicator columns, JSON-safe values and a Date column.
        """
        df = self.df.copy()
        for indicator in self.indicators:
            df = indicator.compute(df)

        df = df.reset_index()
        df = df.replace([np.inf, -np.inf], np.nan).astype(object)
        df = df.where(pd.notna(df), None)

        if "Date" in df.columns:
            df["Date"] = df["Date"].astype(str)

        df.to_csv("processed_data.csv", index=False)

        return df
