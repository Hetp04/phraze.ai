import SlidingRectangles from '../components/SlidingRectangles';
import { useScrollAnimation } from '../components/ScrollAnimation';

export default function Features() {
  // Initialize scroll animation
  useScrollAnimation();
  
  return (
    <main className="features-page" style={{ 
      background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 88%, #b8c4d0 100%)',
      minHeight: '100vh'
    }}>
      {/* Hero Section */}
      <section className="features-hero" style={{ paddingTop: '120px', background: 'transparent' }}>
        <div className="container">
          <div style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <p className="small-text" style={{ margin: 0, fontSize: '16px' }}>Phraze</p>
          </div>
          <h1>Advanced Features for LLM Development</h1>
          <p className="small-text" style={{ margin: 0, whiteSpace: 'nowrap', fontSize: '16px' }}>Highlight, annotate, and organize text from any webpage or LLM conversation</p>
        </div>
      </section>

      {/* Sliding Rectangles Animation */}
      <SlidingRectangles />

      {/* Start Now Button */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        margin: '40px 0'
      }}>
        <a href="#" className="small-text" style={{
          backgroundColor: 'rgb(240,240,240)',
          borderRadius: '18px',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          color: '#333',
          fontWeight: '500',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          margin: 0
        }}>
          Start now
          <span style={{ marginLeft: '8px' }}>↗</span>
        </a>
      </div>

      {/* Bento Grid Features Section */}
      <section style={{
        padding: '100px 0',
        maxWidth: '1400px',
        margin: '0 auto',
        paddingLeft: '24px',
        paddingRight: '24px',
        marginTop: '40px',
        marginBottom: '40px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginTop: '60px'
        }}>
          {/* Top Left - Big Panel */}
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #f1f5f9',
            minHeight: '450px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              {/* Grey Background Container */}
              <div style={{
                background: 'rgb(247, 247, 247)',
                borderRadius: '16px',
                padding: '16px',
                height: '80%',
                marginTop: 'auto',
                margin: '0px'
              }}>
                {/* Image inside grey box */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <img 
                    src="src/images/projects.png" 
                    alt="Project organization interface"
                    style={{
                      width: '100%',
                      height: '95%',
                      objectFit: 'contain',
                      borderRadius: '12px'
                    }}
                  />
                </div>
              </div>
              
              {/* Text on White Card */}
              <div style={{
                marginTop: '16px'
              }}>
                {/* Header */}
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#1a1a1a',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  Project Organization
                </h3>
                
                {/* Description */}
                <p style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#666',
                  lineHeight: '1.5',
                  margin: '0',
                  textAlign: 'center'
                }}>
                  Organize conversations and annotations into separate projects.
                </p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#666',
                  lineHeight: '1.5',
                  marginTop: '8px',
                  textAlign: 'center'
                }}>
                  Keep your workflow organized and efficient.
                </p>
              </div>
            </div>
          </div>

          {/* Top Right - Big Panel */}
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #f1f5f9',
            minHeight: '450px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              {/* Grey Background Container */}
              <div style={{
                background: 'rgb(247, 247, 247)',
                borderRadius: '16px',
                padding: '16px',
                height: '80%',
                marginTop: 'auto',
                margin: '0px'
              }}>
                {/* Video inside grey box */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <video 
                    src="src/images/ant.mp4" 
                    style={{
                      width: '100%',
                      height: '95%',
                      objectFit: 'contain',
                      borderRadius: '12px'
                    }}
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                  </video>
                </div>
              </div>
              
              {/* Text on White Card */}
              <div style={{
                marginTop: '16px'
              }}>
                {/* Header */}
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#1a1a1a',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  Annotation Hub
                </h3>
                
                {/* Description */}
                <p style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#666',
                  lineHeight: '1.5',
                  margin: '0',
                  textAlign: 'center'
                }}>
                  Add labels, codes, voice notes, and notes to chat messages.
                </p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#666',
                  lineHeight: '1.5',
                  marginTop: '8px',
                  textAlign: 'center'
                }}>
                  Enhance your conversations with rich annotations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row - 2 Big Panels */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginTop: '24px'
        }}>
          {/* Middle Left - Big Panel */}
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #f1f5f9',
            minHeight: '500px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              {/* Grey Background Container */}
              <div style={{
                background: 'rgb(247, 247, 247)',
                borderRadius: '16px',
                padding: '16px',
                height: '80%',
                marginTop: 'auto',
                margin: '0px'
              }}>
                {/* Image inside grey box */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <img 
                    src="src/images/type.png" 
                    alt="Export annotation data options"
                    style={{
                      width: '100%',
                      height: '95%',
                      objectFit: 'contain',
                      borderRadius: '12px'
                    }}
                  />
                </div>
              </div>
              
              {/* Text on White Card */}
              <div style={{
                marginTop: '16px'
              }}>
                {/* Header */}
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#1a1a1a',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  Import and Export Options
                </h3>
                
                {/* Description */}
                <p style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#666',
                  lineHeight: '1.5',
                  margin: '0',
                  textAlign: 'center'
                }}>
                  Import JSON files and sync annotations across any account.
                </p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#666',
                  lineHeight: '1.5',
                  marginTop: '8px',
                  textAlign: 'center'
                }}>
                  Export your data via email, download, or copy JSON.
                </p>
              </div>
            </div>
          </div>

          {/* Middle Right - Big Panel */}
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #f1f5f9',
            minHeight: '500px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              {/* Grey Background Container */}
              <div style={{
                background: 'rgb(247, 247, 247)',
                borderRadius: '16px',
                padding: '16px',
                height: '80%',
                marginTop: 'auto',
                margin: '0px'
              }}>
                {/* Image inside grey box */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <img 
                    src="src/images/history.png" 
                    alt="Annotation history and management interface"
                    style={{
                      width: '100%',
                      height: '95%',
                      objectFit: 'contain',
                      borderRadius: '12px'
                    }}
                  />
                </div>
              </div>
              
              {/* Text on White Card */}
              <div style={{
                marginTop: '16px'
              }}>
                {/* Header */}
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#1a1a1a',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  Annotation History
                </h3>
                
                {/* Description */}
                <p style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#666',
                  lineHeight: '1.5',
                  margin: '0',
                  textAlign: 'center'
                }}>
                  View your annotations and manage highlights with ease.
                </p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#666',
                  lineHeight: '1.5',
                  marginTop: '8px',
                  textAlign: 'center'
                }}>
                  Delete highlights or remove all annotations completely.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - 3 Small Panels */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '24px',
          marginTop: '24px'
        }}>
          {/* Bottom Left - Small Panel */}
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #f1f5f9',
            minHeight: '480px',
            maxHeight: '480px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              {/* Grey Background Container */}
              <div style={{
                background: 'rgb(247, 247, 247)',
                borderRadius: '16px',
                padding: '16px',
                height: '75%',
                margin: '0px'
              }}>
                {/* Video inside grey box */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <video 
                    src="src/images/hi.mp4" 
                    style={{
                      width: '100%',
                      height: '95%',
                      objectFit: 'contain',
                      borderRadius: '12px'
                    }}
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                  </video>
                </div>
              </div>
              
              {/* Text on White Card */}
              <div style={{
                marginTop: '15px'
              }}>
                {/* Header */}
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#1a1a1a',
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>
                  Chat Annotation
                </h3>
                
                {/* Description */}
                <p style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#666',
                  lineHeight: '1.5',
                  margin: '0',
                  textAlign: 'center'
                }}>
                  Highlight and add labels to annotate your chat.
                </p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#666',
                  lineHeight: '1.5',
                  marginTop: '8px',
                  textAlign: 'center'
                }}>
                  Organize your thoughts with custom tags and notes.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Right - Wide Panel (spans 2 positions) */}
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #f1f5f9',
            minHeight: '480px',
            maxHeight: '480px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              {/* Grey Background Container for Chat Demo */}
              <div style={{
                background: 'rgb(247, 247, 247)',
                borderRadius: '16px',
                padding: '16px',
                height: '75%',
                margin: '0px'
              }}>
                {/* Chat Demo with exact styles from the HTML */}
                <div style={{
                  height: '100%',
                  overflowY: 'auto',
                  padding: '8px'
                }}>
                  {/* First message */}
                  <div style={{
                    padding: '0px 1rem',
                    margin: '0px',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    zIndex: 10,
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      maxWidth: '85%'
                    }}>
                      <div style={{
                        fontSize: '0.8rem',
                        marginBottom: '6px',
                        fontWeight: '500',
                        color: 'rgb(85, 85, 85)',
                        textAlign: 'right',
                        paddingRight: '0px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        justifyContent: 'flex-end'
                      }}>
                        <img src="/src/images/maya.png" alt="Jin Liner" style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid rgb(203, 213, 225)'
                        }} />
                        <span>Jin Liner</span>
                      </div>
                      <div style={{
                        padding: '0.75rem 1.25rem 1.25rem',
                        background: 'rgb(255, 255, 255)',
                        borderRadius: '2rem 2rem 5px',
                        color: 'rgb(10, 10, 10)',
                        display: 'inline-block',
                        width: '100%',
                        position: 'relative',
                        marginTop: '2px',
                        textAlign: 'left'
                      }}>
                        <div style={{
                          fontSize: '0.9rem',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-wrap'
                        }}>
                          <span style={{
                            position: 'relative',
                            display: 'inline-block'
                          }}>
                            <span style={{
                              position: 'relative',
                              zIndex: 15
                            }}>
                              Hey! I'm trying to build a machine learning model for image recognition. Any tips on getting started?
                            </span>
                            <div style={{
                              position: 'absolute',
                              inset: '0px',
                              backgroundColor: 'rgb(254, 240, 138)',
                              width: '100%',
                              zIndex: 6
                            }}></div>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* phraze P's response */}
                  <div style={{
                    padding: '0px 1rem',
                    margin: '0px',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    position: 'relative',
                    zIndex: 1,
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      maxWidth: '85%'
                    }}>
                      <div style={{
                        fontSize: '0.8rem',
                        marginBottom: '6px',
                        fontWeight: '500',
                        color: 'rgb(85, 85, 85)',
                        textAlign: 'left',
                        paddingRight: '0rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        justifyContent: 'flex-start'
                      }}>
                        <span>phraze</span>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: 'rgb(100, 116, 139)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          fontWeight: '600',
                          color: 'white',
                          border: '1px solid rgb(71, 85, 105)'
                        }}>
                          P
                        </div>
                      </div>
                      <div style={{
                        padding: '0px 0px 0.5rem',
                        background: 'transparent',
                        borderRadius: '0.5rem',
                        color: 'rgb(10, 10, 10)',
                        display: 'inline-block',
                        width: '100%',
                        position: 'relative',
                        marginTop: '2px',
                        textAlign: 'left'
                      }}>
                        <div style={{
                          fontSize: '0.9rem',
                          lineHeight: '1.4',
                          whiteSpace: 'normal'
                        }}>
                          Great question! For image recognition, I'd recommend starting with <span style={{
                            position: 'relative',
                            display: 'inline-block'
                          }}>
                            <span style={{
                              position: 'relative',
                              zIndex: 15
                            }}>
                              TensorFlow or PyTorch
                            </span>
                            <div style={{
                              position: 'absolute',
                              inset: '0px',
                              backgroundColor: 'rgb(254, 240, 138)',
                              width: '100%',
                              zIndex: 6
                            }}></div>
                          </span>. Begin with pre-trained models like <span style={{
                            position: 'relative',
                            display: 'inline-block'
                          }}>
                            <span style={{
                              position: 'relative',
                              zIndex: 15
                            }}>
                              ResNet or VGG
                            </span>
                            <div style={{
                              position: 'absolute',
                              inset: '0px',
                              backgroundColor: 'rgb(254, 240, 138)',
                              width: '100%',
                              zIndex: 6
                            }}></div>
                          </span>, then fine-tune them on your specific dataset.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alex Chen's message */}
                  <div style={{
                    padding: '0px 1rem',
                    margin: '0px',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    zIndex: 1,
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      maxWidth: '85%'
                    }}>
                      <div style={{
                        fontSize: '0.8rem',
                        marginBottom: '6px',
                        fontWeight: '500',
                        color: 'rgb(85, 85, 85)',
                        textAlign: 'right',
                        paddingRight: '0px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        justifyContent: 'flex-end'
                      }}>
                        <img src="/src/images/alex.png" alt="Alex Chen" style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid rgb(203, 213, 225)'
                        }} />
                        <span>Alex Chen</span>
                      </div>
                      <div style={{
                        padding: '0.75rem 1.25rem 1.25rem',
                        background: 'rgb(255, 255, 255)',
                        borderRadius: '2rem 2rem 5px',
                        color: 'rgb(10, 10, 10)',
                        display: 'inline-block',
                        width: '100%',
                        position: 'relative',
                        marginTop: '2px',
                        textAlign: 'left'
                      }}>
                        <div style={{
                          fontSize: '0.9rem',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-wrap'
                        }}>
                          I started with <span style={{
                            position: 'relative',
                            display: 'inline-block'
                          }}>
                            <span style={{
                              position: 'relative',
                              zIndex: 15
                            }}>
                              TensorFlow
                            </span>
                            <div style={{
                              position: 'absolute',
                              inset: '0px',
                              backgroundColor: 'rgb(254, 240, 138)',
                              width: '100%',
                              zIndex: 6
                            }}></div>
                          </span> too! The transfer learning approach saved me weeks of training time.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Response to Alex Chen */}
                  <div style={{
                    padding: '0px 1rem',
                    margin: '0px',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    position: 'relative',
                    zIndex: 1,
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      maxWidth: '85%'
                    }}>
                      <div style={{
                        fontSize: '0.8rem',
                        marginBottom: '6px',
                        fontWeight: '500',
                        color: 'rgb(85, 85, 85)',
                        textAlign: 'left',
                        paddingRight: '0rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        justifyContent: 'flex-start'
                      }}>
                        <span>phraze</span>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: 'rgb(100, 116, 139)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          fontWeight: '600',
                          color: 'white',
                          border: '1px solid rgb(71, 85, 105)'
                        }}>
                          P
                        </div>
                      </div>
                      <div style={{
                        padding: '0px 0px 0.5rem',
                        background: 'transparent',
                        borderRadius: '0.5rem',
                        color: 'rgb(10, 10, 10)',
                        display: 'inline-block',
                        width: '100%',
                        position: 'relative',
                        marginTop: '2px',
                        textAlign: 'left'
                      }}>
                        <div style={{
                          fontSize: '0.9rem',
                          lineHeight: '1.4',
                          whiteSpace: 'normal'
                        }}>
                          That's excellent! Transfer learning is indeed a game-changer. Since you're working with medical images, I'd recommend looking into architectures specifically designed for medical imaging like <span style={{
                            position: 'relative',
                            display: 'inline-block'
                          }}>
                            <span style={{
                              position: 'relative',
                              zIndex: 15
                            }}>
                              DenseNet or EfficientNet
                            </span>
                            <div style={{
                              position: 'absolute',
                              inset: '0px',
                              backgroundColor: 'rgb(254, 240, 138)',
                              width: '100%',
                              zIndex: 6
                            }}></div>
                          </span>. They handle the fine details in medical scans much better than general-purpose models.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Jin Liner's final message */}
                  <div style={{
                    padding: '0px 1rem',
                    margin: '0px',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    zIndex: 1,
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      maxWidth: '85%'
                    }}>
                      <div style={{
                        fontSize: '0.8rem',
                        marginBottom: '6px',
                        fontWeight: '500',
                        color: 'rgb(85, 85, 85)',
                        textAlign: 'right',
                        paddingRight: '0px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        justifyContent: 'flex-end'
                      }}>
                        <img src="/src/images/maya.png" alt="Jin Liner" style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid rgb(203, 213, 225)'
                        }} />
                        <span>Jin Liner</span>
                      </div>
                      <div style={{
                        padding: '0.75rem 1.25rem 1.25rem',
                        background: 'rgb(255, 255, 255)',
                        borderRadius: '2rem 2rem 5px',
                        color: 'rgb(10, 10, 10)',
                        display: 'inline-block',
                        width: '100%',
                        position: 'relative',
                        marginTop: '2px',
                        textAlign: 'left'
                      }}>
                        <div style={{
                          fontSize: '0.9rem',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-wrap'
                        }}>
                          <span style={{
                            position: 'relative',
                            display: 'inline-block'
                          }}>
                            <span style={{
                              position: 'relative',
                              zIndex: 15
                            }}>
                              @alex I'm working with medical images. Should I use a different architecture?
                            </span>
                            <div style={{
                              position: 'absolute',
                              bottom: '100%',
                              left: '0px',
                              transform: 'translateY(-2px) scale(0.98)',
                              opacity: 0,
                              transition: 'opacity 240ms, transform 240ms',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: 'rgba(255, 255, 255, 0.85)',
                              backdropFilter: 'saturate(180%) blur(4px)',
                              border: '1px solid rgb(229, 231, 235)',
                              borderRadius: '9999px',
                              padding: '6px 10px',
                              boxShadow: 'rgba(0, 0, 0, 0.06) 0px 6px 20px',
                              zIndex: 26
                            }}>
                              <span style={{
                                fontSize: '12px',
                                color: 'rgb(107, 114, 128)'
                              }}>
                                Label:
                              </span>
                              <span style={{
                                fontSize: '12px',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                background: 'rgb(236, 254, 255)',
                                color: 'rgb(14, 116, 144)',
                                border: '1px solid rgb(165, 243, 252)',
                                fontWeight: '600'
                              }}>
                                Medical
                              </span>
                              <span style={{
                                fontSize: '12px',
                                color: 'rgb(107, 114, 128)'
                              }}>
                                User:
                              </span>
                              <span style={{
                                fontSize: '12px',
                                color: 'rgb(107, 114, 128)',
                                fontWeight: '600'
                              }}>
                                Jin Liner
                              </span>
                            </div>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alex Chen's reply to Jin Liner */}
                  <div style={{
                    padding: '0px 1rem',
                    margin: '0px',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    zIndex: 1,
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      maxWidth: '85%'
                    }}>
                      <div style={{
                        fontSize: '0.8rem',
                        marginBottom: '6px',
                        fontWeight: '500',
                        color: 'rgb(85, 85, 85)',
                        textAlign: 'right',
                        paddingRight: '0px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        justifyContent: 'flex-end'
                      }}>
                        <img src="/src/images/alex.png" alt="Alex Chen" style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid rgb(203, 213, 225)'
                        }} />
                        <span>Alex Chen</span>
                      </div>
                      <div style={{
                        padding: '0.75rem 1.25rem 1.25rem',
                        background: 'rgb(255, 255, 255)',
                        borderRadius: '2rem 2rem 5px',
                        color: 'rgb(10, 10, 10)',
                        display: 'inline-block',
                        width: '100%',
                        position: 'relative',
                        marginTop: '2px',
                        textAlign: 'left'
                      }}>
                        <div style={{
                          fontSize: '0.9rem',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-wrap'
                        }}>
                          @maya For medical images, definitely consider <span style={{
                            position: 'relative',
                            display: 'inline-block'
                          }}>
                            <span style={{
                              position: 'relative',
                              zIndex: 15
                            }}>
                              U-Net or ResNet-50
                            </span>
                            <div style={{
                              position: 'absolute',
                              inset: '0px',
                              backgroundColor: 'rgb(254, 240, 138)',
                              width: '100%',
                              zIndex: 6
                            }}></div>
                          </span>. They're proven performers in medical imaging. Also, make sure to use proper data augmentation techniques since medical datasets are often smaller.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Text on White Card */}
              <div style={{
                marginTop: '15px'
              }}>
                {/* Header */}
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#1a1a1a',
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>
                  Team Collaboration
                </h3>
                
                {/* Description */}
                <p style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#666',
                  lineHeight: '1.5',
                  margin: '0',
                  textAlign: 'center'
                }}>
                  Multiple people can chat, annotate, and revisit their annotations in a thread
                </p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#666',
                  lineHeight: '1.5',
                  marginTop: '8px',
                  textAlign: 'center'
                }}>
                  Build knowledge together with shared insights and feedback.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
          <a href="/privacy" style={{
            fontSize: '14px',
            color: '#6b7280',
            textDecoration: 'none',
            fontFamily: '"Inter", "Inter Fallback", sans-serif',
            transition: 'color 0.2s ease'
          }}>Privacy Policy</a>
          <a href="/cookies" style={{
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
    </main>
  );
} 