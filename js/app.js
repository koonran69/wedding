window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loaded');
});

gsap.registerPlugin(ScrollTrigger);

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const state = {
    scene: null,
    mainScene: null,
    cupidScene: null,
    mainCupidScene: null,
    invitationStarfield: null,
    coverIndex: 0,
    soundOn: false,
};

function fillContent() {
    $$("[data-groom-short]").forEach((el) => (el.textContent = WEDDING.groom.short));
    $$("[data-bride-short]").forEach((el) => (el.textContent = WEDDING.bride.short));
    $$("[data-groom-full]").forEach((el) => (el.textContent = WEDDING.groom.full));
    $$("[data-bride-full]").forEach((el) => (el.textContent = WEDDING.bride.full));
    $$("[data-date-long]").forEach(
        (el) =>
            (el.textContent = `${WEDDING.date.weekday}, ngày ${WEDDING.date.day} tháng ${WEDDING.date.month} năm ${WEDDING.date.year}`)
    );
    $$("[data-lunar]").forEach((el) => (el.textContent = WEDDING.date.lunar));

    $("#groom-parents").innerHTML = WEDDING.groom.parents.map((p) => `<p>${p}</p>`).join("");
    $("#bride-parents").innerHTML = WEDDING.bride.parents.map((p) => `<p>${p}</p>`).join("");

    $("#ceremony-time").textContent = WEDDING.venues.ceremony.time;
    $("#ceremony-name").textContent = WEDDING.venues.ceremony.name;
    $("#ceremony-address").textContent = WEDDING.venues.ceremony.address;
    $("#reception-time").textContent = WEDDING.venues.reception.time;
    $("#reception-name").textContent = WEDDING.venues.reception.name;
    $("#reception-address").textContent = WEDDING.venues.reception.address;

    // Đồng bộ thông tin sang Tấm thiệp bay ra (Flying Card)
    const fGroomParents = $("#flying-groom-parents");
    if (fGroomParents) fGroomParents.innerHTML = WEDDING.groom.parents.map((p) => `<p>${p}</p>`).join("");
    const fBrideParents = $("#flying-bride-parents");
    if (fBrideParents) fBrideParents.innerHTML = WEDDING.bride.parents.map((p) => `<p>${p}</p>`).join("");

    const fCtime = $("#flying-ceremony-time");
    if (fCtime) fCtime.textContent = WEDDING.venues.ceremony.time;
    const fCname = $("#flying-ceremony-name");
    if (fCname) fCname.textContent = WEDDING.venues.ceremony.name;
    const fCaddr = $("#flying-ceremony-address");
    if (fCaddr) fCaddr.textContent = WEDDING.venues.ceremony.address;

    const fRtime = $("#flying-reception-time");
    if (fRtime) fRtime.textContent = WEDDING.venues.reception.time;
    const fRname = $("#flying-reception-name");
    if (fRname) fRname.textContent = WEDDING.venues.reception.name;
    const fRaddr = $("#flying-reception-address");
    if (fRaddr) fRaddr.textContent = WEDDING.venues.reception.address;

    $("#map-frame").src = WEDDING.venues.reception.mapsEmbed;
    $("#map-dir").href = WEDDING.venues.reception.mapsDir;
    const recName = $("#reception-name-repeat");
    if (recName) recName.textContent = WEDDING.venues.reception.name;

    $("#qr-groom").src = WEDDING.groom.bank.qr;
    $("#qr-bride").src = WEDDING.bride.bank.qr;
    $("#bank-groom-name").textContent = WEDDING.groom.bank.name;
    $("#bank-groom-bank").textContent = `${WEDDING.groom.bank.bank} · ${WEDDING.groom.bank.branch}`;
    $("#bank-groom-acc").textContent = WEDDING.groom.bank.account;
    $("#bank-bride-name").textContent = WEDDING.bride.bank.name;
    $("#bank-bride-bank").textContent = `${WEDDING.bride.bank.bank} · ${WEDDING.bride.bank.branch}`;
    $("#bank-bride-acc").textContent = WEDDING.bride.bank.account;

    $("#bg-music").src = WEDDING.music;
    $("#wedding-video").src = WEDDING.video;
}

function buildCalendar() {
    const mount = $("#calendar-grid");
    const year = WEDDING.date.year;
    const month = WEDDING.date.month - 1;
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    mount.innerHTML = labels
        .map((d) => `<div class="text-center text-[14px] sm:text-[16px] tracking-[0.12em] sm:tracking-[0.2em] text-gold/90 py-1.5">${d}</div>`)
        .join("");

    for (let i = 0; i < first; i++) mount.insertAdjacentHTML("beforeend", `<div></div>`);
    for (let d = 1; d <= days; d++) {
        if (d === WEDDING.date.day) {
            mount.insertAdjacentHTML(
                "beforeend",
                `<div class="cal-cell"><div class="cal-heart"><span>${d}</span><i class="cal-ring"></i></div></div>`
            );
        } else {
            mount.insertAdjacentHTML("beforeend", `<div class="cal-cell">${d}</div>`);
        }
    }
}

function buildTimeline() {
    $("#timeline").innerHTML = WEDDING.timeline
        .map(
            (item, i) => `
      <article class="timeline-item relative pl-9 md:pl-0 ${i % 2 ? "md:text-right md:pr-12" : "md:pl-12"} grid md:grid-cols-2 gap-2 md:gap-10">
        <div class="${i % 2 ? "md:col-start-1" : "md:col-start-2"} opacity-0 translate-y-8">
          <p class="font-display text-2xl sm:text-3xl text-gold">${item.time}</p>
          <h3 class="font-serif text-xl sm:text-2xl mt-1">${item.title}</h3>
          <p class="text-gold mt-1 font-serif text-[18px]">${item.desc}</p>
        </div>
        <span class="absolute left-[5px] md:left-1/2 md:-translate-x-1/2 top-2 w-3 h-3 rounded-full bg-gold shadow-[0_0_0_6px_rgba(196,165,116,0.18)]"></span>
      </article>`
        )
        .join("");
}

function coverGap() {
    return window.innerWidth < 640 ? 108 : window.innerWidth < 1024 ? 160 : 210;
}

function buildCoverflow() {
    const stage = $("#coverflow");
    stage.innerHTML = WEDDING.gallery
        .map((src, i) => `<figure class="coverflow-item" data-i="${i}"><img src="${src}" alt="Kỷ niệm ${i + 1}" loading="lazy"></figure>`)
        .join("");
    layoutCoverflow();
    stage.addEventListener("click", (e) => {
        const item = e.target.closest(".coverflow-item");
        if (!item) return;
        const i = Number(item.dataset.i);
        if (i === state.coverIndex) openLightbox(i);
        else {
            state.coverIndex = i;
            layoutCoverflow();
        }
    });

    let x0 = 0;
    stage.addEventListener("touchstart", (e) => {
        x0 = e.changedTouches[0].clientX;
    }, { passive: true });
    stage.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) < 36) return;
        if (dx > 0) state.coverIndex = (state.coverIndex - 1 + WEDDING.gallery.length) % WEDDING.gallery.length;
        else state.coverIndex = (state.coverIndex + 1) % WEDDING.gallery.length;
        layoutCoverflow();
    }, { passive: true });
}

function layoutCoverflow() {
    const items = $$(".coverflow-item");
    const n = items.length;
    const gap = coverGap();
    items.forEach((el, i) => {
        let d = i - state.coverIndex;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;
        const abs = Math.abs(d);
        gsap.to(el, {
            duration: 0.65,
            ease: "power3.out",
            x: d * gap,
            z: -Math.abs(d) * (window.innerWidth < 640 ? 110 : 150),
            rotationY: d * (window.innerWidth < 640 ? -28 : -40),
            scale: abs === 0 ? 1 : 0.82,
            opacity: abs > 2 ? 0 : 1 - abs * 0.2,
            zIndex: 80 - abs,
            filter: abs === 0 ? "brightness(1)" : "brightness(0.72)",
        });
        el.style.pointerEvents = abs > 2 ? "none" : "auto";
    });
}

function openLightbox(i) {
    $("#lightbox-img").src = WEDDING.gallery[i];
    $("#lightbox").classList.add("is-on");
}

function closeLightbox() {
    $("#lightbox").classList.remove("is-on");
}

function setupScrollAnims() {
    gsap.utils.toArray(".reveal-line").forEach((el) => {
        gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
        });
    });

    gsap.utils.toArray(".slide-card").forEach((el, i) => {
        gsap.from(el, {
            y: 48,
            opacity: 0,
            duration: 0.95,
            delay: i * 0.1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 84%" },
        });
    });

    gsap.from("#calendar-card", {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: "#calendar-card", start: "top 82%" },
    });

    gsap.fromTo(
        "#timeline-progress",
        { scaleY: 0 },
        {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: "#roadmap", start: "top 72%", end: "bottom 58%", scrub: 0.5 },
        }
    );

    gsap.utils.toArray(".timeline-item > div").forEach((el) => {
        gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 86%" },
        });
    });

    const sections = $$("#invitation section[id]");
    const dots = $$(".nav-dot");
    sections.forEach((sec, i) => {
        ScrollTrigger.create({
            trigger: sec,
            start: "top 45%",
            end: "bottom 45%",
            onToggle: (self) => {
                if (self.isActive) {
                    dots.forEach((d) => d.classList.remove("is-active"));
                    dots[i]?.classList.add("is-active");
                }
            },
        });
    });
}

function typeOpening() {
    const lines = $$("#opening-message p");
    const speed = window.innerWidth < 640 ? 12 : 16;
    lines.forEach((line) => {
        const text = line.textContent;
        line.textContent = "";
        line.style.opacity = 1;
        ScrollTrigger.create({
            trigger: line,
            start: "top 82%",
            once: true,
            onEnter: () => {
                let i = 0;
                const tick = () => {
                    line.textContent = text.slice(0, i);
                    i += 1;
                    if (i <= text.length) setTimeout(tick, speed);
                };
                tick();
            },
        });
    });
}

function setupSound() {
    const audio = $("#bg-music");
    const btn = $("#sound-btn");
    const setIcon = () => {
        btn.innerHTML = state.soundOn
            ? '<i data-lucide="volume-2" class="w-5 h-5"></i>'
            : '<i data-lucide="volume-x" class="w-5 h-5"></i>';
        if (window.lucide) lucide.createIcons();
    };
    btn.addEventListener("click", async () => {
        if (state.soundOn) {
            audio.pause();
            state.soundOn = false;
        } else {
            try {
                await audio.play();
                state.soundOn = true;
            } catch {
                state.soundOn = false;
            }
        }
        setIcon();
    });
}

// Xử lý hiệu ứng khi bấm mở thiệp mời: Thiệp bên trong bay ra rồi hóa thành website chính
const animationConfig = {
    pullOutDuration: 0.75,
    popOutDuration: 0.35,
    holdDuration: 0.8,
    zoomDuration: 0.65,
};
async function openInvitation() {
    const btn = $("#open-btn");
    if (btn.disabled) return;
    btn.disabled = true;

    // Cupid belongs to the landing screen only; stop its loop as soon as opening starts.
    if (state.cupidScene) {
        state.cupidScene.dispose();
        state.cupidScene = null;
    }

    const vh = window.innerHeight;

    const audio = $("#bg-music");
    try {
        await audio.play();
        state.soundOn = true;
        $("#sound-btn").classList.remove("pointer-events-none", "opacity-0");
        $("#sound-btn").innerHTML = '<i data-lucide="volume-2" class="w-5 h-5"></i>';
        if (window.lucide) lucide.createIcons();
    } catch {
        $("#sound-btn").classList.remove("pointer-events-none", "opacity-0");
    }

    // Thêm class 'is-open' để đổi tầng z-index cho phép thiệp đè lên trên phong bì khi trồi ra
    $("#envelope-box").classList.add("is-open");

    const tl = gsap.timeline({
        onComplete: () => {
            if (state.scene) {
                state.scene.dispose();
                state.scene = null;
            }
            if (state.mainCupidScene) {
                state.mainCupidScene.dispose();
                state.mainCupidScene = null;
            }

            $("#landing").classList.add("hidden");
            $("#invitation").classList.remove("hidden");
            if (window.InvitationStarfield && !state.invitationStarfield) {
                state.invitationStarfield = new InvitationStarfield($("#invitation-starfield"));
            }
            document.body.classList.add("is-open");
            ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
            window.scrollTo(0, 0);
            gsap.from("#invitation", { opacity: 0, duration: 0.9, ease: "power2.out" });

            setupScrollAnims();
            typeOpening();
            requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
        }
    });

    // 1. Đặt vị trí ban đầu của thiệp nằm thụt phía dưới vỏ phong bì
    tl.set("#flying-card", {
        pointerEvents: "auto",
        opacity: 0,
        y: -120, // Nằm thụt phía dưới phong bì
        scale: 0.95,
        zIndex: 1 // Đảm bảo nằm dưới phong bì lúc đầu nếu cần
    })
        // 2 + 3. Kéo lên 1 phần 3, dừng lại 1s, rồi kéo tiếp lên
        .to("#flying-card", {
            y: -120, // Khoảng 1/3 quãng đường trồi lên
            opacity: 1,
            duration: animationConfig.pullOutDuration * 0.6,
            ease: "power3.out"
        }, 0)
        .to({}, { duration: 1 }, ">") // Dừng lại 1s

        // Kéo tiếp phần còn lại lên cao
        .to("#flying-card", {
            y: -vh , // Trồi hẳn lên trên
            scale: 1,
            duration: animationConfig.pullOutDuration * 0.6,
            ease: "power3.out"
        })

        // 4 + 5. Không ẩn phong bì đi mà để phong bì ở lại (chỉ dịch chuyển nhẹ hoặc giữ nguyên), thiệp di chuyển xuống giữa màn hình và đè lên trên phong bì
        .to(".landing-card", {
            y: 20, // Phong bì lùi nhẹ xuống tạo chiều sâu nhưng KHÔNG ẩn (opacity giữ nguyên hoặc chỉnh nhẹ tùy ý)
            opacity: 1,
            duration: 0.5,
            ease: "power2.out"
        }, "-=0.2")

        .to("#flying-card", {
            y: 0, // Vị trí chính giữa màn hình (hoặc căn chỉnh lại tọa độ Y thực tế của bạn)
            zIndex: 99, // Đảm bảo thiệp đè lên trên phong bì
            duration: 0.6,
            ease: "power2.out"
        }, "<")

        // 6. Dừng lại lơ lửng ở giữa màn hình 1s
        .to({}, { duration: 1 })

        // 7. Phóng to tràn màn hình chuyển vào website chính
        .to("#flying-card", {
            scale: 2.6,
            opacity: 0,
            duration: animationConfig.zoomDuration,
            ease: "power2.inOut"
        });
}

function setupRedEnvelope() {
    const section = $("#gift");
    const pack = $("#red-pack");
    const btn = $("#open-pack-btn");
    const letter = $("#pack-letter");

    if (!section || !pack || !btn || !letter) return;

    btn.addEventListener("click", () => {
        if (pack.classList.contains("is-open")) return;

        const isMobile = window.innerWidth < 640;

        const lift = isMobile ? -230 : -250;
        const letterHeight = isMobile ? 370 : 390;

        /*
         * Tạo không gian cho animation.
         * Layout của section sẽ tự mở rộng.
         */
        section.classList.add("is-pack-open");

        /*
         * Đợi layout bắt đầu transition rồi mới
         * chạy animation envelope.
         */
        const tl = gsap.timeline();

        // 1. Mở nắp
        tl.to("#pack-flap", {
            rotateX: -168,
            duration: 0.7,
            ease: "power3.inOut",
            transformOrigin: "top center"
        });

        // 2. Thiệp trồi lên
        tl.to(
            letter,
            {
                y: lift,
                height: letterHeight,
                duration: 0.8,
                ease: "power3.out"
            },
            "-=0.4"
        );

        // 3. QR xuất hiện
        tl.to(
            "#qr-panel",
            {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out"
            },
            "-=0.4"
        );

        btn.textContent = "Phong bao đã mở";
        btn.disabled = true;

        btn.classList.add(
            "opacity-70",
            "cursor-not-allowed"
        );
    });
}

function setupCoverNav() {
    $("#cover-prev").addEventListener("click", () => {
        state.coverIndex = (state.coverIndex - 1 + WEDDING.gallery.length) % WEDDING.gallery.length;
        layoutCoverflow();
    });
    $("#cover-next").addEventListener("click", () => {
        state.coverIndex = (state.coverIndex + 1) % WEDDING.gallery.length;
        layoutCoverflow();
    });
    $("#lightbox").addEventListener("click", (e) => {
        if (e.target.id === "lightbox" || e.target.closest("[data-close-lightbox]")) closeLightbox();
    });
    window.addEventListener("resize", () => {
        if (!$("#invitation").classList.contains("hidden")) layoutCoverflow();
    });
}

function hideLoader() {
    const el = $("#loader");
    if (!el) return;
    gsap.to(el, {
        opacity: 0,
        duration: 0.1,
        onComplete: () => el.classList.add("hidden"),
    });
}

async function boot() {
    fillContent();
    buildCalendar();
    buildTimeline();
    buildCoverflow();
    gsap.set(".coverflow-item", { transformPerspective: 1200, transformOrigin: "center center" });
    setupSound();
    setupRedEnvelope();
    setupCoverNav();
    if (window.lucide) lucide.createIcons();

    // Khóa nút mở thiệp ngay từ đầu để chặn click khi đang chạy intro
    const openBtn = $("#open-btn");
    openBtn.disabled = true;
    openBtn.classList.add("opacity-60", "cursor-not-allowed");

    try {
        await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]);
    } catch (_) {}

    hideLoader();

    // Gắn sự kiện click mở thiệp
    openBtn.addEventListener("click", openInvitation);

    try {
        if (window.THREE && window.WeddingScene) {
            state.scene = new WeddingScene($("#scene-canvas"));
            const introTl = state.scene.playIntro();

            if (window.CupidScene && $(".cupid-scene-canvas")) {
                state.cupidScene = new CupidScene($(".cupid-scene-canvas"));
            }

            // Khi intro chạy xong thì mở khóa nút bấm
            if (introTl) {
                introTl.eventCallback("onComplete", () => {
                    openBtn.disabled = false;
                    openBtn.classList.remove("opacity-60", "cursor-not-allowed");
                });
            } else {
                openBtn.disabled = false;
                openBtn.classList.remove("opacity-60", "cursor-not-allowed");
            }
        } else {
            gsap.to(".landing-card", {
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
                duration: 0.7,
                onComplete: () => {
                    openBtn.disabled = false;
                    openBtn.classList.remove("opacity-60", "cursor-not-allowed");
                }
            });
        }
    } catch (err) {
        console.warn(err);
        gsap.to(".landing-card", {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            duration: 0.7,
            onComplete: () => {
                openBtn.disabled = false;
                openBtn.classList.remove("opacity-60", "cursor-not-allowed");
            }
        });
    }
}

if (document.readyState === "complete") boot();
else window.addEventListener("load", boot);
