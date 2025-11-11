import React, { createContext, useState } from 'react';

// The AuthContext holds the global state for user authentication.
export const AuthContext = createContext({
    isLoggedIn: false,
    setIsLoggedIn: () => {},
});

// The AuthProvider component wraps the entire app.
export const AuthProvider = ({ children }) => {
    // Start with false. Your LoginScreen should call setIsLoggedIn(true) on success.
    const [isLoggedIn, setIsLoggedIn] = useState(false); 

    return (
        <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
            {children}
        </AuthContext.Provider>
    );
};