# Wayfinding Performance Dashboard

## Overview

The Wayfinding Performance Dashboard is a Flask-based web application that combines advanced geospatial data processing with interactive visualizations. This dashboard utilizes D3.js, DC.js, and Leaflet to offer real-time insights into navigation efficiency through various metrics such as speed, route length, and number of stops.

### Features
-Dynamic Data Visualization: Leverages D3.js and DC.js for data-driven graphs and charts, providing insights into travel time, speed, and other relevant metrics.

-Interactive Mapping: Incorporates Leaflet for spatial data representation, including heatmaps and marker clusters to depict areas of interest or concern.

-Real-time Data Processing: Processes geospatial data using Flask and displays it interactively, allowing users to filter and analyze data across different dimensions.

### Technologies Used

-Frontend: HTML5, CSS3, JavaScript

-Libraries: Bootstrap, D3.js, DC.js, Leaflet, Crossfilter

-Backend: Flask

-Data Handling: GeoPandas, Pandas, Shapely

### Installation
#### Prerequisites
-Python 3.8 or newer

-Node.js and npm (for managing frontend libraries)

-Setting Up the Environment

Clone the repository:

bash
Copy
git clone https://github.com/yourusername/wayfinding-dashboard.git
cd wayfinding-dashboard
Install the required Python packages:

bash
Copy
pip install flask geopandas pandas shapely
Install JavaScript libraries: Navigate to the static folder and run:

bash
Copy
npm install d3 dc leaflet crossfilter queue
Running the Application
Launch the Flask server:

bash
Copy
python app.py
This starts the server on localhost with default port 5000.

Access the application: Open a web browser and navigate to http://localhost:5000 to view the dashboard.

### Usage
This application processes JSON data from multiple groups into GeoDataFrames, applies filters, and visualizes data through various interactive charts and a map. Users can interact with the visualizations to drill down into specific metrics or view data across different times and conditions.

### Interactive Features
- Charts: Utilize DC.js to render time series, row charts, and other visualizations that respond to user interactions.
- Map: Use Leaflet to display geospatial data with options to toggle between heatmaps, marker clusters, and directional indicators.
- Data Filtering: Crossfilter supports fast multidimensional filtering for analytics deep dives.
