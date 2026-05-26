import { useEffect, useRef, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import Seo from '../../components/Seo/Seo';
import { getGallery } from '../../utils/api';
import './Gallery.css';

const MEDIA_FILTERS = [
  { key: 'all', label: 'All media' },
  { key: 'photo', label: 'Photos' },
  { key: 'video', label: 'Videos' },
  { key: 'audio', label: 'Audio' },
];

const MEDIA_LABELS = {
  photo: 'Photo',
  video: 'Video',
  audio: 'Audio',
};

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mediaFilter, setMediaFilter] = useState('all');
  const [activeItems, setActiveItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRefs = useRef({});
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const SWIPE_THRESHOLD = 50;
  const CLOSE_THRESHOLD = 80;

  const sortByNewest = (list) =>
    list.slice().sort((a, b) => {
      const aTime = a?.created_at ? new Date(a.created_at).getTime() : null;
      const bTime = b?.created_at ? new Date(b.created_at).getTime() : null;

      if (aTime && bTime) return bTime - aTime;
      if (aTime && !bTime) return -1;
      if (!aTime && bTime) return 1;
      return (b?.id || 0) - (a?.id || 0);
    });

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true);
        const data = await getGallery();
        setItems(sortByNewest(data));
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchGallery();
  }, []);

  useEffect(() => {
    if (selectedIndex === null) return;
    if (activeItems.length === 0) return;
    if (selectedIndex >= activeItems.length) {
      setSelectedIndex(null);
      setSelectedItem(null);
      return;
    }
    setSelectedItem(activeItems[selectedIndex]);
  }, [activeItems, selectedIndex]);

  useEffect(() => {
    if (!selectedItem) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCloseModal();
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrev();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, selectedIndex, activeItems.length]);

  const handleItemClick = (item, list) => {
    const index = list.findIndex((entry) => entry.id === item.id);
    setActiveItems(list);
    setSelectedIndex(index === -1 ? 0 : index);
    setSelectedItem(item);
  };

  const handleFilterChange = (nextFilter) => {
    setMediaFilter(nextFilter);
    if (playingAudioId) {
      const currentAudio = audioRefs.current[playingAudioId];
      if (currentAudio) currentAudio.pause();
      setPlayingAudioId(null);
    }
    setSelectedItem(null);
    setSelectedIndex(null);
    setActiveItems([]);
  };

  const handleCloseModal = () => {
    if (playingAudioId) {
      const currentAudio = audioRefs.current[playingAudioId];
      if (currentAudio) currentAudio.pause();
      setPlayingAudioId(null);
    }
    setSelectedItem(null);
    setSelectedIndex(null);
    setActiveItems([]);
  };

  const normalizeIndex = (index) => {
    if (activeItems.length === 0) return 0;
    return (index + activeItems.length) % activeItems.length;
  };

  const goToIndex = (index) => {
    if (activeItems.length === 0) return;
    const normalized = normalizeIndex(index);
    setSelectedIndex(normalized);
    setSelectedItem(activeItems[normalized]);
  };

  const handlePrev = () => {
    if (selectedIndex === null) return;
    goToIndex(selectedIndex - 1);
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    goToIndex(selectedIndex + 1);
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

  const handleAudioToggle = (item) => {
    const audio = audioRefs.current[item.id];
    if (!audio) return;

    if (playingAudioId && playingAudioId !== item.id) {
      const currentAudio = audioRefs.current[playingAudioId];
      if (currentAudio) currentAudio.pause();
    }

    if (audio.paused) {
      audio.play();
      setPlayingAudioId(item.id);
      return;
    }

    audio.pause();
    setPlayingAudioId(null);
  };

  const handleAudioEnded = (itemId) => {
    if (playingAudioId === itemId) setPlayingAudioId(null);
  };

  const getMediaType = (item) => String(item?.type || 'photo').toLowerCase();

  const getMediaLabel = (item) => MEDIA_LABELS[getMediaType(item)] || 'Photo';

  const renderStars = () => (
    <div className="gallery-rating" aria-label="5 star rating">
      {Array.from({ length: 5 }).map((_, idx) => (
        <span key={idx} className="gallery-star">★</span>
      ))}
    </div>
  );

  const resolveItemUrl = (item) => item?.playbackUrl || item?.url || '';

  const sanitizeFilename = (value) =>
    (value || 'gallery-item')
      .toString()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .toLowerCase();

  const extensionFromType = (contentType) => {
    if (!contentType) return '';
    const map = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'video/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
    };
    return map[contentType] || '';
  };

  const extensionFromUrl = (url) => {
    if (!url) return '';
    const clean = url.split('?')[0];
    const match = clean.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : '';
  };

  const handleDownload = async (item) => {
    const url = resolveItemUrl(item);
    if (!url) return;

    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || '';
      const ext = extensionFromType(contentType) || extensionFromUrl(url);
      const filename = `${sanitizeFilename(item?.title)}${ext ? `.${ext}` : ''}`;
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank', 'noopener');
    }
  };

  const handleSave = async (item) => {
    const url = resolveItemUrl(item);
    if (!url) return;

    if (navigator.share) {
      try {
        await navigator.share({ title: item?.title || 'Gallery item', url });
        return;
      } catch {
        // Fall back to opening in a new tab.
      }
    }

    window.open(url, '_blank', 'noopener');
  };

  const visibleItems = mediaFilter === 'all'
    ? items
    : items.filter((item) => getMediaType(item) === mediaFilter);

  const pictureItems = visibleItems.filter((item) => getMediaType(item) === 'photo');
  const videoItems = visibleItems.filter((item) => getMediaType(item) === 'video');
  const audioItems = visibleItems.filter((item) => getMediaType(item) === 'audio');
  const hasVisibleItems = pictureItems.length > 0 || videoItems.length > 0 || audioItems.length > 0;

  return (
    <>
      <Seo
        title="Nbr's Gallery"
        description="Browse CyberDev's gallery of photos, videos, and audio with a curated media experience."
        url={`${window.location.origin}/gallery`}
        image="/dk_portfolio_logo_light.svg"
        type="website"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: "Nbr's Gallery",
          description: "Browse CyberDev's gallery of photos, videos, and audio.",
          url: `${window.location.origin}/gallery`,
        }}
      />
      <Navbar />
      <section className="gallery-section">
        <div className="gallery-container">
          <h1 className="gallery-title">Nbr's Gallery</h1>
          <p className="gallery-description">Explore my photos, videos, and audio</p>

          <div className="gallery-filters" role="toolbar" aria-label="Filter gallery by media type">
            {MEDIA_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                aria-pressed={mediaFilter === filter.key}
                className={`gallery-filter-pill ${mediaFilter === filter.key ? 'is-active' : ''}`}
                onClick={() => handleFilterChange(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="gallery-loading gallery-loading--skeleton" aria-busy="true">
              <div className="gallery-loading-header">
                <div className="skeleton skeleton-line skeleton-line--lg gallery-loading-title"></div>
                <div className="skeleton skeleton-line gallery-loading-subtitle"></div>
              </div>
              <div className="gallery-loading-groups">
                {Array.from({ length: 3 }).map((_, groupIndex) => (
                  <div className="gallery-loading-group" key={groupIndex}>
                    <div className="gallery-group-header gallery-group-header--loading">
                      <div className="skeleton skeleton-line gallery-loading-group-title"></div>
                      <div className="skeleton skeleton-line gallery-loading-group-count"></div>
                    </div>
                    <div className="gallery-grid gallery-grid--loading">
                      {Array.from({ length: 3 }).map((__, cardIndex) => (
                        <div className="gallery-card gallery-card--loading" key={cardIndex}>
                          <div className="skeleton skeleton-block gallery-loading-media"></div>
                          <div className="skeleton skeleton-line gallery-loading-caption"></div>
                          <div className="skeleton skeleton-line gallery-loading-caption gallery-loading-caption--short"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="gallery-empty gallery-empty--wide">
              <h2>No gallery items yet.</h2>
              <p>Upload photos, videos, or audio from the admin dashboard to bring this section to life.</p>
            </div>
          ) : !hasVisibleItems ? (
            <div className="gallery-empty gallery-empty--wide">
              <h2>No {mediaFilter === 'all' ? 'media' : MEDIA_LABELS[mediaFilter].toLowerCase()} match this filter.</h2>
              <p>Try another media type or clear the filter to see everything again.</p>
              <button type="button" className="gallery-filter-reset" onClick={() => handleFilterChange('all')}>
                Show all media
              </button>
            </div>
          ) : (
            <div className="gallery-groups">
              <div className="gallery-group">
                <div className="gallery-group-header">
                  <h2 className="gallery-group-title">Pictures</h2>
                  <span className="gallery-group-count">{pictureItems.length}</span>
                </div>
                {pictureItems.length === 0 ? (
                  <div className="gallery-empty">No pictures yet.</div>
                ) : (
                  <div className="gallery-grid">
                    {pictureItems.map((item) => (
                      <div key={item.id} className="gallery-card">
                        <button
                          type="button"
                          className="gallery-item"
                          onClick={() => handleItemClick(item, pictureItems)}
                          aria-label={`Open photo ${item.title || 'gallery item'}`}
                        >
                          <span className={`gallery-media-badge gallery-media-badge--${getMediaType(item)}`}>
                            {getMediaLabel(item)}
                          </span>
                          <img
                            src={item.url}
                            alt={item.title || 'Gallery item'}
                            className="gallery-media"
                          />
                          {item.title && (
                            <div className="gallery-item-overlay">
                              <p className="gallery-item-title">{item.title}</p>
                            </div>
                          )}
                        </button>
                        {(item.title || item.description) && (
                          <div className="gallery-item-caption">
                            {item.title && <p className="gallery-caption-title">{item.title}</p>}
                            {item.description && (
                              <p className="gallery-caption-description">{item.description}</p>
                            )}
                          </div>
                        )}
                        <div className="gallery-card-actions">
                          <button
                            type="button"
                            className="gallery-card-action gallery-card-action--icon"
                            onClick={() => handleDownload(item)}
                            aria-label="Download"
                            title="Download"
                          >
                            <span aria-hidden="true">&darr;</span>
                          </button>
                          <button
                            type="button"
                            className="gallery-card-action gallery-card-action--ghost"
                            onClick={() => handleSave(item)}
                          >
                            Save
                          </button>
                        </div>
                        {renderStars()}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="gallery-group">
                <div className="gallery-group-header">
                  <h2 className="gallery-group-title">Videos</h2>
                  <span className="gallery-group-count">{videoItems.length}</span>
                </div>
                {videoItems.length === 0 ? (
                  <div className="gallery-empty">No videos yet.</div>
                ) : (
                  <div className="gallery-grid">
                    {videoItems.map((item) => (
                      <div key={item.id} className="gallery-card">
                        <button
                          type="button"
                          className="gallery-item"
                          onClick={() => handleItemClick(item, videoItems)}
                          aria-label={`Open video ${item.title || 'gallery item'}`}
                        >
                          <span className={`gallery-media-badge gallery-media-badge--${getMediaType(item)}`}>
                            {getMediaLabel(item)}
                          </span>
                          <video
                            src={item.playbackUrl || item.url}
                            className="gallery-media"
                            preload="metadata"
                            muted
                            playsInline
                          />
                          {item.title && (
                            <div className="gallery-item-overlay">
                              <p className="gallery-item-title">{item.title}</p>
                            </div>
                          )}
                        </button>
                        {(item.title || item.description) && (
                          <div className="gallery-item-caption">
                            {item.title && <p className="gallery-caption-title">{item.title}</p>}
                            {item.description && (
                              <p className="gallery-caption-description">{item.description}</p>
                            )}
                          </div>
                        )}
                        <div className="gallery-card-actions">
                          <button
                            type="button"
                            className="gallery-card-action gallery-card-action--icon"
                            onClick={() => handleDownload(item)}
                            aria-label="Download"
                            title="Download"
                          >
                            <span aria-hidden="true">&darr;</span>
                          </button>
                          <button
                            type="button"
                            className="gallery-card-action gallery-card-action--ghost"
                            onClick={() => handleSave(item)}
                          >
                            Save
                          </button>
                        </div>
                        {renderStars()}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="gallery-group">
                <div className="gallery-group-header">
                  <h2 className="gallery-group-title">Audio</h2>
                  <span className="gallery-group-count">{audioItems.length}</span>
                </div>
                {audioItems.length === 0 ? (
                  <div className="gallery-empty">No audio yet.</div>
                ) : (
                  <div className="gallery-grid">
                    {audioItems.map((item) => (
                      <div key={item.id} className="gallery-card">
                        <div
                          className={`gallery-item gallery-audio-card${playingAudioId === item.id ? ' is-playing' : ''}`}
                          onClick={() => handleItemClick(item, audioItems)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Open audio ${item.title || 'gallery item'}`}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleItemClick(item, audioItems);
                            }
                          }}
                        >
                          <span className={`gallery-media-badge gallery-media-badge--${getMediaType(item)}`}>
                            {getMediaLabel(item)}
                          </span>
                          <div className="gallery-audio-controls">
                            <button
                              type="button"
                              className="gallery-audio-toggle"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAudioToggle(item);
                              }}
                            >
                              {playingAudioId === item.id ? 'Pause' : 'Play'}
                            </button>
                            <span className="gallery-audio-title">
                              {item.title || 'Audio track'}
                            </span>
                          </div>
                          <div className="gallery-audio-wave" aria-hidden="true">
                            {Array.from({ length: 12 }).map((_, idx) => (
                              <span key={idx}></span>
                            ))}
                          </div>
                          <audio
                            ref={(el) => {
                              audioRefs.current[item.id] = el;
                            }}
                            className="gallery-audio-element"
                            src={item.url}
                            preload="metadata"
                            onEnded={() => handleAudioEnded(item.id)}
                          />
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
                        <div className="gallery-card-actions">
                          <button
                            type="button"
                            className="gallery-card-action gallery-card-action--icon"
                            onClick={() => handleDownload(item)}
                            aria-label="Download"
                            title="Download"
                          >
                            <span aria-hidden="true">&darr;</span>
                          </button>
                          <button
                            type="button"
                            className="gallery-card-action gallery-card-action--ghost"
                            onClick={() => handleSave(item)}
                          >
                            Save
                          </button>
                        </div>
                        {renderStars()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
            <button type="button" className="gallery-modal-close" onClick={handleCloseModal} aria-label="Close gallery viewer">
              Back
            </button>
            {activeItems.length > 1 && (
              <>
                <button
                  type="button"
                  className="gallery-nav-button gallery-nav-prev"
                  onClick={handlePrev}
                  aria-label="Previous item"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="gallery-nav-button gallery-nav-next"
                  onClick={handleNext}
                  aria-label="Next item"
                >
                  ›
                </button>
              </>
            )}
            <div className="gallery-modal-toolbar">
              <button
                type="button"
                className="gallery-download-button gallery-download-button--icon"
                onClick={() => handleDownload(selectedItem)}
                aria-label="Download"
                title="Download"
              >
                <span aria-hidden="true">&darr;</span>
              </button>
              <button
                type="button"
                className="gallery-save-button"
                onClick={() => handleSave(selectedItem)}
              >
                Save
              </button>
            </div>
            {selectedItem.type === 'video' ? (
              <video
                src={selectedItem.playbackUrl || selectedItem.url}
                className="gallery-modal-media"
                controls
                autoPlay
              />
            ) : selectedItem.type === 'audio' ? (
              <div className="gallery-modal-media-wrapper">
                <div className={`gallery-audio-card gallery-audio-card--modal${playingAudioId === selectedItem.id ? ' is-playing' : ''}`}>
                  <div className="gallery-audio-controls">
                    <button
                      type="button"
                      className="gallery-audio-toggle"
                      onClick={() => handleAudioToggle(selectedItem)}
                    >
                      {playingAudioId === selectedItem.id ? 'Pause' : 'Play'}
                    </button>
                    <span className="gallery-audio-title">
                      {selectedItem.title || 'Audio track'}
                    </span>
                  </div>
                  <div className="gallery-audio-wave" aria-hidden="true">
                    {Array.from({ length: 16 }).map((_, idx) => (
                      <span key={idx}></span>
                    ))}
                  </div>
                  <audio
                    ref={(el) => {
                      audioRefs.current[selectedItem.id] = el;
                    }}
                    className="gallery-audio-element"
                    src={selectedItem.url}
                    preload="metadata"
                    onEnded={() => handleAudioEnded(selectedItem.id)}
                  />
                </div>
              </div>
            ) : (
              <div className="gallery-modal-media-wrapper">
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title || 'Gallery item'}
                  className="gallery-modal-media"
                />
              </div>
            )}
            {selectedItem.title && (
              <div className="gallery-modal-info">
                <span className={`gallery-modal-badge gallery-media-badge--${getMediaType(selectedItem)}`}>
                  {getMediaLabel(selectedItem)}
                </span>
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
