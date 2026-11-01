import React from 'react';
import { Navigate } from 'react-router-dom';

function Home() {
  return <Navigate to="/feed" replace />;
}

export default Home;
