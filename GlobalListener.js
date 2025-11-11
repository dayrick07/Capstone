import React, { useContext } from 'react';
import { GestureDetectionContext } from './screens/GestureDetectionContext'; // Adjust path

/**
 * GlobalListener is responsible for initializing and running background 
 * processes (like gesture detection) across the entire app by consuming the context.
 */
const GlobalListener = () => {
    // By calling useContext, we ensure the GestureDetectionProvider's 
    // hook is active and managing the sensor listener and state.
    const context = useContext(GestureDetectionContext); 
    
    // This component renders nothing visually, it only provides background logic.
    return null; 
};

export default GlobalListener;