import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-100 text-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">StaySaga</h3>
          <p className="text-sm">
            © {new Date().getFullYear()} StaySaga. All rights reserved.
          </p>
        </div>
        <div className="flex gap-6">
          <div className="space-y-1">
            <h4 className="font-medium">Company</h4>
            <a href="/about" className="text-sm hover:text-rose-600">
              About
            </a>
            <a href="/careers" className="text-sm hover:text-rose-600">
              Careers
            </a>
          </div>
          <div className="space-y-1">
            <h4 className="font-medium">Support</h4>
            <a href="/help" className="text-sm hover:text-rose-600">
              Help Center
            </a>
            <a href="/contact" className="text-sm hover:text-rose-600">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
