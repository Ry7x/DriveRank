/**
 * @fileOverview Shërbimi i navigimit për llogaritjen e rrugëve duke përdorur OSRM API.
 * Mbështet llogaritjen e rrugës më të shpejtë, alternativave dhe udhëzimeve turn-by-turn.
 */

export interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  type: string;
  modifier?: string;
  name: string;
  location: [number, number];
}

export interface RouteData {
  coordinates: [number, number][]; // [lat, lng]
  distance: number; // metra
  duration: number; // sekonda
  summary: string;
  steps: RouteStep[];
}

export async function calculateRoutes(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<RouteData[]> {
  try {
    // Shtojmë steps=true dhe annotations=true për navigim profesional
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true&steps=true`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return [];
    }

    return data.routes.map((route: any) => ({
      coordinates: route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]),
      distance: route.distance,
      duration: route.duration,
      summary: route.legs[0]?.summary || "Rrugë Alternative",
      steps: route.legs[0]?.steps.map((step: any) => ({
        distance: step.distance,
        duration: step.duration,
        instruction: step.maneuver.instruction,
        type: step.maneuver.type,
        modifier: step.maneuver.modifier,
        name: step.name || "Vazhdo drejt",
        location: [step.maneuver.location[1], step.maneuver.location[0]]
      })) || []
    }));
  } catch (error) {
    console.error("Dështoi llogaritja e rrugës:", error);
    return [];
  }
}
