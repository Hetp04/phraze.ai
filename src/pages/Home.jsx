import { useEffect } from 'react';
import Hero from '../components/Hero';
import ChatDemo from '../components/ChatDemo';
import Platforms from '../components/Platforms';
import Demonstration from '../components/Demonstration';

export default function Home() {
  useEffect(() => {
    // Intersection Observer for demo sections
    const demoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
        } else {
          entry.target.classList.remove('fade-in');
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '-10% 0px'
    });

    // Observe all demo sections
    document.querySelectorAll('.demo-section').forEach(section => {
      demoObserver.observe(section);
    });

    return () => {
      document.querySelectorAll('.demo-section').forEach(section => {
        demoObserver.unobserve(section);
      });
    };
  }, []);

  return (
    <main style={{ 
      background: 'radial-gradient(900px 600px at 15% 3%, rgba(148, 163, 184, 0.14) 0%, rgba(148, 163, 184, 0.07) 25%, rgba(255, 255, 255, 0) 60%), radial-gradient(1100px 700px at 85% 10%, rgba(148, 163, 184, 0.14) 0%, rgba(148, 163, 184, 0.08) 30%, rgba(255, 255, 255, 0) 65%), radial-gradient(900px 600px at 50% 95%, rgba(148, 163, 184, 0.12) 0%, rgba(255, 255, 255, 0) 55%), linear-gradient(180deg, #f8f9fd 0%, #ffffff 70%, #f8f9fd 100%)'
    }}>
      <Hero />
      <ChatDemo />
      <Platforms />
      <Demonstration />
    </main>
  );
} 