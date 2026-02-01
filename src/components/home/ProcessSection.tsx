"use client";

import React from "react";
import dynamic from "next/dynamic";
import { FaShoppingCart, FaStore, FaTruck, FaChartLine } from "react-icons/fa";

// Lazy-load motion
const MotionDiv = dynamic(
    () => import("framer-motion").then((m) => m.motion.div),
    { ssr: false }
);
const MotionSection = dynamic(
    () => import("framer-motion").then((m) => m.motion.section),
    { ssr: false }
);

// E-commerce stats
const steps = [
    {
        icon: <FaShoppingCart aria-hidden="true" />,
        title: "Orders Processed",
        description:
            "Successfully managed and fulfilled thousands of online and in-store orders with accuracy.",
        stepNumber: "50K+",
    },
    {
        icon: <FaStore aria-hidden="true" />,
        title: "Active Stores",
        description:
            "Trusted by growing businesses and merchants to manage inventory and sales seamlessly.",
        stepNumber: "1K+",
    },
    {
        icon: <FaTruck aria-hidden="true" />,
        title: "Fast Fulfillment",
        description:
            "Integrated shipping and delivery workflows ensuring quick and reliable order dispatch.",
        stepNumber: "24–48h",
    },
    {
        icon: <FaChartLine aria-hidden="true" />,
        title: "Business Growth",
        description:
            "Helping sellers scale faster with real-time analytics, reports, and automation tools.",
        stepNumber: "3×",
    },
];

// Card
const ProcessCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    stepNumber: string;
    offset: string;
}> = ({ icon, title, description, stepNumber, offset }) => (
    <MotionDiv
        className={`
      relative h-fit rounded-3xl p-6 flex flex-col gap-3
      bg-card text-foreground shadow-lg
      border border-border
      ${offset}
    `}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
    >
        {/* Icon & Metric */}
        <div className="flex items-center justify-between">
            <div className="text-6xl text-primary/20">{icon}</div>
            <div className="text-4xl font-extrabold text-primary">
                {stepNumber}
            </div>
        </div>

        <h3 className="text-lg font-semibold">{title}</h3>

        <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
        </p>
    </MotionDiv>
);

const ProcessSection: React.FC = () => {
    return (
        <MotionSection
            className="px-6 py-16 md:py-24 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {/* Heading */}
            <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-primary">
                    Our Platform in Numbers
                </h2>
                <p className="mt-3 text-sm md:text-base text-muted-foreground">
                    Built to power modern commerce — from inventory control to order
                    fulfillment and business growth.
                </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-14 max-w-7xl mx-auto">
                {steps.map((step, index) => (
                    <ProcessCard
                        key={index}
                        {...step}
                        offset={
                            index === 1
                                ? "md:mt-8"
                                : index === 2
                                    ? "md:mt-16"
                                    : index === 3
                                        ? "md:mt-24"
                                        : ""
                        }
                    />
                ))}
            </div>
        </MotionSection>
    );
};

export default ProcessSection;
