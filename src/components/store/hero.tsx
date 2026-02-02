"use client";

import React, { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";

interface HeroProps {
    backgroundImage?: string | StaticImageData;
    altText?: string;
    showHr?: boolean;
    heightClass?: string;
    carousel?: boolean;
    carouselImages?: (string | StaticImageData)[];
    overlay?: boolean;
}

const Hero: React.FC<HeroProps> = ({
    backgroundImage,
    altText = "Hero Banner",
    showHr = false,
    heightClass = "h-[700px]",
    carousel = false,
    carouselImages = [],
    overlay = true,
}) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!carousel || carouselImages.length === 0) return;

        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % carouselImages.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [carousel, carouselImages.length]);

    const shouldShowImage =
        (carousel && carouselImages.length > 0) || backgroundImage;

    return (
        <section className="relative w-full  overflow-hidden">
            {showHr && (
                <hr className="w-full h-9 bg-[color:var(--primary)]" />
            )}

            {shouldShowImage && (
                <div className={`relative w-full ${heightClass}`}>
                    {/* Images */}
                    {carousel && carouselImages.length > 0 ? (
                        <div className="relative w-full h-full">
                            {carouselImages.map((img, i) => (
                                <Image
                                    key={i}
                                    src={img}
                                    alt={`${altText} - ${i + 1}`}
                                    fill
                                    priority={i === 0}
                                    className={`absolute inset-0 md:object-cover  transition-opacity duration-1000 ease-in-out ${i === index ? "opacity-100 z-10" : "opacity-0 z-0"
                                        }`}
                                />
                            ))}
                        </div>
                    ) : (
                        <Image
                            src={backgroundImage!}
                            alt={altText}
                            fill
                            priority
                            className="object-cover"
                        />
                    )}

                    {/* Theme-aware overlay */}
                    {overlay && (
                        <div className="absolute inset-0 z-20 
              bg-gradient-to-b 
              from-black/30 
              via-black/20 
              to-black/40
              dark:from-black/60 
              dark:via-black/50 
              dark:to-black/70"
                        />
                    )}

                    {/* Content slot */}
                    <div className="relative z-30 h-full flex items-center justify-center text-center px-6">
                        <div className="max-w-3xl">
                            <h1 className="text-4xl md:text-6xl font-bold text-white">
                                Theme Aware Hero
                            </h1>
                            <p className="mt-4 text-lg text-white/90">
                                Automatically adapts to light & dark mode
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Hero;
