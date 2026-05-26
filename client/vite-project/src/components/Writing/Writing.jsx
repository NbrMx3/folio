import { memo } from 'react';
import './Writing.css';

const posts = [
  {
    title: 'Designing a portfolio that feels like a product',
    excerpt: 'A note on using motion, hierarchy, and storytelling to make a personal site feel intentional instead of generic.',
    date: 'May 2026',
    readTime: '4 min read',
    tag: 'Design Systems',
  },
  {
    title: 'Why case studies beat simple project cards',
    excerpt: 'How problem, process, and results create credibility far better than a list of tools and links.',
    date: 'Apr 2026',
    readTime: '5 min read',
    tag: 'Product Thinking',
  },
  {
    title: 'Keeping motion meaningful on small screens',
    excerpt: 'Practical ways to keep a website lively without making it distracting or inaccessible.',
    date: 'Mar 2026',
    readTime: '3 min read',
    tag: 'Frontend Craft',
  },
];

const Writing = () => {
  return (
    <section className="writing" id="writing">
      <div className="writing-container">
        <div className="writing-header">
          <h2 className="section-title">
            Writing <span className="highlight">& Updates</span>
          </h2>
          <p>
            A short technical journal for design notes, experiments, and updates on what I’m building next.
          </p>
        </div>

        <div className="writing-grid">
          {posts.map((post, index) => (
            <article className={`writing-card ${index === 0 ? 'featured' : ''}`} key={post.title}>
              <div className="writing-card-top">
                <span className="writing-tag">{post.tag}</span>
                <span className="writing-meta">{post.date}</span>
              </div>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <div className="writing-card-bottom">
                <span>{post.readTime}</span>
                <a href="#contact">Discuss this</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default memo(Writing);
