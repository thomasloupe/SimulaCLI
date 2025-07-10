// iss - International Space Station tracker with location and map
// Community package for SimulaCLI

export default async function iss(...args) {
  try {
    const terminal = document.getElementById('terminal');

    let output = `<strong>ISS Tracker</strong><br><br>`;
    output += `Attempting to fetch ISS position...<br>`;

    // Try multiple ISS APIs with different approaches
    const issData = await fetchISSData();

    if (!issData) {
      return output + `<br><span style="color: #ff0;">⚠ Unable to fetch real-time ISS data</span><br><br>` +
             generateSimulatedData();
    }

    const lat = parseFloat(issData.latitude);
    const lng = parseFloat(issData.longitude);
    const timestamp = issData.timestamp;

    // Get location information
    let locationInfo = getLocationFromCoordinates(lat, lng);

    // Try to get more detailed location info if possible
    try {
      const geoResponse = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache'
        }
      );
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        locationInfo = formatLocation(geoData);
      }
    } catch (error) {
      console.log('Geocoding failed, using coordinate-based location');
    }

    // Generate OpenStreetMap link
    const mapLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=4#map=4/${lat}/${lng}`;

    // Calculate ISS speed and altitude (approximate)
    const altitude = 408; // ISS average altitude in km
    const speed = 27600; // ISS average speed in km/h

    // Format coordinates
    const latStr = formatCoordinate(lat, 'lat');
    const lngStr = formatCoordinate(lng, 'lng');

    // Create ASCII visual indicator
    const asciiMap = generateASCIIIndicator(lat, lng);

    // Build output
    output += `<span style="color: #0f0;">✓ Live ISS data retrieved successfully!</span><br><br>`;
    output += `<strong>ISS Current Status:</strong><br>`;
    output += `Position: ${latStr}, ${lngStr}<br>`;
    output += `Location: ${locationInfo}<br>`;
    output += `Altitude: ~${altitude} km above Earth<br>`;
    output += `Speed: ~${speed} km/h<br>`;
    output += `<br>`;
    output += `${asciiMap}<br>`;
    output += `<br>`;
    output += `<a href="${mapLink}" target="_blank" style="color: #0ff;">📍 View on OpenStreetMap</a><br>`;
    output += `<br>`;
    output += `<em>Data updated: ${new Date(timestamp * 1000).toLocaleString()}</em>`;

    return output;

  } catch (error) {
    console.error('ISS Error:', error);
    return `<strong>ISS Tracker</strong><br><br>` +
           `<span style="color: #ff0;">⚠ Error: ${error.message}</span><br><br>` +
           generateSimulatedData();
  }
}

async function fetchISSData() {
  const apis = [
    {
      url: 'https://api.open-notify.org/iss-now.json',
      parser: (data) => ({
        latitude: data.iss_position.latitude,
        longitude: data.iss_position.longitude,
        timestamp: data.timestamp
      })
    },
    {
      url: 'https://api.wheretheiss.at/v1/satellites/25544',
      parser: (data) => ({
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: Math.floor(Date.now() / 1000)
      })
    }
  ];

  for (const api of apis) {
    try {
      console.log(`Trying ISS API: ${api.url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(api.url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const parsedData = api.parser(data);

      console.log('ISS API success:', parsedData);
      return parsedData;

    } catch (error) {
      console.log(`API ${api.url} failed:`, error.message);
      continue;
    }
  }

  return null;
}

function generateSimulatedData() {
  // Generate realistic ISS coordinates (simulate orbital path)
  const now = Date.now();
  const orbitalPeriod = 92.68 * 60 * 1000; // ISS orbital period in milliseconds
  const phase = (now % orbitalPeriod) / orbitalPeriod * 2 * Math.PI;

  // Simplified orbital mechanics simulation
  const inclination = 51.6 * Math.PI / 180; // ISS orbital inclination
  const lat = Math.sin(inclination) * Math.sin(phase) * 180 / Math.PI;
  const lng = ((now / 60000) * 4) % 360 - 180; // Rough longitude progression

  const latStr = formatCoordinate(lat, 'lat');
  const lngStr = formatCoordinate(lng, 'lng');
  const locationInfo = getLocationFromCoordinates(lat, lng);
  const mapLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=4#map=4/${lat}/${lng}`;
  const asciiMap = generateASCIIIndicator(lat, lng);

  let output = `<span style="color: #ff0;">📡 Using simulated ISS position</span><br>`;
  output += `<em>(Live APIs unavailable - showing estimated orbital position)</em><br><br>`;
  output += `<strong>ISS Estimated Status:</strong><br>`;
  output += `Position: ${latStr}, ${lngStr}<br>`;
  output += `Location: ${locationInfo}<br>`;
  output += `Altitude: ~408 km above Earth<br>`;
  output += `Speed: ~27,600 km/h<br>`;
  output += `<br>`;
  output += `${asciiMap}<br>`;
  output += `<br>`;
  output += `<a href="${mapLink}" target="_blank" style="color: #0ff;">📍 View on OpenStreetMap</a><br>`;
  output += `<br>`;
  output += `<em>Simulated data - ${new Date().toLocaleString()}</em><br>`;
  output += `<em style="color: #888;">Note: ISS completes one orbit every ~93 minutes</em>`;

  return output;
}

function formatCoordinate(coord, type) {
  const abs = Math.abs(coord);
  const direction = type === 'lat'
    ? (coord >= 0 ? 'N' : 'S')
    : (coord >= 0 ? 'E' : 'W');
  return `${abs.toFixed(2)}°${direction}`;
}

function formatLocation(geoData) {
  if (geoData.oceanName) {
    return `Over ${geoData.oceanName}`;
  }

  if (geoData.countryName) {
    let location = `Over ${geoData.countryName}`;
    if (geoData.principalSubdivision) {
      location += `, ${geoData.principalSubdivision}`;
    }
    return location;
  }

  if (geoData.localityInfo && geoData.localityInfo.administrative) {
    const admin = geoData.localityInfo.administrative;
    if (admin.length > 0) {
      return `Over ${admin[0].name}`;
    }
  }

  return 'Over international waters';
}

function getLocationFromCoordinates(lat, lng) {
  // Major oceans (simplified ranges)
  if (lng > -30 && lng < 20 && lat > -60 && lat < 70) {
    return 'Over Atlantic Ocean';
  }
  if (lng > -180 && lng < -30 && lat > -60 && lat < 70) {
    return 'Over Pacific Ocean';
  }
  if (lng > 20 && lng < 147 && lat > -60 && lat < 30) {
    return 'Over Indian Ocean';
  }

  // Major landmasses (very simplified)
  if (lat > 30 && lat < 75 && lng > -10 && lng < 180) {
    return 'Over Asia/Europe';
  }
  if (lat > 25 && lat < 50 && lng > -130 && lng < -60) {
    return 'Over North America';
  }
  if (lat > -60 && lat < 15 && lng > -85 && lng < -30) {
    return 'Over South America';
  }
  if (lat > -40 && lat < 40 && lng > 10 && lng < 55) {
    return 'Over Africa';
  }

  return 'Over Earth';
}

function generateASCIIIndicator(lat, lng) {
  // Determine rough position on ASCII map
  let region = "somewhere";
  if (lng < -60) region = "Americas";
  else if (lng < 30) region = "Atlantic/Europe/Africa";
  else if (lng < 120) region = "Asia/Indian Ocean";
  else region = "Pacific";

  let hemisphere = lat > 0 ? "Northern" : "Southern";

  return `<pre>Global Position: ${hemisphere} ${region}

╭─────────────────────────────────────╮
│        ISS ORBITAL POSITION         │
│                                     │
│   🛰️  Currently orbiting above:     │
│       ${formatCoordinate(lat, 'lat')} ${formatCoordinate(lng, 'lng')}                    │
│                                     │
╰─────────────────────────────────────╯</pre>`;
}

iss.help = "Track the International Space Station's current position with location details and map link.";