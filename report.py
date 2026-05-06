from load_data import load_stations, load_measurements, measurements_for_station
from analyze import compute_trend, detect_anomaly, monthly_averages


def generate_summary_report():
    """Print a text summary for each station: trend, anomaly flag, and monthly averages."""
    stations = load_stations()
    measurements = load_measurements()

    for station in stations:
        sid = station['id']
        records = measurements_for_station(measurements, sid)
        temps = [float(r['temperature']) for r in records]

        trend = compute_trend(temps)
        flagged = detect_anomaly(temps)
        avgs = monthly_averages(records)

        print("Station: {} (id={})".format(station['name'], sid))
        print("  Country:          {}".format(station['country']))
        print("  Trend:            {} deg/reading".format(trend))
        print("  Anomaly detected: {}".format('YES' if flagged else 'no'))
        print("  Monthly averages: {}".format(avgs))
        print()


if __name__ == '__main__':
    generate_summary_report()
