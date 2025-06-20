import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Preloader from './components/Preloader';
import Home from './pages/Home';
import Features from './pages/Features';
import Auth from './pages/Auth';
import Demonstration from './pages/Demonstration';
import { ExtensionProvider } from './context/ExtensionContext';

function App() {
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState('default'); // Add state for currentProject

  const onProjectChange = (newProject) => {
    setCurrentProject(newProject); // Update currentProject state
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
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
            </Routes>
          </Layout>
        )}
      </Router>
    </ExtensionProvider>
  );
}

export default App; 