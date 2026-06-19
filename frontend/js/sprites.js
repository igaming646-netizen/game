/* ============================================================
   SPRITES.js — Detailed gradient/layered SVG sprite library
   One distinct artwork per named entity (player / pets /
   companions / enemies). Falls back to a generic silhouette
   by category if a name isn't found.
   ============================================================ */

const Sprites = {

    // Builds unique gradient ids so multiple simultaneous copies
    // of the same sprite (e.g. two Colossal Golems) never clash.
    _uid(entity, tag) {
        return `g-${tag}-${(entity && entity.id) ? entity.id : Math.random().toString(36).slice(2, 8)}`;
    },

    get(entity) {
        const name = entity && entity.name;
        let builder = this.LIBRARY[name];
        if (!builder && name) {
            // Enemy names are stored as "Lv.<n> <Template Name>" — strip the prefix and retry.
            const stripped = name.replace(/^Lv\.\d+\s*/, '');
            builder = this.LIBRARY[stripped];
        }
        if (builder) return builder.call(this, entity);
        // Category fallback
        if (entity.isPlayer) return this.LIBRARY['Knight of Light'].call(this, entity);
        if (entity.isPet) return this.genericPet(entity);
        if (entity.isCompanion) return this.genericCompanion(entity);
        return this.genericEnemy(entity);
    },

    /* ---------------- GENERIC FALLBACKS ---------------- */
    genericPet(entity) {
        const u = this._uid(entity, 'gp');
        return `<svg viewBox="0 0 100 100" class="w-14 h-14">
            <defs><radialGradient id="${u}" cx="40%" cy="35%" r="70%">
                <stop offset="0%" stop-color="#fdba74"/><stop offset="100%" stop-color="#c2410c"/>
            </radialGradient></defs>
            <ellipse cx="50" cy="88" rx="20" ry="5" fill="rgba(0,0,0,.4)"/>
            <circle cx="50" cy="60" r="20" fill="url(#${u})" stroke="#7c2d12" stroke-width="2"/>
            <circle cx="43" cy="56" r="2.5" fill="#000"/><circle cx="57" cy="56" r="2.5" fill="#000"/>
        </svg>`;
    },
    genericCompanion(entity) {
        const u = this._uid(entity, 'gc');
        return `<svg viewBox="0 0 100 120" class="w-20 h-20">
            <defs><linearGradient id="${u}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2dd4bf"/><stop offset="100%" stop-color="#0f766e"/>
            </linearGradient></defs>
            <ellipse cx="50" cy="110" rx="25" ry="6" fill="rgba(0,0,0,.4)"/>
            <path d="M 38 40 L 62 40 L 58 85 L 42 85 Z" fill="url(#${u})" stroke="#115e59" stroke-width="2"/>
            <circle cx="50" cy="25" r="12" fill="#14b8a6"/>
        </svg>`;
    },
    genericEnemy(entity) {
        const u = this._uid(entity, 'ge');
        return `<svg viewBox="0 0 110 120" class="w-20 h-20">
            <defs><radialGradient id="${u}" cx="40%" cy="35%" r="70%">
                <stop offset="0%" stop-color="#c084fc"/><stop offset="100%" stop-color="#581c87"/>
            </radialGradient></defs>
            <ellipse cx="55" cy="110" rx="25" ry="6" fill="rgba(0,0,0,.4)"/>
            <circle cx="55" cy="55" r="22" fill="url(#${u})" filter="drop-shadow(0 0 12px #c084fc)"/>
        </svg>`;
    },

    LIBRARY: {

        /* ================= PLAYER ================= */
        'Knight of Light'(entity) {
            const u = this._uid(entity, 'kol');
            return `<svg viewBox="0 0 100 130" class="w-20 h-20">
                <defs>
                    <linearGradient id="${u}-cape" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#818cf8"/><stop offset="100%" stop-color="#312e81"/>
                    </linearGradient>
                    <linearGradient id="${u}-armor" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#f1f5f9"/><stop offset="55%" stop-color="#94a3b8"/><stop offset="100%" stop-color="#475569"/>
                    </linearGradient>
                    <radialGradient id="${u}-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#fef9c3" stop-opacity="0.9"/><stop offset="100%" stop-color="#fef9c3" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <ellipse cx="50" cy="120" rx="26" ry="6" fill="rgba(0,0,0,.45)"/>
                <circle cx="50" cy="60" r="40" fill="url(#${u}-glow)"/>
                <path d="M 38 42 L 12 100 Q 50 115 88 100 L 62 42 Z" fill="url(#${u}-cape)" stroke="#1e1b4b" stroke-width="1.5"/>
                <path d="M 35 38 L 65 38 L 60 95 L 40 95 Z" fill="url(#${u}-armor)" stroke="#334155" stroke-width="2"/>
                <path d="M 35 38 L 50 45 L 65 38 L 60 50 L 40 50 Z" fill="#fbbf24" stroke="#92400e" stroke-width="1"/>
                <circle cx="50" cy="24" r="13" fill="#fcd9b6"/>
                <path d="M 36 18 Q 50 4 64 18 Q 64 30 50 30 Q 36 30 36 18 Z" fill="url(#${u}-armor)" stroke="#334155" stroke-width="1.5"/>
                <rect x="47" y="3" width="6" height="14" rx="2" fill="#fbbf24" filter="drop-shadow(0 0 4px #fbbf24)"/>
                <g transform="translate(78, 80) rotate(-30)">
                    <rect x="-3" y="-46" width="6" height="46" rx="2" fill="#e2e8f0" filter="drop-shadow(0 0 6px #818cf8)"/>
                    <rect x="-9" y="-12" width="18" height="5" rx="1" fill="#fbbf24"/>
                    <rect x="-4" y="-12" width="8" height="20" rx="2" fill="#4338ca"/>
                </g>
                <rect x="20" y="55" width="14" height="34" rx="4" fill="url(#${u}-armor)" stroke="#334155" stroke-width="1.5"/>
            </svg>`;
        },

        /* ================= PETS ================= */
        'Fire Cat C'(entity) {
            const u = this._uid(entity, 'fcat');
            return `<svg viewBox="0 0 100 100" class="w-14 h-14">
                <defs>
                    <radialGradient id="${u}-body" cx="40%" cy="30%" r="75%">
                        <stop offset="0%" stop-color="#fed7aa"/><stop offset="60%" stop-color="#fb923c"/><stop offset="100%" stop-color="#c2410c"/>
                    </radialGradient>
                    <linearGradient id="${u}-tail" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stop-color="#f97316"/><stop offset="100%" stop-color="#fde047"/>
                    </linearGradient>
                </defs>
                <ellipse cx="50" cy="88" rx="18" ry="5" fill="rgba(0,0,0,.4)"/>
                <path d="M 62 68 Q 84 60 80 36 Q 76 44 68 46 Q 78 30 70 18 Q 70 36 58 44" fill="url(#${u}-tail)" filter="drop-shadow(0 0 5px #f97316)"/>
                <ellipse cx="50" cy="60" rx="20" ry="18" fill="url(#${u}-body)" stroke="#9a3412" stroke-width="1.5"/>
                <path d="M 36 46 L 32 32 L 44 42 Z" fill="url(#${u}-body)" stroke="#9a3412" stroke-width="1.5"/>
                <path d="M 64 46 L 68 32 L 56 42 Z" fill="url(#${u}-body)" stroke="#9a3412" stroke-width="1.5"/>
                <circle cx="43" cy="58" r="2.6" fill="#1c1917"/><circle cx="57" cy="58" r="2.6" fill="#1c1917"/>
                <path d="M 47 64 Q 50 67 53 64" stroke="#7c2d12" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                <path d="M 30 62 L 18 60 M 30 66 L 18 68 M 70 62 L 82 60 M 70 66 L 82 68" stroke="#fde68a" stroke-width="1" opacity=".7"/>
            </svg>`;
        },
        'Water Dragon Spirit R'(entity) {
            const u = this._uid(entity, 'wds');
            return `<svg viewBox="0 0 100 110" class="w-16 h-16">
                <defs>
                    <linearGradient id="${u}-body" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#bae6fd"/><stop offset="50%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#0369a1"/>
                    </linearGradient>
                </defs>
                <ellipse cx="50" cy="98" rx="20" ry="5" fill="rgba(0,0,0,.35)"/>
                <path d="M 50 95 Q 18 80 22 50 Q 26 30 50 28 Q 74 30 78 50 Q 82 80 50 95 Z"
                    fill="url(#${u}-body)" stroke="#0c4a6e" stroke-width="2" filter="drop-shadow(0 0 8px #38bdf8)"/>
                <path d="M 30 50 Q 50 38 70 50" stroke="#e0f2fe" stroke-width="2" fill="none" opacity=".7"/>
                <path d="M 28 62 Q 50 52 72 62" stroke="#e0f2fe" stroke-width="2" fill="none" opacity=".5"/>
                <path d="M 36 28 Q 30 14 22 16 Q 28 22 28 30 Z" fill="#7dd3fc"/>
                <path d="M 64 28 Q 70 14 78 16 Q 72 22 72 30 Z" fill="#7dd3fc"/>
                <circle cx="42" cy="44" r="2.6" fill="#082f49"/><circle cx="58" cy="44" r="2.6" fill="#082f49"/>
                <path d="M 44 54 Q 50 58 56 54" stroke="#0c4a6e" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            </svg>`;
        },
        'Wood Spirit Ginseng SR'(entity) {
            const u = this._uid(entity, 'wsg');
            return `<svg viewBox="0 0 100 110" class="w-16 h-16">
                <defs>
                    <linearGradient id="${u}-leaf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#86efac"/><stop offset="100%" stop-color="#15803d"/>
                    </linearGradient>
                    <linearGradient id="${u}-root" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#fde68a"/><stop offset="100%" stop-color="#92400e"/>
                    </linearGradient>
                </defs>
                <ellipse cx="50" cy="98" rx="20" ry="5" fill="rgba(0,0,0,.35)"/>
                <path d="M 50 96 Q 30 90 32 68 Q 22 70 20 56 Q 30 58 36 64 Q 30 44 40 32 Q 38 50 48 60 Q 50 40 50 28 Q 52 40 54 60 Q 64 50 62 32 Q 72 44 66 64 Q 72 58 82 56 Q 80 70 70 68 Q 72 90 50 96 Z"
                    fill="url(#${u}-root)" stroke="#78350f" stroke-width="1.5"/>
                <path d="M 50 30 Q 30 16 14 24 Q 26 28 32 38 Q 40 26 50 30 Z" fill="url(#${u}-leaf)" stroke="#14532d" stroke-width="1"/>
                <path d="M 50 30 Q 70 16 86 24 Q 74 28 68 38 Q 60 26 50 30 Z" fill="url(#${u}-leaf)" stroke="#14532d" stroke-width="1"/>
                <path d="M 50 28 Q 50 10 50 4" stroke="#15803d" stroke-width="3" stroke-linecap="round"/>
                <circle cx="44" cy="66" r="2.4" fill="#451a03"/><circle cx="56" cy="66" r="2.4" fill="#451a03"/>
                <path d="M 46 74 Q 50 77 54 74" stroke="#451a03" stroke-width="1.3" fill="none" stroke-linecap="round"/>
            </svg>`;
        },
        'Light Kirin SSR'(entity) {
            const u = this._uid(entity, 'lk');
            return `<svg viewBox="0 0 110 110" class="w-20 h-20">
                <defs>
                    <linearGradient id="${u}-body" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#fffbeb"/><stop offset="60%" stop-color="#fde68a"/><stop offset="100%" stop-color="#d97706"/>
                    </linearGradient>
                    <linearGradient id="${u}-mane" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#f59e0b"/>
                    </linearGradient>
                </defs>
                <ellipse cx="55" cy="98" rx="26" ry="6" fill="rgba(0,0,0,.4)"/>
                <path d="M 30 70 Q 12 64 16 48 Q 24 56 34 56" fill="url(#${u}-mane)" filter="drop-shadow(0 0 6px #fbbf24)"/>
                <ellipse cx="55" cy="68" rx="26" ry="18" fill="url(#${u}-body)" stroke="#b45309" stroke-width="1.5"/>
                <path d="M 30 58 L 14 64 L 26 50 Z" fill="url(#${u}-body)" stroke="#b45309" stroke-width="1.3"/>
                <circle cx="34" cy="56" r="13" fill="url(#${u}-body)" stroke="#b45309" stroke-width="1.5"/>
                <path d="M 30 44 Q 24 26 32 18 Q 32 32 38 42" fill="none" stroke="#fffbeb" stroke-width="3" stroke-linecap="round" filter="drop-shadow(0 0 5px #fde68a)"/>
                <circle cx="29" cy="54" r="2.4" fill="#451a03"/>
                <path d="M 22 60 Q 26 63 30 61" stroke="#78350f" stroke-width="1.2" fill="none" stroke-linecap="round"/>
                <path d="M 70 60 Q 90 56 96 38 Q 86 44 76 44 Q 84 30 80 18 Q 74 32 64 42" fill="none" stroke="#fbbf24" stroke-width="2" opacity=".8"/>
            </svg>`;
        },
        'Phoenix UR'(entity) { return Sprites.LIBRARY['__phoenix'].call(Sprites, entity); },
        'Pity Phoenix UR'(entity) { return Sprites.LIBRARY['__phoenix'].call(Sprites, entity); },
        '__phoenix'(entity) {
            const u = this._uid(entity, 'phx');
            return `<svg viewBox="0 0 120 120" class="w-20 h-20">
                <defs>
                    <linearGradient id="${u}-wing" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#fde047"/><stop offset="50%" stop-color="#fb923c"/><stop offset="100%" stop-color="#dc2626"/>
                    </linearGradient>
                    <linearGradient id="${u}-body" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#ea580c"/>
                    </linearGradient>
                </defs>
                <ellipse cx="60" cy="106" rx="28" ry="6" fill="rgba(0,0,0,.4)"/>
                <path d="M 58 70 Q 20 56 10 24 Q 36 32 50 48 Q 44 28 54 14 Q 56 34 62 50" fill="url(#${u}-wing)" filter="drop-shadow(0 0 10px #f97316)"/>
                <path d="M 62 70 Q 100 56 110 24 Q 84 32 70 48 Q 76 28 66 14 Q 64 34 58 50" fill="url(#${u}-wing)" filter="drop-shadow(0 0 10px #f97316)"/>
                <ellipse cx="60" cy="68" rx="14" ry="20" fill="url(#${u}-body)" stroke="#9a3412" stroke-width="1.5"/>
                <path d="M 52 50 Q 44 38 50 30 Q 56 40 58 52 Z" fill="url(#${u}-body)" stroke="#9a3412" stroke-width="1.3"/>
                <circle cx="56" cy="48" r="2.3" fill="#450a0a"/>
                <path d="M 46 48 L 36 44 L 46 52 Z" fill="#fbbf24"/>
                <path d="M 50 88 Q 40 105 26 110 Q 38 92 44 84 Z" fill="url(#${u}-wing)" opacity=".9"/>
                <path d="M 70 88 Q 80 105 94 110 Q 82 92 76 84 Z" fill="url(#${u}-wing)" opacity=".9"/>
            </svg>`;
        },

        /* ================= COMPANIONS ================= */
        'Swordsman C'(entity) {
            const u = this._uid(entity, 'sw');
            return `<svg viewBox="0 0 100 120" class="w-20 h-20">
                <defs>
                    <linearGradient id="${u}-armor" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#cbd5e1"/><stop offset="100%" stop-color="#475569"/>
                    </linearGradient>
                </defs>
                <ellipse cx="50" cy="110" rx="24" ry="6" fill="rgba(0,0,0,.4)"/>
                <path d="M 38 38 L 62 38 L 57 92 L 43 92 Z" fill="url(#${u}-armor)" stroke="#1e293b" stroke-width="2"/>
                <rect x="44" y="44" width="12" height="6" fill="#334155"/>
                <circle cx="50" cy="24" r="11" fill="#e7b692"/>
                <path d="M 38 20 Q 50 8 62 20 L 62 26 Q 50 16 38 26 Z" fill="#7c2d12"/>
                <rect x="18" y="48" width="12" height="32" rx="4" fill="url(#${u}-armor)" stroke="#1e293b" stroke-width="1.5"/>
                <g transform="translate(74, 70) rotate(-25)">
                    <rect x="-3" y="-40" width="6" height="40" rx="2" fill="#e2e8f0"/>
                    <rect x="-9" y="-6" width="18" height="5" fill="#fbbf24"/>
                    <rect x="-4" y="-6" width="8" height="16" fill="#451a03"/>
                </g>
            </svg>`;
        },
        'Mage R'(entity) {
            const u = this._uid(entity, 'mg');
            return `<svg viewBox="0 0 100 120" class="w-20 h-20">
                <defs>
                    <linearGradient id="${u}-robe" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#4c1d95"/>
                    </linearGradient>
                </defs>
                <ellipse cx="50" cy="110" rx="24" ry="6" fill="rgba(0,0,0,.4)"/>
                <path d="M 50 40 L 22 100 Q 50 112 78 100 Z" fill="url(#${u}-robe)" stroke="#2e1065" stroke-width="2"/>
                <path d="M 38 20 Q 50 4 62 20 Q 60 38 50 42 Q 40 38 38 20 Z" fill="url(#${u}-robe)" stroke="#2e1065" stroke-width="1.5"/>
                <circle cx="50" cy="24" r="9" fill="#1e1b2e"/>
                <g transform="translate(76, 50)">
                    <rect x="-2" y="-44" width="4" height="50" fill="#78350f"/>
                    <circle cx="0" cy="-48" r="9" fill="#60a5fa" filter="drop-shadow(0 0 10px #60a5fa)"/>
                </g>
                <path d="M 36 100 Q 50 90 64 100" stroke="#c4b5fd" stroke-width="1.5" fill="none" opacity=".7"/>
            </svg>`;
        },
        'Guardian SR'(entity) {
            const u = this._uid(entity, 'gd');
            return `<svg viewBox="0 0 100 120" class="w-20 h-20">
                <defs>
                    <linearGradient id="${u}-armor" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#5eead4"/><stop offset="60%" stop-color="#0d9488"/><stop offset="100%" stop-color="#134e4a"/>
                    </linearGradient>
                </defs>
                <ellipse cx="50" cy="112" rx="27" ry="6" fill="rgba(0,0,0,.45)"/>
                <path d="M 32 40 L 68 40 L 64 95 L 36 95 Z" fill="url(#${u}-armor)" stroke="#042f2e" stroke-width="2.5"/>
                <circle cx="50" cy="24" r="13" fill="url(#${u}-armor)" stroke="#042f2e" stroke-width="2"/>
                <rect x="42" y="20" width="16" height="4" fill="#042f2e"/>
                <ellipse cx="22" cy="68" rx="13" ry="26" fill="#134e4a" stroke="#5eead4" stroke-width="2" filter="drop-shadow(0 0 6px #2dd4bf)"/>
                <path d="M 22 50 L 22 86" stroke="#5eead4" stroke-width="1.5"/>
                <rect x="64" y="55" width="10" height="30" rx="3" fill="url(#${u}-armor)" stroke="#042f2e" stroke-width="1.5"/>
            </svg>`;
        },
        'Assassin SSR'(entity) {
            const u = this._uid(entity, 'as');
            return `<svg viewBox="0 0 100 120" class="w-20 h-20">
                <defs>
                    <linearGradient id="${u}-cloak" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#6b21a8"/><stop offset="100%" stop-color="#1e0a30"/>
                    </linearGradient>
                </defs>
                <ellipse cx="50" cy="110" rx="22" ry="5" fill="rgba(0,0,0,.4)"/>
                <path d="M 50 36 L 26 100 Q 50 110 74 100 Z" fill="url(#${u}-cloak)" stroke="#0f0518" stroke-width="2"/>
                <path d="M 34 30 Q 50 10 66 30 Q 64 46 50 50 Q 36 46 34 30 Z" fill="url(#${u}-cloak)" stroke="#0f0518" stroke-width="1.5"/>
                <ellipse cx="44" cy="32" rx="2.3" ry="3" fill="#f472b6" filter="drop-shadow(0 0 4px #f472b6)"/>
                <ellipse cx="56" cy="32" rx="2.3" ry="3" fill="#f472b6" filter="drop-shadow(0 0 4px #f472b6)"/>
                <g transform="translate(26,72) rotate(20)"><rect x="-1.5" y="-18" width="3" height="18" fill="#e2e8f0"/><rect x="-5" y="-2" width="10" height="4" fill="#1e1b2e"/></g>
                <g transform="translate(74,72) rotate(-20)"><rect x="-1.5" y="-18" width="3" height="18" fill="#e2e8f0"/><rect x="-5" y="-2" width="10" height="4" fill="#1e1b2e"/></g>
            </svg>`;
        },
        'Thunder God Sentinel UR'(entity) { return Sprites.LIBRARY['__thundergod'].call(Sprites, entity); },
        'Pity Thunder God UR'(entity) { return Sprites.LIBRARY['__thundergod'].call(Sprites, entity); },
        '__thundergod'(entity) {
            const u = this._uid(entity, 'tg');
            return `<svg viewBox="0 0 100 130" class="w-20 h-20">
                <defs>
                    <linearGradient id="${u}-armor" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#e9d5ff"/><stop offset="50%" stop-color="#a855f7"/><stop offset="100%" stop-color="#581c87"/>
                    </linearGradient>
                </defs>
                <ellipse cx="50" cy="120" rx="27" ry="6" fill="rgba(0,0,0,.45)"/>
                <path d="M 30 70 L 6 30 L 26 38 L 18 14 L 40 44 Z" fill="#fde047" filter="drop-shadow(0 0 8px #facc15)"/>
                <path d="M 35 40 L 65 40 L 60 96 L 40 96 Z" fill="url(#${u}-armor)" stroke="#3b0764" stroke-width="2.5"/>
                <circle cx="50" cy="24" r="13" fill="url(#${u}-armor)" stroke="#3b0764" stroke-width="2"/>
                <path d="M 32 16 Q 50 -2 68 16 L 64 24 Q 50 10 36 24 Z" fill="#581c87" stroke="#fde047" stroke-width="1.5"/>
                <g transform="translate(76,82) rotate(-20)">
                    <rect x="-3" y="-50" width="6" height="50" rx="2" fill="#e9d5ff" filter="drop-shadow(0 0 6px #a855f7)"/>
                    <path d="M -12 -50 L 0 -64 L 12 -50 Z" fill="#fde047"/>
                </g>
                <rect x="18" y="58" width="14" height="32" rx="4" fill="url(#${u}-armor)" stroke="#3b0764" stroke-width="1.5"/>
            </svg>`;
        },

        /* ================= ENEMIES ================= */
        'Colossal Golem'(entity) {
            const u = this._uid(entity, 'cg');
            return `<svg viewBox="0 0 110 120" class="w-24 h-24">
                <defs>
                    <linearGradient id="${u}-rock" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#a8a29e"/><stop offset="60%" stop-color="#78716c"/><stop offset="100%" stop-color="#44403c"/>
                    </linearGradient>
                </defs>
                <ellipse cx="55" cy="112" rx="32" ry="7" fill="rgba(0,0,0,.45)"/>
                <path d="M 30 50 L 80 50 L 74 100 L 36 100 Z" fill="url(#${u}-rock)" stroke="#292524" stroke-width="3"/>
                <path d="M 38 58 L 50 66 L 62 58 L 70 70 L 58 78 L 70 86 L 60 96 L 46 88 L 36 96 L 30 84 L 42 76 L 30 70 Z" fill="#57534e" opacity=".5"/>
                <ellipse cx="55" cy="32" rx="20" ry="18" fill="url(#${u}-rock)" stroke="#292524" stroke-width="3"/>
                <circle cx="47" cy="30" r="3.4" fill="#fbbf24" filter="drop-shadow(0 0 6px #f59e0b)"/>
                <circle cx="63" cy="30" r="3.4" fill="#fbbf24" filter="drop-shadow(0 0 6px #f59e0b)"/>
                <rect x="6" y="54" width="20" height="44" rx="6" fill="url(#${u}-rock)" stroke="#292524" stroke-width="3"/>
                <rect x="84" y="54" width="20" height="44" rx="6" fill="url(#${u}-rock)" stroke="#292524" stroke-width="3"/>
                <rect x="36" y="100" width="16" height="16" rx="3" fill="url(#${u}-rock)" stroke="#292524" stroke-width="2.5"/>
                <rect x="58" y="100" width="16" height="16" rx="3" fill="url(#${u}-rock)" stroke="#292524" stroke-width="2.5"/>
            </svg>`;
        },
        'Wind Demon Griffin'(entity) {
            const u = this._uid(entity, 'wdg');
            return `<svg viewBox="0 0 120 120" class="w-24 h-24">
                <defs>
                    <linearGradient id="${u}-wing" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#bbf7d0"/><stop offset="60%" stop-color="#4ade80"/><stop offset="100%" stop-color="#166534"/>
                    </linearGradient>
                    <linearGradient id="${u}-body" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#fef9c3"/><stop offset="100%" stop-color="#a16207"/>
                    </linearGradient>
                </defs>
                <ellipse cx="60" cy="108" rx="30" ry="6" fill="rgba(0,0,0,.4)"/>
                <path d="M 56 64 Q 14 50 6 16 Q 32 24 48 42 Q 42 22 52 8 Q 56 28 62 46" fill="url(#${u}-wing)" filter="drop-shadow(0 0 8px #22c55e)"/>
                <path d="M 64 64 Q 106 50 114 16 Q 88 24 72 42 Q 78 22 68 8 Q 64 28 58 46" fill="url(#${u}-wing)" filter="drop-shadow(0 0 8px #22c55e)"/>
                <ellipse cx="60" cy="72" rx="18" ry="24" fill="url(#${u}-body)" stroke="#78350f" stroke-width="2"/>
                <path d="M 48 48 Q 38 32 46 20 Q 56 30 56 50 Z" fill="url(#${u}-body)" stroke="#78350f" stroke-width="1.5"/>
                <path d="M 46 32 L 36 22 L 48 36 Z" fill="#facc15"/>
                <circle cx="52" cy="42" r="2.6" fill="#1c1917"/>
                <path d="M 40 46 L 28 52 L 40 50 Z" fill="#facc15"/>
                <path d="M 50 92 L 40 110 M 60 96 L 58 112 M 70 92 L 78 110" stroke="#a16207" stroke-width="3" stroke-linecap="round"/>
            </svg>`;
        },
        'Water Dragon Hatchling'(entity) {
            const u = this._uid(entity, 'wdh');
            return `<svg viewBox="0 0 100 100" class="w-16 h-16">
                <defs>
                    <radialGradient id="${u}-body" cx="40%" cy="30%" r="75%">
                        <stop offset="0%" stop-color="#cffafe"/><stop offset="60%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#0e7490"/>
                    </radialGradient>
                </defs>
                <ellipse cx="50" cy="88" rx="20" ry="5" fill="rgba(0,0,0,.35)"/>
                <ellipse cx="50" cy="60" rx="22" ry="20" fill="url(#${u}-body)" stroke="#155e75" stroke-width="2" filter="drop-shadow(0 0 6px #22d3ee)"/>
                <path d="M 70 56 Q 88 50 90 36 Q 80 42 72 44 Z" fill="url(#${u}-body)" stroke="#155e75" stroke-width="1.5"/>
                <path d="M 32 44 L 26 30 L 38 40 Z" fill="#a5f3fc"/>
                <path d="M 68 44 L 74 30 L 62 40 Z" fill="#a5f3fc"/>
                <circle cx="42" cy="56" r="3" fill="#082f49"/><circle cx="58" cy="56" r="3" fill="#082f49"/>
                <path d="M 30 64 Q 26 78 14 82 Q 24 70 26 60 Z" fill="url(#${u}-body)"/>
                <path d="M 44 66 Q 50 70 56 66" stroke="#0e7490" stroke-width="1.5" fill="none" stroke-linecap="round"/>
            </svg>`;
        },
        'Pyro Golem Demon'(entity) {
            const u = this._uid(entity, 'pgd');
            return `<svg viewBox="0 0 110 120" class="w-24 h-24">
                <defs>
                    <linearGradient id="${u}-rock" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#57534e"/><stop offset="100%" stop-color="#1c1917"/>
                    </linearGradient>
                    <linearGradient id="${u}-lava" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#fde047"/><stop offset="60%" stop-color="#f97316"/><stop offset="100%" stop-color="#b91c1c"/>
                    </linearGradient>
                </defs>
                <ellipse cx="55" cy="112" rx="32" ry="7" fill="rgba(0,0,0,.45)"/>
                <path d="M 30 50 L 80 50 L 73 100 L 37 100 Z" fill="url(#${u}-rock)" stroke="#0c0a09" stroke-width="3"/>
                <path d="M 40 56 L 50 62 L 46 76 L 58 80 L 50 96" stroke="url(#${u}-lava)" stroke-width="3" fill="none" filter="drop-shadow(0 0 6px #f97316)"/>
                <ellipse cx="55" cy="32" rx="19" ry="17" fill="url(#${u}-rock)" stroke="#0c0a09" stroke-width="3"/>
                <path d="M 44 20 L 40 6 M 66 20 L 70 6" stroke="#1c1917" stroke-width="4" stroke-linecap="round"/>
                <circle cx="47" cy="30" r="3.6" fill="url(#${u}-lava)" filter="drop-shadow(0 0 8px #f97316)"/>
                <circle cx="63" cy="30" r="3.6" fill="url(#${u}-lava)" filter="drop-shadow(0 0 8px #f97316)"/>
                <rect x="6" y="54" width="18" height="42" rx="6" fill="url(#${u}-rock)" stroke="#0c0a09" stroke-width="3"/>
                <rect x="86" y="54" width="18" height="42" rx="6" fill="url(#${u}-rock)" stroke="#0c0a09" stroke-width="3"/>
            </svg>`;
        },
        'Thunder Dragon God Lance'(entity) {
            const u = this._uid(entity, 'tdgl');
            return `<svg viewBox="0 0 110 130" class="w-24 h-24">
                <defs>
                    <linearGradient id="${u}-armor" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#e9d5ff"/><stop offset="50%" stop-color="#9333ea"/><stop offset="100%" stop-color="#3b0764"/>
                    </linearGradient>
                </defs>
                <ellipse cx="55" cy="122" rx="30" ry="6" fill="rgba(0,0,0,.45)"/>
                <path d="M 30 70 L 4 30 L 26 38 L 16 12 L 40 44 Z" fill="#facc15" filter="drop-shadow(0 0 8px #fde047)"/>
                <path d="M 36 42 L 74 42 L 68 100 L 42 100 Z" fill="url(#${u}-armor)" stroke="#2e1065" stroke-width="2.5"/>
                <ellipse cx="55" cy="26" rx="15" ry="14" fill="url(#${u}-armor)" stroke="#2e1065" stroke-width="2.5"/>
                <path d="M 42 14 L 36 -2 M 68 14 L 74 -2" stroke="#9333ea" stroke-width="3.5" stroke-linecap="round" filter="drop-shadow(0 0 6px #c084fc)"/>
                <circle cx="48" cy="26" r="2.6" fill="#fde047" filter="drop-shadow(0 0 5px #facc15)"/>
                <circle cx="62" cy="26" r="2.6" fill="#fde047" filter="drop-shadow(0 0 5px #facc15)"/>
                <g transform="translate(90,76) rotate(20)">
                    <rect x="-3" y="-58" width="6" height="58" rx="2" fill="#e9d5ff"/>
                    <path d="M -14 -58 L 0 -78 L 14 -58 Z" fill="#facc15" filter="drop-shadow(0 0 6px #fde047)"/>
                </g>
                <rect x="18" y="58" width="16" height="34" rx="5" fill="url(#${u}-armor)" stroke="#2e1065" stroke-width="2"/>
            </svg>`;
        }
    }
};
