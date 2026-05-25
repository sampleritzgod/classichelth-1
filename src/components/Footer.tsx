export default function Footer() {
  return (
    <footer className="bg-background border-t border-foreground/5 py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-y-8 sm:flex-row">
          {/* Quote */}
          <div className="max-w-md text-center sm:text-left">
            <p className="font-serif italic text-base text-foreground/80 leading-relaxed">
              "Within every body lies an innate wisdom to heal, realign, and restore vitality."
            </p>
          </div>

          {/* Social Icons & Copyright */}
          <div className="flex flex-col items-center gap-y-4 sm:items-end">
            <div className="flex gap-x-5">
              {/* Instagram */}
              <a href="#" className="text-foreground/60 hover:text-primary transition-colors" aria-label="Instagram">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.008 3.752.052 2.73.124 4.093 1.503 4.218 4.218.044.968.052 1.322.052 3.752 0 2.43-.008 2.784-.052 3.752-.124 2.73-1.502 4.093-4.218 4.218-.968.044-1.322.052-3.752.052-2.43 0-2.784-.008-3.752-.052-2.73-.124-4.093-1.502-4.218-4.218-.044-.968-.052-1.322-.052-3.752 0-2.43.008-2.784.052-3.752.124-2.73 1.502-4.093 4.218-4.218.968-.044 1.322-.052 3.752-.052zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" clipRule="evenodd" />
                </svg>
              </a>

              {/* Twitter / X */}
              <a href="#" className="text-foreground/60 hover:text-primary transition-colors" aria-label="X (formerly Twitter)">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M13.6823 10.6218L20.2391 3H18.6854L13.0524 9.53401L8.50617 3H3.22003L10.0965 13.0073L3.22003 21H4.77378L10.7259 14.0951L15.4938 21H20.78L13.6823 10.6218ZM11.5173 13.1764L10.8208 12.1802L5.33235 4.32986H7.71882L12.1331 10.6433L12.8296 11.6394L18.6862 20.0152H16.2997L11.5173 13.1764Z" />
                </svg>
              </a>

              {/* Facebook */}
              <a href="#" className="text-foreground/60 hover:text-primary transition-colors" aria-label="Facebook">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
            <p className="text-xs text-foreground/60">
              &copy; {new Date().getFullYear()} U 1st Creation. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
