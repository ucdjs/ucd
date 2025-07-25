import React from "react";

export function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-sm p-8 md:p-12">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold text-gray-900">UCD.js</h1>
          <p className="mt-3 text-xl text-gray-600">Unicode Character Database for JavaScript</p>

          <div className="h-px w-24 bg-gray-200 my-8"></div>

          <p className="text-gray-700 mb-8 leading-relaxed max-w-xl">
            A modern JavaScript library that provides easy access to the Unicode Character Database.
            Built for developers who need clean, typed access to Unicode character properties and metadata.
          </p>

          <div className="flex items-center justify-center w-full">
            <a
              href="https://github.com/ucdjs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-300"
            >
              <span className="flex items-center justify-center">
                <LucideGithub className="w-5 h-5" />
              </span>
              <span className="font-medium">View on GitHub</span>
            </a>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <h3 className="font-semibold text-gray-900">Lightweight</h3>
                <p className="mt-2 text-gray-600 text-sm">Optimized for size and performance</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Modern</h3>
                <p className="mt-2 text-gray-600 text-sm">Built for ESM and TypeScript</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Complete</h3>
                <p className="mt-2 text-gray-600 text-sm">Full Unicode 16.0 support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-gray-500 text-sm">
        ©
        {" "}
        {new Date().getFullYear()}
        {" "}
        UCD.js. MIT License.
      </footer>
    </div>
  );
}

function LucideGithub(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      {/* Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE */}
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5c.08-1.25-.27-2.48-1-3.5c.28-1.15.28-2.35 0-3.5c0 0-1 0-3 1.5c-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5c-.39.49-.68 1.05-.85 1.65c-.17.6-.22 1.23-.15 1.85v4"></path>
        <path d="M9 18c-4.51 2-5-2-7-2"></path>
      </g>
    </svg>
  );
}
