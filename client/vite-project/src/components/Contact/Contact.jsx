import { useState } from 'react';
import { FaEnvelope, FaExclamationCircle, FaMapMarkerAlt, FaPaperPlane, FaPhoneAlt, FaWhatsapp, FaCheckCircle, FaDownload } from 'react-icons/fa';
import { sendContactMessage, trackConversion } from '../../utils/api';
import './Contact.css';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');

  const contactDetails = [
    {
      icon: <FaPhoneAlt />,
      label: 'Phone',
      value: '0710393746',
      href: 'tel:0710393746',
    },
    {
      icon: <FaEnvelope />,
      label: 'Email',
      value: 'kipkemoi386@gmail.com',
      href: 'mailto:kipkemoi386@gmail.com',
    },
    {
      icon: <FaWhatsapp />,
      label: 'WhatsApp',
      value: '+254112267013',
      href: 'https://wa.me/254112267013',
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
      href: '/resume.pdf',
      track: 'resume',
      icon: <FaDownload />,
      download: true,
    },
    {
      label: 'Email',
      href: 'mailto:kipkemoi386@gmail.com',
      track: 'email',
      icon: <FaEnvelope />,
    },
    {
      label: 'WhatsApp',
      href: 'https://wa.me/254112267013',
      track: 'whatsapp',
      icon: <FaWhatsapp />,
    },
  ];

  const validateForm = () => {
    const nextErrors = {};

    if (form.website.trim()) {
      nextErrors.website = 'Spam protection triggered.';
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
      });

      setStatus('success');
      setFeedback(response?.message || 'Message sent successfully.');
      setForm({ name: '', email: '', message: '', website: '' });
      setErrors({});
    } catch (error) {
      setStatus('error');
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
        <div className="contact-quick-actions">
          {quickActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="contact-quick-action"
              download={action.download || undefined}
              onClick={() => handleQuickAction(action.track)}
              target={action.download ? undefined : '_blank'}
              rel={action.download ? undefined : 'noreferrer'}
            >
              {action.icon}
              <span>{action.label}</span>
            </a>
          ))}
        </div>
        <div className="contact-status-bar" aria-live="polite">
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
          </div>
          <button type="submit" className="btn-primary" disabled={status === 'submitting'}>
            <FaPaperPlane /> {status === 'submitting' ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
