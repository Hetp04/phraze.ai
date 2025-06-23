import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from '../firebase-init';
import { useExtension } from "../context/ExtensionContext";
import { getFirebaseData } from '../funcs';

export default function Navbar({ currentProject, onProjectChange }) {

  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { isInsideExtension } = useExtension();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(currentProject || 'default');
  const [companyEmail, setCompanyEmail] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      const user = auth.currentUser;
      if (user) {
        const email = user.email.replace('.', ',');
        const companyEmailPath = await getFirebaseData(`emailToCompanyDirectory/${email}`);
        setCompanyEmail(companyEmailPath);
        if (companyEmailPath) {
          const projectsData = await getFirebaseData(`Companies/${companyEmailPath}/projects`);
          if (projectsData) {
            setProjects(Object.keys(projectsData));
          } else {
            setProjects(['default']);
          }
        }
      }
    };
    if (isLoggedIn) fetchProjects();

    let listenerRef = null;
    let unsubscribe = () => { }; // Function to detach listener

    const setupListener = async () => {
      if (!isInsideExtension && auth && auth.currentUser && auth.currentUser.email) {
        try {
          var mainCompanyEmail = await getFirebaseData(`emailToCompanyDirectory/${auth.currentUser.email.replace(".", ",")}`);
          // Dynamically import Firebase database functions
          const firebaseDb = await import('firebase/database');
          const { ref, onValue, off } = firebaseDb;
          const { database } = await import('../firebase-init'); // Get database instance

          //Does not go all the way down to /highlights so that we can also reload labels and codes for the highlights, which are in /annotationHistory
          const projectsPath = `Companies/${mainCompanyEmail}/projects`;
          console.log("[Listener] Setting up listener for path:", projectsPath);
          listenerRef = ref(database, projectsPath);

          // Define the callback for onValue
          const handleValueChange = (snapshot) => {
            fetchProjects();
          };

          // Attach the listener
          onValue(listenerRef, handleValueChange);


          // Set the cleanup function
          unsubscribe = () => {
            if (listenerRef) {
              console.log("[Listener] Detaching listener from path:", projectsPath);
              off(listenerRef, 'value', handleValueChange); // Detach specific callback
              listenerRef = null;
            }
          };

        } catch (error) {
          console.error("[Listener] Error setting up Firebase listener:", error);
        }
      }
    };

    setupListener();

    // Cleanup function: Remove listener when dependencies change or component unmounts
    return () => {
      unsubscribe();
    };

  }, [isLoggedIn]);

  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
    if (onProjectChange)
      onProjectChange(e.target.value);
  };

  const handleLogout = async () => {
    try {
      // Dispatch a custom event to clear chats in Demonstration.jsx
      const clearChatsEvent = new CustomEvent('clearChats');
      window.dispatchEvent(clearChatsEvent);

      // Sign out from Firebase
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isInsideExtension)
    return null;

  return (
    <nav
      className="navbar"
      style={{
        backgroundColor: isScrolled ? 'rgb(250, 250, 250)' : 'rgb(255, 255, 255)',
        transition: 'background-color 0.3s ease'
      }}
    >
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/" className="logo">
            <img src="src/images/p.png" alt="Phraze Logo" className="logo-img" />
          </Link>
        </div>
        <div className="nav-center">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/features" className="nav-link">Features</Link>
          <Link to="/demonstration" className="nav-link">Demonstration</Link>
          {/* <a href="#Demonstration" className="nav-link">Demonstration</a> */}
        </div>
        <div className="nav-right" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {isLoggedIn && projects.length > 0 && (
            <div>
              <span>
                Project:&nbsp;
              </span>
              <select
                id="projectSelect"
                value={selectedProject}
                onChange={handleProjectChange}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  background: '#fff',
                  fontWeight: 500,
                  width: "250px"
                }}
                title="Select Project"
              >
                {projects.map((proj) => (
                  <option key={proj} value={proj}>
                    {proj == "default" ? "Default Project" : proj}
                  </option>
                ))}
              </select>
            </div>
          )}
          <a href="https://chrome.google.com/webstore/detail/your-extension-id" className="add-to-chrome">
            <i className="fab fa-chrome"></i>
            Add to Chrome
          </a>
          {!isLoggedIn ? (
            <Link to="/auth" id="login-button" className="login-button" style={{
              padding: '8px 16px',
              backgroundColor: 'rgb(235, 235, 235)',
              color: 'black',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              display: 'inline-block'
            }}>
              Login
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="logout-button"
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgb(235, 235, 235)',
                color: 'black',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
} 