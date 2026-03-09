import React, { useState, useEffect, useCallback } from "react";
import { BASE_URL } from "../config";
import "./TouristSpots.css"; 
import { Plus, X, Image, Type, Trash2, Edit, MapPin, Loader } from "lucide-react";

const TouristSpots = () => {
  const [touristSpots, setTouristSpots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTouristSpotId, setCurrentTouristSpotId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchTouristSpots = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BASE_URL}/api/tourist-spots`);
      if (!response.ok) {
        throw new Error("Failed to fetch tourist spots.");
      }
      const data = await response.json();
      setTouristSpots(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTouristSpots();
  }, [fetchTouristSpots]);

  const resetFormAndCloseModal = () => {
    setIsEditing(false);
    setCurrentTouristSpotId(null);
    setTitle("");
    setDescription("");
    setLocation("");
    setImage(null);
    setImagePreview("");
    setError("");
    setShowModal(false);
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setCurrentTouristSpotId(null);
    setTitle("");
    setDescription("");
    setLocation("");
    setImage(null);
    setImagePreview("");
    setError("");
    setShowModal(true);
  };

  const handleEdit = (spot) => {
    setIsEditing(true);
    setCurrentTouristSpotId(spot.id || spot._id || spot.ID);
    setTitle(spot.name || spot.NAME || "");
    setDescription(spot.description || spot.DESCRIPTION || "");
    setLocation(spot.location || spot.LOCATION || "");
    setImage(null);
    const imageName = spot.image || spot.IMAGE;
    setImagePreview(imageName ? `${BASE_URL}/uploads/${imageName}` : "");
    setError("");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this tourist spot?")) {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`${BASE_URL}/api/tourist-spots/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          let errorData;
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            errorData = await response.json();
          } else {
            const errorText = await response.text();
            console.error("Server returned non-JSON response:", errorText);
            throw new Error(`Server Error: ${response.status} ${response.statusText}. Check console for details.`);
          }
          throw new Error(errorData.message || "Failed to delete tourist spot.");
        }
        await fetchTouristSpots();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    resetFormAndCloseModal();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title || !description || !location) {
      setError("Please fill in all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("name", title);
    formData.append("description", description);
    formData.append("location", location);
    if (image) {
      formData.append("image", image);
    }

    try {
      setIsLoading(true);
      let response;
      if (isEditing) {
        response = await fetch(`${BASE_URL}/api/tourist-spots/${currentTouristSpotId}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        response = await fetch(`${BASE_URL}/api/tourist-spots`, {
          method: "POST",
          body: formData,
        });
      }

      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          errorData = await response.json();
        } else {
          const errorText = await response.text();
          console.error("Server returned non-JSON response:", errorText);
          throw new Error(`Server Error: ${response.status} ${response.statusText}. Check console for details.`);
        }
        throw new Error(errorData.message || "Failed to save tourist spot.");
      }

      await fetchTouristSpots();
      resetFormAndCloseModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="admin-tourist-spots-container">
      <header className="header1">
        <div className="header-content">
          <div>
            <h1 className="header-title">Tourist Spot Management</h1>
            <p className="header-subtitle">Manage and organize your tourist spots</p>
          </div>
          <button onClick={handleAddNew} className="add-tourist-spot-btn" disabled={isLoading}>
            <Plus size={16} />
            Add Tourist Spot
          </button>
        </div>
      </header>

      <main className="main-content">
        {isLoading && touristSpots.length === 0 && <p>Loading...</p>}
        {error && <p className="error-message">{error}</p>}
        
        {!isLoading && !error && touristSpots.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">No tourist spots yet</h3>
            <p className="empty-state-description">Get started by creating your first tourist spot</p>
            <button onClick={handleAddNew} className="add-tourist-spot-btn" disabled={isLoading}>
              <Plus size={16} />
              Add Your First Tourist Spot
            </button>
          </div>
        ) : (
          <div className="tourist-spots-grid">
            {touristSpots.map((spot) => (
              <div key={spot.id || spot._id || spot.ID} className="tourist-spot-card">
                {(spot.image || spot.IMAGE) && (
                  <div className="tourist-spot-image">
                    <img src={`${BASE_URL}/uploads/${spot.image || spot.IMAGE}`} alt={spot.name || spot.NAME} />
                  </div>
                )}
                <div className="tourist-spot-content">
                  <h3 className="tourist-spot-title">{spot.name || spot.NAME}</h3>
                  <div className="tourist-spot-date">
                    <MapPin size={16} className="tourist-spot-date-icon" />
                    {spot.location || spot.LOCATION}
                  </div>
                  <p className="tourist-spot-description">{spot.description || spot.DESCRIPTION}</p>
                  <div className="tourist-spot-actions">
                    <button onClick={() => handleEdit(spot)} className="edit-btn" disabled={isLoading}>
                      <Edit size={16} />
                      Edit
                    </button>
                    <button onClick={() => handleDelete(spot.id || spot._id || spot.ID)} className="delete-btn" disabled={isLoading}>
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{isEditing ? "Edit Tourist Spot" : "Create New Tourist Spot"}</h2>
              <button onClick={handleCloseModal} className="close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="form-container">
              {error && <p className="error-message">{error}</p>}
              <div className="form-group">
                <label htmlFor="title" className="form-label">Tourist Spot Name</label>
                <div className="input-wrapper">
                  <Type size={20} className="input-icon" />
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input"
                    placeholder="Enter tourist spot name"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea"
                  placeholder="Describe the tourist spot..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="location" className="form-label">Location</label>
                <div className="input-wrapper">
                  <MapPin size={20} className="input-icon" />
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="form-input"
                    placeholder="Enter location"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Image</label>
                <input
                  type="file"
                  id="image-upload"
                  className="file-input-hidden"
                  onChange={handleImageChange}
                  accept="image/*"
                  disabled={isLoading}
                />
                <label htmlFor="image-upload" className="file-upload-area">
                  <Image size={24} className="file-upload-icon" />
                  <span className="file-upload-text">Click to upload image</span>
                </label>
              </div>

              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" className="preview-image" />
                  <button
                    type="button"
                    onClick={() => { setImage(null); setImagePreview(""); }}
                    className="remove-image-btn"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="form-buttons">
                <button type="button" onClick={handleCloseModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? <><Loader size={16} className="spinner" /> Saving...</> 
                  : (isEditing ? "Update Tourist Spot" : "Create Tourist Spot")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TouristSpots;
