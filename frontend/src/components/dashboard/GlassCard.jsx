import React, { useState } from "react";
import "./GlassCard.css";

const GlassCard = ({
  contentId,
  onRemove,
  dragProps,
  onDropModule,
  renderContent, // Recieved from SortableModule
  isLocked       // New: used to hide UI elements
}) => {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      className={`glass-card ${isOver ? "is-over" : ""} ${isLocked ? "is-locked" : ""}`}
      onDragOver={(e) => {
        if (isLocked) return; // Prevent drop if locked
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        if (isLocked) return;
        e.preventDefault();
        setIsOver(false);
        const mid = e.dataTransfer.getData("moduleId");
        if (mid) onDropModule(mid);
      }}
    >
      {/* 1. Header: Only show if NOT locked */}
      {!isLocked && (
        <div className="glass-header">
          <div className="drag-handle" {...dragProps}>
            <div className="pill"></div>
          </div>
          <button className="glass-close-btn" onClick={onRemove}>×</button>
        </div>
      )}

      {/* 2. Body: Renders the pre-built component from Dashboard */}
      <div className="glass-inner">
        {contentId ? (
          renderContent()
        ) : (
          /* Only show the drop zone if NOT locked and empty */
          !isLocked && (
            <div className="striped-drop-zone">
              <div className="drop-content">
                <div className="drop-plus">+</div>
                <span>Drop clinical tool here</span>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default GlassCard;