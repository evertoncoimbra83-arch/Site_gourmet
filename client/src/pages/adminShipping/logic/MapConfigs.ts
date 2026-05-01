export const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

export const mapStyles: google.maps.MapTypeStyle[] = [
  { featureType: "all", elementType: "geometry", stylers: [{ color: "#1a202c" }] },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ visibility: "off" }] },
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#718096" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d3748" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
];

export interface LatLng { lat: number; lng: number; }
export interface CircleData { center: LatLng; radius: number; }
export interface Bounds { north: number; south: number; east: number; west: number; }