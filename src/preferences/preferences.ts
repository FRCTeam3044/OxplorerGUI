import "../theme.css";
import "./preferences.css";

declare global {
  interface Window {
    prefs: {
      setTheme: (theme: "system" | "dark" | "light") => void;
      getPref: (pref: string, def: string) => Promise<string>;
      setPref: (pref: string, value: string) => void;
    };
  }
}

async function initialize() {
  const themeSelect = document.getElementById("theme") as HTMLSelectElement;
  const autoUpdateSelect = document.getElementById(
    "updates",
  ) as HTMLSelectElement;
  themeSelect.addEventListener("change", () => {
    window.prefs.setTheme(themeSelect.value as "system" | "dark" | "light");
  });
  themeSelect.value = await window.prefs.getPref("theme", "system");
  autoUpdateSelect.value = await window.prefs.getPref("updates", "startup");
  autoUpdateSelect.addEventListener("change", () => {
    window.prefs.setPref("updates", autoUpdateSelect.value);
  });
}
initialize();
