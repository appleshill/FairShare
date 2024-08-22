import React from 'react';

const ConfirmationModal = ({ isOpen, message, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <p>{message}</p>
                <button onClick={onConfirm}>Confirm</button>
                <button onClick={onClose}>Go Back</button>
            </div>
            <style jsx>{`
            .modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5); 
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1050;
            }

            .modal {
                background: var(--background-color, white); 
                color: var(--text-color, #333); 
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2); 
                width: 90%; 
                max-width: 500px; 
                box-sizing: border-box; 
            }

            button {
                margin: 10px;
                padding: 10px 20px;
                border: none;
                background-color: var(--primary-color, #007BFF); 
                color: white;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s ease; 
            }

            button:hover {
                background-color: var(--primary-hover-color, #0056b3); 
}

            `}</style>
        </div>
    );
};

export default ConfirmationModal;
