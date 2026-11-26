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

class InvitationStarfield {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", { alpha: true });
        this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        this.running = true;
        this.rafId = null;
        this.starSprite = this.createStarSprite();
        this.dotSprite = this.createDotSprite();

        this.resize = this.resize.bind(this);
        this.render = this.render.bind(this);
        this.onVisibility = () => {
            if (document.hidden) this.stop();
            else if (this.running) this.start();
        };

        window.addEventListener("resize", this.resize, { passive: true });
        document.addEventListener("visibilitychange", this.onVisibility);
        this.resize();
        this.start();
    }

    // Tạo sprite sao 4 cánh + hào quang vàng/trắng giống cảm hứng WeddingScene
    createStarSprite() {
        const size = 96;
        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;
        const g = c.getContext("2d");
        const half = size / 2;

        const glow = g.createRadialGradient(half, half, 0, half, half, half);
        glow.addColorStop(0, "rgba(255, 255, 255, 1)");
        glow.addColorStop(0.22, "rgba(255, 223, 130, 0.88)");
        glow.addColorStop(0.55, "rgba(218, 178, 86, 0.28)");
        glow.addColorStop(1, "rgba(218, 178, 86, 0)");
        g.fillStyle = glow;
        g.fillRect(0, 0, size, size);

        g.save();
        g.translate(half, half);
        g.fillStyle = "#FFFDF7";
        g.beginPath();
        const spikes = 4;
        const outerR = 32;
        const innerR = 9;
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (i * Math.PI) / spikes;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
        }
        g.closePath();
        g.fill();
        g.restore();

        return c;
    }

    // Tạo sprite hạt nhũ tròn sáng cho các hạt phụ nhỏ hơn
    createDotSprite() {
        const size = 48;
        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;
        const g = c.getContext("2d");
        const half = size / 2;

        const grad = g.createRadialGradient(half, half, 0, half, half, half);
        grad.addColorStop(0, "rgba(255, 253, 245, 1)");
        grad.addColorStop(0.35, "rgba(240, 205, 125, 0.85)");
        grad.addColorStop(1, "rgba(212, 175, 55, 0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, size, size);

        return c;
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const width = Math.max(1, window.innerWidth);
        const height = Math.max(1, window.innerHeight);
        const isSmall = width < 640;

        this.canvas.width = Math.round(width * dpr);
        this.canvas.height = Math.round(height * dpr);
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.max(45, Math.round((width * height) / (isSmall ? 8500 : 6500)));
        this.stars = Array.from({ length: count }, (_, idx) => {
            const depth = 0.45 + Math.random() * 0.55;
            const isSparkle = idx % 3 === 0; // ~1/3 là sao 4 cánh lớn lấp lánh
            const baseSize = isSparkle
                ? (isSmall ? 12 : 16) + Math.random() * (isSmall ? 10 : 16)
                : (isSmall ? 5 : 6) + Math.random() * (isSmall ? 7 : 10);

            return {
                x: Math.random() * width,
                y: Math.random() * height,
                size: baseSize * (0.7 + depth * 0.4),
                speed: (0.18 + Math.random() * 0.48) * depth,
                driftFreq: 0.0003 + Math.random() * 0.0004,
                driftAmp: 0.15 + Math.random() * 0.25,
                twinkleSpeed: 0.0018 + Math.random() * 0.0022,
                phase: Math.random() * Math.PI * 2,
                depth,
                isSparkle,
                spin: Math.random() * Math.PI * 2,
                spinSpeed: (Math.random() - 0.5) * 0.0008,
            };
        });

        this.width = width;
        this.height = height;
    }

    start() {
        if (this.rafId === null && !document.hidden) {
            this.rafId = requestAnimationFrame(this.render);
        }
    }

    stop() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    render(now = 0) {
        this.rafId = null;
        if (!this.running || document.hidden) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        for (const star of this.stars) {
            if (!this.reduced) {
                star.y += star.speed;
                star.x += Math.sin(now * star.driftFreq + star.phase) * star.driftAmp;
                star.spin += star.spinSpeed * 16;

                const margin = star.size;
                if (star.y > this.height + margin) {
                    star.y = -margin;
                    star.x = Math.random() * this.width;
                }
                if (star.x < -margin) star.x = this.width + margin;
                if (star.x > this.width + margin) star.x = -margin;
            }

            const wave = (Math.sin(now * star.twinkleSpeed + star.phase) + 1) * 0.5;
            const alpha = this.reduced
                ? 0.75 * star.depth
                : Math.min(1, (0.45 + wave * 0.55) * (0.65 + star.depth * 0.35));
            const pulse = this.reduced ? 1 : 0.85 + wave * 0.3;
            const drawSize = star.size * pulse;

            ctx.globalAlpha = alpha;

            if (star.isSparkle) {
                ctx.save();
                ctx.translate(star.x, star.y);
                ctx.rotate(star.spin);
                ctx.drawImage(this.starSprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
                ctx.restore();
            } else {
                ctx.drawImage(this.dotSprite, star.x - drawSize / 2, star.y - drawSize / 2, drawSize, drawSize);
            }
        }

        ctx.restore();
        this.rafId = requestAnimationFrame(this.render);
    }

    dispose() {
        this.running = false;
        this.stop();
        window.removeEventListener("resize", this.resize);
        document.removeEventListener("visibilitychange", this.onVisibility);
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
}

window.InvitationStarfield = InvitationStarfield;
