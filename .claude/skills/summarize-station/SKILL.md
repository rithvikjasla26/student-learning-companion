# summarize-station

Generate a structured analysis summary for a weather station in the climate analysis project.

## When to use this skill

When asked to summarize, report on, or produce an analysis for a station.

## Instructions

Load the station's data using `load_data.py` and compute the metrics using `analyze.py`. Produce the summary in this exact format:

**Station Summary: {station name}**
- Country: {country}
- Temperature trend: {compute_trend result} °C per reading ({warming / cooling / stable})
- Anomaly detected: {Yes / No}
- Warmest month: {month name} (avg {value} °C)
- Coldest month: {month name} (avg {value} °C)

Use `load_measurements()` and `measurements_for_station()` from `load_data.py` to retrieve the data.
Use `compute_trend()`, `detect_anomaly()`, and `monthly_averages()` from `analyze.py` for the calculations.
