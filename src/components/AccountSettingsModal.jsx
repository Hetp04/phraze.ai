import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase-init';
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { getFirebaseData, getMainCompanyEmail, saveFirebaseData, updateProfilePicture, firebaseListener, showToast } from '../funcs';
import defaultProfile from '../images/default-profile.png';

export default function AccountSettingsModal({ isOpen, onClose }) {
  const modalRef = useRef(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState(defaultProfile);
  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [companyEmail, setCompanyEmail] = useState(null);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    updateProfilePicture(function (data) {
      setProfileImage(data);
    }, "AccountSettingsModal");

    async function setListener() {
      let user = auth.currentUser;
      if (user) {
        let mainCompanyEmail = await getMainCompanyEmail();
        firebaseListener(`Companies/${mainCompanyEmail}/users/${user.email.replace(".", ",")}/name`, "AccountSettingsModal", function (path, data) {
          setUsername(data);
        });
      }
    }
    setListener();
  });

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Fetch user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsLoggedIn(!!user);

      if (user) {
        setEmail(user.email);

        const userEmail = user.email.replace('.', ',');
        const companyEmailPath = await getFirebaseData(`emailToCompanyDirectory/${userEmail}`);
        setCompanyEmail(companyEmailPath);

        if (companyEmailPath) {
          const userData = await getFirebaseData(`Companies/${companyEmailPath}/users/${userEmail}`);
          if (userData && userData.name) {
            setUsername(userData.name);
            setNewUsername(userData.name);
          } else {
            setUsername(user.email.split('@')[0]);
            setNewUsername(user.email.split('@')[0]);
          }
        } else {
          setUsername(user.email.split('@')[0]);
          setNewUsername(user.email.split('@')[0]);
        }
      } else {
        setEmail('');
        setUsername('');
        setCompanyEmail(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch profile image
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
          }
        }
      }
    };
    if (isLoggedIn) {
      fetchProfileImage();
    }
  }, [isLoggedIn, companyEmail]);

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    let newUsername = document.getElementById("new-username").value;

    let user = auth.currentUser;
    if (user) {
      await updateProfile(user, { displayName: newUsername });
      let mainCompanyEmail = await getMainCompanyEmail();
      saveFirebaseData(`Companies/${mainCompanyEmail}/users/${user.email.replace(".", ",")}/name`, newUsername);
    }

    setShowUsernameForm(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (user) {
      // Create credentials with email and password
      const credential = EmailAuthProvider.credential(
        user.email,
        document.getElementById("current-password").value
      );

      // Reauthenticate
      reauthenticateWithCredential(user, credential)
        .then(() => {
          let newPassword1 = document.getElementById("new-password").value;
          let newPassword2 = document.getElementById("confirm-password").value;
          if (newPassword1 !== newPassword2) {
            showToast("New passwords do not match", "error");
            setShowPasswordForm(true);
          }
        })
        .catch((error) => {
          showToast("Current password is incorrect", "error");
          setShowPasswordForm(true);
        });
    }

    setShowPasswordForm(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      <div
        ref={modalRef}
        className="modal-content"
        style={{
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          transform: isOpen ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#6B7280',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s ease-in-out',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#F3F4F6'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '8px',
            width: '100%'
          }}>
            Account Settings
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            width: '100%'
          }}>
            Manage your account settings and preferences. Changes will be automatically saved.
          </p>
        </div>

        {/* Profile Section */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '4px',
            width: '100%'
          }}>
            Profile Picture
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '16px',
            width: '100%'
          }}>
            Your profile picture will be visible to other users in your organization.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid #E5E7EB'
              }}>
                <img
                  src={profileImage}
                  alt="Profile"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
              <input
                type="file"
                id="profile-picture"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={function (e) {



                  
                  async function saveProfileImageToFirebase(file) {

                    const user = auth.currentUser;
                    if (user) {
                        const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
                        if(isGoogleUser){
                          window.alert('Google users cannot change their profile picture');
                          return;
                        }
                        console.log('Is Google user:', isGoogleUser);
                    }


                    if (user) {
                      console.log('Attempting to save image to Firebase for user:', user.email);

                      const userEmailFormatted = user.email.replace('.', ',');
                      let companyEmail = null; // Initialize companyEmail

                      // Get the main company email first
                      try {
                        companyEmail = await getFirebaseData(`emailToCompanyDirectory/${userEmailFormatted}`);
                        if (!companyEmail) {
                          console.error('Error: Could not determine company email. Cannot save profile image.');
                          showToast('Failed to save profile image: Company email not found.', 'error');
                          return; // Stop execution if company email is not found
                        }
                      } catch (error) {
                        console.error('Error fetching company email:', error);
                        showToast('Failed to save profile image: Error getting company info.', 'error');
                        return; // Stop execution on error
                      }

                      // Convert file to base64 for sending through sendRuntimeMessage
                      const reader = new FileReader();
                      reader.onload = function (e) {
                        const base64Image = e.target.result;
                        const firebasePath = `Companies/${companyEmail}/users/${userEmailFormatted}/profileImage`;

                        saveFirebaseData(firebasePath, base64Image);
                      };

                      reader.onerror = function (error) {
                        console.error('Error converting file to base64:', error);
                        showToast('Error processing image file.', 'error');
                      };

                      reader.readAsDataURL(file);
                    } else {
                      console.error('Cannot save profile image: No user logged in.');
                      showToast('Please log in to save your profile image.', 'error');
                    }
                  }


                  const file = e.target.files[0];

                  if (file) {
                    console.log('File selected:', file.name); // Debug log

                    // Validate file type
                    if (!file.type.match('image.*')) {
                      console.error('File is not an image');
                      return;
                    }

                    const reader = new FileReader();

                    reader.onload = function (event) {
                      console.log('File read successfully'); // Debug log
                      setProfileImage(event.target.result);

                      // Update header profile image as well
                      const headerProfileImage = document.getElementById('header-profile-image');
                      const headerDefaultIcon = document.getElementById('header-default-icon');

                      if (headerProfileImage && headerDefaultIcon) {
                        headerProfileImage.src = event.target.result;
                        headerProfileImage.style.display = 'block';
                        headerDefaultIcon.style.display = 'none';
                      }

                      // Save to Firebase
                      saveProfileImageToFirebase(file);
                    };

                    reader.onerror = function (error) {
                      console.error('Error reading file:', error);
                    };

                    reader.readAsDataURL(file);
                  }
                }}
              />
              <label
                htmlFor="profile-picture"
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </label>
            </div>
            <div>
              <p style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827',
                marginBottom: '4px'
              }}>
                {username}
              </p>
              <p style={{
                fontSize: '14px',
                color: '#6B7280'
              }}>
                {email}
              </p>
            </div>
          </div>
        </section>

        {/* Account Information Section */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '4px',
            width: '100%'
          }}>
            Account Information
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '16px',
            width: '100%'
          }}>
            Update your username and manage how you appear to other users.
          </p>

          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: '#F9FAFB',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827',
                  marginBottom: '4px'
                }}>
                  Username
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#6B7280'
                }}>
                  {username}
                </p>
              </div>
              <button
                onClick={() => setShowUsernameForm(!showUsernameForm)}
                style={{
                  padding: '8px 12px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#F9FAFB';
                  e.target.style.borderColor = '#D1D5DB';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#E5E7EB';
                }}
              >
                Change
              </button>
            </div>

            {/* Username Change Form */}
            {showUsernameForm && (
              <form
                onSubmit={handleUsernameSubmit}
                style={{
                  marginTop: '12px',
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <label
                    htmlFor="new-username"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}
                  >
                    New Username
                  </label>
                  <input
                    id="new-username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Enter new username"
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      background: '#2563EB',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#1D4ED8'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#2563EB'}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUsernameForm(false)}
                    style={{
                      padding: '8px 16px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#F9FAFB';
                      e.target.style.borderColor = '#D1D5DB';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.borderColor = '#E5E7EB';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Security Section */}
        <section>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '4px',
            width: '100%'
          }}>
            Security
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '16px',
            width: '100%'
          }}>
            Manage your password and account security settings.
          </p>

          {/* Password */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: '#F9FAFB',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <div>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827',
                  marginBottom: '4px'
                }}>
                  Password
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#6B7280'
                }}>
                  ••••••••
                </p>
              </div>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                style={{
                  padding: '8px 12px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#F9FAFB';
                  e.target.style.borderColor = '#D1D5DB';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#E5E7EB';
                }}
              >
                Change
              </button>
            </div>

            {/* Password Change Form */}
            {showPasswordForm && (
              <form
                onSubmit={handlePasswordSubmit}
                style={{
                  marginTop: '12px',
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB'
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <label
                    htmlFor="current-password"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}
                  >
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Enter current password"
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label
                    htmlFor="new-password"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}
                  >
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Enter new password"
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label
                    htmlFor="confirm-password"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Confirm new password"
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      background: '#2563EB',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#1D4ED8'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#2563EB'}
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    style={{
                      padding: '8px 16px',
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#F9FAFB';
                      e.target.style.borderColor = '#D1D5DB';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.borderColor = '#E5E7EB';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
} 