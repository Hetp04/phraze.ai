import { useExtension } from "../context/ExtensionContext";

export default function Footer() {
  const { isInsideExtension } = useExtension();

  if (isInsideExtension)
    return null;
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <a href="/pricing">Pricing</a>
            <a href="/documentation">Documentation</a>
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy Policy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Phraze. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 