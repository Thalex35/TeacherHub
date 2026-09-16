import { useEffect, useState } from "react";

export type Language = "en" | "fr" | "ht";

type TranslationKey =
  | "dashboard"
  | "students"
  | "classes"
  | "calendar"
  | "attendance"
  | "management"
  | "curriculum"
  | "planner"
  | "assignments"
  | "gradebook"
  | "evaluations"
  | "reports"
  | "settings"
  | "admin"
  | "myProfile"
  | "editProfile"
  | "viewProfile"
  | "changePassword"
  | "signOut"
  | "deleteAccount"
  | "profile"
  | "account"
  | "security"
  | "preferences"
  | "helpSupport";

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    dashboard: "Dashboard", students: "Students", classes: "Classes", calendar: "Calendar", attendance: "Attendance", management: "Management", curriculum: "Curriculum", planner: "Planner", assignments: "Assignments", gradebook: "Gradebook", evaluations: "Evaluations", reports: "Reports", settings: "Settings", admin: "Admin", myProfile: "My profile", editProfile: "Edit profile", viewProfile: "View profile page", changePassword: "Change password", signOut: "Sign out", deleteAccount: "Delete account", profile: "Profile", account: "Account", security: "Security", preferences: "Preferences", helpSupport: "Help & Support",
  },
  fr: {
    dashboard: "Tableau de bord", students: "Élèves", classes: "Classes", calendar: "Calendrier", attendance: "Présence", management: "Gestion", curriculum: "Programme", planner: "Planificateur", assignments: "Devoirs", gradebook: "Carnet de notes", evaluations: "Évaluations", reports: "Rapports", settings: "Paramètres", admin: "Administration", myProfile: "Mon profil", editProfile: "Modifier le profil", viewProfile: "Voir la page du profil", changePassword: "Changer le mot de passe", signOut: "Se déconnecter", deleteAccount: "Supprimer le compte", profile: "Profil", account: "Compte", security: "Sécurité", preferences: "Préférences", helpSupport: "Aide et support",
  },
  ht: {
    dashboard: "Tablo enstriman", students: "Elèv", classes: "Klas", calendar: "Kalandriye", attendance: "Prezans", management: "Jesyon", curriculum: "Kourikoulòm", planner: "Planifikatè", assignments: "Devwa", gradebook: "Kanè", evaluations: "Evalyasyon", reports: "Rapò", settings: "Paramèt", admin: "Administrasyon", myProfile: "Pwofil mwen", editProfile: "Modifye pwofil", viewProfile: "Gade paj pwofil la", changePassword: "Chanje modpas", signOut: "Dekonekte", deleteAccount: "Efase kont", profile: "Pwofil", account: "Kont", security: "Sekirite", preferences: "Preferans", helpSupport: "Èd ak sipò",
  },
};

const languageEvent = "teacherhub-language-change";

export function getLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const value = localStorage.getItem("teacherhub-language");
  return value === "fr" || value === "ht" ? value : "en";
}

export function setLanguage(language: Language) {
  localStorage.setItem("teacherhub-language", language);
  document.documentElement.lang = language;
  window.dispatchEvent(new CustomEvent(languageEvent, { detail: language }));
}

export function useLanguage() {
  const [language, setCurrentLanguage] = useState<Language>(getLanguage);

  useEffect(() => {
    const update = (event: Event) => {
      const next = (event as CustomEvent<Language>).detail;
      setCurrentLanguage(next || getLanguage());
    };
    window.addEventListener(languageEvent, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(languageEvent, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return { language, setLanguage, t: (key: TranslationKey) => translations[language][key] };
}
