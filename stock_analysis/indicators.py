class MovingAverage:
    """@brief Moving average indicator."""

    def __init__(self, window: int):
        """
        @brief Initialize a moving average with a given window size.

        @param window: Number of periods to use for the rolling mean.
        """
        self.window = window

    def compute(self, df):
        """
        @brief Add a moving average column to the dataframe.

        @param df: Input pandas DataFrame with a Close column.
        @return DataFrame including MA_<window> column.
        """
        df = df.copy()
        df[f"MA_{self.window}"] = df["Close"].rolling(self.window).mean()
        return df
    

class EMA:
    """@brief Exponential moving average indicator."""

    def __init__(self, span: int):
        """
        @brief Initialize an EMA with a given span.

        @param span: EMA span (number of periods) for the smoothing.
        """
        self.span = span

    def compute(self, df):
        """
        @brief Add an EMA column to the dataframe.

        @param df: Input pandas DataFrame with a Close column.
        @return DataFrame including EMA_<span> column.
        """
        df = df.copy()
        df[f"EMA_{self.span}"] = df["Close"].ewm(span=self.span, adjust=False).mean()
        return df
    

class RSI:
    """@brief Relative Strength Index momentum oscillator."""

    def __init__(self, period: int):
        """
        @brief Initialize RSI with a given lookback period.

        @param period: Number of periods used to compute average gains and losses.
        """
        self.period = period

    def compute(self, df):
        """
        @brief Add an RSI column to the dataframe.

        @param df: Input pandas DataFrame with a Close column.
        @return DataFrame including RSI_<period> column.
        """
        df = df.copy()
        delta = df["Close"].diff()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        df[f"RSI_{self.period}"] = 100 - (100 / (1 + gain.rolling(self.period).mean() / loss.rolling(self.period).mean().replace(0, 1e-10)))
        return df
    

class MACD:
    """@brief Moving Average Convergence Divergence indicator."""

    def __init__(self, span_short: int, span_long: int, signal_span: int):
        """
        @brief Initialize MACD using short, long and signal EMA periods.

        @param span_short: EMA span for the fast line.
        @param span_long: EMA span for the slow line.
        @param signal_span: EMA span for the MACD signal line.
        """
        self.span_short = span_short
        self.span_long = span_long
        self.signal_span = signal_span

    def compute(self, df):
        """
        @brief Add MACD, signal and helper EMA columns to the dataframe.

        @param df: Input pandas DataFrame with a Close column.
        @return DataFrame including MACD, MACD_Signal and MACD_EMA_* columns.
        """
        df = df.copy()
        df[f"MACD_EMA_{self.span_short}"] = df["Close"].ewm(span=self.span_short, adjust=False).mean()
        df[f"MACD_EMA_{self.span_long}"] = df["Close"].ewm(span=self.span_long, adjust=False).mean()
        df["MACD"] = df[f"MACD_EMA_{self.span_short}"] - df[f"MACD_EMA_{self.span_long}"]
        df["MACD_Signal"] = df["MACD"].ewm(span=self.signal_span, adjust=False).mean()
        return df
    

class ATR:
    """@brief Average True Range volatility indicator."""

    def __init__(self, period: int):
        """
        @brief Initialize ATR with a given period.

        @param period: Number of periods for the rolling true range mean.
        """
        self.period = period

    def compute(self, df):
        """
        @brief Add ATR column computed from OHLC data.

        @param df: Input pandas DataFrame with High, Low and Close columns.
        @return DataFrame including ATR_<period> column.
        """
        df = df.copy()
        df["High-Low"] = df["High"] - df["Low"]
        df["High-Close"] = (df["High"] - df["Close"].shift()).abs()
        df["Low-Close"] = (df["Low"] - df["Close"].shift()).abs()
        df["True Range"] = df[["High-Low", "High-Close", "Low-Close"]].max(axis=1)
        df[f"ATR_{self.period}"] = df["True Range"].rolling(self.period).mean()
        df.drop(columns=["High-Low", "High-Close", "Low-Close", "True Range"], inplace=True)
        return df
    

class BollingerBands:
    """@brief Bollinger Bands based on a simple moving average and standard deviation."""

    def __init__(self, window: int, num_std: int):
        """
        @brief Initialize Bollinger Bands.

        @param window: Window size for the SMA and STD calculations.
        @param num_std: Number of standard deviations for the upper and lower bands.
        """
        self.window = window
        self.num_std = num_std

    def compute(self, df):
        """
        @brief Add SMA, STD, Upper_BB and Lower_BB columns to the dataframe.

        @param df: Input pandas DataFrame with a Close column.
        @return DataFrame including Bollinger Band related columns.
        """
        df = df.copy()
        df[f"SMA_{self.window}"] = df["Close"].rolling(self.window).mean()
        df[f"STD_{self.window}"] = df["Close"].rolling(self.window).std()
        df["Upper_BB"] = df[f"SMA_{self.window}"] + (df[f"STD_{self.window}"] * self.num_std)
        df["Lower_BB"] = df[f"SMA_{self.window}"] - (df[f"STD_{self.window}"] * self.num_std)
        return df