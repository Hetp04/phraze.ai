import { useState, useRef, useEffect } from 'react';
import { auth } from '../firebase-init';
import ChatSidebar from '../components/ChatSidebar';
// Import our new groqClient service
import { sendMessageToGroq, formatMessageWithImage, formatTextMessage } from '../services/groqClient';
import { getFirebaseData, showToast } from '../funcs';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadHighlights, setMainCompanyEmail } from '../utils/highlighting';
import { initContactsPanel, setMessagingUserEmail, setMessagingUserName, setMessagingCurrentProject, setFirebaseFunctions } from '../utils/messaging';
import { useExtension } from "../context/ExtensionContext";
import Navbar from '../components/Navbar';

// Import Groq SDK
import Groq from 'groq-sdk';

// Groq API configuration
const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
// const GROQ_MODEL = "llama3-8b-8192"; // Easily changeable model variable
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"; // Easily changeable model variable

// Initialize Groq client
const groq = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

// Helper function to sanitize URL for Firebase path
function sanitizeFirebasePath(url) {
  // Basic sanitization: replace forbidden characters with underscores
  // More robust sanitization might be needed depending on expected URLs
  return url.replace(/[.#$\/\\\[\\\]]/g, '_');
}

// Login Modal Component
function AuthModal({ onClose, onGuestContinue }) {
  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <div className="auth-modal-header">
          <h2>Sign in to Phraze</h2>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>
        <div className="auth-modal-content">
          <p>Sign in to access all features of Phraze, including saving and sharing your annotations.</p>
          <div className="auth-modal-buttons">
            <a href="/auth" className="auth-modal-signin">Sign In / Sign Up</a>
            <button onClick={onGuestContinue} className="auth-modal-guest">Continue as Guest</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Separate component for the input form
function MessageInput({ inputValue, setInputValue, handleSubmit, isLoading, textareaRef, handleImageUpload, imagePreview, clearImagePreview }) {
  const fileInputRef = useRef(null);

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative'
      }}
    >
      {/* Image preview area */}
      {imagePreview && (
        <div style={{
          marginBottom: '0.5rem',
          position: 'relative',
          maxWidth: '200px'
        }}>
          <img
            src={imagePreview}
            alt="Preview"
            style={{
              maxWidth: '100%',
              borderRadius: '0.5rem',
              border: '1px solid rgba(0,0,0,0.1)'
            }}
          />
          <button
            type="button"
            onClick={clearImagePreview}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            aria-label="Remove image"
          >
            ✕
          </button>
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        position: 'relative',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '0.75rem',
        backgroundColor: '#fff',
        paddingRight: '2.5rem'
      }}>
        {/* Image upload button */}
        <button
          type="button"
          onClick={triggerFileInput}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.75rem 0.5rem',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Upload image"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </button>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />

        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Message Phraze..."
          style={{
            width: '100%',
            padding: '0.75rem 0.5rem 0.75rem 0.5rem',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            resize: 'none',
            maxHeight: '200px',
            outline: 'none',
            backgroundColor: '#fff',
            fontFamily: 'inherit',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          rows={1}
          disabled={isLoading}
        />
        <button
          type="submit"
          style={{
            display: 'none',
            position: 'absolute',
            right: '0.75rem',
            bottom: '0.75rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            opacity: (inputValue.trim() || imagePreview) && !isLoading ? 1 : 0.5,
            transition: 'opacity 0.2s',
            padding: '0.25rem'
          }}
          disabled={!inputValue.trim() && !imagePreview || isLoading}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              width: '1.25rem',
              height: '1.25rem',
              transform: 'rotate(90deg)',
              color: '#10a37f'
            }}
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}

// Separate component for disclaimer
const DisclaimerMessage = () => (
  <div style={{
    textAlign: 'center',
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.75rem'
  }}>
    Phraze can make mistakes. Consider checking important information.
  </div>
);

export default function Demonstration({ currentProject, onProjectChange, setCurrentProject }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [overrideShowHighlights, setOverrideShowHighlights] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editingMessageContent, setEditingMessageContent] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSharedView, setIsSharedView] = useState(false);
  const [sharedCompanyEmail, setSharedCompanyEmail] = useState(null);
  // const [chatHighlights, setChatHighlights] = useState([]); // State for highlights
  // const [annotationHistoryData, setAnnotationHistoryData] = useState(null); // State for parsed history
  const [originalSanitizedUrl, setOriginalSanitizedUrl] = useState(null); // State for original URL
  const [showAuthModal, setShowAuthModal] = useState(false); // State for authentication modal
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const editTextareaRef = useRef(null);
  const messageRefs = useRef({}); // Ref to hold message bubble DOM nodes
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isInsideExtension, setIsInsideExtension } = useExtension();

  // Add state for contacts panel visibility
  const [isContactsPanelVisible, setIsContactsPanelVisible] = useState(false);

  const location = useLocation(); // Use useLocation hook
  const navigate = useNavigate(); // Use useNavigate hook

  // Check if user is authenticated and show modal if not
  useEffect(() => {
    const checkAuth = () => {
      const user = auth.currentUser;
      if (!user && !sessionStorage.getItem('guestMode')) {
        setShowAuthModal(true);
      }
    };
    // Check auth status when component mounts
    checkAuth();

    // Also listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user && !sessionStorage.getItem('guestMode')) {
        setShowAuthModal(true);
      } else {
        setShowAuthModal(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handler for continuing as guest
  const handleGuestContinue = () => {
    sessionStorage.setItem('guestMode', 'true');
    setShowAuthModal(false);
  };

  // Helper to ensure messageRefs object is updated correctly
  const setMessageRef = (index, element) => {
    if (element) {
      messageRefs.current[index] = element;
    } else {
      delete messageRefs.current[index];
    }
  };

  const scrollToBottom = () => {
    // messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Only scroll to bottom when messages change, but control when it happens
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    handleProjectChange(currentProject);
  }, [currentProject]);

  // Effect 1: Set initial shared state based ONLY on initial URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sharedId = params.get('share');
    const companyEmailParam = params.get('companyEmail');
    const projectParam = params.get('project');

    if (sharedId && companyEmailParam && projectParam) {
      console.log("Initial Load: Setting shared view state and loading chat.");
      setIsSharedView(true);
      setSharedCompanyEmail(companyEmailParam);
      setCurrentProject(projectParam);
      loadSharedChat(sharedId, companyEmailParam);
      // No need to navigate away, keep params for refresh
    }
    // No 'else' block here. isSharedView defaults to false and is only set true here,
    // or reset explicitly by clearChats.
  }, []); // Empty dependency array: Run only once on mount

  // Effect 2: Handle chat clearing (separate from initial load)
  useEffect(() => {
    const handleClearChats = () => {
      console.log("Clearing chat state...");
      setMessages([]);
      setCurrentChat(null);
      setInputValue('');
      clearImagePreview();
      setEditingMessageIndex(null);
      setEditingMessageContent('');
      setIsSharedView(false); // Reset shared view state explicitly
      setSharedCompanyEmail(null);
      // setChatHighlights([]);
    };

    //Called from extension when showing groq chats in the messaging system in the extension popup window
    function handleExtensionMessages(event) {
      if (event.data.action == "Show Highlights") {
        setOverrideShowHighlights(true);
        setSharedCompanyEmail(event.data.companyEmail);
      }
      else if (event.data.action == "Show Sidebar") {
        setIsSidebarCollapsed(false);
      }
      else if (event.data.action == "Inside Extension") {
        handleProjectChange(event.data.currentProject);
        setIsSidebarCollapsed(false);
        setIsInsideExtension(true);
      }
    }

    window.addEventListener('message', handleExtensionMessages);
    window.addEventListener('clearChats', handleClearChats);

    return () => {
      window.removeEventListener('message', handleExtensionMessages);
      window.removeEventListener('clearChats', handleClearChats);
    };
  }, []); // Setup listener once

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'inherit';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [inputValue]);

  // Handle chat selection from sidebar
  const handleChatSelect = (selectedChat) => {
    if (isInsideExtension) {
      setIsSidebarCollapsed(true);
    }
    // Make sure we update the current chat with the latest data
    setCurrentChat(selectedChat);
    if (selectedChat) {
      setIsSharedView(selectedChat.originalId != null)
      setSharedCompanyEmail(selectedChat.companyEmail)

      window.parent.postMessage({ action: "activeChat", id: selectedChat.id, currentProject: currentProject }, "*");
      if (selectedChat.originalId) {
        async function fetchOriginalMessages() {
          if (selectedChat.companyEmail) {
            let path = `Companies/${selectedChat.companyEmail}/projects/${currentProject}/groqChats/${selectedChat.originalId}/messages`;
            console.log("AH1", path);
            var messages = await getFirebaseData(`Companies/${selectedChat.companyEmail}/projects/${currentProject}/groqChats/${selectedChat.originalId}/messages`);
            const chatMessages = Array.isArray(messages || [])
              ? messages
              : Object.values(messages);
            setMessages(chatMessages);
          }
        }
        fetchOriginalMessages();
      }
      else {
        // Convert messages object to array if needed
        const chatMessages = Array.isArray(selectedChat.messages)
          ? selectedChat.messages
          : Object.values(selectedChat.messages);
        setMessages(chatMessages);
      }
    } else {
      // New chat - clear messages
      setMessages([]);
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    setImageFile(file);

    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Clear image preview
  const clearImagePreview = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!inputValue.trim() && !imagePreview) || isLoading) return;

    let userMessageContent = inputValue;
    let messageType = 'text';
    let imageUrl = null;

    // If there's an image, upload it to Firebase Storage (simplified here)
    if (imageFile) {
      try {
        // In a real implementation, you would upload to Firebase here
        // For now, we'll just use the data URL as is
        imageUrl = imagePreview; // This would be a Firebase Storage URL in production
        messageType = 'image';

        // If there's also text, combine them
        if (inputValue.trim()) {
          messageType = 'image_text';
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        return;
      }
    }

    // Create user message object for display in the UI
    const userMessage = {
      role: 'user',
      content: userMessageContent,
      type: messageType
    };

    // If there's an image, add the imageUrl to the message
    if (imageUrl) {
      userMessage.imageUrl = imageUrl;
    }

    // Add user message to state
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    clearImagePreview();
    setIsLoading(true);

    try {
      // Create messages array with proper format for Groq API
      let apiMessages = [];

      // Check if any message contains an image
      const hasImage = imageUrl || messages.some(msg => msg.imageUrl);

      // Only add system message if there are no images
      if (!hasImage) {
        apiMessages.push({
          role: "system",
          content: "You are a helpful assistant called Phraze."
        });
      }

      // Format previous messages for the API
      for (const msg of messages) {
        if (msg.role === 'user') {
          if (msg.imageUrl) {
            // Message with image and text
            const contentArray = [];

            if (msg.content.trim()) {
              contentArray.push({
                type: "text",
                text: msg.content
              });
            }

            contentArray.push({
              type: "image_url",
              image_url: {
                url: msg.imageUrl
              }
            });

            apiMessages.push({
              role: "user",
              content: contentArray
            });
          } else {
            // Text-only user message
            apiMessages.push({
              role: "user",
              content: msg.content
            });
          }
        } else if (msg.role === 'assistant') {
          // Assistant message (always text)
          apiMessages.push({
            role: "assistant",
            content: msg.content
          });
        }
      }

      // Add the current user message
      if (imageUrl) {
        const contentArray = [];

        if (userMessageContent.trim()) {
          contentArray.push({
            type: "text",
            text: userMessageContent
          });
        }

        contentArray.push({
          type: "image_url",
          image_url: {
            url: imageUrl
          }
        });

        apiMessages.push({
          role: "user",
          content: contentArray
        });
      } else {
        apiMessages.push({
          role: "user",
          content: userMessageContent
        });
      }

      // Call Groq API with the new SDK format
      const chatCompletion = await groq.chat.completions.create({
        messages: apiMessages,
        model: GROQ_MODEL,
        temperature: 1,
        max_completion_tokens: 1024,
        top_p: 1,
        stream: false,
        stop: null
      });

      const assistantMessage = {
        role: 'assistant',
        content: chatCompletion.choices[0].message.content
      };

      // Add the assistant's response to the messages
      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      console.log(currentChat);

      try {
        import('../funcs').then(async module => {
          try {
            const saveFirebaseData = module.saveFirebaseData;
            const getFirebaseData = module.getFirebaseData;
            const generateUniqueId = module.generateUniqueId || (() => Date.now().toString());

            // Get current user from Firebase Auth
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.email) {
              const email = currentUser.email.replace(".", ",");
              const companyEmailPath = await getFirebaseData(`emailToCompanyDirectory/${email}`);

              if (companyEmailPath) {
                // If we don't have a current chat or it doesn't have an ID, create a new one
                if (!currentChat || !currentChat.id) {
                  // Generate a new unique ID for the chat
                  const newChatId = generateUniqueId();

                  // Create a title from the first user message
                  const newTitle = userMessage.content.length > 30
                    ? `${userMessage.content.substring(0, 27)}...`
                    : userMessage.content || 'Image Chat';

                  // Create a new chat in Firebase
                  const newChat = {
                    id: newChatId,
                    title: newTitle,
                    timestamp: Date.now(),
                    messages: updatedMessages
                  };

                  // Save the new chat to Firebase
                  await saveFirebaseData(`Companies/${companyEmailPath}/projects/${currentProject}/groqChats/${newChatId}`, newChat);

                  // Update local state with the new chat
                  setCurrentChat(newChat);

                  console.log("Created new chat:", newChat);
                } else {
                  // If we already have a chat, update it as before
                  await saveFirebaseData(`Companies/${companyEmailPath}/projects/${currentProject}/groqChats/${currentChat.id}/messages`, updatedMessages);

                  console.log("Company email path", companyEmailPath);
                  // Update title if it's a new chat with default title
                  if (currentChat.title === 'New Chat') {
                    // Create a title from the first user message
                    const newTitle = userMessage.content.length > 30
                      ? `${userMessage.content.substring(0, 27)}...`
                      : userMessage.content || 'Image Chat';

                    await saveFirebaseData(`Companies/${companyEmailPath}/projects/${currentProject}/groqChats/${currentChat.id}/title`, newTitle);

                    // Update local state
                    setCurrentChat(prev => ({
                      ...prev,
                      title: newTitle
                    }));
                  }
                }
              } else {
                console.warn("Company email path not found for user:", email);
              }
            } else {
              console.warn("No authenticated user found or user email missing");
            }
          } catch (innerError) {
            console.error("Error updating Firebase data:", innerError);
          }
        }).catch(importError => {
          console.error("Error importing funcs module:", importError);
        });
      } catch (outerError) {
        console.error("Error in Firebase update block:", outerError);
      }
    } catch (error) {
      console.error('Error calling Groq API:', error);
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request.'
      }]);
    } finally {
      setIsLoading(false);

      // Focus the textarea after response is received
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (indexToDelete) => {
    if (!currentChat || !currentChat.id) return;

    try {
      // Create a new array without the deleted message
      const updatedMessages = messages.filter((_, index) => index !== indexToDelete);
      setMessages(updatedMessages);

      // Update Firebase
      import('../funcs').then(async module => {
        try {
          const saveFirebaseData = module.saveFirebaseData;
          const getFirebaseData = module.getFirebaseData;

          // Get current user from Firebase Auth
          const currentUser = auth.currentUser;
          if (currentUser && currentUser.email) {
            const email = currentUser.email.replace(".", ",");
            const companyEmailPath = await getFirebaseData(`emailToCompanyDirectory/${email}`);

            if (companyEmailPath) {
              // Update the messages in Firebase
              await saveFirebaseData(`Companies/${companyEmailPath}/projects/${currentProject}/groqChats/${currentChat.id}/messages`, updatedMessages);
              console.log("Message deleted successfully");
            }
          }
        } catch (error) {
          console.error("Error deleting message:", error);
        }
      });
    } catch (error) {
      console.error("Error in delete message function:", error);
    }
  };

  // Start editing a message
  const handleStartEditing = (index, content) => {
    var width = document.getElementById("message-content" + index).offsetWidth;
    if (width < 300) {
      width = 300;
    }
    setEditingMessageIndex(index);
    setEditingMessageContent(content);
    setTimeout(() => {
      if (editTextareaRef.current) {
        editTextareaRef.current.focus();
        editTextareaRef.current.style.height = 'inherit';
        editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
        editTextareaRef.current.style.width = width + "px";
      }
    }, 0);
  };

  // Cancel editing a message
  const handleCancelEditing = () => {
    setEditingMessageIndex(null);
    setEditingMessageContent('');
  };

  // Save the edited message and regenerate AI response
  const handleSaveEdit = async (indexToEdit) => {
    if (editingMessageContent.trim() === '') return;

    setIsLoading(true);

    // Find the next assistant message after the edited user message
    const nextAssistantIndex = messages.findIndex((msg, idx) =>
      idx > indexToEdit && msg.role === 'assistant'
    );

    // Create a new array with messages up to the edited one
    let updatedMessages = [...messages];
    updatedMessages[indexToEdit] = { ...updatedMessages[indexToEdit], content: editingMessageContent };

    // If there's an assistant message afterward, remove it (and any following messages)
    if (nextAssistantIndex !== -1) {
      updatedMessages = updatedMessages.slice(0, nextAssistantIndex);
    }

    // Update messages state first
    setMessages(updatedMessages);

    try {
      // Create messages array with proper format for Groq API
      let apiMessages = [];

      // Check if any message contains an image
      const hasImage = updatedMessages.some(msg => msg.imageUrl);

      // Only add system message if there are no images
      if (!hasImage) {
        apiMessages.push({
          role: "system",
          content: "You are a helpful assistant called Phraze."
        });
      }

      // Format messages for the API
      for (const msg of updatedMessages) {
        if (msg.role === 'user') {
          if (msg.imageUrl) {
            // Message with image and text
            const contentArray = [];

            if (msg.content.trim()) {
              contentArray.push({
                type: "text",
                text: msg.content
              });
            }

            contentArray.push({
              type: "image_url",
              image_url: {
                url: msg.imageUrl
              }
            });

            apiMessages.push({
              role: "user",
              content: contentArray
            });
          } else {
            // Text-only user message
            apiMessages.push({
              role: "user",
              content: msg.content
            });
          }
        } else if (msg.role === 'assistant') {
          // Assistant message (always text)
          apiMessages.push({
            role: "assistant",
            content: msg.content
          });
        }
      }

      // Call Groq API with the new SDK format
      const chatCompletion = await groq.chat.completions.create({
        messages: apiMessages,
        model: GROQ_MODEL,
        temperature: 1,
        max_completion_tokens: 1024,
        top_p: 1,
        stream: false,
        stop: null
      });

      const assistantMessage = {
        role: 'assistant',
        content: chatCompletion.choices[0].message.content
      };

      // Add the assistant's response to the messages
      const newMessages = [...updatedMessages, assistantMessage];
      setMessages(newMessages);

      // Update Firebase
      import('../funcs').then(async module => {
        try {
          const saveFirebaseData = module.saveFirebaseData;
          const getFirebaseData = module.getFirebaseData;

          const currentUser = auth.currentUser;
          if (currentUser && currentUser.email && currentChat && currentChat.id) {
            const email = currentUser.email.replace(".", ",");
            const companyEmailPath = await getFirebaseData(`emailToCompanyDirectory/${email}`);

            if (companyEmailPath) {
              await saveFirebaseData(`Companies/${companyEmailPath}/projects/${currentProject}/groqChats/${currentChat.id}/messages`, newMessages);
            }
          }
        } catch (error) {
          console.error("Error updating Firebase data:", error);
        }
      });

    } catch (error) {
      console.error('Error calling Groq API:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request.'
      }]);
    } finally {
      setIsLoading(false);
      setEditingMessageIndex(null);
      setEditingMessageContent('');
    }
  };

  // Auto-resize edit textarea
  useEffect(() => {
    const textarea = editTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'inherit';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [editingMessageContent]);

  // Function to load shared chat data directly
  const loadSharedChat = async (sharedId, companyEmail) => {
    setIsLoading(true); // Start loading
    try {
      const { getFirebaseData } = await import('../funcs');
      const sharedChatPath = `sharedChats/${sharedId}`;
      console.log("Fetching shared chat from:", sharedChatPath);
      const sharedChatData = await getFirebaseData(sharedChatPath);

      if (sharedChatData && companyEmail) {
        // Convert messages object to array if needed
        const chatMessages = Array.isArray(sharedChatData.messages)
          ? sharedChatData.messages
          : Object.values(sharedChatData.messages || {});

        // Set current chat state
        setCurrentChat({
          id: sharedId,
          title: sharedChatData.title,
          timestamp: sharedChatData.timestamp,
          originalId: sharedChatData.originalId,
          isShared: true
        });
        setMessages(chatMessages);
        console.log("Loaded shared chat data:", sharedChatData);
        setOriginalSanitizedUrl(sharedChatData.originalSanitizedUrl || null); // Set original URL state
        console.log("Original sanitized URL:", sharedChatData.originalSanitizedUrl);

      } else {
        if (!sharedChatData) console.error("Shared chat not found for ID:", sharedId);
        if (!companyEmail) console.error("Shared company email not available when loading chat.");
        showToast("Shared chat or company info not found.", "error");
        setCurrentChat(null);
        setMessages([]);
        // setChatHighlights([]);
        // setAnnotationHistoryData(null);
      }
    } catch (error) {
      console.error("Error loading shared chat:", error);
      showToast("Error loading shared chat.", "error");
      setCurrentChat(null);
      setMessages([]);
      // setChatHighlights([]);
      // setAnnotationHistoryData(null);
    } finally {
      setIsLoading(false); // Stop loading regardless of outcome
    }
  };

  // Effect 4: Listen for real-time highlight updates from Firebase
  useEffect(() => {
    let listenerRef1 = null;
    let listenerRef2 = null;

    let unsubscribe = () => { }; // Function to detach listener

    const setupListener = async () => {
      if ((isSharedView || overrideShowHighlights) && sharedCompanyEmail) {
        try {
          // Dynamically import Firebase database functions
          const firebaseDb = await import('firebase/database');
          const { ref, onValue, off } = firebaseDb;
          const { database } = await import('../firebase-init'); // Get database instance

          //Does not go all the way down to /highlights so that we can also reload labels and codes for the highlights, which are in /annotationHistory
          const highlightsPath = `Companies/${sharedCompanyEmail}/projects/default`;
          console.log("[Listener] Setting up listener for path:", highlightsPath);
          listenerRef1 = ref(database, highlightsPath);

          // Define the callback for onValue
          const handleValueChange1 = (snapshot) => {
            console.log("Website loading highlights");
            setMainCompanyEmail(sharedCompanyEmail);
            setTimeout(function () {
              loadHighlights();
            }, 1000);
          };

          // Attach the listener
          onValue(listenerRef1, handleValueChange1);

          const groqPath = `Companies/${sharedCompanyEmail}/projects/${currentProject}/groqChats`;
          console.log("[Listener] Setting up listener for path:", groqPath);
          listenerRef2 = ref(database, groqPath);

          // Define the callback for onValue
          const handleValueChange2 = (snapshot) => {
            console.log("Website loading chats");
            if (currentChat && currentChat.originalId) {
              if (snapshot.val())
                setMessages(snapshot.val()[currentChat.originalId].messages);
              else
                setMessages([]);
            }
          };

          // Attach the listener
          onValue(listenerRef2, handleValueChange2);

          // Set the cleanup function
          unsubscribe = () => {
            if (listenerRef1) {
              console.log("[Listener] Detaching listener from path:", highlightsPath);
              console.log("[Listener] Detaching listener from path:", groqPath);
              off(listenerRef1, 'value', handleValueChange1); // Detach specific callback
              listenerRef1 = null;
              off(listenerRef2, 'value', handleValueChange2); // Detach specific callback
              listenerRef2 = null;
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

  }, [isSharedView, currentChat, sharedCompanyEmail, originalSanitizedUrl, isInsideExtension]); // Dependencies

  // Handle sharing a chat
  const handleShareChat = async (chatToShare) => {
    if (!chatToShare || !chatToShare.id) return;

    // Ensure user is logged in (already handled by the button click, but good practice here)
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      showToast("Please log in to share chats", "info");
      return;
    }

    try {
      // Import necessary functions
      const { generateUniqueId, saveFirebaseData, showToast, getFirebaseData } = await import('../funcs');

      // Get company email path
      const userEmail = currentUser.email.replace(".", ",");
      const companyEmailPath = await getFirebaseData(`emailToCompanyDirectory/${userEmail}`);

      if (!companyEmailPath) {
        console.error("Company email path not found for user:", currentUser.email);
        showToast("Could not find company information to generate share link.", "error");
        return;
      }

      // Get the sanitized URL where highlights were likely created
      const sourceUrl = window.location.href; // Assuming sharing happens on the page with highlights
      const sanitizedSourceUrl = sanitizeFirebasePath(sourceUrl);

      // Create a copy of the chat data including highlights and source URL
      const sharedChatData = {
        title: chatToShare.title,
        // messages: chatToShare.messages,
        timestamp: Date.now(),
        originalId: chatToShare.id,
        // highlights: highlightsToShare,
        originalSanitizedUrl: sanitizedSourceUrl, // Add the source URL
        companyEmail: companyEmailPath,
        project: currentProject,
        id: chatToShare.id
      };

      // Save the shared chat to a public location in Firebase
      const shareId = generateUniqueId(12);
      await saveFirebaseData(`sharedChats/${shareId}`, sharedChatData);

      // Create the shareable URL with company email
      const shareableUrl = `${window.location.origin}/demonstration?share=${shareId}&companyEmail=${encodeURIComponent(companyEmailPath)}&project=${encodeURIComponent(currentProject)}`;

      // Copy the URL to clipboard
      await navigator.clipboard.writeText(shareableUrl);

      // Show a success toast
      showToast("Shareable link copied to clipboard!", "success");

    } catch (error) {
      console.error("Error sharing chat:", error);
      const { showToast } = await import('../funcs');
      showToast("Failed to create shareable link", "error");
    }
  };

  //Contacts sidebar
  useEffect(() => {
    const initMessages = async () => {
      if (!isInsideExtension && isContactsPanelVisible && auth && auth.currentUser && auth.currentUser.email) {
        setMessagingUserEmail(auth.currentUser.email)
        setMessagingUserName(auth.currentUser.displayName)
        setMessagingCurrentProject(currentProject);
        const firebaseDb = await import('firebase/database');
        const { database } = await import('../firebase-init'); // Get database instance
        const { ref, onValue, off } = firebaseDb;
        setFirebaseFunctions(ref, onValue, off, database);

        var currentTopic = "general";
        if (currentChat)
          currentTopic = `groqChats-${currentChat.id}`;
        initContactsPanel(currentTopic);
      }
    };

    initMessages();

    // let listenerRef = null;
    // let unsubscribe = () => { }; // Function to detach listener

    // const setupListener = async () => {
    //   if (!isInsideExtension && isContactsPanelVisible && auth && auth.currentUser && auth.currentUser.email) {
    //     try {
    //       setMessagingUserEmail(auth.currentUser.email)
    //       setMessagingUserName(auth.currentUser.displayName)
    //       setMessagingCurrentProject(currentProject);
    //       const firebaseDb = await import('firebase/database');
    //       const { database } = await import('../firebase-init'); // Get database instance
    //       const { ref, onValue, off } = firebaseDb;

    //       var currentTopic = "general";
    //       if (currentChat)
    //         currentTopic = `groqChats/${currentChat.id}`;
    //       initContactsPanel(currentTopic);
    //       var mainCompanyEmail = await getFirebaseData(`emailToCompanyDirectory/${auth.currentUser.email.replace(".", ",")}`);
    //       // Dynamically import Firebase database functions

    //       //Does not go all the way down to /highlights so that we can also reload labels and codes for the highlights, which are in /annotationHistory
    //       const messagesPath = `Companies/${mainCompanyEmail}/messages`;
    //       console.log("[Listener] Setting up listener for path:", messagesPath);
    //       listenerRef = ref(database, messagesPath);

    //       // Define the callback for onValue
    //       const handleValueChange = (snapshot) => {
    //         console.log("Website loading messages");
    //         loadMessages(ref, onValue, off);
    //       };

    //       // Attach the listener
    //       onValue(listenerRef, handleValueChange);


    //       // Set the cleanup function
    //       unsubscribe = () => {
    //         if (listenerRef) {
    //           console.log("[Listener] Detaching listener from path:", messagesPath);
    //           off(listenerRef, 'value', handleValueChange); // Detach specific callback
    //           listenerRef = null;
    //         }
    //       };

    //     } catch (error) {
    //       console.error("[Listener] Error setting up Firebase listener:", error);
    //     }
    //   }
    // };



    // setupListener();

    // Cleanup function: Remove listener when dependencies change or component unmounts
    // return () => {
    //   unsubscribe();
    // };
  }, [isContactsPanelVisible]);

  // Add a handler for project change
  const handleProjectChange = (newProject) => {
    setCurrentChat(null);
    setMessages([]);
    setIsContactsPanelVisible(false);
    setCurrentProject(newProject);
  };

  return (
    <>
      <div style={{ display: 'flex', height: '100vh' }}>
        <ChatSidebar
          onChatSelect={handleChatSelect}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          currentProject={currentProject}
        />

        <main className="chat-interface" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgb(249, 248, 246)',
          position: 'relative'
        }}>
          {/* Authentication Modal */}
          {showAuthModal && (
            <AuthModal
              onClose={() => setShowAuthModal(false)}
              onGuestContinue={handleGuestContinue}
            />
          )}

          {/* Chat title when a chat is selected */}
          {currentChat && currentChat.title && (
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '500'
              }}>
                {currentChat.title}
              </h2>

              {/* Share button - only visible when chat has messages */}
              {messages.length > 0 && !isInsideExtension && (
                <button
                  onClick={() => {
                    if (auth.currentUser) {
                      handleShareChat(currentChat);
                    } else {
                      showToast("Please log in to share chats", "info");
                    }
                  }}
                  style={{
                    position: 'absolute',
                    right: '4.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    color: '#666',
                    transition: 'all 0.2s'
                  }}
                  title="Share this chat"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  <span style={{ fontSize: '0.875rem' }}>Share</span>
                </button>
              )}
              {!isInsideExtension &&
                <button
                  style={{
                    backgroundColor: '#00000000',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    position: 'absolute',
                    right: '1.5rem'
                  }}
                  onClick={() => setIsContactsPanelVisible(v => !v)}
                >
                  <img src='src/images/messages.png' style={{ width: '25px', height: '25px', opacity: 0.5 }}></img>
                </button>
              }
            </div>
          )
          }

          {/* Welcome Screen with Input at Top (shown when no messages) */}
          {
            messages.length === 0 && (
              <div style={{
                position: 'absolute',
                top: '25%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                width: '100%',
                maxWidth: '800px',
                padding: '0 2rem'
              }}>
                <h1 style={{
                  fontSize: '2rem',
                  marginTop: '20rem',
                  marginBottom: '1.5rem',
                  color: '#202123'
                }}>
                  How can I help you today?
                </h1>

                {/* Input form at the top when no messages */}
                <div style={{ marginBottom: '1.5rem', padding: '0 1rem' }}>
                  <MessageInput
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleSubmit={handleSubmit}
                    isLoading={isLoading}
                    textareaRef={textareaRef}
                    handleImageUpload={handleImageUpload}
                    imagePreview={imagePreview}
                    clearImagePreview={clearImagePreview}
                  />
                  <DisclaimerMessage />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  maxWidth: '600px',
                  margin: '0 auto',
                  marginTop: '2rem'
                }}>
                  {/* {[
                  'Explain quantum computing',
                  'Write a thank you note',
                  'Debug my Python code',
                  'Plan a vacation'
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(suggestion)}
                    style={{
                      padding: '1rem',
                      background: '#f9fafb',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#374151',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      ':hover': {
                        background: '#f3f4f6',
                        borderColor: 'rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    {suggestion}
                  </button>
                ))} */}
                </div>
              </div>
            )
          }

          {/* Chat Messages */}
          <div
            key={currentChat ? currentChat.id : 'new-chat'}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '2rem 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  padding: '0 1rem',
                  maxWidth: '800px',
                  margin: '0 auto',
                  width: '100%',
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  position: 'relative'
                }}
              >
                <div
                  className="message-bubble"
                  style={{
                    padding: '1rem',
                    background: message.role === 'user' ? '#ffffff' : 'transparent',
                    borderRadius: message.role === 'user' ? '2rem' : '0.5rem',
                    borderBottomRightRadius: message.role === 'user' ? '5px' : '0.5rem',
                    color: '#0A0A0A',
                    display: 'inline-block',
                    maxWidth: '85%',
                    position: 'relative'
                  }}
                >
                  {/* Edit Mode for User Messages */}
                  {message.role === 'user' && editingMessageIndex === index ? (
                    <div style={{
                      position: 'relative',
                      width: '100%' // Ensure the container takes full width of parent
                    }}>
                      <textarea
                        ref={editTextareaRef}
                        value={editingMessageContent}
                        onChange={(e) => setEditingMessageContent(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          lineHeight: '1.5',
                          resize: 'none',
                          outline: 'none',
                          fontFamily: 'inherit',
                          backgroundColor: '#f9f9f9',
                          boxSizing: 'border-box' // Ensure padding is included in width calculation
                        }}
                        rows={1}
                      />
                      <div style={{
                        marginTop: '0.5rem',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.5rem'
                      }}>
                        <button
                          onClick={handleCancelEditing}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: 'rgb(235, 235, 235)',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(index)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: 'rgb(235, 235, 235)',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            color: 'black',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}
                        >
                          Save & Update
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Message Content with Image Support */}
                      <div
                        id={"message-content" + index}
                        ref={(el) => setMessageRef(index, el)}
                        style={{
                          fontSize: '1rem',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap'
                        }}>
                        {/* Display image if present */}
                        {message.imageUrl && (
                          <div style={{ marginBottom: message.content ? '0.75rem' : 0 }}>
                            <img
                              src={message.imageUrl}
                              alt="User uploaded"
                              style={{
                                maxWidth: '100%',
                                borderRadius: '0.5rem',
                                maxHeight: '300px'
                              }}
                            />
                          </div>
                        )}
                        {/* Display text content */}
                        {message.content}
                      </div>

                      {/* Edit button for user messages */}
                      {message.role === 'user' && !editingMessageIndex && (
                        <div
                          className="message-actions"
                          style={{
                            position: 'absolute',
                            left: '-40px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            display: 'flex',
                            opacity: 0,
                            transition: 'opacity 0.2s'
                          }}
                        >
                          <button
                            onClick={() => handleStartEditing(index, message.content)}
                            style={{
                              background: 'rgba(240, 240, 240, 0.8)',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.5rem',
                              borderRadius: '50%',
                              color: '#6b7280',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px'
                            }}
                            title="Edit message"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{
                padding: '0 1rem',
                maxWidth: '800px',
                margin: '0 auto',
                width: '100%'
              }}>
                <div style={{
                  padding: '1rem',
                  background: 'transparent',
                  borderRadius: '0.5rem',
                  color: '#0A0A0A',
                  display: 'inline-block'
                }}>
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area at Bottom (only shown when there are messages) */}
          {
            messages.length > 0 && (
              <div style={{
                borderTop: '1px solid rgba(0,0,0,0.1)',
                padding: '1.5rem',
                background: 'rgb(249, 248, 246)'
              }}>
                <MessageInput
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  handleSubmit={handleSubmit}
                  isLoading={isLoading}
                  textareaRef={textareaRef}
                  handleImageUpload={handleImageUpload}
                  imagePreview={imagePreview}
                  clearImagePreview={clearImagePreview}
                />
                <DisclaimerMessage />
              </div>
            )
          }
        </main>

        <div id="contacts-panel-outer" className="messaging-panel" style={{ display: isContactsPanelVisible ? 'block' : 'none', borderRight: 0, width: '400px', marginTop: '67px', backgroundColor: 'white' }}>
          <div style={{ display: "block", width: "100%" }}>
            <span className="messaging-header" id="messaging-header-right"><b>Choose Contact</b></span>
            <div id="contacts-panel-chooser" style={{ display: 'block', width: '100%' }}>
              <div id="contacts-panel">
                {/* <!-- Contacts will be dynamically inserted here --> */}
              </div>
            </div>
            <div id="contacts-panel-messages" className="messages-list"
              style={{ display: 'none', position: 'relative', height: 800, paddingBottom: 75 }}>
              <div>
                <button id="messages-back" className="back-button" style={{ marginTop: 0 }}>
                  <i className="fa-solid fa-angle-left"></i>
                </button>
                <div style={{ position: 'absolute', right: '40%', top: 13 }} className="center-under-img">
                  <img id="contact-img"
                    className="contact-avatar"></img>
                  <span className="comment-header" style={{ color: 'black', fontWeight: 600 }} id="contact-img-name">Name goes here</span>
                </div>
              </div>
              <div id="messages-list" style={{ overflow: 'scroll', overflowX: 'hidden', height: '100%' }}>
                {/* <!--Will be dynamically populated in messaging.js--> */}
              </div>
              {/* <!-- Chat input area --> */}
              <div className="add-comment-section" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                <div className="comment-input-container">
                  <div className="comment-input-wrapper">
                    <textarea id="new-message" placeholder="Write a comment..." className="comment-input"
                      rows="1"
                      style={{
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}></textarea>
                    <button id="add-message" className="comment-button primary" style={{ marginRight: 13 }}>
                      <i className="fas fa-arrow-up"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >
    </>
  );
}

/* Add CSS to make message actions visible on hover */
const styleTag = document.createElement('style');
styleTag.innerHTML = `
      .message-actions {
        opacity: 0;
  }
      .message-bubble:hover .message-actions {
        opacity: 1 !important;
  }

      /* Auth Modal Styles */
      .auth-modal-overlay {
        position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
  }

      .auth-modal {
        background-color: white;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      overflow: hidden;
  }

      .auth-modal-header {
        padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eee;
  }

      .auth-modal-header h2 {
        margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
  }

      .close-modal-btn {
        background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
  }

      .auth-modal-content {
        padding: 20px;
  }

      .auth-modal-content p {
        margin-bottom: 20px;
      color: #555;
      line-height: 1.5;
  }

      .auth-modal-buttons {
        display: flex;
      flex-direction: column;
      gap: 12px;
  }

      .auth-modal-signin {
        padding: 12px 20px;
      background-color: #10a37f;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      transition: background-color 0.2s;
  }

      .auth-modal-signin:hover {
        background-color: #0d8c6c;
  }

      .auth-modal-guest {
        padding: 12px 20px;
      background-color: transparent;
      color: #555;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
  }

      .auth-modal-guest:hover {
        background-color: #f5f5f5;
  }
      `;
document.head.appendChild(styleTag); 