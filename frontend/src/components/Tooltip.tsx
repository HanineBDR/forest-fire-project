"use client";

import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: TooltipPosition;
  delay?: number;
  delayDuration?: number;
  disabled?: boolean;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  delay,
  delayDuration,
  disabled = false,
  className = "",
}) => {
  const effectiveDelay = delayDuration !== undefined ? delayDuration : (delay !== undefined ? delay : 40);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    actualPosition: TooltipPosition;
  }>({
    top: 0,
    left: 0,
    actualPosition: position,
  });

  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const id = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;

    const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 160;
    const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 34;

    const gap = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let actualPos = position;

    // Auto-flip vertically if space is insufficient
    if (position === "top" && triggerRect.top - tooltipHeight - gap < 8) {
      actualPos = "bottom";
    } else if (position === "bottom" && triggerRect.bottom + tooltipHeight + gap > viewportHeight - 8) {
      actualPos = "top";
    }

    // Auto-flip horizontally if space is insufficient
    if (position === "left" && triggerRect.left - tooltipWidth - gap < 8) {
      actualPos = "right";
    } else if (position === "right" && triggerRect.right + tooltipWidth + gap > viewportWidth - 8) {
      actualPos = "left";
    }

    let top = 0;
    let left = 0;

    if (actualPos === "top") {
      top = triggerRect.top - tooltipHeight - gap;
      left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
    } else if (actualPos === "bottom") {
      top = triggerRect.bottom + gap;
      left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
    } else if (actualPos === "left") {
      top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
      left = triggerRect.left - tooltipWidth - gap;
    } else if (actualPos === "right") {
      top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
      left = triggerRect.right + gap;
    }

    // Horizontal boundary clamp: keep tooltip within viewport
    const padding = 10;
    if (left < padding) {
      left = padding;
    } else if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }

    // Vertical boundary clamp
    if (top < padding) {
      top = padding;
    } else if (top + tooltipHeight > viewportHeight - padding) {
      top = viewportHeight - tooltipHeight - padding;
    }

    setCoords({ top, left, actualPosition: actualPos });
  }, [position]);

  const hasValidContent = Boolean(
    content && (typeof content !== "string" || content.trim().length > 0)
  );

  const show = useCallback(() => {
    if (disabled || !hasValidContent) return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, effectiveDelay);
  }, [clearTimer, effectiveDelay, disabled, hasValidContent]);

  const hide = useCallback(() => {
    clearTimer();
    setIsVisible(false);
  }, [clearTimer]);

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      const onDismiss = () => hide();
      window.addEventListener("scroll", onDismiss, true);
      window.addEventListener("resize", onDismiss);
      return () => {
        window.removeEventListener("scroll", onDismiss, true);
        window.removeEventListener("resize", onDismiss);
      };
    }
  }, [isVisible, updatePosition, hide]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Clone children to attach ref, mouse/focus events, and accessibility attributes
  const clonedChild = React.cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const { ref } = children as any;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && typeof ref === "object") {
        ref.current = node;
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      show();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hide();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      show();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hide();
      children.props.onBlur?.(e);
    },
    onClick: (e: React.MouseEvent) => {
      hide();
      children.props.onClick?.(e);
    },
    "aria-describedby": isVisible ? id : children.props["aria-describedby"],
  });

  return (
    <>
      {clonedChild}
      {mounted &&
        isVisible &&
        !disabled &&
        hasValidContent &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            id={id}
            role="tooltip"
            className={`fixed z-[2700] pointer-events-none transition-opacity duration-75 ease-out animate-in fade-in-50 ${className}`}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
          >
            <div className="relative bg-slate-900 text-slate-100 text-[11px] font-medium leading-snug px-2.5 py-1.5 rounded-lg border border-slate-700 shadow-2xl shadow-black/80 backdrop-blur-md max-w-xs whitespace-normal text-center select-none">
              {content}

              {/* Pointing Arrow */}
              {coords.actualPosition === "top" && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45" />
              )}
              {coords.actualPosition === "bottom" && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-l border-t border-slate-700 rotate-45" />
              )}
              {coords.actualPosition === "left" && (
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-t border-r border-slate-700 rotate-45" />
              )}
              {coords.actualPosition === "right" && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 border-b border-l border-slate-700 rotate-45" />
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

