import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
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
      price: 'KSh 350',
    description: 'Beautifully groomed nails with a polished, elegant finish.',
    image: '/images/bomalistica-nails-1.jpg',
  },
  {
    category: 'NAIL CARE',
    name: 'Pedicure',
      price: 'Half: KSh 350 · Full: KSh 500',
    description: 'Give your feet the care, comfort and attention they deserve.',
    image: '/images/bomalistica-nails-2.jpg',
  },
  {
    category: 'NAIL ENHANCEMENT',
    name: 'Gel Application',
      price: 'KSh 350',
    description: 'A glossy, refined finish for beautiful everyday nails.',
    image: '/images/bomalistica-nails-3.jpg',
  },
  {
    category: 'NAIL ENHANCEMENT',
    name: 'Acrylic Nails',
      price: 'KSh 1,500–2,000',
    description: 'Elegant nail extensions with your preferred finish.',
    image: '/images/acrylic-nails.jpg',
  },
  {
    category: 'NAIL ENHANCEMENT',
    name: 'Builder Gel',
      price: 'KSh 500–800',
    description: 'Beautiful structure, strength and a natural-looking finish.',
    image: '/images/bomalistica-nails-4.jpg',
  },
  {
    category: 'NAIL ENHANCEMENT',
    name: 'Ombré Nails',
      price: 'KSh 800',
    description: 'A seamless blend of colours for a sophisticated look.',
    image: '/images/bomalistica-nails-5.jpg',
  },
  {
    category: 'NAIL ENHANCEMENT',
    name: 'Tips Gel & Extensions',
      price: 'KSh 600–800',
    description: 'Beautifully extended nails tailored to your style.',
    image: '/images/nail-extensions.jpg',
  },
  {
    category: 'BROW & LASH',
    name: 'Eyebrow Shaping',
      price: 'KSh 50',
    description: 'Enhance your natural features with beautifully shaped brows.',
    image: '/images/lashes-eyebrows.jpg',
  },
  {
    category: 'BROW & LASH',
    name: 'Eyebrow Tinting',
      price: 'KSh 100',
    description: 'Add definition and depth to your natural brows.',
    image: 'photo-1512496015851-a90fb38ba796',
  },
  {
    category: 'BROW & LASH',
    name: 'Eyelash Application',
      price: 'KSh 500–1,500',
    description: 'Elevate your look with beautifully enhanced lashes.',
    image: '/images/lashes-eyebrows.jpg',
  },
  {
    category: 'SKINCARE',
    name: 'Facial Skincare',
      price: 'KSh 500',
    description: 'A refreshing skincare experience focused on your glow.',
    image: 'photo-1570172619644-dfd03ed5d881',
  },
]

const packages = [
  { name: 'Tips Gel + Pedicure', price: 'KSh 1,000' },
  { name: 'Manicure + Pedicure + Gel Application', price: 'KSh 1,100' },
  { name: 'Full Body / Combo', description: 'Facial + Tips Gel + Builder Gel + Pedicure + Manicure + Eyelashes', price: 'KSh 3,000' },
  { name: 'Gel Hands and Legs', price: 'KSh 600' },
]

const gallery = [
  '/images/bomalistica-nails-1.jpg',
  '/images/bomalistica-nails-2.jpg',
  '/images/bomalistica-nails-3.jpg',
  '/images/bomalistica-nails-4.jpg',
  '/images/bomalistica-nails-5.jpg',
]

function photo(id, width = 700) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingMessage, setBookingMessage] = useState("")
  const [bookingWhatsAppUrl, setBookingWhatsAppUrl] = useState("")
  const [activeServices, setActiveServices] = useState([])
  const [activePackages, setActivePackages] = useState([])
  const [businessHours, setBusinessHours] = useState([])
  const [blockedDates, setBlockedDates] = useState([])
  const [publishedGallery, setPublishedGallery] = useState([])
  const [publishedSiteAssets, setPublishedSiteAssets] = useState([])
  const [selectedBookingDate, setSelectedBookingDate] = useState("")
  const [selectedBookingTime, setSelectedBookingTime] = useState("")
  const [dateMessage, setDateMessage] = useState("")

  const findSiteAsset = type => publishedSiteAssets.find(asset => asset.asset_type === type)
  const getSiteAssetUrl = type => {
    const asset = findSiteAsset(type)
    return asset?.public_path
      ? supabase.storage.from("site-assets-public").getPublicUrl(asset.public_path).data.publicUrl
      : null
  }

  const getSiteAssetAlt = (type, fallback) => {
    return findSiteAsset(type)?.alt_text || fallback
  }

  const publishedOtherAssets = publishedSiteAssets
    .filter(asset => asset.asset_type === "other" && asset.public_path)
    .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0))

  useEffect(() => {
    let cancelled = false
    const loadSiteAssets = async () => {
      const { data, error } = await supabase.from("site_assets")
        .select("asset_type, service_id, public_path, alt_text, display_order")
        .eq("is_published", true)
      if (error) {
        console.error("Could not load published website images:", error)
        return
      }
      if (!cancelled) setPublishedSiteAssets(data || [])
    }
    loadSiteAssets()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadServices = async () => {
      const { data, error } = await supabase.from("services").select("id, name, category, description, price_label, is_active, image_path").eq("is_active", true).order("display_order", { ascending: true })
      if (error) { console.error("Could not load services:", error); return }
      const live = data.map(item => {
        const original = services.find(service => service.name === item.name)
        const managedImage = item.image_path
        ? supabase.storage.from("site-assets-public").getPublicUrl(item.image_path).data.publicUrl
        : null
      return {
        ...original,
        ...item,
        image: managedImage || original?.image,
        imageAlt: publishedSiteAssets.find(
          asset => asset.asset_type === "service" && asset.service_id === item.id
        )?.alt_text || item.name,
        category: original?.category || (item.category || "").toUpperCase(),
        price: item.price_label || original?.price || ""
      }
      })
      if (!cancelled) setActiveServices(live)
    }
    loadServices()
    return () => { cancelled = true }
  }, [publishedSiteAssets])

  useEffect(() => {
    let cancelled = false
    const loadPackages = async () => {
      const { data, error } = await supabase.from("packages").select("name, description, price, price_label, is_active").eq("is_active", true).order("display_order", { ascending: true })
      if (error) { console.error("Could not load packages:", error); return }
      const live = data.map(item => {
        const original = packages.find(pkg => pkg.name === item.name)
        const price = item.price_label || (item.price != null ? `KSh ${Number(item.price).toLocaleString("en-KE")}` : original?.price || "")
        return { ...original, ...item, price }
      })
      if (!cancelled) setActivePackages(live)
    }
    loadPackages()
    return () => { cancelled = true }
  }, [])


  useEffect(() => {
    const loadBusinessHours = async () => {
      const { data, error } = await supabase
        .from("business_hours")
        .select("day_of_week, opening_time, closing_time, is_closed")
        .order("day_of_week")

      if (error) {
        console.error("Could not load business hours:", error)
        return
      }

      setBusinessHours(data || [])
    }

    loadBusinessHours()
  }, [])


  useEffect(() => {
    const loadBlockedDates = async () => {
      const { data, error } = await supabase
        .from("blocked_dates")
        .select("blocked_date")

      if (error) {
        console.error("Could not load blocked dates:", error)
        return
      }

      setBlockedDates((data || []).map(item => item.blocked_date))
    }

    loadBlockedDates()
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadPublishedGallery = async () => {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("id, storage_path, caption")
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Could not load gallery photos:", error)
        return
      }

      const photos = (data || []).map(item => ({
        ...item,
        url: supabase.storage
          .from("gallery-photos")
          .getPublicUrl(item.storage_path).data.publicUrl
      }))

      if (!cancelled) setPublishedGallery(photos)
    }

    loadPublishedGallery()
    return () => { cancelled = true }
  }, [])

  const handleBookingDateChange = (event) => {
    const selectedDate = event.target.value
    setSelectedBookingTime("")
    if (!selectedDate) {
      setSelectedBookingDate("")
      setDateMessage("")
      return
    }

    if (blockedDates.includes(selectedDate)) {
      setSelectedBookingDate("")
      event.target.value = ""
      setDateMessage("The salon is unavailable on this date. Please choose another day.")
      return
    }

    const dayOfWeek = new Date(selectedDate + "T00:00:00Z").getUTCDay()
    const schedule = businessHours.find(day => day.day_of_week === dayOfWeek)

    if (!schedule || schedule.is_closed) {
      setSelectedBookingDate("")
      event.target.value = ""
      setDateMessage(!schedule
        ? "Business hours are unavailable. Please try again."
        : "The salon is closed on this date. Please choose another day.")
      return
    }

    setSelectedBookingDate(selectedDate)
    setDateMessage("")
    setBookingMessage("")
  }


  const selectedDayOfWeek = selectedBookingDate
    ? new Date(selectedBookingDate + "T00:00:00Z").getUTCDay()
    : -1

  const selectedDayHours = businessHours.find(
    day => day.day_of_week === selectedDayOfWeek
  )

  const availableBookingTimes = []

  if (selectedDayHours && !selectedDayHours.is_closed) {
    const [openHour, openMinute] = selectedDayHours.opening_time.split(":").map(Number)
    const [closeHour, closeMinute] = selectedDayHours.closing_time.split(":").map(Number)
    const openingMinutes = openHour * 60 + openMinute
    const closingMinutes = closeHour * 60 + closeMinute

    for (let minutes = openingMinutes; minutes < closingMinutes; minutes += 60) {
      const hour = Math.floor(minutes / 60)
      const minute = minutes % 60
      const period = hour >= 12 ? "PM" : "AM"
      const displayHour = hour % 12 || 12
      availableBookingTimes.push(
        `${displayHour}:${String(minute).padStart(2, "0")} ${period}`
      )
    }
  }

  const closeMenu = () => setMenuOpen(false)

  const submitBooking = async (event) => {
    event.preventDefault()
    if (bookingLoading) return

    const data = new FormData(event.currentTarget)
    setBookingLoading(true)
    setBookingMessage("")
    setBookingWhatsAppUrl("")

    const requestedDate = String(data.get("date") || "")
    const requestedTime = String(data.get("time") || "")
    const requestedDay = new Date(requestedDate + "T00:00:00Z").getUTCDay()
    const requestedSchedule = businessHours.find(
      day => day.day_of_week === requestedDay
    )

    if (
      !requestedSchedule ||
      requestedSchedule.is_closed ||
      !availableBookingTimes.includes(requestedTime) ||
      requestedDate !== selectedBookingDate ||
      requestedTime !== selectedBookingTime
    ) {
      setBookingMessage("Please select a valid open date and appointment time.")
      setBookingLoading(false)
      return
    }

    try {
      const { data: blockedDate, error: blockedDateError } = await supabase
        .from("blocked_dates")
        .select("blocked_date")
        .eq("blocked_date", requestedDate)
        .maybeSingle()

      if (blockedDateError) throw blockedDateError

      if (blockedDate) {
        setBookingMessage("The salon is unavailable on this date. Please choose another day.")
        return
      }

      const selected = String(data.get("service") || "")
      const customerName = String(data.get("name") || "")
      const customerPhone = String(data.get("phone") || "")

      const { data: result, error } = await supabase.functions.invoke(
        "create-booking",
        {
          body: {
            name: customerName,
            phone: customerPhone,
            service: selected,
            date: requestedDate,
            time: requestedTime,
          },
        }
      )

      if (error) {
        let errorMessage = "We couldn't submit your booking. Please try again later."

        try {
          const response = error.context
          if (response && typeof response.json === "function") {
            const responseBody = await response.json()
            if (typeof responseBody.error === "string") {
              errorMessage = responseBody.error
            }
          }
        } catch {
          // Keep the generic message if the response cannot be read.
        }

        throw new Error(errorMessage)
      }

      if (!result?.ok) {
        throw new Error("We couldn't confirm your booking request. Please try again.")
      }

      const message = `Hello Celestique Beauty Spa, I have submitted an appointment request.

Name: ${customerName}
Phone: ${customerPhone}
Service: ${selected}
Preferred date: ${requestedDate}
Preferred time: ${requestedTime}

Please confirm availability. Thank you.`

      setBookingMessage("Your booking request has been saved successfully. Please contact the salon on WhatsApp to confirm availability.")
      setBookingWhatsAppUrl(
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      )
    } catch (error) {
      console.error("Booking submission failed:", error)

      const message = error instanceof Error ? error.message : ""

      if (message.includes("just been taken")) {
        setBookingMessage(message)
      } else if (message) {
        setBookingMessage(message)
      } else {
        setBookingMessage("We couldn't submit your booking. Please try another date or time, or contact the salon for assistance.")
      }
    } finally {
      setBookingLoading(false)
    }
  }

  return (
    <main>
      <div className="announcement">
        <span>YOUR BEAUTY, YOUR SIGNATURE</span>
        <span>SHAMAKHOKHO, VIHIGA COUNTY</span>
      </div>

      <header className="navbar">
        <a className="brand" href="#home" onClick={closeMenu}>
          <img src={getSiteAssetUrl("logo") || "/images/celestique-logo.jpg"} alt={getSiteAssetAlt("logo", "Celestique Beauty Spa")} className="brand-logo" />
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
            src={getSiteAssetUrl("hero") || photo("photo-1522337360788-8b13dee7a37e", 1100)}
            alt={getSiteAssetAlt("hero", "Beauty and skincare experience")}
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
            src={getSiteAssetUrl("about") || photo("photo-1540555700478-4be289fbecef", 900)}
            alt={getSiteAssetAlt("about", "Relaxing beauty spa atmosphere")}
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
          {activeServices.map((service, index) => (
            <article className="service-card" key={service.name}>
              <div className="service-image">
                <img
                  src={service.image?.startsWith("/") || service.image?.startsWith("http") ? service.image : photo(service.image, 650)}
                  alt={service.imageAlt || service.name}
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
                  <p className="service-price">{service.price}</p>
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


      <section className="packages-section section" id="packages">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EXCLUSIVE BEAUTY DEALS</span>
            <h2>Special <em>packages.</em></h2>
          </div>
          <p>Enjoy more of your favourite treatments with our special offers.</p>
        </div>
        <div className="packages-grid">
          {activePackages.map((item) => (
            <article className="package-card" key={item.name}>
              <span className="package-label">SPECIAL OFFER</span>
              <h3>{item.name}</h3>
              {item.description && <p>{item.description}</p>}
              <strong>{item.price}</strong>
              <a href={bookService(item.name)} target="_blank" rel="noreferrer">
                BOOK THIS PACKAGE ↗
              </a>
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
          {publishedOtherAssets.length > 0 ? (
            publishedOtherAssets.map(asset => (
              <div className="gallery-item" key={asset.id}>
                <img
                  src={supabase.storage.from("site-assets-public").getPublicUrl(asset.public_path).data.publicUrl}
                  alt={asset.alt_text || asset.caption || "Celestique Beauty Spa"}
                  loading="lazy"
                />
              </div>
            ))
          ) : (
            gallery.map((id, index) => (
              <div className="gallery-item" key={`default-${index}`}>
                <img src={id} alt={`Celestique Beauty Spa service ${index + 1}`} loading="lazy" />
              </div>
            ))
          )}
          {publishedGallery.map(item => (
            <div className="gallery-item" key={item.id}>
              <img
                src={item.url}
                alt={item.caption || "Celestique Beauty Spa happy client"}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="booking-banner" id="booking">
        <span className="eyebrow">YOUR BEAUTY JOURNEY STARTS HERE</span>
        <h2>Make time for <em>yourself.</em></h2>
        <p>Request your preferred appointment at Celestique Beauty Spa.</p>

        <form className="booking-form" onSubmit={submitBooking}>
          <fieldset className="booking-fields" disabled={Boolean(bookingWhatsAppUrl)} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <label>Full name
              <input name="name" type="text" placeholder="Your full name" required />
            </label>

            <label>Phone number
              <input name="phone" type="tel" placeholder="Your WhatsApp number" required />
            </label>

            <label>Choose a service
              <select name="service" defaultValue="" required>
                <option value="" disabled>Select a service</option>
                {activeServices.map((service) => (
                  service.name === 'Pedicure' ? (
                    <optgroup key={service.name} label="Pedicure">
                      <option value="Half Pedicure">Half Pedicure — KSh 350</option>
                      <option value="Full Pedicure">Full Pedicure — KSh 500</option>
                    </optgroup>
                  ) : (
                    <option key={service.name} value={service.name}>{service.name} — {service.price}</option>
                  )
                ))}
                <optgroup label="Special packages">
                  {activePackages.map((item) => <option key={item.name} value={item.name}>{item.name} — {item.price}</option>)}
                </optgroup>
              </select>
            </label>

            <label>Preferred date
              <input name="date" type="date" min={today} required disabled={businessHours.length !== 7} onChange={handleBookingDateChange} />
              {dateMessage && <p className="booking-feedback" role="alert">{dateMessage}</p>}
            </label>

            <label>Preferred time
              <select
                name="time"
                value={selectedBookingTime}
                onChange={(event) => setSelectedBookingTime(event.target.value)}
                required
                disabled={!selectedBookingDate || availableBookingTimes.length === 0}
              >
                <option value="">
                  {!selectedBookingDate ? "Select a date first" : "Select a preferred time"}
                </option>
                {availableBookingTimes.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </label>

          </fieldset>

          {!bookingWhatsAppUrl && (
            <button className="btn btn-light booking-submit" type="submit" disabled={bookingLoading}>
              {bookingLoading ? "Saving booking..." : "Send Booking Request"}
            </button>
          )}
          {bookingMessage && <p className="booking-feedback" role="status">{bookingMessage}</p>}
          {bookingWhatsAppUrl && (
            <a className="btn btn-primary booking-submit" href={bookingWhatsAppUrl} target="_blank" rel="noreferrer">
              Continue on WhatsApp ↗
            </a>
          )}
          <small className="booking-note">Your appointment is confirmed only after Celestique checks availability and responds.</small>
          <p className="booking-privacy-note">
            We use your name, phone number and appointment details to manage your request. If you continue on WhatsApp, the prepared appointment details will be shared with WhatsApp when you open the link.
            <a href="/privacy">Read our Privacy Notice</a>.
          </p>
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
            <strong>8:00 AM – 10:00 PM</strong>
            <p className="closed-note">Sunday — Closed</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <img src={getSiteAssetUrl("logo") || "/images/celestique-logo.jpg"} alt={getSiteAssetAlt("logo", "Celestique Beauty Spa")} className="brand-logo" />
        </a>
        <p>Beauty • Elegance • Confidence</p>
        <nav className="footer-legal" aria-label="Legal information">
          <a href="/privacy">Privacy Notice</a>
          <a href="/cookies">Cookie &amp; Browser Storage Notice</a>
          <a href="mailto:andayitimothy48@gmail.com">Privacy enquiries</a>
        </nav>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Celestique Beauty Spa. All rights reserved.</span>
          <span>Digital experience by Taifatech Solutions</span>
        </div>
      </footer>
    </main>
  )
}

export default App
