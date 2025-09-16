import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import Draggable from 'react-draggable';
import { Box, Fab, Fade } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AddAppointmentDialog from './add-appointment';
import AddPatientRecord from './add-record';

function QuickActionButton() {
  // Make size calculations dynamic functions instead of constants
  const getMainSize = () => Math.min(window.innerWidth, window.innerHeight) * 0.12;
  const getActionSize = () => Math.min(window.innerWidth, window.innerHeight) * 0.106;
  const getGap = () => Math.min(window.innerWidth, window.innerHeight) * 0.014;
  const getMargin = () => Math.min(window.innerWidth, window.innerHeight) * 0.04;


  const nodeRef = useRef(null);
  const containerRef = useRef(null);
  const justDraggedRef = useRef(false);
  const movedRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const isAnimatingRef = useRef(false);
  const lastToggleRef = useRef(0);

  // position is controlled and expressed in pixels relative to the top-left of the full-viewport container
  // determine initial position synchronously so first paint shows bottom-right
  const computeInitial = () => {
    if (typeof window !== 'undefined') {
      const MAIN_SIZE = getMainSize();
      const MARGIN = getMargin();
      // try to account for the site header so top snaps sit below it
      const headerEl = document.querySelector('header');
      const headerHeight = headerEl?.getBoundingClientRect().height || 0;
      const topOffset = Math.max(MARGIN, headerHeight + Math.min(window.innerWidth, window.innerHeight) * 0.007);
      return {
        x: Math.max(MARGIN, window.innerWidth - MAIN_SIZE - MARGIN),
        y: Math.max(topOffset, window.innerHeight - MAIN_SIZE - MARGIN),
      };
    }
    return { x: getMargin(), y: getMargin() };
  };

  const initPos = computeInitial();
  const [position, setPosition] = useState(initPos);
  const [isInitialized, setIsInitialized] = useState(false);
  const [bounds, setBounds] = useState({ left: getMargin(), top: getMargin(), right: initPos.x, bottom: initPos.y });
  const [isDragging, setIsDragging] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [toggleWillOpen, setToggleWillOpen] = useState(false);
  const [currentCorner, setCurrentCorner] = useState('bottom-right'); // track which corner we're in
  const [showAddAppointment, setShowAddAppointment] = useState(false); // Add dialog state
  const [showAddPatient, setShowAddPatient] = useState(false); // Add patient record dialog state

  // ensure the initial placement is bottom-right before first paint to avoid visual jump
  useLayoutEffect(() => {
  const MAIN_SIZE = getMainSize();
  const MARGIN = getMargin();
  const headerEl = document.querySelector('header');
  const headerHeight = headerEl?.getBoundingClientRect().height || 0;
  const topOffset = Math.max(MARGIN, headerHeight + Math.min(window.innerWidth, window.innerHeight) * 0.007);
  const right = Math.max(MARGIN, window.innerWidth - MAIN_SIZE - MARGIN);
  const bottom = Math.max(topOffset, window.innerHeight - MAIN_SIZE - MARGIN);
  setBounds({ left: MARGIN, top: topOffset, right, bottom });
  setPosition({ x: right, y: bottom });
  // mark initialized after we set the initial position
  setIsInitialized(true);
  }, []);

  // update bounds on resize and maintain current corner
  useEffect(() => {
    const updateBounds = () => {
      const MAIN_SIZE = getMainSize();
      const MARGIN = getMargin();
      const headerEl = document.querySelector('header');
      const headerHeight = headerEl?.getBoundingClientRect().height || 0;
      const topOffset = Math.max(MARGIN, headerHeight + Math.min(window.innerWidth, window.innerHeight) * 0.007);
      const newRight = Math.max(MARGIN, window.innerWidth - MAIN_SIZE - MARGIN);
      const newBottom = Math.max(topOffset, window.innerHeight - MAIN_SIZE - MARGIN);
      
      // calculate new bounds first
      const newBounds = { left: MARGIN, top: topOffset, right: newRight, bottom: newBottom };
      setBounds(newBounds);

      // then use the fresh bounds to set position
      setPosition(() => {
        let targetX, targetY;
        
        switch (currentCorner) {
          case 'top-left':
            targetX = newBounds.left;
            targetY = newBounds.top;
            break;
          case 'top-right':
            targetX = newBounds.right;
            targetY = newBounds.top;
            break;
          case 'bottom-left':
            targetX = newBounds.left;
            targetY = newBounds.bottom;
            break;
          case 'bottom-right':
          default:
            targetX = newBounds.right;
            targetY = newBounds.bottom;
            break;
        }

        return { x: targetX, y: targetY };
      });
    };

    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, [currentCorner]);

  const handleStart = (_, data) => {
    setIsDragging(true);
    movedRef.current = false;
    lastPosRef.current = { x: data?.x || 0, y: data?.y || 0 };
  };

  const handleDrag = (_, data) => {
    // update movement detection (small threshold to ignore click-like drags)
    const dx = Math.abs((data.x || 0) - (lastPosRef.current.x || 0));
    const dy = Math.abs((data.y || 0) - (lastPosRef.current.y || 0));
    const moved = dx > 3 || dy > 3;
    if (moved) movedRef.current = true;
    lastPosRef.current = { x: data.x, y: data.y };
    setPosition({ x: data.x, y: data.y });
  };

  const handleStop = (_, data) => {
    setIsDragging(false);

    // mark as just dragged only if movement actually occurred
    if (movedRef.current) {
      justDraggedRef.current = true;
      window.setTimeout(() => (justDraggedRef.current = false), 150);
    }

    // Decide nearest corner based on final center point
    const MAIN_SIZE = getMainSize();
    const centerX = data.x + MAIN_SIZE / 2;
    const centerY = data.y + MAIN_SIZE / 2;
    const midX = window.innerWidth / 2;
    const midY = window.innerHeight / 2;

    const isTop = centerY < midY;
    const isLeft = centerX < midX;

    const targetX = isLeft ? bounds.left : bounds.right;
    const targetY = isTop ? bounds.top : bounds.bottom;

    // update current corner state
    const newCorner = `${isTop ? 'top' : 'bottom'}-${isLeft ? 'left' : 'right'}`;
    setCurrentCorner(newCorner);

    // snap to the computed corner
    setPosition({ x: targetX, y: targetY });
  };

  // helper to compute corner booleans from current position
  const cornerFromPos = () => {
    const MAIN_SIZE = getMainSize();
    const centerX = position.x + MAIN_SIZE / 2;
    const centerY = position.y + MAIN_SIZE / 2;
    const midX = window.innerWidth / 2;
    const midY = window.innerHeight / 2;
    return { isTop: centerY < midY, isLeft: centerX < midX };
  };

  const toggleActions = () => {
    const now = Date.now();
    // debounce toggles within 300ms
    if (now - lastToggleRef.current < 300) return;
    lastToggleRef.current = now;

  if (justDraggedRef.current) return; // ignore click immediately after drag
    if (isAnimatingRef.current) return; // ignore while animating

  // mark animating for the duration of the zoom/rotate transition
  isAnimatingRef.current = true;
  window.setTimeout(() => (isAnimatingRef.current = false), 260);

  // set a short-lived toggling state so child actions can "pop" on open/close
  const next = !showActions;
  setToggleWillOpen(next);
  setIsToggling(true);
  // ensure the visual toggle state is set immediately
  setShowActions(next);
  // clear toggling flag after animation window
  window.setTimeout(() => setIsToggling(false), 260);
  };

  // no-op effect placeholder retained for potential future animation hooks
  useEffect(() => {
    // intentionally empty: removed debug logging
  }, [showActions]);

  // compute action position styles relative to the main FAB container
  const getActionStyle = (index, forTopVariant, isLeft) => {
    const MAIN_SIZE = getMainSize();
    const ACTION_SIZE = getActionSize();
    const GAP = getGap();
    const centerOffset = (MAIN_SIZE - ACTION_SIZE) / 2; // px to align centers
    const adjacentDistance = MAIN_SIZE / 2 + ACTION_SIZE / 2 + GAP; // px from center to center
    const distance = adjacentDistance + index * (ACTION_SIZE + GAP);

    // Position relative to the container.
    // The container's vertical center is at MAIN_SIZE / 2.
    // The action button's center is offset by `distance`.
    const actionCenterY = forTopVariant
      ? MAIN_SIZE / 2 - distance
      : MAIN_SIZE / 2 + distance;

    const top = actionCenterY - ACTION_SIZE / 2;
    const left = centerOffset;

    return {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: ACTION_SIZE,
      height: ACTION_SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  };

  return (
    // full-viewport container for bounding calculations.
    // pointerEvents toggles so the overlay can capture clicks only when actions are open.
    <Box ref={containerRef} sx={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', pointerEvents: showActions ? 'auto' : 'none', zIndex: 2000 }}>                                                                                         
      {/* backdrop shown only while actions are open; sits beneath the FAB/action buttons */}
      <Box
        onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
        role="presentation"
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          // darker overlay
          bgcolor: 'rgba(0,0,0,0.54)',
          opacity: showActions ? 1 : 0,
          transition: 'opacity 180ms ease',
          zIndex: 1500,
          pointerEvents: showActions ? 'auto' : 'none',
        }}
      />

      {typeof document !== 'undefined' && isInitialized && createPortal(
        <Draggable
          nodeRef={nodeRef}
          position={position}
          bounds={{ left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom }}
          onStart={handleStart}
          onDrag={handleDrag}
          onStop={handleStop}
        >
          <Box
            ref={nodeRef}
            sx={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: getMainSize(),
              height: getMainSize(),
              pointerEvents: 'auto', // allow interactions with the button
              cursor: isDragging ? 'grabbing' : 'grab',
              // quick but eased snap transition when not dragging
              transition: isDragging ? 'none' : 'transform 180ms cubic-bezier(.2,.9,.2,1)',
              zIndex: 9999, // sit above the overlay
            }}
          >
            {/* action buttons (appear relative to the main FAB) */}
            {(() => {
              const { isTop, isLeft } = cornerFromPos();
              const MAIN_SIZE = getMainSize();

              // Visibility logic:
              // - topGroupVisible: Show buttons ABOVE the main FAB (when main FAB is on bottom half).
              // - bottomGroupVisible: Show buttons BELOW the main FAB (when main FAB is on top half).
              const topGroupVisible = !isTop && showActions;
              const bottomGroupVisible = isTop && showActions;

              // Staggered animation delays
              const maxIndex = 1;
              const openDelayMs = 70;

              return (
                <>
                  <Box sx={{ position: 'relative', width: MAIN_SIZE, height: MAIN_SIZE, overflow: 'visible' }}>
                    {[0, 1].map((i) => {
                      const ACTION_SIZE = getActionSize();
                      const labelText = i === 0 ? 'Add Appointment' : 'Add Patient Record';
                      const openDelay = `${i * openDelayMs}ms`;
                      const closeDelay = `${(maxIndex - i) * openDelayMs}ms`;

                      // --- Top Group (appears when main FAB is at the bottom) ---
                      const topStyle = getActionStyle(i, true, isLeft);
                      const topTransitionDelay = toggleWillOpen ? openDelay : closeDelay;
                      const topTransform = `scale(${topGroupVisible ? 1 : 0.6}) translateY(${topGroupVisible ? '0' : `${-Math.min(window.innerWidth, window.innerHeight) * 0.007}px`})`;                                                                
                      // --- Bottom Group (appears when main FAB is at the top) ---
                      const bottomStyle = getActionStyle(i, false, isLeft);
                      const bottomTransitionDelay = toggleWillOpen ? openDelay : closeDelay;
                      const bottomTransform = `scale(${bottomGroupVisible ? 1 : 0.6}) translateY(${bottomGroupVisible ? '0' : `${Math.min(window.innerWidth, window.innerHeight) * 0.007}px`})`;                                                        
                      const leftLabelTransform = (!isLeft && showActions) ? 'translateX(0)' : `translateX(${-Math.min(window.innerWidth, window.innerHeight) * 0.007}px)`;                                                                                                    
                      const rightLabelTransform = (isLeft && showActions) ? 'translateX(0)' : `translateX(${Math.min(window.innerWidth, window.innerHeight) * 0.007}px)`;                                                                               
                      return (
                        <React.Fragment key={i}>
                          {/* Top Group Renderer */}
                          <Box
                            sx={{
                              ...topStyle,
                              opacity: topGroupVisible ? 1 : 0,
                              pointerEvents: topGroupVisible ? 'auto' : 'none',
                              zIndex: 1,
                              transformOrigin: 'bottom center',
                              transition: `opacity 200ms ease ${topTransitionDelay}, transform 200ms cubic-bezier(.2,.9,.2,1) ${topTransitionDelay}`,                                                                                                                                 
                              transform: topTransform,
                            }}
                          >
                            <Box sx={{ position: 'absolute', right: '100%', mr: `${Math.min(window.innerWidth, window.innerHeight) * 0.012}px`, bgcolor: 'white', px: `${Math.min(window.innerWidth, window.innerHeight) * 0.01}px`, py: `${Math.min(window.innerWidth, window.innerHeight) * 0.003}px`, borderRadius: `${Math.min(window.innerWidth, window.innerHeight) * 0.008}px`, boxShadow: 1, fontWeight: 500, color: '#1746A2', minWidth: `${Math.min(window.innerWidth, window.innerHeight) * 0.18}px`, whiteSpace: 'nowrap', textAlign: 'right', fontSize: `${Math.min(window.innerWidth, window.innerHeight) * 0.024}px`, opacity: (!isLeft && topGroupVisible) ? 1 : 0, transform: leftLabelTransform, transition: 'opacity 160ms ease, transform 180ms cubic-bezier(.2,.9,.2,1)' }}>{labelText}</Box>                                                                                                              
                            <Box sx={{ position: 'absolute', left: '100%', ml: `${Math.min(window.innerWidth, window.innerHeight) * 0.012}px`, bgcolor: 'white', px: `${Math.min(window.innerWidth, window.innerHeight) * 0.01}px`, py: `${Math.min(window.innerWidth, window.innerHeight) * 0.003}px`, borderRadius: `${Math.min(window.innerWidth, window.innerHeight) * 0.008}px`, boxShadow: 1, fontWeight: 500, color: '#1746A2', minWidth: `${Math.min(window.innerWidth, window.innerHeight) * 0.18}px`, whiteSpace: 'nowrap', textAlign: 'left', fontSize: `${Math.min(window.innerWidth, window.innerHeight) * 0.024}px`, opacity: (isLeft && topGroupVisible) ? 1 : 0, transform: rightLabelTransform, transition: 'opacity 160ms ease, transform 180ms cubic-bezier(.2,.9,.2,1)' }}>{labelText}</Box>                                                                                                                
                            <Fab color="primary" sx={{ zIndex: 2, width: ACTION_SIZE, height: ACTION_SIZE }} onClick={(e) => {
                              e.stopPropagation();
                              setShowActions(false);
                              if (i === 0) setShowAddAppointment(true); // <-- open dialog
                              else setShowAddPatient(true); // <-- open patient record dialog
                            }}>
                              {i === 0 ? <EventAvailableIcon sx={{ fontSize: `${ACTION_SIZE * 0.44}px` }} /> : <PersonAddIcon sx={{ fontSize: `${ACTION_SIZE * 0.44}px` }} />}                                                                                                      
                            </Fab>
                          </Box>

                          {/* Bottom Group Renderer */}
                          <Box
                            sx={{
                              ...bottomStyle,
                              opacity: bottomGroupVisible ? 1 : 0,
                              pointerEvents: bottomGroupVisible ? 'auto' : 'none',
                              zIndex: 1,
                              transformOrigin: 'top center',
                              transition: `opacity 200ms ease ${bottomTransitionDelay}, transform 200ms cubic-bezier(.2,.9,.2,1) ${bottomTransitionDelay}`,                                                                                                                           
                              transform: bottomTransform,
                            }}
                          >
                            <Box sx={{ position: 'absolute', right: '100%', mr: `${Math.min(window.innerWidth, window.innerHeight) * 0.012}px`, bgcolor: 'white', px: `${Math.min(window.innerWidth, window.innerHeight) * 0.01}px`, py: `${Math.min(window.innerWidth, window.innerHeight) * 0.003}px`, borderRadius: `${Math.min(window.innerWidth, window.innerHeight) * 0.008}px`, boxShadow: 1, fontWeight: 500, color: '#1746A2', minWidth: `${Math.min(window.innerWidth, window.innerHeight) * 0.18}px`, whiteSpace: 'nowrap', textAlign: 'right', fontSize: `${Math.min(window.innerWidth, window.innerHeight) * 0.024}px`, opacity: (!isLeft && bottomGroupVisible) ? 1 : 0, transform: leftLabelTransform, transition: 'opacity 160ms ease, transform 180ms cubic-bezier(.2,.9,.2,1)' }}>{labelText}</Box>                                                                                                           
                            <Box sx={{ position: 'absolute', left: '100%', ml: `${Math.min(window.innerWidth, window.innerHeight) * 0.012}px`, bgcolor: 'white', px: `${Math.min(window.innerWidth, window.innerHeight) * 0.01}px`, py: `${Math.min(window.innerWidth, window.innerHeight) * 0.003}px`, borderRadius: `${Math.min(window.innerWidth, window.innerHeight) * 0.008}px`, boxShadow: 1, fontWeight: 500, color: '#1746A2', minWidth: `${Math.min(window.innerWidth, window.innerHeight) * 0.18}px`, whiteSpace: 'nowrap', textAlign: 'left', fontSize: `${Math.min(window.innerWidth, window.innerHeight) * 0.024}px`, opacity: (isLeft && bottomGroupVisible) ? 1 : 0, transform: rightLabelTransform, transition: 'opacity 160ms ease, transform 180ms cubic-bezier(.2,.9,.2,1)' }}>{labelText}</Box>                                                                                                             
                            <Fab color="primary" sx={{ zIndex: 2, width: ACTION_SIZE, height: ACTION_SIZE }} onClick={(e) => {
                              e.stopPropagation();
                              setShowActions(false);
                              if (i === 0) setShowAddAppointment(true); // <-- open dialog
                              else setShowAddPatient(true); // <-- open patient record dialog
                            }}>
                              {i === 0 ? <EventAvailableIcon sx={{ fontSize: `${ACTION_SIZE * 0.44}px` }} /> : <PersonAddIcon sx={{ fontSize: `${ACTION_SIZE * 0.44}px` }} />}                                                                                                      
                            </Fab>
                          </Box>
                        </React.Fragment>
                      );
                    })}
                  </Box>

                  {/* Main FAB */}
                  <Box sx={{ position: 'absolute', left: 0, top: 0, width: MAIN_SIZE, height: MAIN_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>                                                                                                
                    <Fab
                      data-testid="quick-main-fab"
                      color="primary"
                      sx={{ width: MAIN_SIZE, height: MAIN_SIZE, zIndex: 9999 }}
                      onClick={(e) => { e.stopPropagation();
                        // if we just dragged, ignore the click caused by mouseup
                        if (movedRef.current) { movedRef.current = false; return; }
                        toggleActions();
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleActions(); } }}                                                                                                                                                 
                      aria-expanded={showActions}
                      aria-controls="quick-action-group"
                      title={showActions ? 'Close quick actions' : 'Open quick actions'}
                    >
                      <AddIcon sx={{ fontSize: `${MAIN_SIZE * 0.56}px`, transform: showActions ? 'rotate(45deg)' : 'none', transition: 'transform 200ms cubic-bezier(.2,.9,.2,1)' }} />                                                                                     
                    </Fab>
                  </Box>
                </>
              );
            })()}
          </Box>
        </Draggable>,
        document.body
      )}

      <AddAppointmentDialog
        open={showAddAppointment}
        onClose={() => setShowAddAppointment(false)}
        onAddPatient={() => {
          setShowAddAppointment(false);
          setShowAddPatient(true);
        }}
      />
      <AddPatientRecord
        open={showAddPatient}
        onClose={() => setShowAddPatient(false)}
      />
    </Box>
  );
}

export default QuickActionButton;