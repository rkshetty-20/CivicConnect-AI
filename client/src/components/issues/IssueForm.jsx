import React, { useState, useRef } from 'react';
import { MapPin, UploadCloud, X, Loader2, AlertCircle, CheckCircle2, Image, LocateFixed } from 'lucide-react';
import useGeolocation from '../../hooks/useGeolocation';
import LocationPicker from '../map/LocationPicker';

const CATEGORIES = [
  'Garbage', 'Roads', 'Water', 'Electricity', 'Sewage',
  'Streetlights', 'Parks', 'Public Transport', 'Building Safety',
  'Noise Pollution', 'Other',
];

function IssueForm({ onSubmit, loading, error }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();
  const { lat: geoLat, lng: geoLng, loading: geoLoading, error: geoError, refresh } = useGeolocation();
  // Manual map-picked location overrides the detected GPS position.
  const [picked, setPicked] = useState({ lat: null, lng: null });

  const lat = picked.lat ?? geoLat;
  const lng = picked.lng ?? geoLng;
  const usingPicked = picked.lat != null;

  const useMyLocation = () => {
    setPicked({ lat: null, lng: null });
    refresh();
  };

  const handleFiles = (files) => {
    const valid = Array.from(files).filter(
      (f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024
    );
    if (images.length + valid.length > 4) {
      alert('Maximum 4 images allowed.');
      return;
    }
    setImages((prev) => [...prev, ...valid]);
    valid.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!lat || !lng) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('address', address);
    formData.append('lat', lat);
    formData.append('lng', lng);
    images.forEach((img) => formData.append('images', img));

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Issue Title <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={150}
          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition"
          placeholder="e.g. Broken streetlight near park entrance"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Description <span className="text-rose-400">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition resize-none"
          placeholder="Describe the problem in detail — what, where, since when..."
          required
        />
        <p className="text-xs text-slate-600 mt-1 text-right">{description.length}/2000</p>
      </div>

      {/* Address */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Street Address / Landmark <span className="text-slate-600 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition"
          placeholder="e.g. Near Rajiv Gandhi Circle, Koramangala"
        />
      </div>

      {/* GPS Location */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Location <span className="text-rose-400">*</span>
        </label>
        <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border text-sm mb-3 ${
          lat ? 'border-teal-500/30 bg-teal-500/5' : geoError ? 'border-rose-500/30 bg-rose-500/5' : 'border-slate-800 bg-slate-950'
        }`}>
          <MapPin className={`w-5 h-5 flex-shrink-0 ${lat ? 'text-teal-400' : geoError ? 'text-rose-400' : 'text-slate-500'}`} />
          {geoLoading && !lat ? (
            <span className="text-slate-400 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Detecting location...</span>
            </span>
          ) : lat ? (
            <span className="text-teal-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{usingPicked ? 'Pinned' : 'GPS'}: {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}</span>
            </span>
          ) : (
            <span className="text-rose-400">{geoError || 'Location unavailable'}</span>
          )}
          <button
            type="button"
            onClick={useMyLocation}
            className="ml-auto flex items-center space-x-1.5 text-xs text-slate-400 hover:text-teal-300 transition"
            title="Use my current GPS location"
          >
            <LocateFixed className="w-4 h-4" />
            <span>Use my location</span>
          </button>
        </div>

        <LocationPicker
          lat={lat}
          lng={lng}
          onPick={(nextLat, nextLng) => setPicked({ lat: nextLat, lng: nextLng })}
          address={address}
          setAddress={setAddress}
        />
        <p className="text-xs text-slate-600 mt-2">
          Click the map to drop a pin, or use your current GPS. The address is resolved automatically.
        </p>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Photos <span className="text-slate-600 font-normal">(up to 4, max 5MB each)</span>
        </label>
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
            dragOver ? 'border-teal-500 bg-teal-500/5' : 'border-slate-700 hover:border-slate-600'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <UploadCloud className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Drag & drop photos here, or click to select</p>
          <p className="text-xs text-slate-600 mt-1">JPEG, PNG, WebP — max 5MB each</p>
        </div>

        {/* Previews */}
        {previews.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {previews.map((src, idx) => (
              <div key={idx} className="relative rounded-lg overflow-hidden aspect-square">
                <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                  className="absolute top-1 right-1 p-0.5 bg-slate-900/80 rounded-full text-slate-300 hover:text-red-400 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Notice */}
      <div className="flex items-start space-x-3 px-4 py-3 rounded-xl bg-teal-500/5 border border-teal-500/15 text-xs text-teal-400/80">
        <Image className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Our AI will automatically classify the category and severity of your issue based on the title and description. This helps route it to the right department faster.
        </span>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !lat || !lng}
        className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Submitting & Analysing...</span>
          </>
        ) : (
          <span>Submit Issue Report</span>
        )}
      </button>
    </form>
  );
}

export default IssueForm;
