export const content = {
  brand: "ADWAITH",
  email: "adwaithadhu85227@gmail.com",
  social: {
    github: "https://github.com/adwaith85",
    linkedin: "https://linkedin.com/in/adwaith-a-kumar",
  },

  nav: [
    { id: "what-i-do", label: "What I do" },
    { id: "projects", label: "Projects" },
    { id: "about", label: "About" },
    { id: "education", label: "Education" },
    { id: "experience", label: "Experience" },
    { id: "contact", label: "Contact" },
  ],

  hero: {
    role: ["WEB DEVELOPER / MERN STACK", "REACT · NODE · MONGODB"],
    availability: "OPEN TO JUNIOR MERN ROLES",
    name: "ADWAITH A KUMAR",
    titleLines: ["I BUILD", "WEB APPS."],
    tagline:
      "Entry-level web developer who turns ideas into responsive, full-stack apps, from the first div to the live deploy.",
    stats: [
      { value: "5", label: "Projects built" },
      { value: "4", label: "Live demos" },
      { value: "6", label: "Months MERN training" },
      { value: "8", label: "Months internship" },
    ],
  },

  sections: [
    { id: "what-i-do", num: "02", label: "WHAT I DO", headline: ["FROM IDEA.", "TO LIVE."], note: "Build comes in Step 4" },
    { id: "projects", num: "03", label: "SELECTED WORK", headline: ["THE WORK.", "THE PROOF."], note: "Build comes in Step 5" },
    { id: "about", num: "04", label: "ABOUT ME", headline: ["THE PERSON.", "BEHIND THE CODE."], note: "Build comes in Step 6" },
    { id: "education", num: "05", label: "EDUCATION", headline: ["THE ROUTE.", "SO FAR."], note: "Build comes in Step 7" },
    { id: "experience", num: "06", label: "EXPERIENCE", headline: ["KEEP BUILDING.", "KEEP GROWING."], note: "Build comes in Step 8" },
    { id: "contact", num: "07", label: "YOUR NEXT STORY", headline: ["LET'S WORK", "TOGETHER."], note: "Build comes in Step 9" },
  ],

  about: {
    bio: "Placeholder: write 2 to 3 lines about yourself here.",
    location: "Kannur, India",
    languages: ["English", "Malayalam", "Hindi"],
    interests: ["Add", "your", "interests"],
    photo: "",
  },

  /*
    image: a filename inside public/projects/ (for example "ecommerce.png"),
    or a full URL. Leave "" to show the placeholder.
  */
  projects: [
    {
      title: "E-Commerce Web Application",
      desc: "Full MERN shopping platform with product listing, cart and checkout flow.",
      tech: ["React", "Node.js", "Express.js", "MongoDB", "AWS"],
      demo: "https://shop-cart.adwaid.online",
      github: "https://github.com/adwaith85/project-Ecommerce-",
      image: "",
      featured: true,
    },
    {
      title: "To-Do Application",
      desc: "Task manager with create, update and delete, backed by a REST API.",
      tech: ["React", "Node.js", "Express.js", "MongoDB", "AWS"],
      demo: "https://todo.adwaid.online",
      github: "https://github.com/adwaith85/To-Do-App",
      image: "",
    },
    {
      title: "Uber-Like Cab Booking",
      desc: "Real-time ride booking with separate rider and driver apps using sockets.",
      tech: ["React", "Node.js", "Socket.IO", "Express.js", "MongoDB", "AWS"],
      demo: "https://oober.adwaid.online",
      demo2: "https://oober-driver.adwaid.online",
      github: "https://github.com/adwaith85/Project-Uber",
      image: "",
    },
    {
      title: "Genmise: Online Store (Group Project)",
      desc: "Team-built online store platform with a typed React frontend.",
      tech: ["React", "TypeScript", "Node.js", "MongoDB", "AWS"],
      demo: "https://genmise.adwaid.online",
      github: "https://github.com/4bjith/GroupProject-OnlineStore",
      image: "",
    },
    {
      title: "Talkies: Chat Application",
      desc: "Mobile chat app built with React Native and a MySQL-backed API.",
      tech: ["React Native", "Node.js", "Express.js", "MySQL"],
      demo: "",
      github: "https://github.com/adwaith85/Chat-App",
      image: "",
    },
  ],

  skills: {
    Languages: ["HTML5", "CSS", "JavaScript (ES6+)", "TypeScript", "SQL"],
    Frontend: ["React.js", "React Native", "Next.js", "Bootstrap", "Tailwind CSS", "Flutter"],
    Backend: ["Node.js", "Express.js", "REST APIs", "Authentication", "Socket.IO"],
    Databases: ["MongoDB", "MySQL"],
    Tools: ["Git", "GitHub", "VS Code", "Postman", "AWS", "Docker", "Android Studio"],
  },

  education: [
    { title: "MERN Stack Certification (6 Months)", place: "GTEC Institute, Kannur", period: "Jul 2025 – Dec 2025", certificate: "" },
    { title: "Bachelor of Computer Applications (BCA)", place: "Srinivas University", period: "2022 – 2025", certificate: "" },
  ],

  experience: [
    {
      role: "Web Developer Intern",
      place: "GTEC, Kannur",
      period: "Jul 2025 – Feb 2026",
      points: [
        "Contributed to backend API development and database management for web applications.",
        "Built responsive frontend interfaces with React.js, HTML, CSS and JavaScript.",
        "Integrated frontend components with backend REST APIs.",
        "Helped debug and improve application functionality and usability.",
        "Used Git and GitHub for source control and collaboration.",
      ],
      certificate: "",
    },
  ],
};