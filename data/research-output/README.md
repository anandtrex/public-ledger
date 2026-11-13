# Research-output snapshot

Downloaded 13 November 2026. All chart requests use local files.

`oecd-fields.csv.gz` is the compressed, unmodified CSV from OECD's **Bibliometric indicators, by field**, flow `OECD.STI.STP:DSD_BIBLIO@DF_BIBLIO(1.1)`. It contains the 27 broad ASJC disciplines, 2010–2023, and four measures:

| OECD code | Displayed measure |
| --- | --- |
| `TOP10FPUBS_NBFRAC` | Fractional count of top-10%-cited publications |
| `FPUBS_NBFRAC` | Fractional publication count |
| `TOP10_X` | Top-10%-cited share (%) |
| `NORMCIT_X` | Normalized citation impact (% of expected, reference 100) |

Source: [OECD Bibliometric Indicators](https://www.oecd.org/en/data/datasets/science-and-bibliometric-indicators.html), based on Scopus. [API download](https://sdmx.oecd.org/public/rest/v1/data/OECD.STI.STP,DSD_BIBLIO@DF_BIBLIO,1.1/.FPUBS_NBFRAC+TOP10FPUBS_NBFRAC+TOP10_X+NORMCIT_X..10+11+12+13+14+15+16+17+18+19+20+21+22+23+24+25+26+27+28+29+30+31+32+33+34+35+36.?startPeriod=2010&endPeriod=2023&format=csvfilewithlabels).

`output.json` is prepared using `python3 scripts/prepare-research-output.py`. The script joins OECD observations with the local OWID R&D share, World Bank GDP, and country metadata in `../income-and-research/`, by country code and exact year. It excludes aggregates, missing GDP or R&D, and unmatched observations, and verifies that top-cited count / publication count agrees with the supplied top-cited percentage.

The snapshot contains 771 matched country-years across 60 economies. The chart defaults to engineering in 2020 (56 matched economies). These are field-specific output measures, not national totals across all disciplines. Fields overlap and must not be summed. Spending represents the entire national R&D system. All series are matched by observation/publication year, with no funding lag adjustment.

To refresh, download the API CSV, gzip it as `oecd-fields.csv.gz`, refresh the spending snapshots if needed, then rerun the preparation script and update the retrieval date. The browser loads only `output.json`, not the raw CSV.
