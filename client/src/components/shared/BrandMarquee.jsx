import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBrands } from "../../api/brands";

const BASE_GAP_PX = 40; // jarak minimum antar logo saat brand banyak (setara gap-10)

export default function BrandMarquee({ direction = "left" }) {
  const { data } = useQuery({
    queryKey: ["public-brands"],
    queryFn: () => getBrands(),
    staleTime: 1000 * 60 * 10,
  });

  const brands = data?.data?.data || [];

  const outerRef = useRef(null);
  const measureRef = useRef(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [itemsRawWidth, setItemsRawWidth] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);

  // Ukur lebar strip (viewport marquee)
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [brands.length]);

  // Ukur total lebar natural logo (tanpa gap) — diulang tiap ada gambar baru selesai loading
  useEffect(() => {
    if (!measureRef.current) return;
    setItemsRawWidth(measureRef.current.scrollWidth);
  }, [brands.length, loadedCount]);

  if (brands.length === 0) return null;

  // Lebar 1 "set" logo = lebar layar, ATAU lebar natural + jarak minimum (mana yang lebih besar)
  const naturalWidth = itemsRawWidth + brands.length * BASE_GAP_PX;
  const segmentWidth = Math.max(containerWidth, naturalWidth);
  const ready = segmentWidth > 0 && itemsRawWidth > 0;

  return (
    <div
      ref={outerRef}
      className="relative border-b border-slate-800 py-6 overflow-hidden"
    >
      <style>{`
        @keyframes brand-marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .brand-marquee-track {
          animation: brand-marquee-scroll 30s linear infinite;
        }
        .brand-marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .brand-marquee-track { animation: none; }
        }
      `}</style>

      {/* Elemen ukur tersembunyi — 1 set logo tanpa gap, buat hitung lebar natural total */}
      <div
        ref={measureRef}
        className="absolute top-0 left-0 -z-10 flex items-center opacity-0 pointer-events-none"
        aria-hidden="true"
      >
        {brands.map((brand) => (
          <div
            key={`measure-${brand.id}`}
            className="h-10 flex items-center shrink-0"
          >
            <img
              src={brand.image_url}
              alt=""
              className="h-full w-auto max-w-[140px] object-contain"
              onLoad={() => setLoadedCount((c) => c + 1)}
            />
          </div>
        ))}
      </div>

      {ready && (
        <div
          className="brand-marquee-track flex"
          style={{
            width: segmentWidth * 2,
            animationDirection: direction === "right" ? "reverse" : "normal",
          }}
        >
          {[0, 1].map((setIdx) => (
            <div
              key={setIdx}
              className="flex items-center justify-around shrink-0"
              style={{ width: segmentWidth }}
            >
              {brands.map((brand) => (
                <div
                  key={`${setIdx}-${brand.id}`}
                  className="shrink-0 h-10 flex items-center justify-center"
                >
                  <img
                    src={brand.image_url}
                    alt={brand.name}
                    className="h-full w-auto max-w-[140px] object-contain opacity-80 hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
