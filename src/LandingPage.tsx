import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import {
  Compass,
  MapPin,
  Mountain,
  Utensils,
  History,
  Sparkles,
  Route,
  MessageSquare,
  ChevronRight,
  Star,
  ArrowRight,
  Globe,
  Shield,
  Zap,
  Heart,
  Navigation,
  Plane,
  Camera,
  Menu,
  X
} from 'lucide-react';
import { cn } from './lib/utils';

const APP_URL = '#/app';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, isInView };
}

const FEATURES = [
  {
    icon: <MessageSquare className="w-7 h-7" />,
    title: "AI Travel Guide",
    description: "Chat with Raahi in English or Urdu. Get personalized recommendations for every province, city, and hidden trail across Pakistan.",
    gradient: "from-emerald-500 to-teal-600",
    delay: 0
  },
  {
    icon: <MapPin className="w-7 h-7" />,
    title: "Hidden Gems",
    description: "Discover secret spots that most tourists miss — from untouched valleys in Chitral to ancient Sufi shrines in Sindh.",
    gradient: "from-amber-500 to-orange-600",
    delay: 0.15
  },
  {
    icon: <Route className="w-7 h-7" />,
    title: "Smart Itineraries",
    description: "Get AI-crafted travel plans with budgets, best seasons, transportation, and local food recommendations — all in seconds.",
    gradient: "from-violet-500 to-purple-600",
    delay: 0.3
  }
];

const DESTINATIONS = [
  {
    name: "Hunza Valley",
    tagline: "The Shangri-La of Karakoram",
    image: "https://naturehikepakistan.pk/wp-content/uploads/2024/03/gulmit-a-min.jpeg",
    category: "Mountains"
  },
  {
    name: "Badshahi Mosque",
    tagline: "Mughal Grandeur in Lahore",
    image: "https://media.istockphoto.com/id/1386446426/photo/badshahi-mosque.jpg?s=612x612&w=0&k=20&c=vShhc9rb17q_5k-tx_HJnlDvlE4YjCNNlOCEWplI2_Y=",
    category: "Heritage"
  },
  {
    name: "Fairy Meadows",
    tagline: "Gateway to Nanga Parbat",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600",
    category: "Adventure"
  },
  {
    name: "Gwadar Beach",
    tagline: "Golden Sands & Blue Waters",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600",
    category: "Coastal"
  },
  {
    name: "Skardu",
    tagline: "Land of Giants & Lakes",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=600",
    category: "Lakes"
  },
  {
    name: "Mohenjo-daro",
    tagline: "Cradle of Civilization",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80&w=600",
    category: "Ancient"
  }
];

const STEPS = [
  {
    step: "01",
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Ask Raahi",
    description: "Type any question about Pakistan — destinations, food, culture, budget, or hidden gems.",
    color: "emerald"
  },
  {
    step: "02",
    icon: <Sparkles className="w-6 h-6" />,
    title: "Get AI Insights",
    description: "Raahi crafts detailed, personalized responses with local knowledge and insider tips.",
    color: "amber"
  },
  {
    step: "03",
    icon: <Plane className="w-6 h-6" />,
    title: "Start Your Journey",
    description: "Use your custom itinerary to explore Pakistan like a local — with confidence and wonder.",
    color: "violet"
  }
];

const TESTIMONIALS = [
  {
    quote: "Raahi helped me discover Kalash Valley — a place I never knew existed. The itinerary was perfect, down to the chai stops!",
    author: "Sarah Ahmed",
    role: "Travel Blogger",
    avatar: "S"
  },
  {
    quote: "As a foreigner visiting Pakistan, Raahi made me feel like I had a local friend guiding me through every city. Incredible experience.",
    author: "James Wilson",
    role: "Photographer",
    avatar: "J"
  },
  {
    quote: "The food recommendations alone were worth it. I tasted dishes in Peshawar I would have never found on my own. Shukriya Raahi!",
    author: "Fatima Noor",
    role: "Food Enthusiast",
    avatar: "F"
  }
];

const STATS = [
  { value: "150+", label: "Destinations" },
  { value: "4", label: "Provinces" },
  { value: "24/7", label: "AI Support" },
  { value: "Free", label: "To Use" }
];

// Floating particles component
function FloatingParticles() {
  return (
    <div className="floating-particles">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);
  
  const featuresView = useInView(0.1);
  const destView = useInView(0.1);
  const stepsView = useInView(0.1);
  const testimonialsView = useInView(0.1);
  const ctaView = useInView(0.1);

  return (
    <div className="landing-page">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="landing-nav"
      >
        <div className="landing-nav-inner">
          <div className="nav-brand">
            <div className="nav-logo">
              <Compass className="w-5 h-5" />
            </div>
            <span className="nav-title">Raahi</span>
          </div>

          <div className="nav-links-desktop">
            <a href="#features" className="nav-link">Features</a>
            <a href="#destinations" className="nav-link">Destinations</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-cta-btn"
            >
              Launch App
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <button
            className="nav-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="nav-mobile-menu"
            >
              <a href="#features" className="nav-mobile-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#destinations" className="nav-mobile-link" onClick={() => setMobileMenuOpen(false)}>Destinations</a>
              <a href="#how-it-works" className="nav-mobile-link" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              <a
                href={APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-cta-btn nav-mobile-cta"
                onClick={() => setMobileMenuOpen(false)}
              >
                Launch App
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <motion.section className="hero-section" style={{ opacity: heroOpacity }}>
        <div className="hero-bg">
          <img
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1800"
            alt="Mountain landscape"
            className="hero-bg-image"
          />
          <div className="hero-aurora" />
          <div className="hero-grid-overlay" />
          <FloatingParticles />
        </div>

        <motion.div style={{ scale: heroScale }} className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="hero-title"
          >
            Discover Pakistan
            <br />
            <span className="hero-title-accent">Like Never Before</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="hero-subtitle"
          >
            Your AI-powered travel companion that knows every mountain trail,
            hidden valley, and street food stall across the land of the pure.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="hero-actions"
          >
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-btn-primary"
            >
              <Compass className="w-5 h-5" />
              Start Your Journey
              <ChevronRight className="w-5 h-5 hero-btn-arrow" />
            </a>
            <a href="#features" className="hero-btn-secondary">
              Explore Features
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="hero-stats"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="hero-stat">
                <div className="hero-stat-value">{stat.value}</div>
                <div className="hero-stat-label">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="scroll-indicator"
        >
          <div className="scroll-mouse">
            <div className="scroll-dot" />
          </div>
          <span>Scroll to explore</span>
        </motion.div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FEATURES SECTION */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="features" className="features-section" ref={featuresView.ref}>
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={featuresView.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="section-header"
          >
            <span className="section-tag">
              <Zap className="w-4 h-4" />
              Features
            </span>
            <h2 className="section-title">
              Everything You Need to
              <br />
              <span className="text-gradient-emerald">Explore Pakistan</span>
            </h2>
            <p className="section-description">
              Raahi combines the wisdom of local guides with the power of AI to create
              the ultimate Pakistan travel experience.
            </p>
          </motion.div>

          <div className="features-grid">
            {FEATURES.map((feature, i) => (
              <motion.a
                key={feature.title}
                href={APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 50 }}
                animate={featuresView.isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: feature.delay }}
                className="feature-card"
              >
                <div className={cn("feature-icon-wrapper", `bg-gradient-to-br ${feature.gradient}`)}>
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-link">
                  Try it now <ArrowRight className="w-4 h-4" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DESTINATIONS SECTION */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="destinations" className="destinations-section" ref={destView.ref}>
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={destView.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="section-header"
          >
            <span className="section-tag">
              <Globe className="w-4 h-4" />
              Destinations
            </span>
            <h2 className="section-title">
              From Peaks to
              <br />
              <span className="text-gradient-amber">Ancient Ruins</span>
            </h2>
            <p className="section-description">
              Explore the breathtaking diversity of Pakistan — towering mountains,
              pristine beaches, ancient civilizations, and vibrant cities.
            </p>
          </motion.div>

          <div className="destinations-grid">
            {DESTINATIONS.map((dest, i) => (
              <motion.a
                key={dest.name}
                href={APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 40 }}
                animate={destView.isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="destination-card"
              >
                <div className="destination-image-wrapper">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="destination-image"
                    loading="lazy"
                  />
                  <div className="destination-overlay" />
                  <span className="destination-category">{dest.category}</span>
                </div>
                <div className="destination-info">
                  <h3 className="destination-name">{dest.name}</h3>
                  <p className="destination-tagline">{dest.tagline}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="steps-section" ref={stepsView.ref}>
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={stepsView.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="section-header"
          >
            <span className="section-tag">
              <Navigation className="w-4 h-4" />
              How It Works
            </span>
            <h2 className="section-title">
              Three Steps to Your
              <br />
              <span className="text-gradient-violet">Perfect Adventure</span>
            </h2>
          </motion.div>

          <div className="steps-grid">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 50 }}
                animate={stepsView.isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: i * 0.2 }}
                className="step-card"
              >
                <div className="step-number">{step.step}</div>
                <div className={cn("step-icon", `step-icon-${step.color}`)}>
                  {step.icon}
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
                {i < STEPS.length - 1 && (
                  <div className="step-connector">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TESTIMONIALS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="testimonials-section" ref={testimonialsView.ref}>
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={testimonialsView.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="section-header"
          >
            <span className="section-tag">
              <Heart className="w-4 h-4" />
              Loved by Travelers
            </span>
            <h2 className="section-title">
              What Explorers
              <br />
              <span className="text-gradient-emerald">Are Saying</span>
            </h2>
          </motion.div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, y: 40 }}
                animate={testimonialsView.isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="testimonial-card"
              >
                <div className="testimonial-stars">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.avatar}</div>
                  <div>
                    <div className="testimonial-name">{t.author}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FOOTER CTA */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="cta-section" ref={ctaView.ref}>
        <div className="cta-aurora" />
        <div className="section-container cta-content">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={ctaView.isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="cta-inner"
          >
            <h2 className="cta-title">
              Ready to Explore
              <br />
              <span className="text-gradient-gold">Pakistan?</span>
            </h2>
            <p className="cta-subtitle">
              Start a conversation with Raahi and discover the beauty, culture,
              and hidden gems of one of the world's most stunning countries.
            </p>
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn"
            >
              <Compass className="w-5 h-5" />
              Launch Raahi Now
              <ArrowRight className="w-5 h-5" />
            </a>
            <p className="cta-footnote">
              Free to use • No sign-up required
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="nav-logo">
              <Compass className="w-5 h-5" />
            </div>
            <span className="nav-title">Raahi</span>
          </div>
          <p className="footer-tagline">
            "Safar hai shart, musafir nawaz bohot hain"
          </p>
          <div className="footer-divider" />
          <p className="footer-copyright">
            © 2026 Raahi — Pakistan's AI Tourism Guide. Built with ❤️ and Gemini.
          </p>
        </div>
      </footer>
    </div>
  );
}
