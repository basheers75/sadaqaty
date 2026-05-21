import { useState, useEffect } from "react";
import HomeScreen from "./screens/HomeScreen";
import QuranScreen from "./screens/QuranScreen";
import PrayerTimesScreen from "./screens/PrayerTimesScreen";
import SettingsScreen from "./screens/SettingsScreen";
import LanguagePicker from "./screens/LanguagePicker";
import AzkarScreen from "./screens/AzkarScreen";
import AudioQuranScreen from "./screens/AudioQuranScreen";
import { loadPrefs, savePrefs, reverseGeocode } from "./screens/prayerUtils";
import { getLang } from "./screens/langStore";

type Screen = "home" | "quran" | "prayer" | "settings" | "azkar" | "audio";

export default function App() {
  const [screen, setScreen]       = useState<Screen>("home");
  const [langChosen, setLangChosen] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if language has been chosen before
    setLangChosen(getLang() !== null);

    // On first launch: silently request GPS and save if granted
    const prefs = loadPrefs();
    if (!prefs && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          const name = await reverseGeocode(lat, lng);
          savePrefs({ lat, lng, locationName: name || `${lat.toFixed(2)}, ${lng.toFixed(2)}`, method: "MWL", asrFactor: 1, offsets: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 } });
        },
        () => {},
        { timeout: 8000 }
      );
    }
  }, []);

  // Still checking localStorage
  if (langChosen === null) return null;

  // First launch — show language picker
  if (!langChosen) {
    return <LanguagePicker onDone={() => setLangChosen(true)} />;
  }

  const go   = (s: string) => setScreen(s as Screen);
  const home = () => setScreen("home");

  if (screen === "quran")    return <QuranScreen onHome={home} />;
  if (screen === "prayer")   return <PrayerTimesScreen onHome={home} onSettings={() => setScreen("settings")} />;
  if (screen === "settings") return <SettingsScreen onHome={home} />;
  if (screen === "azkar")    return <AzkarScreen onHome={home} />;
  if (screen === "audio")    return <AudioQuranScreen onHome={home} />;

  return <HomeScreen onNavigate={go} />;
}
