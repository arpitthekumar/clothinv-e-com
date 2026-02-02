"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
    question: string;
    answer: string;
}

const FAQ = () => {
    const [faqs] = useState<FAQItem[]>([
        {
            question: "How can I track my order?",
            answer:
                "Once your order is shipped, you’ll receive a tracking link via email and SMS. You can also track your order anytime from your account dashboard under the Orders section. Real-time updates from the courier will show shipment status, delivery progress, and expected delivery date.",
        },
        {
            question: "What is your return and refund policy?",
            answer:
                "You can request a return within 7 days of delivery if the product meets our return conditions. After the returned item is inspected and approved, the refund is initiated to your original payment method. Refunds usually take 5–7 business days to reflect, depending on your bank or payment provider.",
        },
        {
            question: "How long does shipping take?",
            answer:
                "Standard shipping typically takes 3–5 business days after the order is confirmed. Delivery time may vary based on your location, seller processing time, and courier availability. During peak sale periods or holidays, deliveries may take slightly longer.",
        },
        {
            question: "Can I cancel or modify my order?",
            answer:
                "Orders can be canceled or modified only before they are shipped. Once the seller ships the order, cancellation is no longer possible. In such cases, you may place a return request after delivery if the product is eligible under our return policy.",
        },
        {
            question: "How do I become a seller on the platform?",
            answer:
                "To become a seller, sign in to your account and select the “Become a Seller” option. You’ll need to complete identity verification, provide business details, and upload product information. Once approved, you can start listing products and managing orders from your seller dashboard.",
        },
        {
            question: "Are online payments secure?",
            answer:
                "Yes, all online payments on our platform are fully secure. We use encrypted connections and PCI-compliant payment gateways to protect your data. Multiple payment options are supported, including cards, UPI, wallets, and net banking, with additional fraud detection in place.",
        },
        {
            question: "Who do I contact for support?",
            answer:
                "For the fastest support, please sign in and use the Help Center available in your account. This allows us to assist you with order-specific issues more efficiently. Logged-in users receive priority support, faster responses, and access to detailed help articles.",
        },
    ]);

    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setActiveIndex((prev) => (prev === index ? null : index));
    };

    return (
        <section className="bg-background  px-6 ">
            {/* Header */}
            <div className="flex flex-col items-center text-center pb-12">

                <motion.h2
                    className="text-4xl md:text-5xl font-bold text-foreground"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    Frequently Asked Questions
                </motion.h2>

                <motion.p
                    className="text-muted-foreground max-w-2xl mt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                >
                    Everything you need to know about orders, shipping, returns,
                    payments, and selling on our platform.
                </motion.p>
            </div>

            {/* FAQ List */}
            <div className=" mx-auto space-y-4">
                {faqs.map((faq, index) => (
                    <motion.div
                        key={index}
                        className="
              rounded-2xl border bg-card p-6
              shadow-sm transition
              hover:shadow-md
            "
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.08 }}
                    >
                        <div
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => toggleFAQ(index)}
                        >
                            <h3 className="text-lg font-medium text-foreground">
                                {faq.question}
                            </h3>

                            <motion.span
                                className="
                  text-xl font-medium
                  border border-border
                  rounded-full
                  px-3 py-1
                  text-muted-foreground
                "
                                animate={{ rotate: activeIndex === index ? 180 : 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                                {activeIndex === index ? "−" : "+"}
                            </motion.span>
                        </div>

                        <AnimatePresence>
                            {activeIndex === index && (
                                <motion.p
                                    className="mt-3 text-lg text-muted-foreground leading-relaxed"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                >
                                    {faq.answer}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default FAQ;
