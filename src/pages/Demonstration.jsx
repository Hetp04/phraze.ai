import { useState, useRef, useEffect } from 'react';
import { auth } from '../firebase-init';
import ChatSidebar from '../components/ChatSidebar';
// Import our new groqClient service
import { getFirebaseData, saveFirebaseData, isLoggedIn, showToast, getMainCompanyEmail } from '../funcs';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadHighlights, setMainCompanyEmail, saveHighlight } from '../utils/highlighting';
// import { initContactsPanel, setMessagingUserEmail, setMessagingUserName, setMessagingCurrentProject, setFirebaseFunctions } from '../utils/messaging';
import { useExtension } from "../context/ExtensionContext";
import Navbar from '../components/Navbar';
import html2canvas from 'html2canvas';


// Import Groq SDK
import Groq from 'groq-sdk';
import waveformSvg from '../../extension/img/waveform.svg';

// Groq API configuration
const GROQ_API_KEY = await getFirebaseData('groq_api_key');
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
// const GROQ_MODEL = "llama3-8b-8192"; // Easily changeable model variable
// const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"; // Easily changeable model variable

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
function MessageInput({ inputValue, setInputValue, handleSubmit, isLoading, textareaRef, handleImageUpload, imagePreview, clearImagePreview, isExtensionSidebarVisible, isSharedView, currentUser }) {
  const fileInputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechObj, setSpeechObj] = useState(null);
  const [isScreenshotShortcutsVisible, setIsScreenshotShortcutsVisible] = useState(false);

  useEffect(() => {
    document.addEventListener("click", function (event) {
      if (!event.target.closest('#showScreenshotShortcutsButton'))
        setIsScreenshotShortcutsVisible(false);
    })
  });

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  //0 = Capture Visible Part
  //1 = Capture Selected Area
  //2 = Capture Full Page
  function screenshotShortcut(index) {
    document.getElementById("sidebar-iframe").contentWindow.postMessage({ action: "screenshotShortcut", type: index }, "*");
  }

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

      {isSharedView && !currentUser && (
        <div style={{
          padding: '0.5rem',
          marginBottom: '0.5rem',
          fontSize: '0.875rem',
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          Please log in to reply to this shared chat.
        </div>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '0.75rem',
        backgroundColor: '#fff',
        paddingRight: '0.5rem'
      }}>
        {/* Image upload button */}
        <button
          type="button"
          onClick={triggerFileInput}
          style={{
            background: 'none',
            border: 'none',
            cursor: isSharedView && !currentUser ? 'not-allowed' : 'pointer',
            padding: '0.75rem 0.5rem',
            color: isSharedView && !currentUser ? '#d1d5db' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Upload image"
          disabled={isSharedView && !currentUser}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </button>

        {/* Microphone button (UI only) */}
        <button
          type="button"
          onClick={function () {
            function speechToText(target) {
              setIsRecording(true);
              window.SpeechRecognition = window.webkitSpeechRecognition;
              const recognition = new window.SpeechRecognition();
              setSpeechObj(recognition);
              recognition.interimResults = true;

              recognition.addEventListener("result", (e) => {
                const transcript = Array.from(e.results)
                  .map((result) => result[0])
                  .map((result) => result.transcript)
                  .join("");
                target.value = transcript;
              });
              recognition.addEventListener("end", () => {
                setInputValue(document.getElementById("groq_chat_textarea").value);
                setIsRecording(false);
              });
              recognition.addEventListener("error", () => {
                setInputValue(document.getElementById("groq_chat_textarea").value);
                setIsRecording(false);
              });
              recognition.start();
              console.log("Started");
            }
            if (isRecording) {
              speechObj.stop();
              setIsRecording(false);
            }
            else
              speechToText(document.getElementById("groq_chat_textarea"));
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: isSharedView && !currentUser ? 'not-allowed' : 'pointer',
            padding: '0.75rem 0.5rem',
            color: isSharedView && !currentUser ? '#d1d5db' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '0.25rem'
          }}
          title="Speak"
          disabled={isSharedView && !currentUser}
        >
          {isRecording ? (
            <img
              src={waveformSvg}
              alt="Recording..."
              className="waveform-animated"
              style={{ width: 24, height: 24 }}
            />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="8" y1="22" x2="16" y2="22" />
            </svg>
          )}
        </button>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />

        {/* Extension screenshot button*/}
        {isExtensionSidebarVisible &&
          <button
            id="showScreenshotShortcutsButton"
            type="button"
            onClick={function () {
              setIsScreenshotShortcutsVisible(!isScreenshotShortcutsVisible);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0rem 0.5rem',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Take screenshot"
          >
            <i
              className="fas fa-camera"
              style={{ fontSize: '18px' }}
            ></i>
          </button>
        }

        {isScreenshotShortcutsVisible &&
          <div
            style={{
              position: 'absolute',
              background: 'white',
              bottom: '50px',
              borderRadius: '10px',
              border: '1px solid gray',
              padding: '1rem'
            }}
          >
            <button
              onClick={
                function () {
                  screenshotShortcut(0);
                }
              }
              class="groqScreenshotButton nav-link">
              <i class="fas fa-desktop"></i>
              &nbsp;&nbsp;Capture Visible Part
            </button><br></br>
            <button
              onClick={
                function () {
                  screenshotShortcut(1);
                }
              }
              class="groqScreenshotButton nav-link">
              <i class="fas fa-crop-alt"></i>
              &nbsp;&nbsp;Capture Selected Area
            </button><br></br>
            <button
              onClick={
                function () {
                  screenshotShortcut(2);
                }
              }
              class="groqScreenshotButton nav-link">
              <i class="fas fa-window-maximize"></i>
              &nbsp;&nbsp;Capture Full Page
            </button>
          </div>
        }

        <textarea
          id="groq_chat_textarea"
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
          disabled={isLoading || (isSharedView && !currentUser)}
        />
        <button
          type="submit"
          style={{
            background: 'none',
            border: 'none',
            cursor: isSharedView && !currentUser ? 'not-allowed' : 'pointer',
            opacity: isSharedView && !currentUser ? 0.5 : 1,
            transition: 'opacity 0.2s',
            padding: '0.25rem'
          }}
          disabled={!inputValue.trim() && !imagePreview || isLoading || (isSharedView && !currentUser)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
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
    </form >
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
  const [sidebarWidth, setSidebarWidth] = useState(800);
  const [prevSidebarWidth, setPrevSidebarWidth] = useState(800);
  // const [chatHighlights, setChatHighlights] = useState([]); // State for highlights
  // const [annotationHistoryData, setAnnotationHistoryData] = useState(null); // State for parsed history
  const [originalSanitizedUrl, setOriginalSanitizedUrl] = useState(null); // State for original URL
  const [showAuthModal, setShowAuthModal] = useState(false); // State for authentication modal
  const [selectedModel, setSelectedModel] = useState("meta-llama/llama-4-scout-17b-16e-instruct"); // State for selected model
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false); // State for dropdown visibility
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const editTextareaRef = useRef(null);
  const messageRefs = useRef({}); // Ref to hold message bubble DOM nodes
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isInsideExtension, setIsInsideExtension } = useExtension();
  const [isLibraryVisible, setIsLibraryVisible] = useState(false);

  // Add state for contacts panel visibility
  const [isExtensionSidebarVisible, setIsExtensionSidebarVisible] = useState(false);

  // Auto-scroll management
  const chatMessagesContainerRef = useRef(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  const location = useLocation(); // Use useLocation hook
  const navigate = useNavigate(); // Use useNavigate hook

  // Available models
  const availableModels = [
    { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout", description: "Great for most questions" },
    { value: "llama3-8b-8192", label: "Llama 3 8B", description: "Good for everyday conversations" },
    { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B", description: "Best for complex tasks" }
  ];

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

    if (!user)
    {
      setMessages([]);
      setCurrentChat(null);
      setInputValue('');
      clearImagePreview();
      setEditingMessageIndex(null);
      setEditingMessageContent('');
      setIsSharedView(false); // Reset shared view state explicitly
      
      const url = new URL(window.location.href);

    url.search = ''; 

    window.history.pushState({}, '', url.toString()); // Update the URL without a page reload

    
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

  const scrollToBottom = (behavior = 'auto') => {
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      } catch (_) {
        // Fallback in case smooth scrolling is not supported
        messagesEndRef.current.scrollIntoView();
      }
    }
  };

  // Track user scroll position to decide whether to auto-scroll
  useEffect(() => {
    const container = chatMessagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      // Enable auto-scroll if near the bottom; disable when user scrolls up
      setIsAutoScrollEnabled(distanceFromBottom < 120);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    // Initialize state based on initial position
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to bottom when messages change if user hasn't scrolled up
  useEffect(() => {
    if (messages.length > 0 && isAutoScrollEnabled) {
      scrollToBottom('smooth');
    }
  }, [messages, isAutoScrollEnabled]);

  // Also follow loading state (e.g., streaming/loading bubble)
  useEffect(() => {
    if (isAutoScrollEnabled && (isLoading || !isLoading)) {
      // Trigger on any loading change to keep view pinned
      scrollToBottom('smooth');
    }
  }, [isLoading, isAutoScrollEnabled]);

  useEffect(() => {
    handleProjectChange(currentProject);
    localStorage.setItem("currentProject", currentProject);
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
      // setAnnotationHistoryData(null);
    };

    //Called from extension when showing groq chats in the messaging system in the extension popup window
    async function handleExtensionMessages(event) {
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
      else if (event.data.action == "getFirebaseData") {
        var data = await getFirebaseData(event.data.path);
        document.getElementById("sidebar-iframe").contentWindow.postMessage({ requestID: event.data.requestID, data: data }, "*");
      }
      else if (event.data.action == "saveFirebaseData") {
        await saveFirebaseData(event.data.path, event.data.data);
        document.getElementById("sidebar-iframe").contentWindow.postMessage({ requestID: event.data.requestID, data: "Saved" }, "*");
      }
      else if (event.data.action == "listenerFirebaseData") {

        const firebaseDb = await import('firebase/database');
        const { ref, onValue, off } = firebaseDb;
        const { database } = await import('../firebase-init'); // Get database instance
        let listenerRef = ref(database, event.data.path);

        // Define the callback for onValue
        const handleValueChange = (snapshot) => {

          document.getElementById("sidebar-iframe").contentWindow.postMessage(
            {
              action: "firebaseDataChanged",
              path: event.data.path,
              data: snapshot.val()
            },
            "*");
        };
        // Attach the listener
        onValue(listenerRef, handleValueChange);
      }
      else if (event.data.action == "removeFirebaseListener") {
        const firebaseDb = await import('firebase/database');
        const { ref, onValue, off } = firebaseDb;
        const { database } = await import('../firebase-init'); // Get database instance
        let path = event.data.path;
        const myRef = ref(database, path);
        off(myRef); // Removes all listeners for this ref
      }
      else if (event.data.action == "startCapture") {

        showToast("Capturing full page...", "info");
        setPrevSidebarWidth(sidebarWidth);
        setSidebarWidth(0);
        // setIsContactsPanelVisible(false);

        setTimeout(async function () {

          //For debugging errors with html2canvas breaking
          // document.querySelectorAll('*').forEach(el => {
          //   try {
          //     getComputedStyle(el).transform;
          //   } catch (e) {
          //     console.warn('Error computing style for element:', el, e);
          //   }
          // });

          // var ele = document.getElementById("mainChatInterface");
          var messagesDiv = document.getElementById("chatMessagesDiv");
          messagesDiv.style.overflowY = "unset";

          await loadHighlights(true);

          setTimeout(function () {
            let rect = messagesDiv.getBoundingClientRect();

            let eles = document.getElementsByClassName("PhrazeHighlight-data-preview");
            for (let ele of eles) {
              messagesDiv.appendChild(ele);
              ele.style.left = `${parseFloat(ele.style.left) - rect.left}px`;
              ele.style.top = `${(parseFloat(ele.style.top) - rect.top) + 60}px`;
              // if (ele.childNodes && ele.childNodes[0].textContent.trim() != "")
              //   ele.style.opacity = 1;
            }

            eles = document.getElementsByClassName("phraze-note-dropdown");
            for (let ele of eles) {
              ele.classList.remove("visible");
            }

            // document.querySelectorAll('.PhrazeHighlight-data-preview').forEach(el => {
            //   const rect = el.getBoundingClientRect();
            //   el.style.top = `${rect.top + window.scrollY}px`;
            //   el.style.left = `${rect.left + window.scrollX}px`;
            // });


            html2canvas(messagesDiv, {
              useCORS: true,
              ignoreElements: (el) => {
                return el.id === "groqChatInputDiv";
              },
              onclone: (clonedDoc) => {


                const clonedMarks = clonedDoc.querySelectorAll('mark.PhrazeHighlight');

                //Break up multi line marks because html2canvas does not render them properly
                clonedMarks.forEach(originalMark => {
                  if (originalMark.childNodes.length == 0)
                    return;
                  var textNode = originalMark.childNodes[0];
                  var textContent = textNode.textContent;
                  var newRanges = [];
                  var range = document.createRange();
                  var rangeStart = 0;
                  for (let i = 0; i < textContent.length; ++i) {
                    range.setStart(textNode, 0);
                    range.setEnd(textNode, (i + 1));
                    var lineIndex = (range.getClientRects().length - 1);
                    if (newRanges.length == lineIndex) {
                      newRanges.push([rangeStart, i]);
                      rangeStart = i;
                    }
                  }
                  newRanges.splice(0, 1);

                  if (rangeStart < textContent.length) {
                    newRanges.push([rangeStart, textContent.length]);
                  }

                  var parent = originalMark.parentNode;
                  // Insert new marks before removing the original
                  newRanges.forEach(function (range) {
                    var mark = document.createElement('mark');
                    mark.textContent = textContent.slice(range[0], range[1]);
                    parent.insertBefore(mark, originalMark);
                  });
                  parent.removeChild(originalMark);
                });
              }
            }).then(async canvas => {
              setSidebarWidth(prevSidebarWidth);

              let eles = document.getElementsByClassName("PhrazeHighlight-data-preview");
              for (let i = eles.length - 1; i >= 0; --i) {
                let ele = eles[i];
                ele.style.opacity = 0;
                document.body.appendChild(ele);
              }
              // eles = document.getElementsByClassName("phraze-note-dropdown");
              // for (let ele of eles) {
              //   ele.style.display = "flex";
              // }

              messagesDiv.style.overflowY = "auto";

              const blob = await new Promise(resolve => canvas.toBlob(resolve));
              const url = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              document.getElementById("sidebar-iframe").contentWindow.postMessage({ action: "downloadFullPageScreenshot", dataUrl: url }, "*");
              // document.body.appendChild(canvas);
            });

          }, 1000);
        }, 1000);

        // function findDeepestScrollable(element) {
        //   let deepest = element;
        //   let maxDepth = -1;

        //   function dfs(node, depth) {
        //     if (node.nodeType !== 1) return; // Only element nodes
        //     const style = window.getComputedStyle(node);
        //     const isScrollable = (
        //       (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay') &&
        //       node.scrollHeight > node.clientHeight + 2
        //     );
        //     if (isScrollable && depth > maxDepth) {
        //       deepest = node;
        //       maxDepth = depth;
        //     }
        //     for (let child of node.children) {
        //       dfs(child, depth + 1);
        //     }
        //   }

        //   dfs(document.body, 0);
        //   return deepest;
        // }

        // // Get page dimensions
        // function getPageInfo() {
        //   let deepestWindow = findDeepestScrollable(document.body);
        //   let totalHeight, viewportHeight;
        //   totalHeight = Math.max(
        //     deepestWindow.clientHeight,
        //     deepestWindow.scrollHeight,
        //     deepestWindow.offsetHeight
        //   );
        //   viewportHeight = window.innerHeight;

        //   return { totalHeight, viewportHeight };
        // }

        // function innerMostWindowScrollTo(y) {
        //   const deepestScrollable = findDeepestScrollable(document.body);
        //   if (deepestScrollable) {
        //     deepestScrollable.scrollTop = y;
        //   } else {
        //     window.scrollTo(0, y);
        //   }

        //   //Manually call mouse enter on each container to update the message bubble location
        //   var containers = document.getElementsByClassName("phraze-highlight-container");
        //   for (let container of containers) {
        //     const event = new MouseEvent("mouseenter", {
        //       bubbles: false, // must be false for mouseenter
        //       cancelable: true,
        //       view: window
        //     });
        //     container.dispatchEvent(event);
        //   }
        // }

        // // chrome.tabs.sendMessage(tab.id, { action: "showAllLabelsCodes" });
        // var eles = document.getElementsByClassName("PhrazeHighlight-data-preview");
        // for (let ele of eles) {
        //   if (ele.childNodes && ele.childNodes[0].textContent.trim() != "")
        //     ele.style.opacity = 1;
        // }

        // // let response = await chrome.tabs.sendMessage(tab.id, { action: "getPageInfo" });
        // let response = getPageInfo();
        // if (!response)
        //   return;
        // const { totalHeight, viewportHeight } = response;
        // const screenshots = [];
        // for (let y = 0; y < totalHeight; y += viewportHeight) {
        //   // await chrome.tabs.sendMessage(tab.id, { action: "scrollTo", y });
        //   innerMostWindowScrollTo(y);
        //   await new Promise(r => setTimeout(r, 750)); // wait for scroll
        //   const dataUrl = await new Promise(resolve => {
        //     chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, resolve);
        //   });
        //   screenshots.push({ y, dataUrl });
        // }

        // chrome.tabs.sendMessage(tab.id, { action: "stitchScreenshots", screenshots: screenshots }, (response) => { });
      }
      else if (event.data.action == "resizeSidebarToFull") {
        if (sidebarWidth != 0)
          setPrevSidebarWidth(sidebarWidth);
        setSidebarWidth(window.viewport.segments[0].width - 50);
      }
      else if (event.data.action == "resizeSidebarToPrevious") {
        setSidebarWidth(prevSidebarWidth);
      }
      else if (event.data.action == "resizeSidebarToZero") {
        setPrevSidebarWidth(sidebarWidth);
        setSidebarWidth(0);
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

  useEffect(() => {
    let eles = document.getElementsByClassName("phraze-highlight-toolbar");
    for (let ele of eles) {
      ele.style.opacity = "0";
    }

  }, [sidebarWidth, isExtensionSidebarVisible]);

  // Handle chat selection from sidebar
  const handleChatSelect = (selectedChat) => {
    if (isInsideExtension) {
      setIsSidebarCollapsed(true);
    }
    // Make sure we update the current chat with the latest data
    setCurrentChat(selectedChat);
    setIsLibraryVisible(false);
    if (selectedChat) {
      setIsSharedView(selectedChat.originalId != null)
      setSharedCompanyEmail(selectedChat.companyEmail)

      window.parent.postMessage({ action: "activeChat", id: selectedChat.id, currentProject: currentProject }, "*");
      if (selectedChat.originalId) {
        async function fetchOriginalMessages() {
          if (selectedChat.companyEmail) {
            let path = `Companies/${selectedChat.companyEmail}/projects/${currentProject}/groqChats/${selectedChat.originalId}/messages`;
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
    console.log('handleSubmit', currentChat);
    e.preventDefault();
    if ((!inputValue.trim() && !imagePreview) || isLoading) return;

    // Detect leading @mention that matches an EXACT username currently in the chat.
    // Partial names should not count.
    const trimmedStart = (inputValue || '').trimStart();
    let isMentionDirected = false;
    if (trimmedStart.startsWith('@')) {
      const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const usernameSet = new Set();
      if (auth.currentUser && auth.currentUser.displayName) {
        usernameSet.add(auth.currentUser.displayName);
      }
      for (const m of messages) {
        if (m.role === 'user' && m.userDisplayName) {
          usernameSet.add(m.userDisplayName);
        }
      }
      for (const name of usernameSet) {
        const re = new RegExp(`^@${escapeRegExp(name)}(?:\\s|$)`);
        if (re.test(trimmedStart)) {
          isMentionDirected = true;
          break;
        }
      }
    }



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
      type: messageType,
      userDisplayName: auth.currentUser.displayName

    };

    // If there's an image, add the imageUrl to the message
    if (imageUrl) {
      userMessage.imageUrl = imageUrl;
    }

    // Add user message to state
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    clearImagePreview();

    // If this is a leading @mention, do not call AI; just return
    if (isMentionDirected) {
      setIsLoading(false);
      setTimeout(() => { textareaRef.current?.focus(); }, 0);
      return;
    }

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
          content: "You are a helpful assistant called Phraze. "
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
        model: selectedModel,
        temperature: 1,
        max_completion_tokens: 1024,
        top_p: 1,
        stream: false,
        stop: null
      });

      const assistantMessage = {
        role: 'assistant',
        content: chatCompletion.choices[0].message.content,
        userDisplayName: 'phraze'
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
            console.log('currentUser', currentUser);
            
            if (currentUser && currentUser.email) {
              let email = currentUser.email.replace(".", ",");
              let companyEmailPath = await getFirebaseData(`emailToCompanyDirectory/${email}`);
              if (currentChat.isShared) {
                companyEmailPath = currentChat.companyEmail;
              }

              console.log('currentUser', companyEmailPath);
              if (companyEmailPath) {
                let chatId = currentChat.id;
                if (currentChat.isShared) {
                  chatId = currentChat.originalId;
                }
                console.log('currentChat', currentChat);
                console.log('sharedChat', chatId);
                // If we don't have a current chat or it doesn't have an ID, create a new one
                if (!currentChat || !chatId) {
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
                    messages: updatedMessages,
                  };

                  // Save the new chat to Firebase
                  await saveFirebaseData(`Companies/${companyEmailPath}/projects/${currentProject}/groqChats/${newChatId}`, newChat);

                  // Update local state with the new chat
                  setCurrentChat(newChat);

                  console.log("Created new chat:", newChat);
                } else {
                  // If we already have a chat, update it as before
                  await saveFirebaseData(`Companies/${companyEmailPath}/projects/${currentProject}/groqChats/${chatId}/messages`, updatedMessages);

                  console.log("Company email path", companyEmailPath);
                  // Update title if it's a new chat with default title
                  if (currentChat.title === 'New Chat') {
                    // Create a title from the first user message
                    const newTitle = userMessage.content.length > 30
                      ? `${userMessage.content.substring(0, 27)}...`
                      : userMessage.content || 'Image Chat';

                    await saveFirebaseData(`Companies/${companyEmailPath}/projects/${currentProject}/groqChats/${chatId}/title`, newTitle);

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
        model: selectedModel,
        temperature: 1,
        max_completion_tokens: 1024,
        top_p: 1,
        stream: false,
        stop: null
      });

      const assistantMessage = {
        role: 'assistant',
        content: chatCompletion.choices[0].message.content,
        userDisplayName: 'phraze'
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
          companyEmail: companyEmail,
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

  //Listen for selection changes to show highlight icon
  useEffect(() => {
    function removeAllHighlightButtons() {
      var buttons = document.querySelectorAll(".HighlightPopup");
      for (let button of buttons) {
        button.remove();
      }
    }

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        removeAllHighlightButtons();
        const button = document.createElement("button");
        button.className = "HighlightPopup";
        button.addEventListener("click", async (e) => {
          localStorage.setItem("globalHighlightID", Date.now());
          localStorage.setItem("currentUrl", window.location.href);
          localStorage.setItem("selectedText", window.getSelection().toString());
          document.getElementById("sidebar-iframe").contentWindow.postMessage({ action: "updateSelectedText", text: window.getSelection().toString() }, "*");
          await saveHighlight();
          removeAllHighlightButtons();
        });
        let buttonWidth = 70;
        button.style.width = buttonWidth + "px";
        button.style.position = "absolute";
        button.style.backgroundColor = "yellow";
        button.innerHTML = `<i class="fas fa-pen"></i>`;
        button.style.border = "0px";
        button.style.borderRadius = "20px";
        button.style.height = "30px";
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        button.style.left = `${(rect.x + rect.width / 2) - buttonWidth / 2}px`;
        button.style.top = `${(rect.y + window.scrollY - 30)}px`;
        document.body.appendChild(button);
      }
      else {
        // console.log('No selection');
        removeAllHighlightButtons();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    // Cleanup
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Effect 4: Listen for real-time highlight updates from Firebase
  useEffect(() => {
    let listenerRef1 = null;
    let listenerRef2 = null;

    let unsubscribe = () => { }; // Function to detach listener

    const setupListener = async () => {
      if (((isSharedView || overrideShowHighlights) && sharedCompanyEmail) || isLoggedIn) {
        try {
          // Dynamically import Firebase database functions
          const firebaseDb = await import('firebase/database');
          const { ref, onValue, off } = firebaseDb;
          const { database } = await import('../firebase-init'); // Get database instance
          let companyEmail = sharedCompanyEmail;
          if (!companyEmail)
            companyEmail = localStorage.getItem("companyEmail");

          //Does not go all the way down to /highlights so that we can also reload labels and codes for the highlights, which are in /annotationHistory
          const highlightsPath = `Companies/${companyEmail}/projects/default`;
          console.log("[Listener] Setting up listener for path:", highlightsPath);
          listenerRef1 = ref(database, highlightsPath);

          // Define the callback for onValue
          const handleValueChange1 = (snapshot) => {
            console.log("Website loading highlights");
            if (sharedCompanyEmail)
              setMainCompanyEmail(sharedCompanyEmail);
            setTimeout(function () {
              loadHighlights();
            }, 1000);
          };

          // Attach the listener
          onValue(listenerRef1, handleValueChange1);

          const groqPath = `Companies/${companyEmail}/projects/${currentProject}/groqChats`;
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
    async function updateEmail(){
      if(currentChat)
      {

      
    if (currentChat.isShared) {
      localStorage.setItem('companyEmail', sharedCompanyEmail);
      console.log('companyEmail', sharedCompanyEmail);
    }
    else
    {
      localStorage.setItem('companyEmail', await getMainCompanyEmail());
      console.log('companyEmail', localStorage.getItem('companyEmail'));

    }
  }
  }
    updateEmail();
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
      // if (!isInsideExtension && isContactsPanelVisible && auth && auth.currentUser && auth.currentUser.email) {
      //   setMessagingUserEmail(auth.currentUser.email)
      //   setMessagingUserName(auth.currentUser.displayName)
      //   setMessagingCurrentProject(currentProject);
      //   const firebaseDb = await import('firebase/database');
      //   const { database } = await import('../firebase-init'); // Get database instance
      //   const { ref, onValue, off } = firebaseDb;
      //   setFirebaseFunctions(ref, onValue, off, database);

      //   var currentTopic = "general";
      //   if (currentChat)
      //     currentTopic = `groqChats-${currentChat.id}`;
      //   initContactsPanel(currentTopic);
      // }
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
  }, [isExtensionSidebarVisible]);

  // Add a handler for project change
  const handleProjectChange = (newProject) => {
    setCurrentChat(null);
    setMessages([]);
    setIsExtensionSidebarVisible(false);
    setCurrentProject(newProject);
  };

  // Handle clicking outside the model dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isModelDropdownOpen && !event.target.closest('.model-dropdown-container')) {
        setIsModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModelDropdownOpen]);

  useEffect(() => {
    const resizer = document.getElementById('sidebar-resizer');
    //Overlay is needed because resizing event does not fire when mouse is over the iframe
    const overlay = document.getElementById('sidebar-overlay');

    let isResizing = false;

    resizer.addEventListener('mousedown', function (e) {
      isResizing = true;
      // Add event listeners to the document to capture mouse movements globally
      overlay.style.display = 'block';
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);
    });

    function resize(e) {
      if (!isResizing) return;

      const containerRect = document.body.getBoundingClientRect();
      setSidebarWidth(Math.min(Math.abs(e.clientX - containerRect.right), window.viewport.segments[0].width - 50));
    }

    function stopResizing() {
      isResizing = false;
      // Remove the event listeners
      overlay.style.display = 'none';
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
    }
  })

  useEffect(() => {
    async function populateLibrary() {
      if (isLibraryVisible) {
        var companyEmail = await getMainCompanyEmail();
        var project = currentProject;
        var images = await getFirebaseData(`Companies/${companyEmail}/projects/${project}/categoriesImages`);
        var categories = Object.keys(images);
        var div = document.getElementById("library-div");
        for (let category of categories) {
          var inlineDiv = document.createElement("div");
          // inlineDiv.style.display = "inline-block";
          // inlineDiv.style.border = "1px solid lightgray";
          // inlineDiv.style.borderRadius = "10px";
          inlineDiv.style.margin = "5px";
          var header = document.createElement("h2");
          header.style.fontWeight = 500;
          header.style.margin = "20px";
          header.textContent = category;
          var break_ = document.createElement("br");
          // inlineDiv.append(header);
          inlineDiv.append(break_);

          var imageValues = Object.values(images[category]["images"]);
          for (let image of imageValues) {
            if (!image.data)
              continue;
            var imgDiv = document.createElement("div");
            imgDiv.style.margin = "5px";
            imgDiv.style.cursor = "pointer";
            imgDiv.style.display = "inline-block";
            var imgOverlay = document.createElement("div");
            imgOverlay.className = "img-overlay";
            imgOverlay.style.background = "linear-gradient(0deg, #00000066, transparent)";
            imgOverlay.style.position = "absolute";
            imgOverlay.style.width = "250px";
            imgOverlay.style.height = "250px";
            imgOverlay.textContent = category;
            imgOverlay.style.paddingTop = "200px";
            imgOverlay.style.paddingLeft = "10px";
            imgOverlay.style.color = "white";
            var img = document.createElement("img");
            img.style.width = "250px";
            img.style.height = "250px";
            img.style.objectFit = "cover";
            img.style.objectPosition = "center";
            // img.style.border = "1px solid lightgray";
            // img.style.borderRadius = "10px";
            img.src = image.data;

            function expandImage() {
              var overlay = document.getElementById("img-fullscreen");
              overlay.style.display = "";
              overlay.src = image.data;
            }

            imgOverlay.onclick = expandImage;
            imgDiv.append(imgOverlay);
            imgDiv.append(img);
            inlineDiv.append(imgDiv);
          }
          div.append(inlineDiv);
        }
      }
    }

    populateLibrary();
  }, [isLibraryVisible]);

  // Helper function to generate user initials
  function getUserInitials(userDisplayName) {
    if (!userDisplayName) return 'U';
    
    const names = userDisplayName.trim().split(' ');
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }

  return (
    <>
      <div style={{ display: 'flex', height: '100vh' }}>
        <ChatSidebar
          onChatSelect={handleChatSelect}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          currentProject={currentProject}
          onProjectChange={onProjectChange}
          isLibraryVisible={isLibraryVisible}
          setIsLibraryVisible={setIsLibraryVisible}
          setIsExtensionSidebarVisible={setIsExtensionSidebarVisible}
        />
        <main
          id="mainChatInterface"
          className="chat-interface" style={{
            flex: 1,
            display: isLibraryVisible ? 'none' : 'flex',
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
                     right: '4rem',
                     background: 'none',
                     border: 'none',
                     cursor: 'pointer',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     padding: '0.5rem',
                     borderRadius: '4px',
                     color: '#374151',
                     transition: 'all 0.2s'
                   }}
                   title="Share this chat"
                 >
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <circle cx="18" cy="5" r="3"></circle>
                     <circle cx="6" cy="12" r="3"></circle>
                     <circle cx="18" cy="19" r="3"></circle>
                     <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                     <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                   </svg>
                 </button>
               )}

               {/* Model selection dropdown - only visible when chat has messages */}
               {messages.length > 0 && !isInsideExtension && (
                 <div style={{
                   position: 'absolute',
                   left: '1.5rem',
                   zIndex: 1000
                 }} className="model-dropdown-container">
                   <button
                     onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                     style={{
                       background: 'white',
                       border: '1px solid rgba(0,0,0,0.08)',
                       borderRadius: '12px',
                       padding: '0.625rem 1rem',
                       fontSize: '0.875rem',
                       color: '#1f2937',
                       cursor: 'pointer',
                       minWidth: '160px',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'space-between',
                       gap: '0.75rem',
                       transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                       boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                       outline: 'none',
                       fontWeight: '500'
                     }}
                     onMouseEnter={(e) => {
                       e.target.style.borderColor = 'rgba(0,0,0,0.15)';
                       e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                       e.target.style.transform = 'translateY(-1px)';
                     }}
                     onMouseLeave={(e) => {
                       e.target.style.borderColor = 'rgba(0,0,0,0.08)';
                       e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                       e.target.style.transform = 'translateY(0)';
                     }}
                     title="Select AI model"
                   >
                     <span style={{ fontWeight: '500' }}>
                       {availableModels.find(m => m.value === selectedModel)?.label}
                     </span>
                     <svg 
                       width="16" 
                       height="16" 
                       viewBox="0 0 24 24" 
                       fill="none" 
                       stroke="currentColor" 
                       strokeWidth="2"
                       style={{
                         transform: isModelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                         transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                         opacity: '0.6'
                       }}
                     >
                       <polyline points="6,9 12,15 18,9"></polyline>
                     </svg>
                   </button>
                   
                   {isModelDropdownOpen && (
                     <div style={{
                       position: 'absolute',
                       top: '100%',
                       left: '0',
                       right: '0',
                       marginTop: '0.5rem',
                       background: 'white',
                       border: '1px solid rgba(0,0,0,0.08)',
                       borderRadius: '12px',
                       boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                       overflow: 'hidden',
                       zIndex: 1001,
                       backdropFilter: 'blur(8px)',
                       WebkitBackdropFilter: 'blur(8px)',
                       width: '320px'
                     }}>
                       {availableModels.map((model, index) => (
                         <button
                           key={model.value}
                           onClick={() => {
                             setSelectedModel(model.value);
                             setIsModelDropdownOpen(false);
                           }}
                           style={{
                             width: '100%',
                             padding: '0.875rem 1.25rem',
                             background: selectedModel === model.value ? 'rgb(245, 243, 240)' : 'transparent',
                             border: 'none',
                             textAlign: 'left',
                             cursor: 'pointer',
                             transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                             borderBottom: index < availableModels.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                             display: 'flex',
                             flexDirection: 'column',
                             gap: '0.375rem'
                           }}
                           onMouseEnter={(e) => {
                             if (selectedModel !== model.value) {
                               e.target.style.background = 'rgb(249, 248, 246)';
                             }
                           }}
                           onMouseLeave={(e) => {
                             if (selectedModel !== model.value) {
                               e.target.style.background = 'transparent';
                             }
                           }}
                         >
                           <div style={{
                             display: 'flex',
                             alignItems: 'center',
                             justifyContent: 'space-between',
                             width: '100%'
                           }}>
                             <span style={{
                               fontWeight: selectedModel === model.value ? '600' : '500',
                               color: selectedModel === model.value ? '#0f172a' : '#334155',
                               fontSize: '0.875rem',
                               letterSpacing: '-0.01em'
                             }}>
                               {model.label}
                             </span>
                             {selectedModel === model.value && (
                               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#3b82f6' }}>
                                 <polyline points="20,6 9,17 4,12"></polyline>
                               </svg>
                             )}
                           </div>
                           <span style={{
                             fontSize: '0.75rem',
                             color: '#64748b',
                             lineHeight: '1.3',
                             fontWeight: '400'
                           }}>
                             {model.description}
                           </span>
                         </button>
                       ))}
                     </div>
                   )}
                 </div>
               )}

               {messages.length > 0 && !isInsideExtension &&
                 <button
                   style={{
                     backgroundColor: '#00000000',
                     border: 'none',
                     cursor: 'pointer',
                     display: 'flex',
                     position: 'absolute',
                     right: '1.5rem'
                   }}
                   onClick={() => {
                     if (isLoggedIn) {
                       setIsExtensionSidebarVisible(v => !v)
                       document.getElementById("sidebar-iframe").src = "extension/popup.html";
                     }
                     else
                       showToast("Must be logged in to use extension features", "error");
                   }
                   }
                 >
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                     <line x1="8" y1="9" x2="16" y2="9"></line>
                     <line x1="8" y1="13" x2="14" y2="13"></line>
                   </svg>
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
                    isExtensionSidebarVisible={isExtensionSidebarVisible}
                    isSharedView={isSharedView}
                    currentUser={auth.currentUser}
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
            id="chatMessagesDiv"
            key={currentChat ? currentChat.id : 'new-chat'}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '3rem 0 2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              background: 'rgb(249, 248, 246)'
            }}
            ref={chatMessagesContainerRef}
          >
            {messages.map((message, index) => (
                              <div
                  key={index}
                  style={{
                    padding: message.role === 'user' ? '0 1rem' : '0',
                    maxWidth: '800px',
                    margin: '0 auto',
                    width: '100%',
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    position: 'relative'
                  }}
                >
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  maxWidth: '85%',
                  paddingLeft: message.role === 'user' ? '0' : '0'
                }}>
                  {/* Username display with profile icon */}
                  <div style={{ 
                    fontSize: '0.8rem', 
                    marginBottom: '8px', 
                    fontWeight: '500',
                    color: '#555',
                    textAlign: message.role === 'user' ? 'right' : 'left',
                    paddingRight: message.role === 'user' ? '0' : '0rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    {message.role === 'user' && (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6rem',
                        fontWeight: '600',
                        color: '#334155',
                        border: '1px solid #cbd5e1'
                      }}>
                        {getUserInitials(message.userDisplayName)}
                      </div>
                    )}
                    <span>{message.role === 'user' ? (message.userDisplayName || 'User') : 'phraze'}</span>
                    {message.role === 'assistant' && (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6rem',
                        fontWeight: '600',
                        color: 'white',
                        border: '1px solid #475569'
                      }}>
                        P
                      </div>
                    )}
                  </div>
                                     <div
                     className="message-bubble"
                     style={{
                       padding: message.role === 'user' ? '1rem': '0rem',
                       background: message.role === 'user' ? '#ffffff' : 'transparent',
                       borderRadius: message.role === 'user' ? '2rem' : '0.5rem',
                       borderBottomRightRadius: message.role === 'user' ? '5px' : '0.5rem',
                       color: '#0A0A0A',
                       display: 'inline-block',
                       width: '100%',
                       position: 'relative',
                       marginTop: '4px'
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

                        disabled={!currentUser}
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
                          whiteSpace: message.role === 'assistant' ? 'normal' : 'pre-wrap'
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
              <div
                id="groqChatInputDiv"
                style={{
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
                  isExtensionSidebarVisible={isExtensionSidebarVisible}
                  isSharedView={isSharedView}
                  currentUser={auth.currentUser}
                />
                <DisclaimerMessage />
              </div>
            )
          }
        </main>

        {
          isLibraryVisible && (
            <div
              id="library-div"
              style={{
                flex: "1 1 0%",
                background: "rgb(249, 248, 246)",
                position: "relative",
                overflowX: "hidden",
                overflowY: "auto",
                marginTop: "70px"
              }}></div>
          )
        }

        <img id="img-fullscreen"
          onClick={
            function () {
              document.getElementById("img-fullscreen").style.display = "none";
            }
          }
          style={{ display: "none", background: "#000000aa", objectFit: "contain", position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh", zIndex: 9999, cursor: "pointer" }}>
        </img>

        <div id="sidebar-overlay"
          style={{ display: "none", position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh", zIndex: 9999, cursor: "ew-resize" }}>
        </div>
        {
          !isInsideExtension && (
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <div id="sidebar-resizer" style={{ 
  display: isExtensionSidebarVisible ? 'flex' : 'none', 
  width: "4px", 
  height: 'calc(100% - 67px)', 
  marginTop: '67px', 
  cursor: 'ew-resize', 
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)'
}} onMouseEnter={(e) => {
  if (!e.target.classList.contains('dragging')) {
    e.target.style.width = '8px';
    e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    e.target.style.backdropFilter = 'blur(12px)';
  }
}} onMouseLeave={(e) => {
  if (!e.target.classList.contains('dragging')) {
    e.target.style.width = '4px';
    e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
    e.target.style.backdropFilter = 'blur(8px)';
  }
}} onMouseDown={(e) => {
  e.target.classList.add('dragging');
  e.target.style.width = '8px';
  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.15)';
  e.target.style.backdropFilter = 'blur(16px)';
}} onMouseUp={(e) => {
  e.target.classList.remove('dragging');
  e.target.style.width = '8px';
  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
  e.target.style.backdropFilter = 'blur(12px)';
}}>
  <div style={{
    width: '2px',
    height: '60px',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '1px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative'
  }} onMouseEnter={(e) => {
    if (!e.target.parentElement.classList.contains('dragging')) {
      e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      e.target.style.transform = 'scaleY(1.2)';
      e.target.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
    }
  }} onMouseLeave={(e) => {
    if (!e.target.parentElement.classList.contains('dragging')) {
      e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
      e.target.style.transform = 'scaleY(1)';
      e.target.style.boxShadow = 'none';
    }
  }}>
  </div>
</div>
              <iframe id="sidebar-iframe" allow="display-capture" style={{ display: isExtensionSidebarVisible ? 'block' : 'none', borderRight: 0, width: sidebarWidth + 'px', height: 'calc(100% - 67px)', marginTop: '67px', backgroundColor: 'white' }}>
              </iframe>
            </div>
          )
        }

        {false && (
          <div id="contacts-panel-outer" className="messaging-panel" style={{ display: isExtensionSidebarVisible ? 'block' : 'none', borderRight: 0, width: '400px', marginTop: '67px', backgroundColor: 'white' }}>
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
        )}
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

/* Add CSS for waveform animation */
const styleTag2 = document.createElement('style');
styleTag2.innerHTML += `\n.waveform-animated {\n  animation: waveformScale 1s infinite linear;\n}\n@keyframes waveformScale {\n  0% { transform: scale(1); }\n  50% { transform: scale(1.25); }\n  100% { transform: scale(1); }\n}`;
document.head.appendChild(styleTag2); 