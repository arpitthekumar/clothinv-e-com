"use client";

import Link from "next/link";

const footerLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact", href: "/contact" },
  { label: "Shop", href: "/store" },
];

export function HomeFooter() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-3">ShopFlow</h3>
            <p className="text-sm text-muted-foreground">
              Your trusted e-commerce and inventory platform.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Quick links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Account</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/auth" className="hover:text-foreground transition-colors">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/store/orders" className="hover:text-foreground transition-colors">
                  My orders
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Help</h3>
            <p className="text-sm text-muted-foreground">
              Need help? Reach out to support.
            </p>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ShopFlow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
