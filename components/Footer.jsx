export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-divider" />
      <p className="footer-tagline">Crafted with ✎ by</p>
      <p className="footer-name">Aderemi Francis</p>
      <p className="footer-company">Frankev Digital Services · Frankev Global Ltd</p>

      <div className="footer-row">
        <a href="https://wa.me/233245881054" target="_blank" rel="noopener noreferrer">
          +233 24 588 1054 (WhatsApp)
        </a>
        <span className="footer-dot">·</span>
        <a href="tel:+233547141279">+233 54 714 1279</a>
      </div>

      <div className="footer-row">
        <a href="mailto:frankevgloballtd@gmail.com">frankevgloballtd@gmail.com</a>
      </div>
    </footer>
  );
}
