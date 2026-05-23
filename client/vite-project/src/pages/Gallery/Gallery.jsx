import { useEffect, useRef, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { getGallery } from '../../utils/api';
import './Gallery.css';

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.2;
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const SWIPE_THRESHOLD = 50;
  const CLOSE_THRESHOLD = 80;

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

  useEffect(() => {
    if (selectedItem) {
      setZoomLevel(1);
    }
  }, [selectedItem]);

  useEffect(() => {
    if (selectedIndex === null) return;
    if (items.length === 0) return;
    if (selectedIndex >= items.length) {
      setSelectedIndex(null);
      setSelectedItem(null);
      return;
    }
    setSelectedItem(items[selectedIndex]);
  }, [items, selectedIndex]);

  const handleItemClick = (item) => {
    const index = items.findIndex((entry) => entry.id === item.id);
    setSelectedIndex(index === -1 ? 0 : index);
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setSelectedIndex(null);
  };

  const normalizeIndex = (index) => {
    if (items.length === 0) return 0;
    return (index + items.length) % items.length;
  };

  const goToIndex = (index) => {
    if (items.length === 0) return;
    const normalized = normalizeIndex(index);
    setSelectedIndex(normalized);
    setSelectedItem(items[normalized]);
  };

  const handlePrev = () => {
    if (selectedIndex === null) return;
    goToIndex(selectedIndex - 1);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    goToIndex(selectedIndex + 1);
  };

  const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

  const handleZoomIn = () => {
    setZoomLevel((prev) => clampZoom(prev + ZOOM_STEP));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => clampZoom(prev - ZOOM_STEP));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  const handleWheelZoom = (event) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    setZoomLevel((prev) => clampZoom(prev + direction * ZOOM_STEP));
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX || 0;
    touchEndX.current = touchStartX.current;
    touchStartY.current = event.touches[0]?.clientY || 0;
    touchEndY.current = touchStartY.current;
  };

  const handleTouchMove = (event) => {
    touchEndX.current = event.touches[0]?.clientX || 0;
    touchEndY.current = event.touches[0]?.clientY || 0;
  };

  const handleTouchEnd = () => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > CLOSE_THRESHOLD) {
      handleCloseModal();
      return;
    }
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    if (deltaX > 0) {
      handlePrev();
    } else {
      handleNext();
    }
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
                <div key={item.id} className="gallery-card">
                  <div
                    className="gallery-item"
                    onClick={() => handleItemClick(item)}
                  >
                    {item.type === 'video' ? (
                      <video
                        src={item.playbackUrl || item.url}
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
                  {(item.title || item.description) && (
                    <div className="gallery-item-caption">
                      {item.title && <p className="gallery-caption-title">{item.title}</p>}
                      {item.description && (
                        <p className="gallery-caption-description">{item.description}</p>
                      )}
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
          <div
            className="gallery-modal-content"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <button className="gallery-modal-close" onClick={handleCloseModal}>
              ×
            </button>
            {items.length > 1 && (
              <>
                <button
                  className="gallery-nav-button gallery-nav-prev"
                  onClick={handlePrev}
                  aria-label="Previous item"
                >
                  ‹
                </button>
                <button
                  className="gallery-nav-button gallery-nav-next"
                  onClick={handleNext}
                  aria-label="Next item"
                >
                  ›
                </button>
              </>
            )}
            <div className="gallery-modal-toolbar">
              <a
                className="gallery-download-button"
                href={selectedItem.url}
                download
                target="_blank"
                rel="noreferrer"
              >
                Download
              </a>
              {selectedItem.type !== 'video' && (
                <div className="gallery-zoom-controls">
                  <button
                    className="gallery-zoom-button"
                    onClick={handleZoomOut}
                    aria-label="Zoom out"
                  >
                    −
                  </button>
                  <span className="gallery-zoom-level">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    className="gallery-zoom-button"
                    onClick={handleZoomIn}
                    aria-label="Zoom in"
                  >
                    +
                  </button>
                  <button
                    className="gallery-zoom-button"
                    onClick={handleZoomReset}
                    aria-label="Reset zoom"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
            {selectedItem.type === 'video' ? (
              <video
                src={selectedItem.playbackUrl || selectedItem.url}
                className="gallery-modal-media"
                controls
                autoPlay
              />
            ) : (
              <div className="gallery-modal-media-wrapper" onWheel={handleWheelZoom}>
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title || 'Gallery item'}
                  className="gallery-modal-media"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              </div>
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
