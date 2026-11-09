import { useState } from 'react'
import './App.css'

const phone = '254111994579'
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' })
const whatsapp = `https://wa.me/${phone}?text=${encodeURIComponent(
  'Hello Celestique Beauty Spa, I would like to book an appointment. Please share your available services and times.'
)}`

const bookService = (serviceName) => {
  const message = `Hello Celestique Beauty Spa, I would like to book ${serviceName}. Please share your available appointments.`
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

const services = [
  {
    category: 'NAIL CARE',
    name: 'Manicure',
    description: 'Beautifully groomed nails with a polished, elegant finish.',
    image: 'photo-1604654894610-df63bc536371',
  },
  {
    category: 'NAIL CARE',
    name: 'Pedicure',
    description: 'Give your feet the care, comfort and attention they deserve.',
    image: 'photo-1519014816548-bf5fe059798b',
  },
  {
    category: 'NAIL ENHANCEMENT',
    name: 'Gel Application',
    description: 'A glossy, refined finish for beautiful everyday nails.',
    image: 'photo-1610992015732-2449b76344bc',
  },
  {
    category: 'NAIL ENHANCEMENT',
    name: 'Acrylic Nails',
    description: 'Elegant nail extensions with your preferred finish.',
    image: '/images/acrylic-nails.jpg',
  },
  {
    category: 'NAIL ENHANCEMENT',
    name: 'Builder Gel',
    description: 'Beautiful structure, strength and a natural-looking finish.',
    image: 'photo-1604902396830-aca29e19b067',
  },
  {
    category: 'NAIL ENHANCEMENT',
    name: 'Ombré Nails',
    description: 'A seamless blend of colours for a sophisticated look.',
    image: 'photo-1604654894610-df63bc536371',
  },
  {
    category: 'NAIL ENHANCEMENT',
    name: 'Tips Gel & Extensions',
    description: 'Beautifully extended nails tailored to your style.',
    image: '/images/nail-extensions.jpg',
  },
  {
    category: 'BROW & LASH',
    name: 'Eyebrow Shaping',
    description: 'Enhance your natural features with beautifully shaped brows.',
    image: '/images/lashes-eyebrows.jpg',
  },
  {
    category: 'BROW & LASH',
    name: 'Eyebrow Tinting',
    description: 'Add definition and depth to your natural brows.',
    image: 'photo-1512496015851-a90fb38ba796',
  },
  {
    category: 'BROW & LASH',
    name: 'Eyelash Application',
    description: 'Elevate your look with beautifully enhanced lashes.',
    image: '/images/lashes-eyebrows.jpg',
  },
  {
    category: 'SKINCARE',
    name: 'Facial Skincare',
    description: 'A refreshing skincare experience focused on your glow.',
    image: 'photo-1570172619644-dfd03ed5d881',
  },
]

const gallery = [
  '/images/acrylic-nails.jpg',
  '/images/lashes-eyebrows.jpg',
  '/images/nail-extensions.jpg',
]

function photo(id, width = 700) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const submitBooking = (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const message = `Hello Celestique Beauty Spa, I would like to request an appointment.

Name: ${data.get("name")}
Phone: ${data.get("phone")}
Service: ${data.get("service")}
Preferred date: ${data.get("date")}
Preferred time: ${data.get("time")}
Additional message: ${data.get("message") || "None"}

Please confirm availability. Thank you.`
    window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  return (
    <main>
      <div className="announcement">
        <span>YOUR BEAUTY, YOUR SIGNATURE</span>
        <span>SHAMAKHOKHO, VIHIGA COUNTY</span>
      </div>

      <header className="navbar">
        <a className="brand" href="#home" onClick={closeMenu}>
          <img src="/images/celestique-logo.jpg" alt="Celestique Beauty Spa" className="brand-logo" />
          <span className="brand-name">Celestique</span>
          <span className="brand-subtitle">BEAUTY SPA</span>
        </a>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          {[
            ['Home', '#home'],
            ['About', '#about'],
            ['Services', '#services'],
            ['Gallery', '#gallery'],
            ['Contact', '#contact'],
          ].map(([label, href]) => (
            <a key={label} href={href} onClick={closeMenu}>
              {label}
            </a>
          ))}
          <a className="nav-book" href={whatsapp} target="_blank" rel="noreferrer">
            Book Appointment ↗
          </a>
        </nav>
      </header>

      <section className="hero" id="home">
        <div className="hero-content">
          <span className="eyebrow">WELCOME TO CELESTIQUE BEAUTY SPA</span>
          <h1>
            Discover your
            <br />
            <em>beautiful</em> side.
          </h1>
          <p>
            A little self-care goes a long way. Experience beauty,
            elegance and confidence with our range of beauty treatments.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={whatsapp} target="_blank" rel="noreferrer">
              Book Your Experience ↗
            </a>
            <a className="btn btn-outline" href="#services">
              Explore Services
            </a>
          </div>
          <div className="hero-note">
            <span className="gold-line" />
            YOUR MOMENT. YOUR BEAUTY. YOUR GLOW.
          </div>
        </div>

        <div className="hero-image">
          <img
            src={photo('photo-1522337360788-8b13dee7a37e', 1100)}
            alt="Beauty and skincare experience"
          />
          <div className="image-caption">
            <span>THE CELESTIQUE EXPERIENCE</span>
            <span>01 — BEAUTY & WELLNESS</span>
          </div>
          <div className="hero-seal">
            <span>✦</span>
            BEAUTY
            <br />
            BEGINS
            <br />
            WITH YOU
          </div>
        </div>
      </section>

      <section className="intro-strip">
        <span>BEAUTY</span>
        <span>✦</span>
        <span>CONFIDENCE</span>
        <span>✦</span>
        <span>ELEGANCE</span>
        <span>✦</span>
        <span>SELF-CARE</span>
      </section>

      <section className="section about-section" id="about">
        <div className="about-image">
          <img
            src={photo('photo-1540555700478-4be289fbecef', 900)}
            alt="Relaxing beauty spa atmosphere"
            loading="lazy"
          />
          <span className="about-image-label">A SPACE TO FEEL BEAUTIFUL</span>
        </div>

        <div className="about-content">
          <span className="eyebrow">A LITTLE ABOUT US</span>
          <h2>Beauty is an art.<br /><em>Let us make it yours.</em></h2>
          <p>
            Welcome to Celestique Beauty Spa, your destination for beauty
            and personal care in Shamakhokho, Vihiga County.
          </p>
          <p>
            From beautifully finished nails to brow, lash and facial
            skincare treatments, we are here to help you look and feel
            your best.
          </p>
          <a href="#services" className="text-link">DISCOVER OUR SERVICES ↗</a>
        </div>
      </section>

      <section className="services-section section" id="services">
        <div className="section-heading">
          <div>
            <span className="eyebrow">WHAT WE OFFER</span>
            <h2>Made for your <em>glow.</em></h2>
          </div>
          <p>
            Explore our beauty treatments and find the perfect experience
            for your personal style.
          </p>
        </div>

        <div className="service-grid">
          {services.map((service, index) => (
            <article className="service-card" key={service.name}>
              <div className="service-image">
                <img
                  src={service.image.startsWith('/') ? service.image : photo(service.image, 650)}
                  alt={service.name}
                  loading="lazy"
                />
                <span className="service-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="service-info">
                <span className="service-category">{service.category}</span>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <a
                  href={bookService(service.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="service-link"
                >
                  ENQUIRE & BOOK ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="gallery-section section" id="gallery">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A TOUCH OF BEAUTY</span>
            <h2>Beauty in every <em>detail.</em></h2>
          </div>
          <p>Explore the world of beauty, care and elegance.</p>
        </div>
        <div className="gallery-grid">
          {gallery.map((id, index) => (
            <div className="gallery-item" key={id + index}>
              <img src={id} alt={`Celestique Beauty Spa service ${index + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      <section className="booking-banner" id="booking">
        <span className="eyebrow">YOUR BEAUTY JOURNEY STARTS HERE</span>
        <h2>Make time for <em>yourself.</em></h2>
        <p>Request your preferred appointment at Celestique Beauty Spa.</p>

        <form className="booking-form" onSubmit={submitBooking}>
          <div className="booking-fields">
            <label>Full name
              <input name="name" type="text" placeholder="Your full name" required />
            </label>

            <label>Phone number
              <input name="phone" type="tel" placeholder="Your WhatsApp number" required />
            </label>

            <label>Choose a service
              <select name="service" defaultValue="" required>
                <option value="" disabled>Select a service</option>
                {services.map((service) => (
                  <option key={service.name} value={service.name}>{service.name}</option>
                ))}
              </select>
            </label>

            <label>Preferred date
              <input name="date" type="date" min={today} required />
            </label>

            <label>Preferred time
              <select name="time" defaultValue="" required>
                <option value="" disabled>Select a preferred time</option>
                <option>8:00 AM</option>
                <option>9:00 AM</option>
                <option>10:00 AM</option>
                <option>11:00 AM</option>
                <option>12:00 PM</option>
                <option>1:00 PM</option>
                <option>2:00 PM</option>
                <option>3:00 PM</option>
                <option>4:00 PM</option>
                <option>5:00 PM</option>
              </select>
            </label>

            <label className="booking-message">Additional message (optional)
              <textarea name="message" rows="3" placeholder="Any preferences or details we should know?" />
            </label>
          </div>

          <button className="btn btn-light booking-submit" type="submit">
            Send Booking Request via WhatsApp ↗
          </button>
          <small className="booking-note">Your appointment is confirmed only after Celestique checks availability and responds.</small>
        </form>
      </section>

      <section className="contact-section section" id="contact">
        <div className="contact-intro">
          <span className="eyebrow">WE WOULD LOVE TO SEE YOU</span>
          <h2>Come say <em>hello.</em></h2>
          <p>
            Ready for your next beauty experience? Reach out or visit
            Celestique Beauty Spa.
          </p>
          <a className="btn btn-primary" href={whatsapp} target="_blank" rel="noreferrer">
            Chat with us on WhatsApp ↗
          </a>
        </div>

        <div className="contact-details">
          <div>
            <span className="contact-label">CALL / WHATSAPP</span>
            <a href="tel:+254111994579">+254 111 994 579</a>
          </div>
          <div>
            <span className="contact-label">EMAIL</span>
            <a href="mailto:andayitimothy48@gmail.com">
              andayitimothy48@gmail.com
            </a>
          </div>
          <div>
            <span className="contact-label">FIND US</span>
            <p>Shamakhokho, Hamisi Constituency,<br />Vihiga County, Kenya.<br />Along Kisumu–Kapsabet Road.</p>
            <a
              className="text-link"
              href="https://www.google.com/maps/search/?api=1&query=Shamakhokho%2C+Vihiga+County%2C+Kenya"
              target="_blank"
              rel="noreferrer"
            >
              GET DIRECTIONS ↗
            </a>
          </div>
          <div>
            <span className="contact-label">OPENING HOURS</span>
            <p>Monday – Saturday</p>
            <strong>8:00 AM – 6:00 PM</strong>
            <p className="closed-note">Sunday — Closed</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <img src="/images/celestique-logo.jpg" alt="Celestique Beauty Spa" className="brand-logo" />
        </a>
        <p>Beauty • Elegance • Confidence</p>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Celestique Beauty Spa. All rights reserved.</span>
          <span>Digital experience by Taifatech Solutions</span>
        </div>
      </footer>
    </main>
  )
}

export default App
