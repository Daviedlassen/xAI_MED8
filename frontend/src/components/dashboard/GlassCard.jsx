import React, { useState } from "react";
import "./GlassCard.css";

const GlassCard = ({ contentId, onRemove, onDropModule, renderContent, isLocked }) => {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      className={`glass-card ${isOver ? "is-over" : ""}`}
      onDragOver={(e) => { if (isLocked) return; e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        if (isLocked) return;
        e.preventDefault(); setIsOver(false);
        const mid = e.dataTransfer.getData("moduleId");
        if (mid) onDropModule(mid);
      }}
    >
      <div className="glass-inner">
        {contentId ? renderContent() : (
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