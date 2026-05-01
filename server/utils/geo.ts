export function getBoundingBox(polygons: { lat: number; lng: number }[][]) {
  let north = -90, south = 90, west = 180, east = -180;

  polygons.forEach(poly => {
    poly.forEach(point => {
      if (point.lat > north) north = point.lat;
      if (point.lat < south) south = point.lat;
      if (point.lng < west) west = point.lng;
      if (point.lng > east) east = point.lng;
    });
  });

  // Adicionamos uma pequena margem de erro (aprox. 500m) para não ser tão restrito
  const margin = 0.005; 

  return {
    north: north + margin,
    south: south - margin,
    west: west - margin,
    east: east + margin
  };
}