import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase-init';
import AccountSettingsModal from './AccountSettingsModal';

export default function ProfileDropdown({ userEmail, profileImage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Debug logging
  console.log('ProfileDropdown render - isOpen:', isOpen, 'profileImage:', profileImage);

  // Ensure we have a valid profile image
  const displayImage = profileImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNEN0Q3RDciLz4KPHBhdGggZD0iTTE2IDhDMTguMjA5MSA4IDIwIDEwLjc5MDkgMjAgMTNDMjAgMTUuMjA5MSAxOC4yMDkxIDE3IDE2IDE3QzEzLjc5MDkgMTcgMTIgMTUuMjA5MSAxMiAxM0MxMiAxMC43OTA5IDEzLjc5MDkgOCAxNiA4WiIgZmlsbD0iI0Y5RjlGOSIvPgo8cGF0aCBkPSJNOCAyNEM4IDIwLjY4NjMgMTEuMzEzNyAxOCAxNSAxOEgxN0MyMC42ODYzIDE4IDI0IDIwLjY4NjMgMjQgMjRIMjhDMjggMjYuMjA5MSAyNi4yMDkxIDI4IDI0IDI4SDhDNi43OTA5IDI4IDYgMjYuMjA5MSA2IDI0VjI0WiIgZmlsbD0iI0Y5RjlGOSIvPgo8L3N2Zz4K';

  // Add useEffect to log state changes
  useEffect(() => {
    console.log('ProfileDropdown isOpen state changed to:', isOpen);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem("currentUser");
      localStorage.removeItem("companyEmail");

      // Dispatch a custom event to clear chats
      const clearChatsEvent = new CustomEvent('clearChats');
      window.dispatchEvent(clearChatsEvent);

      // Sign out from Firebase
      await auth.signOut();

      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleInvite = () => {
    // TODO: Implement invite functionality
    console.log('Invite clicked');
  };

  return (
    <>
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          id="navbarProfilePicture"
          onClick={() => {
            console.log('ProfileDropdown button clicked. Current isOpen:', isOpen);
            setIsOpen(!isOpen);
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <img
            src={profileImage}
            alt="Profile"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s ease'
            }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        {isOpen && (
          <div
            className="profile-dropdown-menu"
            style={{
              position: 'fixed',
              top: '80px',
              right: '208px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              width: '240px',
              transformOrigin: 'top right',
              animation: 'fadeIn 0.2s ease-out',
              zIndex: 9999
            }}
          >

            {/* Email header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                color: '#4B5563',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {userEmail}
            </div>

            {/* Menu items */}
            <div style={{ padding: '8px 0' }}>
              {/* Account Settings */}
              <button
                id="accountSettingsModalOpenButton"
                onClick={() => {
                  setIsModalOpen(true);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  minHeight: '36px',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#F3F4F6';
                  e.target.style.borderRadius = '8px';
                  e.target.style.margin = '0 4px';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.margin = '0';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"></path>
                </svg>
                Account Settings
              </button>

              {/* Invite Account */}
              <button
                onClick={handleInvite}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  minHeight: '36px',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#F3F4F6';
                  e.target.style.borderRadius = '8px';
                  e.target.style.margin = '0 4px';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.margin = '0';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" y1="8" x2="19" y2="14"></line>
                  <line x1="22" y1="11" x2="16" y2="11"></line>
                </svg>
                Invite Account
              </button>

              {/* Log out */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  minHeight: '36px',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#F3F4F6';
                  e.target.style.borderRadius = '8px';
                  e.target.style.margin = '0 4px';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.margin = '0';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Log out
              </button>
            </div>
          </div>
        )}
      </div>

      <AccountSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}
      </style>
    </>
  );
} 