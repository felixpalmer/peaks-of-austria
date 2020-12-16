// Initialize the engine with a location and inject into page
const container = document.getElementById( 'container' );
const peakList = document.getElementById( 'peak-list' );
const peakListOverlay = document.getElementById( 'peak-list-overlay' );
const title = document.getElementById( 'title' );
const subtitle = document.getElementById( 'subtitle' );

// Define API Keys (replace these with your own!)
const NASADEM_APIKEY = null;
if ( !NASADEM_APIKEY ) {
  const error = Error( 'Modify index.html to include API keys' );
  container.innerHTML = error; 
  throw error;
}

const datasource = {
  elevation: {
    apiKey: NASADEM_APIKEY
  },
  imagery: {
    urlFormat: 'https://maps1.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpg',
    attribution: 'Tiles &copy; <a href="https://www.basemap.at/">basemap.at</a>'
  }
}
Procedural.init( { container, datasource } );

// Configure buttons for UI
Procedural.setCameraModeControlVisible( true );
Procedural.setCompassVisible( false );
Procedural.setRotationControlVisible( true );
Procedural.setZoomControlVisible( true );

// Define function for loading a given peak
function loadPeak( feature ) {
  const { name, height } = feature.properties;
  const [longitude, latitude] = feature.geometry.coordinates;
  Procedural.displayLocation( { latitude, longitude } );
  title.innerHTML = name;
  subtitle.innerHTML = `${height}m`;
  peakListOverlay.classList.add( 'hidden' );

  const overlay = {
    "name": "peak",
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": feature.geometry,
        "properties": {
          "name": `${name}`,
          "background": "rgba(35,46,50,1)",
          "borderRadius": 8,
          "fontSize": 18,
          "padding": 10,
          "anchorOffset": { "y": 86, "x": 0 }
        }
      },
      {
        "type": "Feature",
        "geometry": feature.geometry,
        "properties": {
          "color": "rgba(255, 255, 255, 0.5)",
          "fontSize": 30,
          "name": "|",
          "anchorOffset": { "y": 36, "x": 0 }
        }
      }
    ]
  }

  Procedural.addOverlay( overlay );
}

// Show list when title clicked
title.addEventListener( 'click', () => {
  peakListOverlay.classList.remove( 'hidden' );
} );

// Fetch peak list and populate UI
fetch( 'peaks.geojson' )
  .then( data => data.json() )
  .then( peaks => {
    // Display first peak
    const [longitude, latitude] = peaks.features[ 0 ].geometry.coordinates;
    Procedural.displayLocation( { latitude, longitude } );

    peaks.features.forEach( (peak, i) => {
      const li = document.createElement( 'li' );
      let p = document.createElement( 'p' );
      p.innerHTML = peak.properties.name;
      li.appendChild( p );
      p = document.createElement( 'p' );
      p.innerHTML = i + 1;
      li.appendChild( p );
      // For now just have 10 preview images
      li.style.backgroundImage = `url(images/${i % 10}.jpg)`;
      peakList.appendChild( li );
      li.addEventListener( 'click', () => loadPeak( peak ) );
    } );

    // Add overlay showing all peaks
    const overlay = {
      "name": "dots",
      "type": "FeatureCollection",
      "features": peaks.features.map( (feature, i) => ( {
        "id": i,
        "type": "Feature",
        "geometry": feature.geometry,
        "properties": {
          "name": i + 1,
          "background": "rgba(35,46,50,1)",
          "borderRadius": 8,
          "padding": 6,
        }
      } ) )
    }
    Procedural.addOverlay( overlay );

    // Move view to peak when marker clicked
    Procedural.onFeatureClicked = id => {
      const peak = peaks.features[ id ];
      if ( peak ) { loadPeak( peak ) }
    }
  } );
