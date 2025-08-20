import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchGoogleProfilePicture } from '../funcs';
import { auth } from '../firebase-init';
import { useExtension } from "../context/ExtensionContext";
import { getFirebaseData, updateProfilePicture } from '../funcs';
import pImage from '../images/p.png';
import defaultProfile from '../images/default-profile.png';
import ProfileDropdown from './ProfileDropdown';

export default function Navbar() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { isInsideExtension } = useExtension();
  const [companyEmail, setCompanyEmail] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {

    updateProfilePicture(function (data) {
      setProfileImage(data);
    }, "Navbar");
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {


    let profileImage = await fetchGoogleProfilePicture();
    console.log('profileImage', profileImage);





      setIsLoggedIn(!!user);
      setUserEmail(user ? user.email : null);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfileImage = async () => {
      const user = auth.currentUser;
      if (user) {
        const email = user.email.replace('.', ',');
        let companyEmailPath = companyEmail;
        if (!companyEmailPath) {
          companyEmailPath = await getFirebaseData(`emailToCompanyDirectory/${email}`);
        }
        if (companyEmailPath) {
          const imageData = await getFirebaseData(`Companies/${companyEmailPath}/users/${email}/profileImage`);
          if (imageData) {
            setProfileImage(imageData);
          } else {
            setProfileImage(defaultProfile);
          }
        } else {
          setProfileImage(defaultProfile);
        }
      } else {
        setProfileImage(null);
      }
    };
    if (isLoggedIn) {
      fetchProfileImage();
    } else {
      setProfileImage(null);
    }
  }, [isLoggedIn, companyEmail]);

  const handleLogout = async () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("companyEmail");

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
        backgroundColor: 'white',
        transition: 'background-color 0.3s ease'
      }}
    >
      <div className="nav-container">
        <div className="nav-left"
          style={{ marginLeft: '295px' }}
        >
          <Link to="/" className="logo">
            <img src={pImage} alt="Phraze Logo" className="logo-img" />
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
          gap: '12px',
          marginRight: '295px'
        }}>
          {/* <a href="https://chrome.google.com/webstore/detail/your-extension-id" className="add-to-chrome">
            <i className="fab fa-chrome"></i>
            Add to Chrome
          </a> */}
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
            <div style={{ position: 'relative' }}>
              <ProfileDropdown
                profileImage={profileImage}
                userEmail={userEmail}
                onLogout={handleLogout}
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 