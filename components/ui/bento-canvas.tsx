"use client";

import React, { useState, useCallback, ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { motion, AnimatePresence } from "framer-motion";

export interface BentoItem {
  id: string;
  order: number;
  span?: number; // 1 = 1x1, 2 = 2x1
  [key: string]: unknown;
}

interface BentoCanvasProps<T extends BentoItem> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, isDragging: boolean) => ReactNode;
  renderOverlay?: (item: T) => ReactNode;
  columns?: 2 | 4;
  className?: string;
  emptyMessage?: string;
}

export function BentoCanvas<T extends BentoItem>({
  items,
  onReorder,
  renderItem,
  renderOverlay,
  columns = 4,
  className = "",
  emptyMessage = "No items to display",
}: BentoCanvasProps<T>) {
  const [isDragging, setIsDragging] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setIsDragging(true);
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDragging(false);
      setActiveId(null);

      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order: index,
        }));

        onReorder(newItems);
      }
    },
    [items, onReorder]
  );

  const handleDragCancel = useCallback(() => {
    setIsDragging(false);
    setActiveId(null);
  }, []);

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  const gridClass = columns === 4 ? "bento-grid-4" : "bento-grid";

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToParentElement]}
    >
      <div
        className={`bento-canvas ${isDragging ? "dragging" : ""} ${className}`}
      >
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-500">
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <motion.div className={gridClass} layout>
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                    className={item.span === 2 ? "span-2" : ""}
                  >
                    {renderItem(item, item.id === activeId)}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </SortableContext>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem && renderOverlay ? (
          <div className="opacity-90 scale-105">
            {renderOverlay(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default BentoCanvas;
