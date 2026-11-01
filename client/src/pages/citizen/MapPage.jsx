import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import MapView from '../../components/map/MapView';
import { getIssuesForMap } from '../../services/issueService';
import { Loader2, AlertCircle } from 'lucide-react';

function MapPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getIssuesForMap();
        setIssues(data);
      } catch (err) {
        setError('Failed to load map data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Civic Issues Map</h1>
          <p className="text-slate-400">
            Visualize all reported issues across the city.{' '}
            <span className="text-slate-500 text-sm">{issues.length} issues loaded.</span>
          </p>
        </div>

        <div className="relative w-full h-[calc(100vh-260px)] min-h-[500px]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 rounded-2xl border border-slate-800">
              <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
              <p className="text-slate-500 mt-3 text-sm">Loading map data...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center space-x-3 p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
                <AlertCircle className="w-6 h-6" />
                <span>{error}</span>
              </div>
            </div>
          ) : (
            <MapView issues={issues} />
          )}
        </div>
      </div>
    </div>
  );
}

export default MapPage;
