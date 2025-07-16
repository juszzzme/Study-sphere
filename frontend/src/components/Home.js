import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  // Enhanced color palette inspired by mymind
  const colors = {
    // Core StudySphere colors
    darkBlue: '#1e3d59',
    cream: '#f5f0e1',
    coral: '#ff6e40',
    yellow: '#ffc13b',
    richRed: '#d81e5b',

    // mymind-inspired additions
    warmOrange: '#ff8a65',
    softPink: '#ffab91',
    lightCream: '#fdf8f3',
    deepNavy: '#1a2332',
    mutedGray: '#6b7280',
    pureWhite: '#ffffff',

    // Gradient combinations
    warmGradient: 'linear-gradient(135deg, #ff8a65 0%, #ffab91 50%, #fdf8f3 100%)',
    coolGradient: 'linear-gradient(135deg, #1e3d59 0%, #2d4a6b 100%)',
    neutralGradient: 'linear-gradient(135deg, #fdf8f3 0%, #ffffff 100%)'
  };

  return (
    <div style={{
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: colors.neutralGradient,
      minHeight: '100vh',
      color: colors.deepNavy,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* mymind-inspired subtle background elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '5%',
        width: '200px',
        height: '200px',
        background: colors.warmGradient,
        borderRadius: '50%',
        opacity: 0.03,
        filter: 'blur(40px)'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '8%',
        width: '300px',
        height: '300px',
        background: colors.coolGradient,
        borderRadius: '50%',
        opacity: 0.02,
        filter: 'blur(60px)'
      }}></div>

      {/* mymind-inspired minimal header */}
      <header style={{
        padding: '2rem 4rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
        background: 'transparent'
      }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: colors.deepNavy,
          letterSpacing: '-0.5px',
          fontFamily: '"Inter", sans-serif'
        }}>
          StudySphere
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/login" style={{
            padding: '0.75rem 1.5rem',
            textDecoration: 'none',
            color: colors.mutedGray,
            fontWeight: '500',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            fontSize: '0.95rem',
            background: 'transparent'
          }}>
            Sign in
          </Link>
          <Link to="/register" style={{
            padding: '0.75rem 1.5rem',
            background: colors.deepNavy,
            color: colors.pureWhite,
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            border: 'none'
          }}>
            Get started
          </Link>
        </div>
      </header>

      {/* mymind-inspired subtle animations */}
      <style>{`
        .mymind-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mymind-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }
        .mymind-button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mymind-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }
        .search-bar {
          transition: all 0.3s ease;
        }
        .search-bar:focus-within {
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
      `}</style>

      {/* mymind-style hero section - content first */}
      <section style={{
        padding: '8rem 4rem 6rem',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        zIndex: 5
      }}>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: '600',
          marginBottom: '1.5rem',
          color: colors.deepNavy,
          letterSpacing: '-1px',
          lineHeight: '1.2',
          fontFamily: '"Inter", sans-serif',
          maxWidth: '800px'
        }}>
          Your personal learning companion
        </h1>

        <p style={{
          fontSize: '1.25rem',
          color: colors.mutedGray,
          maxWidth: '600px',
          margin: '0 auto 3rem',
          lineHeight: '1.6',
          fontWeight: '400'
        }}>
          Organize your studies, track progress, and collaborate with peers in one beautiful, intuitive space.
        </p>

        {/* mymind-style search bar */}
        <div className="search-bar" style={{
          width: '100%',
          maxWidth: '500px',
          margin: '0 auto 3rem',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: colors.pureWhite,
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.04)'
          }}>
            <span style={{
              fontSize: '1.2rem',
              marginRight: '1rem',
              color: colors.mutedGray
            }}>🔍</span>
            <input
              type="text"
              placeholder="Search your learning space..."
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '1rem',
                color: colors.deepNavy,
                background: 'transparent',
                width: '100%',
                fontFamily: '"Inter", sans-serif'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="mymind-button" style={{
            padding: '1rem 2rem',
            background: colors.deepNavy,
            color: colors.pureWhite,
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            display: 'inline-block',
            border: 'none'
          }}>
            Get started for free
          </Link>
          <Link to="/login" className="mymind-button" style={{
            padding: '1rem 2rem',
            background: 'transparent',
            color: colors.mutedGray,
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            display: 'inline-block',
            border: `1px solid ${colors.mutedGray}30`
          }}>
            Sign in
          </Link>
        </div>
      </section>

      {/* mymind-style feature showcase */}
      <section style={{
        padding: '6rem 4rem',
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 5
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: '4rem',
          color: colors.deepNavy,
          letterSpacing: '-0.5px',
          fontFamily: '"Inter", sans-serif'
        }}>
          Everything you need to excel
        </h2>

        {/* mymind-style fluid grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          margin: '0 auto',
        }}>
          {/* Resource Hub - mymind card style */}
          <div className="mymind-card" style={{
            padding: '2rem',
            background: colors.pureWhite,
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.06)',
            position: 'relative'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: colors.warmGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>📚</span>
            </div>
            <h3 style={{
              fontWeight: '600',
              fontSize: '1.25rem',
              marginBottom: '0.75rem',
              color: colors.deepNavy,
              fontFamily: '"Inter", sans-serif'
            }}>
              Resource Hub
            </h3>
            <p style={{
              color: colors.mutedGray,
              lineHeight: '1.6',
              fontSize: '0.95rem',
              margin: 0
            }}>
              Organize and access all your study materials in one beautiful, searchable space.
            </p>
          </div>

          {/* Pomodoro Timer */}
          <div className="mymind-card" style={{
            padding: '2rem',
            background: colors.pureWhite,
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.06)',
            position: 'relative'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${colors.coral}, ${colors.warmOrange})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>⏱️</span>
            </div>
            <h3 style={{
              fontWeight: '600',
              fontSize: '1.25rem',
              marginBottom: '0.75rem',
              color: colors.deepNavy,
              fontFamily: '"Inter", sans-serif'
            }}>
              Focus Timer
            </h3>
            <p style={{
              color: colors.mutedGray,
              lineHeight: '1.6',
              fontSize: '0.95rem',
              margin: 0
            }}>
              Stay focused with customizable Pomodoro sessions designed for deep work and effective breaks.
            </p>
          </div>

          {/* Progress Tracking */}
          <div className="mymind-card" style={{
            padding: '2rem',
            background: colors.pureWhite,
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.06)',
            position: 'relative'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${colors.yellow}, #ffb300)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
            </div>
            <h3 style={{
              fontWeight: '600',
              fontSize: '1.25rem',
              marginBottom: '0.75rem',
              color: colors.deepNavy,
              fontFamily: '"Inter", sans-serif'
            }}>
              Progress Insights
            </h3>
            <p style={{
              color: colors.mutedGray,
              lineHeight: '1.6',
              fontSize: '0.95rem',
              margin: 0
            }}>
              Track your learning journey with beautiful visualizations and meaningful achievements.
            </p>
          </div>

          {/* Collaboration */}
          <div className="mymind-card" style={{
            padding: '2rem',
            background: colors.pureWhite,
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.06)',
            position: 'relative'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${colors.coral}, ${colors.softPink})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>💬</span>
            </div>
            <h3 style={{
              fontWeight: '600',
              fontSize: '1.25rem',
              marginBottom: '0.75rem',
              color: colors.deepNavy,
              fontFamily: '"Inter", sans-serif'
            }}>
              Study Together
            </h3>
            <p style={{
              color: colors.mutedGray,
              lineHeight: '1.6',
              fontSize: '0.95rem',
              margin: 0
            }}>
              Connect with peers, share knowledge, and learn together in collaborative study spaces.
            </p>
          </div>
        </div>
      </section>

      {/* mymind-style minimal footer */}
      <footer style={{
        padding: '4rem 4rem 3rem',
        background: 'transparent',
        color: colors.mutedGray,
        textAlign: 'center',
        fontSize: '0.9rem',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        marginTop: '6rem'
      }}>
        <p style={{
          margin: 0,
          fontWeight: '400'
        }}>
          © {new Date().getFullYear()} StudySphere · Made for learners everywhere
        </p>
      </footer>
    </div>
  );
};

export default Home; 