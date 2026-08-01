import { useEffect, useRef, useState } from 'react';
import { FaEnvelope, FaExclamationCircle, FaMapMarkerAlt, FaPaperPlane, FaPhoneAlt, FaWhatsapp, FaCheckCircle, FaDownload } from 'react-icons/fa';
import { sendContactMessage, trackConversion, trackDownload } from '../../utils/api';
import { fallbackProfile } from '../../data/offlineContent';
import { getProfile } from '../../utils/api';
import './Contact.css';

const CONTACT_COOLDOWN_MS = 45 * 1000;

const Contact = () => {
  const submittedAtRef = useRef(Date.now());
  const cooldownTimerRef = useRef(null);
  const [form, setForm] = useState({ name: '', email: '', message: '', website: '', company: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [profile, setProfile] = useState(fallbackProfile);

  useEffect(() => {
    let isMounted = true;
    getProfile()
      .then((data) => { if (isMounted && data) setProfile((current) => ({ ...current, ...data })); })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const whatsappLink = `https://wa.me/${String(profile.whatsapp || fallbackProfile.whatsapp).replace(/\D/g, '').replace(/^0/, '254')}`;

  useEffect(() => {
    const stored = Number(localStorage.getItem('folio_contact_cooldown_until') || 0);
    if (stored && stored > Date.now()) {
      setCooldownUntil(stored);
    }
  }, []);

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownSeconds(0);
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      return undefined;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownSeconds(remaining);
      if (remaining === 0) {
        localStorage.removeItem('folio_contact_cooldown_until');
        setCooldownUntil(0);
      }
    };

    updateCountdown();
    cooldownTimerRef.current = window.setInterval(updateCountdown, 1000);

    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    };
  }, [cooldownUntil]);

  const contactDetails = [
    {
      icon: <FaPhoneAlt />,
      label: 'Phone',
      value: profile.phone || fallbackProfile.phone,
      href: `tel:${profile.phone || fallbackProfile.phone}`,
    },
    {
      icon: <FaEnvelope />,
      label: 'Email',
      value: profile.email || fallbackProfile.email,
      href: `mailto:${profile.email || fallbackProfile.email}`,
    },
    {
      icon: <FaWhatsapp />,
      label: 'WhatsApp',
      value: profile.whatsapp || fallbackProfile.whatsapp,
      href: whatsappLink,
    },
    {
      icon: <FaMapMarkerAlt />,
      label: 'Location',
      value: 'Eldoret, Kenya',
    },
  ];

  const quickActions = [
    {
      label: 'Resume',
      href: fallbackProfile.resume || '/resume.pdf',
      track: 'resume',
      icon: <FaDownload />,
      download: true,
    },
    {
      label: 'Email',
      href: `mailto:${profile.email || fallbackProfile.email}`,
      track: 'email',
      icon: <FaEnvelope />,
    },
    {
      label: 'WhatsApp',
      href: whatsappLink,
      track: 'whatsapp',
      icon: <FaWhatsapp />,
    },
  ];

  const validateForm = () => {
    const nextErrors = {};

    if (cooldownUntil > Date.now()) {
      nextErrors.form = `Please wait ${cooldownSeconds || 1}s before sending another message.`;
      return nextErrors;
    }

    if (form.website.trim()) {
      nextErrors.website = 'Spam protection triggered.';
      return nextErrors;
    }

    if (form.company.trim()) {
      nextErrors.company = 'Spam protection triggered.';
      return nextErrors;
    }

    if (Date.now() - submittedAtRef.current < 4000) {
      nextErrors.form = 'Please take a moment before sending your message.';
      return nextErrors;
    }

    if (form.name.trim().length < 2) {
      nextErrors.name = 'Please add your full name.';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (form.message.trim().length < 20) {
      nextErrors.message = 'Message should be at least 20 characters.';
    }

    return nextErrors;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[e.target.name];
        return next;
      });
    }
    if (status !== 'idle') {
      setStatus('idle');
      setFeedback('');
    }
  };

  const beginCooldown = (retryAfterSeconds = null) => {
    const duration = retryAfterSeconds ? retryAfterSeconds * 1000 : CONTACT_COOLDOWN_MS;
    const nextCooldownUntil = Date.now() + duration;
    localStorage.setItem('folio_contact_cooldown_until', String(nextCooldownUntil));
    setCooldownUntil(nextCooldownUntil);
    submittedAtRef.current = Date.now();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus('error');
      setFeedback(nextErrors.website || 'Please fix the highlighted fields.');
      return;
    }

    setStatus('submitting');
    setFeedback('');

    try {
      const response = await sendContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        website: form.website.trim(),
        company: form.company.trim(),
        submittedAt: submittedAtRef.current,
      });

      setStatus('success');
      setFeedback(response?.message || 'Message sent successfully.');
      setForm({ name: '', email: '', message: '', website: '', company: '' });
      setErrors({});
      beginCooldown();
    } catch (error) {
      setStatus('error');
      if (error.status === 429) {
        beginCooldown(error.retryAfterSeconds);
      }
      setFeedback(error.message || 'Something went wrong. Please try again.');
    }
  };

  const handleQuickAction = (action) => {
    const ref = sessionStorage.getItem('folio_ref') || document.referrer || 'direct';
    void trackConversion(ref, 'cta', action);
  };

  return (
    <section className="contact" id="contact">
      <div className="contact-container">
        <h2 className="section-title">
          Get In <span className="highlight">Touch</span>
        </h2>
        <p className="contact-subtitle">
          Have a project in mind or want to collaborate? Drop me a message.
        </p>
        {cooldownUntil > Date.now() && (
          <div className="contact-rate-limit">
            You can send another message in {cooldownSeconds}s.
          </div>
        )}
        <div className="contact-quick-actions">
          {quickActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="contact-quick-action"
              download={action.download || undefined}
              onClick={() => {
                handleQuickAction(action.track);
                if (action.download) {
                  void trackDownload({
                    assetType: 'resume',
                    assetName: action.label,
                    assetUrl: action.href,
                  });
                }
              }}
              target={action.download ? undefined : '_blank'}
              rel={action.download ? undefined : 'noreferrer'}
            >
              {action.icon}
              <span>{action.label}</span>
            </a>
          ))}
        </div>
        <div className="contact-status-bar" aria-live="polite">
          {errors.form && (
            <div className="contact-status error">
              <FaExclamationCircle />
              <span>{errors.form}</span>
            </div>
          )}
          {status === 'success' && (
            <div className="contact-status success">
              <FaCheckCircle />
              <span>{feedback}</span>
            </div>
          )}
          {status === 'error' && feedback && (
            <div className="contact-status error">
              <FaExclamationCircle />
              <span>{feedback}</span>
            </div>
          )}
          {status === 'idle' && !feedback && (
            <div className="contact-status idle">
              <FaPaperPlane />
              <span>No message sent yet. Share a brief and I’ll reply with the next step.</span>
            </div>
          )}
        </div>
        <div className="contact-grid">
          {contactDetails.map((item) => (
            <div className="contact-card" key={item.label}>
              <div className="contact-icon">{item.icon}</div>
              <div className="contact-card-body">
                <span className="contact-label">{item.label}</span>
                {item.href ? (
                  <a href={item.href} className="contact-value">
                    {item.value}
                  </a>
                ) : (
                  <span className="contact-value">{item.value}</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-form-note">
            Messages are validated before sending. A hidden trap field blocks bot submissions.
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                aria-invalid={Boolean(errors.name)}
                required
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Your Email"
                value={form.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                required
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              placeholder="Your Message"
              rows="5"
              value={form.message}
              onChange={handleChange}
              aria-invalid={Boolean(errors.message)}
              required
            ></textarea>
            {errors.message && <span className="field-error">{errors.message}</span>}
          </div>
          <div className="contact-honeypot" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="text"
              name="website"
              tabIndex="-1"
              autoComplete="off"
              value={form.website}
              onChange={handleChange}
            />
            <label htmlFor="company">Company</label>
            <input
              id="company"
              type="text"
              name="company"
              tabIndex="-1"
              autoComplete="off"
              value={form.company}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={status === 'submitting' || cooldownUntil > Date.now()}>
            <FaPaperPlane /> {status === 'submitting' ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
