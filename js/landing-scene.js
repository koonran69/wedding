class WeddingScene {
    constructor(canvas) {
        this.canvas = canvas;
        this.running = true;
        this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        this.isMobile = window.innerWidth < 768;
        this.clock = new THREE.Clock();

        this.canvas.style.zIndex = "35";
        this.canvas.style.pointerEvents = "none";

        this._bind = this.render.bind(this);
        this.rafId = null;
        this.init();
    }

    init() {
        const w = Math.max(this.canvas.clientWidth, 1);
        const h = Math.max(this.canvas.clientHeight, 1);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: !this.isMobile,
            alpha: true,
            powerPreference: "high-performance",
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        this.renderer.setSize(w, h, false);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 50);
        this.camera.position.set(0, 0, 5);

        this.particles = this.buildParticles();
        this.scene.add(this.particles);

        window.addEventListener("resize", this.onResize);
        this.render();
    }

    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 64, 64);
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(0.6, 'rgba(212, 175, 55, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        ctx.save();
        ctx.translate(32, 32);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();

        const spikes = 4;
        const outerRadius = 22;
        const innerRadius = 7;

        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    buildParticles() {
        const count = this.isMobile ? 200 : 300;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);

        this.particleSpeeds = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 12;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 6;

            this.particleSpeeds[i] = 0.01 + Math.random() * 0.008;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.12,
            map: this.createParticleTexture(),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        this.particlePositions = pos;
        this.particleCount = count;
        return new THREE.Points(geo, mat);
    }

    playIntro() {
        const card = ".landing-card";
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const startX = -vw * 0.7;
        const startY = -vh * 0.5;

        gsap.set(card, {
            x: startX,
            y: startY,
            scale: 0.1,
            opacity: 0,
            rotationX: 30,
            rotationY: -360,
            rotationZ: -25,
            transformPerspective: 2000,
            transformOrigin: "center center",
            force3D: true,
        });

        const createStardustTrail = () => {
            const trailContainer = document.querySelector('.envelope-box') || document.body;
            const star = document.createElement('div');
            star.className = 'absolute pointer-events-none rounded-full z-15';

            const size = Math.random() * 6 + 3;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.background = Math.random() > 0.5 ? 'radial-gradient(circle, #fff 0%, rgba(212,175,55,0.8) 60%, transparent 100%)' : 'radial-gradient(circle, #fff 0%, rgba(255,255,255,0.5) 50%, transparent 100%)';
            star.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)';

            const currentTransform = gsap.getProperty(card, "x");
            const currentYTransform = gsap.getProperty(card, "y");

            star.style.left = `calc(50% + ${currentTransform + (Math.random() * 100)}px)`;
            star.style.top = `calc(50% + ${currentYTransform + (Math.random() * 100)}px)`;

            trailContainer.appendChild(star);

            gsap.to(star, {
                scale: 0,
                opacity: 0,
                x: (Math.random() - 0.5) * 80,
                y: (Math.random() - 0.5) * 80,
                duration: 0.8 + Math.random() * 0.6,
                ease: "power1.out",
                onComplete: () => star.remove()
            });
        };

        let trailInterval;

        const tl = this.introTimeline = gsap.timeline({
            defaults: {
                overwrite: "auto",
            },
            onStart: () => {
                trailInterval = this.trailInterval = setInterval(createStardustTrail, 28);
            },
            onComplete: () => {
                clearInterval(trailInterval);
                this.trailInterval = null;
            }
        });

        tl.to(card, {
            opacity: 1,
            scale: 0.6,
            x: vw,
            y: -vh * 0.35,
            rotationY: -180,
            rotationZ: 25,
            duration: 1.8,
            ease: "power1.in",
        })
            .to(card, {
                scale: 0.6,
                x: -vw * 0.25,
                y: -vh * 0.15,
                rotationY: 0,
                rotationZ: -25,
                duration: 1.5,
                ease: "power2.inOut",
            })
            .to(card, {
                x: 0,
                y: 0,
                scale: 1,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                duration: 1.4,
                ease: "power3.out",
            })
            .to(card, {
                scale: 1.04,
                boxShadow: "0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 255, 255, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.9)",
                duration: 0.5,
                ease: "sine.inOut"
            })
            .to(card, {
                scale: 1,
                boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)",
                duration: 0.6,
                ease: "sine.inOut",
            }, "+=0")
            .add(() => {
                if (trailInterval) clearInterval(trailInterval);
                gsap.to(card, {
                    rotationY: 8,
                    rotationZ: -2,
                    y: -6,
                    duration: 3.2,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                });
            });

        return tl;
    }

    onResize = () => {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        if (!w || !h) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h, false);
    };

    render() {
        if (!this.running) return;
        this.rafId = requestAnimationFrame(this._bind);
        const t = this.clock.getElapsedTime();

        if (!this.reduced) {
            const pos = this.particlePositions;
            for (let i = 0; i < this.particleCount; i++) {
                const ix = i * 3;
                const iy = i * 3 + 1;

                pos[iy] -= this.particleSpeeds[i];

                if (pos[iy] < -5) {
                    pos[iy] = 5;
                    pos[ix] = (Math.random() - 0.5) * 12;
                }
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
            this.particles.material.opacity = 0.6 + Math.sin(t * 4) * 0.3;
            this.particles.rotation.y = t * 0.01;
        }

        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.running = false;
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        if (this.trailInterval) clearInterval(this.trailInterval);
        this.trailInterval = null;
        if (this.introTimeline) this.introTimeline.kill();
        gsap.killTweensOf(".landing-card");
        document.querySelectorAll(".envelope-box .absolute.pointer-events-none").forEach((el) => { gsap.killTweensOf(el); el.remove(); });
        window.removeEventListener("resize", this.onResize);

        if (this.particles) {
            this.particles.geometry.dispose();
            if (this.particles.material.map) this.particles.material.map.dispose();
            this.particles.material.dispose();
        }

        this.renderer.dispose();
    }
}

window.WeddingScene = WeddingScene;
