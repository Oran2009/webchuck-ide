//-----------------------------------------------------------
// title: Pet
// desc:  Eggscavate chicken that walks along the
//        bottom of the file explorer.
//
// author: ben hoang
// date:   February 2026
//-----------------------------------------------------------

// Sprite constants
const SPRITE_SIZE = 18;
const SPRITE_FRAMES = 4;
const SCALE = 3;
const RENDERED_SIZE = SPRITE_SIZE * SCALE; // 54

// Animation
const TARGET_FPS = 8;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

// Movement
const WALK_SPEED = 0.8; // pixels per animation frame
const IDLE_CHANCE = 0.003; // ~0.3% chance per frame to enter idle
const IDLE_MIN_MS = 1000;
const IDLE_MAX_MS = 4000;

// Layout — must match #fileExplorerFooter h-[30px]
const FOOTER_HEIGHT = 30;

// Click reaction
const BOUNCE_DURATION = 400; // ms
const BOUNCE_HEIGHT = 12; // px
const HEART_DURATION = 600; // ms

export default class Pet {
    private static canvas: HTMLCanvasElement;
    private static ctx: CanvasRenderingContext2D;
    private static container: HTMLDivElement;
    private static sprite: HTMLImageElement;
    private static spriteLoaded: boolean = false;

    // Animation state
    private static animFrameId: number = 0;
    private static lastFrameTime: number = 0;
    private static currentFrame: number = 0;

    // Position & direction
    private static x: number = 0;
    private static facingRight: boolean = true;

    // State machine
    private static state: "walking" | "idle" | "reacting" = "walking";
    private static idleEndTime: number = 0;

    // Bounce reaction
    private static bounceStartTime: number = 0;

    // Heart emoji element
    private static heartEl: HTMLDivElement | null = null;

    // Theme
    private static isDark: boolean = true;

    // Toggle
    private static enabled: boolean = false;
    private static toggleButton: HTMLButtonElement;

    constructor() {
        Pet.container =
            document.querySelector<HTMLDivElement>("#fileExplorerPanel")!;

        // Create canvas
        Pet.canvas = document.createElement("canvas");
        Pet.canvas.style.position = "absolute";
        Pet.canvas.style.bottom = `${FOOTER_HEIGHT}px`;
        Pet.canvas.style.left = "0";
        Pet.canvas.style.width = "100%";
        Pet.canvas.style.height = `${RENDERED_SIZE + BOUNCE_HEIGHT}px`;
        Pet.canvas.style.zIndex = "10";
        Pet.canvas.height = RENDERED_SIZE + BOUNCE_HEIGHT;
        Pet.container.appendChild(Pet.canvas);

        Pet.ctx = Pet.canvas.getContext("2d")!;
        Pet.ctx.imageSmoothingEnabled = false;

        Pet.canvas.style.pointerEvents = "auto";
        Pet.canvas.addEventListener("click", (e: MouseEvent) => {
            Pet.handleClick(e);
        });

        // Toggle button
        Pet.toggleButton =
            document.querySelector<HTMLButtonElement>("#petToggle")!;
        Pet.enabled = localStorage.getItem("pet") === "true";
        Pet.updateToggleText();

        Pet.toggleButton.addEventListener("click", () => {
            Pet.enabled = !Pet.enabled;
            localStorage.setItem("pet", String(Pet.enabled));
            Pet.updateToggleText();
            if (Pet.enabled) {
                Pet.show();
            } else {
                Pet.hide();
            }
        });

        // Listen for window resize
        window.addEventListener("resize", () => {
            Pet.resize();
        });
    }

    /**
     * Load spritesheet and start animation if enabled
     */
    static init(): void {
        Pet.isDark = localStorage.getItem("theme") !== "light";
        Pet.sprite = new Image();
        Pet.sprite.onload = () => {
            Pet.spriteLoaded = true;
            Pet.resize();
            if (Pet.enabled) {
                Pet.show();
            } else {
                Pet.canvas.style.display = "none";
            }
        };
        Pet.sprite.src = "./img/chicken-hat1.png";
    }

    /**
     * Show canvas and start the animation loop
     */
    static show(): void {
        if (!Pet.spriteLoaded) return;
        Pet.canvas.style.display = "";
        Pet.state = "walking";
        Pet.lastFrameTime = 0;
        if (!Pet.animFrameId) {
            Pet.animFrameId = requestAnimationFrame(Pet.loop);
        }
    }

    /**
     * Hide canvas and cancel the animation loop
     */
    static hide(): void {
        Pet.canvas.style.display = "none";
        if (Pet.animFrameId) {
            cancelAnimationFrame(Pet.animFrameId);
            Pet.animFrameId = 0;
        }
    }

    /**
     * Update canvas width to match container, clamp pet position
     */
    static resize(): void {
        if (!Pet.container) return;
        const width = Pet.container.clientWidth;
        if (width === Pet.canvas.width) return;
        Pet.canvas.width = width;
        Pet.canvas.height = RENDERED_SIZE + BOUNCE_HEIGHT;
        Pet.ctx.imageSmoothingEnabled = false;

        // Clamp x so the pet stays within bounds
        const maxX = width - RENDERED_SIZE;
        if (Pet.x > maxX) {
            Pet.x = Math.max(0, maxX);
        }
    }

    /**
     * Update theme awareness (invert sprite on light themes)
     */
    static applyTheme(isDark: boolean): void {
        Pet.isDark = isDark;
    }

    // ---- Private ----

    private static updateToggleText(): void {
        Pet.toggleButton.textContent = Pet.enabled ? "Pet: On" : "Pet: Off";
    }

    /**
     * Main animation loop, throttled to ~8 FPS
     */
    private static loop = (timestamp: number): void => {
        Pet.animFrameId = requestAnimationFrame(Pet.loop);

        const elapsed = timestamp - Pet.lastFrameTime;
        if (elapsed < FRAME_INTERVAL) return;
        Pet.lastFrameTime = timestamp - (elapsed % FRAME_INTERVAL);

        Pet.update(timestamp);
        Pet.draw(timestamp);
    };

    /**
     * Update pet state and position
     */
    private static update(timestamp: number): void {
        const canvasWidth = Pet.canvas.width;
        const maxX = canvasWidth - RENDERED_SIZE;

        switch (Pet.state) {
            case "walking": {
                // Advance frame
                Pet.currentFrame = (Pet.currentFrame + 1) % SPRITE_FRAMES;

                // Move
                if (Pet.facingRight) {
                    Pet.x += WALK_SPEED;
                    if (Pet.x >= maxX) {
                        Pet.x = maxX;
                        Pet.facingRight = false;
                    }
                } else {
                    Pet.x -= WALK_SPEED;
                    if (Pet.x <= 0) {
                        Pet.x = 0;
                        Pet.facingRight = true;
                    }
                }

                // Random chance to idle
                if (Math.random() < IDLE_CHANCE) {
                    Pet.state = "idle";
                    Pet.currentFrame = 0;
                    const duration =
                        IDLE_MIN_MS +
                        Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS);
                    Pet.idleEndTime = timestamp + duration;
                }
                break;
            }
            case "idle": {
                Pet.currentFrame = 0;
                if (timestamp >= Pet.idleEndTime) {
                    Pet.state = "walking";
                }
                break;
            }
            case "reacting": {
                // Stay on frame 0, don't move
                Pet.currentFrame = 0;
                const reactElapsed = timestamp - Pet.bounceStartTime;
                if (reactElapsed >= BOUNCE_DURATION) {
                    Pet.state = "walking";
                }
                break;
            }
        }
    }

    /**
     * Render the pet sprite to canvas
     */
    private static draw(timestamp: number): void {
        const ctx = Pet.ctx;
        ctx.clearRect(0, 0, Pet.canvas.width, Pet.canvas.height);

        if (!Pet.spriteLoaded) return;

        // Calculate bounce offset
        let bounceY = 0;
        if (Pet.state === "reacting") {
            const t = (timestamp - Pet.bounceStartTime) / BOUNCE_DURATION;
            // Sine wave bounce: peaks at t=0.5
            bounceY = Math.sin(t * Math.PI) * BOUNCE_HEIGHT;
        }

        const srcX = Pet.currentFrame * SPRITE_SIZE;
        const destY = BOUNCE_HEIGHT - bounceY; // baseline with headroom for bounce

        ctx.save();
        ctx.filter = Pet.isDark ? "none" : "invert(1)";

        if (!Pet.facingRight) {
            // Flip horizontally around the pet's center
            ctx.translate(Pet.x + RENDERED_SIZE, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(
                Pet.sprite,
                srcX, 0, SPRITE_SIZE, SPRITE_SIZE,
                0, destY, RENDERED_SIZE, RENDERED_SIZE
            );
        } else {
            ctx.drawImage(
                Pet.sprite,
                srcX, 0, SPRITE_SIZE, SPRITE_SIZE,
                Pet.x, destY, RENDERED_SIZE, RENDERED_SIZE
            );
        }

        ctx.restore();
    }

    /**
     * Handle click — check if it hits the pet's bounding box
     */
    private static handleClick(e: MouseEvent): void {
        if (Pet.state === "reacting") return;

        const rect = Pet.canvas.getBoundingClientRect();
        const scaleX = Pet.canvas.width / rect.width;
        const scaleY = Pet.canvas.height / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        // Bounding box check (sprite rests at y=BOUNCE_HEIGHT)
        const petLeft = Pet.x;
        const petRight = Pet.x + RENDERED_SIZE;
        const petTop = BOUNCE_HEIGHT;
        const petBottom = BOUNCE_HEIGHT + RENDERED_SIZE;

        if (
            clickX >= petLeft &&
            clickX <= petRight &&
            clickY >= petTop &&
            clickY <= petBottom
        ) {
            Pet.react();
        }
    }

    /**
     * Trigger bounce + heart emoji reaction
     */
    private static react(): void {
        Pet.state = "reacting";
        Pet.bounceStartTime = performance.now();
        Pet.currentFrame = 0;

        // Show heart emoji above the pet
        Pet.showHeart();
    }

    /**
     * Display a floating heart emoji above the pet
     */
    private static showHeart(): void {
        // Remove any existing heart
        if (Pet.heartEl) {
            Pet.heartEl.remove();
            Pet.heartEl = null;
        }

        const heart = document.createElement("div");
        heart.textContent = "\u2764\uFE0F";
        heart.style.position = "absolute";
        heart.style.bottom = `${RENDERED_SIZE + BOUNCE_HEIGHT + FOOTER_HEIGHT + 4}px`;
        heart.style.left = `${Pet.x + RENDERED_SIZE / 2}px`;
        heart.style.transform = "translateX(-50%)";
        heart.style.fontSize = "18px";
        heart.style.pointerEvents = "none";
        heart.style.zIndex = "11";
        heart.style.transition = `opacity ${HEART_DURATION / 2}ms ease, transform ${HEART_DURATION}ms ease`;
        heart.style.opacity = "1";
        Pet.container.appendChild(heart);
        Pet.heartEl = heart;

        // Animate upward and fade
        requestAnimationFrame(() => {
            heart.style.transform = "translateX(-50%) translateY(-16px)";
            heart.style.opacity = "0";
        });

        setTimeout(() => {
            if (heart.parentNode) {
                heart.remove();
            }
            if (Pet.heartEl === heart) {
                Pet.heartEl = null;
            }
        }, HEART_DURATION);
    }
}
