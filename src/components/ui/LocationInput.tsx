"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type LocationValue = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  coords?: { lat: number; lng: number } | null;
};

const STORAGE_KEY = "user_location_full";

export default function LocationInput({
  value,
  onChange,
  compact = false,
}: {
  value?: LocationValue | null;
  onChange?: (next: LocationValue | null) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loc, setLoc] = useState<LocationValue | null>(null);

  useEffect(() => {
    // init from prop or localStorage
    if (value) setLoc(value);
    else if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setLoc(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    // keep prop changes in sync
    if (value) setLoc(value);
  }, [value]);

  const save = (next: LocationValue | null) => {
    setLoc(next);
    if (typeof window !== "undefined") {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    }
    onChange?.(next ?? null);
    setOpen(false);
  };

  const clear = () => save(null);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not available in your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const next: LocationValue = { coords, addressLine1: `Lat: ${coords.lat.toFixed(4)}, Lon: ${coords.lng.toFixed(4)}` };
        save(next);
      },
      (err) => {
        console.error("Geolocation error", err);
        alert("Could not fetch your location: " + err.message);
      },
      { maximumAge: 1000 * 60 * 5 }
    );
  };

  const summary = () => {
    if (!loc) return "Location";
    if (loc.addressLine1) return loc.addressLine1;
    if (loc.city && loc.country) return `${loc.city}, ${loc.country}`;
    if (loc.city) return loc.city;
    if (loc.coords) return `Lat ${loc.coords.lat.toFixed(2)}, Lon ${loc.coords.lng.toFixed(2)}`;
    return "Location";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className={`hidden sm:inline-flex items-center gap-1 text-muted-foreground cursor-pointer ${compact ? "px-2 py-1" : "px-3 py-2"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {/* simple icon placeholder — parent can place MapPin if desired */}
        <span className="truncate" style={{ maxWidth: compact ? 120 : 220 }}>{summary()}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] z-50 rounded-md bg-popover shadow-lg border p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Set your location</div>
              <div className="text-xs text-muted-foreground">Saved locally</div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Input placeholder="Address line 1" value={loc?.addressLine1 ?? ""} onChange={(e) => setLoc((p) => ({ ...(p ?? {}), addressLine1: e.target.value }))} />
              <Input placeholder="Address line 2 (optional)" value={loc?.addressLine2 ?? ""} onChange={(e) => setLoc((p) => ({ ...(p ?? {}), addressLine2: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="City" value={loc?.city ?? ""} onChange={(e) => setLoc((p) => ({ ...(p ?? {}), city: e.target.value }))} />
                <Input placeholder="State / Region" value={loc?.state ?? ""} onChange={(e) => setLoc((p) => ({ ...(p ?? {}), state: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Postcode" value={loc?.postcode ?? ""} onChange={(e) => setLoc((p) => ({ ...(p ?? {}), postcode: e.target.value }))} />
                <Input placeholder="Country" value={loc?.country ?? ""} onChange={(e) => setLoc((p) => ({ ...(p ?? {}), country: e.target.value }))} />
              </div>

              {loc?.coords && (
                <div className="text-xs text-muted-foreground">Coords: {`Lat ${loc.coords.lat.toFixed(4)}, Lon ${loc.coords.lng.toFixed(4)}`}</div>
              )}

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => save(loc ?? null)}>Save</Button>
                <Button variant="outline" size="sm" onClick={() => useMyLocation()}>Use my location</Button>
                <Button variant="ghost" size="sm" onClick={() => clear()}>Clear</Button>
              </div>

              <div className="text-xs text-muted-foreground">Tip: enter a full street address for best results. To enable auto-complete or reverse-geocoding, add a geocoding provider (Google/Mapbox) later.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
