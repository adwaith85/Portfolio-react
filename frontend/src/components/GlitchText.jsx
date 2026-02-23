
import React from 'react';
import './GlitchText.css';

const GlitchText = ({
    children,
    speed = 1,
    enableShadows = true,
    enableOnHover = false,
    className = '',
}) => {
    const inlineStyles = {
        '--after-duration': `${speed}s`,
        '--before-duration': `${speed * 1.5}s`,
        '--after-shadow': enableShadows ? '-2px 0 red' : 'none',
        '--before-shadow': enableShadows ? '2px 0 cyan' : 'none',
        whiteSpace: 'normal',
        display: 'block',
    };

    return (
        <div
            className={`glitch ${enableOnHover ? 'enable-on-hover' : ''} ${className}`}
            data-text={children}
            style={inlineStyles}
        >
            {children}
        </div>
    );
};

export default GlitchText;
