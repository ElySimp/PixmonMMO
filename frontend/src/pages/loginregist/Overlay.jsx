import React from "react";
import "./Overlay.css";

const Overlay = ({ isOpen, onClose, children }) => {
  return isOpen ? (
    <div className={`modal-overlay ${isOpen ? "show" : ""}`}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        <div className="overlay-container">
          <div className="overlay-container-left">
            <img src="/dummy1.jpg" alt="" />
            <img src="/dummy2.jpg" alt="" />
            <img src="/dummy3.jpg" alt="" />
            <img src="/dummy4.jpg" alt="" />
          </div>
          <div className="overlay-container-right">
            {children}
          </div>
        </div>
      </div>
    </div>
  ): null;
};

export default Overlay;
