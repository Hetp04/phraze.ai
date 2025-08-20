import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Preloader from './components/Preloader';
import Home from './pages/Home';
import Features from './pages/Features';
import Auth from './pages/Auth';
import Demonstration from './pages/Demonstration';
import Profile from './pages/Profile';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import Contact from './pages/Contact';
import { ExtensionProvider } from './context/ExtensionContext';

function App() {
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState('default'); // Add state for currentProject

  const onProjectChange = (newProject) => {
    setCurrentProject(newProject); // Update currentProject state
  };
  
  useEffect(() => {
    // Check if user has seen the preloader before
    const hasSeenPreloader = localStorage.getItem('hasSeenPreloader');
    
    if (hasSeenPreloader) {
      // User has seen preloader before, skip it
      setLoading(false);
    } else {
      // First time user, show preloader
      const timer = setTimeout(() => {
        setLoading(false);
        localStorage.setItem('hasSeenPreloader', 'true');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <ExtensionProvider>
      <Router>
        {loading ? (
          <Preloader />
        ) : (
          <Layout currentProject={currentProject} onProjectChange={onProjectChange}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/features" element={<Features />} />
              <Route path="/demonstration" element={<Demonstration currentProject={currentProject} onProjectChange={onProjectChange} setCurrentProject={setCurrentProject}/>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Layout>
        )}
      </Router>
    </ExtensionProvider>
  );
}

export default App; 