# Income and research data

Downloaded on 13 November 2026. These snapshots are served locally. The browser never calls the original providers.

| File | Source |
| --- | --- |
| `research-spending-gdp.csv` | [OWID R&D CSV](https://ourworldindata.org/grapher/research-spending-gdp.csv), UNESCO UIS via World Bank, processed by Our World in Data |
| `gdp-per-capita.json` | [World Bank NY.GDP.PCAP.CD](https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&per_page=20000&date=1996:2025), nominal GDP per capita, current US$ |
| `gdp-total.json` | [World Bank NY.GDP.MKTP.CD](https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&per_page=20000&date=1996:2025), total nominal GDP, current US$ |
| `countries.json` | [World Bank country metadata](https://api.worldbank.org/v2/country?format=json&per_page=400), country codes, regions, aggregate classification |

To refresh, download each source URL into its corresponding file, confirm the JSON responses contain all pages, and update the download date here. Build the site with `bundle exec jekyll build`.

The chart joins observations by three-letter country code and exact year. It excludes World Bank aggregates and missing or nonpositive income values. Missing R&D observations are omitted, not replaced with zero. Availability varies by year: 2024 has 29 matched economies and 2023 has 83 in this snapshot. Circle area represents same-year total nominal GDP, with a fixed size scale across displayed years. Countries missing total GDP are omitted.

The chart shows 2000–2023 and defaults to 2020. It excludes 2024 because R&D reporting is incomplete. The original snapshot files retain other years for provenance. Axis ranges derive from all matched displayed years. The trend fits R&D share to log10 GDP per capita, equally weighting each displayed economy.


Absolute R&D expenditure is derived as R&D share / 100 × same-year nominal GDP, displayed in billions of current US dollars. The spending selector switches between this amount and the original percentage. Each measure has its own fixed y-axis range across years. The trend uses the selected spending measure.
