import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaTimes } from 'react-icons/fa';
import { getGallery, uploadGalleryMedia, updateGalleryItem, deleteGalleryItem } from '../../../utils/api';
import './GalleryManager.css';

const GalleryManager = () => {
  const MAX_MEDIA_BYTES = 20 * 1024 * 1024;
  const MAX_MEDIA_MB = 20;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [files, setFiles] = useState([]);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      const data = await getGallery();
      setItems(data);
    } catch {
      showMsg('Failed to load gallery', true);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;

    const valid = [];
    for (const selectedFile of picked) {
      const isMedia = selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/');
      if (!isMedia) {
        showMsg('Only image and video files are allowed.', true);
        continue;
      }
      if (selectedFile.size > MAX_MEDIA_BYTES) {
        showMsg(`File too large. Max size is ${MAX_MEDIA_MB}MB.`, true);
        continue;
      }
      valid.push(selectedFile);
    }

    if (valid.length === 0) {
      e.target.value = '';
      setFiles([]);
      return;
    }

    setFiles(valid);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      showMsg('Please select at least one file', true);
      return;
    }

    setUploading(true);
    try {
      const uploaded = [];
      for (const selectedFile of files) {
        const response = await uploadGalleryMedia(selectedFile, newItem.title, newItem.description);
        if (response?.item) uploaded.push(response.item);
      }

      if (uploaded.length > 0) {
        setItems((prev) => [...prev, ...uploaded]);
      }
      setFiles([]);
      setNewItem({ title: '', description: '' });
      setShowAdd(false);
      showMsg(`Uploaded ${uploaded.length} file${uploaded.length === 1 ? '' : 's'} successfully!`);
    } catch (error) {
      showMsg(`Upload failed: ${error.message}`, true);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this gallery item?')) return;

    try {
      await deleteGalleryItem(id);
      setItems(items.filter((item) => item.id !== id));
      showMsg('Item deleted!');
    } catch {
      showMsg('Failed to delete item', true);
    }
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const handleSaveEdit = async () => {
    try {
      const updated = await updateGalleryItem(editingId, editData);
      setItems(items.map((item) => (item.id === editingId ? updated : item)));
      setEditingId(null);
      setEditData({});
      showMsg('Item updated!');
    } catch {
      showMsg('Failed to update item', true);
    }
  };

  const showMsg = (msg, isError = false) => {
    setMessage({ text: msg, isError });
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="gallery-manager">
      <div className="gallery-manager-header">
        <h2>Gallery Manager</h2>
        <button
          className="btn-add"
          onClick={() => setShowAdd(!showAdd)}
          disabled={uploading}
        >
          <FaPlus /> Add Media
        </button>
      </div>

      {message && (
        <div className={`message ${message.isError ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      {showAdd && (
        <div className="gallery-add-form">
          <h3>Upload New Media</h3>
          <div className="form-group">
            <label htmlFor="media-file">Select Photo or Video *</label>
            <input
              id="media-file"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
            />
            <p className="form-hint">Max file size: {MAX_MEDIA_MB}MB</p>
            {files.length > 0 && (
              <p className="file-selected">
                ✓ {files.length} file{files.length === 1 ? '' : 's'} selected
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="media-title">Title</label>
            <input
              id="media-title"
              type="text"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              placeholder="Enter title (optional)"
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="media-description">Description</label>
            <textarea
              id="media-description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="Enter description (optional)"
              disabled={uploading}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button
              className="btn-save"
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              className="btn-cancel"
              onClick={() => {
                setShowAdd(false);
                setFiles([]);
                setNewItem({ title: '', description: '' });
              }}
              disabled={uploading}
            >
              <FaTimes /> Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading gallery...</div>
      ) : items.length === 0 ? (
        <div className="empty">No gallery items yet. Add your first photo or video!</div>
      ) : (
        <div className="gallery-items-list">
          {items.map((item) => (
            <div key={item.id} className="gallery-item-card">
              {editingId === item.id ? (
                <div className="item-edit-form">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={editData.title || ''}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={editData.description || ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn-save" onClick={handleSaveEdit}>
                      Save
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => {
                        setEditingId(null);
                        setEditData({});
                      }}
                    >
                      <FaTimes /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="item-preview">
                    {item.type === 'video' ? (
                      <video
                        src={item.playbackUrl || item.url}
                        className="preview-media"
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.title || 'Gallery item'}
                        className="preview-media"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                  <div className="item-info">
                    <div className="item-header">
                      <h4>{item.title || 'Untitled'}</h4>
                      <span className="item-type">{item.type}</span>
                    </div>
                    {item.description && <p className="item-description">{item.description}</p>}
                    <div className="item-actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleStartEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(item.id)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryManager;
