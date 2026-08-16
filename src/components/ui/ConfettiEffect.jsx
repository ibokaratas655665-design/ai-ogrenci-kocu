import React, { useEffect, useState } from 'react';

const ConfettiEffect = ({ duration = 3000 }) => {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        // Confetti parçacıkları oluştur
        const newParticles = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            animationDelay: Math.random() * 0.5,
            color: getRandomColor(),
            size: Math.random() * 10 + 5,
        }));

        setParticles(newParticles);

        // Belirtilen süre sonra confetti'yi temizle
        const timer = setTimeout(() => {
            setParticles([]);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const getRandomColor = () => {
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    if (particles.length === 0) return null;

    return (
        <div className="confetti-container">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="confetti-particle"
                    style={{
                        left: `${particle.left}%`,
                        animationDelay: `${particle.animationDelay}s`,
                        backgroundColor: particle.color,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                    }}
                />
            ))}
        </div>
    );
};

export default ConfettiEffect;
