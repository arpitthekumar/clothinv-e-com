"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";
import { Variants, easeOut } from "framer-motion";

/* Lazy motion components */
const MotionFooter = dynamic(
  () => import("framer-motion").then((m) => m.motion.footer),
  { ssr: false }
);
const MotionDiv = dynamic(
  () => import("framer-motion").then((m) => m.motion.div),
  { ssr: false }
);
const MotionA = dynamic(
  () => import("framer-motion").then((m) => m.motion.a),
  { ssr: false }
);
const MotionLi = dynamic(
  () => import("framer-motion").then((m) => m.motion.li),
  { ssr: false }
);
const MotionP = dynamic(
  () => import("framer-motion").then((m) => m.motion.p),
  { ssr: false }
);

export function HomeFooter() {
  const links = [
    {
      title: "Platform",
      items: [
        { name: "Home", href: "/" },
        { name: "Shop", href: "/store" },
        { name: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Legal",
      items: [
        { name: "Privacy Policy", href: "/privacy-policy" },
        { name: "Terms of Service", href: "/terms" },
      ],
    },
    {
      title: "Account",
      items: [
        { name: "Sign In", href: "/auth" },
      ],
    },
  ];

  const socialIcons = [
    { icon: <FaFacebookF />, href: "https://facebook.com", label: "Facebook" },
    { icon: <FaInstagram />, href: "https://instagram.com", label: "Instagram" },
    { icon: <FaLinkedinIn />, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: <FaYoutube />, href: "https://youtube.com", label: "YouTube" },
    { icon: <FaXTwitter />, href: "https://twitter.com", label: "Twitter" },
  ];

  const glowVariants: Variants = {
    hidden: { opacity: 0, scale: 0.7 },
    show: {
      opacity: 0.9,
      scale: 1,
      transition: { duration: 0.9, ease: easeOut },
    },
  };

  return (
    <MotionFooter
      className="relative py-12 px-6 md:px-20 overflow-hidden"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: easeOut }}
    >
      {/* Background glows */}
      <MotionDiv
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {/* Primary glow */}
        <MotionDiv
          variants={glowVariants}
          className="
      absolute
      w-[320px] h-[320px]
      md:w-[520px] md:h-[520px]
      rounded-full
      blur-[140px]
      bottom-[-160px]
      left-[8%]
      bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)]
      opacity-60
    "
        />
        <MotionDiv
          variants={glowVariants}
          className="absolute
      w-[260px] h-[260px]
      md:w-[420px] md:h-[420px]
      rounded-full
      blur-[140px]
      top-[60px]
      right-[-160px]
      bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)]
      opacity-45
      mix-blend-screen
    "
        />
        {/* Depth layer (dark mode helper) */}
        <MotionDiv
          className="
      absolute inset-0
      bg-gradient-to-t
      from-black/5
      dark:from-black/30
      to-transparent
      pointer-events-none
    "
        />
      </MotionDiv>
      {/* Content */}
      <MotionDiv
        className="max-w-9xl mx-auto grid gap-10 md:gap-24 grid-cols-1 md:grid-cols-5"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
        }}
      >
        {/* Brand */}
        <MotionDiv
          className="md:col-span-2"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-brandblue">
            ShopFlow
          </h2>
          <p className="mt-4 md:mt-8 max-w-md text-sm ">
            ShopFlow helps you manage products, orders, and inventory —
            all in one powerful e-commerce platform.
          </p>

          <MotionDiv className="flex gap-4 mt-6">
            {socialIcons.map((item, i) => (
              <MotionA
                key={i}
                href={item.href}
                target="_blank"
                aria-label={item.label}
                className="text-2xl  hover:text-brandblue"
                whileHover={{ y: -3 }}
              >
                {item.icon}
              </MotionA>
            ))}
          </MotionDiv>
        </MotionDiv>

        {/* Links */}
        {links.map((section, i) => (
          <MotionDiv
            key={i}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <h3 className="text-xl font-bold text-brandblue">
              {section.title}
            </h3>
            <hr className="my-3" />
            <ul className="space-y-4 text-sm">
              {section.items.map((link, j) => (
                <MotionLi
                  key={j}
                  whileHover={{ x: 6 }}
                  className="transition  hover:text-brandblue"
                >
                  <Link href={link.href}>{link.name}</Link>
                </MotionLi>
              ))}
            </ul>
          </MotionDiv>
        ))}
      </MotionDiv>

      {/* Bottom */}
      <MotionP
        className="mt-10 text-center text-sm md:text-base"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        © {new Date().getFullYear()} ShopFlow. All rights reserved.
      </MotionP>
    </MotionFooter>
  );
}
