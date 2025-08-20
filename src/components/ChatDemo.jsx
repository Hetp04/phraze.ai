import React, { useState, useRef, useEffect } from 'react';
import greyBg from '../images/grey.jpg';

// Add CSS keyframes for FAQ animations
const faqAnimationStyles = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-10px);
    }
  }
`;

export default function ChatDemo() {
  const [isHovered, setIsHovered] = useState(false);
  const messagesRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);

  // Add CSS styles for FAQ animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = faqAnimationStyles;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Hover detection using mouse events on the container
  useEffect(() => {
    const messagesElement = messagesRef.current;
    if (!messagesElement) return;

    let hoverTimeout;

    const handleMouseEnter = () => {
      clearTimeout(hoverTimeout);
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      // Small delay to prevent flickering when moving between highlights
      hoverTimeout = setTimeout(() => {
        setIsHovered(false);
      }, 100);
    };

    // Add event listeners to the container
    messagesElement.addEventListener('mouseenter', handleMouseEnter);
    messagesElement.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup function
    return () => {
      clearTimeout(hoverTimeout);
      messagesElement.removeEventListener('mouseenter', handleMouseEnter);
      messagesElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []); // Empty dependency array means this runs once and persists

  useEffect(() => {
    const startAutoScroll = () => {
      if (scrollIntervalRef.current) return;
      
      scrollIntervalRef.current = setInterval(() => {
        if (messagesRef.current && !isHovered) {
          messagesRef.current.scrollTop += 1; // Slightly faster scroll speed
          
          // Reset to top when reaching bottom for infinite scroll
          const scrollPosition = messagesRef.current.scrollTop;
          const maxScroll = messagesRef.current.scrollHeight - messagesRef.current.clientHeight;
          
          if (scrollPosition >= maxScroll) {
            messagesRef.current.scrollTop = 0;
          }
        }
      }, 50); // Update every 50ms for smooth scrolling
    };

    const stopAutoScroll = () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };

    // Start auto-scroll after a short delay
    const timer = setTimeout(() => {
      startAutoScroll();
    }, 1000);

    return () => {
      clearTimeout(timer);
      stopAutoScroll();
    };
  }, [isHovered]);

  // Intersection Observer to control video playback
  useEffect(() => {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVideoVisible(true);
            if (videoRef.current) {
              videoRef.current.play();
            }
          } else {
            setIsVideoVisible(false);
            if (videoRef.current) {
              videoRef.current.pause();
            }
          }
        });
      },
      {
        threshold: 0.5, // Video plays when 50% visible
        rootMargin: '-10% 0px -10% 0px' // Adjust trigger area
      }
    );

    if (videoRef.current) {
      videoObserver.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        videoObserver.unobserve(videoRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <section className="chat-demo demo-section" style={{ 
      marginTop: '-25px',
      background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 88%, #b8c4d0 100%)'
    }}>
      <div className="container">
        <div className="chat-demo-header" style={{
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.7rem',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '1.5rem',
            marginTop: 0,
            fontFamily: '"Inter", "Inter Fallback", sans-serif'
          }}>See Phraze in Action</h2>
          <p style={{
            fontSize: '18px',
            color: '#666',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6',
            marginBottom: '1rem',
            fontFamily: '"Inter", "Inter Fallback", sans-serif'
          }}>Experience how Phraze transforms conversations with AI through intelligent highlighting and annotation</p>
        </div>
        
        <div className="chat-demo-window">
          <div className="chat-demo-header-bar">
            <div className="window-controls">
              <div className="control-dot red"></div>
              <div className="control-dot yellow"></div>
              <div className="control-dot green"></div>
            </div>
            <div className="chat-demo-title" style={{ fontFamily: '"Inter", "Inter Fallback", sans-serif' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              Team Discussion
            </div>
          </div>
          
          <div 
            ref={messagesRef}
            className="chat-demo-messages" 
            style={{ 
              paddingBottom: '0', 
              marginBottom: '0',
              maxHeight: '400px',
              overflowY: 'auto',
              scrollBehavior: 'auto'
            }}
          >
            {/* Alex starts the conversation with @mention */}
            <div className="chat-demo-message user-message">
              <div className="message-avatar">
                <div className="avatar-circle user-avatar">
                  <span className="avatar-initials">AK</span>
                </div>
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-name" style={{ fontWeight: '700', fontFamily: '"Inter", "Inter Fallback", sans-serif' }}>Alex Kim</span>
                  <span className="message-time">2:21 PM</span>
                </div>
                <div className="message-text">
                  <strong>@Maria</strong> can you share the <span 
                    className="highlight" 
                    data-label="Data" 
                    data-code="Performance Metrics from Previous Week" 
                    data-user="Alex Kim"
                  >server metrics from last week</span>? We need to compare with our normal performance levels.
                </div>
              </div>
            </div>

            {/* Sarah asks a direct question (no @ mention) */}
            <div className="chat-demo-message user-message">
              <div className="message-avatar">
                <div className="avatar-circle user-avatar">
                  <span className="avatar-initials">SC</span>
                </div>
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-name" style={{ fontWeight: '700', fontFamily: '"Inter", "Inter Fallback", sans-serif' }}>Sarah Chen</span>
                  <span className="message-time">2:23 PM</span>
                </div>
                <div className="message-text">
                  What are the best ways to <span 
                    className="highlight" 
                    data-label="Performance" 
                    data-code="Website Optimization Metrics" 
                    data-user="Sarah Chen"
                  >measure improvements</span> when we fix these issues?
                </div>
              </div>
            </div>

            {/* AI responds to Sarah's direct question (no @ mention) */}
            <div className="chat-demo-message ai-message">
              <div className="message-content">
                <div className="message-header">
                  <span className="message-name" style={{ fontWeight: '700', fontFamily: '"Inter", "Inter Fallback", sans-serif' }}>Phraze</span>
                  <span className="message-time">2:24 PM</span>
                </div>
                <div className="message-text">
                  For measuring improvements, I recommend: 1. <span 
                    className="highlight" 
                    data-label="Tools" 
                    data-code="Performance Analysis Platform" 
                    data-user="Tom Wilson"
                  >Google PageSpeed Insights</span> for performance scores 2. Real User Monitoring to track actual user experience 3. Before and after screenshots to show visual improvements to stakeholders.
                </div>
              </div>
            </div>

            {/* Maria responds to Alex's earlier request */}
            <div className="chat-demo-message user-message">
              <div className="message-avatar">
                <div className="avatar-circle user-avatar">
                  <span className="avatar-initials">MR</span>
                </div>
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-name" style={{ fontWeight: '700', fontFamily: '"Inter", "Inter Fallback", sans-serif' }}>Maria Rodriguez</span>
                  <span className="message-time">2:24 PM</span>
                </div>
                <div className="message-text">
                  <strong>@Alex</strong> Sure! I'll get those metrics compiled and share them in the next hour. Also adding the <span 
                    className="highlight" 
                    data-label="Analysis" 
                    data-code="Historical Performance Trend Comparison" 
                    data-user="Maria Rodriguez"
                  >baseline comparisons from previous months</span>.
                </div>
              </div>
            </div>

            {/* Tom adds to the conversation */}
            <div className="chat-demo-message user-message">
              <div className="message-avatar">
                <div className="avatar-circle user-avatar">
                  <span className="avatar-initials">TW</span>
                </div>
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-name" style={{ fontWeight: '700', fontFamily: '"Inter", "Inter Fallback", sans-serif' }}>Tom Wilson</span>
                  <span className="message-time">2:28 PM</span>
                </div>
                <div className="message-text">
                  <strong>@Sarah</strong> Great point! We should also track <span 
                    className="highlight" 
                    data-label="Metrics" 
                    data-code="Web Performance Standards" 
                    data-user="Tom Wilson"
                  >Core Web Vitals</span> - especially Largest Contentful Paint and First Input Delay.
                </div>
              </div>
            </div>

            {/* Alex asks another question directly */}
            <div className="chat-demo-message user-message">
              <div className="message-avatar">
                <div className="avatar-circle user-avatar">
                  <span className="avatar-initials">AK</span>
                </div>
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-name" style={{ fontWeight: '700', fontFamily: '"Inter", "Inter Fallback", sans-serif' }}>Alex Kim</span>
                  <span className="message-time">2:30 PM</span>
                </div>
                <div className="message-text">
                  What's the best way to handle <span 
                    className="highlight" 
                    data-label="Optimization" 
                    data-code="Image Compression Techniques" 
                    data-user="Alex Kim"
                  >image optimization</span> for better loading times?
                </div>
              </div>
            </div>

            {/* AI responds to Alex's direct question */}
            <div className="chat-demo-message ai-message">
              <div className="message-content">
                <div className="message-header">
                  <span className="message-name" style={{ fontWeight: '700', fontFamily: '"Inter", "Inter Fallback", sans-serif' }}>Phraze</span>
                  <span className="message-time">2:31 PM</span>
                </div>
                <div className="message-text">
                  For image optimization, consider: 1. <span 
                    className="highlight" 
                    data-label="Formats" 
                    data-code="Modern Image Standards" 
                    data-user="Maria Rodriguez"
                  >WebP and AVIF formats</span> for better compression 2. Lazy loading for images below the fold 3. Responsive images with different sizes for different devices.
                </div>
              </div>
            </div>

            {/* Maria shares her experience */}
            <div className="chat-demo-message user-message">
              <div className="message-avatar">
                <div className="avatar-circle user-avatar">
                  <span className="avatar-initials">MR</span>
                </div>
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-name" style={{ fontWeight: '700', fontFamily: '"Inter", "Inter Fallback", sans-serif' }}>Maria Rodriguez</span>
                  <span className="message-time">2:33 PM</span>
                </div>
                <div className="message-text">
                  <strong>@Alex</strong> We've had great success with <span 
                    className="highlight" 
                    data-label="Tools" 
                    data-code="CDN Image Processing" 
                    data-user="Maria Rodriguez"
                  >Cloudflare Image Optimization</span>. It automatically converts images to the best format and compresses them.
                </div>
              </div>
            </div>
          </div>
          
          <div className="chat-demo-input" style={{ 
            paddingTop: '0.15rem',
            padding: '0.15rem 1.5rem 1.5rem 1.5rem',
            marginTop: '0',
            background: 'transparent'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              border: '1px solid rgba(0,0,0,0.15)',
              borderRadius: '0.75rem',
              backgroundColor: '#fff',
              padding: '0',
              width: '100%',
              maxWidth: '850px',
              margin: '0 auto'
            }}>
              {/* Image upload button */}
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.9rem 1.25rem',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Upload image"
                disabled
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </button>

              {/* Microphone button */}
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.9rem 0.5rem',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '0.5rem'
                }}
                title="Speak"
                disabled
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="8" y1="22" x2="16" y2="22" />
                </svg>
              </button>

              {/* Text input */}
              <textarea
                placeholder="Message Phraze..."
                style={{
                  width: '100%',
                  padding: '0.9rem 0.5rem',
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
                  msOverflowStyle: 'none'
                }}
                rows={1}
                disabled
              />

              {/* Send button */}
              <button
                type="submit"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'not-allowed',
                  opacity: 0.5,
                  transition: 'opacity 0.2s',
                  padding: '0.9rem 1.25rem'
                }}
                disabled
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
            

          </div>
        </div>
        
        {/* Video demonstration underneath the chat demo */}
        <div style={{
          marginTop: '10rem',
          marginLeft: '0',
          marginRight: '0',
          marginBottom: '0',
          textAlign: 'center'
        }}>
          <div className="video-demo-header" style={{
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.7rem',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '1.5rem',
              marginTop: 0,
              fontFamily: '"Inter", "Inter Fallback", sans-serif'
            }}>Product Demo</h2>
            <p style={{
              fontSize: '18px',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6',
              marginBottom: '1rem',
              fontFamily: '"Inter", "Inter Fallback", sans-serif'
            }}>Watch our demo to see how Phraze transforms AI conversations with intelligent highlighting and annotation</p>
          </div>
          
          {/* Video with grey background frame */}
          <div style={{
            backgroundImage: `url(${greyBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            padding: '3rem',
            borderRadius: '16px',
            display: 'inline-block',
            maxWidth: '83%'
          }}>
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}
            >
              <source src="/src/images/video.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
        
        {/* Two Feature Sections */}
        <div style={{
          marginTop: '4rem',
          maxWidth: '83%',
          margin: '4rem auto 0 auto'
        }}>
          <div style={{
            display: 'flex',
            gap: '3rem',
            justifyContent: 'space-between'
          }}>
            {/* Left Section */}
            <div style={{ flex: '1' }}>
              <h2 style={{
                fontSize: '1.7rem',
                fontWeight: '700',
                color: '#1a1a1a',
                marginBottom: '1rem',
                marginTop: 0,
                fontFamily: '"Inter", "Inter Fallback", sans-serif'
              }}>Annotate your chats</h2>
              <p style={{
                fontSize: '18px',
                color: '#6b7280',
                lineHeight: '1.6',
                fontFamily: '"Inter", "Inter Fallback", sans-serif',
                marginBottom: '2rem'
              }}>Highlight, code, and take notes directly in conversations so insights are always captured, organized, and never lost.</p>
              
              <div style={{
                height: '300px',
                background: 'radial-gradient(circle at 50% 50%, #c3d9ff, #ccdfff, #d4e5ff, #ddeaff, #e5efff, #eef5ff, #f6f9ff, #ffffff)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80%',
                  height: '242px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px 16px 0 0',
                  boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  padding: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
                      <path fill="currentColor" fill-rule="evenodd" d="m14.773 3.485l-.78-.184l-2.108 2.096l-1.194-1.216l2.056-2.157l-.18-.792a4.42 4.42 0 0 0-1.347-.228a3.64 3.64 0 0 0-1.457.28a3.824 3.824 0 0 0-1.186.84a3.736 3.736 0 0 0-.875 1.265a3.938 3.938 0 0 0 0 2.966a335.341 335.341 0 0 0-6.173 6.234c-.21.275-.31.618-.284.963a1.403 1.403 0 0 0 .464.967c.124.135.272.247.437.328c.17.075.353.118.538.127c.316-.006.619-.126.854-.337c1.548-1.457 4.514-4.45 6.199-6.204c.457.194.948.294 1.444.293a3.736 3.736 0 0 0 2.677-1.133a3.885 3.885 0 0 0 1.111-2.73a4.211 4.211 0 0 0-.196-1.378zM2.933 13.928a.31.31 0 0 1-.135.07a.437.437 0 0 1-.149 0a.346.346 0 0 1-.144-.057a.336.336 0 0 1-.114-.11c-.14-.143-.271-.415-.14-.568c1.37-1.457 4.191-4.305 5.955-6.046c.1.132.21.258.328.376c.118.123.245.237.38.341c-1.706 1.75-4.488 4.564-5.98 5.994zm11.118-9.065c.002.765-.296 1.5-.832 2.048a2.861 2.861 0 0 1-4.007 0a2.992 2.992 0 0 1-.635-3.137A2.748 2.748 0 0 1 10.14 2.18a2.76 2.76 0 0 1 1.072-.214h.254L9.649 3.839v.696l1.895 1.886h.66l1.847-1.816v.258zM3.24 6.688h1.531l.705.717l.678-.674l-.665-.678V6.01l.057-1.649l-.22-.437l-2.86-1.882l-.591.066l-.831.849l-.066.599l1.838 2.918l.424.215zm-.945-3.632L4.609 4.58L4.57 5.703H3.494L2.002 3.341l.293-.285zm7.105 6.96l.674-.673l3.106 3.185a1.479 1.479 0 0 1 0 2.039a1.404 1.404 0 0 1-1.549.315a1.31 1.31 0 0 1-.437-.315l-3.142-3.203l.679-.678l3.132 3.194a.402.402 0 0 0 .153.105a.477.477 0 0 0 .359 0a.403.403 0 0 0 .153-.105a.436.436 0 0 0 .1-.153a.525.525 0 0 0 .036-.184a.547.547 0 0 0-.035-.184a.436.436 0 0 0-.1-.153L9.4 10.016z" clip-rule="evenodd"/>
                    </svg>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#374151'
                    }}>Tools</span>
                  </div>
                  
                  {/* Four Icons */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '1rem'
                  }}>
                    {/* Icon 1 - Tag */}
                    <div style={{
                      width: '90px',
                      height: '90px',
                      background: 'linear-gradient(145deg, #ffffff, #e6e6e6)',
                      borderRadius: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: 'inset 1px 1px 3px rgba(255, 255, 255, 0.7), inset -1px -1px 3px rgba(0, 0, 0, 0.08), 3px 3px 6px rgba(0, 0, 0, 0.08)'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24">
                        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
                          <path d="m17.524 17.524l-2.722 2.723a2.567 2.567 0 0 1-3.634 0L4.13 13.209A3.852 3.852 0 0 1 3 10.487V5.568A2.568 2.568 0 0 1 5.568 3h4.919c1.021 0 2 .407 2.722 1.13l7.038 7.038a2.567 2.567 0 0 1 0 3.634z"/>
                          <path d="M9.126 11.694a2.568 2.568 0 1 0 0-5.137a2.568 2.568 0 0 0 0 5.137"/>
                        </g>
                      </svg>
                    </div>
                    
                    {/* Icon 2 - Sparkles */}
                    <div style={{
                      width: '90px',
                      height: '90px',
                      background: 'linear-gradient(145deg, #ffffff, #e6e6e6)',
                      borderRadius: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: 'inset 1px 1px 3px rgba(255, 255, 255, 0.7), inset -1px -1px 3px rgba(0, 0, 0, 0.08), 3px 3px 6px rgba(0, 0, 0, 0.08)'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24">
                        <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5">
                          <path d="m11.777 10l4.83 1.294M11 12.898l2.898.776m6.414-1.027c-.605 2.255-.907 3.383-1.592 4.114a4 4 0 0 1-2.01 1.161c-.097.023-.195.04-.295.052c-.915.113-2.032-.186-4.064-.73c-2.255-.605-3.383-.907-4.114-1.592a4 4 0 0 1-1.161-2.011c-.228-.976.074-2.103.679-4.358l.517-1.932l.244-.905c.455-1.666.761-2.583 1.348-3.21a4 4 0 0 1 2.01-1.16c.976-.228 2.104.074 4.36.679c2.254.604 3.382.906 4.113 1.59a4 4 0 0 1 1.161 2.012c.161.69.057 1.456-.231 2.643"/>
                          <path stroke-linejoin="round" d="M3.272 16.647c.604 2.255.907 3.383 1.592 4.114a4 4 0 0 0 2.01 1.161c.976.227 2.104-.075 4.36-.679c2.254-.604 3.382-.906 4.113-1.591a4 4 0 0 0 1.068-1.678M8.516 6.445c-.352.091-.739.195-1.165.31c-2.255.604-3.383.906-4.114 1.59a4 4 0 0 0-1.161 2.012c-.161.69-.057 1.456.231 2.643"/>
                        </g>
                      </svg>
                    </div>
                    
                    {/* Icon 3 - Users */}
                    <div style={{
                      width: '90px',
                      height: '90px',
                      background: 'linear-gradient(145deg, #ffffff, #e6e6e6)',
                      borderRadius: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: 'inset 1px 1px 3px rgba(255, 255, 255, 0.7), inset -1px -1px 3px rgba(0, 0, 0, 0.08), 3px 3px 6px rgba(0, 0, 0, 0.08)'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 20 20">
                        <path fill="currentColor" d="M6.75 3.5a2.25 2.25 0 1 0 0 4.5a2.25 2.25 0 0 0 0-4.5ZM3.5 5.75a3.25 3.25 0 1 1 6.5 0a3.25 3.25 0 0 1-6.5 0Zm0 4.25a2 2 0 0 0-2 2v.084a1.717 1.717 0 0 0 .012.175a3.948 3.948 0 0 0 .67 1.806C2.883 15.08 4.237 16 6.75 16c.946 0 1.727-.13 2.371-.347a5.6 5.6 0 0 1-.12-1.02c-.564.222-1.297.367-2.251.367c-2.237 0-3.258-.799-3.745-1.503a2.948 2.948 0 0 1-.498-1.336a1.608 1.608 0 0 1-.006-.083l-.001-.017V12a1 1 0 0 1 1-1H10c.08 0 .16.01.235.028c.227-.28.48-.535.758-.765A1.991 1.991 0 0 0 10 10H3.5Zm11-5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3ZM12 6.5a2.5 2.5 0 1 1 5 0a2.5 2.5 0 0 1-5 0ZM14.5 19a4.5 4.5 0 1 0-3.937-2.318l-.544 1.789a.41.41 0 0 0 .51.51l1.79-.544A4.48 4.48 0 0 0 14.5 19ZM12 13.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5Zm.5 2.5a.5.5 0 0 1 0-1h2a.5.5 0 0 1 0 1h-2Z"/>
                      </svg>
                    </div>
                    
                    {/* Icon 4 - Search */}
                    <div style={{
                      width: '90px',
                      height: '90px',
                      background: 'linear-gradient(145deg, #ffffff, #e6e6e6)',
                      borderRadius: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: 'inset 1px 1px 3px rgba(255, 255, 255, 0.7), inset -1px -1px 3px rgba(0, 0, 0, 0.08), 3px 3px 6px rgba(0, 0, 0, 0.08)'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 26 26">
                        <path fill="currentColor" d="M10 .188A9.812 9.812 0 0 0 .187 10A9.812 9.812 0 0 0 10 19.813c2.29 0 4.393-.811 6.063-2.125l.875.875a1.845 1.845 0 0 0 .343 2.156l4.594 4.625c.713.714 1.88.714 2.594 0l.875-.875a1.84 1.84 0 0 0 0-2.594l-4.625-4.594a1.824 1.824 0 0 0-2.157-.312l-.875-.875A9.812 9.812 0 0 0 10 .188zM10 2a8 8 0 1 1 0 16a8 8 0 0 1 0-16zM4.937 7.469a5.446 5.446 0 0 0-.812 2.875a5.46 5.46 0 0 0 5.469 5.469a5.516 5.516 0 0 0 3.156-1a7.166 7.166 0 0 1-.75.03a7.045 7.045 0 0 1-7.063-7.062c0-.104-.005-.208 0-.312z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Feature Status Indicators */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '1.25rem',
                    gap: '1rem'
                  }}>
                    {/* Labels & Codes */}
                    <div style={{
                      textAlign: 'center',
                      flex: '1'
                    }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Labels</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>Active</div>
                    </div>
                    
                    {/* Notes */}
                    <div style={{
                      textAlign: 'center',
                      flex: '1'
                    }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Notes</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>Synced</div>
                    </div>
                    
                    {/* Collaboration */}
                    <div style={{
                      textAlign: 'center',
                      flex: '1'
                    }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Collaboration</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>Is live</div>
                    </div>
                    
                    {/* Search */}
                    <div style={{
                      textAlign: 'center',
                      flex: '1'
                    }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>Search</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>Annotations</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Section */}
            <div style={{ flex: '1' }}>
              <h2 style={{
                fontSize: '1.7rem',
                fontWeight: '700',
                color: '#1a1a1a',
                marginBottom: '1rem',
                marginTop: 0,
                fontFamily: '"Inter", "Inter Fallback", sans-serif'
              }}>Collaborate in real time</h2>
              <p style={{
                fontSize: '18px',
                color: '#6b7280',
                lineHeight: '1.6',
                fontFamily: '"Inter", "Inter Fallback", sans-serif',
                marginBottom: '2rem'
              }}>Team up in real-time conversations. Add notes, share insights, and build on each other's ideas without switching apps or losing context.</p>
              
              <div style={{
                height: '300px',
                background: 'radial-gradient(circle at 50% 50%, #c3e8ff, #cceeff, #d4f0ff, #dcf3ff, #e5f6ff, #eef9ff, #f6fcff, #ffffff)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80%',
                  height: '242px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px 16px 0 0',
                  boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  padding: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Video Animation */}
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{
                      width: '100%',
                      height: '180px',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                  >
                    <source src="/anim.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Frequently Asked Questions Section */}
        <div style={{
          marginTop: '13.75rem',
          textAlign: 'left',
          maxWidth: '83%',
          margin: '9.75rem auto 0 auto',
          padding: '4rem 0',
          position: 'relative'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '3.5rem',
            padding: '0 2rem'
          }}>
            <h2 style={{
              fontSize: '1.7rem',
              fontWeight: '600',
              color: '#1a1a1a',
              marginBottom: '1rem',
              marginTop: 0,
              fontFamily: '"Inter", "Inter Fallback", sans-serif',
              letterSpacing: '-0.025em'
            }}>Want to know more?</h2>
            <p style={{
              fontSize: '18px',
              color: '#6b7280',
              marginBottom: '0',
              lineHeight: '1.6',
              fontFamily: '"Inter", "Inter Fallback", sans-serif',
              maxWidth: '600px',
              margin: '0 auto'
            }}>Here's a list of FAQs to help you get started!</p>
          </div>
            
            <div style={{
              display: 'flex',
              gap: '2rem',
              alignItems: 'flex-start',
              padding: '0 2rem'
            }}>
              {/* FAQ Section */}
              <div style={{
                flex: '1',
                backgroundColor: '#ffffff',
                padding: '0',
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
              {[
                {
                  question: "What is Phraze?",
                  answer: "Phraze is a collaborative workspace and living notebook for every AI conversation. It helps you highlight, annotate, and organize text from any webpage or LLM conversation.",
                  isFirst: true
                },
                {
                  question: "How does Phraze work?",
                  answer: "Phraze uses intelligent highlighting and annotation to transform AI conversations. You can add labels, codes, and notes to individual messages, making it easy to organize discussions and capture insights as they happen."
                },
                {
                  question: "What makes Phraze different from other tools?",
                  answer: "Unlike traditional tools that require exporting transcripts and switching platforms, Phraze keeps everything in context. It turns raw dialogue into organized, actionable material while maintaining the conversation flow."
                },
                {
                  question: "Can I collaborate with my team?",
                  answer: "Yes! Phraze is built for teams working with conversational data. Multiple collaborators can work in the same thread without leaving the chat, making it perfect for researchers and development teams."
                },
                {
                  question: "How do I get started with Phraze?",
                  answer: "Getting started is easy! Simply sign up for an account, install the Chrome extension if you want web highlighting, and start organizing your AI conversations with our intuitive annotation tools."
                },
                {
                  question: "What types of annotations can I create?",
                  answer: "Phraze supports custom labels, codes, and detailed notes. You can categorize conversations, highlight important insights, and create a structured knowledge base from your AI interactions."
                },
                {
                  question: "Is my data secure with Phraze?",
                  answer: "Absolutely. We prioritize data security and privacy. All your conversations and annotations are encrypted and stored securely. You have full control over your data and can export or delete it at any time."
                },
                {
                  question: "Can I export my annotated conversations?",
                  answer: "Yes! Phraze allows you to export your organized conversations in multiple formats. You can share insights with your team, create reports, or integrate the data with other tools in your workflow.",
                  isLast: true
                }
              ].map((faq, index) => (
                <FAQItem 
                  key={index} 
                  question={faq.question} 
                  answer={faq.answer} 
                  isFirst={index === 0}
                  isLast={index === 7}
                />
              ))}
            </div>
            
            {/* Contact Section */}
            <div style={{
              flex: '0 0 320px',
              backgroundColor: '#ffffff',
              padding: '2.5rem',
              borderRadius: '20px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '1rem',
                marginTop: 0,
                fontFamily: '"Inter", "Inter Fallback", sans-serif'
              }}>Need more support?</h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: '1.5',
                fontFamily: '"Inter", "Inter Fallback", sans-serif'
              }}>Can't find what you're looking for? Get in touch with our team.</p>
              
              <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '0' }}>
                <input
                  type="text"
                  placeholder="Your name"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: '"Inter", "Inter Fallback", sans-serif'
                  }}
                />
                <input
                  type="email"
                  placeholder="Your email"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: '"Inter", "Inter Fallback", sans-serif'
                  }}
                />
                <input
                  type="text"
                  placeholder="Subject"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: '"Inter", "Inter Fallback", sans-serif'
                  }}
                />
                <textarea
                  placeholder="How can we help?"
                  rows="4"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: '"Inter", "Inter Fallback", sans-serif',
                    resize: 'vertical'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f8fafc',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    fontFamily: '"Inter", "Inter Fallback", sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f1f5f9';
                    e.target.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f8fafc';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
        
        {/* Minimal Footer */}
        <div style={{
          textAlign: 'center',
          padding: '3rem 0 2rem 0',
          marginTop: '4rem',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
                      <a href="/terms" style={{
            fontSize: '14px',
            color: '#6b7280',
            textDecoration: 'none',
            fontFamily: '"Inter", "Inter Fallback", sans-serif',
            transition: 'color 0.2s ease'
          }}>Terms of Service</a>
            <a href="#" style={{
              fontSize: '14px',
              color: '#6b7280',
              textDecoration: 'none',
              fontFamily: '"Inter", "Inter Fallback", sans-serif',
              transition: 'color 0.2s ease'
            }}>Privacy Policy</a>
            <a href="#" style={{
              fontSize: '14px',
              color: '#6b7280',
              textDecoration: 'none',
              fontFamily: '"Inter", "Inter Fallback", sans-serif',
              transition: 'color 0.2s ease'
            }}>Cookie Policy</a>
            <a href="/contact" style={{
              fontSize: '14px',
              color: '#6b7280',
              textDecoration: 'none',
              fontFamily: '"Inter", "Inter Fallback", sans-serif',
              transition: 'color 0.2s ease'
            }}>Contact</a>
          </div>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0',
            fontFamily: '"Inter", "Inter Fallback", sans-serif'
          }}>
            © 2025 Phraze. All rights reserved. Affiliated with Human-Centered Computing Group (HCCG).
          </p>
        </div>
      </div>
    </section>
  );
}

// FAQ Item Component
function FAQItem({ question, answer, isFirst, isLast }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="faq-item" style={{
      borderBottom: isLast ? 'none' : '1px solid #e2e8f0',
      padding: '1.25rem 2rem',
      textAlign: 'left',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      backgroundColor: isOpen ? '#fafafa' : '#ffffff',
      borderRadius: isFirst ? '20px 20px 0 0' : isLast ? '0 0 20px 20px' : '0',
      ':hover': {
        backgroundColor: '#f9fafb'
      }
    }}
    onClick={() => setIsOpen(!isOpen)}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div style={{
          flex: 1,
          minWidth: 0
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontFamily: '"Inter", "Inter Fallback", sans-serif',
            fontWeight: '500',
            color: '#111827',
            margin: '0',
            lineHeight: '1.4'
          }}>{question}</h3>
          
          <div style={{
            maxHeight: isOpen ? '300px' : '0px',
            overflow: 'hidden',
            transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isOpen ? 1 : 0
          }}>
            <p style={{
              color: '#6b7280',
              lineHeight: '1.6',
              fontSize: '0.95rem',
              fontFamily: '"Inter", "Inter Fallback", sans-serif',
              fontWeight: '400',
              margin: '0',
              paddingTop: '0.5rem'
            }}>
              {answer}
            </p>
          </div>
        </div>
        
        <div style={{
          flexShrink: 0
        }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              color: '#9ca3af'
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
