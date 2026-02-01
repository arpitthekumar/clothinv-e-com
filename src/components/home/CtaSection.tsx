// components/CtaSection.tsx

import Link from "next/link";
import { Button } from "../ui/button";

const Cta = () => {
    return (
        <section className="relative py-20">
            <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
                <div className="relative rounded-2xl ">
                    {/* Tilted background layer */}
                    <div
                        className="
              absolute inset-0 -z-10
              bg-primary/100
              dark:bg-primary/100
              rotate-[-3deg]
              scale-105
              rounded-3xl
            "
                    />

                    {/* Main card */}
                    <div
                        className="
              bg-card border border-border z-0
              rounded-2xl
              shadow-lg
              px-10 py-16 md:px-20 md:py-20
            "
                    >
                        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            {/* Text */}
                            <div>
                                <h2 className="text-3xl md:text-5xl font-semibold mb-4">
                                    Ready to launch your online store?
                                </h2>
                                <p className="text-base md:text-xl text-muted-foreground">
                                    Start selling smarter with ShopFlow. Manage products,
                                    inventory, orders, and payments — all in one powerful platform.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col md:items-end gap-6">
                                <div className="flex gap-4 flex-wrap">
                                    <Link href="/signup">
                                        <Button className="px-6 py-3 text-lg">
                                            Get Started
                                        </Button>
                                    </Link>
                                    <Link href="/store">

                                        <Button
                                            variant="outline"
                                            className="px-6 py-3 text-lg"
                                        >
                                            View Features
                                        </Button>
                                    </Link>
                                </div>
                                <p className="text-sm text-muted-foreground text-left">
                                    No credit card required · Setup in minutes
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Cta;
