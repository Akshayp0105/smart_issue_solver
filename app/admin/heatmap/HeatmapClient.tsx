"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CAMPUS_CENTER: [number, number] = [9.5916, 76.5222];

export default function HeatmapClient() {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapRef.current) return;

    const map = L.map("heatmap-container", {
      center: CAMPUS_CENTER,
      zoom: 16,
    });

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const loadHeatmap = async () => {
      if (!db) return;

      const snap = await getDocs(collection(db, "reports"));
      const heatPoints: [number, number, number][] = [];

      snap.forEach((doc) => {
        const data = doc.data();
        if (data.latitude && data.longitude) {
          heatPoints.push([data.latitude, data.longitude, 0.8]);

          L.circleMarker([data.latitude, data.longitude], {
            radius: 5,
            fillColor: "#ef4444",
            color: "#fff",
            weight: 1,
            fillOpacity: 1,
          })
            .bindPopup(`
              <strong>${data.category}</strong><br/>
              ${data.location}<br/>
              Status: ${data.status}
            `)
            .addTo(map);
        }
      });

      if (heatPoints.length > 0) {
        // @ts-ignore
        L.heatLayer(heatPoints, {
          radius: 30,
          blur: 20,
          gradient: {
            0.2: "#60a5fa",
            0.5: "#facc15",
            1.0: "#ef4444",
          },
        }).addTo(map);
      }
    };

    loadHeatmap();

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div id="heatmap-container" className="flex-1" />;
}
