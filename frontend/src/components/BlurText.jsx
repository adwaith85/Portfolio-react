
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const BlurText = ({
    text = '',
    delay = 0,
    className = '',
    animateBy = 'words', // 'words' or 'letters'
    direction = 'top', // 'top' or 'bottom'
    onAnimationComplete,
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    const words = text.split(' ');

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: delay / 1000
            }
        }
    };

    const itemVariants = {
        hidden: {
            filter: 'blur(10px)',
            opacity: 0,
            y: direction === 'top' ? -50 : 50,
        },
        visible: {
            filter: 'blur(0px)',
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: "easeOut"
            }
        }
    };

    return (
        <motion.div
            ref={ref}
            className={`flex flex-wrap justify-center gap-[0.2em] ${className}`}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={containerVariants}
            onAnimationComplete={onAnimationComplete}
        >
            {words.map((word, index) => (
                <motion.span
                    key={index}
                    variants={itemVariants}
                    className="inline-block"
                >
                    {word}
                </motion.span>
            ))}
        </motion.div>
    );
};

export default BlurText;
