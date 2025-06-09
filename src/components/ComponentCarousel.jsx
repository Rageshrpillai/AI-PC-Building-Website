// src/components/ComponentCarousel.jsx
import React, { useMemo } from "react";
import useProductStore from "../stores/productStore";
import { Link } from "react-router-dom";

// Import Swiper React components and required modules
import { Swiper, SwiperSlide } from "swiper/react";
import {
  EffectCoverflow,
  Pagination,
  Autoplay,
  Navigation,
} from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

// A custom card component specifically for the carousel slides
const CarouselCard = ({ part }) => {
  if (!part) return null;
  const fallbackImage = `https://placehold.co/400x500/1A1325/FFF?text=${encodeURIComponent(
    part.category || "Part"
  )}`;

  return (
    <div className="group relative block w-full h-full rounded-lg overflow-hidden text-white shadow-lg">
      <img
        src={part.imageUrl || fallbackImage}
        alt={part.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <h3 className="text-xl font-bold">{part.name}</h3>
        <p className="text-sm text-gray-300">{part.brand}</p>
      </div>
    </div>
  );
};

export default function ComponentCarousel() {
  const allProducts = useProductStore((s) => s.allProducts);

  const featuredProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    // Pick a variety of components to feature
    const gpus = allProducts.filter((p) => p.category === "gpu").slice(0, 3);
    const cpus = allProducts.filter((p) => p.category === "cpu").slice(0, 3);
    const motherboards = allProducts
      .filter((p) => p.category === "motherboard")
      .slice(0, 2);
    const rams = allProducts.filter((p) => p.category === "ram").slice(0, 2);
    // Shuffle the products to make the carousel feel dynamic on each load
    return [...gpus, ...cpus, ...motherboards, ...rams].sort(
      () => 0.5 - Math.random()
    );
  }, [allProducts]);

  if (featuredProducts.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-center text-gray-500">
        Loading components...
      </div>
    );
  }

  return (
    <div className="w-full">
      <Swiper
        effect={"coverflow"}
        grabCursor={true}
        centeredSlides={true}
        loop={true}
        slidesPerView={"auto"}
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        pagination={{ clickable: true }}
        navigation={true}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
        }}
        modules={[EffectCoverflow, Pagination, Autoplay, Navigation]}
        className="w-full py-12 component-carousel"
        style={{
          "--swiper-pagination-color": "#9333ea", // purple-600
          "--swiper-pagination-bullet-inactive-color": "#4b5563", // gray-600
          "--swiper-navigation-color": "#a78bfa", // violet-400
        }}
      >
        {featuredProducts.map((part) => (
          <SwiperSlide
            key={part.id}
            style={{ width: "320px", height: "420px" }}
          >
            <CarouselCard part={part} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
