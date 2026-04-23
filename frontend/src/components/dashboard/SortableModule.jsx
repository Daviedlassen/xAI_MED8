import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import GlassCard from "./GlassCard";

const SortableModule = ({ id, contentId, size, isLocked, renderContent, onRemove, onDropModule }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isLocked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`grid-item ${size}`}>
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        animate={{ scale: isDragging ? 1.02 : 1, opacity: isDragging ? 0.6 : 1 }}
        style={{ height: "100%" }}
      >
        <GlassCard
          contentId={contentId}
          isLocked={isLocked}
          onRemove={onRemove}
          onDropModule={onDropModule}
          dragProps={!isLocked ? { ...attributes, ...listeners } : {}}
          renderContent={renderContent}
        />
      </motion.div>
    </div>
  );
};

export default SortableModule;