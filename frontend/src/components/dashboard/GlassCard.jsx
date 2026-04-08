import React, { useState } from "react";
import "./GlassCard.css";

const GlassCard = ({ contentId, onRemove, onCycleSize, dragProps, onDropModule, componentMap }) => {
  const [isOver, setIsOver] = useState(false);
  const ActiveComponent = componentMap[contentId];

  return (
    <div
      className={`glass-card ${isOver ? "is-over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setIsOver(false);
        const mid = e.dataTransfer.getData("moduleId");
        if (mid) onDropModule(mid);
      }}
    >
      <div className="glass-header">
        <button className="glass-size-btn" onClick={onCycleSize} title="Change Size">⤢</button>
        <div className="drag-handle" {...dragProps}>
          <div className="pill"></div>
        </div>
        <button className="glass-close-btn" onClick={onRemove}>×</button>
      </div>
      <div className="glass-inner">
        {ActiveComponent ? (
          <ActiveComponent />
        ) : (
          <div className="striped-drop-zone">
            <div className="drop-content">
              <div className="drop-plus">+</div>
              <span>Drop clinical tool here</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlassCard;