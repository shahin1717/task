/**
 * Initialize the dashboard once the DOM is ready:
 * - wire up all controls
 * - create the Chart.js instance
 * - set up auto-updating behavior.
 */
document.addEventListener("DOMContentLoaded", () => {
    // Cache latest loaded dataset for CSV download.
    window.__latestData = null;

    const indicators = [
        {num: "ma-input", slider: "ma-slider"},
        {num: "ema-input", slider: "ema-slider"},
        {num: "rsi-input", slider: "rsi-slider"},
        {num: "macd-short-input", slider: "macd-short-slider"},
        {num: "macd-long-input", slider: "macd-long-slider"},
        {num: "macd-signal-input", slider: "macd-signal-slider"},
        {num: "atr-input", slider: "atr-slider"},
        {num: "bb-window-input", slider: "bb-window-slider"},
        {num: "bb-std-input", slider: "bb-std-slider"}
    ];

    /**
     * Delayed auto-update to prevent spamming the backend while sliders are moving.
     */
    let updateTimeout;
    const scheduleUpdate = () => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            updateChart();
        }, 200);
    };

    indicators.forEach(ind => {
        const numInput = document.getElementById(ind.num);
        const sliderInput = document.getElementById(ind.slider);

        sliderInput.addEventListener("input", () => {
            numInput.value = sliderInput.value;
            scheduleUpdate();
        });

        numInput.addEventListener("input", () => {
            sliderInput.value = numInput.value;
            scheduleUpdate();
        });
    });

    const ctx = document.getElementById("stockChart").getContext("2d");
    window.stockChart = new Chart(ctx, {
        type: "line",
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            stacked: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                x: { display: true, title: { display: true, text: 'Date' } },
                y: { display: true, title: { display: true, text: 'Price' } }
            }
        }
    });

    const downloadBtn = document.getElementById("download-btn");
    if (downloadBtn) {
        downloadBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const data = window.__latestData;
            if (!data || !Array.isArray(data) || data.length === 0) {
                alert("No data to download yet. Click Load Data or change a parameter first.");
                return;
            }
            downloadAsCSV(data);
        });
    }

    document.querySelectorAll(".indicator").forEach(ind => {
        const values = ind.querySelectorAll(".indicator-values");
        if(values.length === 0) return;

        const inner = document.createElement("div");
        inner.classList.add("flip-inner");

        const back = document.createElement("div");
        back.classList.add("flip-back");
        back.textContent = "Disabled";

        const front = document.createElement("div");
        front.classList.add("flip-front");
        values.forEach(val => front.appendChild(val));

        inner.appendChild(front);
        inner.appendChild(back);

        ind.appendChild(inner);
    });

    const checkboxes = document.querySelectorAll(".indicator-checkbox");

    checkboxes.forEach(cb => {
        const flipInner = cb.closest(".indicator").querySelector(".flip-inner");
        cb.addEventListener("change", () => {
            const sectionIndicator = cb.closest('.indicator').querySelector('.indicator-values');
            if (!cb.checked && flipInner) {
                sectionIndicator.style.height='40px';
                flipInner.style.transform = "rotateY(180deg)";
            } else if (flipInner) {
                sectionIndicator.style.height='auto';
                flipInner.style.transform = "rotateY(0deg)";
            }
            scheduleUpdate();
        });
    });

    document.getElementById("select-all").addEventListener("click", () => {
        checkboxes.forEach(cb => {
            cb.checked = true;
            const sectionIndicator = cb.closest('.indicator').querySelector('.indicator-values');
            sectionIndicator.style.height='auto';
            const flipInner = cb.closest(".indicator").querySelector(".flip-inner");
            if (flipInner) {
                flipInner.style.transform = "rotateY(0deg)";
            }
        });
        scheduleUpdate();
    });

    document.getElementById("deselect-all").addEventListener("click", () => {
        checkboxes.forEach(cb => {
            cb.checked = false;
            const sectionIndicator = cb.closest('.indicator').querySelector('.indicator-values');
            sectionIndicator.style.height='40px';
            const flipInner = cb.closest(".indicator").querySelector(".flip-inner");
            if (flipInner) {
                flipInner.style.transform = "rotateY(180deg)";
            }
        });
        scheduleUpdate();
    });

    const stockSelect = document.getElementById("stock-select");
    if (stockSelect) {
        stockSelect.addEventListener("change", () => {
            scheduleUpdate();
        });
    }

    const toggleIndicators = document.getElementById("toggle-indicators");
    if (toggleIndicators) {
        toggleIndicators.addEventListener("change", () => {
            scheduleUpdate();
        });
    }

    const loadBtn = document.getElementById("load-btn");
    if (loadBtn) {
        loadBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await updateChart();
        });
    }

});


/**
 * Fetch fresh data from the backend based on current UI state
 * and push it into the preview table and chart.
 *
 * @returns {Promise<void>}
 */
async function updateChart() {
    const stock = document.getElementById("stock-select").value;

    const params = {};
    document.querySelectorAll(".indicator-checkbox").forEach(cb => {
        if(cb.checked){
            switch(cb.value){
                case "MA": params["MA"] = parseInt(document.getElementById("ma-input").value); break;
                case "EMA": params["EMA"] = parseInt(document.getElementById("ema-input").value); break;
                case "RSI": params["RSI"] = parseInt(document.getElementById("rsi-input").value); break;
                case "MACD": 
                    params["MACD"] = {
                        short: parseInt(document.getElementById("macd-short-input").value),
                        long: parseInt(document.getElementById("macd-long-input").value),
                        signal: parseInt(document.getElementById("macd-signal-input").value)
                    };
                    break;
                case "ATR": params["ATR"] = parseInt(document.getElementById("atr-input").value); break;
                case "BB": 
                    params["BB"] = {
                        window: parseInt(document.getElementById("bb-window-input").value),
                        num_std: parseInt(document.getElementById("bb-std-input").value)
                    };
                    break;
            }
        }
    });

    try {
        const query = new URLSearchParams({ stock, params: JSON.stringify(params) });
        const response = await fetch(`/api/data?${query}`);
        if(!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        window.__latestData = data;

        populateTable(data);
        updateChartJS(data);

    } catch(err) {
        console.error("Error fetching data:", err);
        alert("Failed to fetch data. See console for details.");
    }
}

/**
 * Convert an array of row objects into CSV and trigger a browser download.
 *
 * @param {Array<Object>} rows - Data rows as returned from the backend.
 */
function downloadAsCSV(rows) {
    const cols = Object.keys(rows[0] || {});
    const preferred = ["Date", "Close"];
    const rest = cols.filter(c => !preferred.includes(c)).sort();
    const headers = preferred.filter(c => cols.includes(c)).concat(rest);

    const escapeCell = (val) => {
        if (val === null || val === undefined) return "";
        const s = String(val);
        // escape quotes and wrap if needed
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };

    const lines = [];
    lines.push(headers.join(","));
    for (const row of rows) {
        lines.push(headers.map(h => escapeCell(row[h])).join(","));
    }

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const stock = document.getElementById("stock-select")?.value || "stock";
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const filename = `${stock}_data_${ts}.csv`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}


/**
 * Render a small preview table with the first few rows of data.
 *
 * @param {Array<Object>} data - Parsed JSON rows from the backend.
 */
function populateTable(data) {
    const previewTable = document.getElementById("data-preview");
    previewTable.innerHTML = "";

    if(!data || data.length === 0) return;

    const header = document.createElement("tr");
    Object.keys(data[0]).forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        header.appendChild(th);
    });
    previewTable.appendChild(header);

    data.slice(0,8).forEach(row => {
        const tr = document.createElement("tr");
        Object.values(row).forEach(val => {
            const td = document.createElement("td");
            td.textContent = val;
            tr.appendChild(td);
        });
        previewTable.appendChild(tr);
    });
}


/**
 * Push new data into the global Chart.js instance.
 * Always shows the Close line, optionally overlays selected indicators.
 *
 * @param {Array<Object>} data - Parsed JSON rows from the backend.
 */
function updateChartJS(data) {
    if(!window.stockChart || !data || data.length === 0) return;

    window.stockChart.data.labels = data.map(d => d.Date);
    window.stockChart.data.datasets = [];

    const colorPalette = [
        "#1f77b4", // blue
        "#ff7f0e", // orange
        "#2ca02c", // green
        "#d62728", // red
        "#9467bd", // purple
        "#8c564b", // brown
        "#e377c2", // pink
        "#7f7f7f", // gray
        "#bcbd22", // olive
        "#17becf", // cyan
    ];

    const hashString = (s) => {
        let h = 0;
        for (let i = 0; i < s.length; i++) {
            h = ((h << 5) - h) + s.charCodeAt(i);
            h |= 0; // 32-bit
        }
        return Math.abs(h);
    };

    const colorForLabel = (label) => {
        const idx = hashString(label) % colorPalette.length;
        return colorPalette[idx];
    };

    const showIndicators = document.getElementById("toggle-indicators")?.checked ?? true;

    // Close price (always shown)
    window.stockChart.data.datasets.push({
        label: "Close",
        data: data.map(d => d.Close),
        borderColor: "black",
        backgroundColor: "black",
        borderWidth: 2,
        pointRadius: 0,
        fill: false
    });

    // Indicators only (exclude raw OHLCV fields so Volume doesn't blow up the scale)
    if (!showIndicators) {
        window.stockChart.update();
        return;
    }
    const excluded = new Set(["Date", "Close", "Open", "High", "Low", "Volume"]);
    const isIndicatorKey = (key) => {
        if (excluded.has(key)) return false;
        // Known indicator outputs from our backend library
        return (
            key.startsWith("MA_") ||
            key.startsWith("EMA_") ||
            key.startsWith("RSI_") ||
            key.startsWith("ATR_") ||
            key.startsWith("SMA_") ||
            key.startsWith("STD_") ||
            key === "MACD" ||
            key === "MACD_Signal" ||
            key === "Upper_BB" ||
            key === "Lower_BB"
        );
    };

    Object.keys(data[0]).forEach(key => {
        if(!isIndicatorKey(key)) return;
        const c = colorForLabel(key);
        window.stockChart.data.datasets.push({
            label: key,
            data: data.map(d => d[key]),
            borderColor: c,
            backgroundColor: c,
            borderWidth: 1,
            pointRadius: 0,
            fill: false
        });
    });

    window.stockChart.update();
}

