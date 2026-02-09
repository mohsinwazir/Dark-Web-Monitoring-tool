import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [role, setRole] = useState(localStorage.getItem("role"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            // Validate token or just set state (basic implementation)
            // In production, you might verify against /auth/me
        }
        setLoading(false);
    }, [token]);

    const login = async (username, password) => {
        try {
            // Create form data for OAuth2
            const formData = new FormData();
            formData.append("username", username);
            formData.append("password", password);

            const response = await fetch("/api/auth/login", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Invalid credentials");
            }

            const data = await response.json();

            // Save to storage
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("role", data.role);

            // Update State
            setToken(data.access_token);
            setRole(data.role);
            setUser({ username: data.username, role: data.role });

            return { success: true };
        } catch (err) {
            console.error("Login failed:", err);
            // Check for MFA requirement (future proofing)
            if (err.message === "MFA_REQUIRED") {
                throw err;
            }
            return { success: false, message: err.message };
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Registration failed");
            }

            return { success: true };
        } catch (err) {
            console.error("Registration error:", err);
            return { success: false, message: err.message };
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setToken(null);
        setRole(null);
        setUser(null);
    };

    const isAdmin = () => role === "admin";

    return (
        <AuthContext.Provider value={{ user, token, role, login, register, logout, isAdmin, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
