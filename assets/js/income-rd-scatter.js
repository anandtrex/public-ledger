(function () {
  "use strict";

  const dataRoot = document.currentScript.dataset.dataRoot;
  const rdUrl = `${dataRoot}/research-spending-gdp.csv`;
  const gdpUrl = `${dataRoot}/gdp-per-capita.json`;
  const totalUrl = `${dataRoot}/gdp-total.json`;
  const selectedCountries = new Set();
  const spendingMeasure = document.getElementById("spending-measure");
  const trendToggle = document.getElementById("chart-trend");
  const countriesUrl = `${dataRoot}/countries.json`;
  let axisRanges;
  let sizeReference;
  let redraw;
  const svg = document.getElementById("income-rd-chart");
  const yearSelect = document.getElementById("chart-year");
  const status = document.getElementById("chart-status");
  if (status) status.textContent = "Loading local country data…";
  const colors = {
    "East Asia & Pacific": "#c15c38",
    "Europe & Central Asia": "#2b7564",
    "Latin America & Caribbean": "#95662b",
    "Middle East & North Africa": "#8163a1",
    "North America": "#3473a0",
    "South Asia": "#b94a67",
    "Sub-Saharan Africa": "#74882d",
    "Other": "#68756f"
  };
  function parseCsv(text) {
    text = text.replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (char === '"' && quoted && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && text[i + 1] === "\n") i += 1;
        row.push(cell);
        if (row.some((part) => part !== "")) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }
    if (cell || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows;
  }

  function regionFor(record) {
    const region = record && record.value && record.value.trim();
    return region && region !== "Aggregates" ? region : "Other";
  }

  function formatUsd(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  }

  function setStatus(message) {
    status.textContent = message;
  }

  async function fetchData(url, source, format) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`${source} returned HTTP ${response.status}.`);
      return format === "json" ? await response.json() : await response.text();
    } catch (error) {
      if (error.name === "AbortError") throw new Error(`${source} took too long to respond.`);
      if (error.message.startsWith(`${source} returned`)) throw error;
      throw new Error(`${source} request failed (${error.message}).`);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function drawChart(points, year) {
    if (!window.Plotly) throw new Error("The local plotting library could not be loaded.");
    const absolute = spendingMeasure.value === "absolute";
    const yValue = (point) => absolute ? point.total * point.rd / 100 / 1e9 : point.rd;
    const regions = [...new Set(points.map((point) => point.region))].sort();
    const traces = regions.map((region) => {
      const rows = points.filter((point) => point.region === region).sort((a, b) => Number(selectedCountries.has(a.code)) - Number(selectedCountries.has(b.code)));
      return {
        type: "scatter", mode: "markers", name: region,
        x: rows.map((point) => point.gdp),
        y: rows.map(yValue),
        text: rows.map((point) => point.country),
        customdata: rows.map((point) => [point.country, point.gdp, point.rd, point.total]),
        marker: { symbol: "circle", size: rows.map((point) => point.total), sizemode: "area", sizeref: sizeReference, sizemin: 5, color: colors[region] || colors.Other, opacity: 0.85, line: { color: rows.map((point) => selectedCountries.has(point.code) ? "#172321" : "#fffefa"), width: rows.map((point) => selectedCountries.has(point.code) ? 3 : 1) } },
        hoverinfo: "none"
      };
    });
    if (trendToggle.checked && points.length >= 2) {
      const xs = points.map((point) => Math.log10(point.gdp));
      const meanX = xs.reduce((a, b) => a + b, 0) / points.length;
      const meanY = points.reduce((sum, point) => sum + yValue(point), 0) / points.length;
      const variance = xs.reduce((sum, value) => sum + (value - meanX) ** 2, 0);
      if (variance > 0) {
        const slope = points.reduce((sum, point, i) => sum + (xs[i] - meanX) * (yValue(point) - meanY), 0) / variance;
        const totalSquares = points.reduce((sum, point) => sum + (yValue(point) - meanY) ** 2, 0);
        const residualSquares = points.reduce((sum, point, i) => sum + (yValue(point) - (meanY + slope * (xs[i] - meanX))) ** 2, 0);
        const rSquared = totalSquares > 0 ? Math.max(0, Math.min(1, 1 - residualSquares / totalSquares)).toFixed(3) : "undefined";
        const ends = [Math.min(...xs), Math.max(...xs)];
        traces.push({ type: "scatter", mode: "lines", name: `Trend (R² = ${rSquared})`,
          x: ends.map((value) => 10 ** value), y: ends.map((value) => meanY + slope * (value - meanX)),
          line: { color: "#172321", width: 2, dash: "dot" }, hoverinfo: "skip" });
      }
    }
    const selected = points.filter((point) => selectedCountries.has(point.code));
    await Plotly.react(svg, traces, {
      shapes: selected.map((point) => ({ type: "line", xref: "paper", yref: "y", x0: 0, x1: 1, y0: yValue(point), y1: yValue(point), line: { color: "#172321", width: 1.2, dash: "dash" }, layer: "below" })),
      annotations: selected.map((point) => ({ xref: "paper", x: 0, yref: "y", y: yValue(point), text: point.country, showarrow: false, xanchor: "left", yanchor: "bottom", font: { size: 10, color: "#172321" }, bgcolor: "#fffefa" })),
      paper_bgcolor: "#fffefa", plot_bgcolor: "#fffefa",
      font: { family: "Arial, sans-serif", color: "#172321" },
      margin: { l: 65, r: 20, t: 25, b: 110 },
      xaxis: { type: "log", autorange: false, range: axisRanges.nominal, title: { text: "Nominal GDP per capita (current US$ · log scale)", font: { size: 12 } }, gridcolor: "#e3e6df", tickprefix: "$", automargin: true },
      yaxis: { autorange: false, range: absolute ? axisRanges.absolute : axisRanges.y, title: { text: absolute ? "R&D spending (current US$, billions)" : "R&D spending (% of GDP)", font: { size: 12 } }, rangemode: "tozero", ticksuffix: absolute ? "B" : "%", tickprefix: absolute ? "$" : "", gridcolor: "#e3e6df", automargin: true },
      legend: { orientation: "h", y: -0.25, x: 0, font: { size: 11 } },
      hovermode: "closest", hoverdistance: 25,
      hoverlabel: { bgcolor: "#fffefa", bordercolor: "#172321", font: { color: "#172321", size: 13 } },
      dragmode: "zoom"
    }, {
      responsive: true, displaylogo: false,
      modeBarButtonsToRemove: ["sendDataToCloud", "lasso2d", "select2d"],
      toImageButtonOptions: { format: "png", filename: `income-and-research-${year}`, width: 1400, height: 850, scale: 2 }
    });
    const tooltip = document.getElementById("chart-tooltip");
    tooltip.hidden = true;
    svg.removeAllListeners("plotly_click");
    svg.on("plotly_click", (event) => {
      const data = event.points[0].customdata;
      if (!data) return;
      const point = points.find((item) => item.country === data[0]);
      if (!point) return;
      if (selectedCountries.has(point.code)) selectedCountries.delete(point.code);
      else selectedCountries.add(point.code);
      document.querySelectorAll("#country-options input").forEach((input) => { input.checked = selectedCountries.has(input.value); });
      document.getElementById("country-selection-count").textContent = `${selectedCountries.size} selected`;
      redraw().catch(showError);
    });
    svg.removeAllListeners("plotly_hover");
    svg.removeAllListeners("plotly_unhover");
    svg.on("plotly_hover", (event) => {
      const point = event.points[0];
      if (!point.customdata) return;
      const [country, income, rd, total] = point.customdata;
      const lines = [country, `GDP per capita: US$${Math.round(income).toLocaleString("en-US")}`, `R&D: ${rd.toFixed(2)}% of GDP`];
      if (Number.isFinite(total)) lines.push(`R&D spending: US$${(total * rd / 100 / 1e9).toLocaleString("en-US", { maximumFractionDigits: 2 })} billion`);
      if (Number.isFinite(total)) lines.push(`Total nominal GDP: US$${(total / 1e12).toFixed(2)} trillion`);
      tooltip.replaceChildren();
      lines.forEach((line, index) => {
        const row = document.createElement(index === 0 ? "strong" : "div");
        row.textContent = line;
        tooltip.appendChild(row);
      });
      tooltip.hidden = false;
      const bounds = svg.parentElement.getBoundingClientRect();
      const mouse = event.event;
      const left = mouse && Number.isFinite(mouse.clientX) ? mouse.clientX - bounds.left : bounds.width / 2;
      const top = mouse && Number.isFinite(mouse.clientY) ? mouse.clientY - bounds.top : 100;
      tooltip.style.left = `${Math.max(8, Math.min(left + 14, bounds.width - tooltip.offsetWidth - 8))}px`;
      tooltip.style.top = `${Math.max(8, Math.min(top + 14, bounds.height - tooltip.offsetHeight - 8))}px`;
    });
    svg.on("plotly_unhover", () => { tooltip.hidden = true; });
    setStatus(`${points.length} countries and territories with data for ${year}. Circle area represents total nominal GDP.`);
  }

  async function loadData() {
    const [rdText, gdpJson, countriesJson, totalJson] = await Promise.all([
      fetchData(rdUrl, "Our World in Data", "text"),
      fetchData(gdpUrl, "World Bank", "json"),
      fetchData(countriesUrl, "World Bank country metadata", "json"),
      fetchData(totalUrl, "Local total GDP data", "json")
    ]);
    const rdRows = parseCsv(rdText);
    const rdHeaders = rdRows.shift();
    const codeIndex = rdHeaders.indexOf("Code");
    const entityIndex = rdHeaders.indexOf("Entity");
    const yearIndex = rdHeaders.indexOf("Year");
    const valueIndex = rdHeaders.findIndex((header) => header.includes("Research and development expenditure"));
    if (codeIndex < 0 || entityIndex < 0 || yearIndex < 0 || valueIndex < 0 || !gdpJson[1]) {
      throw new Error("The data format from a source was not recognized.");
    }

    const rdByCodeYear = new Map();
    rdRows.forEach((row) => {
      // Show 2000 onwards, excluding the incomplete 2024 reporting year.
      const year = Number(row[yearIndex]);
      if (year < 2000 || year >= 2024) return;
      const code = row[codeIndex];
      const rawValue = row[valueIndex] && row[valueIndex].trim();
      const value = rawValue === "" ? NaN : Number(rawValue);
      if (code && code.length === 3 && Number.isFinite(value)) {
        rdByCodeYear.set(`${code}-${row[yearIndex]}`, { value, country: row[entityIndex] });
      }
    });

    if (!Array.isArray(countriesJson[1])) throw new Error("World Bank country metadata was not recognized.");
    const countries = new Map(countriesJson[1]
      .filter((country) => country.region && country.region.id !== "NA" && country.region.value !== "Aggregates")
      .map((country) => [country.id, country]));
    const totalsByCodeYear = new Map(totalJson[1].filter((row) => row.value !== null).map((row) => [`${row.countryiso3code}-${row.date}`, Number(row.value)]));
    const gdpByCodeYear = new Map();
    gdpJson[1].forEach((row) => {
      const code = row.countryiso3code;
      const country = countries.get(code);
      if (country && row.value !== null && Number.isFinite(Number(row.value))) {
        gdpByCodeYear.set(`${code}-${row.date}`, {
          code,
          value: Number(row.value),
          country: row.country.value,
          region: regionFor(country.region),
        });
      }
    });

    const extents = { nominal: [], rd: [], total: [], absolute: [] };
    rdByCodeYear.forEach((rd, key) => {
      const nominal = gdpByCodeYear.get(key);
      const total = totalsByCodeYear.get(key);
      if (!nominal || nominal.value <= 0 || !(total > 0)) return;
      extents.total.push(total);
      extents.nominal.push(nominal.value);
      extents.rd.push(rd.value);
      extents.absolute.push(total * rd.value / 100 / 1e9);
    });
    const logRange = (values) => {
      const minimum = Math.log10(Math.min(...values));
      const maximum = Math.log10(Math.max(...values));
      const padding = Math.max((maximum - minimum) * 0.035, 0.01);
      return [minimum - padding, maximum + padding];
    };
    sizeReference = 2 * Math.max(...extents.total) / (55 ** 2);
    axisRanges = { nominal: logRange(extents.nominal), y: [-Math.max(...extents.rd) * 0.07, Math.max(...extents.rd) * 1.05], absolute: [-Math.max(...extents.absolute) * 0.07, Math.max(...extents.absolute) * 1.05] };

    const years = [...new Set([...rdByCodeYear.keys()].filter((key) => gdpByCodeYear.has(key)).map((key) => key.split("-").pop()))]
      .map(Number).sort((a, b) => b - a);
    if (!years.length) throw new Error("No overlapping country-year observations were found.");

    yearSelect.replaceChildren();
    years.forEach((year) => {
      const option = document.createElement("option");
      option.value = String(year);
      option.textContent = String(year);
      yearSelect.appendChild(option);
    });
    yearSelect.disabled = false;

    const renderYear = async () => {
      const year = yearSelect.value;
      const points = [];
      rdByCodeYear.forEach((rd, key) => {
        if (!key.endsWith(`-${year}`)) return;
        const gdp = gdpByCodeYear.get(key);
        const income = gdp && gdp.value;
        if (gdp && income > 0 && totalsByCodeYear.get(key) > 0) points.push({ code: gdp.code, country: gdp.country || rd.country, gdp: income, rd: rd.value, region: gdp.region, total: totalsByCodeYear.get(key) });
      });
      points.sort((a, b) => a.gdp - b.gdp);
      await drawChart(points, year);
    };
    redraw = renderYear;
    yearSelect.value = String(years.includes(2020) ? 2020 : years[0]);
    yearSelect.addEventListener("change", () => renderYear().catch(showError));
    spendingMeasure.addEventListener("change", () => renderYear().catch(showError));
    trendToggle.addEventListener("change", () => renderYear().catch(showError));
    const countryList = document.getElementById("country-options");
    const search = document.getElementById("country-search");
    const count = document.getElementById("country-selection-count");
    const choices = new Map();
    rdByCodeYear.forEach((_, key) => {
      const gdp = gdpByCodeYear.get(key);
      if (gdp && gdp.value > 0 && totalsByCodeYear.get(key) > 0) choices.set(gdp.code, gdp.country);
    });
    const labels = [];
    const updateSelection = () => {
      count.textContent = `${selectedCountries.size} selected`;
      renderYear().catch(showError);
    };
    [...choices].sort((a, b) => a[1].localeCompare(b[1])).forEach(([code, name]) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = code;
      input.addEventListener("change", () => {
        if (input.checked) selectedCountries.add(code);
        else selectedCountries.delete(code);
        updateSelection();
      });
      label.append(input, document.createTextNode(name));
      countryList.appendChild(label);
      labels.push({ label, input, name: name.toLocaleLowerCase() });
    });
    search.addEventListener("input", () => {
      const query = search.value.trim().toLocaleLowerCase();
      labels.forEach(({ label, name }) => { label.hidden = !name.includes(query); });
    });
    document.getElementById("clear-countries").addEventListener("click", () => {
      selectedCountries.clear();
      labels.forEach(({ input }) => { input.checked = false; });
      updateSelection();
    });
    await renderYear();
  }

  function showError(error) {
    console.error(error);
    setStatus(`Country data could not be loaded: ${error.message} Refresh the page or check that the local data files are present.`);
  }

  loadData().catch(showError);
}());
