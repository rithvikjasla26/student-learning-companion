def compute_trend(temperatures):
    """Compute linear trend — degrees change per reading (positive = warming)."""
    n = len(temperatures)
    if n < 2:
        return 0.0
    indices = list(range(n))
    mean_i = sum(indices) / n
    mean_t = sum(temperatures) / n
    numerator = sum((i - mean_i) * (t - mean_t) for i, t in zip(indices, temperatures))
    denominator = sum((i - mean_i) ** 2 for i in indices)
    if denominator == 0:
        return 0.0
    return round(numerator / denominator, 4)


def detect_anomaly(temperatures, threshold=2.0):
    """Return True if any reading is more than `threshold` standard deviations from the mean."""
    n = len(temperatures)
    if n < 3:
        return False
    mean = sum(temperatures) / n
    variance = sum((t - mean) ** 2 for t in temperatures) / n
    std_dev = variance ** 0.5
    if std_dev == 0:
        return False
    return any(abs(t - mean) > threshold * std_dev for t in temperatures)


def monthly_averages(records):
    """Return a dict of month (1-12) -> average temperature.

    Each record must have 'date' (YYYY-MM-DD) and 'temperature' keys.
    """
    totals = {}
    counts = {}
    for r in records:
        month = int(r['date'].split('-')[1])
        totals[month] = totals.get(month, 0.0) + float(r['temperature'])
        counts[month] = counts.get(month, 0) + 1
    return {m: round(totals[m] / counts[m], 2) for m in sorted(totals)}
