import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBrands } from "../../api/brands";

const SPEED = 24; // diperlambat sedikit — biar mata sempat menikmati efek lens saat logo lewat tengah

const MIN_SCALE = 0.4; // logo di tepi lebih kecil — kontras ke tengah makin terasa
const MAX_SCALE = 1.65; // logo persis di tengah membesar jauh lebih dramatis

const MIN_OPACITY = 0.35;
const MAX_OPACITY = 1;

const LENS_RADIUS_RATIO = 1.4;
const LENS_SHARPNESS = 2.8;

const VIGNETTE_MASK =
  "radial-gradient(ellipse 62% 80% at center, black 45%, transparent 92%)";

function createHoneycomb(width) {
  if (!width) return null;

  /*
   * Grid SERAGAM — semua baris punya jumlah icon yang sama.
   * Kesan "lingkaran" sekarang murni dari efek lens (scale + opacity
   * + radius), bukan dari menciutkan baris secara manual.
   */
  const ROWS = 5;
  const COLS = 5;

  const availableWidth = width * 0.92;

  let itemSize = 52;
  let gap = 8;

  let requiredWidth = COLS * itemSize + (COLS - 1) * gap;

  if (requiredWidth > availableWidth) {
    const scale = availableWidth / requiredWidth;
    itemSize = Math.max(40, Math.floor(itemSize * scale));
    gap = Math.max(4, Math.floor(gap * scale));
    requiredWidth = COLS * itemSize + (COLS - 1) * gap;
  }

  const colStep = itemSize + gap;
  const rowStep = colStep * 0.8660254; // sin(60°) — jarak vertikal hex packing

  /*
   * Baris ganjil (index 1, 3, ...) digeser setengah colStep ke kanan —
   * hex packing asli, bukan sekadar centering. Lebar cluster perlu
   * tambahan setengah colStep untuk menampung baris yang tergeser ini.
   */
  const clusterWidth = COLS * itemSize + (COLS - 1) * gap + colStep / 2;
  const clusterHeight = ROWS * itemSize + (ROWS - 1) * (rowStep - itemSize);

  const centerX = clusterWidth / 2;
  const centerY = clusterHeight / 2;

  const points = [];

  for (let rowIndex = 0; rowIndex < ROWS; rowIndex++) {
    const isOffsetRow = rowIndex % 2 === 1;
    const rowStartX = isOffsetRow ? colStep / 2 : 0;
    const y = rowIndex * rowStep + itemSize / 2;

    for (let colIndex = 0; colIndex < COLS; colIndex++) {
      const x = rowStartX + colIndex * colStep + itemSize / 2;

      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      points.push({ x, y, distance, row: rowIndex, col: colIndex });
    }
  }

  /*
   * Urutkan dari pusat ke luar — brand pertama muncul di tengah cluster.
   */
  points.sort((a, b) => a.distance - b.distance);

  /*
   * Radius lens diturunkan dari ukuran cluster sendiri (bukan px fixed) —
   * otomatis menyesuaikan saat itemSize mengecil responsif, rasio efek
   * "circular" tetap konsisten di semua ukuran layar.
   */
  const halfDiagonal = Math.hypot(clusterWidth, clusterHeight) / 2;
  const lensRadius = halfDiagonal * LENS_RADIUS_RATIO;

  return {
    points,
    width: clusterWidth,
    height: clusterHeight,
    centerX,
    centerY,
    itemSize,
    gap,
    colStep,
    rowStep,
    lensRadius,
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function BrandMarquee({ title }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-brands"],
    queryFn: () => getBrands(),
    staleTime: 1000 * 60 * 10,
  });

  /*
   * Tetap gunakan struktur data Anda yang sebelumnya.
   */
  const brands = data?.data?.data || [];

  const outerRef = useRef(null);
  const trackRef = useRef(null);

  /*
   * Array ref TIDAK di-reset setiap render.
   */
  const itemRefs = useRef([]);

  const animationRef = useRef(null);
  const lastTimeRef = useRef(null);
  const offsetRef = useRef(0);

  const pausedRef = useRef(false);

  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });

  const [isInView, setIsInView] = useState(false);

  /* =========================================================
     MEASURE CONTAINER
  ========================================================= */

  useEffect(() => {
    const element = outerRef.current;

    if (!element) return;

    const update = () => {
      setSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    update();

    const observer = new ResizeObserver(update);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  /* =========================================================
     VISIBILITY — animasi hanya jalan saat section benar-benar
     terlihat, supaya tidak menyita main thread di initial load
     ketika footer masih below-the-fold.
  ========================================================= */

  useEffect(() => {
    const element = outerRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: "200px" }, // mulai sedikit sebelum section masuk viewport, biar tidak "kaget" pas discroll
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  /* =========================================================
     CLUSTER
  ========================================================= */

  const cluster = useMemo(() => {
    if (size.width <= 0) {
      return null;
    }

    return createHoneycomb(size.width);
  }, [size.width]);

  /* =========================================================
     ITEMS
  ========================================================= */

  const items = useMemo(() => {
    if (!cluster || brands.length === 0) {
      return [];
    }

    return cluster.points.map((point, index) => {
      const brand = brands[index % brands.length];

      return {
        key: `${brand.id}-${index}`,

        brand,

        left: point.x - cluster.itemSize / 2,

        top: point.y - cluster.itemSize / 2,

        centerX: point.x,
        centerY: point.y,
      };
    });
  }, [cluster, brands]);

  /* =========================================================
     LOOP SIZE
  ========================================================= */

  const cycleHeight = cluster?.height || 220;

  /*
   * Kita selalu render minimal 4 cluster.
   */
  const copyCount = Math.max(4, Math.ceil(size.height / cycleHeight) + 3);

  /* =========================================================
     ANIMATION
  ========================================================= */

  useEffect(() => {
    if (
      !isInView ||
      !cluster ||
      items.length === 0 ||
      size.width <= 0 ||
      size.height <= 0
    ) {
      return;
    }

    const animate = (time) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }

      const delta = Math.min(time - lastTimeRef.current, 50) / 1000;

      lastTimeRef.current = time;

      /*
       * ================================================
       * MOVE
       * ================================================
       */

      if (!pausedRef.current) {
        offsetRef.current += SPEED * delta;

        /*
         * Inilah looping.
         */
        if (offsetRef.current >= cycleHeight) {
          offsetRef.current -= cycleHeight;
        }
      }

      const offset = offsetRef.current;

      /*
       * ================================================
       * TRACK
       * ================================================
       */

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(0, ${-offset}px, 0)`;
      }

      /*
       * ================================================
       * LENS
       * ================================================
       */

      const centerX = size.width / 2;

      const centerY = size.height / 2;

      const clusterLeft = (size.width - cluster.width) / 2;

      for (let copy = 0; copy < copyCount; copy++) {
        for (let i = 0; i < items.length; i++) {
          const index = copy * items.length + i;

          const element = itemRefs.current[index];

          if (!element) {
            continue;
          }

          const item = items[i];

          const x = clusterLeft + item.centerX;

          const y = copy * cycleHeight + item.centerY - offset;

          const buffer = cluster.itemSize;
          if (y < -buffer || y > size.height + buffer) {
            continue;
          }

          const dx = x - centerX;

          const dy = y - centerY;

          const distance = Math.sqrt(dx * dx + dy * dy);

          /*
           * 0 = tengah
           * 1 = pinggir
           */
          const normalized = Math.min(distance / cluster.lensRadius, 1);

          /*
           * Kurva dasar cosinus, lalu dipertajam pakai LENS_SHARPNESS
           * (dipangkatkan) supaya puncaknya lebih fokus — bukan landai merata.
           */
          const rawLens = (Math.cos(normalized * Math.PI) + 1) / 2;
          const lens = Math.pow(rawLens, LENS_SHARPNESS);

          const scale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * lens;

          const opacity = MIN_OPACITY + (MAX_OPACITY - MIN_OPACITY) * lens;

          element.style.transform = `scale(${scale})`;

          element.style.opacity = String(opacity);

          /*
           * Logo yang sedang membesar dinaikkan z-index-nya supaya
           * "menutupi" logo tetangga saat overlap akibat scale besar —
           * ini yang bikin efeknya kerasa seperti kaca pembesar sungguhan.
           */
          element.style.zIndex = String(Math.round(lens * 100));
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      animationRef.current = null;

      lastTimeRef.current = null;
    };
  }, [
    isInView,
    cluster,
    items,
    size.width,
    size.height,
    cycleHeight,
    copyCount,
  ]);

  if (isLoading) {
    return (
      <div>
        {title && <h4 className="text-white font-semibold mb-4">{title}</h4>}
        <div className="w-47.5 lg:w-57.5 mx-auto md:mx-0">
          <div
            ref={outerRef}
            className="relative w-full h-52 md:h-56 overflow-hidden"
            style={{
              maskImage: VIGNETTE_MASK,
              WebkitMaskImage: VIGNETTE_MASK,
            }}
          >
            {cluster && (
              <div className="absolute left-0 top-0 w-full">
                {cluster.points.map((point, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-slate-800 border border-slate-700 animate-pulse"
                    style={{
                      width: cluster.itemSize,
                      height: cluster.itemSize,
                      left:
                        (size.width - cluster.width) / 2 +
                        point.x -
                        cluster.itemSize / 2,
                      top: point.y - cluster.itemSize / 2,
                      // stagger halus dari tengah ke luar — bukan berkedip serentak
                      animationDelay: `${(point.distance / 60).toFixed(2)}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (brands.length === 0) {
    return null;
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div>
      {title && <h4 className="text-white font-semibold mb-4">{title}</h4>}
      <div className="w-47.5 lg:w-57.5 mx-auto md:mx-0">
        <div
          ref={outerRef}
          className="
        relative
        w-full
        h-52
        md:h-56
        overflow-hidden
      "
          style={{
            maskImage: VIGNETTE_MASK,
            WebkitMaskImage: VIGNETTE_MASK, // Safari masih butuh prefix ini
          }}
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
          }}
        >
          {cluster && (
            <div
              ref={trackRef}
              className="
            absolute
            left-0
            top-0
            w-full
            will-change-transform
          "
            >
              {Array.from({
                length: copyCount,
              }).map((_, copy) =>
                items.map((item, index) => (
                  <div
                    key={`${copy}-${item.key}`}
                    ref={(element) => {
                      itemRefs.current[copy * items.length + index] = element;
                    }}
                    className="
                  absolute
                  flex
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-800
                  border
                  border-slate-700
                  will-change-transform
                "
                    style={{
                      width: cluster.itemSize,
                      height: cluster.itemSize,

                      left: (size.width - cluster.width) / 2 + item.left,

                      top: copy * cycleHeight + item.top,

                      opacity: 1,
                      transform: "scale(1)",
                      transformOrigin: "center center",
                    }}
                  >
                    <img
                      src={item.brand.image_url}
                      alt={item.brand.name || "Brand"}
                      className="
                      block
                      w-[70%]
                      h-[70%]
                      object-contain
                    "
                      loading="eager"
                      draggable={false}
                    />
                  </div>
                )),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
