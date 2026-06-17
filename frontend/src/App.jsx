import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import {
  Github, Linkedin, Mail, Phone, MapPin, ExternalLink,
  Database, Layout, Server, Terminal, Cpu,
  CheckCircle2, Calendar, Zap, Twitter, Facebook,
  Lightbulb, Users, Target, Glasses, Brain,
  Braces, Palette, GraduationCap, Star, Award,
  Code, Sparkles, ChevronDown,
  Globe, Hexagon, Fingerprint, Menu, X
} from 'lucide-react';

import ecommerceImg from './assets/e-commerce.png';
import uberImg from './assets/uber.png';
import todoImg from './assets/todo.png';
import chatImg from './assets/chat-app.jpg';
import uberDriverImg from './assets/uber-driver.png';
import cert1Img from './assets/certificate1.jpg';
import cert2Img from './assets/certificate2.jpg';
import cert3Img from './assets/certificate3.jpg';
import genmiseoImg from './assets/genmise.png';

import BlurText from "./components/BlurText";
import Typewriter from "./components/Typewriter";

/* ─── HOOKS ─── */
function useMousePos() {
  const [p, setP] = useState({ x: 0.5, y: 0.5 });
  const fn = useCallback((e) => setP({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }), []);
  useEffect(() => { window.addEventListener('mousemove', fn); return () => window.removeEventListener('mousemove', fn); }, [fn]);
  return p;
}

function useScrollDir() {
  const [dir, setDir] = useState('up');
  const last = useRef(0);
  useEffect(() => {
    const fn = () => { const s = window.scrollY; setDir(s > last.current && s > 80 ? 'down' : 'up'); last.current = s; };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return dir;
}

const colors = {
  indigo: { h: '#6366f1', l: '#818cf8', d: '#4f46e5' },
  cyan: { h: '#06b6d4', l: '#22d3ee', d: '#0891b2' },
  emerald: { h: '#10b981', l: '#34d399', d: '#059669' },
  amber: { h: '#f59e0b', l: '#fbbf24', d: '#d97706' },
  pink: { h: '#ec4899', l: '#f472b6', d: '#db2777' },
  violet: { h: '#8b5cf6', l: '#a78bfa', d: '#7c3aed' }
};

/* ─── CINEMATIC INTRO ─── */
function IntroSequence({ onDone }) {
  const [phase, setPhase] = useState(0);
  const mouse = useMousePos();

  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => setPhase(3), 3800);
    const t4 = setTimeout(onDone, 5000);
    return () => { clearTimeout(t); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onDone]);

  return (
    <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[99999] bg-[#06060e] flex items-center justify-center overflow-hidden">
      {/* Ambient glow */}
      <div className="orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-indigo-500/10 blur-[120px] rounded-full"
        style={{ transform: `translate(${(mouse.x - 0.5) * 20}px, ${(mouse.y - 0.5) * 20}px) translate(-50%, -50%)` }} />

      {/* Rings */}
      <motion.div className="intro-ring w-20 h-20" initial={{ scale: 0, opacity: 0 }}
        animate={phase >= 0 ? { scale: 1, opacity: [0, 0.6, 0] } : {}} transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }} />
      <motion.div className="intro-ring w-40 h-40" initial={{ scale: 0, opacity: 0 }}
        animate={phase >= 0 ? { scale: 1, opacity: [0, 0.4, 0] } : {}} transition={{ duration: 2.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} />
      <motion.div className="intro-ring w-64 h-64" initial={{ scale: 0, opacity: 0 }}
        animate={phase >= 0 ? { scale: 1, opacity: [0, 0.3, 0] } : {}} transition={{ duration: 3, delay: 0.4, ease: [0.22, 1, 0.36, 1] }} />

      {/* Particles that spiral in */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div key={i} className="absolute w-1 h-1 rounded-full bg-indigo-400/40"
          initial={{ opacity: 0 }}
          animate={phase >= 0 ? {
            opacity: [0, 0.8, 0],
            x: [Math.random() * 200 - 100, Math.cos(i * 0.5) * 150],
            y: [Math.random() * 200 - 100, Math.sin(i * 0.5) * 150],
            scale: [0, 1, 0]
          } : {}}
          transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.8, ease: 'easeOut' }}
        />
      ))}

      {/* Phase 1: Subtitle */}
      <motion.p className="absolute text-white/20 text-xs tracking-[0.3em] uppercase font-bold"
        initial={{ opacity: 0, y: 10 }} animate={phase >= 1 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
        Portfolio 2026
      </motion.p>

      {/* Phase 2: Name reveal */}
      <motion.h1 className="absolute text-5xl md:text-7xl font-black tracking-tighter font-sans leading-[0.85] text-center"
        initial={{ opacity: 0, scale: 1.2, filter: 'blur(20px)' }}
        animate={phase >= 2 ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}>
        <span className="text-gradient">ADWAITH</span>
        <br />
        <span className="text-gradient">A KUMAR</span>
      </motion.h1>

      {/* Phase 3: Tagline */}
      <motion.p className="absolute bottom-[30%] text-white/20 text-sm tracking-[0.2em] font-light"
        initial={{ opacity: 0, y: 10 }} animate={phase >= 3 ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
        Developer · Designer · Dreamer
      </motion.p>
    </motion.div>
  );
}

/* ─── FLOATING NAV ─── */
function FloatingNav({ sections }) {
  const [active, setActive] = useState('hero');
  const [menuOpen, setMenuOpen] = useState(false);
  const dir = useScrollDir();

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { threshold: 0.3 });
    sections.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [sections]);

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); };
  const labels = { hero: 'Home', about: 'About', skills: 'Skills', education: 'Education', projects: 'Work', experience: 'Journey', contact: 'Connect' };

  return (
    <>
      <motion.nav animate={{ y: dir === 'down' ? -120 : 0, opacity: dir === 'down' ? 0 : 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999]">
        <div className="glass-s rounded-2xl px-2 py-1.5 flex items-center gap-1 shadow-2xl shadow-indigo-500/5">
          {sections.map((id) => (
            <button key={id} onClick={() => scrollTo(id)}
              className={`relative px-3 py-2 text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-300 rounded-lg ${active === id ? 'text-white' : 'text-white/30 hover:text-white/60'}`}>
              {active === id && <motion.div layoutId="nav-active" className="absolute inset-0 bg-white/10 rounded-lg" transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />}
              <span className="relative z-10">{labels[id]}</span>
            </button>
          ))}
          <button onClick={() => setMenuOpen(true)} className="p-2 text-white/40 hover:text-white lg:hidden"><Menu size={16} /></button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-[#06060e]/95 backdrop-blur-2xl flex items-center justify-center">
            <button onClick={() => setMenuOpen(false)} className="absolute top-6 right-6 p-3 text-white/60 hover:text-white"><X size={24} /></button>
            <div className="flex flex-col items-center gap-6">
              {sections.map((id, i) => (
                <motion.button key={id} onClick={() => scrollTo(id)}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="text-2xl font-bold text-white/60 hover:text-white transition-colors uppercase tracking-[0.15em]">{labels[id]}</motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── PARTICLE FIELD (enhanced, canvas-based with connections) ─── */
function ParticleField({ count = 35 }) {
  const ref = useRef(null);
  const mouse = useMousePos();
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    let anim;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.2 + 0.3, o: Math.random() * 0.3 + 0.1
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach((p, i) => {
        p.x += p.vx + (mouse.x - 0.5) * 0.08;
        p.y += p.vy + (mouse.y - 0.5) * 0.08;
        if (p.x < 0) p.x = c.width; if (p.x > c.width) p.x = 0;
        if (p.y < 0) p.y = c.height; if (p.y > c.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.o})`;
        ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const dx = p.x - pts[j].x, dy = p.y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.04 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      });
      anim = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(anim); window.removeEventListener('resize', resize); };
  }, [count, mouse]);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-[1]" />;
}

/* ─── REVEAL HELPERS ─── */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const isIn = useInView(ref, { once: true, margin: '-40px' });
  return (<motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={isIn ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>{children}</motion.div>);
}
function ScaleIn({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const isIn = useInView(ref, { once: true, margin: '-30px' });
  return (<motion.div ref={ref} initial={{ opacity: 0, scale: 0.92 }} animate={isIn ? { opacity: 1, scale: 1 } : {}}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>{children}</motion.div>);
}

/* ─── MAGNETIC BUTTON ─── */
function MagneticBtn({ children, className = '', href, onClick }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const Tag = href ? 'a' : 'button';
  return (
    <Tag ref={ref} href={href} target={href ? '_blank' : undefined} rel={href ? 'noopener' : undefined}
      onClick={onClick}
      onMouseMove={(e) => { if (ref.current) { const r = ref.current.getBoundingClientRect(); setPos({ x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.25 }); } }}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      onMouseDown={() => setPos({ x: pos.x * 0.5, y: pos.y * 0.5 })}
      className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
      <motion.span animate={{ x: pos.x, y: pos.y }} transition={{ type: 'spring', stiffness: 200, damping: 12, mass: 0.5 }} className="inline-flex items-center gap-2">
        {children}
      </motion.span>
    </Tag>
  );
}

/* ─── TILT CARD ─── */
function TiltCard({ children, className = '' }) {
  const ref = useRef(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  return (
    <motion.div ref={ref} className={`${className}`}
      onMouseMove={(e) => { if (!ref.current) return; const r = ref.current.getBoundingClientRect(); setRot({ x: ((e.clientY - r.top) / r.height - 0.5) * -12, y: ((e.clientX - r.left) / r.width - 0.5) * 12 }); }}
      onMouseLeave={() => setRot({ x: 0, y: 0 })}
      style={{ transform: `perspective(800px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
      {children}
    </motion.div>
  );
}

/* ─── HANGING TEXT ─── */
function HangingText({ text = "WEB DEVELOPER" }) {
  const letters = text.split('');
  return (
    <div className="flex items-start justify-center gap-[3px] md:gap-[5px] h-20 md:h-24">
      {letters.map((letter, i) => (
        <motion.div
          key={i}
          className="flex flex-col items-center cursor-default"
          style={{ transformOrigin: 'top center' }}
          animate={{
            rotate: [0, 3, -2, 4, -3, 1, 0],
          }}
          transition={{
            duration: 3 + (i % 3) * 0.7,
            repeat: Infinity,
            delay: i * 0.12,
            ease: 'easeInOut',
          }}
          whileHover={{
            rotate: [0, -30, 35, -25, 30, -18, 12, -6, 0],
            scale: 1.15,
            transition: { duration: 0.7, ease: 'easeOut' },
          }}
        >
          <div className="w-[1px] h-10 md:h-12 bg-gradient-to-b from-indigo-400/60 via-indigo-400/20 to-transparent" />
          <motion.span
            className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight inline-block"
            animate={{
              color: ['#818cf8', '#22d3ee', '#c4b5fd', '#f472b6', '#fbbf24', '#34d399', '#818cf8'],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.25,
            }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
const App = () => {
  const [introDone, setIntroDone] = useState(false);
  const [formStatus, setFormStatus] = useState('idle');
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [expandedSkill, setExpandedSkill] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);
  const mouse = useMousePos();

  const horizRef = useRef(null);
  const dragRef = useRef(null);
  const [dragBound, setDragBound] = useState(0);
  useEffect(() => {
    if (!dragRef.current || !horizRef.current) return;
    const update = () => { const track = horizRef.current?.querySelector('.drag-track'); if (track) setDragBound(Math.max(0, track.scrollWidth - horizRef.current.clientWidth)); };
    update();
    const obs = new ResizeObserver(update);
    if (dragRef.current) obs.observe(dragRef.current);
    return () => obs.disconnect();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
    try {
      const res = await fetch('https://formsubmit.co/ajax/adwaithadhu85227@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, message: formData.message, _subject: `Portfolio: ${formData.name}`, _template: 'table' })
      });
      if (res.ok) { setFormStatus('sent'); setFormData({ name: '', email: '', message: '' }); setTimeout(() => setFormStatus('idle'), 5000); } else setFormStatus('error');
    } catch { setFormStatus('error'); setTimeout(() => setFormStatus('idle'), 5000); }
  };

  const navSections = ['hero', 'about', 'skills', 'education', 'projects', 'experience', 'contact'];

  return (
    <div className="min-h-screen bg-[#06060e] font-plus-jakarta text-white overflow-x-hidden selection:bg-indigo-500/30">
      {/* ── INTRO SEQUENCE ── */}
      <AnimatePresence>
        {!introDone && <IntroSequence onDone={() => setIntroDone(true)} />}
      </AnimatePresence>

      {/* ── AMBIENT BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none z-0 aurora">
        <motion.div className="orb absolute top-[15%] left-[5%] w-[35vw] h-[35vw] bg-indigo-500/12"
          animate={{ x: [0, 40, -20, 0], y: [0, -40, 30, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} />
        <motion.div className="orb absolute bottom-[15%] right-[5%] w-[40vw] h-[40vw] bg-cyan-500/10"
          animate={{ x: [0, -40, 30, 0], y: [0, 40, -20, 0] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} />
        <motion.div className="orb absolute top-[40%] left-[35%] w-[25vw] h-[25vw] bg-violet-500/8"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      <ParticleField count={35} />
      <FloatingNav sections={navSections} />
      <ScrollProgressBar />

      {/* ================================================================
          1. HERO — Floating 3D-Inspired Workspace
          ================================================================ */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Orbiting tech nodes */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 2, 3].map((r) => (
            <motion.div key={r} className="absolute rounded-full border border-white/5"
              style={{ width: `${20 + r * 15}vw`, height: `${20 + r * 15}vw` }}
              animate={{ rotate: r % 2 ? 360 : -360 }} transition={{ duration: 40 + r * 10, repeat: Infinity, ease: 'linear' }} />
          ))}
          {['{ }', '< />', '⚡', '◆', '●', '★'].map((sym, i) => {
            const angle = (i / 6) * Math.PI * 2;
            return (
              <motion.div key={i} className="absolute text-white/8 text-2xl md:text-3xl font-black font-sans floating-slow pointer-events-none"
                style={{ left: `calc(50% + ${Math.cos(angle) * 25}vw)`, top: `calc(50% + ${Math.sin(angle) * 25}vw)`, transform: 'translate(-50%,-50%)' }}
                animate={{ y: [0, -10 - i * 3, 0], opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}>
                {sym}
              </motion.div>
            );
          })}
        </div>

        {/* Glass panel hero */}
        <div className="relative z-10 text-center px-6 max-w-5xl">

          <motion.h1 initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter font-sans leading-[0.82]">
            <span className="text-gradient">ADWAITH</span><br /><span className="text-gradient">A KUMAR</span>
          </motion.h1>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="h-10 mt-4">
            <Typewriter texts={['Frontend Developer', 'Backend Developer', 'Full Stack Architect', 'UI Engineer']} speed={22}
              wrapperClassName="text-lg md:text-2xl font-bold tracking-[0.15em] uppercase"
              className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent" />
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
            className="text-sm md:text-base text-white/40 max-w-xl mx-auto mt-6 leading-relaxed font-light tracking-wide">
            Crafting <span className="text-white/70 font-medium">high-performance</span> digital experiences with the{' '}
            <span className="text-indigo-300 font-semibold">MERN Stack</span> — precision meets creativity.
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8">
            <HangingText text="WEB DEVELOPER" />
          </motion.div>
        </div>

        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown size={16} className="text-white/20" />
        </motion.div>
      </section>

      {/* ================================================================
          2. ABOUT — Cinematic Reveal
          ================================================================ */}
      <section id="about" className="relative py-32 md:py-44 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <Reveal>
                <div className="flex items-center gap-3 text-indigo-400 text-[11px] font-bold tracking-[0.25em] uppercase">
                  <Fingerprint size={14} /><span className="glow-line w-12" /> About
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter font-sans leading-[0.92]">
                  Where <span className="text-gradient">code</span> meets <span className="text-gradient">imagination</span>.
                </h2>
              </Reveal>
              <Reveal delay={0.15}>
                <p className="text-white/45 text-base md:text-lg leading-relaxed max-w-lg">
                  Entry-level <span className="text-white/80 font-medium">MERN Stack Developer</span> on a mission to architect digital experiences that resonate. Every line of code is a deliberate choice toward elegance and performance.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="flex gap-10 md:gap-14 pt-4">
                  {[
                    { n: '1+', l: 'Years', s: 'Internship' },
                    { n: '5+', l: 'Projects', s: 'Delivered' },
                    { n: 'A+', l: 'Focus', s: 'Optimization' }
                  ].map((s, i) => (
                    <motion.div key={i} whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 200 }}>
                      <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{s.n}</div>
                      <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold mt-1">{s.l}</div>
                      <div className="text-[9px] text-white/20 italic">{s.s}</div>
                    </motion.div>
                  ))}
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.25} dir="right">
              <div className="relative flex items-center justify-center">
                <motion.div className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full border border-indigo-500/15"
                  animate={{ rotate: 360 }} transition={{ duration: 35, repeat: Infinity, ease: 'linear' }} />
                <motion.div className="absolute w-56 h-56 md:w-80 md:h-80 rounded-full border border-cyan-500/10"
                  animate={{ rotate: -360 }} transition={{ duration: 28, repeat: Infinity, ease: 'linear' }} />
                <motion.div className="absolute w-40 h-40 md:w-64 md:h-64 rounded-full border border-violet-500/8"
                  animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }} />

                {['React', 'Node', 'Mongo', 'Express'].map((n, i) => {
                  const a = (i / 4) * Math.PI * 2;
                  return (
                    <motion.div key={i}
                      className="absolute w-12 h-12 rounded-full glass flex items-center justify-center text-[8px] font-bold text-indigo-300 tracking-widest uppercase"
                      animate={{ x: [Math.cos(a) * 140, Math.cos(a + 0.05) * 140], y: [Math.sin(a) * 140, Math.sin(a + 0.05) * 140] }}
                      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}>
                      {n}
                    </motion.div>
                  );
                })}

                <TiltCard className="relative aspect-square md:aspect-[4/5] max-w-sm w-full rounded-[2rem] overflow-hidden glass-s border border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-transparent to-cyan-500/15" />
                  <div className="h-full flex flex-col items-center justify-center p-8">
                    <div className="text-7xl md:text-8xl mb-4 opacity-40">👤</div>
                    <div className="glass rounded-xl px-5 py-3 text-center border border-white/10">
                      <span className="text-[11px] font-bold tracking-widest text-indigo-300">HI, I'M ADWAITH</span>
                    </div>
                  </div>
                </TiltCard>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================================================================
          3. SKILLS — Galaxy Constellation
          ================================================================ */}
      <section id="skills" className="relative py-32 md:py-44 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <Reveal className="text-center space-y-3 mb-16">
            <div className="flex items-center justify-center gap-2 text-violet-400 text-[11px] font-bold tracking-[0.25em] uppercase">
              <Hexagon size={14} /> Skills Galaxy
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter font-sans text-white">Tech Constellation</h2>
            <p className="text-white/40 text-sm max-w-lg mx-auto">Tap any node to expand its universe.</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 'lang', icon: <Braces size={20} />, title: 'Languages', color: 'indigo', items: ['HTML5', 'CSS3', 'JavaScript (ES6+)'], pct: 90, desc: 'Foundational web trio — semantics, style, and logic.' },
              { id: 'front', icon: <Layout size={20} />, title: 'Frontend', color: 'cyan', items: ['React.js', 'React Native', 'Bootstrap', 'Tailwind CSS'], pct: 95, desc: 'Reactive, responsive interfaces with modern frameworks.' },
              { id: 'back', icon: <Server size={20} />, title: 'Backend', color: 'emerald', items: ['Node.js', 'Express.js'], pct: 85, desc: 'Robust server logic and API architecture.' },
              { id: 'db', icon: <Database size={20} />, title: 'Databases', color: 'amber', items: ['MongoDB', 'MySQL'], pct: 80, desc: 'Flexible and structured data storage.' },
              { id: 'tools', icon: <Terminal size={20} />, title: 'Tools', color: 'pink', items: ['Git', 'GitHub', 'VS Code', 'Postman', 'AWS', 'Docker'], pct: 85, desc: 'Streamlining development and deployment.' },
              { id: 'concepts', icon: <Cpu size={20} />, title: 'Concepts', color: 'violet', items: ['Responsive Design', 'REST APIs', 'DOM Manipulation'], pct: 90, desc: 'Foundational principles guiding every project.' }
            ].map((sk, i) => (
              <ScaleIn key={sk.id} delay={i * 0.06}>
                <motion.div className={`glass rounded-2xl p-5 cursor-pointer transition-all duration-300 ${expandedSkill === sk.id ? 'scale-[1.02]' : 'hover:bg-white/[0.07]'}`}
                  onClick={() => setExpandedSkill(expandedSkill === sk.id ? null : sk.id)} layout>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: `${colors[sk.color]?.h}22`, color: colors[sk.color]?.l, borderColor: `${colors[sk.color]?.h}33` }}>
                      {sk.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white/90">{sk.title}</h3>
                      <p className="text-[9px] text-white/30 uppercase tracking-[0.2em]">{sk.items.length} technologies</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {sk.items.map((t, j) => (
                      <span key={j} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-widest">{t}</span>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.15em] text-white/30 mb-1.5">
                      <span>Proficiency</span>
                      <span style={{ color: colors[sk.color]?.l }}>{sk.pct}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }} whileInView={{ width: `${sk.pct}%` }}
                        style={{ background: `linear-gradient(90deg, ${colors[sk.color]?.h}, ${colors[sk.color]?.l})` }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedSkill === sk.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                        <div className="pt-4 mt-4 border-t border-white/10 text-sm text-white/50 leading-relaxed">
                          <div className="flex items-start gap-2"><Sparkles size={14} className="shrink-0 mt-0.5 text-indigo-400" /><span>{sk.desc}</span></div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          4. EDUCATION + SOFTSKILLS — Story Timeline
          ================================================================ */}
      <section id="education" className="relative py-32 md:py-44 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
            <Reveal>
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20"><GraduationCap size={20} /></div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tighter font-sans text-white">The Path</h2>
                </div>
                <div className="space-y-0 relative pl-10">
                  <motion.div className="absolute left-[15px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-indigo-400 via-cyan-400 to-emerald-400 rounded-full"
                    initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }} style={{ originY: 0 }} />
                  {[
                    { year: '2022 — 2025', title: 'BCA — Computer Applications', sub: 'Srinivas University', desc: 'Deep foundation in computer science, data structures, algorithms, and software engineering.', c: 'indigo', bc: 'border-indigo-400' },
                    { year: 'Jul — Dec 2025', title: 'MERN Stack Intensive', sub: 'GTEC Institute, Kannur', desc: 'Full-stack immersion from REST APIs to responsive frontends with React, Node, Express, MongoDB.', c: 'cyan', bc: 'border-cyan-400' },
                    { year: '2026', title: 'Certifications', sub: 'Industry Credentials', desc: 'Specialized certificates validating advanced skills in modern web development.', c: 'emerald', bc: 'border-emerald-400' }
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="relative pb-10 last:pb-0">
                      <motion.div className={`absolute -left-[34px] top-1 w-7 h-7 rounded-full bg-[#06060e] border-2 ${item.bc} flex items-center justify-center`}
                        initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: colors[item.c]?.l }} />
                      </motion.div>
                      <div className="glass rounded-2xl p-6 md:p-7 ml-4 hover:bg-white/[0.06] transition-all">
                        <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: colors[item.c]?.l }}>{item.year}</div>
                        <h3 className="text-lg md:text-xl font-bold text-white">{item.title}</h3>
                        <p className="text-sm text-white/50 mt-1">{item.sub}</p>
                        <p className="text-xs text-white/30 mt-3 leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/20"><Star size={20} /></div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tighter font-sans text-white">Attributes</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: <Brain size={13} />, t: 'Problem Solving', d: 'Analytical & methodical', c: 'text-indigo-300' },
                    { icon: <Users size={13} />, t: 'Collaboration', d: 'Cross-functional synergy', c: 'text-cyan-300' },
                    { icon: <Target size={13} />, t: 'Time Management', d: 'Deadline-driven executor', c: 'text-emerald-300' },
                    { icon: <Glasses size={13} />, t: 'Communication', d: 'Clear & articulate', c: 'text-amber-300' },
                    { icon: <Palette size={13} />, t: 'UI/UX Sense', d: 'User-centered mindset', c: 'text-pink-300' },
                    { icon: <Lightbulb size={13} />, t: 'Critical Thinking', d: 'Solution-oriented', c: 'text-violet-300' }
                  ].map((sk, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9, y: 10 }} whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true }}
                      className="glass rounded-xl p-4 border border-white/10 group cursor-default hover:bg-white/[0.07] transition-all"
                      whileHover={{ y: -2 }}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center ${sk.c} group-hover:scale-110 transition-transform shrink-0`}>{sk.icon}</div>
                        <div>
                          <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest">{sk.t}</h3>
                          <p className="text-[10px] text-white/40 mt-0.5">{sk.d}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================================================================
          5. PROJECTS — Immersive horizontal gallery
          ================================================================ */}
      <section id="projects" className="relative py-16 md:py-20 overflow-hidden">
        <Reveal className="text-center space-y-2 mb-6 px-6 relative z-10">
          <div className="flex items-center justify-center gap-2 text-cyan-400 text-[10px] font-bold tracking-[0.25em] uppercase">
            <Code size={13} /> Featured Work
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter font-sans text-white">Project Worlds</h2>
          <p className="text-white/40 text-xs max-w-md mx-auto">Drag to explore each project universe.</p>
        </Reveal>

        <div ref={horizRef} className="relative h-[35vh] md:h-[40vh] overflow-x-auto cursor-grab active:cursor-grabbing no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="sticky top-0 left-0 h-full">
            <motion.div ref={dragRef} drag="x" dragConstraints={{ right: 0, left: -dragBound }} dragElastic={0.05}
              className="flex gap-4 md:gap-5 px-4 w-max drag-track">
              {[
              { img: ecommerceImg, tag: 'MERN Stack', title: 'ShopCart', desc: 'Full-stack shopping with cart, auth, and Stripe checkout.', color: 'indigo', github: 'https://github.com/adwaith85/project-Ecommerce-', demo: 'https://shop-cart.adwaid.online/' },
              { img: uberImg, tag: 'Real-Time', title: 'Oober', desc: 'Ride-booking platform with rider/driver dashboards + live tracking.', color: 'cyan', github: 'https://github.com/adwaith85/Project-Uber', demo: 'https://oober.adwaid.online/' },
              { img: uberDriverImg, tag: 'Real-Time', title: 'Oober Driver', desc: 'Driver platform for ride management, earnings, and requests.', color: 'cyan', github: 'https://github.com/adwaith85/Project-Uber', demo: 'https://oober-driver.adwaid.online/' },
              { img: chatImg, tag: 'WebSocket', title: 'Chat App', desc: 'Real-time messaging with auth, matching, and conversations.', color: 'violet', github: 'https://github.com/adwaith85/Chat-App', demo: null },
              { img: todoImg, tag: 'Productivity', title: 'Task Manager', desc: 'Task management with persistent storage and smooth UX.', color: 'emerald', github: 'https://github.com/adwaith85/To-Do-App', demo: 'https://todo.adwaid.online/' },
              { img: genmiseoImg, tag: 'E-Commerce', title: 'Genmise', desc: 'Online shopping and content creation platform.', color: 'emerald', github: 'https://github.com/adwaith85/ecomm-backend', demo: 'https://genmise.adwaid.online/' }
            ].map((p, i) => (
              <TiltCard key={i} className="relative w-[60vw] md:w-[40vw] lg:w-[28vw] h-[28vh] md:h-[32vh] rounded-2xl overflow-hidden glass group shrink-0" whileHover={{ scale: 1.015 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06060e] via-[#06060e]/30 to-transparent z-10" />
                  <img src={p.img} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                  <div className="relative z-20 h-full flex flex-col justify-end p-4 md:p-5">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors[p.color]?.l }} />
                        <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: colors[p.color]?.l }}>{p.tag}</span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-white">{p.title}</h3>
                    </div>
                    <motion.div initial={{ opacity: 0, y: 8 }} whileHover={{ opacity: 1, y: 0 }} className="mt-1.5 space-y-2">
                      <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">{p.desc}</p>
                      <div className="flex gap-1.5">
                        <a href={p.github} target="_blank" className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-indigo-500 hover:text-white transition-all border border-white/10"><Github size={12} /></a>
                        {p.demo && <a href={p.demo} target="_blank" className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-cyan-500 hover:text-white transition-all border border-white/10"><ExternalLink size={12} /></a>}
                      </div>
                    </motion.div>
                  </div>
                </TiltCard>
              ))}
            </motion.div>
          </div>
        </div>

        <motion.div className="flex justify-center mt-6 gap-1" animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2, repeat: Infinity }}>
          {[1, 2, 3].map((d) => (
            <motion.div key={d} className="w-2 h-2 rounded-full bg-cyan-400/50" animate={{ x: [0, d * 8, 0] }} transition={{ duration: 1.5, delay: d * 0.15, repeat: Infinity }} />
          ))}
        </motion.div>
      </section>

      {/* ================================================================
          6. EXPERIENCE — Story Journey
          ================================================================ */}
      <section id="experience" className="relative py-32 md:py-44 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <Reveal className="text-center space-y-3 mb-16">
            <div className="flex items-center justify-center gap-2 text-amber-400 text-[11px] font-bold tracking-[0.25em] uppercase">
              <Award size={14} /> Professional Journey
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter font-sans text-white">The Story So Far</h2>
          </Reveal>

          <div className="relative pl-12 md:pl-16">
            <motion.div className="absolute left-[19px] md:left-[23px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-amber-400 via-indigo-400 to-cyan-400 rounded-full"
              initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }} style={{ originY: 0 }} />

            <Reveal delay={0.1}>
              <div className="relative pb-14">
                <motion.div className="absolute -left-[35px] md:-left-[45px] top-1 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#06060e] border-2 border-amber-400 flex items-center justify-center"
                  initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                </motion.div>
                <div className="glass rounded-2xl p-7 md:p-9 ml-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Jan 2026 — Feb 2026</span>
                  <h3 className="text-xl md:text-2xl font-bold text-white mt-2">Web Developer Intern</h3>
                  <p className="text-cyan-400 font-medium text-sm">GTEC, Kannur</p>
                  <ul className="mt-5 space-y-3 text-white/50 text-sm">
                    <li className="flex gap-3"><CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />Built responsive interfaces with modern HTML, CSS, JavaScript.</li>
                    <li className="flex gap-3"><CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />Integrated frontend with Node.js/Express REST APIs.</li>
                    <li className="flex gap-3"><CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />Optimized load times and enhanced overall user experience.</li>
                  </ul>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="relative">
                <motion.div className="absolute -left-[35px] md:-left-[45px] top-1 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#06060e] border-2 border-indigo-400 flex items-center justify-center"
                  initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                </motion.div>
                <div className="glass rounded-2xl p-7 md:p-9 ml-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Present</span>
                  <h3 className="text-xl md:text-2xl font-bold text-white mt-2">Open for Opportunities</h3>
                  <p className="text-white/40 text-sm mt-3 leading-relaxed">Currently seeking a full-time role where I can contribute, grow, and build impactful products with a passionate team.</p>
                  <MagneticBtn onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="mt-5 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-indigo-500/20">
                    Let's Talk
                  </MagneticBtn>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================================================================
          7. CERTIFICATES
          ================================================================ */}
      <section className="relative py-32 md:py-44 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <Reveal className="text-center space-y-3 mb-16">
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-[11px] font-bold tracking-[0.25em] uppercase">
              <Award size={14} /> Credentials
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter font-sans text-white">Certifications</h2>
            <p className="text-white/40 text-sm max-w-lg mx-auto">Proof of expertise — verified industry credentials.</p>
          </Reveal>

          <div className="flex flex-wrap justify-center gap-6">
            {[
              { src: cert1Img },
              { src: cert2Img },
              { src: cert3Img }
            ].map((cert, i) => (
              <ScaleIn key={i} delay={i * 0.1}>
                <TiltCard className="glass rounded-2xl overflow-hidden border border-white/10 w-[240px] md:w-[280px] group cursor-pointer"
                  whileHover={{ scale: 1.02 }}>
                  <div className="aspect-[4/3] relative overflow-hidden bg-[#06060e] flex items-center justify-center">
                    <img src={cert.src} alt="Certificate"
                      className="w-full h-full object-contain transition-all duration-500 blur-sm group-hover:blur-none p-2"
                      onClick={() => setSelectedCert(cert.src)} />
                  </div>
                </TiltCard>
              </ScaleIn>
            ))}
          </div>

          {/* Lightbox */}
          <AnimatePresence>
            {selectedCert && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={() => setSelectedCert(null)}
              >
                <motion.img
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                  src={selectedCert} alt="Certificate Full"
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                  onClick={(e) => e.stopPropagation()} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ================================================================
          8. CONTACT — Living Experience
          ================================================================ */}
      <section id="contact" className="relative py-32 md:py-44 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <Reveal className="space-y-8">
              <div className="flex items-center gap-2 text-indigo-400 text-[11px] font-bold tracking-[0.25em] uppercase"><Globe size={14} /> Connect</div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight font-sans leading-[0.9] text-white">
                Let's create <span className="text-gradient">something</span><br />extraordinary.
              </h2>
              <p className="text-white/40 text-base max-w-sm leading-relaxed">Open for collaborations, freelance, and full-time opportunities. Let's build the future together.</p>
              <div className="space-y-4">
                {[
                  { icon: <Mail size={15} />, v: 'adwaithadhu85227@gmail.com', l: 'Email' },
                  { icon: <Phone size={15} />, v: '+91 75588 83100', l: 'Phone' },
                  { icon: <MapPin size={15} />, v: 'Kannur, Kerala, India', l: 'Location' }
                ].map((item, id) => (
                  <motion.div key={id} className="flex items-center gap-3 group/item w-fit" whileHover={{ x: 3 }}>
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover/item:bg-indigo-500/20 transition-all">{item.icon}</div>
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">{item.l}</div>
                      <div className="text-sm text-white/60 group-hover/item:text-indigo-300 transition-colors truncate mt-0.5">{item.v}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <form onSubmit={handleSubmit} className="glass rounded-[2rem] p-8 md:p-10 space-y-5 border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Your Name</label>
                    <input type="text" required placeholder="John" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none transition-all text-sm text-white placeholder:text-white/20"
                      style={{ focusBorderColor: 'rgba(99,102,241,0.5)' }} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Email</label>
                    <input type="email" required placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none transition-all text-sm text-white placeholder:text-white/20" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Your Vision</label>
                  <textarea required placeholder="Tell me about your project..." rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none transition-all text-sm text-white placeholder:text-white/20 resize-none" />
                </div>

                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                  disabled={formStatus === 'sending'}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.15em] text-xs transition-all duration-300 ${
                    formStatus === 'sent' ? 'bg-emerald-500 text-white' :
                    formStatus === 'error' ? 'bg-red-400 text-white' :
                    'bg-gradient-to-r from-indigo-500 via-cyan-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40'}`}>
                  {formStatus === 'idle' && <span className="flex items-center justify-center gap-2">Send Message <Zap size={13} /></span>}
                  {formStatus === 'sending' && <span className="flex items-center justify-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>⚡</motion.span> Sending...</span>}
                  {formStatus === 'sent' && '✓ Message Delivered'}
                  {formStatus === 'error' && '✗ Error — Try Again'}
                </motion.button>

                <AnimatePresence>
                  {formStatus === 'sent' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-center text-emerald-400 text-[10px] font-bold tracking-widest uppercase bg-emerald-500/10 rounded-xl py-3 border border-emerald-500/20">
                      I'll respond within 24 hours ✦
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================================================================
          9. FOOTER
          ================================================================ */}
      <footer className="relative pt-24 pb-8 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 1440 100" className="w-full h-full" preserveAspectRatio="none">
            <motion.path d="M0,40 C360,100 720,0 1080,60 C1260,90 1350,50 1440,60 L1440,100 L0,100 Z" fill="rgba(99,102,241,0.05)" />
            <motion.path d="M0,60 C360,20 720,80 1080,30 C1260,10 1350,60 1440,40 L1440,100 L0,100 Z" fill="rgba(6,182,212,0.03)"
              animate={{ d: ['M0,60 C360,20 720,80 1080,30 C1260,10 1350,60 1440,40 L1440,100 L0,100 Z', 'M0,40 C360,80 720,20 1080,50 C1260,70 1350,30 1440,60 L1440,100 L0,100 Z', 'M0,60 C360,20 720,80 1080,30 C1260,10 1350,60 1440,40 L1440,100 L0,100 Z'] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <motion.div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-base font-sans"
                whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>A</motion.div>
              <div>
                <span className="text-sm font-bold text-white/80">ADWAITH A KUMAR</span>
                <p className="text-[9px] text-white/30 tracking-widest uppercase">Developer & Designer</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { i: <Github size={14} />, l: 'https://github.com/adwaith85', h: 'hover:bg-[#2b3137]' },
                { i: <Linkedin size={14} />, l: 'https://linkedin.com/in/adwaith-a-kumar', h: 'hover:bg-[#0077b5]' },
                { i: <Twitter size={14} />, l: 'https://x.com/Adwaith710', h: 'hover:bg-[#1DA1F2]' },
                { i: <Facebook size={14} />, l: 'https://www.facebook.com/share/17zqpHjQSh/', h: 'hover:bg-[#1877F2]' },
                { i: <Mail size={14} />, l: 'mailto:adwaithadhu85227@gmail.com', h: 'hover:bg-[#EA4335]' }
              ].map((s, i) => (
                <motion.a key={i} href={s.l} target="_blank" rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 ${s.h} hover:text-white transition-all`}
                  whileHover={{ scale: 1.15, rotate: 5 }}>{s.i}</motion.a>
              ))}
            </div>
          </div>
          <div className="glow-line mt-10 mb-6" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">
            <p>© 2026 — Crafted with precision and purpose</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  return <motion.div className="fixed top-0 left-0 right-0 h-[2px] z-[99999] bg-gradient-to-r from-indigo-500 via-cyan-500 to-violet-500 origin-left" style={{ scaleX: scrollYProgress }} />;
}

export default App;
