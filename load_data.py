import csv
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')


def load_stations(filepath=None):
    """Load weather station metadata from CSV. Returns a list of dicts."""
    if filepath is None:
        filepath = os.path.join(DATA_DIR, 'stations.csv')
    with open(filepath, newline='') as f:
        return list(csv.DictReader(f))


def load_measurements(filepath=None):
    """Load daily temperature and precipitation records from CSV. Returns a list of dicts."""
    if filepath is None:
        filepath = os.path.join(DATA_DIR, 'measurements.csv')
    with open(filepath, newline='') as f:
        return list(csv.DictReader(f))


def measurements_for_station(measurements, station_id):
    """Filter a measurements list to a single station by ID."""
    return [r for r in measurements if r['station_id'] == str(station_id)]
