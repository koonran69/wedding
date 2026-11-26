class CupidScene {
    constructor(canvas) {
        this.visible = true;
        this.canvas = canvas;
        this.running = true;
        this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        this.isMobile = window.innerWidth < 768;
        this.clock = new THREE.Clock();

        this.cupid = null;
        this.cupidPlayed = false;
        this.cupidTarget = new THREE.Vector3();
        this.cupidSpeed = 0.007;
        this.cupidScaleVal = this.isMobile ? 0.52 : 0.72;

        this.isDragging = false;
        this.dragPointerId = null;
        this.dragOffset = new THREE.Vector3();

        this.pointer = {
            x: 0,
            y: 0
        };

        this._bind = this.render.bind(this);
        this.rafId = null;

        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);

        this.init();
    }

    init() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        this.canvas.style.position = "fixed";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.width = "100vw";
        this.canvas.style.height = "100vh";
        this.canvas.style.zIndex = "30";
        this.canvas.style.pointerEvents = "none";
        this.canvas.style.touchAction = "none";

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: !this.isMobile,
            alpha: true,
            powerPreference: "high-performance"
        });

        this.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio || 1, 1.5)
        );

        this.renderer.setSize(w, h, false);

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(
            40,
            w / h,
            0.1,
            50
        );

        this.camera.position.set(0, 0, 5);

        if (!this.reduced) {
            this.createCupid();
        }

        document.addEventListener(
            "pointerdown",
            this.onPointerDown,
            true
        );

        window.addEventListener(
            "pointermove",
            this.onPointerMove,
            { passive: false }
        );

        window.addEventListener(
            "pointerup",
            this.onPointerUp
        );

        window.addEventListener(
            "pointercancel",
            this.onPointerUp
        );

        window.addEventListener(
            "resize",
            this.onResize
        );

        this.render();
    }

    // Thêm phương thức setVisible(visible) vào class CupidScene:
    setVisible(visible) {
        const nextVisible = Boolean(visible);
        if (this.visible === nextVisible) {
            return;
        }

        this.visible = nextVisible;

        if (!this.visible) {
            // Hủy trạng thái kéo thả nếu đang giữ
            this.isDragging = false;
            this.dragPointerId = null;
            document.body.style.cursor = "";
            this.canvas.style.cursor = "";
            if (this.rafId !== null) cancelAnimationFrame(this.rafId);
            this.rafId = null;
            if (window.gsap) gsap.killTweensOf(".cupid-heart-particle");

            // Ẩn canvas và các hạt tim bay lơ lửng hiện có
            this.canvas.style.display = "none";
            document.querySelectorAll(".cupid-heart-particle").forEach((el) => el.remove());
        } else {
            this.canvas.style.display = "";
            this.clock.getDelta(); // Tránh nhảy delta thời gian sau khi ẩn
            if (this.running && this.rafId === null) this.render();
        }
    }

    createCupid() {
        const loader = new THREE.TextureLoader();

        const texturePath = "./images/cupid.webp";

        loader.load(
            texturePath,
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;

                const image = texture.image;
                const imageRatio =
                    image.width / image.height;

                const height =
                    this.isMobile
                        ? 1.45
                        : 1.8;

                const width =
                    height * imageRatio;

                const geometry =
                    new THREE.PlaneGeometry(
                        width,
                        height
                    );

                const material =
                    new THREE.MeshBasicMaterial({
                        map: texture,
                        transparent: true,
                        opacity: 1,
                        depthWrite: false,
                        depthTest: false,
                        side: THREE.DoubleSide
                    });

                this.cupid =
                    new THREE.Mesh(
                        geometry,
                        material
                    );

                this.cupid.position.set(
                    -2,
                    0.5,
                    0
                );

                this.cupid.renderOrder =
                    999999;

                this.scene.add(
                    this.cupid
                );

                this.pickNewCupidTarget();

                this.playCupidIntro();
            },
            undefined,
            (error) => {
                console.warn(
                    "Không thể load Cupid image:",
                    texturePath,
                    error
                );
            }
        );
    }

    pickNewCupidTarget() {
        if (this.isDragging) {
            return;
        }

        const boundX =
            this.isMobile
                ? 1
                : 2.8;

        const boundY =
            this.isMobile
                ? 1.8
                : 1.8;

        this.cupidTarget.set(
            (Math.random() - 0.5) *
                (boundX * 2),

            (Math.random() - 0.5) *
                (boundY * 2),

            0
        );
    }

    getCupidScreenPosition() {
        if (!this.cupid) {
            return null;
        }

        const vector =
            new THREE.Vector3();

        this.cupid.getWorldPosition(
            vector
        );

        vector.project(
            this.camera
        );

        return {
            x:
                (vector.x * 0.5 + 0.5) *
                window.innerWidth,

            y:
                (-vector.y * 0.5 + 0.5) *
                window.innerHeight
        };
    }

    isPointerOverCupid(
        clientX,
        clientY
    ) {
        if (!this.cupid) {
            return false;
        }

        const pos =
            this.getCupidScreenPosition();

        if (!pos) {
            return false;
        }

        // Oversized touch target makes the small floating sprite easy to grab.
        const hitWidth = this.isMobile ? 240 : 190;
        const hitHeight = this.isMobile ? 260 : 210;

        return (
            clientX >=
                pos.x -
                    hitWidth / 2 &&

            clientX <=
                pos.x +
                    hitWidth / 2 &&

            clientY >=
                pos.y -
                    hitHeight / 2 &&

            clientY <=
                pos.y +
                    hitHeight / 2
        );
    }

    screenToWorld(
        clientX,
        clientY
    ) {
        const ndc =
            new THREE.Vector3(
                (clientX /
                    window.innerWidth) *
                    2 -
                    1,

                -(clientY /
                    window.innerHeight) *
                    2 +
                    1,

                0
            );

        ndc.unproject(
            this.camera
        );

        const direction =
            ndc
                .sub(
                    this.camera.position
                )
                .normalize();

        const distance =
            -this.camera.position.z /
            direction.z;

        return this.camera.position
            .clone()
            .add(
                direction.multiplyScalar(
                    distance
                )
            );
    }

    onPointerDown(event) {
        if (
            !this.cupid ||
            this.reduced ||
            this.isDragging ||
            event.target.closest?.("button, a, input, textarea, select")
        ) {
            return;
        }

        const isOverCupid =
            this.isPointerOverCupid(
                event.clientX,
                event.clientY
            );

        if (!isOverCupid) {
            return;
        }

        this.isDragging = true;

        this.dragPointerId = event.pointerId;

        try {
            event.target.setPointerCapture?.(event.pointerId);
        } catch (_) {
            // Window-level pointer listeners remain the fallback.
        }

        this.pointer.x = event.clientX;

        this.pointer.y = event.clientY;

        const cupidWorld = this.cupid.position.clone();

        const pointerWorld =
            this.screenToWorld(
                event.clientX,
                event.clientY
            );

        this.dragOffset
            .copy(cupidWorld)
            .sub(pointerWorld);

        this.cupidTarget.copy(
            this.cupid.position
        );

        document.body.style.cursor =
            "grabbing";

        this.canvas.style.cursor =
            "grabbing";

        event.preventDefault();
    }

    onPointerMove(event) {
        if (
            !this.isDragging ||
            !this.cupid ||
            this.reduced
        ) {
            return;
        }

        if (
            event.pointerId !==
            this.dragPointerId
        ) {
            return;
        }

        event.preventDefault();

        const dx = event.clientX - this.pointer.x;
        this.pointer.x = event.clientX;

        this.pointer.y =
            event.clientY;

        const pointerWorld =
            this.screenToWorld(
                event.clientX,
                event.clientY
            );

        this.cupid.position.x =
            pointerWorld.x +
            this.dragOffset.x;

        this.cupid.position.y =
            pointerWorld.y +
            this.dragOffset.y;

        const limitX =
            this.isMobile
                ? 2.2
                : 3.3;

        const limitY =
            this.isMobile
                ? 2.5
                : 2.1;

        this.cupid.position.x =
            THREE.MathUtils.clamp(
                this.cupid.position.x,
                -limitX,
                limitX
            );

        this.cupid.position.y =
            THREE.MathUtils.clamp(
                this.cupid.position.y,
                -limitY,
                limitY
            );

        this.cupidTarget.copy(
            this.cupid.position
        );

        if (Math.abs(dx) > 1) {
            const scaleVal =
                this.cupidScaleVal;

            const targetScaleX =
                dx > 0
                    ? scaleVal
                    : -scaleVal;

            this.cupid.scale.x +=
                (
                    targetScaleX -
                    this.cupid.scale.x
                ) * 0.2;
        }
    }

    onPointerUp(event) {
        if (!this.isDragging) {
            return;
        }

        if (
            event.pointerId !==
            this.dragPointerId
        ) {
            return;
        }

        this.isDragging = false;

        try {
            event.target.releasePointerCapture?.(event.pointerId);
        } catch (_) {
            // Capture may already have been released by pointercancel.
        }

        this.dragPointerId = null;

        document.body.style.cursor =
            "";

        this.canvas.style.cursor =
            "";

        this.pickNewCupidTarget();
    }

    spawnCupidTrailParticle() {
        if (
            !this.cupid ||
            !this.running
        ) {
            return;
        }

        const vector =
            new THREE.Vector3();

        this.cupid.getWorldPosition(
            vector
        );

        vector.project(
            this.camera
        );

        const isFacingLeft =
            this.cupid.scale.x < 0;

        const offsetX =
            isFacingLeft
                ? -60
                : 60;

        const x =
            (
                (vector.x * 0.5 + 0.5) *
                window.innerWidth
            ) +
            offsetX;

        const y =
            (
                (-vector.y * 0.5 + 0.5) *
                window.innerHeight
            ) -
            10;

        const heartEl =
            document.createElement(
                "div"
            );

        heartEl.className =
            "cupid-heart-particle pointer-events-none";

        heartEl.style.position =
            "fixed";

        heartEl.style.zIndex =
            "59";

        const size =
            Math.random() * 12 +
            10;

        heartEl.style.width =
            `${size}px`;

        heartEl.style.height =
            `${size}px`;

        heartEl.style.left =
            `${x}px`;

        heartEl.style.top =
            `${y}px`;

        heartEl.style.backgroundImage =
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff3366'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E")`;

        heartEl.style.backgroundSize =
            "contain";

        heartEl.style.backgroundRepeat =
            "no-repeat";

        heartEl.style.filter =
            "drop-shadow(0 0 4px rgba(255, 51, 102, 0.6))";

        document.body.appendChild(
            heartEl
        );

        gsap.fromTo(
            heartEl,
            {
                scale: 0.3,
                opacity: 0.9,
                x: 0,
                y: 0
            },
            {
                scale:
                    1.2 +
                    Math.random() *
                        0.5,

                opacity: 0,

                x:
                    (Math.random() -
                        0.8) *
                    50,

                y:
                    (Math.random() -
                        0.5) *
                        50 -
                    15,

                duration:
                    0.8 +
                    Math.random() *
                        0.5,

                ease:
                    "power1.out",

                onComplete: () => {
                    heartEl.remove();
                }
            }
        );
    }

    playCupidIntro() {
        if (
            !this.cupid ||
            this.cupidPlayed
        ) {
            return;
        }

        this.cupidPlayed = true;

        const scaleVal =
            this.cupidScaleVal;

        gsap.set(
            this.cupid.scale,
            {
                x: scaleVal,
                y: scaleVal,
                z: scaleVal
            }
        );

        gsap.set(
            this.cupid.material,
            {
                opacity: 0
            }
        );

        gsap.to(
            this.cupid.material,
            {
                opacity: 1,
                duration: 0.2,
                ease: "power2.out"
            }
        );
    }

    onResize = () => {
        const w =
            window.innerWidth;

        const h =
            window.innerHeight;

        if (!w || !h) {
            return;
        }

        this.isMobile =
            window.innerWidth < 768;

        this.camera.aspect =
            w / h;

        this.camera.updateProjectionMatrix();

        this.renderer.setSize(
            w,
            h,
            false
        );
    };

    render() {
        if (!this.running || !this.visible) {
            return;
        }

        this.rafId = requestAnimationFrame(this._bind);

        const t =
            this.clock.getElapsedTime();

        if (
            !this.reduced &&
            this.cupid
        ) {
            if (!this.isDragging) {
                this.cupid.position.lerp(
                    this.cupidTarget,
                    this.cupidSpeed
                );

                if (
                    this.cupid.position.distanceTo(
                        this.cupidTarget
                    ) < 0.25
                ) {
                    this.pickNewCupidTarget();
                }
            }

            if (!this.isDragging) {
                const directionX =
                    this.cupidTarget.x -
                    this.cupid.position.x;

                const scaleVal =
                    this.cupidScaleVal;

                if (
                    Math.abs(
                        directionX
                    ) > 0.05
                ) {
                    const targetScaleX =
                        directionX > 0
                            ? scaleVal
                            : -scaleVal;

                    this.cupid.scale.x +=
                        (
                            targetScaleX -
                            this.cupid.scale.x
                        ) * 0.05;
                }
            }

            this.cupid.position.z =
                Math.sin(t * 2.4) *
                0.03;

            const rotationAmount =
                this.isDragging
                    ? 0.025
                    : 0.08;

            this.cupid.rotation.z =
                Math.sin(t * 1.5) *
                rotationAmount;

            if (!this.isDragging) {
                this.cupid.position.y +=
                    Math.sin(t * 3) *
                    0.0012;
            }

            if (
                Math.random() > 0.25
            ) {
                this.spawnCupidTrailParticle();
            }
        }

        this.renderer.render(
            this.scene,
            this.camera
        );
    }

    dispose() {
        this.running = false;
        this.visible = false;
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.isDragging = false;
        this.dragPointerId = null;
        document.body.style.cursor = "";
        this.canvas.style.cursor = "";
        this.canvas.style.display = "none";
        document.querySelectorAll(".cupid-heart-particle").forEach((el) => {
            if (window.gsap) gsap.killTweensOf(el);
            el.remove();
        });

        document.removeEventListener(
            "pointerdown",
            this.onPointerDown,
            true
        );

        window.removeEventListener(
            "pointermove",
            this.onPointerMove
        );

        window.removeEventListener(
            "pointerup",
            this.onPointerUp
        );

        window.removeEventListener(
            "pointercancel",
            this.onPointerUp
        );

        window.removeEventListener(
            "resize",
            this.onResize
        );

        if (this.cupid) {
            if (this.cupid.geometry) {
                this.cupid.geometry.dispose();
            }

            if (this.cupid.material) {
                if (
                    this.cupid.material.map
                ) {
                    this.cupid.material.map.dispose();
                }

                this.cupid.material.dispose();
            }

            this.scene.remove(
                this.cupid
            );

            this.cupid = null;
        }

        this.renderer.dispose();
        this.canvas.width = 1;
        this.canvas.height = 1;
    }
}

window.CupidScene = CupidScene;
