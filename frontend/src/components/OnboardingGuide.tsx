"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Shield,
  BarChart3,
  Lock,
  Users,
  Bell,
  Trees,
  Map,
  Activity,
  Radio,
  Plane,
  Cpu,
  X,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

interface StepDef {
  target: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  preferredPlacement?: "top" | "bottom";
}

const ALL_STEPS: StepDef[] = [
  {
    target: '[data-tour="brand"]',
    icon: Shield,
    title: "IN9AD : Système national de veille",
    desc: "Centre opérationnel institutionnel pour la prédiction et la surveillance des feux de forêts en Algérie du Nord.",
    preferredPlacement: "bottom",
  },
  {
    target: '[data-tour="analytics"]',
    icon: BarChart3,
    title: "Analytics et performance du modèle IA",
    desc: "Consultez l'évaluation scientifique du modèle XGBoost : matrice de confusion, courbe ROC et précision opérationnelle à 95.4%.",
    preferredPlacement: "bottom",
  },
  {
    target: '[data-tour="security-portal"]',
    icon: Lock,
    title: "Portail sécurisé des commandements",
    desc: "Accédez à la console tactique réservée aux officiers opérationnels et aux centres de coordination.",
    preferredPlacement: "bottom",
  },
  {
    target: '[data-tour="roles"]',
    icon: Users,
    title: "Accès direct aux 3 commandements",
    desc: "Basculez instantanément entre la Protection Civile (14), la Conservation des Forêts et l'Administration Centrale.",
    preferredPlacement: "bottom",
  },
  {
    target: '[data-tour="bell"]',
    icon: Bell,
    title: "Alertes et diffusion temps réel",
    desc: "Cloche d'urgence : signale les détections de risque élevé par l'IA et les messages d'intercom entre panels opérationnels.",
    preferredPlacement: "bottom",
  },
  {
    target: '[data-tour="massifs"]',
    icon: Trees,
    title: "11 massifs stratégiques surveillés",
    desc: "Sélectionnez en un clic les massifs prioritaires (Yakouren, Akfadou, Djurdjura, Chréa...) pour centrer la carte et actualiser la météo.",
    preferredPlacement: "bottom",
  },
  {
    target: '[data-tour="map"]',
    icon: Map,
    title: "Cartographie tactique interactive",
    desc: "Visualisez les détections thermiques NASA FIRMS, les postes de vigie DGF et la simulation de propagation par vent.",
    preferredPlacement: "bottom",
  },
  {
    target: '[data-tour="simulation"]',
    icon: Activity,
    title: "Simulateur de propagation à 6 heures",
    desc: "Contrôlez la ligne de temps pour projeter l'évolution spatiale du feu d'heure en heure selon les vecteurs de vent.",
    preferredPlacement: "top",
  },
  {
    target: '[data-tour="risk-panel"]',
    icon: BarChart3,
    title: "Calculateur de risque IA et FWI",
    desc: "Évaluez le risque d'incendie en temps réel et testez des scénarios en modifiant température, vent et humidité.",
    preferredPlacement: "top",
  },
  {
    target: '[data-tour="nav"]',
    icon: Radio,
    title: "Navigation opérationnelle",
    desc: "Basculez entre la carte tactique, les alertes actives, le centre d'intercom et l'historique d'intervention.",
    preferredPlacement: "bottom",
  },
  {
    target: '[data-tour="drones"]',
    icon: Plane,
    title: "Unité Drones FLIR : Surveillance aérienne",
    desc: "Vecteur aéroporté d'inspection thermique infrarouge (DJI Matrice 300 RTK + FLIR). Détecte les foyers résiduels et patrouille entre les massifs (Phase 2).",
    preferredPlacement: "bottom",
  },
  {
    target: '[data-tour="iot"]',
    icon: Cpu,
    title: "Réseau IoT : Vigies et Ingestion ML",
    desc: "Réseau LoRaWAN mesurant en direct température, humidité, vent et CO2 sur les 11 massifs pour alimenter le modèle prédictif XGBoost.",
    preferredPlacement: "bottom",
  },
];

export const OnboardingGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom";
    arrowLeft: number;
  }>({
    top: 100,
    left: 20,
    placement: "bottom",
    arrowLeft: 40,
  });

  // Filter available steps present in current DOM
  const availableSteps = useMemo(() => {
    if (typeof window === "undefined") return ALL_STEPS;
    const matched = ALL_STEPS.filter((step) => Boolean(document.querySelector(step.target)));
    return matched.length > 0 ? matched : ALL_STEPS;
  }, [isOpen, stepIndex]);

  // Automatic launch for first-time visitors
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem("in9ad_guided_tour_v3");
    if (!seen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setStepIndex(0);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Update target positioning when step changes or on window resize/scroll
  const updatePosition = useCallback(() => {
    if (!isOpen) return;
    const currentStep = availableSteps[stepIndex];
    if (!currentStep) return;

    const el = document.querySelector(currentStep.target) as HTMLElement | null;
    if (!el) {
      setTargetRect(null);
      return;
    }

    // Scroll element smoothly into view
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    const tooltipWidth = Math.min(360, window.innerWidth - 32);
    const tooltipHeight = 210;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement: "top" | "bottom" = "bottom";
    let top = 0;

    if (currentStep.preferredPlacement === "top" && spaceAbove > tooltipHeight + 16) {
      placement = "top";
      top = rect.top - tooltipHeight - 12;
    } else if (spaceBelow < tooltipHeight + 20 && spaceAbove > tooltipHeight + 16) {
      placement = "top";
      top = rect.top - tooltipHeight - 12;
    } else {
      placement = "bottom";
      top = rect.bottom + 12;
    }

    top = Math.max(16, Math.min(window.innerHeight - tooltipHeight - 16, top));

    const targetCenter = rect.left + rect.width / 2;
    let left = targetCenter - tooltipWidth / 2;
    left = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, left));

    const arrowLeft = Math.max(24, Math.min(tooltipWidth - 24, targetCenter - left));

    setCoords({
      top,
      left,
      placement,
      arrowLeft,
    });
  }, [isOpen, stepIndex, availableSteps]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(updatePosition, 120);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen, stepIndex, updatePosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, stepIndex, availableSteps.length]);

  const handleClose = () => {
    localStorage.setItem("in9ad_guided_tour_v3", "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (stepIndex < availableSteps.length - 1) {
      setStepIndex((s) => s + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex((s) => s - 1);
    }
  };

  const handleRestart = () => {
    setStepIndex(0);
    setIsOpen(true);
  };

  const currentStep = availableSteps[stepIndex] || availableSteps[0];
  const StepIcon = currentStep?.icon || Shield;
  const isLast = stepIndex === availableSteps.length - 1;

  return (
    <>
      {/* Floating guide trigger button for returning users */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleRestart}
          title="Consulter le guide de navigation"
          className="fixed bottom-4 right-4 z-[2000] flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-white text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <HelpCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span>Guide</span>
        </button>
      )}

      {isOpen && (
        <>
          {/* Target Element Spotlight Ring & Backdrop */}
          {targetRect && (
            <div
              className="fixed pointer-events-none transition-all duration-300 z-[2800] rounded-lg ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_0_9999px_rgba(2,6,23,0.7)]"
              style={{
                top: Math.max(0, targetRect.top - 4),
                left: Math.max(0, targetRect.left - 4),
                width: targetRect.width + 8,
                height: targetRect.height + 8,
              }}
            />
          )}

          {/* Fallback backdrop if target rect not available */}
          {!targetRect && (
            <div
              onClick={handleClose}
              className="fixed inset-0 z-[2800] bg-slate-950/70 backdrop-blur-sm"
            />
          )}

          {/* Contextual Anchored Tooltip Box positioned under/over target item */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Guide de navigation IN9AD"
            className="fixed z-[2900] w-[calc(100vw-32px)] max-w-[360px] bg-slate-900 border border-[#0A4D3C] rounded-lg p-4 text-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-150"
            style={
              targetRect
                ? {
                    top: `${coords.top}px`,
                    left: `${coords.left}px`,
                  }
                : {
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }
            }
          >
            {/* Directional pointer arrow */}
            {targetRect && coords.placement === "bottom" && (
              <div
                className="absolute -top-2 w-3.5 h-3.5 bg-slate-900 border-l border-t border-[#0A4D3C] rotate-45 pointer-events-none"
                style={{
                  left: `${coords.arrowLeft}px`,
                  transform: "translateX(-50%) rotate(45deg)",
                }}
              />
            )}
            {targetRect && coords.placement === "top" && (
              <div
                className="absolute -bottom-2 w-3.5 h-3.5 bg-slate-900 border-r border-b border-[#0A4D3C] rotate-45 pointer-events-none"
                style={{
                  left: `${coords.arrowLeft}px`,
                  transform: "translateX(-50%) rotate(45deg)",
                }}
              />
            )}

            {/* Header: step count + close button */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                Étape {stepIndex + 1} sur {availableSteps.length}
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Fermer le guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content: Title & Description */}
            <div className="py-3 space-y-1.5 text-left">
              <div className="flex items-center gap-2 text-emerald-300">
                <StepIcon className="w-4 h-4 shrink-0 text-emerald-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">
                  {currentStep.title}
                </h2>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentStep.desc}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-start gap-1 py-1">
              {availableSteps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStepIndex(i)}
                  aria-label={`Aller à l'étape ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-150 ${
                    i === stepIndex ? "w-5 bg-emerald-400" : "w-1.5 bg-slate-700 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons: Passer, Précédent, Suivant */}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                Passer
              </button>

              <div className="flex items-center gap-2">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Précédent</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded bg-[#0A4D3C] hover:bg-[#0c5d49] text-emerald-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <span>{isLast ? "Terminer" : "Suivant"}</span>
                  {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
