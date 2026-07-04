"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  currentScenario: string;
  setCurrentScenario: (scen: string) => void;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  speed: number;
  setSpeed: (sec: number) => void;
  scenarioData: any;
  getStepData: (stepNum?: number) => any;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [currentScenario, setCurrentScenario] = useState<string>('ddos');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(5);
  const [scenarioData, setScenarioData] = useState<any>(null);

  // Load scenario JSON
  useEffect(() => {
    const loadScenario = async () => {
      try {
        const res = await fetch(`/demo/${currentScenario}.json`);
        if (res.ok) {
          const json = await res.json();
          setScenarioData(json);
        }
      } catch (err) {
        console.error('Failed to load demo scenario:', err);
      }
    };
    loadScenario();
  }, [currentScenario]);

  // Autoplay ticker loop
  useEffect(() => {
    if (!isPlaying || !isDemoMode) return;
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= 10) {
          setIsPlaying(false);
          return 10;
        }
        return prev + 1;
      });
    }, speed * 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isDemoMode, speed]);

  // Resolve step data fallback logic
  const getStepData = (stepNum?: number) => {
    const target = stepNum !== undefined ? stepNum : currentStep;
    if (!scenarioData || !scenarioData.steps) return null;

    // Fallback search: find highest step defined in JSON <= target step
    let resolvedStep = 1;
    const definedSteps = Object.keys(scenarioData.steps).map(Number).sort((a, b) => a - b);
    for (const step of definedSteps) {
      if (step <= target) {
        resolvedStep = step;
      } else {
        break;
      }
    }
    return scenarioData.steps[String(resolvedStep)];
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        setIsDemoMode,
        currentStep,
        setCurrentStep,
        currentScenario,
        setCurrentScenario,
        isPlaying,
        setIsPlaying,
        speed,
        setSpeed,
        scenarioData,
        getStepData
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
