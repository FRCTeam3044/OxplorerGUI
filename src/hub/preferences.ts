import "./vars.css";
import "./preferences.css";

declare global {
  interface Window {
    prefs: {
      setTheme: (theme: "system" | "dark" | "light") => void;
      getTheme: () => Promise<string>;
    };
  }
}

async function initialize() {
  const themeSelect = document.getElementById("theme") as HTMLSelectElement;
  themeSelect.addEventListener("change", () => {
    window.prefs.setTheme(themeSelect.value as "system" | "dark" | "light");
  });
  themeSelect.value = await window.prefs.getTheme();
}
initialize();
