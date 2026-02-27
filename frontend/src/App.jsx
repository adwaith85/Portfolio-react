import React from 'react';
import { motion } from 'framer-motion';
import {
    Github,
    Linkedin,
    Mail,
    Phone,
    MapPin,
    ExternalLink,
    Code2,
    Database,
    Layout,
    Server,
    Terminal,
    Cpu,
    CheckCircle2,
    Calendar,
    Briefcase,
    ChevronRight,
    ArrowUpRight,
    Monitor,
    Zap,
    Twitter,
    Facebook
} from 'lucide-react';


import ecommerceImg from './assets/e-commerce.png';
import uberImg from './assets/uber.png';
import todoImg from './assets/todo.png';
import chatImg from './assets/chat-app.jpg';
import uberDriverImg from './assets/uber-driver.png';

import BlurText from "./components/BlurText";
import Typewriter from "./components/Typewriter";
import GlitchText from "./components/GlitchText";
import AnimatedBackground from "./components/AnimatedBackground";

const Navbar = () => {
    const [scrolled, setScrolled] = React.useState(false);
    const [scrollProgress, setScrollProgress] = React.useState(0);

    React.useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (window.scrollY / totalHeight) * 100;
            setScrollProgress(progress);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <div className="fixed top-0 left-0 right-0 h-1 z-[60]">
                <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 bg-[length:200%_auto]"
                    animate={{ backgroundPosition: ["0% center", "200% center"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>
            <nav className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 ${scrolled ? 'py-4' : 'py-8'}`}>
                <div className="max-w-6xl mx-auto px-6">
                    <div className={`flex justify-between items-center bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl px-6 py-3 transition-all duration-500 ${scrolled ? 'shadow-2xl shadow-cyan-500/10' : ''}`}>
                        <div className="flex items-center gap-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                                Portfolio
                            </div>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-8 font-sans overflow-x-auto no-scrollbar py-2 max-w-[200px] sm:max-w-none">

                            <a href="#about" className="text-[10px] sm:text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-[0.2em] whitespace-nowrap">About</a>
                            <a href="#skills" className="text-[10px] sm:text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-[0.2em] whitespace-nowrap">Skills</a>
                            <a href="#projects" className="text-[10px] sm:text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-[0.2em] whitespace-nowrap">Projects</a>
                            <a href="#contact" className="text-[10px] sm:text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-[0.2em] whitespace-nowrap">Contact</a>
                        </div>

                    </div>
                </div>
            </nav>
        </>
    );
};


const App = () => {
    const [formStatus, setFormStatus] = React.useState('idle'); // 'idle', 'sending', 'sent', 'error'
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        message: ''
    });

    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormStatus('sending');

        try {
            const response = await fetch('https://formsubmit.co/ajax/adwaithadhu85227@gmail.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    message: formData.message,
                    _subject: `New Portfolio Message from ${formData.name}`,
                    _template: 'table'
                })
            });

            if (response.ok) {
                setFormStatus('sent');
                setFormData({ name: '', email: '', message: '' });
                setTimeout(() => setFormStatus('idle'), 5000);
            } else {
                setFormStatus('error');
            }
        } catch (error) {
            setFormStatus('error');
            setTimeout(() => setFormStatus('idle'), 5000);
        }
    };



    return (
        <div className="min-h-screen bg-black text-slate-100 font-plus-jakarta selection:bg-cyan-500/30 overflow-x-hidden">
            <Navbar />
            <AnimatedBackground />

            {/* Smooth Gradient background with more motion */}
            <div className="fixed inset-0 pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        x: [0, 50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-cyan-500/5 blur-[150px] rounded-full"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [0, -90, 0],
                        x: [0, -50, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-purple-500/5 blur-[150px] rounded-full"
                />
            </div>

            {/* Hero Section */}
            <header className="relative h-screen flex items-center justify-center p-6 overflow-hidden">
                {/* Background Image Layer: Darker & More Blurred for focus */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop"
                        alt="Professional Developer Workspace"
                        className="w-full h-full object-cover opacity-10 blur-[6px] scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10" />
                </div>

                <div className="relative z-[100] w-full max-w-3xl flex flex-col items-center justify-center text-center">
                    {/* Text Content (Centered & Tighter) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="space-y-8"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase shadow-lg shadow-cyan-500/10"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            Available for Work
                        </motion.div>

                        <BlurText
                            text="ADWAITH A KUMAR"
                            delay={20}
                            animateBy="words"
                            direction="top"
                            className="text-5xl md:text-6xl lg:text-6xl font-black tracking-tighter font-sans leading-[0.85] text-white"
                        />

                        <div className="h-8 md:h-12">
                            <Typewriter
                                texts={['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Database Management', 'UI Designer']}
                                speed={20}
                                wrapperClassName="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent tracking-widest uppercase"
                                className="text-xl md:text-2xl font-bold text-cyan-400 tracking-widest uppercase font-sans"
                            />
                        </div>

                        <p className="text-lg md:text-xl font-light text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Architecting <span className="text-white font-medium">high-performance</span> digital worlds with the <span className="text-cyan-400 font-bold underline decoration-cyan-500/30 underline-offset-8">MERN Stack</span>.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4 pt-4">
                            <a href="#contact" className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/20">
                                Get In Touch
                            </a>
                            <a href="#projects" className="px-8 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-100 font-bold rounded-xl transition-all hover:bg-slate-800">
                                View Work
                            </a>
                        </div>
                    </motion.div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10" />

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500 z-30"
                >
                    <div className="w-6 h-10 border-2 border-slate-700 rounded-full flex justify-center p-1">
                        <div className="w-1 h-2 bg-cyan-500 rounded-full" />
                    </div>
                </motion.div>
            </header>

            <main className="max-w-6xl mx-auto px-6 space-y-24 pb-24">

                {/* About Section */}
                <motion.section id="about" {...fadeIn} className="relative">
                    <div className="absolute inset-0 bg-cyan-500/5 blur-[120px] rounded-full -z-10 translate-x-1/2 scale-150" />
                    <div className="flex flex-col md:flex-row gap-20 items-center">
                        <div className="flex-1 space-y-10">
                            <div className="space-y-4">
                                <GlitchText
                                    speed={1}
                                    enableShadows={true}
                                    enableOnHover={false}
                                    className="text-2xl md:text-4xl font-black font-sans tracking-tighter leading-tight"
                                >
                                    Full-Stack MERN Developer building scalable, user-focused web applications
                                </GlitchText>
                                <div className="h-1.5 w-20 md:w-24 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mt-4" />
                            </div>

                            <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-light">
                                Entry-level <span className="text-white font-medium ml-2">MERN Stack Web Developer</span> with a hunger for building responsive and scalable web applications. My journey is rooted in turning complex problems into elegant, user-centric solutions.
                            </p>


                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 pt-4">

                                <div className="p-6 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl group hover:border-cyan-500/20 transition-all duration-300">
                                    <div className="text-3xl font-black text-cyan-400 font-sans tracking-tighter group-hover:scale-110 transition-transform">1+</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Experience</div>
                                    <div className="text-[10px] text-slate-600 italic mt-0.5">Year Internship</div>
                                </div>

                                <div className="p-6 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl group hover:border-cyan-500/20 transition-all duration-300">
                                    <div className="text-3xl font-black text-cyan-400 font-sans tracking-tighter group-hover:scale-110 transition-transform">5+</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Projects</div>
                                    <div className="text-[10px] text-slate-600 italic mt-0.5">Completed</div>
                                </div>

                                <div className="p-6 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl group hover:border-cyan-500/20 transition-all duration-300">
                                    <div className="text-3xl font-black text-cyan-400 font-sans tracking-tighter group-hover:scale-110 transition-transform">A+</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Speed</div>
                                    <div className="text-[10px] text-slate-600 italic mt-0.5">Optimization</div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-[400px] shrink-0 group order-first md:order-last">
                            <div className="relative aspect-square md:aspect-[4/5] bg-slate-900 rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-white/10 group-hover:border-cyan-500/30 transition-all duration-700">

                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
                                <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                {/* Image Placeholder with premium look */}
                                <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
                                    <div className="text-9xl mb-4 group-hover:scale-110 transition-transform duration-700">👤</div>
                                    <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 animate-bounce">
                                        <span className="text-sm font-bold tracking-widest text-cyan-400">HI, I'M ADWAITH</span>
                                    </div>

                                    {/* Decorative lines */}
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <div key={i} className="absolute inset-0 border border-white/5 rounded-full scale-[1.5]" style={{ transform: `rotate(${i * 36}deg) scale(2)` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>


                {/* Skills Section */}
                <section id="skills" className="md:space-y-16">
                    <motion.div {...fadeIn} className="text-center space-y-4 px-4">
                        <h2 className="text-4xl md:text-6xl font-black mb-4 font-sans tracking-tighter">My Toolkit</h2>
                        <p className="text-slate-400 text-sm md:text-lg max-w-xl mx-auto">Mastering the technologies that power the modern web.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 px-4 md:px-0">
                        {/* Languages */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            viewport={{ once: true }}
                            className="p-5 md:p-6 bg-slate-900/30 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shadow-2xl group hover:border-cyan-500/20 transition-all duration-500"
                        >
                            <div className="flex items-center gap-4 md:gap-6 mb-5 md:mb-6">
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-[1rem] bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-white/5">
                                    <Code2 className="text-cyan-400 w-5 h-5 md:w-7 md:h-7" />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold font-sans uppercase tracking-tighter">Languages</h3>
                                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">3 Technologies</p>
                                </div>
                            </div>
                            <div className="space-y-4 md:space-y-5">
                                <div className="flex flex-wrap gap-2">

                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">HTML5</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">CSS3</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">JavaScript (ES6+)</span>
                                </div>
                                <div className="space-y-1.5 pt-3 border-t border-white/5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
                                        <span>Proficiency</span>
                                        <span className="text-cyan-400">90%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: '90%' }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Frontend */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            viewport={{ once: true }}
                            className="p-5 md:p-6 bg-slate-900/30 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shadow-2xl group hover:border-cyan-500/20 transition-all duration-500"
                        >
                            <div className="flex items-center gap-4 md:gap-6 mb-5 md:mb-6">
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-[1rem] bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-white/5">
                                    <Layout className="text-purple-400 w-5 h-5 md:w-7 md:h-7" />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold font-sans uppercase tracking-tighter">Frontend</h3>
                                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">4 Technologies</p>
                                </div>
                            </div>
                            <div className="space-y-4 md:space-y-5">
                                <div className="flex flex-wrap gap-2">

                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">React.js</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">React Native</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">Bootstrap</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">Tailwind CSS</span>
                                </div>
                                <div className="space-y-1.5 pt-3 border-t border-white/5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
                                        <span>Proficiency</span>
                                        <span className="text-cyan-400">95%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: '95%' }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Backend */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            viewport={{ once: true }}
                            className="p-5 md:p-6 bg-slate-900/30 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shadow-2xl group hover:border-cyan-500/20 transition-all duration-500"
                        >
                            <div className="flex items-center gap-4 md:gap-6 mb-5 md:mb-6">
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-[1rem] bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-white/5">
                                    <Server className="text-emerald-400 w-5 h-5 md:w-7 md:h-7" />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold font-sans uppercase tracking-tighter">Backend</h3>
                                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">2 Technologies</p>
                                </div>
                            </div>
                            <div className="space-y-4 md:space-y-5">
                                <div className="flex flex-wrap gap-2">

                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">Node.js</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">Express.js</span>
                                </div>
                                <div className="space-y-1.5 pt-3 border-t border-white/5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
                                        <span>Proficiency</span>
                                        <span className="text-cyan-400">85%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: '85%' }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Databases */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            viewport={{ once: true }}
                            className="p-5 md:p-6 bg-slate-900/30 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shadow-2xl group hover:border-cyan-500/20 transition-all duration-500"
                        >
                            <div className="flex items-center gap-4 md:gap-6 mb-5 md:mb-6">
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-[1rem] bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-white/5">
                                    <Database className="text-amber-400 w-5 h-5 md:w-7 md:h-7" />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold font-sans uppercase tracking-tighter">Databases</h3>
                                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">2 Technologies</p>
                                </div>
                            </div>
                            <div className="space-y-4 md:space-y-5">
                                <div className="flex flex-wrap gap-2">

                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">MongoDB</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">MySQL</span>
                                </div>
                                <div className="space-y-1.5 pt-3 border-t border-white/5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
                                        <span>Proficiency</span>
                                        <span className="text-cyan-400">80%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: '80%' }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Tools */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            viewport={{ once: true }}
                            className="p-5 md:p-6 bg-slate-900/30 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shadow-2xl group hover:border-cyan-500/20 transition-all duration-500"
                        >
                            <div className="flex items-center gap-4 md:gap-6 mb-5 md:mb-6">
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-[1rem] bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-white/5">
                                    <Terminal className="text-pink-400 w-5 h-5 md:w-7 md:h-7" />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold font-sans uppercase tracking-tighter">Tools</h3>
                                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">6 Technologies</p>
                                </div>
                            </div>
                            <div className="space-y-4 md:space-y-5">
                                <div className="flex flex-wrap gap-2">

                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">Git</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">GitHub</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">VS Code</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">Postman</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">AWS</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">Docker</span>
                                </div>
                                <div className="space-y-1.5 pt-3 border-t border-white/5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
                                        <span>Proficiency</span>
                                        <span className="text-cyan-400">85%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: '85%' }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Concepts */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            viewport={{ once: true }}
                            className="p-5 md:p-6 bg-slate-900/30 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shadow-2xl group hover:border-cyan-500/20 transition-all duration-500"
                        >
                            <div className="flex items-center gap-4 md:gap-6 mb-5 md:mb-6">
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-[1rem] bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-white/5">
                                    <Cpu className="text-indigo-400 w-5 h-5 md:w-7 md:h-7" />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold font-sans uppercase tracking-tighter">Concepts</h3>
                                    <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">3 Technologies</p>
                                </div>
                            </div>
                            <div className="space-y-4 md:space-y-5">
                                <div className="flex flex-wrap gap-2">

                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">Responsive Design</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">REST APIs</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 text-[9px] md:text-[10px] font-bold text-slate-400 border border-white/5 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default uppercase tracking-widest leading-none">DOM Manipulation</span>
                                </div>
                                <div className="space-y-1.5 pt-3 border-t border-white/5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
                                        <span>Proficiency</span>
                                        <span className="text-cyan-400">90%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: '90%' }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Education Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 px-4 md:px-0">

                    <motion.div {...fadeIn} className="space-y-8">
                        <h2 className="text-3xl font-black font-sans tracking-tighter">Education</h2>
                        <div className="space-y-8 border-l-2 border-slate-800 pl-8 relative">
                            <div className="space-y-2">
                                <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-slate-800 border border-slate-700" />
                                <h3 className="text-lg font-bold">Bachelor of Computer Applications (BCA)</h3>
                                <p className="text-slate-400">Srinivas University</p>
                                <p className="text-sm text-slate-500">2022 - 2025</p>
                            </div>
                            <div className="space-y-2 relative">
                                <div className="absolute -left-[41px] top-2 w-4 h-4 rounded-full bg-slate-800 border border-slate-700" />
                                <h3 className="text-lg font-bold">MERN Stack Course</h3>
                                <p className="text-slate-400">GTEC Institute, Kannur</p>
                                <p className="text-sm text-slate-500">Jul 2025 - Dec 2025</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div {...fadeIn} className="space-y-8">
                        <h2 className="text-3xl font-black font-sans tracking-tighter">Soft Skills</h2>
                        <div className="flex flex-wrap gap-3">

                            <span className="px-5 md:px-6 py-3 bg-slate-900/50 border border-white/5 rounded-2xl text-[10px] md:text-sm text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all cursor-default uppercase font-black tracking-widest leading-none">
                                Problem Solving
                            </span>
                            <span className="px-5 md:px-6 py-3 bg-slate-900/50 border border-white/5 rounded-2xl text-[10px] md:text-sm text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all cursor-default uppercase font-black tracking-widest leading-none">
                                Team Collaboration
                            </span>
                            <span className="px-5 md:px-6 py-3 bg-slate-900/50 border border-white/5 rounded-2xl text-[10px] md:text-sm text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all cursor-default uppercase font-black tracking-widest leading-none">
                                Time Management
                            </span>
                            <span className="px-5 md:px-6 py-3 bg-slate-900/50 border border-white/5 rounded-2xl text-[10px] md:text-sm text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all cursor-default uppercase font-black tracking-widest leading-none">
                                Strong Communication
                            </span>
                            <span className="px-5 md:px-6 py-3 bg-slate-900/50 border border-white/5 rounded-2xl text-[10px] md:text-sm text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all cursor-default uppercase font-black tracking-widest leading-none">
                                UI Design
                            </span>
                            <span className="px-5 md:px-6 py-3 bg-slate-900/50 border border-white/5 rounded-2xl text-[10px] md:text-sm text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-all cursor-default uppercase font-black tracking-widest leading-none">
                                Critical Thinking
                            </span>
                        </div>
                    </motion.div>
                </section>

                {/* Projects Section */}
                <section id="projects" className="space-y-12 px-4 md:px-0">
                    <motion.div {...fadeIn} className="text-center space-y-4">

                        <h2 className="text-5xl md:text-6xl font-black font-sans tracking-tighter">Featured Work</h2>
                        <p className="text-slate-400 text-sm md:text-lg max-w-xl mx-auto">Exploring the intersection of design and functionality through code.</p>
                    </motion.div>


                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {/* Project 1: E-Commerce */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            viewport={{ once: true }}
                            className="group relative h-64 w-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-slate-900 border border-slate-800"
                        >
                            <div className="absolute inset-0 bg-slate-950/60 md:bg-slate-950/50 md:group-hover:bg-slate-950/80 transition-colors duration-500 z-10" />
                            <img
                                src={ecommerceImg}
                                alt="E-Commerce Web Application"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 group-hover:blur-sm transition-all duration-700"
                            />

                            {/* Content Container */}
                            <div className="relative z-20 h-full flex flex-col justify-end p-6">
                                {/* Title Section (Starts at bottom, moves slightly up on hover) */}
                                <div className="translate-y-0 group-hover:-translate-y-2 transition-transform duration-500">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-cyan-500/20 rounded-md text-cyan-400 backdrop-blur-md">
                                            <Monitor size={16} />
                                        </div>
                                        <span className="text-cyan-400 text-[10px] font-black uppercase tracking-widest font-sans">MERN Stack</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white font-sans leading-tight drop-shadow-md">E-Commerce App</h3>
                                </div>

                                {/* Revealable Content (Always visible on mobile) */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-30">
                                    {/* Links */}
                                    <div className="flex gap-4 translate-y-0 md:-translate-y-10 md:group-hover:translate-y-0 transition-transform duration-500">
                                        <a href="https://github.com/adwaith85/project-Ecommerce-" target="_blank" className="w-10 h-10 rounded-xl bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-white hover:bg-cyan-500 hover:text-slate-950 transition-all duration-300 border border-white/10 hover:scale-110 shadow-lg" title="View Code">
                                            <Github size={18} />
                                        </a>
                                        <a href="http://34.224.26.244" target="_blank" className="w-10 h-10 rounded-xl bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-white hover:bg-cyan-500 hover:text-slate-950 transition-all duration-300 border border-white/10 hover:scale-110 shadow-lg" title="Live Demo">
                                            <ExternalLink size={18} />
                                        </a>
                                    </div>

                                    {/* Description */}
                                    <p className="text-center text-xs md:text-sm font-medium text-slate-300 mt-4 translate-y-0 md:translate-y-10 md:group-hover:translate-y-0 transition-transform duration-500 leading-relaxed px-4">
                                        Full-stack shopping application featuring product listing, cart functionality, and secure checkout.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Project 2: Uber-Like */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            viewport={{ once: true }}
                            className="group relative h-64 w-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-slate-900 border border-slate-800"
                        >
                            <div className="absolute inset-0 bg-slate-950/60 md:bg-slate-950/50 md:group-hover:bg-slate-950/80 transition-colors duration-500 z-10" />
                            <img
                                src={uberImg}
                                alt="Uber-Like Cab Booking"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 group-hover:blur-sm transition-all duration-700"
                            />

                            <div className="relative z-20 h-full flex flex-col justify-end p-6">
                                <div className="translate-y-0 group-hover:-translate-y-2 transition-transform duration-500">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-purple-500/20 rounded-md text-purple-400 backdrop-blur-md">
                                            <MapPin size={16} />
                                        </div>
                                        <span className="text-purple-400 text-[10px] font-black uppercase tracking-widest font-sans">Real-Time</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white font-sans leading-tight drop-shadow-md">Uber Clone</h3>
                                </div>

                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-30">
                                    <div className="flex gap-4 translate-y-0 md:-translate-y-10 md:group-hover:translate-y-0 transition-transform duration-500">
                                        <a href="https://github.com/adwaith85/Project-Uber" target="_blank" className="w-10 h-10 rounded-xl bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-white hover:bg-purple-500 hover:text-slate-950 transition-all duration-300 border border-white/10 hover:scale-110 shadow-lg" title="View Code">
                                            <Github size={18} />
                                        </a>
                                        <a href="https://project-uber-2.onrender.com" target="_blank" className="w-10 h-10 rounded-xl bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-white hover:bg-purple-500 hover:text-slate-950 transition-all duration-300 border border-white/10 hover:scale-110 shadow-lg" title="Live Demo">
                                            <ExternalLink size={18} />
                                        </a>
                                    </div>
                                    <p className="text-center text-xs md:text-sm font-medium text-slate-300 mt-4 translate-y-0 md:translate-y-10 md:group-hover:translate-y-0 transition-transform duration-500 leading-relaxed px-4">
                                        Ride booking platform with separate rider and driver dashboards using real-time updates.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Project: Uber Driver */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            viewport={{ once: true }}
                            className="group relative h-64 w-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-slate-900 border border-slate-800"
                        >
                            <div className="absolute inset-0 bg-slate-950/60 md:bg-slate-950/50 md:group-hover:bg-slate-950/80 transition-colors duration-500 z-10" />
                            <img
                                src={uberDriverImg}
                                alt="Uber Driver Web Application"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 group-hover:blur-sm transition-all duration-700"
                            />

                            <div className="relative z-20 h-full flex flex-col justify-end p-6">
                                <div className="translate-y-0 group-hover:-translate-y-2 transition-transform duration-500">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-purple-500/20 rounded-md text-purple-400 backdrop-blur-md">
                                            <MapPin size={16} />
                                        </div>
                                        <span className="text-purple-400 text-[10px] font-black uppercase tracking-widest font-sans">Real-Time</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white font-sans leading-tight drop-shadow-md">Uber Driver</h3>
                                </div>

                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-30">
                                    <div className="flex gap-4 translate-y-0 md:-translate-y-10 md:group-hover:translate-y-0 transition-transform duration-500">
                                        <a href="https://github.com/adwaith85/Project-Uber" target="_blank" className="w-10 h-10 rounded-xl bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-white hover:bg-purple-500 hover:text-slate-950 transition-all duration-300 border border-white/10 hover:scale-110 shadow-lg" title="View Code">
                                            <Github size={18} />
                                        </a>
                                        <a href="https://project-uber-1.onrender.com/" target="_blank" className="w-10 h-10 rounded-xl bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-white hover:bg-purple-500 hover:text-slate-950 transition-all duration-300 border border-white/10 hover:scale-110 shadow-lg" title="Live Demo">
                                            <ExternalLink size={18} />
                                        </a>
                                    </div>
                                    <p className="text-center text-xs md:text-sm font-medium text-slate-300 mt-4 translate-y-0 md:translate-y-10 md:group-hover:translate-y-0 transition-transform duration-500 leading-relaxed px-4">
                                        Ride booking platform specialized for drivers, featuring real-time ride requests and earnings management.
                                    </p>
                                </div>
                            </div>
                        </motion.div>


                        {/* Project 3: Chat App */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            viewport={{ once: true }}
                            className="group relative h-64 w-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-slate-900 border border-slate-800"
                        >
                            <div className="absolute inset-0 bg-slate-950/60 md:bg-slate-950/50 md:group-hover:bg-slate-950/80 transition-colors duration-500 z-10" />
                            <img
                                src={chatImg}
                                alt="Chat Application"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 group-hover:blur-sm transition-all duration-700"
                            />

                            <div className="relative z-20 h-full flex flex-col justify-end p-6">
                                <div className="translate-y-0 group-hover:-translate-y-2 transition-transform duration-500">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-indigo-500/20 rounded-md text-indigo-400 backdrop-blur-md">
                                            <Monitor size={16} />
                                        </div>
                                        <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest font-sans">Real-Time</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white font-sans leading-tight drop-shadow-md">Chat Application</h3>
                                </div>

                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-30">
                                    <div className="flex gap-4 translate-y-0 md:-translate-y-10 md:group-hover:translate-y-0 transition-transform duration-500">
                                        <a href="https://github.com/adwaith85/Chat-App" target="_blank" className="w-10 h-10 rounded-xl bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-white hover:bg-indigo-500 hover:text-slate-950 transition-all duration-300 border border-white/10 hover:scale-110 shadow-lg" title="View Code">
                                            <Github size={18} />
                                        </a>
                                    </div>
                                    <p className="text-center text-xs md:text-sm font-medium text-slate-300 mt-4 translate-y-0 md:translate-y-10 md:group-hover:translate-y-0 transition-transform duration-500 leading-relaxed px-4">
                                        Real-time messaging platform with authentication and random user matching features.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            viewport={{ once: true }}
                            className="group relative h-64 w-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-slate-900 border border-slate-800"
                        >
                            <div className="absolute inset-0 bg-slate-950/60 md:bg-slate-950/50 md:group-hover:bg-slate-950/80 transition-colors duration-500 z-10" />
                            <img
                                src={todoImg}
                                alt="To-Do Application"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 group-hover:blur-sm transition-all duration-700"
                            />

                            <div className="relative z-20 h-full flex flex-col justify-end p-6">
                                <div className="translate-y-0 group-hover:-translate-y-2 transition-transform duration-500">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-pink-500/20 rounded-md text-pink-400 backdrop-blur-md">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <span className="text-pink-400 text-[10px] font-black uppercase tracking-widest font-sans">Productivity</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white font-sans leading-tight drop-shadow-md">Task Manager</h3>
                                </div>

                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-30">
                                    <div className="flex gap-4 translate-y-0 md:-translate-y-10 md:group-hover:translate-y-0 transition-transform duration-500">
                                        <a href="https://github.com/adwaith85/To-Do-App" target="_blank" className="w-10 h-10 rounded-xl bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-white hover:bg-pink-500 hover:text-slate-950 transition-all duration-300 border border-white/10 hover:scale-110 shadow-lg" title="View Code">
                                            <Github size={18} />
                                        </a>
                                        <a href="http://3.80.9.91" target="_blank" className="w-10 h-10 rounded-xl bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-white hover:bg-pink-500 hover:text-slate-950 transition-all duration-300 border border-white/10 hover:scale-110 shadow-lg" title="Live Demo">
                                            <ExternalLink size={18} />
                                        </a>
                                    </div>
                                    <p className="text-center text-xs md:text-sm font-medium text-slate-300 mt-4 translate-y-0 md:translate-y-10 md:group-hover:translate-y-0 transition-transform duration-500 leading-relaxed px-4">
                                        Simple yet powerful task management app with persistent storage and clean UI.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Experience Section */}
                <section id="experience" className="space-y-12">
                    <motion.div {...fadeIn} className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold font-sans">Practical Exposure</h2>
                        <div className="h-px flex-1 bg-slate-800" />
                    </motion.div>
                    <div className="space-y-8">
                        <motion.div {...fadeIn} className="relative pl-8 border-l-2 border-slate-800">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                            <div className="flex flex-col md:flex-row md:justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold">Web Developer Intern</h3>
                                    <p className="text-cyan-400 font-medium">GTEC, Kannur</p>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-sm mt-2 md:mt-0">
                                    <Calendar size={14} />
                                    <span>Jan 2026 - Feb 2026</span>
                                </div>
                            </div>
                            <ul className="space-y-2 text-slate-400">
                                <li className="flex gap-2">
                                    <CheckCircle2 size={16} className="text-cyan-500 shrink-0 mt-1" />
                                    <span>Developed responsive web pages using modern HTML, CSS, and JavaScript.</span>
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 size={16} className="text-cyan-500 shrink-0 mt-1" />
                                    <span>Integrated frontend applications with backend REST APIs seamlessly.</span>
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 size={16} className="text-cyan-500 shrink-0 mt-1" />
                                    <span>Optimized application performance and improved overall user experience.</span>
                                </li>
                            </ul>
                        </motion.div>
                    </div>
                </section>

                {/* Contact Section */}
                <section id="contact" className="relative group px-4 md:px-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-[2.5rem] md:rounded-[4rem] blur-[100px] md:blur-[150px] opacity-30 -z-10" />

                    <motion.div
                        {...fadeIn}
                        className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[4rem] border border-white/5 p-8 md:p-12 lg:p-24 overflow-hidden relative"
                    >
                        {/* Decorative background element */}
                        <div className="absolute -top-24 -right-24 w-64 md:w-96 h-64 md:h-96 bg-cyan-500/10 rounded-full blur-[100px]" />

                        <div className="relative z-10 flex flex-col lg:flex-row gap-12 md:gap-20">
                            <div className="flex-1 space-y-8 md:space-y-12">
                                <div className="space-y-4 md:space-y-6">
                                    <h2 className="text-4xl md:text-6xl lg:text-5xl font-black tracking-tight font-sans leading-[0.9]">
                                        START <br />A <span className="text-cyan-400 italic font-sans">PROJECT.</span>
                                    </h2>
                                    <p className="text-slate-400 text-sm md:text-lg max-w-sm md:max-w-md font-light">
                                        I'm currently accepting new projects. Let's create something that sets your brand apart.
                                    </p>
                                </div>

                                <div className="space-y-6 md:space-y-8">
                                    {[
                                        { icon: <Mail size={20} />, val: 'adwaithadhu85227@gmail.com', label: 'Email Me' },
                                        { icon: <Phone size={20} />, val: '+91 75588 83100', label: 'Call Me' },
                                        { icon: <MapPin size={20} />, val: 'Kannur, Kerala, India', label: 'Location' }
                                    ].map((item, id) => (
                                        <div key={id} className="flex items-center gap-4 md:gap-6 group/item w-full sm:w-fit">
                                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-950 flex items-center justify-center border border-white/5 group-hover/item:border-cyan-500/50 transition-colors duration-500 shrink-0 shadow-xl">
                                                {item.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</div>
                                                <div className="text-sm md:text-lg font-medium text-slate-200 group-hover/item:text-cyan-400 transition-colors duration-500 truncate mt-0.5">{item.val}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <form
                                onSubmit={handleFormSubmit}
                                className="flex-1 space-y-4 md:space-y-6 lg:bg-slate-950/30 p-6 md:p-8 lg:p-12 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 backdrop-blur-md relative"
                            >
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl p-4 md:p-5 focus:outline-none focus:border-cyan-500/50 transition-all font-medium placeholder:text-slate-700 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-2">Email</label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl p-4 md:p-5 focus:outline-none focus:border-cyan-500/50 transition-all font-medium placeholder:text-slate-700 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-2">Your Vision</label>
                                        <textarea
                                            required
                                            placeholder="Tell me about your project..."
                                            rows={4}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl p-4 md:p-5 focus:outline-none focus:border-cyan-500/50 transition-all font-medium placeholder:text-slate-700 resize-none text-sm"
                                        />
                                    </div>
                                </div>
                                <button
                                    disabled={formStatus === 'sending'}
                                    className={`w-full py-4 md:py-6 rounded-2xl transition-all duration-500 hover:scale-[1.02] shadow-lg md:text-sm group flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-xs
                                        ${formStatus === 'sent' ? 'bg-green-500 text-white' :
                                            formStatus === 'error' ? 'bg-red-500 text-white' :
                                                'bg-cyan-500 hover:bg-white text-slate-950'}`}
                                >
                                    {formStatus === 'idle' && <>Send Message <Zap size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform " /></>}
                                    {formStatus === 'sending' && "Processing..."}
                                    {formStatus === 'sent' && "Message Received!"}
                                    {formStatus === 'error' && "Oops! Try Again"}
                                </button>

                                {formStatus === 'sent' && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center text-green-400 text-[10px] font-bold tracking-widest uppercase mt-4"
                                    >
                                        I'll get back to you shortly!
                                    </motion.p>
                                )}
                            </form>
                        </div>
                    </motion.div>
                </section>
            </main>

            {/* Footer */}
            <footer className="relative pt-20 md:pt-32 pb-10 md:pb-16 overflow-hidden">
                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12 pb-16 border-b border-white/5">
                        <div className="space-y-6 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-white text-slate-950 rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl font-sans shadow-2xl shadow-white/10 shrink-0">A</div>
                                <h4 className="text-2xl md:text-3xl font-black font-sans tracking-tighter">ADWAITH A KUMAR</h4>
                            </div>
                            <p className="text-slate-500 max-w-xs text-xs md:text-sm font-light leading-relaxed">
                                Designing and developing high-end digital solutions with a focus on premium aesthetics and performance.
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
                            {[
                                {
                                    name: 'GitHub',
                                    icon: <Github size={20} />,
                                    link: 'https://github.com/adwaith85',
                                    color: 'hover:bg-[#2b3137]'
                                },
                                {
                                    name: 'LinkedIn',
                                    icon: <Linkedin size={20} />,
                                    link: 'https://linkedin.com/in/adwaith-a-kumar',
                                    color: 'hover:bg-[#0077b5]'
                                },
                                {
                                    name: 'Twitter',
                                    icon: <Twitter size={20} />,
                                    link: 'https://x.com/Adwaith710',
                                    color: 'hover:bg-[#1DA1F2]'
                                },
                                {
                                    name: 'Facebook',
                                    icon: <Facebook size={20} />,
                                    link: 'https://www.facebook.com/share/17zqpHjQSh/',
                                    color: 'hover:bg-[#1877F2]'
                                },
                                {
                                    name: 'Email',
                                    icon: <Mail size={20} />,
                                    link: 'mailto:adwaithadhu85227@gmail.com',
                                    color: 'hover:bg-[#EA4335]'
                                }
                            ].map((social, index) => (
                                <a
                                    key={index}
                                    href={social.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-slate-400 hover:text-white transition-all duration-500 group"
                                >
                                    <div className={`p-2.5 md:p-3 bg-slate-900 border border-white/5 rounded-2xl ${social.color} group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-lg`}>
                                        {social.icon}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{social.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 text-center md:text-left">
                        <p>© 2026 Adwaith A Kumar. All Rights Reserved.</p>
                        <div className="flex gap-6 md:gap-8">
                            <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-cyan-400 transition-colors">Terms</a>
                        </div>
                    </div>
                </div>

                {/* Decorative background for footer */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-screen h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            </footer>


        </div >
    );
};

export default App;
