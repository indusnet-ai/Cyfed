"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Cpu, 
  Activity, 
  Lock, 
  Database, 
  EyeOff, 
  Zap, 
  CheckCircle,
  Building2,
  FileCheck2,
  ArrowRight
} from 'lucide-react';

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-[#070b13] text-white flex flex-col selection:bg-indigo-500 selection:text-white font-sans">
      {/* Header */}
      <header className="h-20 border-b border-slate-900/60 bg-[#090d16]/70 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8 md:px-16">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-wider uppercase block">FedSOC AI</span>
            <span className="text-[10px] text-slate-500 font-bold block -mt-1 tracking-widest uppercase">Federated Cyber Intel</span>
          </div>
        </div>
        
        <Link 
          href="/login"
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md"
        >
          Launch Command Center
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-6xl mx-auto px-6 py-16 md:py-24 text-center space-y-8 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <Zap className="w-3 h-3" />
          Version 1.0.0 Stable MVP
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Collaborative Cyber Threat Detection <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
            Without Sharing Raw Logs
          </span>
        </h1>
        
        <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
          FedSOC AI leverages secure **Federated Learning (FedCore)** to train local security classifiers across multiple organizational silos, culminating in a global model with **97.96% accuracy** while preserving absolute data sovereignty.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link 
            href="/login" 
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Launch Executive Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a 
            href="#capabilities" 
            className="px-6 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-extrabold transition-all"
          >
            Explore Platform Capabilities
          </a>
        </div>

        {/* Small system indicator */}
        <div className="pt-8 flex items-center justify-center gap-8 text-[11px] text-slate-500 uppercase tracking-widest font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            GDPR COMPLIANT
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            ZERO DATA LEAKAGE
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            99.99% BANDWIDTH SAVINGS
          </div>
        </div>
      </section>

      {/* Main Feature Cards */}
      <section id="capabilities" className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-900/60 w-full space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight">Enterprise Architecture Capabilities</h2>
          <p className="text-slate-400 text-xs max-w-lg mx-auto">
            A production-ready platform split into decoupled generic FL orchestration and domain-specific cybersecurity incident generation layers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#090d16] border border-slate-900 rounded-xl p-6 hover:border-slate-800 transition-colors">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg w-max mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-white font-bold text-sm mb-2">FedCore Engine</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Decoupled, reusable federated learning coordinator utilizing Flower gRPC sockets. Agnostic to machine learning frameworks (supports Scikit-Learn, PyTorch, CatBoost).
            </p>
          </div>

          <div className="bg-[#090d16] border border-slate-900 rounded-xl p-6 hover:border-slate-800 transition-colors">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg w-max mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="text-white font-bold text-sm mb-2">AI SOC Analyst</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Dual-evaluation LLM reasoning pipeline (Ollama Llama 3.1/3.3 or OpenAI) converting ML anomalies into structured, compliance-mapped security incident reports.
            </p>
          </div>

          <div className="bg-[#090d16] border border-slate-900 rounded-xl p-6 hover:border-slate-800 transition-colors">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg w-max mb-4">
              <EyeOff className="w-5 h-5" />
            </div>
            <h4 className="text-white font-bold text-sm mb-2">Explainable Intelligence</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Integrates feature contribution weight vectors directly into AI prompts, allowing security officers to audit the logic backing threat classifications.
            </p>
          </div>
        </div>
      </section>

      {/* Compliance / ROI Summary */}
      <section className="bg-[#090d16]/40 border-t border-b border-slate-900/60 py-16 w-full">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-xl font-bold tracking-tight">Business Value & Ingestion Reduction</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Hosting security logs in centralized cloud repositories yields significant data ingestion costs, bandwidth bottlenecks, and regulatory liabilities (GDPR, PCI-DSS).
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              FedSOC AI eliminates raw data transfers entirely by transmitting only mathematical model parameter checkpoints. This delivers **99.99% network bandwidth reduction** and simplifies compliance audits.
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950 p-4 border border-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Ingestion Saved</span>
                <span className="text-emerald-400 text-base font-extrabold mt-1 block">2.28 GB saved</span>
              </div>
              <div className="bg-slate-950 p-4 border border-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Acc Improvements</span>
                <span className="text-indigo-400 text-base font-extrabold mt-1 block">+26.5% vs Local</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-[#090d16] border border-slate-900 p-4 rounded-xl">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-white text-xs font-bold block">100% Data Sovereignty</span>
                <span className="text-slate-500 text-[10px] block leading-normal mt-0.5">Silos retain total read/write privileges over their raw threat databases.</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#090d16] border border-slate-900 p-4 rounded-xl">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-white text-xs font-bold block">Regulatory Conformity</span>
                <span className="text-slate-500 text-[10px] block leading-normal mt-0.5">Direct alignment with GDPR, HIPAA, and PCI-DSS data localization acts.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="h-20 border-t border-slate-900/60 bg-[#090d16]/30 flex items-center justify-between px-8 md:px-16 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
        <span>© {new Date().getFullYear()} FedSOC AI. All Rights Reserved.</span>
        <span>Version 1.0.0 Stable</span>
      </footer>
    </div>
  );
}
