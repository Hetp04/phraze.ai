import React from 'react';

export default function Contact() {
  return (
    <main className="contact-page" style={{ 
      background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 88%, #b8c4d0 100%)',
      minHeight: '100vh'
    }}>
      {/* Hero Section */}
      <section className="contact-hero" style={{ paddingTop: '120px', background: 'transparent' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <p className="small-text" style={{ margin: 0, fontSize: '16px' }}>Phraze</p>
          </div>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '1rem',
            marginTop: 0,
            fontFamily: '"Inter", "Inter Fallback", sans-serif',
            textAlign: 'left'
          }}>Contact Us</h1>

        </div>
      </section>

      {/* Main Content */}
      <section style={{
        padding: '0',
        maxWidth: '1200px',
        margin: '0 auto',
        paddingLeft: '24px',
        paddingRight: '48px'
      }}>
        <div style={{
          backgroundColor: 'transparent',
          padding: '0'
        }}>
          {/* Contact Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '3rem',
            alignItems: 'start'
          }}>
            {/* Left Side - Contact Information */}
            <div style={{ paddingLeft: '0' }}>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '1rem',
                  marginTop: 0,
                  fontFamily: '"Inter", "Inter Fallback", sans-serif'
                }}>General Support</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '0.25rem',
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      fontWeight: '500'
                    }}>
                      Email
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: '#1a1a1a',
                      marginBottom: '0',
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      fontWeight: '600'
                    }}>
                      phrazeai@gmail.com
                    </p>
                  </div>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '0.25rem',
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      fontWeight: '500'
                    }}>
                      Response Time
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: '#1a1a1a',
                      marginBottom: '0',
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      fontWeight: '600'
                    }}>
                      Within 24-48 hours
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '1rem',
                  marginTop: 0,
                  fontFamily: '"Inter", "Inter Fallback", sans-serif'
                }}>Research & Academic Inquiries</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '0.25rem',
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      fontWeight: '500'
                    }}>
                      Western Research
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: '#1a1a1a',
                      marginBottom: '0',
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      fontWeight: '600'
                    }}>
                      research.comms@uwo.ca
                    </p>
                  </div>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '0.25rem',
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      fontWeight: '500'
                    }}>
                      Response Time
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: '#1a1a1a',
                      marginBottom: '0',
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      fontWeight: '600'
                    }}>
                      Within 3-5 business days
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '1rem',
                  marginTop: 0,
                  fontFamily: '"Inter", "Inter Fallback", sans-serif'
                }}>Organization Information</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '0.25rem',
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      fontWeight: '500'
                    }}>
                      Organization
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: '#1a1a1a',
                      marginBottom: '0',
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      fontWeight: '600'
                    }}>
                      Phraze — Human-Centered Computing Group
                    </p>
                  </div>
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '0.25rem',
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      fontWeight: '500'
                    }}>
                      Location
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: '#1a1a1a',
                      marginBottom: '0',
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      fontWeight: '600'
                    }}>
                      Western University, London, Ontario, Canada
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '1rem',
                  marginTop: 0,
                  fontFamily: '"Inter", "Inter Fallback", sans-serif'
                }}>What We Can Help With</h3>
                <ul style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  lineHeight: '1.7',
                  marginBottom: '1rem',
                  paddingLeft: '2rem',
                  fontFamily: '"Inter", "Inter Fallback", sans-serif'
                }}>
                  <li>Technical support and troubleshooting</li>
                  <li>Account access and management</li>
                  <li>Feature requests and feedback</li>
                  <li>Research collaboration opportunities</li>
                </ul>
              </div>
            </div>

            {/* Right Side - Contact Form */}
            <div style={{
              backgroundColor: '#f7f7f8',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              marginTop: '-3.5rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '1.5rem',
                marginTop: 0,
                fontFamily: '"Inter", "Inter Fallback", sans-serif'
              }}>Send us a Message</h3>
              
              <form>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem',
                    fontFamily: '"Inter", "Inter Fallback", sans-serif'
                  }}>
                    Name
                  </label>
                  <input 
                    type="text"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      backgroundColor: '#ffffff'
                    }}
                    placeholder="Your name"
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem',
                    fontFamily: '"Inter", "Inter Fallback", sans-serif'
                  }}>
                    Email
                  </label>
                  <input 
                    type="email"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      backgroundColor: '#ffffff'
                    }}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem',
                    fontFamily: '"Inter", "Inter Fallback", sans-serif'
                  }}>
                    Subject
                  </label>
                  <select style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontFamily: '"Inter", "Inter Fallback", sans-serif',
                    backgroundColor: '#ffffff'
                  }}>
                    <option value="">Select a subject</option>
                    <option value="general">General Support</option>
                    <option value="technical">Technical Issue</option>
                    <option value="research">Research Inquiry</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem',
                    fontFamily: '"Inter", "Inter Fallback", sans-serif'
                  }}>
                    Message
                  </label>
                  <textarea 
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontFamily: '"Inter", "Inter Fallback", sans-serif',
                      backgroundColor: '#ffffff',
                      resize: 'vertical'
                    }}
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <button 
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6b7280',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    fontFamily: '"Inter", "Inter Fallback", sans-serif',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
                >
                  Send Message
                </button>
              </form>
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
          © 2025 Phraze. Developed by the Human-Centered Computing Group in affiliation with Western University. All rights reserved.
        </p>
      </div>
    </main>
  );
}
