"use client";

import React, { ReactNode, forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";

interface SortableModuleProps {
  id: string;
  children: ReactNode;
  span?: number;
  className?: string;
  disabled?: boolean;
}

export const SortableModule = forwardRef<HTMLDivElement, SortableModuleProps>(
  function SortableModule({ id, children, span = 1, className = "", disabled = false }, ref) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id, disabled });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <motion.div
        ref={(node) => {
          setNodeRef(node);
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        style={style}
        className={`sortable-item ${isDragging ? "dragging" : ""} ${span === 2 ? "span-2" : ""} ${className}`}
        layout
        layoutId={id}
        initial={false}
        animate={{
          scale: isDragging ? 1.02 : 1,
          boxShadow: isDragging
            ? "0 20px 50px rgba(0, 0, 0, 0.5)"
            : "none",
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
      >
        {/* Drag Handle - 6 dots grid */}
        {!disabled && (
          <div
            className="drag-handle-dots"
            {...attributes}
            {...listeners}
          >
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        )}
        {children}
      </motion.div>
    );
  }
);

// Alternative drag handle component for custom positioning
interface DragHandleProps {
  listeners?: ReturnType<typeof useSortable>["listeners"];
  attributes?: ReturnType<typeof useSortable>["attributes"];
  className?: string;
}

export function DragHandle({ listeners, attributes, className = "" }: DragHandleProps) {
  return (
    <button
      type="button"
      className={`touch-none cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/10 transition-colors ${className}`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="w-4 h-4 text-gray-400" />
    </button>
  );
}

export default SortableModule;
