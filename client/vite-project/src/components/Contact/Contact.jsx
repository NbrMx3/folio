import { useState } from 'react';
import { FaEnvelope, FaMapMarkerAlt, FaPaperPlane, FaPhoneAlt } from 'react-icons/fa';
import './Contact.css';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

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
      icon: <FaMapMarkerAlt />,
      label: 'Location',
      value: 'Eldoret, Kenya',
    },
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Thanks ${form.name}! Your message has been received.`);
    setForm({ name: '', email: '', message: '' });
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
          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <textarea
              name="message"
              placeholder="Your Message"
              rows="5"
              value={form.message}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          <button type="submit" className="btn-primary">
            <FaPaperPlane /> Send Message
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
