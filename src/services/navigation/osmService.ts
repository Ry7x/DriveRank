/**
 * @fileOverview Shërbimi për marrjen e të dhënave rrugore (Speed Limits, Traffic Lights, etc.) nga OpenStreetMap (Overpass API).
 */

export interface RoadMetadata {
  elements: any[];
}

export async function fetchRoadMetadata(lat: number, lng: number, radius: number = 1000): Promise<RoadMetadata> {
  // Përcaktojmë bounding box rreth lokacionit
  const offset = radius / 111320; // Përafërsisht konvertimi i metrave në shkallë
  const minLat = lat - offset;
  const maxLat = lat + offset;
  const minLng = lng - offset;
  const maxLng = lng + offset;

  const bbox = `${minLat},${minLng},${maxLat},${maxLng}`;
  
  // Query për Overpass API: Semaforë, STOP, Kufizime shpejtësie, Rrethrrotullime, Njëkahëshe
  const query = `
    [out:json][timeout:25];
    (
      node["highway"="traffic_signals"](${bbox});
      node["highway"="stop"](${bbox});
      way["maxspeed"](${bbox});
      way["oneway"="yes"](${bbox});
      way["junction"="roundabout"](${bbox});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    });
    
    if (!response.ok) throw new Error('OSM Data fetch failed');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("OSM Error:", error);
    return { elements: [] };
  }
}
