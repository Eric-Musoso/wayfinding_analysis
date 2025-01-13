import fiona
import geopandas as gpd
from flask import Flask, render_template, jsonify
import pandas as pd
import json

app = Flask(__name__)

# File paths for each group
file_paths = {
    "group1": "./input/geojson/group1.json",
    "group2": "./input/geojson/group2.json",
    "group3": "./input/geojson/group3.json",
    "group4": "./input/geojson/group4.json",
    "group5": "./input/geojson/group5.json",
}

gdfs = {}

# Function to extract data for each group and convert to GeoDataFrame
def process_group(file_path, participant_name):
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
    except json.JSONDecodeError:
        print(f"Error reading the JSON file at {file_path}")
        return None

    waypoints = data.get('waypoints', [])
    extracted_data = []

    for wp in waypoints:
        position = wp.get('position', {})
        coords = position.get('coords', {})
        interaction = wp.get('interaction', {})

        # Ensure all necessary keys are present
        data_entry = {
            'timestamp': wp.get('timestamp'),
            'latitude': coords.get('latitude'),
            'longitude': coords.get('longitude'),
            'altitude': coords.get('altitude'),
            'speed': coords.get('speed'),
            'heading': coords.get('heading'),
            'accuracy': coords.get('accuracy'),
            'taskNo': wp.get('taskNo'),
            'taskCategory': wp.get('taskCategory'),
            'panCount': interaction.get('panCount'),
            'zoomCount': interaction.get('zoomCount'),
            'rotation': interaction.get('rotation'),
            'participant': participant_name
        }

        # Check if latitude and longitude are present
        if data_entry['latitude'] is None or data_entry['longitude'] is None:
            print(f"Missing coordinates for waypoint {wp.get('timestamp')}")
            continue

        extracted_data.append(data_entry)

    # Check if any data was extracted
    if not extracted_data:
        print(f"No valid data for group {participant_name}")
        return None

   # Create the GeoDataFrame
    gdf = gpd.GeoDataFrame(
    extracted_data,  # This should be your list of dictionaries containing data
    geometry=[Point(d['longitude'], d['latitude']) for d in extracted_data],  # Create Points from longitude and latitude
    crs="EPSG:4326"  # Set the coordinate reference system (WGS 84)
    )
    gdf = gdf.loc[(gdf['taskCategory'] == "nav") & (gdf['taskNo'] >= 6) & (gdf['taskNo'] <= 10)].copy()
    print((gdf['speed'] <=0).count())

    # Add the heading_range column based on the heading values
    def assign_heading_range(heading):
        if 0 <= heading < 90:
            return "0 - 90"
        elif 90 <= heading < 180:
            return "90 - 180"
        elif 180 <= heading < 270:
            return "180 - 270"
        elif 270 <= heading <= 360:
            return "270 - 360"
        else:
            return None  # Handle invalid heading values

    gdf['heading_range'] = gdf['heading'].apply(assign_heading_range)

    return gdf

# Load all groups into the gdfs dictionary
participants = {
    "group1": "Group-1",
    "group2": "Group-2",
    "group3": "Group-3",
    "group4": "Group-4",
    "group5": "Group-5",
}

for group, file_path in file_paths.items():
    gdf = process_group(file_path, participants[group])
    if gdf is not None:
        gdfs[group] = gdf 


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/data")
def get_data():
    # Check if gdfs is not empty
    if gdfs:
        # Concatenate all GeoDataFrames into one DataFrame
        data_alll = pd.concat(gdfs.values())

        # Data transformation
        data_alll = data_alll.to_crs(epsg=3857)
        print(data_alll)
        # Convert the DataFrame to JSON and return
        return data_alll.drop(columns='geometry').to_json(orient='records')
    else:
        # Handle the case where no data is available
        return {"error": "No data available"}, 500

if __name__ == "__main__":
    app.run(debug=True)
    return app(req, res)
