Konsep Motion Diagram (yang akan lo bangun)
Elemen dasar:
Lingkaran kamera → simbol posisi kamera


Arrow / path → arah gerak


Animasi loop → gerak berulang


Label motion → pan left, dolly, drone, dll


Ini bukan video → ini visual language buat user ngerti motion.

1️⃣ DAFTAR MOTION VIDEO (STANDARD CINEMA)
Gunakan ini sebagai enum di engine lo:
type CameraMotion =
  | "pan_left"
  | "pan_right"
  | "tilt_up"
  | "tilt_down"
  | "dolly_in"
  | "dolly_out"
  | "truck_left"
  | "truck_right"
  | "orbit_left"
  | "orbit_right"
  | "crane_up"
  | "crane_down"
  | "drone_forward"
  | "drone_down"
  | "handheld_micro"
  | "static"


2️⃣ CONTOH SVG MOTION — PAN LEFT (FULL CODE)
🔹 Pan Left (kamera geser kiri)

👉 Ini murni SVG, gak perlu JS, langsung jalan.

3️⃣ MOTION LAIN (TINGGAL GANTI PARAMETER)
🎥 Pan Right


🎥 Tilt Up


🎥 Dolly In (kamera maju)
Pakai scale biar keliatan mendekat:
<circle cx="150" cy="60" r="10" fill="#111" stroke="#00FFD1" stroke-width="3">
  <animate
    attributeName="r"
    from="10"
    to="18"
    dur="1.5s"
    repeatCount="indefinite"
    direction="alternate"/>
</circle>


🎥 Truck Left (kamera geser kiri, framing sama)
Mirip pan left tapi background ikut (secara visual sama, tapi beda label).

🎥 Orbit (kamera muter subjek)
<circle cx="150" cy="60" r="4" fill="#FF0066"/> <!-- subject -->


<circle r="12" fill="#111" stroke="#00FFD1" stroke-width="3">
  <animateMotion
    dur="2s"
    repeatCount="indefinite"
    path="M 150 60 m -40 0 a 40 40 0 1 1 80 0 a 40 40 0 1 1 -80 0"/>
</circle>


🎥 Drone Forward
Gerak diagonal + scale:
<circle cx="80" cy="80" r="10" fill="#111" stroke="#00FFD1" stroke-width="3">
  <animate
    attributeName="cx"
    from="80"
    to="150"
    dur="2s"
    repeatCount="indefinite"/>
  <animate
    attributeName="cy"
    from="80"
    to="50"
    dur="2s"
    repeatCount="indefinite"/>
  <animate
    attributeName="r"
    from="8"
    to="14"
    dur="2s"
    repeatCount="indefinite"/>
</circle>


4️⃣ VERSI REACT (BIAR NYAMBUNG KE CANVAS ZWAPP)
function MotionPanLeft() {
  return (
    <svg width={260} height={120} viewBox="0 0 300 120">
      <line x1="220" y1="60" x2="80" y2="60"
        stroke="#00FFD1" strokeWidth={3} strokeDasharray="6 6" />
      <polygon points="80,60 95,52 95,68" fill="#00FFD1" />
      <circle r={14} fill="#111" stroke="#00FFD1" strokeWidth={3}>
        <animate
          attributeName="cx"
          from="220"
          to="80"
          dur="1.5s"
          repeatCount="indefinite"/>
        <animate
          attributeName="cy"
          from="60"
          to="60"
          dur="1.5s"
          repeatCount="indefinite"/>
      </circle>
      <text x="150" y="110" textAnchor="middle"
        fill="#00FFD1" fontSize="14">
        PAN LEFT
      </text>
    </svg>
  );
}


