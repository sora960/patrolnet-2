import React, { useState, useEffect, useRef } from "react";
import heroImage from "./image.png";
import { BASE_URL } from "./config"; // Assuming BASE_URL is correctly configured
import Announcements from "./components/Announcements";
import { Map, Smartphone, Shield, Users, School, Zap, Waves, Church, Store, ArrowUp, Phone, MessageCircle, ChevronDown, X, AlertTriangle, PhoneCall } from 'lucide-react';
import FeatureModal from "./FeatureModal";
import Footer from "./components/Footer";
import AppInstructions from "./components/AppInstructions";

const styles = {
  pageWrapper: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    color: '#1f2937',
    lineHeight: 1.6,
    position: 'relative',
  },
  
  // Progress Bar
  progressBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    backgroundColor: 'rgba(218, 38, 38, 0.1)',
    zIndex: 9999,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#da2626',
    transition: 'width 0.1s ease',
  },
  
  // Floating Action Buttons
  fabContainer: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    zIndex: 1000,
  },
  
  fab: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#da2626',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(218, 38, 38, 0.4)',
    transition: 'all 0.3s ease',
  },
  
  // Scroll to Top Button
  scrollTopBtn: {
    position: 'fixed',
    bottom: '30px',
    left: '30px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#da2626',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(218, 38, 38, 0.4)',
    transition: 'all 0.3s ease',
    zIndex: 1000,
  },
  
  hero: {
    position: 'relative',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: `linear-gradient(135deg, rgba(218, 38, 38, 0.69), rgba(239, 68, 68, 0.6)), url(${heroImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  },
  
  overlay: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    transition: 'transform 0.1s ease',
  },
  
  heroContent: {
    textAlign: 'center',
    color: 'white',
    padding: '20px',
    maxWidth: '800px',
    position: 'relative',
  },
  
  heroTitle: {
    fontSize: '4rem',
    fontWeight: '900',
    margin: '0 0 10px 0',
    letterSpacing: '-2px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  
  heroSubtitle: {
    fontSize: '2rem',
    fontWeight: '600',
    margin: '0 0 20px 0',
    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
  },
  
  heroDescription: {
    fontSize: '1.2rem',
    margin: '0 0 40px 0',
    opacity: 0.95,
    lineHeight: 1.8,
  },
  
  loginBtn: {
    padding: '18px 48px',
    backgroundColor: 'white',
    color: '#da2626',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  
  scrollIndicator: {
    position: 'absolute',
    bottom: '-100px',
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'white',
    cursor: 'pointer',
    opacity: 0.8,
    transition: 'opacity 0.3s ease',
  },
  
  featuresSection: {
    padding: '80px 20px',
    backgroundColor: '#ffffff',
  },
  
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
  },
  
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
  },
  
  featureCard: {
    textAlign: 'center',
    padding: '40px 20px',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '16px',
    position: 'relative',
    overflow: 'hidden',
  },
  
  featureIcon: {
    fontSize: '3.5rem',
    marginBottom: '20px',
    color: '#da2626',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  featureTitle: {
    fontSize: '1.3rem',
    fontWeight: '700',
    margin: '0 0 12px 0',
    color: '#111827',
  },
  
  featureDesc: {
    fontSize: '0.95rem',
    color: '#6b7280',
    margin: '0 0 20px 0',
    lineHeight: 1.6,
  },
  
  featureButton: {
    padding: '10px 30px',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    marginTop: '10px',
  },
  
  mapSection: {
    padding: '100px 20px',
    backgroundColor: '#f9fafb',
  },
  
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '60px',
  },
  
  sectionTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    margin: '0 0 15px 0',
    color: '#111827',
  },
  
  sectionSubtitle: {
    fontSize: '1.2rem',
    color: '#6b7280',
    margin: 0,
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  
  mapContainer: {
    backgroundColor: 'white',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
  },
  
  mapWrapper: {
    position: 'relative',
    width: '100%',
    height: '500px',
  },
  
  mapIframe: {
    border: 0,
    display: 'block',
  },
  
  mapStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1px',
    backgroundColor: '#e5e7eb',
  },
  
  statItem: {
    backgroundColor: 'white',
    padding: '30px 20px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
  },
  
  statNumber: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#da2626',
    marginBottom: '8px',
  },
  
  statLabel: {
    fontSize: '0.95rem',
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  
  announcementsSection: {
    padding: '100px 20px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
  },

  historySection: {
    position: 'relative',
    backgroundColor: '#f9fafb',
    padding: '100px 0',
  },
  
  historyOverlay: {
    // This style is no longer needed with the new design, but I'll keep it for reference or easy rollback.
    // backgroundColor: 'rgba(218, 38, 38, 0.62)',
    padding: '100px 0',
  },
  
  legendContainer: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    marginBottom: '60px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    border: '3px solid #f59e0b',
  },
  
  legendHeader: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  
  legendBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: 'white',
    padding: '8px 20px',
    borderRadius: '50px',
    fontSize: '0.9rem',
    fontWeight: '600',
    marginBottom: '15px',
    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
  },
  
  legendTitle: {
    fontSize: '2rem',
    color: '#92400e',
    margin: 0,
    fontWeight: '800',
  },
  
  legendContent: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  
  legendText: {
    fontSize: '1.05rem',
    lineHeight: 1.8,
    color: '#44403c',
    marginBottom: '20px',
  },
  
  legendQuote: {
    background: '#fef3c7',
    borderLeft: '5px solid #f59e0b',
    padding: '30px 40px',
    margin: '30px 0',
    borderRadius: '10px',
    position: 'relative',
  },
  
  quoteIcon: {
    fontSize: '3rem',
    color: '#f59e0b',
    opacity: 0.3,
    position: 'absolute',
    top: '10px',
    left: '15px',
  },
  
  quoteText: {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#92400e',
    fontStyle: 'italic',
    margin: 0,
    paddingLeft: '40px',
  },
  
  timelineContainer: {
    background: 'white',
    borderRadius: '20px',
    padding: '50px 40px',
    marginBottom: '60px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  },
  
  timelineTitle: {
    fontSize: '2rem',
    color: '#111827',
    textAlign: 'center',
    margin: '0 0 50px 0',
    fontWeight: '800',
  },
  
  carouselWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  
  carouselButton: {
    background: 'linear-gradient(135deg, #da2626 0%, #f59e0b 100%)',
    border: 'none',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(218, 38, 38, 0.3)',
    transition: 'all 0.3s ease',
    flexShrink: 0,
  },
  
  carouselArrow: {
    color: 'white',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  
  carouselCard: {
    flex: 1,
    background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
    border: '3px solid #da2626',
    minHeight: '280px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease',
  },
  
  carouselMarker: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #da2626 0%, #f59e0b 100%)',
    color: 'white',
    padding: '12px 30px',
    borderRadius: '50px',
    fontWeight: '800',
    fontSize: '1.3rem',
    textAlign: 'center',
    boxShadow: '0 4px 15px rgba(218, 38, 38, 0.3)',
    marginBottom: '25px',
    alignSelf: 'center',
  },
  
  carouselContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  
  carouselTitle: {
    fontSize: '1.8rem',
    color: '#da2626',
    margin: '0 0 15px 0',
    fontWeight: '700',
    textAlign: 'center',
  },
  
  carouselText: {
    fontSize: '1.1rem',
    color: '#4b5563',
    margin: 0,
    lineHeight: 1.8,
    textAlign: 'center',
  },
  
  carouselIndicators: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '30px',
    flexWrap: 'wrap',
  },
  
  indicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid #da2626',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: 0,
  },
  
  indicatorActive: {
    background: '#da2626',
    transform: 'scale(1.3)',
  },
  
  carouselCounter: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '1rem',
    color: '#6b7280',
    fontWeight: '600',
  },
  
  milestonesSection: {
    background: 'white',
    borderRadius: '20px',
    padding: '50px 40px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  },
  
  milestonesTitle: {
    fontSize: '2rem',
    color: '#111827',
    textAlign: 'center',
    margin: '0 0 40px 0',
    fontWeight: '800',
  },
  
  milestonesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
  },
  
  milestoneCard: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    padding: '30px 25px',
    borderRadius: '16px',
    textAlign: 'center',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '2px solid #fbbf24',
    position: 'relative',
    overflow: 'hidden',
  },
  
  milestoneIcon: {
    fontSize: '3rem',
    marginBottom: '15px',
    color: '#92400e',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.3s ease',
  },
  
  milestoneTitle: {
    fontSize: '1.2rem',
    color: '#92400e',
    margin: '0 0 10px 0',
    fontWeight: '700',
  },
  
  milestoneText: {
    fontSize: '0.95rem',
    color: '#78716c',
    margin: 0,
    lineHeight: 1.6,
  },
  
  milestoneExpanded: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '2px solid #fbbf24',
  },
  
  milestoneExtraText: {
    fontSize: '0.9rem',
    color: '#57534e',
    lineHeight: 1.6,
    margin: 0,
  },
  
  expandIndicator: {
    marginTop: '15px',
    fontSize: '1rem',
    color: '#92400e',
    fontWeight: 'bold',
  },
  
  // Tabs
  tabsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '40px',
    flexWrap: 'wrap',
  },
  
  tab: {
    padding: '12px 30px',
    backgroundColor: 'white',
    color: '#6b7280',
    border: '2px solid #e5e7eb',
    borderRadius: '50px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  
  tabActive: {
    backgroundColor: '#da2626',
    color: 'white',
    borderColor: '#da2626',
  },
  
  activitiesSection: {
    padding: '100px 20px',
    backgroundColor: '#ffffff',
  },
  
  activitiesEmpty: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '1.2rem',
    color: '#6b7280',
  },
  
  activitiesCarouselContainer: {
    position: 'relative',
  },
  
  activitiesCarouselWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    justifyContent: 'center',
  },
  
  activityCarouselButton: {
    background: 'linear-gradient(135deg, #da2626 0%, #f59e0b 100%)',
    border: 'none',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(218, 38, 38, 0.3)',
    transition: 'all 0.3s ease',
    flexShrink: 0,
  },
  
  activityCarouselButtonDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  
  activitiesCardsContainer: {
    flex: 1,
    overflow: 'hidden',
    maxWidth: '1100px',
  },
  
  activitiesCardsWrapper: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '25px',
    transition: 'transform 0.4s ease',
  },
  
  activityCarouselIndicators: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '30px',
    flexWrap: 'wrap',
  },
  
  activityCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    height: '500px',
  },
  
  activityImageWrapper: {
    position: 'relative',
    width: '100%',
    height: '220px',
    overflow: 'hidden',
  },
  
  activityImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
  },
  
  activityIcon: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    backgroundColor: 'white',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
  },
  
  activityContent: {
    padding: '25px',
  },
  
  activityTitle: {
    fontSize: '1.3rem',
    fontWeight: '700',
    margin: '0 0 12px 0',
    color: '#111827',
  },
  
  activityDesc: {
    fontSize: '0.95rem',
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.7,
  },
  
  ctaSection: {
    padding: '100px 20px',
    background: 'linear-gradient(135deg, #da2626 0%, #ef4444 100%)',
  },
  
  ctaContent: {
    textAlign: 'center',
    color: 'white',
  },
  
  ctaTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    margin: '0 0 20px 0',
  },
  
  ctaDesc: {
    fontSize: '1.2rem',
    margin: '0 0 40px 0',
    opacity: 0.95,
    maxWidth: '700px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  
  ctaButton: {
    padding: '18px 48px',
    backgroundColor: 'white',
    color: '#da2626',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },

  communityAnnouncementsSection: {
    padding: '100px 20px',
    backgroundColor: '#f9fafb',
  },
  
  announcementCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    height: '500px',
    flex: '1 0 calc(33.333% - 20px)',
  },
  
  announcementImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
  },
  
  announcementContent: {
    padding: '25px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  
  announcementTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  
  announcementDate: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '16px',
  },
  
  announcementDescription: {
    fontSize: '1rem',
    color: '#4b5563',
    lineHeight: 1.6,
    margin: 0,
    flexGrow: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical',
  },
  
  contactSection: {
    padding: '100px 20px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
  },
  
  contactWrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: '60px',
    alignItems: 'flex-start',
    background: '#f9fafb',
    padding: '50px',
    borderRadius: '20px',
  },
  
  contactDetails: {},
  
  contactTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#da2626',
    marginBottom: '20px',
    borderBottom: '2px solid #fde68a',
    paddingBottom: '10px',
  },
  
  contactText: {
    fontSize: '1rem',
    color: '#4b5563',
    margin: '0 0 15px 0',
    lineHeight: 1.7,
  },
  
  contactForm: {},
  
  formInput: {
    width: '100%',
    padding: '15px',
    marginBottom: '20px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
  },
  
  formTextarea: {
    width: '100%',
    padding: '15px',
    marginBottom: '20px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
  },
  
  formSubmitButton: {
    padding: '15px 30px',
    backgroundColor: '#da2626',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(218, 38, 38, 0.3)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    width: '100%',
  },
};

// Add dynamic CSS for animations and interactions
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    /* Fade in animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    .fade-in-up {
      animation: fadeInUp 1s ease-out forwards;
      opacity: 0;
    }
    
    .fade-in-up.delay-1 {
      animation-delay: 0.3s;
    }
    
    .fade-in-up.delay-2 {
      animation-delay: 0.6s;
    }
    
    .fade-in {
      animation: fadeIn 0.5s ease-out;
    }
    
    .pulse-button {
      animation: pulse 2s infinite;
    }
    
    .pulse-button:hover {
      animation: none;
      transform: scale(1.1);
    }
    
    .bounce {
      animation: bounce 2s infinite;
    }
    
    /* Counter animation */
    .counter {
      font-variant-numeric: tabular-nums;
    }
    
    /* Hover effects for buttons */
    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3) !important;
    }
    
    .fab-button:hover {
      transform: scale(1.15) rotate(5deg);
      box-shadow: 0 8px 25px rgba(218, 38, 38, 0.5) !important;
    }
    
    .scroll-top-button:hover {
      transform: scale(1.15);
      box-shadow: 0 8px 25px rgba(218, 38, 38, 0.5) !important;
    }
    
    .carousel-button:hover:not(:disabled) {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(218, 38, 38, 0.4) !important;
    }
    
    /* Feature cards interaction */
    .feature-card-interactive {
      cursor: pointer;
    }
    
    /* Activity and announcement cards */
    .activity-card-hover:hover {
      transform: translateY(-10px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
    }
    
    .activity-card-hover:hover img {
      transform: scale(1.1);
    }
    
    .announcement-card-hover:hover {
      transform: translateY(-10px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
    }
    
    .announcement-card-hover:hover img {
      transform: scale(1.1);
    }
    
    /* Milestone cards */
    .milestone-card-interactive:hover {
      transform: scale(1.05);
      box-shadow: 0 15px 45px rgba(245, 158, 11, 0.3) !important;
    }
    
    .milestone-card-interactive:hover .milestone-icon {
      transform: scale(1.2) rotate(10deg);
    }
    
    /* Timeline card animation */
    .timeline-card-animate {
      animation: fadeIn 0.5s ease-out;
    }
    
    /* Stat items hover */
    .stat-item:hover {
      background-color: #fef3c7 !important;
      transform: translateY(-5px);
    }
    
    /* Tab buttons */
    .tab-button:hover {
      background-color: #fef3c7;
      border-color: #f59e0b;
      color: #92400e;
      transform: translateY(-2px);
    }
    
    /* Form inputs focus */
    input:focus, textarea:focus {
      outline: none;
      border-color: #da2626 !important;
      box-shadow: 0 0 0 3px rgba(218, 38, 38, 0.1);
    }
    
    /* Scroll indicator hover */
    div[style*="scrollIndicator"]:hover {
      opacity: 1 !important;
    }
    
    /* Progress bar glow effect */
    div[style*="progressFill"] {
      box-shadow: 0 0 10px rgba(218, 38, 38, 0.5);
    }
    
    /* Responsive adjustments */
    @media (max-width: 1024px) {
      div[style*="activitiesCardsWrapper"] {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }
    
    @media (max-width: 768px) {
      .fade-in-up {
        animation: fadeInUp 0.8s ease-out forwards;
      }
      
      div[style*="carouselWrapper"],
      div[style*="activitiesCarouselWrapper"] {
        flex-direction: column;
        gap: 15px !important;
      }
      
      button[aria-label*="timeline"],
      button[aria-label*="activities"],
      button[aria-label*="announcements"] {
        width: 50px !important;
        height: 50px !important;
      }
      
      div[style*="carouselCard"] {
        padding: 30px 20px !important;
        min-height: 250px !important;
      }
      
      div[style*="carouselMarker"] {
        font-size: 1.1rem !important;
        padding: 10px 20px !important;
      }
      
      div[style*="carouselTitle"] {
        font-size: 1.4rem !important;
      }
      
      div[style*="carouselText"] {
        font-size: 1rem !important;
      }
      
      div[style*="activitiesCardsWrapper"] {
        grid-template-columns: 1fr !important;
      }
      
      div[style*="contactWrapper"] {
        grid-template-columns: 1fr !important;
      }
      
      div[style*="fabContainer"] {
        bottom: 20px;
        right: 20px;
        gap: 10px;
      }
      
      .fab-button {
        width: 50px !important;
        height: 50px !important;
      }
      
      div[style*="scrollTopBtn"] {
        bottom: 20px;
        left: 20px;
        width: 50px !important;
        height: 50px !important;
      }
      
      div[style*="heroTitle"] {
        font-size: 2.5rem !important;
      }
      
      div[style*="heroSubtitle"] {
        font-size: 1.5rem !important;
      }
      
      div[style*="tabsContainer"] {
        flex-wrap: wrap;
      }
    }
    
    @media (max-width: 480px) {
      button[aria-label*="timeline"],
      button[aria-label*="activities"],
      button[aria-label*="announcements"] {
        width: 45px !important;
        height: 45px !important;
      }
      
      span[style*="carouselArrow"] {
        font-size: 2rem !important;
      }
      
      div[style*="carouselCard"] {
        padding: 25px 15px !important;
        min-height: 220px !important;
      }
      
      div[style*="heroTitle"] {
        font-size: 2rem !important;
      }
      
      div[style*="heroSubtitle"] {
        font-size: 1.2rem !important;
      }
      
      div[style*="sectionTitle"] {
        font-size: 2rem !important;
      }
    }
    
    /* Smooth scrolling */
    html {
      scroll-behavior: smooth;
    }
    
    /* Selection color */
    ::selection {
      background-color: #da2626;
      color: white;
    }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 12px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    
    ::-webkit-scrollbar-thumb {
    
      border-radius: 6px;
    }
    
  `;
  document.head.appendChild(style);
}

// Timeline Data
const timelineData = [
  {
    year: "1930s",
    title: "Early Settlement",
    description: "Dumagat (Aeta) were the first inhabitants. The area was known as Binangonan de Lampon. Famy-Infanta Road was inaugurated."
  },
  {
    year: "1940s",
    title: "World War II Era",
    description: "First bridge built but later bombed by Japanese Army during WWII."
  },
  {
    year: "1950s",
    title: "Post-War Development",
    description: "Second bridge constructed. Eastern Tayabas Bus Co. established service. Area used as hideout by HUKBALAHAP and Battalion Combat Team."
  },
  {
    year: "1962",
    title: "Barangay Independence",
    description: "After land measurement in 1961, Tignoan officially declared as a barangay of Real, separate from Barangay Capalong. First Punong Barangay: Andres Evardome."
  },
  {
    year: "1966",
    title: "Education Begins",
    description: "Tignoan Elementary School established (Grades 1-4 initially)."
  },
  {
    year: "1976",
    title: "First Fiesta",
    description: "August 15 - Inaugural fiesta celebration honoring the Assumption of Mary, the barangay's patron."
  },
  {
    year: "1989",
    title: "Electrification",
    description: "QUEZELCO brings electricity to Barangay Tignoan."
  },
  {
    year: "1996",
    title: "Tourism Era Begins",
    description: "Beach resorts start developing, marking the beginning of tourism. MSK (Munting Sambayanang Kristiyano) formed."
  },
  {
    year: "Present",
    title: "Modern Tignoan",
    description: "A thriving community with growing tourism, education facilities, and strong community spirit under the leadership of Punong Barangay Ariel E. Montes."
  }
];

// Milestones Data with additional details
const milestones = [
  {
    icon: <Users size={48} strokeWidth={1.5} />,
    title: "First Inhabitants",
    description: "Evardome and Atendido families among the 20 founding families",
    details: "These pioneering families laid the foundation for what would become a thriving community, establishing the first settlements and social structures."
  },
  {
    icon: <School size={48} strokeWidth={1.5} />,
    title: "Education Growth",
    description: "From Grade 1-4 (1966) to complete elementary education",
    details: "The expansion of educational facilities has been crucial in developing the community's human capital and providing opportunities for youth."
  },
  {
    icon: <Zap size={48} strokeWidth={1.5} />,
    title: "Electrification",
    description: "QUEZELCO brought power to homes in 1989",
    details: "This milestone transformed daily life, enabling modern conveniences and economic opportunities that were previously impossible."
  },
  {
    icon: <Waves size={48} strokeWidth={1.5} />,
    title: "Tourism Boom",
    description: "Beach resorts development started in 1996",
    details: "Tourism has become a major economic driver, providing employment and showcasing the natural beauty of Tignoan to visitors."
  },
  {
    icon: <Church size={48} strokeWidth={1.5} />,
    title: "Patron Saint",
    description: "Assumption of Mary celebrated every August 15",
    details: "This annual celebration brings the community together in faith and tradition, strengthening social bonds and cultural identity."
  },
  {
    icon: <Store size={48} strokeWidth={1.5} />,
    title: "Local Commerce",
    description: "Talipapa sea-side market opened in 1997",
    details: "The market serves as a vital hub for local trade, connecting fishermen, farmers, and consumers in a vibrant commercial ecosystem."
  }
];

// Gallery Data
const galleryData = [
  {
    image: heroImage, // Using the existing hero image
    caption: "The serene shoreline of Tignoan at dawn."
  },
  {
    image: "/slide.jpg", // Assuming this image exists in your public folder
    caption: "Local fishermen preparing for their morning catch."
  },
  {
    image: "/slide3.jpg", // Assuming this image exists in your public folder
    caption: "A vibrant community gathering at the town plaza."
  },
  {
    image: "/slide4.jpg", // Assuming this image exists in your public folder
    caption: "The lush green hills overlooking the bay."
  },
  {
    image: "/GIS.png", // Assuming this image exists in your public folder
    caption: "An aerial view showcasing the barangay's layout."
  }
];


function Landingpage({ onLoginClick }) {
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filteredContent, setFilteredContent] = useState([]);

  const [animatedStats, setAnimatedStats] = useState({ routes: 0, monitoring: 0, coverage: 0 });
  const [hasAnimatedStats, setHasAnimatedStats] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const statsRef = useRef(null);
  const heroRef = useRef(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/activities`);
        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error("Error fetching activities for landing page:", error);
      }
    };

    fetchActivities();

    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/announcements`);
        if (!response.ok) {
          throw new Error('Failed to fetch announcements');
        }
        const data = await response.json();
        setAnnouncements(data);
      } catch (error) {
        console.error("Error fetching announcements for landing page:", error);
      }
    };

    fetchAnnouncements();

    // Scroll progress and parallax effect
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
      setShowScrollTop(window.scrollY > 500);
    };

    // Mouse move effect for hero
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'announcements') {
      setFilteredContent(announcements);
    } else if (activeTab === 'programs') {
      // Treat all fetched 'activities' as 'programs'
      setFilteredContent(activities);
    } else {
      if (activeTab === 'all') {
        setFilteredContent(activities);
      } else {
        const singularCategory = activeTab.slice(0, -1);
        const filtered = activities.filter(
          (activity) => activity.category?.toLowerCase() === singularCategory
        );
        setFilteredContent(filtered);
      }
    }
  }, [activeTab, activities, announcements]);


  // Animated counter for stats
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedStats) {
            setHasAnimatedStats(true);
            animateValue('routes', 0, 12, 2000);
            animateValue('coverage', 0, 98, 2000);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimatedStats]);

  const animateValue = (key, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      setAnimatedStats(prev => ({ ...prev, [key]: value }));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      icon: <Map size={48} strokeWidth={1.5} />,
      title: "Interactive GIS Mapping",
      description: "Visualize patrol routes and incident hotspots in real-time.",
      color: "#3b82f6",
      details: "Our advanced GIS mapping provides a comprehensive, bird's-eye view of the barangay. Track patrol units, view incident locations, and analyze crime patterns on an interactive map. This powerful tool helps in strategic planning and efficient resource deployment, ensuring all areas receive adequate attention.",
      image: "/GIS.png"
    },
    {
      icon: <Smartphone size={48} strokeWidth={1.5} />,
      title: "Mobile Reporting",
      description: "Instantly report incidents from anywhere in the barangay.",
      color: "#8b5cf6",
      details: "With the PatrolNet mobile app, residents and tanods can report incidents with just a few taps. Attach photos, provide descriptions, and pinpoint the location accurately. This feature ensures that authorities are notified immediately, enabling faster response times to emergencies.",
      image: "/images/features/mobile-reporting.jpg"
    },
    {
      icon: <Shield size={48} strokeWidth={1.5} />,
      title: "Incident Management",
      description: "Track, assign, and resolve incidents efficiently.",
      color: "#10b981",
      details: "Our streamlined incident management system allows administrators to view incoming reports, assign available tanods, and monitor the status of each case from 'Under Review' to 'Resolved'. This ensures every report is handled promptly and effectively, improving accountability and response.",
      image: "/INCDENT.png"
    },
    {
      icon: <Users size={48} strokeWidth={1.5} />,
      title: "Community Network",
      description: "Seamlessly connect residents, officials, and patrol teams.",
      color: "#f59e0b",
      details: "PatrolNet acts as a central communication hub. It bridges the gap between residents, barangay officials, and tanod patrols. Share announcements, send alerts, and foster a collaborative environment where everyone plays a role in maintaining peace and order.",
      image: "https://images.unsplash.com/photo-1538688423619-a81d3f23454b?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600"
    }
  ];

  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
    setShowFeatureModal(true);
  };

  const closeFeatureModal = () => {
    setShowFeatureModal(false);
    // Add a small delay to allow the fade-out animation to complete before clearing the data
    setTimeout(() => {
      setSelectedFeature(null);
    }, 300);
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Scroll Progress Bar */}
      <div style={styles.progressBar}>
        <div style={{...styles.progressFill, width: `${scrollProgress}%`}} />
      </div>

      {/* Floating Action Buttons */}
      <div style={styles.fabContainer}>
        <button 
          className="fab-button"
          style={styles.fab} 
          title="Emergency Hotline" 
          onClick={() => setShowEmergencyModal(true)}
        >
          <Phone size={24} />
        </button>
        <button 
          className="fab-button"
          style={styles.fab} 
          title="Contact Us" 
          onClick={() => setShowContactModal(true)}
        >
          <MessageCircle size={24} />
        </button>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button 
          className="scroll-top-button"
          style={styles.scrollTopBtn} 
          onClick={scrollToTop} 
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} />
        </button>
      )}

      {/* Hero Section with Parallax */}
      <main style={styles.hero} ref={heroRef}>
        <div style={{
          ...styles.overlay,
          transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
        }}>
          <div style={styles.heroContent}>
            <h1 style={styles.heroTitle} className="fade-in-up">PatrolNet</h1>
            <h2 style={styles.heroSubtitle} className="fade-in-up delay-1">Empowering Safer Communities</h2>
            <p style={styles.heroDescription} className="fade-in-up delay-2">
              Real-time incident reporting, optimized patrol management, and seamless community connection.
            </p>
            <button 
              style={styles.loginBtn} 
              className="pulse-button"
              onClick={onLoginClick}
            >
              Log In to Dashboard
            </button>
            <div style={styles.scrollIndicator} onClick={() => scrollToSection('features-section')}>
              <ChevronDown size={32} className="bounce" />
            </div>
          </div>
        </div>
      </main>

      {/* Features Section with Interactive Cards */}
      <section id="features-section" style={styles.featuresSection}>
        <div style={styles.container}>
          <div style={styles.sectionHeader} className="fade-in-up">
            <h3 style={styles.sectionTitle}>Our Features</h3>
            <p style={styles.sectionSubtitle}>
              Cutting-edge technology for modern community safety
            </p>
          </div>
          <div style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card-interactive"
                style={{
                  ...styles.featureCard,
                  backgroundColor: hoveredFeature === index ? feature.color + '10' : 'white',
                  transform: hoveredFeature === index ? 'translateY(-10px) scale(1.02)' : 'translateY(0)',
                  boxShadow: hoveredFeature === index 
                    ? `0 20px 40px ${feature.color}40` 
                    : '0 4px 20px rgba(0, 0, 0, 0.08)'
                }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div onClick={() => handleFeatureClick(feature)}>
                  <div style={{...styles.featureIcon, color: feature.color, transform: hoveredFeature === index ? 'scale(1.2) rotate(5deg)' : 'scale(1)'}}>
                    {feature.icon}
                  </div>
                  <h4 style={styles.featureTitle}>{feature.title}</h4>
                  <p style={styles.featureDesc}>{feature.description}</p>
                </div>
                <button
                  style={{
                    ...styles.featureButton,
                    backgroundColor: feature.color,
                    opacity: hoveredFeature === index ? 1 : 0,
                    transform: hoveredFeature === index ? 'translateY(0)' : 'translateY(10px)'
                  }}
                  onClick={() => handleFeatureClick(feature)}
                >
                  Learn More
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive GIS Map Section */}
      <section style={styles.mapSection} id="map-section">
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Explore Our Barangay</h3>
            <p style={styles.sectionSubtitle}>
              Interactive map showcasing important landmarks, patrol routes, and community resources
            </p>
          </div>

          <div style={styles.mapContainer}>
            <div style={styles.mapWrapper}>
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15424.79901589114!2d121.5835999688373!3d14.67323098985655!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397e9a5a5a5a5a5%3A0x8c8c8c8c8c8c8c8c!2sTignoan%2C%20Real%2C%20Quezon!5e0!3m2!1sen!2sph!4v1680000000000"
                width="100%" 
                height="500" 
                style={styles.mapIframe}
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Barangay GIS Map">
              </iframe>
            </div>
            
            <div style={styles.mapStats} ref={statsRef}>
              <div style={styles.statItem} className="stat-item">
                <div style={styles.statNumber} className="counter">{hasAnimatedStats ? animatedStats.routes : 0}</div>
                <div style={styles.statLabel}>Patrol Routes</div>
              </div>
              <div style={styles.statItem} className="stat-item">
                <div style={styles.statNumber} className="counter">24/7</div>
                <div style={styles.statLabel}>Monitoring</div>
              </div>
              <div style={styles.statItem} className="stat-item">
                <div style={styles.statNumber} className="counter">{hasAnimatedStats ? animatedStats.coverage : 0}%</div>
                <div style={styles.statLabel}>Coverage</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      <section style={styles.announcementsSection}>
        <div style={styles.container}>
          <Announcements showEmergencyContacts={false} showCommunityHub={false} />
        </div>
      </section>

      {/* Feature Modal */}
      {showFeatureModal && (
        <FeatureModal feature={selectedFeature} onClose={closeFeatureModal} />
      )}

      {/* Emergency Hotline Modal */}
      {showEmergencyModal && (
        <EmergencyModal onClose={() => setShowEmergencyModal(false)} />
      )}

      {/* Contact Us Modal */}
      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}

      {/* Redesigned History Section */}
      <section style={styles.historySection}>
        <InteractiveHistory timelineData={timelineData} milestones={milestones} />
      </section>

      {/* Image Gallery Section */}
      <ImageGalleryCarousel galleryData={galleryData} />

      {/* Activities Section with Tabs */}
      <section id="download-section" style={{ backgroundColor: '#f9fafb', paddingTop: '1px', paddingBottom: '1px' }}>
        {/* The AppInstructions component is self-contained with its own styling and layout */}
        <AppInstructions />
      </section>

      <section style={styles.activitiesSection} id="activities-section">
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Community Activities</h3>
            <p style={styles.sectionSubtitle}>
              Recent events and initiatives that make our barangay thrive
            </p>
          </div>

          {/* Interactive Tabs */}
          <div style={styles.tabsContainer}>
            {['all', 'events', 'programs', 'announcements'].map((tab) => (
              <button
                key={tab}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab ? styles.tabActive : {})
                }}
                onClick={() => setActiveTab(tab)}
                className="tab-button"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'announcements' ? (
            <AnnouncementsCarousel announcements={filteredContent} />
          ) : (
            <ActivitiesCarousel activities={filteredContent} />
          )}
        </div>
      </section>

      {/* Call to Action with Animation */}
      <section style={styles.ctaSection}>
        <div style={styles.container}>
          <div style={styles.ctaContent}>
            <h3 style={styles.ctaTitle} className="fade-in-up">Ready to Make a Difference?</h3>
            <p style={styles.ctaDesc} className="fade-in-up delay-1">
              Join our community platform and help build a safer neighborhood for everyone
            </p>
            <button 
              style={styles.ctaButton} 
              className="pulse-button"
              onClick={onLoginClick}
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Image Gallery Carousel Component
function ImageGalleryCarousel({ galleryData }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (isHovering || galleryData.length <= 1) return;

    const timer = setInterval(() => {
      nextImage();
    }, 5000); // Change image every 5 seconds

    return () => {
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isHovering, galleryData.length]);

  const nextImage = () => {
    setCurrentIndex(prev => (prev + 1) % galleryData.length);
  };

  const prevImage = () => {
    setCurrentIndex(prev => (prev - 1 + galleryData.length) % galleryData.length);
  };

  const goToImage = (index) => {
    setCurrentIndex(index);
  };

  const galleryStyles = {
    section: {
      padding: '100px 20px',
      backgroundColor: '#ffffff',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      textAlign: 'center',
      marginBottom: '60px',
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '800',
      color: '#111827',
      marginBottom: '15px',
    },
    subtitle: {
      fontSize: '1.2rem',
      color: '#6b7280',
      maxWidth: '600px',
      margin: '0 auto',
    },
    carouselContainer: {
      position: 'relative',
      maxWidth: '1000px',
      margin: '0 auto',
      background: '#f9fafb',
      borderRadius: '24px',
      padding: '20px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
    },
    mainImageContainer: {
      position: 'relative',
      width: '100%',
      height: '550px',
      borderRadius: '16px',
      overflow: 'hidden',
      cursor: 'pointer',
      marginBottom: '20px',
    },
    mainImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
    },
    caption: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
      color: 'white',
      padding: '40px 20px 20px 20px',
      fontSize: '1.1rem',
      textAlign: 'center',
    },
    navButton: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'rgba(255, 255, 255, 0.8)',
      border: 'none',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      transition: 'all 0.3s ease',
      color: '#1f2937',
      fontSize: '2rem',
    },
    thumbnailsContainer: {
      display: 'flex',
      justifyContent: 'center',
      gap: '15px',
      flexWrap: 'wrap',
    },
    thumbnail: {
      width: '100px',
      height: '70px',
      borderRadius: '8px',
      overflow: 'hidden',
      cursor: 'pointer',
      border: '4px solid transparent',
      transition: 'all 0.3s ease',
      opacity: 0.6,
      position: 'relative',
    },
  };

  return (
    <section style={galleryStyles.section}>
      <div style={galleryStyles.container}>
        <div style={galleryStyles.header}>
          <h3 style={galleryStyles.title}>Scenes from Tignoan</h3>
          <p style={galleryStyles.subtitle}>A glimpse into the beauty and life of our barangay.</p>
        </div>
        <div style={galleryStyles.carouselContainer}>
          <div 
            style={galleryStyles.mainImageContainer}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <img key={currentIndex} src={galleryData[currentIndex].image} alt={galleryData[currentIndex].caption} style={{...galleryStyles.mainImage, animation: 'fadeIn 0.5s'}} />
            <p style={galleryStyles.caption}>{galleryData[currentIndex].caption}</p>
            <button style={{...galleryStyles.navButton, left: '20px'}} onClick={prevImage} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}>‹</button>
            <button style={{...galleryStyles.navButton, right: '20px'}} onClick={nextImage} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}>›</button>
          </div>
          <div style={galleryStyles.thumbnailsContainer}>
            {galleryData.map((item, index) => (
              <div key={index} style={{...galleryStyles.thumbnail, borderColor: currentIndex === index ? '#da2626' : 'transparent', opacity: currentIndex === index ? 1 : 0.6}} onClick={() => goToImage(index)} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <img src={item.image} alt={`Thumbnail ${index + 1}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                {currentIndex === index && <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.2)'}}></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Landingpage;

// Contact Us Modal Component
function ContactModal({ onClose }) {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle, sending, success, error

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus("error");
      return;
    }
    
    setStatus("sending");
    try {
      const response = await fetch(`${BASE_URL}/api/contact-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        console.error("Submission failed:", data.message);
        setStatus("error");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setStatus("error");
    }
  };

  const modalStyles = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, animation: 'fadeIn 0.3s ease'
    },
    container: {
      background: 'white', borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      width: '100%', maxWidth: '550px', maxHeight: '90vh',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      animation: 'modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    header: {
      padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid #e5e7eb', background: 'linear-gradient(135deg, #da2626, #ef4444)', color: 'white',
    },
    title: {
      fontSize: '24px', fontWeight: '700', margin: 0,
      display: 'flex', alignItems: 'center', gap: '12px'
    },
    closeBtn: {
      background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: 'white', cursor: 'pointer',
      width: '40px', height: '40px', borderRadius: '50%', display: 'flex',
      alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
    },
    body: { padding: '32px', overflowY: 'auto' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column' },
    label: { fontWeight: '500', color: '#374151', marginBottom: '8px', fontSize: '0.9rem' },
    input: {
      padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px',
      fontSize: '1rem', transition: 'all 0.2s ease', fontFamily: 'inherit',
    },
    textarea: {
      padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px',
      fontSize: '1rem', transition: 'all 0.2s ease', fontFamily: 'inherit',
      resize: 'vertical', minHeight: '100px'
    },
    submitBtn: {
      background: '#da2626', color: 'white', border: 'none', padding: '15px 24px',
      borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
      transition: 'all 0.2s ease', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: '8px', marginTop: '10px'
    },
    statusMessage: {
      marginTop: '16px', padding: '15px', borderRadius: '8px', fontWeight: '500',
      textAlign: 'center'
    }
  };

  return (
    <div style={modalStyles.backdrop} onClick={onClose}>
      <div style={modalStyles.container} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}><MessageCircle /> Contact Us</h2>
          <button onClick={onClose} style={modalStyles.closeBtn} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}><X size={24} /></button>
        </div>
        <div style={modalStyles.body}>
          {status === 'success' ? (
            <div style={{...modalStyles.statusMessage, background: '#dcfce7', color: '#166534', border: '1px solid #86efac'}}>
              ✅ Message sent successfully! We'll get back to you soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={modalStyles.form}>
              <div style={modalStyles.formGroup}>
                <label htmlFor="name" style={modalStyles.label}>Name:</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" style={modalStyles.input} />
              </div>
              <div style={modalStyles.formGroup}>
                <label htmlFor="email" style={modalStyles.label}>Email:</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email address" style={modalStyles.input} />
              </div>
              <div style={modalStyles.formGroup}>
                <label htmlFor="subject" style={modalStyles.label}>Subject:</label>
                <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="What is this regarding?" style={modalStyles.input} />
              </div>
              <div style={modalStyles.formGroup}>
                <label htmlFor="message" style={modalStyles.label}>Message:</label>
                <textarea id="message" name="message" rows="4" value={formData.message} onChange={handleChange} placeholder="Tell us how we can help you..." style={modalStyles.textarea} />
              </div>
              <button type="submit" disabled={status === "sending"} style={modalStyles.submitBtn}>
                {status === "sending" ? "Sending..." : "Send Message"}
              </button>
              {status === "error" && (
                <div style={{...modalStyles.statusMessage, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5'}}>
                  ❌ Failed to send message. Please fill all fields and try again.
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Emergency Hotline Modal Component
function EmergencyModal({ onClose }) {
  const modalStyles = {
    backdrop: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      animation: 'fadeIn 0.3s ease'
    },
    container: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      animation: 'modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    header: {
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid #e5e7eb',
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: 'white',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    closeBtn: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    body: {
      padding: '32px',
      overflowY: 'auto',
    },
    hotlineItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '20px',
      padding: '16px',
      background: '#f9fafb',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
    },
    hotlineInfo: {
      flex: 1,
    },
    hotlineName: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#1f2937',
      margin: '0 0 4px 0',
    },
    hotlineNumber: {
      fontSize: '1.2rem',
      fontWeight: '700',
      color: '#da2626',
      margin: 0,
    },
  };

  const hotlines = [
    { name: 'Barangay Tignoan Office', number: '(042) 555-0101' },
    { name: 'Local Police Department', number: '117' },
    { name: 'Fire Department', number: '160' },
    { name: 'Municipal Disaster Risk Reduction', number: '(042) 555-0102' },
  ];

  return (
    <div style={modalStyles.backdrop} onClick={onClose}>
      <div style={modalStyles.container} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}><AlertTriangle /> Emergency Hotlines</h2>
          <button onClick={onClose} style={modalStyles.closeBtn} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}><X size={24} /></button>
        </div>
        <div style={modalStyles.body}>
          {hotlines.map((hotline, index) => (
            <div key={index} style={modalStyles.hotlineItem}>
              <PhoneCall size={32} color="#da2626" />
              <div style={modalStyles.hotlineInfo}>
                <h3 style={modalStyles.hotlineName}>{hotline.name}</h3>
                <p style={modalStyles.hotlineNumber}>{hotline.number}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Interactive History Component
function InteractiveHistory({ timelineData, milestones }) {
  const [activeTimelineIndex, setActiveTimelineIndex] = useState(0);
  const timelineRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.index, 10);
            setActiveTimelineIndex(index);
          }
        });
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );

    const elements = timelineRef.current?.querySelectorAll('.timeline-event-card');
    elements?.forEach(el => observer.observe(el));

    return () => elements?.forEach(el => observer.unobserve(el));
  }, [timelineData]);

  const historyStyles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
    header: { textAlign: 'center', marginBottom: '80px' },
    title: { fontSize: '2.5rem', fontWeight: '800', color: '#111827', marginBottom: '15px' },
    subtitle: { fontSize: '1.2rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' },
    
    legendContainer: {
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      borderRadius: '20px',
      padding: '50px',
      marginBottom: '80px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
      border: '2px solid #fde68a',
      textAlign: 'center',
    },
    legendTitle: { fontSize: '2rem', color: '#92400e', fontWeight: '800', marginBottom: '20px' },
    legendText: { fontSize: '1.1rem', lineHeight: 1.8, color: '#44403c', marginBottom: '20px' },
    legendQuote: { fontStyle: 'italic', fontSize: '1.3rem', color: '#92400e', fontWeight: '600', margin: '30px 0' },

    timelineWrapper: { display: 'flex', gap: '50px' },
    timelineNav: { flex: '1', position: 'sticky', top: '150px', height: 'fit-content' },
    timelineNavTitle: { fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px' },
    timelineNavList: { listStyle: 'none', padding: 0, margin: 0, position: 'relative' },
    timelineNavLine: { position: 'absolute', left: '11px', top: '0', bottom: '0', width: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' },
    timelineProgressLine: { position: 'absolute', left: '11px', top: '0', width: '4px', backgroundColor: '#da2626', borderRadius: '2px', transition: 'height 0.3s ease' },
    timelineNavItem: { marginBottom: '15px' },
    timelineNavLink: { display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none', color: '#6b7280', fontWeight: '600', transition: 'all 0.3s ease' },
    timelineNavDot: { width: '26px', height: '26px', borderRadius: '50%', border: '4px solid #e5e7eb', background: 'white', transition: 'all 0.3s ease', zIndex: 1 },
    
    timelineContent: { flex: '2.5', ref: timelineRef },
    timelineEventCard: { background: 'white', borderRadius: '16px', padding: '30px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', border: '1px solid #e5e7eb', transition: 'all 0.3s ease' },
    timelineEventYear: { display: 'inline-block', background: '#da2626', color: 'white', padding: '8px 20px', borderRadius: '50px', fontWeight: '700', marginBottom: '20px' },
    timelineEventTitle: { fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: '0 0 10px 0' },
    timelineEventDesc: { fontSize: '1rem', color: '#4b5563', lineHeight: 1.7, margin: 0 },
  };

  return (
    <div style={historyStyles.container}>
      <div style={historyStyles.header}>
        <h3 style={historyStyles.title}>Our Rich Heritage</h3>
        <p style={historyStyles.subtitle}>Discover the story of Barangay Tignoan - from legend to legacy</p>
      </div>

      <div style={historyStyles.legendContainer}>
        <h4 style={historyStyles.legendTitle}>📜 The Legend of Tignoan</h4>
        <p style={historyStyles.legendText}>
          In a far place in the Philippines, on a slope of Sierra Madre near the shoreline of Lamon Bay, 
          a married couple named <strong>Higno and Noan</strong> resided. They made <em>Tap-ong</em> (rock salt) 
          for a living by boiling salt water in clay pots over fire.
        </p>
        <p style={historyStyles.legendQuote}>
          "Higno-o-o-o-o! Hignoo-o-o-o iga na!"
        </p>
        <p style={historyStyles.legendText}>
          A stranger passing through heard Noan's cries and, unfamiliar with the place, began calling it 
          <strong> "Hignoan"</strong>. Through generations, the name evolved into what we know today as 
          <strong> Tignoan</strong>.
        </p>
      </div>

      <div style={historyStyles.timelineWrapper}>
        <aside style={historyStyles.timelineNav}>
          <h4 style={historyStyles.timelineNavTitle}>Historical Timeline</h4>
          <ul style={historyStyles.timelineNavList}>
            <div style={historyStyles.timelineNavLine}></div>
            <div style={{...historyStyles.timelineProgressLine, height: `${(activeTimelineIndex / (timelineData.length - 1)) * 100}%`}}></div>
            {timelineData.map((item, index) => (
              <li key={index} style={historyStyles.timelineNavItem}>
                <a 
                  href={`#timeline-${index}`} 
                  style={{
                    ...historyStyles.timelineNavLink,
                    color: activeTimelineIndex === index ? '#da2626' : '#6b7280'
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`timeline-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  <div style={{
                    ...historyStyles.timelineNavDot,
                    borderColor: activeTimelineIndex === index ? '#da2626' : '#e5e7eb',
                    transform: activeTimelineIndex === index ? 'scale(1.2)' : 'scale(1)',
                  }}></div>
                  <span>{item.year}</span>
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <div style={historyStyles.timelineContent} ref={timelineRef}>
          {timelineData.map((item, index) => (
            <div 
              key={index} 
              id={`timeline-${index}`} 
              data-index={index}
              className="timeline-event-card"
              style={{
                ...historyStyles.timelineEventCard,
                transform: activeTimelineIndex === index ? 'scale(1.02)' : 'scale(1)',
                boxShadow: activeTimelineIndex === index ? '0 10px 40px rgba(218, 38, 38, 0.2)' : '0 4px 20px rgba(0, 0, 0, 0.08)',
                borderColor: activeTimelineIndex === index ? '#da2626' : '#e5e7eb',
              }}
            >
              <span style={historyStyles.timelineEventYear}>{item.year}</span>
              <h5 style={historyStyles.timelineEventTitle}>{item.title}</h5>
              <p style={historyStyles.timelineEventDesc}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Announcements Carousel Component
function AnnouncementsCarousel({ announcements }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsPerView = 3;

  const nextSlide = () => {
    if (currentIndex < announcements.length - cardsPerView) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const visibleAnnouncements = announcements.slice(currentIndex, currentIndex + cardsPerView);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < announcements.length - cardsPerView;

  if (announcements.length === 0) {
    return (
      <div style={styles.activitiesEmpty}>
        <p>No announcements to display yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div style={styles.activitiesCarouselContainer}>
      <div style={styles.activitiesCarouselWrapper}>
        <button 
          onClick={prevSlide} 
          style={{
            ...styles.activityCarouselButton,
            ...(canGoPrev ? {} : styles.activityCarouselButtonDisabled)
          }}
          disabled={!canGoPrev}
          aria-label="Previous announcements"
          className="carousel-button"
        >
          <span style={styles.carouselArrow}>‹</span>
        </button>

        <div style={styles.activitiesCardsContainer}>
          <div style={styles.activitiesCardsWrapper}>
            {visibleAnnouncements.map((announcement) => (
              <div key={announcement._id} style={styles.announcementCard} className="announcement-card-hover">
                {announcement.image && (
                  <img src={`${BASE_URL}/uploads/${announcement.image}`} alt={announcement.title} style={styles.announcementImage} />
                )}
                <div style={styles.announcementContent}>
                  <h4 style={styles.announcementTitle}>{announcement.title}</h4>
                  <p style={styles.announcementDate}>{new Date(announcement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p style={styles.announcementDescription}>{announcement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={nextSlide} 
          style={{
            ...styles.activityCarouselButton,
            ...(canGoNext ? {} : styles.activityCarouselButtonDisabled)
          }}
          disabled={!canGoNext}
          aria-label="Next announcements"
          className="carousel-button"
        >
          <span style={styles.carouselArrow}>›</span>
        </button>
      </div>

      {announcements.length > cardsPerView && (
        <div style={styles.activityCarouselIndicators}>
          {Array.from({ length: announcements.length - cardsPerView + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              style={{
                ...styles.indicator,
                ...(index === currentIndex ? styles.indicatorActive : {})
              }}
              aria-label={`Go to announcement group ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}


// Activities Carousel Component
function ActivitiesCarousel({ activities }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsPerView = 3;

  const nextSlide = () => {
    if (currentIndex < activities.length - cardsPerView) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const visibleActivities = activities.slice(currentIndex, currentIndex + cardsPerView);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < activities.length - cardsPerView;

  if (activities.length === 0) {
    return (
      <div style={styles.activitiesEmpty}>
        <p>No activities to display yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div style={styles.activitiesCarouselContainer}>
      <div style={styles.activitiesCarouselWrapper}>
        <button 
          onClick={prevSlide} 
          style={{
            ...styles.activityCarouselButton,
            ...(canGoPrev ? {} : styles.activityCarouselButtonDisabled)
          }}
          disabled={!canGoPrev}
          aria-label="Previous activities"
          className="carousel-button"
        >
          <span style={styles.carouselArrow}>‹</span>
        </button>

        <div style={styles.activitiesCardsContainer}>
          <div style={styles.activitiesCardsWrapper}>
            {visibleActivities.map((activity) => (
              <div key={activity.id} style={styles.activityCard} className="activity-card-hover">
                <div style={styles.activityImageWrapper}>
                  <img
                    src={activity.image ? `${BASE_URL}/uploads/${activity.image}` : 'https://via.placeholder.com/400x220/e2e8f0/64748b?text=No+Image'}
                    alt={activity.title}
                    style={styles.activityImage}
                  />                  
                  <div style={styles.activityIcon}>{activity.icon || '📅'}</div>
                </div>
                <div style={styles.activityContent}>
                  <h4 style={styles.activityTitle}>{activity.title}</h4>
                  <p style={styles.activityDesc}>{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={nextSlide} 
          style={{
            ...styles.activityCarouselButton,
            ...(canGoNext ? {} : styles.activityCarouselButtonDisabled)
          }}
          disabled={!canGoNext}
          aria-label="Next activities"
          className="carousel-button"
        >
          <span style={styles.carouselArrow}>›</span>
        </button>
      </div>

      {activities.length > cardsPerView && (
        <div style={styles.activityCarouselIndicators}>
          {Array.from({ length: activities.length - cardsPerView + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              style={{
                ...styles.indicator,
                ...(index === currentIndex ? styles.indicatorActive : {})
              }}
              aria-label={`Go to activity group ${index + 1}`}
            />
          ))}
        </div>
      )}

      {activities.length > cardsPerView && (
        <div style={styles.carouselCounter}>
          Showing {currentIndex + 1}-{Math.min(currentIndex + cardsPerView, activities.length)} of {activities.length}
        </div>
      )}
    </div>
  );
}