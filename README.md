# Wayfinding Performance Dashboard

## Overview

The Wayfinding Performance Dashboard is a Flask-based web application that leverages geospatial data to provide insights into navigation efficiency. It uses D3.js, DC.js, and Leaflet for interactive data visualization and is structured to facilitate easy deployment and maintenance.

### Repository Structure
- /api: Contains the Flask application files including index.py for the API endpoints.
- /input/geojson: Stores the GeoJSON files used for mapping and data processing. 
- /static: Holds static files like CSS, JavaScript, and library dependencies. 
- /templates: Contains HTML files for the application's frontend.  
- README.md: Provides project information and setup instructions. 
- requirements.txt: Lists all Python dependencies for the project. 
- vercel.json: Configuration file for deploying the project using Vercel.

### Features
- Dynamic Data Visualization: Uses D3.js and DC.js to create interactive charts and graphs.
- Geospatial Mapping: Integrates Leaflet for advanced mapping capabilities.
- Data Processing: Flask backend processes GeoJSON data for use in the application.

### Technologies Used
- Flask: Serves the backend and API functionality.
- D3.js, DC.js: Provide dynamic visualizations. 
- Leaflet: Handles interactive maps. 
- Bootstrap: Ensures responsive design.

### Installation

#### Prerequisites
  
- Python 3.8 or higher
- Node.js and npm

### Setting Up the Environment

1. Clone the repository:
- bash
git clone https://github.com/yourusername/Thesis-project.git
  
cd Thesis-project

2. Install Python dependencies:
- bash
pip install -r requirements.txt
  
3. Install JavaScript libraries: Navigate to the static directory and install dependencies:
- bash 
npm install

### Running the Application
1. Start the Flask server:
- bash
python api/index.py
  
This will run the server on localhost:5000.

2. Access the dashboard: Open your browser and go to http://localhost:5000 to view the dashboard.

### Usage

Navigate through the web interface to interact with the data visualizations. Use the filters to segment the data based on different parameters and explore various geospatial analytics functionalities.
