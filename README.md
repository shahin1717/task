# Stock Analysis Dashboard – How to Run Locally

## Overview
This is an interactive web application that allows users to analyze stock price data (Palantir, Nvidia, Paypal) with customizable technical indicators.  
The backend is built with **FastAPI** and the frontend uses pure **Vanilla HTML/CSS/JavaScript** with **Chart.js**.

## Prerequisites

- Python 3.12
- Pandas
- Numpy
- FastAPI
- Uvicorn
- [PIP](https://pip.pypa.io/en/stable/installation/) or [Miniconda](https://www.anaconda.com/docs/getting-started/miniconda/install)



## Step-by-Step Setup

#### 1. Unzip / Extract the Project
Extract all files into a folder 

#### 2. Set Up the Environment

######  Option A – Using Miniconda (with environment.yml file) 

```bash 
# 1. Go to your project folder
cd <folder_name>

# 2. Create environment from yml file
conda env create -f environment.yml

# 3. Activate it
conda activate stock-analysis

# 4. Run the app
uvicorn main:app --reload 

# 5. Open browser
http://127.0.0.1:8000/

```


###### Option B – Using virtual environment (venv + pip) 

```bash
# 1. Go to your project folder
cd <folder_name>

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the environment

# Windows:
venv\Scripts\activate

# macOS / Linux:
source venv/bin/activate

# 4. Install required packages
pip install fastapi uvicorn pandas numpy

# 5. Start the application (with auto-reload during development)
uvicorn main:app --reload 

# 6. Open browser
http://127.0.0.1:8000/

```

