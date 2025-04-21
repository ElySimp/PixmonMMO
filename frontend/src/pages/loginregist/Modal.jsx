import React from "react";
import "./modal.css";

const Modal = ({ isOpen, onClose, children }) => {
  return (
    <div className={`modal-overlay ${isOpen ? "show" : ""}`}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
