import { useState, useEffect } from 'react';

/**
 * Custom hook to get the user's current GPS position.
 * Returns { lat, lng, loading, error, refresh }
 */
const useGeolocation = () => {
  const [state, setState] = useState({
    lat: null,
    lng: null,
    loading: true,
    error: null,
  });

  const fetchLocation = () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setState({ lat: null, lng: null, loading: false, error: 'Geolocation is not supported by your browser.' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (err) => {
        setState({
          lat: null,
          lng: null,
          loading: false,
          error: `Location access denied: ${err.message}`,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return { ...state, refresh: fetchLocation };
};

export default useGeolocation;
