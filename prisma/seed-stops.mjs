import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
console.log("Connected. Seeding stops with prices...");

// Get route IDs
const [routes] = await conn.execute("SELECT id, origin, destination FROM Route WHERE isDeleted = 0");

for (const route of routes) {
  // Check if stops already exist
  const [existing] = await conn.execute(
    "SELECT COUNT(*) as count FROM RouteStop WHERE routeId = ?",
    [route.id]
  );
  
  if (existing[0].count > 0) {
    console.log(`Route ${route.origin} → ${route.destination} already has stops, skipping...`);
    continue;
  }
  
  // Create sample stops based on route
  let stops = [];
  
  if (route.origin.includes('Bandung') && route.destination.includes('Jakarta')) {
    stops = [
      { name: route.origin, sequence: 1, price: 0 },
      { name: 'Cileunyi', sequence: 2, price: 25000 },
      { name: 'Cikarang', sequence: 3, price: 50000 },
      { name: 'Cawang', sequence: 4, price: 50000 },
      { name: route.destination, sequence: 5, price: 50000 },
    ];
  } else if (route.origin.includes('Jakarta') && route.destination.includes('Bandung')) {
    stops = [
      { name: route.origin, sequence: 1, price: 0 },
      { name: 'Cawang', sequence: 2, price: 25000 },
      { name: 'Cikarang', sequence: 3, price: 50000 },
      { name: 'Cileunyi', sequence: 4, price: 50000 },
      { name: route.destination, sequence: 5, price: 50000 },
    ];
  } else {
    // Generic stops
    stops = [
      { name: route.origin, sequence: 1, price: 0 },
      { name: 'Titik Tengah A', sequence: 2, price: 50000 },
      { name: 'Titik Tengah B', sequence: 3, price: 50000 },
      { name: route.destination, sequence: 4, price: 50000 },
    ];
  }
  
  for (const stop of stops) {
    await conn.execute(
      "INSERT INTO RouteStop (id, routeId, name, sequence, price, stopTime, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, NULL, NOW(), NOW())",
      [route.id, stop.name, stop.sequence, stop.price]
    );
  }
  
  console.log(`Created ${stops.length} stops for ${route.origin} → ${route.destination}`);
}

await conn.end();
console.log("Done!");
