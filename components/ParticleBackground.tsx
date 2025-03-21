import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

const ParticleBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { isDarkMode } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight * 1.5; // Make canvas taller to accommodate scrolling
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const particles: Array<{
            x: number;
            y: number;
            radius: number;
            speedX: number;
            speedY: number;
            opacity: number;
        }> = [];

        const createParticles = () => {
            const particleCount = 50;
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 2 + 0.5,
                    speedX: (Math.random() - 0.5) * 0.3,
                    speedY: (Math.random() - 0.5) * 0.3,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        };

        createParticles();

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const particleColor = isDarkMode ? 'rgba(96, 165, 250,' : 'rgba(59, 130, 246,';

            particles.forEach((particle) => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = `${particleColor} ${particle.opacity})`;
                ctx.fill();
            });

            particles.forEach((particle1, i) => {
                for (let j = i + 1; j < particles.length; j++) {
                    const particle2 = particles[j];
                    const dx = particle1.x - particle2.x;
                    const dy = particle1.y - particle2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `${particleColor} ${0.2 * (1 - distance / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particle1.x, particle1.y);
                        ctx.lineTo(particle2.x, particle2.y);
                        ctx.stroke();
                    }
                }
            });

            requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [isDarkMode]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{
                zIndex: 0,
                backgroundColor: 'transparent'
            }}
        />
    );
};

export default ParticleBackground;