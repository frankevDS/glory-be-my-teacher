import "./globals.css";

export const metadata = {
  title: "Glory, Be My Teacher",
  description: "A senior high study companion for Ghana, Nigeria, UK, and USA students.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#1F3A2E",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=Kalam:wght@400;700&display=swap"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" href="/icons/icon-192.png" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js').catch(function () {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
