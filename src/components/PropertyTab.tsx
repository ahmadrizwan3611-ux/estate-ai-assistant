import React, { useState, useEffect } from 'react';
import { Plus, Search, Building, MapPin, DollarSign, Fullscreen, Video, BadgeInfo, CheckCircle, Trash2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Property } from '../types';

interface PropertyTabProps {
  properties: Property[];
  onPropertyAdded: () => void;
  onPropertyDeleted: (id: string) => void;
}

export default function PropertyTab({ properties, onPropertyAdded, onPropertyDeleted }: PropertyTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  
  // Form coordinates
  const [title, setTitle] = useState('');
  const [size, setSize] = useState('5 Marla'); // strict size words
  const [city, setCity] = useState('Lahore');
  const [area, setArea] = useState('DHA Phase 6');
  const [type, setType] = useState('House');
  const [purpose, setPurpose] = useState<'Sale' | 'Rent'>('Sale');
  const [price, setPrice] = useState('18500000');
  const [bedrooms, setBedrooms] = useState('3');
  const [bathrooms, setBathrooms] = useState('3');
  const [furnishedStatus, setFurnishedStatus] = useState('Semi-Furnished');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [mapPin, setMapPin] = useState('https://maps.google.com/?q=DHA+Phase+6+Lahore');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80');
  const [locationNotes, setLocationNotes] = useState('Central sector near parks and commercial boulevard.');
  const [submitting, setSubmitting] = useState(false);

  // Filter properties
  const filtered = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.size.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === 'All' || p.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const priceNum = parseFloat(price);
    const crValue = priceNum / 10000000;
    const priceDisplay = crValue >= 1 
      ? `Rs. ${crValue.toFixed(2)} crore` 
      : `Rs. ${(priceNum / 100000).toFixed(0)} lakh`;

    const payload = {
      title,
      size, // MUST COPY SIZE WORD EXACTLY
      city,
      area,
      type,
      purpose,
      price: priceNum,
      price_display: priceDisplay,
      bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
      bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
      furnished_status: furnishedStatus,
      description,
      image_urls: [imageUrl],
      video_url: videoUrl,
      map_pin: mapPin,
      location_notes: locationNotes
    };

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onPropertyAdded();
        setShowAddModal(false);
        // Reset form
        setTitle('');
        setPrice('18000000');
        setDescription('');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit property');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="property-tab" className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-medium text-brand-slate-900">CRM Property Database</h1>
          <p className="text-sm text-brand-slate-700">Actual property files matching verified customer intents. Facts are strictly preserved here.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-brand-teal-500 hover:bg-brand-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_2px_8px_rgba(13,148,136,0.15)] cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          Add CRM Listing
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-brand-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between mb-6">
        <div className="flex items-center gap-2 bg-brand-slate-100 px-3 py-1.5 rounded-lg border border-brand-slate-200 w-full max-w-xs">
          <Search className="w-4 h-4 text-brand-slate-700" />
          <input
            type="text"
            className="bg-transparent border-none text-xs text-brand-slate-900 focus:outline-none w-full"
            placeholder="Search size, tags, or area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {['All', 'Lahore', 'Islamabad', 'Gujranwala'].map((cityOption) => (
            <button
              key={cityOption}
              onClick={() => setCityFilter(cityOption)}
              className={`px-3.5 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer border ${
                cityFilter === cityOption
                  ? 'bg-brand-teal-500 text-white border-brand-teal-500'
                  : 'bg-brand-slate-100 hover:bg-brand-slate-200 text-brand-slate-900 border-brand-slate-200'
              }`}
            >
              {cityOption}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of properties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-brand-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow relative flex flex-col h-full"
          >
            <div className="relative h-48 w-full bg-brand-slate-100">
              <img
                src={p.image_urls[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'}
                alt={p.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 bg-brand-teal-500 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm">
                For {p.purpose}
              </div>
              <div className="absolute top-3 right-3 bg-brand-slate-950/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-sm">
                ID: {p.id}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-brand-teal-500 font-bold uppercase tracking-wide">
                    {p.type} — {p.size}
                  </span>
                  <span className="text-xs font-mono font-medium text-brand-teal-500 px-2 py-0.5 bg-brand-teal-50 rounded-md">
                    {p.furnished_status || 'Unfurnished'}
                  </span>
                </div>

                <h3 className="text-base font-display font-bold text-brand-slate-900 mb-2 leading-snug">
                  {p.title}
                </h3>

                <p className="text-xs text-brand-slate-700 line-clamp-2 mb-4">
                  {p.description}
                </p>

                <div className="space-y-1.5 pt-3 border-t border-brand-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-brand-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-brand-teal-500 flex-shrink-0" />
                    <span>{p.area}, {p.city}</span>
                  </div>
                  {p.bedrooms ? (
                    <div className="flex items-center gap-4 text-xs text-brand-slate-700 font-mono mt-1">
                      <span>🛏 {p.bedrooms} Beds</span>
                      <span>🛁 {p.bathrooms || p.bedrooms} Baths</span>
                    </div>
                  ) : null}
                  {p.map_pin && (
                    <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-medium">
                      <Fullscreen className="w-3.5 h-3.5" />
                      <a href={p.map_pin} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Google Map Pin Installed
                      </a>
                    </div>
                  )}
                  {p.video_url && (
                    <div className="flex items-center gap-1.5 text-[11px] text-red-600 font-medium">
                      <Video className="w-3.5 h-3.5" />
                      <a href={p.video_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Virtual Video Tour Link
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-3 border-t border-brand-slate-100">
                <div>
                  <span className="text-[10px] text-brand-slate-200/80 uppercase block tracking-wider font-medium">Verified demand</span>
                  <span className="text-lg font-display font-extrabold text-brand-teal-700 leading-none">
                    {p.price_display}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onPropertyDeleted(p.id)}
                    className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete property file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="bg-brand-teal-50 text-brand-teal-700 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full">
                    {p.status}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-brand-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-brand-slate-200"
            >
              <div className="bg-brand-slate-900 text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-display font-medium">Add Property to CRM Catalog</h3>
                  <p className="text-xs text-brand-slate-200">The Continuity Engine matches these exact details. Do not spoof.</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-brand-slate-200 hover:text-white text-xl cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wider mb-1">
                      Property Title
                    </label>
                    <input
                      type="text"
                      className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                      placeholder="e.g. 5 Marla Modern House Block C"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wider mb-1">
                      Exact Size (Strict text format)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500 font-bold text-brand-teal-700"
                      placeholder="e.g. 5 Marla, 10 Marla, 1 Kanal"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wider mb-1">
                      City
                    </label>
                    <select
                      className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    >
                      <option value="Lahore">Lahore</option>
                      <option value="Islamabad">Islamabad</option>
                      <option value="Karachi">Karachi</option>
                      <option value="Gujranwala">Gujranwala</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wider mb-1">
                      Sector / Area
                    </label>
                    <input
                      type="text"
                      className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                      placeholder="e.g. DHA Phase 6"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wider mb-1">
                      Sub Type
                    </label>
                    <select
                      className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="House">House</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Plot">Plot</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wider mb-1">
                      Purpose
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPurpose('Sale')}
                        className={`flex-1 py-1.5 text-xs rounded-lg font-bold border transition-colors cursor-pointer ${
                          purpose === 'Sale' 
                            ? 'bg-brand-teal-500 text-white border-brand-teal-500' 
                            : 'bg-brand-slate-100 border-brand-slate-200 text-brand-slate-900'
                        }`}
                      >
                        Sale
                      </button>
                      <button
                        type="button"
                        onClick={() => setPurpose('Rent')}
                        className={`flex-1 py-1.5 text-xs rounded-lg font-bold border transition-colors cursor-pointer ${
                          purpose === 'Rent'
                            ? 'bg-brand-teal-500 text-white border-brand-teal-500'
                            : 'bg-brand-slate-100 border-brand-slate-200 text-brand-slate-900'
                        }`}
                      >
                        Rent
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wider mb-1">
                      Price (Raw Rs. value)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500 font-mono"
                      placeholder="e.g. 18500000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wider mb-1">
                      Furnished Status
                    </label>
                    <select
                      className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                      value={furnishedStatus}
                      onChange={(e) => setFurnishedStatus(e.target.value)}
                    >
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Completed Brand New">Completed Brand New</option>
                      <option value="Fully Furnished">Fully Furnished</option>
                      <option value="Unfurnished">Unfurnished</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wider mb-1">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                      placeholder="e.g. 3"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wider mb-1">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                      placeholder="e.g. 3"
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wider mb-1">
                      Image URL (Single sample placeholder)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500 text-brand-slate-700"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wider mb-1">
                      Google Maps Link (Map Pin Feature)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500 text-brand-slate-700"
                      value={mapPin}
                      onChange={(e) => setMapPin(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wider mb-1">
                      Video Tour URL (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                      placeholder="YouTube link, etc."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wider mb-1">
                    Location Notes
                  </label>
                  <input
                    type="text"
                    className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                    value={locationNotes}
                    onChange={(e) => setLocationNotes(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-slate-900 uppercase tracking-wider mb-1">
                    Description details
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-brand-slate-100 border border-brand-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-teal-500"
                    placeholder="Write detailed CRM listing facts here..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-brand-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-brand-slate-100 hover:bg-brand-slate-200 text-brand-slate-900 py-2 px-4 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-brand-teal-500 hover:bg-brand-teal-600 disabled:bg-brand-teal-500/50 text-white py-2 px-5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Save File Listing'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
