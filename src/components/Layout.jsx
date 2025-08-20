import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import TimelineNav from './TimelineNav';
import Footer from './Footer';
import ShareModal from './ShareModal';

export default function Layout({ children, currentProject, onProjectChange }) {
  const location = useLocation();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    // Use a single, optimized scroll operation
    if (location.pathname === '/demonstration') {
      // For demonstration page, ensure we're at the top
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.body.setAttribute('data-page', 'demonstration');
    } else {
      // For other pages, use smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.removeAttribute('data-page');
    }

    // Batch DOM operations to reduce reflows
    requestAnimationFrame(() => {
      const mainElement = document.querySelector('main');
      const navbarElement = document.querySelector('.navbar');
      
      if (mainElement) {
        mainElement.classList.add('reveal');
      }
      if (navbarElement) {
        navbarElement.classList.add('reveal');
      }
    });
  }, [location]);

  useEffect(() => {
    const handler = (e) => {
      const { message, type } = e.detail || {};
      // Only auto-open when the source is not the modal itself
      const openedByModal = window.__shareModalClickInProgress === true;
      if (!openedByModal && (message === 'Shareable link copied to clipboard!' || message === 'Link copied to clipboard!') && (type === 'success' || type === 'info')) {
        setIsShareModalOpen(true);
      }
      // reset flag after event completes
      window.__shareModalClickInProgress = false;
    };
    window.addEventListener('toast:ended', handler);
    return () => window.removeEventListener('toast:ended', handler);
  }, []);

  // Check if we're on the demonstration page
  const isDemonstrationPage = location.pathname === '/demonstration';

  return (
    <>
      {/* Only show navbar if NOT on demonstration page */}
      {!isDemonstrationPage && (
        <Navbar currentProject={currentProject} onProjectChange={onProjectChange}/>
      )}
      {location.pathname === '/' && <TimelineNav />}
      {children}
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
      {/* <Footer /> */}
    </>
  );
} 