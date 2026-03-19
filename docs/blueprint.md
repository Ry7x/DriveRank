# **App Name**: DriveRank Kosovo

## Core Features:

- User Account Management: Secure user authentication using Firebase Authentication, allowing sign-in with Google, Apple, or email. Users can create and manage their profiles, including username, city, car brand, car model, horsepower, modifications, and a profile photo.
- GPS Live Tracking Dashboard: Real-time display of critical driving metrics via phone GPS, including current speed (km/h), peak speed, acceleration graph, and distance covered, presented in a large, digital speedometer format.
- Automated Performance Run Recording: Automatically detect and record key performance metrics for car enthusiasts, including 0-60 km/h, 0-100 km/h, 100-200 km/h acceleration times, quarter mile time, and top speed during a run.
- Performance Run History & Route Mapping: Store each recorded run's details (userId, carModel, city, runType, time, topSpeed, gpsRoute, date) securely in a Firestore database. Users can review their past performance runs and visualize the GPS route on a map.
- Dynamic Performance Leaderboards: Generate multiple leaderboards for Kosovo's fastest cars, fastest by city, by car model, 0-100 km/h, 100-200 km/h, and highest top speed. Leaderboard UI features smooth animated ranking cards displaying driver name, car, time, speed, and location.
- Interactive Run Route Mapping: Visualize recorded run routes using Google Maps API, featuring speed heatmaps, and clear start and finish markers for detailed analysis.
- Comprehensive Car Profile System: Allows users to add and manage detailed car specifications (brand, model, horsepower, drivetrain, modifications). Each car gains a public profile page showcasing its best 0-100 km/h, 100-200 km/h, top speed, leaderboard rank, and full run history.
- Intelligent Anti-Cheat System: A robust anti-cheat system implemented with Cloud Functions that uses a tool to analyze GPS and acceleration data, automatically rejecting runs where speed jumps unrealistically (>30km/h in 0.1s), acceleration exceeds physical limits (>2g), or GPS data shows inconsistencies.
- AI Radar Detection (Simulated): A simulated radar detection feature that displays 'AI Radar Detection Active' in the UI. It uses a tool to cross-reference the car's location with a database of known radar zones, providing audio and haptic alerts to the driver and displaying radar icons on the map when approaching these zones.
- Advanced Live Driving Dashboard: A dynamic driving screen featuring a giant digital speedometer, real-time acceleration timer, top speed display, integrated radar alerts, a run progress bar, and animated gauges for comprehensive, performance-focused real-time visualization.
- Community Engagement & Social Features: Enables users to like and comment on other drivers' performance runs, follow their favorite drivers, and easily share their own achievements within the app or to external social platforms.
- Premium Feature Subscription: An optional subscription service that unlocks exclusive features for premium users, including advanced telemetry graphs, in-depth run analysis tools, the ability to export run data as video, and custom styling options for car profiles.

## Style Guidelines:

- Color scheme: Dark theme, featuring a deep, muted blue-gray for the background (#161A1D) to create a premium, high-contrast canvas.
- Primary color: A sophisticated, dark navy blue (#263359) for prominent UI elements, text, and active states, providing depth and refinement.
- Accent color: Vibrant, electric cyan (#4DE0F4) and deep neon purple (#8A2BE2) used sparingly for 'neon' highlights, large speed numbers, and interactive elements to provide stark contrast and a high-performance feel.
- Display and body font: 'Inter', a clean, modern grotesque sans-serif, ensuring excellent readability for all textual information, especially for large, dynamic speed numbers.
- Minimalist and sleek line icons with subtle fills, adopting a geometric style that aligns with the modern, performance-driven aesthetic and is enhanced by the neon accent colors when active.
- Modern dashboards with clear information hierarchy, featuring large, prominent numeric displays against dark, desaturated backgrounds. Incorporate 'glassmorphism' effects for secondary panels and information cards, creating a premium, supercar-inspired dashboard layout.
- Smooth, performance-focused transitions for screen navigation and data updates. Implement subtle 'glow' effects around interactive elements and crucial data points to emphasize their state and importance, including animated speedometers and dynamic gauges on the live dashboard.