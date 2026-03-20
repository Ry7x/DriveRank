'use client';
/**
 * @fileOverview Shërbimi ULTRA-ROBUST për kërkimin e lokacioneve ekskluzivisht në Republikën e Kosovës.
 * Mbështet kërkimin e pjesshëm (flexible/fuzzy) dhe pikat e interesit (POI).
 */

export interface SearchResult {
  name: string;
  lat: number;
  lng: number;
  displayName: string;
  type?: string;
  category?: 'city' | 'village' | 'fuel' | 'food' | 'hotel' | 'mountain' | 'landmark' | 'location';
}

/**
 * Përcakton kategorinë e lokacionit bazuar në të dhënat e OSM.
 */
function determineCategory(item: any): SearchResult['category'] {
  const addr = item.address || {};
  const type = (item.type || item.class || '').toLowerCase();
  const icon = (item.icon || '').toLowerCase();

  if (['city', 'town'].includes(type) || addr.city || addr.town) return 'city';
  if (['village', 'hamlet', 'suburb', 'neighbourhood'].includes(type) || addr.village || addr.hamlet) return 'village';
  if (['fuel', 'gas_station'].includes(type) || icon.includes('gas')) return 'fuel';
  if (['restaurant', 'food', 'cafe', 'fast_food', 'bar', 'pub'].includes(type) || icon.includes('restaurant')) return 'food';
  if (['hotel', 'motel', 'resort', 'guest_house', 'hostel'].includes(type) || icon.includes('hotel')) return 'hotel';
  if (['peak', 'mountain', 'volcano', 'natural'].includes(type) || icon.includes('mountain')) return 'mountain';
  if (['tourism', 'museum', 'historic', 'castle', 'monument', 'landmark'].includes(type)) return 'landmark';
  
  return 'location';
}

/**
 * Kërkon lokacione ekskluzivisht në Kosovë duke përdorur Nominatim API.
 * Përdor fuzzy matching dhe filtra strikt për Kosovën.
 */
export async function searchLocations(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    // BBox strikt për territorin e Republikës së Kosovës
    // [min_lat, min_lon, max_lat, max_lon]
    const viewbox = "19.9,41.8,21.8,43.3";
    
    // Përdorim Nominatim med filtra për Kosovë (xk) dhe addressdetails
    // q= kërkimi i përgjithshëm që mbështet fuzzy matching
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=15&countrycodes=xk&viewbox=${viewbox}&bounded=1&dedupe=1`;
    
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'sq,en',
        'User-Agent': 'DriveRankKosovo/1.5'
      }
    });
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();

    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const addr = item.address;
      
      // Përcaktojmë emrin kryesor sipas hierarkisë
      const name = addr.amenity || addr.tourism || addr.shop || addr.historic || addr.leisure || 
                   addr.castle || addr.peak || addr.resort || addr.hotel ||
                   addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || 
                   addr.neighbourhood || addr.road || item.display_name.split(',')[0];
      
      const category = determineCategory(item);
      
      const displayParts: string[] = [];
      
      // Shtojmë detajet e lokacionit për qartësi (Lagja, Fshati, Qyteti)
      const area = addr.suburb || addr.neighbourhood || addr.village || addr.hamlet;
      if (area && area.toLowerCase() !== name.toLowerCase()) displayParts.push(area);
      
      const city = addr.city || addr.town || addr.municipality || addr.county;
      if (city && city.toLowerCase() !== name.toLowerCase() && city.toLowerCase() !== (area || '').toLowerCase()) {
        displayParts.push(city);
      }
      
      displayParts.push("Kosovë");

      return {
        name: name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: displayParts.join(", "),
        category: category
      };
    }).sort((a, b) => {
      // Prioritizojmë qytetet dhe vendbanimet në fillim të listës
      const priorityOrder = { city: 0, village: 1, landmark: 2, hotel: 3, fuel: 4, food: 5, location: 6, mountain: 7 };
      return (priorityOrder[a.category || 'location'] || 99) - (priorityOrder[b.category || 'location'] || 99);
    });
  } catch (error) {
    console.error("Kërkimi në Kosovë dështoi:", error);
    return [];
  }
}

/**
 * Reverse Geocoding për të marrë emrin e rrugës, lagjes dhe qytetit nga koordinatat.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{road: string, city: string, neighborhood: string}> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'sq,en', 'User-Agent': 'DriveRankKosovo/1.5' }
    });
    const data = await response.json();
    const addr = data.address || {};
    return {
      road: addr.road || addr.pedestrian || "Rrugë lokale",
      city: addr.city || addr.town || addr.village || addr.municipality || "Kosovë",
      neighborhood: addr.suburb || addr.neighbourhood || addr.quarter || addr.village || ""
    };
  } catch (e) {
    return { road: "Rrugë lokale", city: "Kosovë", neighborhood: "" };
  }
}
