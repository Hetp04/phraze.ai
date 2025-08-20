import { useState, useEffect } from 'react';
import { getMainCompanyEmail, currentUsername, initUsernameFetcher, getFirebaseData, saveFirebaseData, updateProfilePicture } from '../funcs';
import { onAuthStateChanged } from 'firebase/auth';

import { ref, onValue, remove } from 'firebase/database';
import { database, auth } from '../firebase-init';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useExtension } from "../context/ExtensionContext";
import { useRef } from 'react';
import defaultProfile from '../images/default-profile.png';
import SidebarProfileDropdown from './SidebarProfileDropdown';

export default function ChatSidebar({ onChatSelect, isCollapsed, setIsCollapsed, currentProject, onProjectChange, isLibraryVisible, setIsLibraryVisible, setIsExtensionSidebarVisible }) {
  const [username, setUsername] = useState(currentUsername);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [chats, setChats] = useState([]);
  const [sharedChats, setSharedChats] = useState([]);
  const [companyEmail, setCompanyEmail] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  // Project related state
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(currentProject || 'default');
  const navigate = useNavigate();
  const location = useLocation();
  const { isInsideExtension } = useExtension();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [profileImage, setProfileImage] = useState(defaultProfile);
  const [menuOpenForChatId, setMenuOpenForChatId] = useState(null);
  const [hoveredChatId, setHoveredChatId] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (!event.target.closest || !event.target.closest('.chat-item-menu')) {
        setMenuOpenForChatId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Initialize the username fetcher if not already initialized
    initUsernameFetcher();

    // Set up a simple polling mechanism to check for username changes
    const usernameCheck = setInterval(() => {
      if (currentUsername !== username) {
        setUsername(currentUsername);
      }
    }, 1000);

    // Check login status
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
    
      if (user) {
        setIsLoggedIn(true);
        try {
          // Get company email for the user
          const userEmail = user.email.replace('.', ',');
          const companyEmailPath = await getFirebaseData(`emailToCompanyDirectory/${userEmail}`);

          if (companyEmailPath) {
            localStorage.setItem("currentUser", JSON.stringify({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName
            }));
            setCompanyEmail(companyEmailPath);
            if(await getMainCompanyEmail() !== companyEmailPath)
            {
              localStorage.setItem("companyEmail", companyEmailPath);

            }
            // Set up listener for chats
            loadUserChats(companyEmailPath);
          }
        } catch (error) {
          console.error("Error fetching company email:", error);
        }
      } else {
        setIsLoggedIn(false);
        setChats([]);
        localStorage.removeItem("currentUser");
        localStorage.removeItem("companyEmail");
        setSharedChats([]);
        localStorage.removeItem('accessedSharedChats');

      }
    });

    // Check for shared chat in URL
    const params = new URLSearchParams(location.search);
    const sharedId = params.get('share');
    

    if (sharedId) {
      loadSharedChat(sharedId);
    }

    // Load all shared chats that have been accessed before
    loadAllSharedChats();

    return () => {
      clearInterval(usernameCheck);
      unsubscribe();
    };
  }, [username, location.search, currentProject]);

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

  // Update selected project when currentProject prop changes
  useEffect(() => {
    setSelectedProject(currentProject || 'default');
  }, [currentProject]);

  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
    if (onProjectChange)
      onProjectChange(e.target.value);
  };

  // Function to load user chats from Firebase
  const loadUserChats = (companyEmailPath) => {
    const chatsRef = ref(database, `Companies/${companyEmailPath}/projects/${currentProject}/groqChats`);

    onValue(chatsRef, (snapshot) => {
      if (snapshot.exists()) {
        const chatsData = snapshot.val();
        const chatsArray = Object.entries(chatsData).map(([id, chat]) => ({
          id,
          title: chat.title || 'Untitled Chat',
          timestamp: chat.timestamp || Date.now(),
          ...chat
        })).sort((a, b) => b.timestamp - a.timestamp);

        setChats(chatsArray);
      } else {
        setChats([]);
      }
    });
  };

  // Function to load a specific shared chat
  const loadSharedChat = async (sharedId) => {
    try {
      const sharedChatData = await getFirebaseData(`sharedChats/${sharedId}`);

      if (sharedChatData) {
        // Store the shared chat ID in local storage to remember it was accessed
        const storedSharedChats = JSON.parse(localStorage.getItem('accessedSharedChats') || '[]');
        if (!storedSharedChats.includes(sharedId)) {
          storedSharedChats.push(sharedId);
          localStorage.setItem('accessedSharedChats', JSON.stringify(storedSharedChats));
        }

        // Add the ID to the shared chat data for reference
        const sharedChat = { ...sharedChatData, id: sharedId, isShared: true };

        // Update shared chats list
        setSharedChats(prev => {
          const exists = prev.some(chat => chat.id === sharedId);
          if (!exists) {
            return [...prev, sharedChat].sort((a, b) => b.timestamp - a.timestamp);
          }
          return prev;
        });

        // Select the shared chat automatically
        if (onChatSelect && typeof onChatSelect === 'function') {
          onChatSelect(sharedChat);
        }

        // Remove the share parameter from URL to prevent reloading the same chat
        navigate('/demonstration', { replace: true });
      }
    } catch (error) {
      console.error("Error loading shared chat:", error);
    }
  };

  // Function to load all previously accessed shared chats
  const loadAllSharedChats = async () => {
    try {
      const storedSharedChats = JSON.parse(localStorage.getItem('accessedSharedChats') || '[]');

      if (storedSharedChats.length === 0) return;

      const loadedSharedChats = [];

      for (const sharedId of storedSharedChats) {
        const sharedChatData = await getFirebaseData(`sharedChats/${sharedId}`);
        if (sharedChatData) {
          loadedSharedChats.push({
            ...sharedChatData,
            id: sharedId,
            isShared: true
          });
        }
      }

      // Update state with sorted shared chats
      if (loadedSharedChats.length > 0) {
        setSharedChats(loadedSharedChats.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.error("Error loading all shared chats:", error);
    }
  };

  // Function to create a new chat
  const createNewChat = async () => {
    if (!isLoggedIn || !companyEmail) {
      console.error("User is not logged in or company email not found");
      return;
    }

    const chatId = `chat_${Date.now()}`;
    const newChat = {
      title: 'New Chat',
      timestamp: Date.now(),
      messages: []
    };

    try {
      await saveFirebaseData(`Companies/${companyEmail}/projects/${currentProject}/groqChats/${chatId}`, newChat);

      // Instead of navigating, call the prop function to update the current chat
      if (onChatSelect && typeof onChatSelect === 'function') {
        onChatSelect({
          id: chatId,
          ...newChat
        });
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  // Function to open a chat
  const openChat = (chatId, isShared = false) => {
    // Find the chat in the appropriate list
    const chatList = isShared ? sharedChats : chats;
    const selectedChat = chatList.find(chat => chat.id === chatId);

    if (selectedChat && onChatSelect && typeof onChatSelect === 'function') {
      onChatSelect(selectedChat);
    }
  };

  // Function to delete a chat
  const deleteChat = async (event, chatId) => {
    event.stopPropagation(); // Prevent the chat from being opened

    if (!isLoggedIn || !companyEmail) {
      console.error("User is not logged in or company email not found");
      return;
    }

    if (window.confirm("Are you sure you want to delete this chat?")) {
      try {
        // Remove the chat from Firebase
        const chatRef = ref(database, `Companies/${companyEmail}/projects/${currentProject}/groqChats/${chatId}`);
        await remove(chatRef);

        // If this was the currently selected chat, create a new one
        const selectedChat = chats.find(chat => chat.id === chatId);
        if (selectedChat && onChatSelect && typeof onChatSelect === 'function') {
          // If there are other chats, select the first one
          if (chats.length > 1) {
            const nextChat = chats.find(chat => chat.id !== chatId);
            if (nextChat) {
              onChatSelect(nextChat);
            }
          } else {
            // If this was the only chat, create a new one
            createNewChat();
          }
        }
      } catch (error) {
        console.error("Error deleting chat:", error);
      }
    }
  };

  // Function to start editing a chat title
  const startEditing = (event, chatId, currentTitle) => {
    event.stopPropagation(); // Prevent the chat from being opened
    setEditingChatId(chatId);
    setEditValue(currentTitle);
  };

  // Function to handle input changes
  const handleEditInputChange = (event) => {
    setEditValue(event.target.value);
  };

  // Function to save the edited chat title
  const saveEditedChatTitle = async (event, chatId) => {
    event.preventDefault();
    event.stopPropagation();

    if (!editValue.trim()) {
      setEditValue('Untitled Chat');
    }

    if (!isLoggedIn || !companyEmail) {
      console.error("User is not logged in or company email not found");
      return;
    }

    try {
      // Update the chat title in Firebase
      await saveFirebaseData(`Companies/${companyEmail}/projects/${currentProject}/groqChats/${chatId}/title`, editValue.trim());

      // Find the chat and update the title in the parent component
      const updatedChat = chats.find(chat => chat.id === chatId);
      if (updatedChat && onChatSelect && typeof onChatSelect === 'function') {
        // Create a new object with the updated title
        const updatedChatWithNewTitle = {
          ...updatedChat,
          title: editValue.trim()
        };

        // Notify the parent component about the title change
        onChatSelect(updatedChatWithNewTitle);
      }

      // Exit edit mode
      setEditingChatId(null);
    } catch (error) {
      console.error("Error renaming chat:", error);
    }
  };

  // Function to handle keydown events in the edit input
  const handleEditKeyDown = (event, chatId) => {
    if (event.key === 'Enter') {
      saveEditedChatTitle(event, chatId);
    } else if (event.key === 'Escape') {
      // Cancel editing
      setEditingChatId(null);
    }
  };

  // Function to handle clicking outside of the input to save
  const handleEditBlur = (event, chatId) => {
    saveEditedChatTitle(event, chatId);
  };

  // Function to handle search input changes
  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value);
    performSearch(event.target.value);
  };

  // Function to perform the search
  const performSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const lowerCaseQuery = query.toLowerCase();

    // Search through chat titles and messages in both regular and shared chats
    const results = [...chats, ...sharedChats].filter(chat => {
      // Search in title
      const titleMatch = chat.title.toLowerCase().includes(lowerCaseQuery);

      // Search in messages
      let messageMatch = false;
      if (chat.messages && Array.isArray(chat.messages)) {
        messageMatch = chat.messages.some(message =>
          message.content && message.content.toLowerCase().includes(lowerCaseQuery)
        );
      }

      return titleMatch || messageMatch;
    });

    setSearchResults(results);
  };

  // Function to clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // Function to toggle search mode
  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      setSearchQuery('');
      setSearchResults([]);
      setIsCollapsed(false);
    }
  };

  // Function to remove a shared chat from the list (doesn't delete it from Firebase)
  const removeSharedChat = (event, chatId) => {
    event.stopPropagation(); // Prevent the chat from being opened

    if (window.confirm("Remove this shared chat from your list? This won't delete it completely.")) {
      try {
        // Remove the chat ID from local storage
        const storedSharedChats = JSON.parse(localStorage.getItem('accessedSharedChats') || '[]');
        const updatedSharedChats = storedSharedChats.filter(id => id !== chatId);
        localStorage.setItem('accessedSharedChats', JSON.stringify(updatedSharedChats));

        // Remove from state
        setSharedChats(prev => prev.filter(chat => chat.id !== chatId));

        // If this was the currently selected chat, select another one
        const nextChat = sharedChats.find(chat => chat.id !== chatId) ||
          chats.length > 0 ? chats[0] : null;

        if (nextChat && onChatSelect && typeof onChatSelect === 'function') {
          onChatSelect(nextChat);
        } else if (onChatSelect && typeof onChatSelect === 'function') {
          // No chats left, clear the selection
          onChatSelect(null);
        }
      } catch (error) {
        console.error("Error removing shared chat:", error);
      }
    }
  };

  useEffect(() => {
    updateProfilePicture(function (data) {
      setProfileImage(data);
    }, "ChatSidebar");
  });

  // Utility: group chats by month with "Today" section first
  const groupChatsByMonth = (chatArray) => {
    const groups = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    const isToday = (ts) => {
      const chatDate = new Date(ts);
      const chatDay = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());
      return chatDay.getTime() === today.getTime();
    };
    
    const isYesterday = (ts) => {
      const chatDate = new Date(ts);
      const chatDay = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());
      return chatDay.getTime() === yesterday.getTime();
    };
    
    const getMonthKey = (ts) => {
      const d = new Date(ts);
      return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    };

    chatArray.forEach((c) => {
      let key;
      if (isToday(c.timestamp)) {
        key = 'Today';
      } else if (isYesterday(c.timestamp)) {
        key = 'Yesterday';
      } else {
        key = getMonthKey(c.timestamp);
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });

    // Sort groups: Today first, Yesterday second, then by month order (current back to earlier)
    const order = Object.keys(groups).sort((a, b) => {
      if (a === 'Today') return -1;
      if (b === 'Today') return 1;
      if (a === 'Yesterday') return -1;
      if (b === 'Yesterday') return 1;
      
      // For months, sort by actual date (most recent first)
      const getMonthDate = (monthKey) => {
        const [month, year] = monthKey.split(' ');
        return new Date(`${month} 1, ${year}`);
      };
      
      return getMonthDate(b) - getMonthDate(a);
    });

    return { groups, order };
  };

  // Determine if we are on the Demonstration page
  const isDemonstrationPage = location.pathname === '/demonstration';

  // Groq-style minimal sidebar for Demonstration page only
  if (isDemonstrationPage) {
    const visibleChats = chats; // Only user's chats in History
    const { groups, order } = groupChatsByMonth(visibleChats);
    return (
      <div style={{
        width: !isInsideExtension ? (isCollapsed ? '60px' : '300px') : (isCollapsed ? '60px' : '100%'),
        height: '100vh',
        background: '#ffffff',
        borderRight: '1px solid rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Top controls removed (collapse now next to profile) */}

        {/* Search bar */}
        {!isCollapsed && (
          <>
            {/* Logo above default projects section */}
            {isLoggedIn && projects.length > 0 && (
              <div style={{ padding: '12px 12px 0', display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
                <img 
                  src="/src/images/star.png" 
                  alt="Logo" 
                  style={{ 
                    width: '34px', 
                    height: '34px',
                    objectFit: 'contain',
                    imageRendering: 'crisp-edges',
                    filter: 'none',
                    marginLeft: '4px'
                  }} 
                />
              </div>
            )}
            {isLoggedIn && projects.length > 0 && (
              <div style={{ padding: '12px 12px 0' }}>
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <button
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                      border: '1px solid #e5e7eb', borderRadius: '10px', padding: '8px 10px', background: '#fff', color: '#111', cursor: 'pointer'
                    }}
                    onClick={() => setDropdownOpen((open) => !open)}
                    type="button"
                  >
                    <span style={{ flex: 1, textAlign: 'left', fontSize: '0.9rem' }}>{selectedProject === 'default' ? 'Default Project' : selectedProject}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.25"><path d="M7 10l5 5 5-5z"/></svg>
                  </button>
                  {dropdownOpen && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 10px 24px rgba(0,0,0,0.10)', zIndex: 100, padding: '6px 0', maxHeight: '240px', overflowY: 'auto' }}>
                      {projects.map((proj) => (
                        <button
                          key={proj}
                          onClick={() => { setSelectedProject(proj); setDropdownOpen(false); if (onProjectChange) onProjectChange(proj); }}
                          style={{ width: '100%', background: 'transparent', color: '#111', border: 'none', outline: 'none', padding: '10px 12px', fontSize: '0.9rem', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          {selectedProject === proj && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.25"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                          <span>{proj === 'default' ? 'Default Project' : proj}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div style={{ padding: '12px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                border: '1px solid #e5e7eb', borderRadius: '10px', padding: '8px 10px', background: '#fff'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Search ⌘K"
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', color: '#111', background: 'transparent' }}
                />
                {searchQuery && (
                  <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Primary actions */}
        {!isCollapsed && (
          <div style={{ padding: '0 12px 6px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => { setIsLibraryVisible(false); createNewChat(); }}
              disabled={!isLoggedIn}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '10px 12px', borderRadius: '10px',
                border: 'none', background: 'transparent', color: '#111', cursor: isLoggedIn ? 'pointer' : 'not-allowed'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              onMouseDown={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
              onMouseUp={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: 18, height: 18 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
              <span style={{ fontWeight: 500, fontSize: '0.9rem', color: '#111' }}>Chat</span>
            </button>
            <button
              onClick={() => { setIsLibraryVisible(true); setIsExtensionSidebarVisible(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '10px 12px', borderRadius: '10px',
                border: 'none', background: 'transparent', color: '#111', cursor: 'pointer'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              onMouseDown={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
              onMouseUp={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: 18, height: 18 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              <span style={{ fontWeight: 500, fontSize: '0.9rem', color: '#111' }}>Library</span>
            </button>
          </div>
        )}

        {/* History or Search Results */}
        {!isCollapsed && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
            {!searchQuery && (
              (() => {
                const rowPaddingX = 12; // padding-left of the history header row
                const iconSize = 18;
                const gap = 10;
                const historyTextLeft = rowPaddingX + iconSize + gap; // left position of History text
                const indent = historyTextLeft - 8; // offset by chat row left padding (8px)
                const lineLeft = 12 + rowPaddingX - 4; // nudge slightly left under the icon
                const lineTop = 40; // start just under the icon
                return (
                  <div style={{ position: 'relative' }}>
                    <div style={{ margin: '0 0 8px 0' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        width: '100%', padding: '10px 12px', borderRadius: '10px',
                        border: 'none', background: 'transparent', color: '#111'
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: 18, height: 18 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span style={{ fontWeight: 500, fontSize: '0.9rem', color: '#111' }}>History</span>
                      </div>
                    </div>
                    <div style={{ position: 'absolute', top: `${lineTop}px`, bottom: 0, left: `${lineLeft}px`, width: '1px', background: '#e5e7eb' }} />
                    <div style={{ marginLeft: `${indent}px` }}>
                      {order.map((label) => (
                        <div key={label} style={{ marginBottom: '0' }}>
                          <div style={{ color: '#111', fontSize: '0.8rem', margin: '4px 0 6px 0', paddingLeft: '8px', fontWeight: 600 }}>{label}</div>
                          {groups[label].map((chat) => (
                            <div
                              key={chat.id}
                              onClick={() => openChat(chat.id)}
                              onMouseEnter={() => setHoveredChatId(chat.id)}
                              onMouseLeave={() => setHoveredChatId((prev) => (prev === chat.id ? null : prev))}
                              onMouseDown={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                              onMouseUp={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                gap: '8px', padding: '4px 8px', borderRadius: '10px', cursor: 'pointer',
                                margin: '2px 0', background: hoveredChatId === chat.id ? '#f5f5f5' : 'transparent'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                {editingChatId === chat.id ? (
                                  <form onSubmit={(e) => saveEditedChatTitle(e, chat.id)} onClick={(e) => e.stopPropagation()} style={{ width: '100%' }}>
                                    <input type="text" value={editValue} onChange={handleEditInputChange} onKeyDown={(e) => handleEditKeyDown(e, chat.id)} onBlur={(e) => handleEditBlur(e, chat.id)} autoFocus style={{ width: '100%', padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.9rem', background: '#fff' }} />
                                  </form>
                                ) : (
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem', color: '#111' }} title={chat.title}>{chat.title}</span>
                                )}
                              </div>
                              <div className="chat-item-menu" style={{ position: 'relative', flexShrink: 0, visibility: hoveredChatId === chat.id || menuOpenForChatId === chat.id ? 'visible' : 'hidden' }} onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setMenuOpenForChatId(menuOpenForChatId === chat.id ? null : chat.id)} style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer' }} aria-label="Chat menu">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.25"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                </button>
                                {menuOpenForChatId === chat.id && (
                                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 6px 20px rgba(0,0,0,0.08)', zIndex: 10, minWidth: '160px' }}>
                                    <button onClick={() => { setEditingChatId(chat.id); setEditValue(chat.title); setMenuOpenForChatId(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.25"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/><path d="M14.06 4.94l3.75 3.75"/></svg>
                                      <span>Rename</span>
                                    </button>
                                    <button onClick={(e) => { deleteChat(e, chat.id); setMenuOpenForChatId(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.25"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 12-2h4a2 2 0 0 12 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                      {/* See all removed per request */}
                    </div>
                  </div>
                );
              })()
            )}

            {/* Search results */}
            {searchQuery && (
              <div>
                {searchResults.length > 0 ? (
                  searchResults.map((chat) => (
                    <div key={chat.id} onClick={() => openChat(chat.id, chat.isShared)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', border: '1px solid #f2f2f2', background: '#fafafa', margin: '6px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2">
                          {chat.isShared ? (
                            <>
                              <circle cx="18" cy="5" r="3"></circle>
                              <circle cx="6" cy="12" r="3"></circle>
                              <circle cx="18" cy="19" r="3"></circle>
                              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </>
                          ) : (
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          )}
                        </svg>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem', color: '#111' }}>{chat.title}</span>
                      </div>
                      <button onClick={(e) => chat.isShared ? removeSharedChat(e, chat.id) : deleteChat(e, chat.id)} style={{ background: 'none', border: 'none', padding: '6px', cursor: 'pointer' }} title={chat.isShared ? 'Remove from list' : 'Delete chat'}>
                        {chat.isShared ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        )}
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: '#666', fontSize: '0.9rem' }}>No matching chats found.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* User Section */}
        <SidebarProfileDropdown
          userEmail={companyEmail}
          username={username}
          isLoggedIn={isLoggedIn}
          profileImage={profileImage}
          rightAddon={(
                         <button onClick={() => setIsCollapsed(!isCollapsed)} style={{
               background: 'none', border: 'none', cursor: 'pointer', color: '#111', padding: '6px'
             }} aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: '3px' }}>
                 {isCollapsed ? 
                   <path d="M3 6h18M3 12h18M3 18h18"/> 
                   : 
                   <path d="M3 6h18M3 12h14M3 18h18"/>
                 }
               </svg>
             </button>
          )}
          onLogout={() => {
            localStorage.removeItem("currentUser");
            localStorage.removeItem("companyEmail");
            setIsLoggedIn(false);
            setUsername(currentUsername);
            setCompanyEmail('');
            setChats([]);
            setSharedChats([]);
            localStorage.removeItem('accessedSharedChats');
            if (onChatSelect && typeof onChatSelect === 'function') {
              onChatSelect(null);
            }
          }}
        />
      </div>
    );
  }

  // Default (non-Demonstration) layout remains unchanged below
  return (
    <div style={{
      width: !isInsideExtension ? (isCollapsed ? '60px' : '280px') : (isCollapsed ? '60px' : '100%'),
      height: '100vh',
      background: '#F5F5F5',
      borderRight: '1px solid rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Control Buttons */}
      {(
        <div style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: isCollapsed ? 'column' : 'row',
          gap: isCollapsed ? '0.5rem' : '1rem',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          alignItems: isCollapsed ? 'center' : 'stretch',
          marginTop: isCollapsed ? '1.5rem' : '0'
        }}>
          <div style={{ marginLeft: '-11.3px' }}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                padding: '0.5rem',
                background: 'none',
                border: 'none',
                color: '#666666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                ':hover': {
                  color: '#333333'
                }
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginTop: '3px' }}>
                {isCollapsed
                  ? <path d="M3 6h18M3 12h18M3 18h18" />
                  : <path d="M3 6h18M3 12h14M3 18h18" />
                }
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: isCollapsed ? 'column' : 'row', gap: isCollapsed ? '0.5rem' : '0.5rem', alignItems: 'center', width: isCollapsed ? '100%' : 'auto', justifyContent: isCollapsed ? 'center' : 'flex-start', marginRight: '-9px' }}>
            <button
              onClick={createNewChat}
              disabled={!isLoggedIn}
              style={{
                padding: '0.5rem',
                background: 'none',
                border: 'none',
                color: isLoggedIn ? '#666666' : '#AAAAAA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isLoggedIn ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                ':hover': {
                  color: '#333333'
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M12 18v-6" />
                <path d="M9 15h6" />
              </svg>
            </button>
            <button
              onClick={toggleSearch}
              style={{
                padding: '0.5rem',
                background: isSearching ? '#E0E0E0' : 'none',
                border: 'none',
                color: '#666666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderRadius: '4px',
                ':hover': {
                  color: '#333333',
                  background: '#E0E0E0'
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {!isCollapsed && isLibraryVisible &&
        <button
          onClick={
            function () {
              setIsLibraryVisible(false);
            }
          }
          className="nav-link"
          style={{ margin: "15px", marginTop: "0px", cursor: "pointer" }}
        >Chats</button>
      }
      {!isCollapsed && !isLibraryVisible &&
        <button
          onClick={
            function () {
              setIsLibraryVisible(true);
              setIsExtensionSidebarVisible(false);
            }
          }
          className="nav-link"
          style={{ margin: "15px", marginTop: "0px", cursor: "pointer" }}
        >Library</button>
      }

      {/* Project Selection Section */}
      {isLoggedIn && projects.length > 0 && !isCollapsed && (
        <div style={{
          padding: '0 1rem 1rem',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#666',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            padding: '0 0.5rem'
          }}>
            Project
          </div>
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="sidebar-project-dropdown"
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.10)',
                background: '#fff',
                fontWeight: 500,
                fontSize: '0.95rem',
                color: '#2c3e50',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                outline: 'none',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'box-shadow 0.18s, border-color 0.18s, background 0.18s',
                position: 'relative'
              }}
              onClick={() => setDropdownOpen((open) => !open)}
              type="button"
            >
              <span style={{ flex: 1, textAlign: 'left' }}>
                {selectedProject === 'default' ? 'Default Project' : selectedProject}
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                width: '100%',
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.10)',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                zIndex: 100,
                padding: '4px 0',
                marginTop: '2px',
                maxHeight: '220px',
                overflowY: 'auto'
              }}>
                {projects.map((proj) => (
                  <button
                    key={proj}
                    onClick={() => {
                      setSelectedProject(proj);
                      setDropdownOpen(false);
                      if (onProjectChange) onProjectChange(proj);
                    }}
                    style={{
                      width: '100%',
                      background: selectedProject === proj ? '#f0f4fa' : 'transparent',
                      color: selectedProject === proj ? '#1a2533' : '#2c3e50',
                      border: 'none',
                      outline: 'none',
                      padding: '10px 16px',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      textAlign: 'left',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background 0.18s, color 0.18s',
                      margin: '2px 0'
                    }}
                  >
                    {selectedProject === proj && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2533" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {proj === 'default' ? 'Default Project' : proj}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Input (only visible when searching) */}
      {!isCollapsed && isSearching && (
        <div style={{
          padding: '0 1rem 1rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            padding: '0 0.5rem'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#666666', marginRight: '0.5rem' }}>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search chats..."
              style={{
                border: 'none',
                padding: '0.75rem 0.5rem 0.75rem 0',
                outline: 'none',
                width: '100%',
                fontSize: '0.875rem'
              }}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.25rem'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#666666' }}>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chat History */}
      {!isCollapsed && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {/* Regular Chats Section */}
          {isLoggedIn && chats.length > 0 && !isSearching && (
            <div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#666',
                marginBottom: '0.5rem',
                padding: '0 0.5rem'
              }}>
                YOUR CHATS
              </div>

              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => openChat(chat.id)}
                  style={{
                    padding: '0.875rem',
                    background: '#EBEBEB',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    borderRadius: '0.75rem',
                    color: '#333333',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                    width: '100%'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', width: '100%' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(0, 0, 0, 0.5)', flexShrink: 0 }}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {editingChatId === chat.id ? (
                      <form
                        onSubmit={(e) => saveEditedChatTitle(e, chat.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '100%' }}
                      >
                        <input
                          type="text"
                          value={editValue}
                          onChange={handleEditInputChange}
                          onKeyDown={(e) => handleEditKeyDown(e, chat.id)}
                          onBlur={(e) => handleEditBlur(e, chat.id)}
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            background: 'white'
                          }}
                        />
                      </form>
                    ) : (
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'text',
                          fontSize: '0.95rem'
                        }}
                        onClick={(e) => startEditing(e, chat.id, chat.title)}
                        title="Click to edit"
                      >
                        {chat.title}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => deleteChat(e, chat.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      opacity: 0.7,
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                    onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
                    title="Delete chat"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Shared Chats Section */}
          {sharedChats.length > 0 && !isSearching && (
            <div style={{ marginTop: chats.length > 0 ? '1.5rem' : '0' }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#666',
                marginBottom: '0.5rem',
                padding: '0 0.5rem'
              }}>
                SHARED CHATS
              </div>

              {sharedChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => openChat(chat.id, true)}
                  style={{
                    padding: '0.875rem',
                    background: '#EBEBEB',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    borderRadius: '0.75rem',
                    color: '#333333',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                    width: '100%'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', width: '100%' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(0, 0, 0, 0.5)', flexShrink: 0 }}>
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {chat.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => removeSharedChat(e, chat.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      opacity: 0.7,
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                    onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
                    title="Remove from list"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search Results */}
          {isSearching && searchQuery && (
            <div>
              {searchResults.length > 0 ? (
                searchResults.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => openChat(chat.id, chat.isShared)}
                    style={{
                      padding: '0.875rem',
                      background: '#EBEBEB',
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      borderRadius: '0.75rem',
                      color: '#333333',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', width: '100%' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(0, 0, 0, 0.5)', flexShrink: 0 }}>
                        {chat.isShared ? (
                          <>
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                          </>
                        ) : (
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        )}
                      </svg>
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {chat.title}
                        {chat.messages && Array.isArray(chat.messages) &&
                          chat.messages.some(message =>
                            message.content && message.content.toLowerCase().includes(searchQuery.toLowerCase())
                          ) && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#666',
                              marginTop: '0.25rem',
                              fontStyle: 'italic'
                            }}>
                              {chat.messages.filter(message =>
                                message.content && message.content.toLowerCase().includes(searchQuery.toLowerCase())
                              ).length} matching messages
                            </div>
                          )
                        }
                      </span>
                    </div>
                    <button
                      onClick={(e) => chat.isShared ? removeSharedChat(e, chat.id) : deleteChat(e, chat.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#666',
                        opacity: 0.7,
                        cursor: 'pointer',
                        borderRadius: '4px',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                      onMouseOut={(e) => e.currentTarget.style.opacity = 0.7}
                      title={chat.isShared ? "Remove from list" : "Delete chat"}
                    >
                      {chat.isShared ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem 0',
                  color: '#666666',
                  fontSize: '0.875rem'
                }}>
                  No matching chats found.
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {(!isLoggedIn || (chats.length === 0 && sharedChats.length === 0)) && !isSearching && (
            <div style={{
              textAlign: 'center',
              padding: '2rem 0',
              color: '#666666',
              fontSize: '0.875rem'
            }}>
              {!isLoggedIn
                ? "Please log in to see your chats."
                : "No chats yet. Click the new chat button to get started."}
            </div>
          )}
        </div>
      )}

      {/* User Section */}
      <SidebarProfileDropdown
        userEmail={companyEmail}
        username={username}
        isLoggedIn={isLoggedIn}
        profileImage={profileImage}
        onLogout={() => {
          // Implement logout logic here
          // For now, just clear local storage
          localStorage.removeItem("currentUser");
          localStorage.removeItem("companyEmail");
          setIsLoggedIn(false);
          setUsername(currentUsername); // Reset username to currentUsername
          setCompanyEmail('');
          setChats([]);
          setSharedChats([]);
          localStorage.removeItem('accessedSharedChats');
          if (onChatSelect && typeof onChatSelect === 'function') {
            onChatSelect(null); // Clear selected chat
          }
        }}
      />
    </div>
  );
} 