import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import ArtworkDetail from './components/ArtworkDetail';
import Register from './components/Register';
import Login from './components/Login'; // Import the Login component
import './assets/styles/App.css'; // Adjust the path as needed

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/artwork/:id/" element={<ArtworkDetail />} />
        <Route path="/register/" element={<Register />} />
        <Route path="/login/" element={<Login />} /> {/* Add the Login route */}
      </Routes>
    </Router>
  );
}

export default App;