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
                "Once your order is shipped, you’ll receive a tracking link via email and in your account dashboard under Orders.",
        },
        {
            question: "What is your return and refund policy?",
            answer:
                "You can request a return within 7 days of delivery. Refunds are processed after product inspection and credited within 5–7 business days.",
        },
        {
            question: "How long does shipping take?",
            answer:
                "Standard shipping usually takes 3–5 business days. Delivery times may vary depending on your location and seller.",
        },
        {
            question: "Can I cancel or modify my order?",
            answer:
                "Orders can be canceled or modified before they are shipped. Once shipped, changes are no longer possible.",
        },
        {
            question: "How do I become a seller on the platform?",
            answer:
                "Sign in to your account and choose the “Become a Seller” option. Complete the verification process to start selling.",
        },
        {
            question: "Are online payments secure?",
            answer:
                "Yes, all payments are encrypted and processed through secure, PCI-compliant payment gateways.",
        },
        {
            question: "Who do I contact for support?",
            answer:
                "For faster support, sign in and use the Help Center in your account. Logged-in users receive priority assistance.",
        },
    ]);

    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setActiveIndex((prev) => (prev === index ? null : index));
    };

    return (
        <section className="bg-background py-20 px-6 ">
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
                                    transition={{ duration: 0.3, ease: "easeOut" }}
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
