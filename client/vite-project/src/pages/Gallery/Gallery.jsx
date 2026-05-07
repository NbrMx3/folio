import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { getGallery } from '../../utils/api';
import './Gallery.css';

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true);
        const data = await getGallery();
        setItems(data);
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchGallery();
  }, []);

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  return (
    <>
      <Navbar />
      <section className="gallery-section">
        <div className="gallery-container">
          <h1 className="gallery-title">Nbr's Gallery</h1>
          <p className="gallery-description">Explore my photos and videos</p>

          {loading ? (
            <div className="gallery-loading">Loading gallery...</div>
          ) : items.length === 0 ? (
            <div className="gallery-empty">No gallery items yet.</div>
          ) : (
            <div className="gallery-grid">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="gallery-item"
                  onClick={() => handleItemClick(item)}
                >
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      className="gallery-media"
                      controls
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title || 'Gallery item'}
                      className="gallery-media"
                    />
                  )}
                  {item.title && (
                    <div className="gallery-item-overlay">
                      <p className="gallery-item-title">{item.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedItem && (
        <div className="gallery-modal" onClick={handleCloseModal}>
          <div className="gallery-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="gallery-modal-close" onClick={handleCloseModal}>
              ×
            </button>
            {selectedItem.type === 'video' ? (
              <video
                src={selectedItem.url}
                className="gallery-modal-media"
                controls
                autoPlay
              />
            ) : (
              <img
                src={selectedItem.url}
                alt={selectedItem.title || 'Gallery item'}
                className="gallery-modal-media"
              />
            )}
            {selectedItem.title && (
              <div className="gallery-modal-info">
                <h2>{selectedItem.title}</h2>
                {selectedItem.description && <p>{selectedItem.description}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Gallery;
