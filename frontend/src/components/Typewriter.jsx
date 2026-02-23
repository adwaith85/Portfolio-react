
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Typewriter = ({ texts, speed = 40, waitTime = 1000, deleteSpeed = 50, className = '', wrapperClassName = '' }) => {
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let timer;
        const handleType = () => {
            const currentFullText = texts[currentTextIndex];

            if (isDeleting) {
                setDisplayedText((prev) => prev.substring(0, prev.length - 1));
            } else {
                setDisplayedText((prev) => currentFullText.substring(0, prev.length + 1));
            }

            if (!isDeleting && displayedText === currentFullText) {
                timer = setTimeout(() => setIsDeleting(true), waitTime);
            } else if (isDeleting && displayedText === '') {
                setIsDeleting(false);
                setCurrentTextIndex((prev) => (prev + 1) % texts.length);
            } else {
                timer = setTimeout(handleType, isDeleting ? deleteSpeed : speed);
            }
        };

        timer = setTimeout(handleType, isDeleting ? deleteSpeed : speed);

        return () => clearTimeout(timer);
    }, [displayedText, isDeleting, currentTextIndex, texts, speed, waitTime, deleteSpeed]);

    return (
        <div className={`inline-flex items-center justify-center ${wrapperClassName}`}>
            <span className={className}>{displayedText}</span>
            <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                className="w-[2px] h-[1em] bg-cyan-400 ml-1"
            />
        </div>
    );
};

export default Typewriter;
