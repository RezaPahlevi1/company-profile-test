import { useQuery } from "@tanstack/react-query";
import { getBrands } from "../../api/brands";

function BrandGroup({ brands }) {
  return (
    <div
      className="
        shrink-0
        min-w-[100vw]
        flex
        items-center
        justify-center
        gap-8
        sm:gap-10
        md:gap-12
        px-6
        sm:px-8
      "
    >
      {brands.map((brand) => (
        <div
          key={brand.id}
          className="
            shrink-0
            h-8
            sm:h-9
            md:h-10
            flex
            items-center
            justify-center
          "
        >
          <img
            src={brand.image_url}
            alt={brand.name}
            className="
              h-full
              w-auto
              max-w-[100px]
              sm:max-w-[120px]
              md:max-w-[140px]
              object-contain
              opacity-80
              hover:opacity-100
              transition-opacity
            "
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

export default function BrandMarquee({ direction = "left" }) {
  const { data } = useQuery({
    queryKey: ["public-brands"],
    queryFn: getBrands,
    staleTime: 1000 * 60 * 10,
  });

  const brands = data?.data?.data || [];

  if (brands.length === 0) return null;

  const isRight = String(direction).toLowerCase() === "right";

  return (
    <div className="border-b border-slate-800 py-5 sm:py-6 overflow-hidden">
      <style>{`
        @keyframes brand-marquee-left {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        @keyframes brand-marquee-right {
          from {
            transform: translate3d(-50%, 0, 0);
          }

          to {
            transform: translate3d(0, 0, 0);
          }
        }

        .brand-marquee-track-left {
          animation: brand-marquee-left 18s linear infinite;
        }

        .brand-marquee-track-right {
          animation: brand-marquee-right 18s linear infinite;
        }

        .brand-marquee-track-left:hover,
        .brand-marquee-track-right:hover {
          animation-play-state: paused;
        }

        @media (max-width: 640px) {
          .brand-marquee-track-left,
          .brand-marquee-track-right {
            animation-duration: 14s;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .brand-marquee-track-left,
          .brand-marquee-track-right {
            animation: none;
          }
        }
      `}</style>

      <div className="w-full overflow-hidden">
        <div
          className={[
            "flex w-max",
            isRight ? "brand-marquee-track-right" : "brand-marquee-track-left",
          ].join(" ")}
        >
          {/* Grup pertama */}
          <BrandGroup brands={brands} />

          {/* Grup kedua identik */}
          <BrandGroup brands={brands} />
        </div>
      </div>
    </div>
  );
}
