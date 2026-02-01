import Image, { StaticImageData } from "next/image";
import clsx from "clsx";

interface PromoBannerProps {
    title: string;
    subtitle?: string;
    imageSrc: string | StaticImageData;
    imageAlt?: string;
    backgroundColor?: string; // Tailwind class
    textColor?: string; // Tailwind class
}

const PromoBanner: React.FC<PromoBannerProps> = ({
    title,
    subtitle,
    imageSrc,
    imageAlt = "",
    backgroundColor = "bg-primary",
    textColor = "text-primary-foreground",
}) => {
    return (
        <section className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[18rem] overflow-hidden rounded-2xl border border-border">
                {/* Left image */}
                <div className="relative w-full aspect-[4/3] md:aspect-auto md:h-full">
                    <Image
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        className="object-cover"
                        loading="lazy"
                    />
                </div>

                {/* Right content */}
                <div
                    className={clsx(
                        backgroundColor,
                        textColor,
                        "flex flex-col justify-center px-8 py-12 md:py-0"
                    )}
                >
                    {subtitle && (
                        <p className="text-sm md:text-base tracking-widest font-medium uppercase mb-2 opacity-90">
                            {subtitle}
                        </p>
                    )}

                    <h2 className="text-3xl md:text-4xl font-bold leading-tight max-w-xl">
                        {title}
                    </h2>
                </div>
            </div>
        </section>
    );
};

export default PromoBanner;
