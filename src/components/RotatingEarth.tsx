import { useEffect, useRef } from "react";

const RotatingEarth = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let rotation = 0;
    const radius = Math.min(canvas.width, canvas.height) * 0.3;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const continents = [
      { name: "North America", lat: 45, lon: -100, width: 80, height: 60 },
      { name: "South America", lat: -15, lon: -60, width: 50, height: 70 },
      { name: "Europe", lat: 50, lon: 10, width: 40, height: 30 },
      { name: "Africa", lat: 0, lon: 20, width: 50, height: 60 },
      { name: "Asia", lat: 40, lon: 90, width: 100, height: 70 },
      { name: "Australia", lat: -25, lon: 135, width: 40, height: 30 },
    ];

    const project3DPoint = (lat: number, lon: number, rot: number) => {
      const latRad = (lat * Math.PI) / 180;
      const lonRad = ((lon + rot) * Math.PI) / 180;

      const x = radius * Math.cos(latRad) * Math.sin(lonRad);
      const y = radius * Math.sin(latRad);
      const z = radius * Math.cos(latRad) * Math.cos(lonRad);

      return { x, y, z };
    };

    const drawEarth = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, "rgba(80, 160, 240, 0.5)");
      gradient.addColorStop(0.4, "rgba(50, 120, 200, 0.45)");
      gradient.addColorStop(1, "rgba(20, 60, 140, 0.4)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = "rgba(100, 180, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      continents.forEach((continent) => {
        const points: Array<{ x: number; y: number; z: number }> = [];

        for (let dLat = -continent.height / 2; dLat <= continent.height / 2; dLat += 5) {
          for (let dLon = -continent.width / 2; dLon <= continent.width / 2; dLon += 5) {
            const lat = continent.lat + dLat;
            const lon = continent.lon + dLon;

            if (Math.abs(dLat) < continent.height / 2 && Math.abs(dLon) < continent.width / 2) {
              const distFromCenter = Math.sqrt(
                (dLat / (continent.height / 2)) ** 2 + (dLon / (continent.width / 2)) ** 2
              );
              if (distFromCenter < 0.9) {
                const point = project3DPoint(lat, lon, rotation);
                if (point.z > 0) {
                  points.push(point);
                }
              }
            }
          }
        }

        points.forEach((point) => {
          const size = 6 + Math.random() * 3;
          const opacity = Math.min(0.7, point.z / radius);

          ctx.beginPath();
          ctx.arc(centerX + point.x, centerY + point.y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(80, 200, 120, ${opacity})`;
          ctx.fill();
        });
      });

      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let firstPoint = true;

        for (let lon = 0; lon <= 360; lon += 5) {
          const point = project3DPoint(lat, lon, rotation);
          if (point.z > 0) {
            if (firstPoint) {
              ctx.moveTo(centerX + point.x, centerY + point.y);
              firstPoint = false;
            } else {
              ctx.lineTo(centerX + point.x, centerY + point.y);
            }
          } else {
            firstPoint = true;
          }
        }

        ctx.strokeStyle = "rgba(200, 220, 255, 0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let lon = 0; lon < 360; lon += 30) {
        ctx.beginPath();
        let firstPoint = true;

        for (let lat = -90; lat <= 90; lat += 5) {
          const point = project3DPoint(lat, lon, rotation);
          if (point.z > 0) {
            if (firstPoint) {
              ctx.moveTo(centerX + point.x, centerY + point.y);
              firstPoint = false;
            } else {
              ctx.lineTo(centerX + point.x, centerY + point.y);
            }
          } else {
            firstPoint = true;
          }
        }

        ctx.strokeStyle = "rgba(200, 220, 255, 0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const atmosphereGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        radius,
        centerX,
        centerY,
        radius + 30
      );
      atmosphereGradient.addColorStop(0, "rgba(120, 180, 255, 0.2)");
      atmosphereGradient.addColorStop(1, "rgba(120, 180, 255, 0)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 30, 0, Math.PI * 2);
      ctx.fillStyle = atmosphereGradient;
      ctx.fill();

      rotation += 0.3;
    };

    const animate = () => {
      drawEarth();
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 opacity-40"
      style={{ pointerEvents: "none" }}
    />
  );
};

export default RotatingEarth;
