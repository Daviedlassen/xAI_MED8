import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import GlassCard from "./GlassCard";

const SortableModule = ({ id, contentId, size, componentMap, onRemove, onCycleSize, onDropModule }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

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
          componentMap={componentMap}
          onRemove={onRemove}
          onCycleSize={onCycleSize}
          onDropModule={onDropModule}
          dragProps={{ ...attributes, ...listeners }}
        />
      </motion.div>
    </div>
  );
};

export default SortableModule;