import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaImages, FaArrowRight } from 'react-icons/fa';
import { getGallery } from '../../utils/api';
import './GalleryPreview.css';

const GalleryPreview = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const data = await getGallery();
        setItems(data.slice(0, 6)); // Show first 6 items
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchGallery();
  }, []);

  return (
    <section className="gallery-preview-section">
      <div className="gallery-preview-container">
        <div className="gallery-preview-header">
          <div className="gallery-preview-title">
            <FaImages className="gallery-preview-icon" />
            <h2>Nbr's Gallery</h2>
          </div>
          <p className="gallery-preview-subtitle">Explore my photos and videos</p>
        </div>

        {loading ? (
          <div className="gallery-preview-loading gallery-preview-loading--skeleton" aria-busy="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton skeleton-block gallery-preview-skeleton"></div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="gallery-preview-empty">
            <h3>No gallery items yet.</h3>
            <p>Upload a few photos or videos from the admin dashboard to populate this preview.</p>
          </div>
        ) : (
          <div className="gallery-preview-grid">
            {items.map((item) => (
              <div key={item.id} className="gallery-preview-item">
                {item.type === 'video' ? (
                  <video
                    src={item.playbackUrl || item.url}
                    className="gallery-preview-media"
                    aria-label={item.title || 'Gallery video preview'}
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.title ? `${item.title} preview` : 'Gallery preview item'}
                    className="gallery-preview-media"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <Link to="/gallery" className="gallery-preview-link">
          View Full Gallery
          <FaArrowRight />
        </Link>
      </div>
    </section>
  );
};

export default memo(GalleryPreview);
