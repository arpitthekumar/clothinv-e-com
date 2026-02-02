"use client";

import { motion } from "framer-motion";
import { Button } from "../ui/button";
import Link from "next/link";

const Hero = () => {
  return (
    <div className="relative h-screen flex items-center bg-[url('/hero/ecom-hero1.png')] bg-cover bg-center">
      {/* Overlay */}
      <div className="absolute inset-0  backdrop-blur-sm" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 flex flex-col md:flex-row items-center h-full">
        {/* Left Content */}
        <motion.div
          className="md:w-1/2 mt-24 md:mt-36 text-center md:text-left"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.h1
            className="text-4xl md:text-7xl font-bold leading-tight"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Build, Manage &{" "}
            <span className="text-primary">Scale</span>{" "}
            Your Online Store
          </motion.h1>

          <motion.p
            className="mt-6 text-base md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            ShopFlow gives you powerful tools to manage products, inventory,
            orders, and payments — all from one simple dashboard.
          </motion.p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col md:flex-row gap-6 justify-center md:justify-start">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >

              <Link href="/store" className=" py-3 text-lg">
                <Button size="lg">Shop</Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link href="/store" className="">
              <Button
                size="lg"             >
                Explore Features
              </Button></Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Content – Stats */}
        <motion.div
          className="md:w-1/2 mt-20 md:mt-0 flex justify-center md:justify-end gap-14 md:pt-32"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex flex-col items-start">
            <span className="text-5xl md:text-6xl font-bold text-primary">
              50K+
            </span>
            <span className="text-sm md:text-lg text-muted-foreground">
              Orders Processed
            </span>
          </div>

          <div className="flex flex-col items-start">
            <span className="text-5xl md:text-6xl font-bold text-primary">
              1K+
            </span>
            <span className="text-sm md:text-lg text-muted-foreground">
              Active Merchants
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
