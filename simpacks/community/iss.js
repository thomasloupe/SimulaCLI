// iss - International Space Station tracker with location and map
// Community package for SimulaCLI

export default async function iss(...args) {
  let loadingInterval;

  try {
    // Show animated loading message
    const terminal = document.getElementById('terminal');
    const loadingDiv = document.createElement('div');
    terminal.appendChild(loadingDiv);

    // Animate the loading message
    let dots = 0;
    const maxDots = 3;
    loadingInterval = setInterval(() => {
      dots = (dots + 1) % (maxDots + 1);
      loadingDiv.textContent = 'Locating ISS' + '.'.repeat(dots);
    }, 500);

    // Fetch ISS current position data
    const issResponse = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    if (!issResponse.ok) {
      throw new Error('Failed to fetch ISS data');
    }

    const issData = await issResponse.json();
    const lat = parseFloat(issData.latitude);
    const lng = parseFloat(issData.longitude);
    const altitude = parseFloat(issData.altitude);
    const velocity = parseFloat(issData.velocity);

    // Stop animation and remove loading message
    clearInterval(loadingInterval);
    terminal.removeChild(loadingDiv);

    // Get location information
    let locationInfo = 'Unknown location';
    try {
      const geoResponse = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        locationInfo = formatLocation(geoData);
      }
    } catch (error) {
      console.log('Geocoding failed, using coordinate-based location');
      locationInfo = getLocationFromCoordinates(lat, lng);
    }

    // Generate OpenStreetMap link
    const mapLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=4#map=4/${lat}/${lng}`;

    // Format coordinates
    const latStr = formatCoordinate(lat, 'lat');
    const lngStr = formatCoordinate(lng, 'lng');

    // Create ASCII visual indicator
    const asciiMap = generateASCIIIndicator(lat, lng);

    // Build output
    let output = `<strong>ISS Current Status:</strong><br>`;
    output += `<br>`;
    output += `Position: ${latStr}, ${lngStr}<br>`;
    output += `Location: ${locationInfo}<br>`;
    output += `Altitude: ${altitude.toFixed(1)} km above Earth<br>`;
    output += `Speed: ${velocity.toFixed(0)} km/h<br>`;
    output += `Visibility: ${issData.visibility}<br>`;
    output += `<br>`;
    output += `${asciiMap}<br>`;
    output += `<br>`;
    output += `<a href="${mapLink}" target="_blank">View on OpenStreetMap</a><br>`;
    output += `<br>`;
    output += `<em>Data updated: ${new Date(issData.timestamp * 1000).toLocaleTimeString()}</em>`;

    return output;

  } catch (error) {
    // Clean up animation and loading message
    if (loadingInterval) {
      clearInterval(loadingInterval);
    }

    const terminal = document.getElementById('terminal');
    const loadingDivs = terminal.querySelectorAll('div');
    loadingDivs.forEach(div => {
      if (div.textContent && div.textContent.includes('Locating ISS')) {
        terminal.removeChild(div);
      }
    });

    return `Error tracking ISS: ${error.message}<br>The ISS API might be temporarily unavailable.`;
  }
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
  // Basic ocean/continent detection based on coordinates
  // This is a simplified fallback

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

  // Format coordinates and center them in the box
  const latStr = formatCoordinate(lat, 'lat');
  const lngStr = formatCoordinate(lng, 'lng');
  const coordText = `${latStr} ${lngStr}`;

  // Center the coordinates in a 37-character wide box
  const boxWidth = 37;
  const padding = Math.max(0, Math.floor((boxWidth - coordText.length) / 2));
  const rightPadding = boxWidth - coordText.length - padding;
  const centeredCoords = ' '.repeat(padding) + coordText + ' '.repeat(rightPadding);

  return `<pre>Global Position: ${hemisphere} ${region}

╭─────────────────────────────────────╮
│        ISS ORBITAL POSITION         │
│                                     │
│   🛰️  Currently orbiting above:     │
│${centeredCoords}│
│                                     │
╰─────────────────────────────────────╯</pre>`;
}

iss.help = "Track the International Space Station's current position with location details and map link.";