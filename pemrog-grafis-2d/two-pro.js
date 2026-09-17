const canvas = document.getElementById("MyCanvas");
        const ctx = canvas.getContext("2d");

        const GROUND_Y = 300;               // batas atas tanah, area main = 0..300
        const GAME_DURATION = 60;           // detik, durasi utama permainan
        const GRACE_PERIOD = 5;             // detik toleransi tambahan saat waktu habis

        // =========================================================
        // CLASS: SpritePlayer  (karakter "bola agak mengotak")
        // =========================================================
        class SpritePlayer {
            constructor(x, y, width, height, warna) {
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = height;
                this.warna = warna;
                this.velocityY = 0;
            }

            draw(context) {
                // badan berbentuk kotak dengan sudut sedikit membulat -> "bola mengotak"
                const r = 10;
                context.beginPath();
                context.moveTo(this.x + r, this.y);
                context.lineTo(this.x + this.width - r, this.y);
                context.arcTo(this.x + this.width, this.y, this.x + this.width, this.y + r, r);
                context.lineTo(this.x + this.width, this.y + this.height - r);
                context.arcTo(this.x + this.width, this.y + this.height, this.x + this.width - r, this.y + this.height, r);
                context.lineTo(this.x + r, this.y + this.height);
                context.arcTo(this.x, this.y + this.height, this.x, this.y + this.height - r, r);
                context.lineTo(this.x, this.y + r);
                context.arcTo(this.x, this.y, this.x + r, this.y, r);
                context.closePath();

                context.fillStyle = this.warna;
                context.fill();
                context.lineWidth = 3;
                context.strokeStyle = "#000000";
                context.stroke();

                // mata sederhana
                context.fillStyle = "#FFFFFF";
                context.fillRect(this.x + this.width - 16, this.y + 8, 8, 10);
                context.fillStyle = "#000000";
                context.fillRect(this.x + this.width - 13, this.y + 11, 3, 4);

                // topi digambar terakhir agar selalu di atas kepala
                this.drawHat(context);
            }

            // Tugas mandiri #2: menggambar topi ala Mario dengan kombinasi fillRect()
            drawHat(context) {
                // bagian pinggir topi (brim) - lebih lebar dari kepala
                context.fillStyle = "#e52521";
                context.fillRect(this.x - 6, this.y - 6, this.width + 12, 6);

                // bagian atas/mahkota topi
                context.fillRect(this.x + 2, this.y - 18, this.width - 4, 14);

                // emblem kecil di tengah topi
                context.fillStyle = "#FFFFFF";
                context.fillRect(this.x + this.width / 2 - 5, this.y - 14, 10, 8);

                // outline biar terlihat seperti sprite pixel-art
                context.strokeStyle = "#000000";
                context.lineWidth = 2;
                context.strokeRect(this.x - 6, this.y - 6, this.width + 12, 6);
                context.strokeRect(this.x + 2, this.y - 18, this.width - 4, 14);
            }
        }

        // =========================================================
        // CLASS: PipeObstacle (Tugas mandiri #1)
        // =========================================================
        class PipeObstacle {
            constructor(x, y, width, height, warna) {
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = height;
                this.warna = warna;
                this.isTop = false; // diset dari luar saat pipa dibuat (bukan bagian wajib properti)
            }

            draw(context) {
                // badan pipa
                context.fillStyle = this.warna;
                context.fillRect(this.x, this.y, this.width, this.height);
                context.lineWidth = 3;
                context.strokeStyle = "#0d5c0d";
                context.strokeRect(this.x, this.y, this.width, this.height);

                // bibir/lip pipa ala Mario Bros - lebih lebar dari badan pipa
                const capHeight = 22;
                const overhang = 8;
                context.fillStyle = "#2e9e1d";

                if (this.isTop) {
                    // pipa dari atas, mulut pipa menghadap ke bawah
                    const capY = this.y + this.height - capHeight;
                    context.fillRect(this.x - overhang, capY, this.width + overhang * 2, capHeight);
                    context.strokeRect(this.x - overhang, capY, this.width + overhang * 2, capHeight);
                } else {
                    // pipa dari bawah, mulut pipa menghadap ke atas
                    context.fillRect(this.x - overhang, this.y, this.width + overhang * 2, capHeight);
                    context.strokeRect(this.x - overhang, this.y, this.width + overhang * 2, capHeight);
                }
            }
        }

        // =========================================================
        // CLASS: Coin (koin koleksi di tiap rintangan)
        // =========================================================
        class Coin {
            constructor(x, y, radius) {
                this.x = x;
                this.y = y;
                this.radius = radius;
            }
            draw(context) {
                context.beginPath();
                context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                context.fillStyle = "#FBD000"; // Kuning
                context.fill();
                context.lineWidth = 2;
                context.strokeStyle = "#000000";
                context.stroke();
                context.closePath();

                // aksen dalam biar terlihat seperti keping koin
                context.beginPath();
                context.arc(this.x, this.y, this.radius - 4, 0, Math.PI * 2);
                context.strokeStyle = "#c9a100";
                context.lineWidth = 2;
                context.stroke();
                context.closePath();
            }
        }

        // =========================================================
        // Fungsi gambar lingkungan (tanah/rumput)
        // =========================================================
        function drawEnvironment() {
            ctx.fillStyle = "#e52521"; // Merah Bata
            ctx.fillRect(0, GROUND_Y, canvas.width, 50);

            ctx.fillStyle = "#00a800"; // Hijau rumput
            ctx.fillRect(0, GROUND_Y, canvas.width, 10);
        }

        function drawHUD() {
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 16px Arial";
            ctx.fillText("SCORE: " + String(score).padStart(3, "0"), 16, 24);

            // indikator koin digambar manual (bukan emoji) agar pasti tampil di semua browser
            const coinIconX = 24;
            const coinIconY = 42;
            ctx.beginPath();
            ctx.arc(coinIconX, coinIconY, 8, 0, Math.PI * 2);
            ctx.fillStyle = "#FBD000";
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#000000";
            ctx.stroke();
            ctx.closePath();

            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 14px Arial";
            ctx.fillText("x " + coinsCollected, coinIconX + 13, coinIconY + 5);

            const sisaWaktu = Math.max(0, Math.ceil(remainingTime()));
            ctx.textAlign = "right";
            ctx.font = "bold 16px Arial";
            ctx.fillText("WAKTU: " + sisaWaktu + "s", canvas.width - 16, 24);
            ctx.textAlign = "left";
        }

        // =========================================================
        // SFX - dibuat sendiri lewat Web Audio API (synth nada),
        // jadi 100% original, tanpa file audio pihak ketiga.
        // =========================================================
        let audioCtx = null;

        function getAudioCtx() {
            if (!audioCtx) {
                const AudioCtor = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtor) return null;
                audioCtx = new AudioCtor();
            }
            if (audioCtx.state === "suspended") {
                audioCtx.resume();
            }
            return audioCtx;
        }

        // nada tunggal dengan envelope halus (naik/turun pitch opsional)
        function playTone(freq, duration, type, volume, delay, freqEnd) {
            const ac = getAudioCtx();
            if (!ac) return;
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            const t0 = ac.currentTime + (delay || 0);

            osc.type = type || "sine";
            osc.frequency.setValueAtTime(freq, t0);
            if (freqEnd) {
                osc.frequency.linearRampToValueAtTime(freqEnd, t0 + duration);
            }

            gain.gain.setValueAtTime(volume || 0.2, t0);
            gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

            osc.connect(gain);
            gain.connect(ac.destination);
            osc.start(t0);
            osc.stop(t0 + duration + 0.03);
        }

        // ledakan noise pendek untuk efek "tabrakan"
        function playNoiseBurst(duration, volume) {
            const ac = getAudioCtx();
            if (!ac) return;
            const bufferSize = Math.floor(ac.sampleRate * duration);
            const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }
            const noise = ac.createBufferSource();
            noise.buffer = buffer;
            const gain = ac.createGain();
            gain.gain.setValueAtTime(volume || 0.25, ac.currentTime);
            noise.connect(gain);
            gain.connect(ac.destination);
            noise.start();
        }

        // 1) suara saat lompat (space/klik/tap)
        function sfxFlap() {
            playTone(520, 0.09, "square", 0.15, 0, 760);
        }

        // 2) suara saat koin diambil - dua nada cepat ala coin klasik
        function sfxCoin() {
            playTone(988, 0.08, "square", 0.2, 0);
            playTone(1318, 0.12, "square", 0.2, 0.08);
        }

        // 3) suara saat menabrak - noise + nada rendah menukik
        function sfxCrash() {
            playNoiseBurst(0.22, 0.3);
            playTone(160, 0.3, "sawtooth", 0.25, 0, 55);
        }

        // 4) suara ketika berhasil menang - arpeggio naik/riang
        function sfxWin() {
            playTone(523.25, 0.15, "square", 0.2, 0);     // C5
            playTone(659.25, 0.15, "square", 0.2, 0.15);  // E5
            playTone(783.99, 0.15, "square", 0.2, 0.3);   // G5
            playTone(1046.5, 0.25, "square", 0.22, 0.45); // C6
        }

        // 5) suara ketika kalah - nada turun/murung, dipanggil beberapa saat setelah sfxCrash()
        function sfxLose() {
            playTone(392.0, 0.2, "triangle", 0.2, 0);     // G4
            playTone(329.63, 0.2, "triangle", 0.2, 0.2);  // E4
            playTone(261.63, 0.2, "triangle", 0.2, 0.4);  // C4
            playTone(196.0, 0.35, "triangle", 0.22, 0.6); // G3
        }

        // =========================================================
        // State permainan & objek
        // =========================================================
        let player;
        let pipePairs = [];
        let score = 0;
        let coinsCollected = 0;
        let state = "ready"; // "ready" | "playing" | "ended"
        let endReason = "";
        let startTime = 0;
        let lastFrameTime = 0;
        let spawnTimer = 0;
        let spawnInterval = 1900;

        const PLAYER_START_X = 120;
        const PLAYER_START_Y = 130;
        const GRAVITY = 0.55;
        const FLAP_VELOCITY = -7.6;

        function lerp(a, b, t) {
            return a + (b - a) * t;
        }

        // Kesulitan naik bertahap: gap pipa makin kecil, kecepatan makin cepat
        function getDifficulty(elapsedSeconds) {
            const t = Math.min(elapsedSeconds / GAME_DURATION, 1);
            return {
                gap: lerp(170, 100, t),
                speed: lerp(2.2, 4.2, t),
                interval: lerp(1900, 1250, t)
            };
        }

        function elapsedTime() {
            if (state === "ready") return 0;
            return (performance.now() - startTime) / 1000;
        }

        function remainingTime() {
            return GAME_DURATION - elapsedTime();
        }

        function createPipePair(xPos, gapOverride) {
            const diff = getDifficulty(Math.max(0, elapsedTime()));
            const gap = gapOverride !== undefined ? gapOverride : diff.gap;
            const margin = 40;
            const gapCenter = margin + gap / 2 + Math.random() * (GROUND_Y - margin * 2 - gap);

            const topHeight = gapCenter - gap / 2;
            const bottomY = gapCenter + gap / 2;
            const bottomHeight = GROUND_Y - bottomY;

            const pipeWidth = 46;
            const pipeColor = "#3DBE29";

            const top = new PipeObstacle(xPos, 0, pipeWidth, topHeight, pipeColor);
            top.isTop = true;
            const bottom = new PipeObstacle(xPos, bottomY, pipeWidth, bottomHeight, pipeColor);
            bottom.isTop = false;

            // koin diletakkan di tengah celah, di antara pipa atas dan bawah
            const coin = new Coin(xPos + pipeWidth / 2, gapCenter, 12);

            return { top, bottom, coin, coinCollected: false, scored: false };
        }

        function resetGame() {
            player = new SpritePlayer(PLAYER_START_X, PLAYER_START_Y, 36, 36, "#e52521");
            score = 0;
            coinsCollected = 0;
            endReason = "";
            spawnTimer = 0;
            spawnInterval = 1900;

            // Tugas mandiri #3: minimal 2 objek PipeObstacle langsung tampil di canvas
            pipePairs = [
                createPipePair(380, 165),
                createPipePair(520, 140)
            ];

            state = "ready";
        }

        function flap() {
            if (state === "ready") {
                state = "playing";
                startTime = performance.now();
                lastFrameTime = startTime;
            }
            if (state === "playing") {
                player.velocityY = FLAP_VELOCITY;
                sfxFlap();
            }
        }

        function endGame(reason) {
            if (state === "ended") return; // sudah pernah disimpan, jangan dobel
            const sedangBermain = state === "playing";
            state = "ended";
            endReason = reason;
            if (sedangBermain) {
                saveRunScore(score);

                if (reason === "Waktu habis!") {
                    sfxWin(); // 4) berhasil menang - selesai sampai batas waktu
                } else if (reason === "Nabrak pipa!" || reason === "Kena tanah!") {
                    sfxCrash(); // 3) suara tabrakan
                    setTimeout(sfxLose, 650); // 5) suara kalah, muncul beberapa saat setelah tabrakan
                }
            }
        }

        // =========================================================
        // Local storage: simpan 5 skor run terakhir
        // =========================================================
        const LEADERBOARD_KEY = "marioFlappyLastRuns";

        function getSavedRuns() {
            try {
                const data = JSON.parse(localStorage.getItem(LEADERBOARD_KEY));
                return Array.isArray(data) ? data : [];
            } catch (e) {
                return [];
            }
        }

        function saveRunScore(finalScore) {
            try {
                const runs = getSavedRuns();
                runs.unshift(finalScore);       // skor terbaru diletakkan paling depan
                const trimmed = runs.slice(0, 5); // simpan cuma 5 run terakhir
                localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
            } catch (e) {
                // localStorage tidak tersedia (misal mode privat) - abaikan saja
                console.warn("Tidak bisa menyimpan skor:", e);
            }
        }

        function renderHistoryView() {
            const runs = getSavedRuns();
            const content = document.getElementById("leaderboardContent");
            if (runs.length === 0) {
                content.innerHTML = '<p class="lb-empty">Belum ada riwayat. Main dulu, yuk!</p>';
                return;
            }
            let html = '<ol class="lb-list">';
            runs.forEach((s, i) => {
                const label = i === 0 ? "Run terbaru" : (i + 1) + " run lalu";
                html += "<li><span>" + label + "</span><span class=\"lb-score\">" + s + "</span></li>";
            });
            html += "</ol>";
            content.innerHTML = html;
        }

        function renderTop3View() {
            const runs = getSavedRuns();
            const content = document.getElementById("leaderboardContent");
            if (runs.length === 0) {
                content.innerHTML = '<p class="lb-empty">Belum ada data. Main dulu, yuk!</p>';
                return;
            }
            const top3 = [...runs].sort((a, b) => b - a).slice(0, 3);
            const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"]; // emas, perak, perunggu
            let html = '<div class="lb-top3">';
            top3.forEach((s, i) => {
                html += '<div class="lb-medal" style="background:' + medalColors[i] + '">' +
                    '<span class="lb-rank">#' + (i + 1) + '</span>' +
                    '<span class="lb-score">' + s + '</span>' +
                    '</div>';
            });
            html += "</div>";
            content.innerHTML = html;
        }

        function checkCollision(rectA, rectB) {
            return (
                rectA.x < rectB.x + rectB.width &&
                rectA.x + rectA.width > rectB.x &&
                rectA.y < rectB.y + rectB.height &&
                rectA.y + rectA.height > rectB.y
            );
        }

        function update(dtMs) {
            const dt = dtMs / 16.67; // normalisasi terhadap 60fps

            // fisika gravitasi & lompat
            player.velocityY += GRAVITY * dt;
            player.y += player.velocityY * dt;

            if (player.y < 0) {
                player.y = 0;
                player.velocityY = 0;
            }
            if (player.y + player.height >= GROUND_Y) {
                player.y = GROUND_Y - player.height;
                endGame("Kena tanah!");
                return;
            }

            const elapsed = elapsedTime();
            const diff = getDifficulty(elapsed);

            // gerakkan & cek pipa
            const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
            for (const pair of pipePairs) {
                pair.top.x -= diff.speed * dt;
                pair.bottom.x -= diff.speed * dt;
                pair.coin.x -= diff.speed * dt;

                if (checkCollision(playerRect, pair.top) || checkCollision(playerRect, pair.bottom)) {
                    endGame("Nabrak pipa!");
                    return;
                }

                if (!pair.scored && pair.top.x + pair.top.width < player.x) {
                    pair.scored = true;
                    score += 1;
                }

                if (!pair.coinCollected) {
                    const coinBox = {
                        x: pair.coin.x - pair.coin.radius,
                        y: pair.coin.y - pair.coin.radius,
                        width: pair.coin.radius * 2,
                        height: pair.coin.radius * 2
                    };
                    if (checkCollision(playerRect, coinBox)) {
                        pair.coinCollected = true;
                        coinsCollected += 1;
                        score += 5; // bonus poin ambil koin
                        sfxCoin(); // 2) suara koin diperoleh
                    }
                }
            }

            // buang pipa yang sudah keluar layar
            pipePairs = pipePairs.filter(p => p.top.x + p.top.width > -10);

            // spawn pipa baru
            spawnTimer += dtMs;
            if (spawnTimer >= diff.interval) {
                spawnTimer = 0;
                pipePairs.push(createPipePair(canvas.width + 20));
            }

            // waktu habis + toleransi
            if (elapsed >= GAME_DURATION) {
                const overTime = elapsed - GAME_DURATION;
                const pipaMasihDekat = pipePairs.some(p =>
                    p.top.x < player.x + 120 && p.top.x + p.top.width > player.x - 40
                );
                if (!pipaMasihDekat || overTime >= GRACE_PERIOD) {
                    endGame("Waktu habis!");
                }
            }
        }

        function drawReadyOverlay() {
            ctx.fillStyle = "rgba(0,0,0,0.45)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 22px Arial";
            ctx.textAlign = "center";
            ctx.fillText("MARIO FLAPPY", canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = "16px Arial";
            ctx.fillText("Klik / tekan SPACE untuk mulai", canvas.width / 2, canvas.height / 2 + 10);
            ctx.textAlign = "left";
        }

        function drawEndOverlay() {
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#FFFFFF";
            ctx.textAlign = "center";
            ctx.font = "bold 22px Arial";
            ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 35);
            ctx.font = "16px Arial";
            ctx.fillText(endReason, canvas.width / 2, canvas.height / 2 - 8);
            ctx.font = "bold 20px Arial";
            ctx.fillText("SCORE AKHIR: " + score, canvas.width / 2, canvas.height / 2 + 22);
            ctx.font = "14px Arial";
            ctx.fillText("Koin terkumpul: " + coinsCollected, canvas.width / 2, canvas.height / 2 + 46);
            ctx.fillText("Gunakan tombol di bawah canvas", canvas.width / 2, canvas.height / 2 + 66);
            ctx.textAlign = "left";
        }

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // langit
            ctx.fillStyle = "#5c94fc";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            drawEnvironment();

            for (const pair of pipePairs) {
                pair.top.draw(ctx);
                pair.bottom.draw(ctx);
                if (!pair.coinCollected) {
                    pair.coin.draw(ctx);
                }
            }

            player.draw(ctx);
            drawHUD();

            if (state === "ready") drawReadyOverlay();
            if (state === "ended") drawEndOverlay();
        }

        function loop(timestamp) {
            if (state === "playing") {
                const dtMs = Math.min(timestamp - lastFrameTime, 50); // batasi lonjakan dt
                lastFrameTime = timestamp;
                update(dtMs);
            } else {
                lastFrameTime = timestamp;
            }
            render();
            requestAnimationFrame(loop);
        }

        // =========================================================
        // Input & tombol kontrol
        // =========================================================
        canvas.addEventListener("click", flap);
        canvas.addEventListener("touchstart", (e) => {
            e.preventDefault();
            flap();
        });
        window.addEventListener("keydown", (e) => {
            if (e.code === "Space") {
                e.preventDefault();
                flap();
            }
        });

        document.getElementById("btnReplay").addEventListener("click", () => {
            resetGame();
        });

        document.getElementById("btnQuit").addEventListener("click", () => {
            endGame("Permainan dihentikan (Keluar)");
        });

        const leaderboardModal = document.getElementById("leaderboardModal");
        const tabHistory = document.getElementById("tabHistory");
        const tabTop3 = document.getElementById("tabTop3");

        document.getElementById("btnLeaderboard").addEventListener("click", () => {
            leaderboardModal.classList.remove("hidden");
            tabHistory.classList.add("tab-active");
            tabTop3.classList.remove("tab-active");
            renderHistoryView();
        });

        tabHistory.addEventListener("click", () => {
            tabHistory.classList.add("tab-active");
            tabTop3.classList.remove("tab-active");
            renderHistoryView();
        });

        tabTop3.addEventListener("click", () => {
            tabTop3.classList.add("tab-active");
            tabHistory.classList.remove("tab-active");
            renderTop3View();
        });

        document.getElementById("btnCloseLeaderboard").addEventListener("click", () => {
            leaderboardModal.classList.add("hidden");
        });

        // =========================================================
        // Mulai
        // =========================================================
        resetGame();
        requestAnimationFrame(loop);