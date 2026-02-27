import React from 'react';

const codeSnippets = [
    "const app = () => {}",
    "useEffect(() => {})",
    "API.fetch('/projects')",
    "<Component />",
    "Node.js • Express",
    "MongoDB",
    "PostgreSQL",
    "TailwindCSS",
    "MERN Stack",
    "HTML5 • CSS3",
    "JavaScript ES6+",
    "React Hooks",
    "Next.js",
    "TypeScript",
    "Docker Container",
    "AWS Cloud",
    "Postman API",
    "Python • Django",
    "npm install",
    "git push origin",
    "framer-motion",
    "Map<string, any>",
    "flex items-center",
    "grid grid-cols-3",
    "async await",
    "try { ... } catch",
    "npm run dev",
    "git commit -m 'feat'",
    "export default",
    "import { motion }",
    "Vite.js",
    "Redux Toolkit",
    "Context API",
    "Supabase",
    "Firebase",
    "GraphQL Query",
    "REST API",
    "JWT Auth",
    "OAuth 2.0",
    "CI/CD Pipeline",
    "Microservices",
    "Serverless Func",
    "Redis Cache",
    "Nginx Server",
    "Docker Compose",
    "Kubernetes",
    "SASS • SCSS",
    "Styled Components",
    "Responsive Design",
    "UI/UX Research",
    "Figma Design",
    "Jest • Unit Test",
    "Cypress E2E",
    "Babel Compiler",
    "Webpack",
    "SEO Optimized",
    "Accessibility A11y",
    "PWA • Service Worker",
    "SPA vs SSR",
    "CSR • Hybrid",
    "JSON.stringify()",
    "localStorage",
    "useContext(Theme)",
    "useRef(null)",
    "<div className='mt-4'>",
    "<span>Status</span>",
    "interface User { }",
    "type Props = { }",
    "enum Colors { }",
    "Debugging...",
    "Refactoring...",
    "Agile Workflow",
    "Scrum Master",
    "Pull Request",
    "Merge Conflict",
    "Go lang",
    "Rust Cargo",
    "C++ Pointer",
    "Java Spring",
    "Swift UI",
    "Kotlin Mobile",
    "PHP Laravel",
    "Ruby on Rails",
    "SQLite",
    "MariaDB",
    "Cassandra DB",
    "DynamoDB",
    "Oracle SQL",
    "Azure Cloud",
    "GCP Computing",
    "Vercel Deploy",
    "Netlify Edge",
    "Heroku App",
    "Material UI",
    "Shadcn UI",
    "Lucide Icons",
    "GSAP Animation",
    "Three.js 3D",
    "socket.io",
    "Binary Search",
    "Big O Notation",
    "Event Loop",
    "Web Sockets",
];

export default function AnimatedBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">

            {/* Floating code fragments */}
            {codeSnippets.map((text, i) => (
                <span
                    key={i}
                    className="absolute text-sm font-mono whitespace-nowrap animate-float"
                    style={{
                        left: `${(i * 7) % 95}%`,
                        animationDuration: `${18 + Math.random() * 15}s`,
                        animationDelay: `${Math.random() * 10}s`,
                        color: i % 2 === 0 ? 'rgba(34, 211, 238, 0.15)' : 'rgba(168, 85, 247, 0.15)', // Cyan vs Purple
                        fontSize: `${0.7 + Math.random() * 0.5}rem`,
                    }}
                >
                    {text}
                </span>
            ))}

            {/* Dynamic Glow Blobs that follow the float animation */}
            <div
                className="absolute w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full top-1/2 left-1/4 animate-floatSlow"
                style={{ animationDelay: '-5s' }}
            />
            <div
                className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full top-1/2 right-1/4 animate-float"
                style={{ animationDelay: '-15s' }}
            />

        </div>
    );
}
