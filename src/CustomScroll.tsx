"use client";

import React, {
  CSSProperties,
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import classes from "./CustomScroll.module.css";

export function CustomScroll({
  setTranslate,
  scrollLength,
  ancestorRef,
  childrenRef,
  direction = "horizontal",
  styles,
  visible = "visible",
  drag = {
    draggable: true,
    showGrabCursor: true,
  },
  children,
}: {
  setTranslate: Dispatch<SetStateAction<number>>;
  ancestorRef: HTMLElement | null;
  scrollLength: number;
  childrenRef: HTMLElement | null;
  direction?: "horizontal" | "vertical";
  styles?: {
    wrapper?: CSSProperties;
    scroll?: CSSProperties;
  };
  visible?: "visible" | "onHover" | "none";
  drag?: {
    draggable: boolean;
    showGrabCursor?: boolean;
  };
  children?: React.ReactNode;
}) {
  const isDragging = useRef(false);
  const [isDraggingReactive, setIsDraggingReactive] = useState(false);
  const translate = useRef(0);
  const scrollEl = useRef<HTMLDivElement>(null);
  const scrollWrapperEl = useRef<HTMLDivElement>(null);
  const scrollLengthRef = useRef(0);
  const downCoord = useRef(0);
  const initScrollCoord = useRef(0);
  const isReverse = useRef(false);
  const scrollFactor = useRef(0);
  const [translateReactive, setTranslateReactive] = useState(0);
  const dragType = useRef<"drag" | "scrollDrag" | null>(null);
  const velocity = useRef(0);
  const lastTouch = useRef(0);
  const touchSensitivity = useRef(0.3);
  const wheelSensitivity = useRef(0.3);
  const oldDelta = useRef(0);
  const slidingAnimId = useRef(0);
  const childrenRefAsVar = useRef(childrenRef);
  const timerId = useRef<NodeJS.Timeout | string | number | undefined>(
    undefined
  );

  function getElTransform(el: HTMLElement) {
    return +window
      .getComputedStyle(el)
      .transform.match(/matrix.*\((.+)\)/)![1]
      .split(",")[direction === "horizontal" ? 4 : 5];
  }

  function moveToClick(e: React.MouseEvent) {
    if (scrollEl.current && scrollWrapperEl.current) {
      const mouseDownEvent = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0,
      });
      const mouseMoveEvent = new MouseEvent("mousemove", {
        bubbles: true,
        cancelable: true,
        clientX:
          e.clientX -
          scrollWrapperEl.current.getBoundingClientRect().x -
          getElTransform(scrollEl.current) -
          scrollLengthRef.current / 2,
        clientY:
          e.clientY -
          scrollWrapperEl.current.getBoundingClientRect()[
            direction === "horizontal" ? "x" : "y"
          ] -
          getElTransform(scrollEl.current) -
          scrollLengthRef.current / 2,
      });
      const mouseUpEvent = new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0,
      });

      scrollEl.current.dispatchEvent(mouseDownEvent);
      scrollEl.current.dispatchEvent(mouseMoveEvent);
      scrollEl.current.dispatchEvent(mouseUpEvent);
    }
  }

  function setScrollSpace(space: number, direction: "horizontal" | "vertical") {
    if (childrenRef && ancestorRef) {
      const childrenLength =
        childrenRef.getBoundingClientRect()[
          direction === "horizontal" ? "width" : "height"
        ];
      const ancestorLength =
        ancestorRef.getBoundingClientRect()[
          direction === "horizontal" ? "width" : "height"
        ];
      scrollFactor.current = (childrenLength - ancestorLength) / space;
    }
  }

  function animate({
    timing,
    draw,
    duration,
  }: {
    timing: (timeFraction: number) => number;
    draw: (progress: number) => void;
    duration: number;
  }) {
    let start = performance.now();
    let stopAnimation = false;

    const handleTouchStart = () => {
      stopAnimation = true;
    };

    if (childrenRefAsVar.current) {
      childrenRefAsVar.current.addEventListener("touchstart", handleTouchStart);
    }

    slidingAnimId.current = requestAnimationFrame(function animate(time) {
      clearTimeout(timerId.current);
      let timeFraction = (time - start) / duration;
      if (timeFraction > 1) timeFraction = 1;

      let progress = timing(timeFraction);

      if (!stopAnimation) {
        draw(progress);
      }

      if (timeFraction < 1 && !stopAnimation) {
        requestAnimationFrame(animate);
      } else {
        const wrapper = scrollWrapperEl.current;
        if (wrapper) {
          timerId.current = setTimeout(() => {
            wrapper.style.opacity = "0";
          }, 1000);
        }
        childrenRef?.removeEventListener("touchstart", handleTouchStart);
        stopAnimation = false;
      }
    });
  }

  function smoothStop() {
    const duration = 1500;
    const distance = (1.5 * velocity.current * duration) / 125;
    function draw(progress: number) {
      const mouseMoveEvent = new MouseEvent("mousemove", {
        bubbles: true,
        cancelable: true,
        clientX: lastTouch.current - distance * progress,
        clientY: lastTouch.current - distance * progress,
      });
      isDragging.current = true;
      setIsDraggingReactive(true);
      isReverse.current = true;
      window.dispatchEvent(mouseMoveEvent);
    }
    function timing(timeFraction: number) {
      return 1 - (1 - timeFraction) ** 2;
    }

    animate({
      duration,
      timing,
      draw,
    });
  }

  //main thread
  useEffect(() => {
    const handleMouseUp = () => {
      if (velocity.current !== 0) {
        smoothStop();
      }
      isReverse.current = false;
      dragType.current = null;
      isDragging.current = false;
      setIsDraggingReactive(false);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging.current) {
        if (scrollWrapperEl.current) {
          const wrapperCoords = scrollWrapperEl.current.getBoundingClientRect();
          let delta = 0;
          if (isReverse.current) {
            delta =
              initScrollCoord.current +
              downCoord.current -
              event[direction === "horizontal" ? "clientX" : "clientY"];
          } else {
            delta =
              initScrollCoord.current +
              event[direction === "horizontal" ? "clientX" : "clientY"] -
              downCoord.current;
          }
          oldDelta.current = delta;
          const end =
            wrapperCoords[direction === "horizontal" ? "width" : "height"] -
            scrollLengthRef.current;
          if (delta >= 0 && delta <= end) {
            setTranslate(-delta * scrollFactor.current);
            translate.current = delta;
            setTranslateReactive(translate.current);
          } else if (delta < 0) {
            setTranslate(0);
            translate.current = 0;
            setTranslateReactive(translate.current);
          } else {
            setTranslate(-end * scrollFactor.current);
            translate.current = end;
            setTranslateReactive(translate.current);
          }
        }
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      clearTimeout(timerId.current);
      cancelAnimationFrame(slidingAnimId.current);
      velocity.current = 0;
      if (!dragType.current) dragType.current = "scrollDrag";
      isDragging.current = true;
      setIsDraggingReactive(true);
      downCoord.current =
        direction === "horizontal" ? event.clientX : event.clientY;
      if (scrollEl.current) {
        initScrollCoord.current = getElTransform(scrollEl.current);
      }
    };

    const handleClick = (event: MouseEvent) => {
      event.stopPropagation();
    };

    if (scrollEl.current) {
      scrollEl.current.addEventListener("mousedown", handleMouseDown);
      scrollEl.current.addEventListener("click", handleClick);
    }
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove, {
      passive: false,
    });

    return () => {
      if (scrollEl.current) {
        scrollEl.current.removeEventListener("mousedown", handleMouseDown);
        scrollEl.current.removeEventListener("click", handleClick);
      }
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  //set scrollSpace
  useEffect(() => {
    scrollLengthRef.current = scrollLength;
    if (scrollWrapperEl.current) {
      const wrapperLength =
        scrollWrapperEl.current.getBoundingClientRect()[
          direction === "horizontal" ? "width" : "height"
        ];
      setScrollSpace(wrapperLength - scrollLengthRef.current, direction);
    }
  }, [scrollLength, childrenRef, ancestorRef]);

  //wheel handler
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const deltaY = e.deltaY * wheelSensitivity.current;

      const mouseDownEvent = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0,
      });
      const mouseMoveEvent = new MouseEvent("mousemove", {
        bubbles: true,
        cancelable: true,
        clientX: deltaY,
        clientY: deltaY,
      });
      const mouseUpEvent = new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0,
      });
      if (scrollEl.current) {
        scrollEl.current.dispatchEvent(mouseDownEvent);
        scrollEl.current.dispatchEvent(mouseMoveEvent);
        scrollEl.current.dispatchEvent(mouseUpEvent);
      }
    };

    if (childrenRef) {
      childrenRef?.addEventListener("wheel", handleWheel, {
        passive: false,
      });
    }

    return () => {
      childrenRef?.removeEventListener("wheel", handleWheel);
    };
  });

  //drag handler
  useEffect(() => {
    if (drag.draggable) {
      const innerEls = childrenRef?.querySelectorAll("*");

      const handleMouseDown = (e: MouseEvent) => {
        dragType.current = "drag";
        isReverse.current = true;
        const mouseDownEvent = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: e.clientX,
          clientY: e.clientY,
        });
        if (scrollEl.current) {
          scrollEl.current.dispatchEvent(mouseDownEvent);
        }
      };
      const handleMouseMove = (e: MouseEvent) => {
        if (isDragging.current) {
          innerEls?.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.pointerEvents = "none";
            }
          });
          if (childrenRef && isReverse.current) {
            childrenRef.style.cursor = "grabbing";
          }
          const mouseMoveEvent = new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
            clientX: e.clientX,
            clientY: e.clientY,
          });
          if (scrollEl.current) {
            scrollEl.current.dispatchEvent(mouseMoveEvent);
          }
        }
      };
      const handleMouseUp = () => {
        const mouseUpEvent = new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
          clientX: 0,
          clientY: 0,
        });
        if (scrollEl.current) {
          scrollEl.current.dispatchEvent(mouseUpEvent);
        }
        innerEls?.forEach((el) => {
          if (el instanceof HTMLElement) {
            el.style.pointerEvents = "auto";
          }
        });
        if (childrenRef) {
          if (drag.showGrabCursor) {
            childrenRef.style.cursor = "grab";
          } else childrenRef.style.cursor = "auto";
        }
      };

      childrenRef?.addEventListener("mousedown", handleMouseDown);
      childrenRef?.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      childrenRef?.addEventListener("mouseup", handleMouseUp);

      return () => {
        childrenRef?.removeEventListener("mousedown", handleMouseDown);
        childrenRef?.removeEventListener("mousemove", handleMouseMove);
        childrenRef?.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [childrenRef]);

  //visible prop handler
  useEffect(() => {
    const wrapper = scrollWrapperEl.current;
    if (wrapper) {
      if (visible === "onHover") {
        const onMouseEnter = () => {
          wrapper.style.opacity = "1";
          wrapper.style.transition = "opacity 0.5s ease";
        };
        const onMouseLeave = () => {
          wrapper.style.opacity = "0";
        };

        childrenRef?.addEventListener("mouseenter", onMouseEnter);
        childrenRef?.addEventListener("mouseleave", onMouseLeave);
        childrenRef?.addEventListener("touchstart", onMouseEnter);

        wrapper.addEventListener("mouseleave", onMouseLeave);
        wrapper.addEventListener("mouseenter", onMouseEnter);
        wrapper.addEventListener("touchstart", onMouseEnter);

        return () => {
          childrenRef?.removeEventListener("mouseenter", onMouseEnter);
          childrenRef?.removeEventListener("mouseleave", onMouseLeave);
          childrenRef?.removeEventListener("touchstart", onMouseEnter);

          if (wrapper) {
            wrapper.removeEventListener("mouseenter", onMouseEnter);
            wrapper.removeEventListener("mouseleave", onMouseLeave);
            wrapper.removeEventListener("touchstart", onMouseEnter);
          }
        };
      }
      if (visible === "none") {
        wrapper.style.opacity = "0";
      }
    }
  }, [childrenRef, scrollWrapperEl.current]);

  //set cursors handler
  useEffect(() => {
    if (childrenRef) {
      if (dragType.current === "scrollDrag") {
        childrenRef.style.cursor = "auto";
      } else {
        if (drag.showGrabCursor) {
          childrenRef.style.cursor = "grab";
        }
      }
    }
  }, [isDraggingReactive, childrenRef]);

  //force re-render the parent component for updating ancestor(children)Refs to not-null values
  useEffect(() => {
    setTranslate(-0); //differs from 0
  }, []);

  //initialize childrenRefAsVar
  useEffect(() => {
    childrenRefAsVar.current = childrenRef;
  }, [childrenRef]);

  //touchscreen childrenRef
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      cancelAnimationFrame(slidingAnimId.current);
      velocity.current = 0;
      isReverse.current = true;

      const mouseDownEvent = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        clientX: e.touches[0].clientX * touchSensitivity.current,
        clientY: e.touches[0].clientY * touchSensitivity.current,
      });

      lastTouch.current =
        mouseDownEvent[direction === "horizontal" ? "clientX" : "clientY"];

      if (scrollEl.current) {
        scrollEl.current.dispatchEvent(mouseDownEvent);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging.current) {
        e.preventDefault();
        const mouseMoveEvent = new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
          clientX: e.touches[0].clientX * touchSensitivity.current,
          clientY: e.touches[0].clientY * touchSensitivity.current,
        });

        const currentTouch =
          mouseMoveEvent[direction === "horizontal" ? "clientX" : "clientY"];
        velocity.current = lastTouch.current - currentTouch;

        lastTouch.current = currentTouch;

        if (scrollEl.current) {
          scrollEl.current.dispatchEvent(mouseMoveEvent);
        }
      }
    };

    const handleTouchEnd = () => {
      const mouseUpEvent = new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0,
      });
      if (scrollEl.current) {
        scrollEl.current.dispatchEvent(mouseUpEvent);
      }
    };

    if (childrenRef) {
      childrenRef.addEventListener("touchstart", handleTouchStart);
      childrenRef.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      childrenRef.addEventListener("touchend", handleTouchEnd);
      childrenRef.addEventListener("touchcancel", handleTouchEnd);
    }

    return () => {
      childrenRef?.removeEventListener("touchmove", handleTouchMove);
      childrenRef?.removeEventListener("touchstart", handleTouchStart);
      childrenRef?.removeEventListener("touchend", handleTouchEnd);
      childrenRef?.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [childrenRef]);

  //touchscreen scrollEl
  useEffect(() => {
    const scroll = scrollEl.current;

    function handleTouchStart(event: TouchEvent) {
      const mouseDownEvent = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY,
      });

      if (scroll) {
        scroll.dispatchEvent(mouseDownEvent);
      }
    }

    function handleTouchMove(event: TouchEvent) {
      event.preventDefault();
      const mouseMoveEvent = new MouseEvent("mousemove", {
        bubbles: true,
        cancelable: true,
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY,
      });

      if (scroll) {
        scroll.dispatchEvent(mouseMoveEvent);
      }
    }

    function handleTouchEnd() {
      const mouseUpEvent = new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0,
      });

      if (scroll) {
        scroll.dispatchEvent(mouseUpEvent);
      }
    }

    if (scroll) {
      scroll.addEventListener("touchstart", handleTouchStart);
      scroll.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      scroll.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      if (scroll) {
        scroll.removeEventListener("touchstart", handleTouchStart);
        scroll.removeEventListener("touchmove", handleTouchMove);
        scroll.removeEventListener("touchend", handleTouchEnd);
      }
    };
  });

  const wrapperElStyles: CSSProperties = {
    width: direction === "horizontal" ? "100%" : "max-content",
    height: direction === "horizontal" ? "max-content" : "100%",
    padding: direction === "horizontal" ? "8px 0 0 0" : "0 4px 0 0",
    ...styles?.wrapper,
  };

  const scrollElStyles: CSSProperties = {
    ...styles?.scroll,
    height:
      direction === "horizontal" ? styles?.scroll?.height : `${scrollLength}px`,
    width:
      direction === "horizontal" ? `${scrollLength}px` : styles?.scroll?.width,
    transform: `${
      direction === "horizontal" ? "translateX" : "translateY"
    }(${translateReactive}px)`,
  };

  const customLayoutStyle: CSSProperties = {
    transform: `${
      direction === "horizontal" ? "translateX" : "translateY"
    }(${translateReactive}px)`,
    width: direction === "horizontal" ? `${scrollLength}px` : "",
    height: direction === "horizontal" ? "" : `${scrollLength}px`,
  };

  return (
    <>
      <div
        className={`${classes.wrapper} ${
          visible === "onHover" ? classes.transparent : ""
        }`}
        ref={scrollWrapperEl}
        onClick={moveToClick}
        style={wrapperElStyles}
      >
        {children ? (
          <div ref={scrollEl} style={customLayoutStyle}>
            {children}
          </div>
        ) : (
          <div
            ref={scrollEl}
            className={classes.scroll}
            style={scrollElStyles}
          ></div>
        )}
      </div>
    </>
  );
}
