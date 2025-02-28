'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import ThemeToggle from './ThemeToggle';
import { motion } from 'framer-motion';
import { Download, Info, ExternalLink, CheckCircle, ChevronDown } from 'lucide-react';

const MeshRiderLanding: React.FC = () => {
    const { isDarkMode } = useTheme();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);

        // IntersectionObserver for fade-in effects
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        document.querySelectorAll('.fade-in').forEach(element => {
            observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            }
        },
        exit: { opacity: 0 }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    if (!isLoaded) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen transition-colors duration-300">
            <div className="mesh-bg"></div>

            {/* <nav className="nav theme-card border-b border-gray-700">
                <div className="nav-container">
                    <div className="flex items-center">
                        <img src="/logo.png" alt="Mesh Rider Logo" className="logo-image h-10 mr-4" />
                        <h1 className="glowing-text">Mesh Rider App</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="nav-links hidden md:flex">
                            <div className="nav-group">
                                <a href="#" className="download-btn bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 px-4 py-2 rounded-lg flex items-center">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </a>
                                <div className="download-links theme-card border border-gray-700 rounded-xl">
                                    <a href="https://doodlelabs.sharepoint.com/:w:/s/TechnicalSupport/EW4MwXjCCv1Mg7FprvddbWkB8JuYaK_8cEUaKnBf9Kh7jw?e=0GFfZo" className="theme-hover rounded-t-xl">User Guide</a>
                                    <a href="https://doodlelabs.sharepoint.com/:u:/s/TechnicalSupport/ESVwVY4yHE9Jve0bJn7pmW0BQIfE7lcowMFMvUkvri98hw?e=nEtWlc" className="theme-hover">Android</a>
                                    <a href="https://apps.microsoft.com/detail/9PJBJM5DX77T?hl=en&gl=SG&ocid=pdpshare" className="theme-hover">Windows</a>
                                    <a href="https://doodlelabs.sharepoint.com/:u:/s/TechnicalSupport/EXpoxn71OjRNu2oVGMrJsooBCXNTaUS1Fr-c-geZI-HD0w?e=OfHeVc" className="theme-hover rounded-b-xl">Linux</a>
                                </div>
                            </div>
                            <a href="https://doodlelabs.com/technical-support/" className="theme-hover p-2 rounded-lg">FAQ</a>
                            <a href="https://contact.doodlelabs.com/" className="theme-hover p-2 rounded-lg">Contact</a>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </nav> */}

            <motion.section
                className="hero min-h-screen flex flex-col justify-center items-center pt-20 pb-16 px-4"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.h1 variants={itemVariants} className="glowing-text text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                    Mesh Rider Application
                </motion.h1>

                <motion.p variants={itemVariants} className="text-gray-400 text-center max-w-2xl mb-12">
                    Advanced mobile management & control for Mesh Rider Radios.<br />
                    Perfect for UAVs, Robots, and Industrial IoT applications.
                </motion.p>

                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mb-12">
                    <div className="fade-in">
                        <img src="/png1.png" alt="Dashboard View" className="app-screen w-full rounded-2xl shadow-2xl transform transition-all duration-500 hover:scale-105 hover:shadow-blue-600/20" />
                    </div>
                    <div className="fade-in" style={{ transitionDelay: '0.1s' }}>
                        <img src="/pn2.png" alt="Control Panel" className="app-screen w-full rounded-2xl shadow-2xl transform transition-all duration-500 hover:scale-105 hover:shadow-blue-600/20" />
                    </div>
                    <div className="fade-in" style={{ transitionDelay: '0.2s' }}>
                        <img src="/png1.png" alt="Settings View" className="app-screen w-full rounded-2xl shadow-2xl transform transition-all duration-500 hover:scale-105 hover:shadow-blue-600/20" />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="download-buttons flex flex-col md:flex-row justify-center gap-4 mt-6">
                    <a
                        href="https://doodlelabs.sharepoint.com/:u:/s/TechnicalSupport/EXpoxn71OjRNu2oVGMrJsooBCXNTaUS1Fr-c-geZI-HD0w?e=D7mZmQ"
                        target="_blank"
                        rel="noopener"
                        className="transform transition-all duration-300 hover:scale-105"
                    >
                        <img src="/icon_linux.png" alt="Download for Linux/Ubuntu" className="store-button h-12" />
                    </a>
                    <a
                        href="https://apps.microsoft.com/detail/9PJBJM5DX77T?hl=en&gl=SG&ocid=pdpshare"
                        target="_blank"
                        rel="noopener"
                        className="transform transition-all duration-300 hover:scale-105"
                    >
                        <img src="/app-store.png" alt="Download for Windows" className="store-button h-12" />
                    </a>
                    <a
                        href="https://doodlelabs.sharepoint.com/:u:/s/TechnicalSupport/ESVwVY4yHE9Jve0bJn7pmW0BQIfE7lcowMFMvUkvri98hw?e=nEtWlc"
                        target="_blank"
                        rel="noopener"
                        className="transform transition-all duration-300 hover:scale-105"
                    >
                        <img src="/play-store.png" alt="Download for Android" className="store-button h-12" />
                    </a>
                </motion.div>
            </motion.section>

            <div className="info-cards max-w-6xl mx-auto px-4 py-16">
                <div className="demo-card fade-in theme-card border border-gray-700 rounded-xl p-6 max-w-2xl mx-auto mb-12">
                    <div className="card-header flex items-center border-b border-gray-700 pb-4 mb-6">
                        <Info className="w-6 h-6 mr-2 text-amber-400" />
                        <h3 className="text-xl font-semibold">Try Demo Version</h3>
                    </div>
                    <p className="text-gray-300 mb-4">Want to explore Mesh Rider App without physical hardware? Use these demo credentials:</p>
                    <div className="demo-credentials bg-gray-800/50 rounded-xl p-4 my-4 border border-gray-700">
                        <p className="mb-2"><strong>IP:</strong> 192.168.153.1</p>
                        <p className="mb-2"><strong>Username:</strong> demo</p>
                        <p><strong>Password:</strong> demo123</p>
                    </div>
                    <p className="text-gray-400 text-sm">This demo account provides access to simulated device features for testing purposes.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="info-card fade-in theme-card border border-gray-700 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/20 hover:shadow-lg">
                        <div className="card-header border-b border-gray-700 p-4">
                            <h3 className="font-medium flex items-center">
                                <span className="mr-2 text-lg">⊞</span>
                                Windows Installation
                            </h3>
                        </div>
                        <div className="p-4">
                            <ol className="install-steps space-y-2 mb-6 pl-4">
                                <li className="text-gray-300">Open Microsoft Store on Windows PC</li>
                                <li className="text-gray-300">Search for "Mesh Rider" or use our link</li>
                                <li className="text-gray-300">Click "Get" or "Install" button</li>
                                <li className="text-gray-300">Launch and enter demo credentials</li>
                            </ol>
                            <a
                                href="https://apps.microsoft.com/detail/9PJBJM5DX77T?hl=en&gl=SG&ocid=pdpshare"
                                target="_blank"
                                rel="noopener"
                                className="flex justify-center"
                            >
                                <img src="/app-store.png" alt="Download for Windows" className="store-button h-10 transition-transform duration-300 hover:scale-110" />
                            </a>
                        </div>
                    </div>

                    <div className="info-card fade-in theme-card border border-gray-700 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/20 hover:shadow-lg" style={{ transitionDelay: '0.1s' }}>
                        <div className="card-header border-b border-gray-700 p-4">
                            <h3 className="font-medium flex items-center">
                                <span className="mr-2 text-lg">🤖</span>
                                Android Installation
                            </h3>
                        </div>
                        <div className="p-4">
                            <ol className="install-steps space-y-2 mb-6 pl-4">
                                <li className="text-gray-300">Download the Android APK file</li>
                                <li className="text-gray-300">Open the downloaded APK</li>
                                <li className="text-gray-300">Follow installation prompts</li>
                                <li className="text-gray-300">Launch and enter demo credentials</li>
                            </ol>
                            <a
                                href="https://doodlelabs.sharepoint.com/:u:/s/TechnicalSupport/ESVwVY4yHE9Jve0bJn7pmW0BQIfE7lcowMFMvUkvri98hw?e=nEtWlc"
                                target="_blank"
                                rel="noopener"
                                className="flex justify-center"
                            >
                                <img src="/play-store.png" alt="Download for Android" className="store-button h-10 transition-transform duration-300 hover:scale-110" />
                            </a>
                        </div>
                    </div>

                    <div className="info-card fade-in theme-card border border-gray-700 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/20 hover:shadow-lg" style={{ transitionDelay: '0.2s' }}>
                        <div className="card-header border-b border-gray-700 p-4">
                            <h3 className="font-medium flex items-center">
                                <span className="mr-2 text-lg">🐧</span>
                                Linux Installation
                            </h3>
                        </div>
                        <div className="p-4">
                            <ol className="install-steps space-y-2 mb-6 pl-4">
                                <li className="text-gray-300">Download the Linux package</li>
                                <li className="text-gray-300">Extract the downloaded file</li>
                                <li className="text-gray-300">Run: <code className="px-1 py-0.5 rounded bg-gray-800">sudo ./install.sh</code></li>
                                <li className="text-gray-300">Launch from Applications Menu</li>
                            </ol>
                            <a
                                href="https://doodlelabs.sharepoint.com/:u:/s/TechnicalSupport/EXpoxn71OjRNu2oVGMrJsooBCXNTaUS1Fr-c-geZI-HD0w?e=D7mZmQ"
                                target="_blank"
                                rel="noopener"
                                className="flex justify-center"
                            >
                                <img src="/icon_linux.png" alt="Download for Linux/Ubuntu" className="store-button h-10 transition-transform duration-300 hover:scale-110" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <section className="features py-16 bg-gray-900/50">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-10 text-center">Key Features</h2>

                    <div className="features-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="feature-card fade-in theme-card border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/20 hover:shadow-lg">
                            <div className="feature-icon text-4xl mb-4">📱</div>
                            <h3 className="text-lg font-medium mb-2">Cross-Platform Support</h3>
                            <p className="text-gray-400">Seamless management across Android, Windows, and Linux operating systems.</p>
                        </div>

                        <div className="feature-card fade-in theme-card border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/20 hover:shadow-lg" style={{ transitionDelay: '0.1s' }}>
                            <div className="feature-icon text-4xl mb-4">⚡</div>
                            <h3 className="text-lg font-medium mb-2">Link Optimization</h3>
                            <p className="text-gray-400">Advanced wireless settings with TPC and distance optimization.</p>
                        </div>

                        <div className="feature-card fade-in theme-card border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/20 hover:shadow-lg" style={{ transitionDelay: '0.2s' }}>
                            <div className="feature-icon text-4xl mb-4">📊</div>
                            <h3 className="text-lg font-medium mb-2">Real-Time Monitoring</h3>
                            <p className="text-gray-400">Live dashboard showing SSID, mode, and signal quality.</p>
                        </div>

                        <div className="feature-card fade-in theme-card border border-gray-700 rounded-xl p-6 transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/20 hover:shadow-lg" style={{ transitionDelay: '0.3s' }}>
                            <div className="feature-icon text-4xl mb-4">📍</div>
                            <h3 className="text-lg font-medium mb-2">GPS Integration</h3>
                            <p className="text-gray-400">Built-in GPS support with uBlox Neo-M9N technology.</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="devices-showcase max-w-6xl mx-auto py-16 px-4">
                <h2 className="text-2xl font-bold mb-10 text-center">Application Screenshots</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="device fade-in">
                        <img
                            src="/desktop.png"
                            alt="Desktop View"
                            className="w-full rounded-xl shadow-xl transition-transform duration-300 hover:scale-105"
                        />
                    </div>
                    <div className="device fade-in" style={{ transitionDelay: '0.1s' }}>
                        <img
                            src="/desktop2.png"
                            alt="Mobile View"
                            className="w-full rounded-xl shadow-xl transition-transform duration-300 hover:scale-105"
                        />
                    </div>
                    <div className="device fade-in" style={{ transitionDelay: '0.2s' }}>
                        <img
                            src="/desktop3.png"
                            alt="Tablet View"
                            className="w-full rounded-xl shadow-xl transition-transform duration-300 hover:scale-105"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gray-900/30 py-8 mt-8 border-t border-gray-700">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-wrap gap-4 justify-center mb-6">
                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            <span className="text-gray-300">Real-time Monitoring</span>
                        </div>
                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            <span className="text-gray-300">Intuitive Interface</span>
                        </div>
                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            <span className="text-gray-300">Cross-platform</span>
                        </div>
                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            <span className="text-gray-300">Secure Connections</span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <a
                            href="https://doodlelabs.sharepoint.com/:w:/s/TechnicalSupport/EW4MwXjCCv1Mg7FprvddbWkB8JuYaK_8cEUaKnBf9Kh7jw?e=0GFfZo"
                            target="_blank"
                            rel="noopener"
                            className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-6 py-3 rounded-lg shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all"
                        >
                            <ExternalLink className="w-5 h-5 mr-2" />
                            View Documentation
                        </a>
                    </div>
                </div>
            </div>

            <footer className="border-t border-gray-700 py-8 text-center">
                <p className="text-gray-400">Copyright © 2024 Doodle Labs LLC</p>
                <p className="text-gray-500 text-sm mt-2">The app is designed for professional use with Mesh Rider Radio hardware.</p>
            </footer>
        </div>
    );
};

export default MeshRiderLanding;