import './Testimonials.css';

const testimonials = [
  {
    quote: 'The portfolio feels like a product, not just a gallery. The structure makes it easy to understand the depth of the work.',
    name: 'Product Lead',
    role: 'Portfolio reviewer',
  },
  {
    quote: 'The case-study layout is strong. It shows thinking, not just visuals, which is exactly what makes the work credible.',
    name: 'Startup Founder',
    role: 'Hiring perspective',
  },
  {
    quote: 'Filtering by stack and project type makes the work easier to scan. It feels intentional and polished.',
    name: 'Technical Recruiter',
    role: 'Review note',
  },
];

const Testimonials = () => {
  return (
    <section className="testimonials" id="testimonials">
      <div className="testimonials-container">
        <div className="testimonials-header">
          <h2 className="section-title">
            Testimonials <span className="highlight">& Feedback</span>
          </h2>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((item) => (
            <article className="testimonial-card" key={item.name}>
              <div className="testimonial-mark">“</div>
              <p>{item.quote}</p>
              <div className="testimonial-meta">
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

