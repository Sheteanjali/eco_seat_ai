import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ userRole }) => {
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center p-4 bg-green-700 text-white shadow-md">
      <div className="font-bold text-xl">Eco-Seat AI</div>
      <div className="space-x-6">
        <Link to="/" className="hover:underline">Home</Link>
        {userRole === 'admin' ? (
          <>
            <Link to="/admin/upload" className="hover:underline">Ingest Data</Link>
            <Link to="/admin/map" className="hover:underline">Digital Twin</Link>
          </>
        ) : (
          <Link to="/student/seat" className="hover:underline">My Seat</Link>
        )}
        <button 
          onClick={() => navigate('/login')} 
          className="bg-white text-green-700 px-4 py-1 rounded font-semibold"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;