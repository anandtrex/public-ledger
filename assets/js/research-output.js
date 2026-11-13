(function () {
  "use strict";
  const url = document.currentScript.dataset.source;
  const chart = document.getElementById("output-chart");
  const status = document.getElementById("output-status");
  const tooltip = document.getElementById("output-tooltip");
  const year = document.getElementById("output-year");
  const field = document.getElementById("output-field");
  const spending = document.getElementById("output-spending");
  const metric = document.getElementById("output-metric");
  const trend = document.getElementById("output-trend");
  const colors = { "East Asia & Pacific": "#c15c38", "Europe & Central Asia": "#2b7564", "Latin America & Caribbean": "#95662b", "Middle East & North Africa": "#8163a1", "North America": "#3473a0", "South Asia": "#b94a67", "Sub-Saharan Africa": "#74882d" };
  const metrics = {
    top10: { title: "Top-10%-cited publications (fractional count)", log: true },
    publications: { title: "Scientific publications (fractional count)", log: true },
    top10share: { title: "Publications in world's top 10% cited (%)", log: false },
    impact: { title: "Normalized citation impact (% of expected)", log: false }
  };
  function option(select, value, text) {
    const item = document.createElement("option");
    item.value = value; item.textContent = text; select.appendChild(item);
  }
  function range(values, logarithmic, padBelowZero = false) {
    const transformed = logarithmic ? values.map(Math.log10) : values;
    const lo = Math.min(...transformed), hi = Math.max(...transformed);
    const padding = Math.max((hi - lo) * 0.08, logarithmic ? 0.10 : 0.1);
    return logarithmic ? [lo - padding, hi + padding] : [padBelowZero ? -Math.max(hi * 0.10, padding) : 0, hi + padding];
  }
  let tableSort = { key: "top10", ascending: false };
  let tableData;
  function renderSpendingTable(data) {
    tableData = data;
    const body = document.getElementById("output-spending-table-body");
    const selectedYear = Number(year.value);
    const eligible = data.records.filter(row => row.year === selectedYear && row.spending > 1e10).map(row => {
      const output = row.output[field.value] || {};
      const ratios = {};
      for (const key of Object.keys(metrics)) {
        const value = output[key];
        ratios[key] = Number.isFinite(value) && value >= 0 ? value / (row.spending / 1e9) : null;
      }
      return { ...row, ...ratios };
    }).sort((a, b) => {
      const av = a[tableSort.key], bv = b[tableSort.key];
      if (av === null && bv !== null) return 1;
      if (bv === null && av !== null) return -1;
      const comparison = tableSort.key === "country" ? av.localeCompare(bv) : (av ?? 0) - (bv ?? 0);
      return (tableSort.ascending ? comparison : -comparison) || a.country.localeCompare(b.country);
    });
    document.querySelectorAll("[data-output-sort]").forEach(button => {
      const active = button.dataset.outputSort === tableSort.key;
      button.parentElement.setAttribute("aria-sort", active ? (tableSort.ascending ? "ascending" : "descending") : "none");
      button.querySelector(".sort-indicator").textContent = active ? (tableSort.ascending ? " ↑" : " ↓") : " ↕";
    });
    document.getElementById("output-table-caption").textContent = `${data.fields[field.value]} · ${selectedYear} · ${eligible.length} economies spending more than US$10 billion on national R&D. Click a column heading to sort.`;
    body.replaceChildren();
    const format = value => value === null ? "Not available" : value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
    eligible.forEach(row => {
      const tr = document.createElement("tr");
      [row.country, format(row.top10), format(row.publications), format(row.top10share), format(row.impact)].forEach((value, index) => {
        const cell = document.createElement(index === 0 ? "th" : "td");
        if (index === 0) cell.scope = "row";
        cell.textContent = value;
        tr.appendChild(cell);
      });
      body.appendChild(tr);
    });
    if (!eligible.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.textContent = "No countries in this snapshot exceed the spending threshold in the selected year.";
      tr.appendChild(td); body.appendChild(tr);
    }
  }

  async function start() {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Local data returned HTTP ${response.status}`);
    const data = await response.json();
    Object.entries(data.fields).sort((a, b) => a[1].localeCompare(b[1])).forEach(([code, label]) => option(field, code, label));
    field.value = "22";
    const years = [...new Set(data.records.map(row => row.year))].sort((a,b) => b-a);
    years.forEach(value => option(year, value, value));
    year.value = years.includes(2020) ? "2020" : String(years[0]);
    const sizeRef = 2 * Math.max(...data.records.map(row => row.gdp)) / 55 ** 2;
    async function render() {
      tooltip.hidden = true;
      renderSpendingTable(data);
      const spec = metrics[metric.value];
      const absolute = spending.value === "absolute";
      const x = row => absolute ? row.spending / 1e9 : row.share;
      const y = row => row.output[field.value][metric.value];
      const all = data.records.filter(row => row.output[field.value] && Number.isFinite(y(row)) && (spec.log ? y(row) > 0 : y(row) >= 0) && x(row) > 0);
      const rows = all.filter(row => row.year === Number(year.value));
      if (!all.length) { await Plotly.react(chart, [], {}); status.textContent = "No matching data for this metric and field."; return; }
      const traces = [...new Set(rows.map(row => row.region))].sort().map(region => {
        const group = rows.filter(row => row.region === region).sort((a,b) => b.gdp-a.gdp);
        return { type: "scatter", mode: "markers", cliponaxis: false, name: region,
          x: group.map(x), y: group.map(y), customdata: group,
          marker: { symbol: "circle", size: group.map(row => row.gdp), sizemode: "area", sizeref: sizeRef, sizemin: 5, color: colors[region] || "#68756f", opacity: 0.8, line: {color:"#fffefa",width:1} }, hoverinfo:"none" };
      });
      if (rows.length > 1) {
        const xs=rows.map(row=>absolute?Math.log10(x(row)):x(row));
        const ys=rows.map(row=>spec.log?Math.log10(y(row)):y(row));
        const mx=xs.reduce((a,b)=>a+b,0)/xs.length, my=ys.reduce((a,b)=>a+b,0)/ys.length;
        const variance=xs.reduce((sum,v)=>sum+(v-mx)**2,0);
        if(variance>0) {
          const slope=xs.reduce((sum,v,i)=>sum+(v-mx)*(ys[i]-my),0)/variance;
          const totalSquares=ys.reduce((sum,v)=>sum+(v-my)**2,0);
          const residualSquares=ys.reduce((sum,v,i)=>sum+(v-(my+slope*(xs[i]-mx)))**2,0);
          const rSquared=totalSquares>0?Math.max(0,Math.min(1,1-residualSquares/totalSquares)):null;
          const ends=[Math.min(...xs),Math.max(...xs)];
          if (rSquared !== null && (rSquared >= 0.5 || trend.checked)) traces.push({ type:"scatter",mode:"lines",name:`Trend (R² = ${rSquared.toFixed(3)})`,x:ends.map(v=>absolute?10**v:v),y:ends.map(v=>spec.log?10**(my+slope*(v-mx)):my+slope*(v-mx)),line:{color:"#172321",dash:"dot",width:2},hoverinfo:"skip" });
        }
      }
      await Plotly.react(chart,traces,{
        paper_bgcolor:"#fffefa",plot_bgcolor:"#fffefa",font:{family:"Arial, sans-serif",color:"#172321"},margin:{l:85,r:20,t:25,b:110},
        xaxis:{layer:"below traces",title:{text:absolute?"R&D spending (current US$, billions · log scale)":"R&D spending (% of GDP)"},type:absolute?"log":"linear",range:range(all.map(x),absolute,true),autorange:false,ticksuffix:absolute?"B":"%",tickprefix:absolute?"$":"",gridcolor:"#e3e6df",automargin:true},
        yaxis:{layer:"below traces",title:{text:spec.title},type:spec.log?"log":"linear",range:range(all.map(y),spec.log,true),autorange:false,gridcolor:"#e3e6df",automargin:true},
        legend:{orientation:"h",y:-0.25,font:{size:11}},hovermode:"closest",hoverdistance:25,dragmode:"zoom"
      },{responsive:true,displaylogo:false,toImageButtonOptions:{filename:`research-output-${field.value}-${year.value}`,width:1400,height:850,scale:2}});
      chart.removeAllListeners("plotly_hover");chart.removeAllListeners("plotly_unhover");
      chart.on("plotly_hover",event=>{
        const row=event.points[0].customdata;if(!row)return;
        tooltip.replaceChildren();
        const output=y(row).toLocaleString("en-US",{maximumFractionDigits:2});
        [row.country,`${data.fields[field.value]} · ${row.year}`,`${spec.title}: ${output}`,`R&D: ${row.share.toFixed(2)}% of GDP`,`R&D spending: US$${(row.spending/1e9).toFixed(2)} billion`].forEach((text,i)=>{const el=document.createElement(i===0?"strong":"div");el.textContent=text;tooltip.appendChild(el);});
        tooltip.hidden=false;
        const bounds=chart.parentElement.getBoundingClientRect();
        const mouse=event.event;
        const left=mouse&&Number.isFinite(mouse.clientX)?mouse.clientX-bounds.left:bounds.width/2;
        const top=mouse&&Number.isFinite(mouse.clientY)?mouse.clientY-bounds.top:100;
        tooltip.style.left=`${Math.max(8,Math.min(left+14,bounds.width-tooltip.offsetWidth-8))}px`;
        tooltip.style.top=`${Math.max(8,Math.min(top+14,bounds.height-tooltip.offsetHeight-8))}px`;
      });
      chart.on("plotly_unhover",()=>{tooltip.hidden=true;});
      status.textContent=`${rows.length} countries and territories · ${year.value} · ${data.fields[field.value]}. Spending is national; output is for this research field.`;
    }
    [year,field,spending,metric,trend].forEach(control=>{control.disabled=false;control.addEventListener("change",()=>render().catch(fail));});
    document.querySelectorAll("[data-output-sort]").forEach(button => {
      button.addEventListener("click", () => {
        const key = button.dataset.outputSort;
        tableSort = { key, ascending: key === tableSort.key ? !tableSort.ascending : key === "country" };
        renderSpendingTable(tableData);
      });
    });
    await render();
  }
  function fail(error){console.error(error);status.textContent=`Unable to load the chart: ${error.message}`;}
  start().catch(fail);
}());
