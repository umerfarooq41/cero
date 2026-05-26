import React from "react";
import { useTheme } from "@/components/theme-provider";

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Appearance Settings</h2>
      <p>Select your preferred application interface theme style:</p>
      
      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
        <button
          onClick={() => setTheme("light")}
          style={{
            padding: "10px 20px",
            backgroundColor: theme === "light" ? "#0070f3" : "#f5f5f7",
            color: theme === "light" ? "#fff" : "#000",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: theme === "light" ? "bold" : "normal"
          }}
        >
          Light Mode
        </button>

        <button
          onClick={() => setTheme("dark")}
          style={{
            padding: "10px 20px",
            backgroundColor: theme === "dark" ? "#0070f3" : "#f5f5f7",
            color: theme === "dark" ? "#fff" : "#000",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: theme === "dark" ? "bold" : "normal"
          }}
        >
          Dark Mode
        </button>

        <button
          onClick={() => setTheme("system")}
          style={{
            padding: "10px 20px",
            backgroundColor: theme === "system" ? "#0070f3" : "#f5f5f7",
            color: theme === "system" ? "#fff" : "#000",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: theme === "system" ? "bold" : "normal"
          }}
        >
          System
        </button>
      </div>
    </div>
  );
}
