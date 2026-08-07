import React, { useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { Building2, User as UserIcon, Mail, Phone, ShieldCheck, ArrowRight, Store, Briefcase } from "lucide-react";
import { motion } from "motion/react";

interface OnboardingProps {
  onLogin: (user: User) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 16,
    },
  },
};

export const Onboarding: React.FC<OnboardingProps> = ({ onLogin }) => {
      
  // Registration state
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("STORE_MANAGER");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  
  
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !companyName || !contactName) {
      setError("Please fill out all required fields");
      return;
    }
    setError("");
    setSubmitting(true);

    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role, companyName, contactName, phone })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Registration failed");
        return res.json();
      })
      .then((data) => {
        onLogin(data.user);
      })
      .catch((err) => {
        setError("Registration failed. Please try again.");
        console.error(err);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div className="min-h-screen ambient-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-3 bg-slate-900 text-white p-3 rounded-2xl shadow-xl mb-6"
        >
          <Store className="h-8 w-8 text-blue-400" />
          <div className="text-left">
            <span className="text-2xl font-black tracking-tight block">Bank Kala</span>
            <span className="text-[10px] tracking-widest font-mono text-blue-400 block uppercase leading-none">B2B Wholesale Hub</span>
          </div>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl"
        >
          Connecting Suppliers & Stores
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 max-w-2xl mx-auto text-lg text-slate-600"
        >
          Manage wholesaling, product catalogs, bulk purchasing, and settle transactions with instant digital invoicing.
        </motion.p>
      </div>

      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-4xl">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-sm text-red-700 flex items-center">
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Right panel: Registration */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-12 max-w-lg mx-auto w-full bg-slate-900 text-white p-8 rounded-3xl shadow-xl border border-slate-800"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold">Register New Account</h2>
              <p className="text-slate-400 text-xs mt-1">Join the network as a Supplier or Store Manager.</p>
            </div>

            <motion.form 
              onSubmit={handleRegisterSubmit} 
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants}>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Company Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setRole("STORE_MANAGER")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1 transition-all ${
                      role === "STORE_MANAGER"
                        ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Store Manager</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setRole("SUPPLIER")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1 transition-all ${
                      role === "SUPPLIER"
                        ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Briefcase className="h-4 w-4" />
                    <span>Supplier</span>
                  </motion.button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Alborz Trade Group"
                    className="w-full bg-slate-800 text-sm text-white placeholder-slate-500 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Contact Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Bahram Radan"
                    className="w-full bg-slate-800 text-sm text-white placeholder-slate-500 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. bahram@alborz.com"
                    className="w-full bg-slate-800 text-sm text-white placeholder-slate-500 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Contact Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +98 912 345 6789"
                    className="w-full bg-slate-800 text-sm text-white placeholder-slate-500 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </motion.div>

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer mt-6"
              >
                <span>{submitting ? "Signing up..." : "Register Company"}</span>
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
