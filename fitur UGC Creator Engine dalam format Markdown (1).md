 fitur **UGC Creator Engine** dalam format Markdown. Dokumentasi ini mencakup struktur menu, fitur, dan penjelasan mendalam mengenai logika AI di backend (System Prompts & Orchestration).

---

# **📱 UGC Creator Engine V2.1 \- Technical Documentation**

**UGC Creator Engine** adalah modul AI canggih di dalam ekosistem Zwapp.id yang dirancang untuk mensimulasikan proses produksi konten *User Generated Content* (UGC) tanpa memerlukan syuting fisik. Modul ini bertindak sebagai **AI Creative Director** dan **Cinematographer** sekaligus.

---

## **1\. Struktur Menu & UI (User Interface)**

Panel UGC Creator dibagi menjadi dua area utama: **Input Configuration (Kiri)** dan **Project Workspace (Kanan)**.

### **A. Panel Kiri: Input & Konfigurasi**

Bagian ini adalah tempat pengguna memberikan "bahan baku" kepada AI.

1. **Assets Upload (Multi-Modal Injection)**  
   * **Model Reference:** Upload foto *talent* yang akan digunakan. AI akan mengunci identitas wajah dan fisik (Visual Anchor).  
   * **Product Reference:** Upload foto produk (packshot). AI akan memegang/menggunakan produk ini dalam konten.  
   * **Product Link:** URL produk (sebagai konteks tambahan).  
2.   
3. **Configuration (Parameter Kontrol)**  
   * **Motion Continuity:** (Default: ON) Mode khusus untuk memastikan frame akhir adegan 1 menyambung mulus dengan frame awal adegan 2 (untuk interpolasi video).  
   * **Camera Mode:**  
     * iPhone Creator: Simulasi kamera smartphone, *ring light*, tekstur kulit asli, *noise* natural.  
     * Pro Creator: Simulasi kamera Cinema (Sony/Arri), *bokeh*, *grading* profesional.  
   *   
   * **Category:** Jenis produk (Fashion, Skincare, F\&B, dll).  
   * **Tone:** Gaya penyampaian (Energetic, Calm, Soft Selling).  
   * **Script Language:** Terkunci pada Bahasa Indonesia (untuk pasar lokal).  
4.   
5. **Action Button**  
   * **Analyze & Generate Plan:** Tombol pemicu untuk mengirim data ke Backend Orchestrator.  
6. 

### **B. Panel Kanan: Project Workspace & Board**

Tempat hasil analisis dan generasi aset ditampilkan.

1. **Visual Anchor Card:** Menampilkan hasil analisis AI terhadap DNA Model dan Produk yang telah "dikunci".  
2. **Scene Cards (Daftar Adegan):**  
   * Setiap kartu mewakili 1 Scene (durasi 3-5 detik).  
   * **Dialogue Box:** Naskah dialog dalam Bahasa Indonesia.  
   * **Motion Split View:**  
     * *Star Frame (Entry):* Visual awal adegan.  
     * *End Frame (Exit):* Visual akhir adegan.  
   *   
   * **Flow Labs Export:** Panel JSON khusus untuk di-copy ke tool video generator eksternal (Runway Gen-3 / Luma / Veo).  
3.   
4. **Global Export:** Tombol untuk mengunduh semua aset mentah sekaligus.

---

## **2\. Fitur Utama (Features)**

### **🌟 Visual Anchor Locking (Identity Consistency)**

Fitur ini mencegah "halusinasi" AI dimana wajah model atau bentuk produk berubah-ubah antar *scene*. Engine menggunakan teknik *multi-modal injection* dimana referensi gambar model dan produk disuntikkan kembali ke setiap *request* generasi gambar.

### **🎥 Motion Continuity Logic (Star & End Frames)**

UGC Creator Engine tidak hanya membuat gambar statis, tetapi mempersiapkan aset untuk **Video Interpolation**.

* **Logic:** AI menghasilkan 2 gambar per scene: Awal (Star) dan Akhir (End).  
* **Tujuan:** Gambar ini digunakan sebagai *Keyframes* di tool video AI (seperti Runway/Kling). Hasil videonya adalah pergerakan (morphing) dari Star ke End frame, menciptakan gerakan yang sangat terkontrol.

### **📱 Paripurna Camera Logic (iPhone vs Pro)**

Engine membedakan secara tegas estetika visual:

* **iPhone Mode:** Memaksa AI menghasilkan gambar dengan *imperfection* (pori-pori wajah, pencahayaan tidak sempurna, sudut pandang selfie) agar terlihat seperti konten viral TikTok asli.  
* **Pro Mode:** Memaksa estetika iklan TV (clean, sharp, perfect lighting).

---

## **3\. Backend AI Logic & Orchestration (The "Brain")**

Bagian ini menjelaskan bagaimana **Gemini 1.5 Pro / Gemini 3** berpikir dan memproses data di belakang layar (geminiService.ts).

### **Tahap 1: The Planner (Orchestrator)**

Saat tombol "Analyze" ditekan, AI bertindak sebagai **Cinematographer Supervisor**.

**System Prompt Instruction:**

"ROLE: Professional Cinematographer & UGC Realism Supervisor.  
TUGAS: Analisis gambar Model dan Produk. Buat rencana syuting 3-4 Scene.  
ATURAN KRITIS:

1. Motion harus kontinu (tanpa teleportasi).  
2. Dialog Bahasa Indonesia, Tone sesuai request.  
3. Tentukan 'UGC Realism Layer' (misal: kedipan mata, gerakan tangan mikro)."

**Proses Logika:**

1. **Vision Analysis:** AI "melihat" gambar model (gender, usia, etnis) dan produk (warna, bentuk, material).  
2. **Storyboarding:** Membuat alur cerita (Hook \-\> Masalah \-\> Solusi \-\> CTA).  
3. **Motion Mapping:** Menentukan gerakan kamera dan subjek.  
   * *Scene 1:* Masuk frame (Entry).  
   * *Scene 2:* Menunjukkan produk (Action).  
   * *Scene 3:* Reaksi wajah (Reaction).  
4. 

**Output Backend (JSON):**

codeJSON

```
{
  "visualAnchor": { "modelDescription": "...", "productDescription": "..." },
  "scenes": [
    {
      "scene_number": 1,
      "objective": "Hook",
      "dialogue": { "text": "Guys, kalian wajib coba ini!", "tone": "Excited" },
      "star_frame": { "motion_notes": "Model walks in", "visual_prompt": "..." },
      "end_frame": { "motion_notes": "Model holds product up", "visual_prompt": "..." }
    }
  ]
}
```

### **Tahap 2: The Renderer (Image Generator)**

Saat tombol "Render" ditekan pada setiap kartu scene.

**Logic Injeksi Prompt (Dynamic Compositing):**  
Backend membangun prompt kompleks berdasarkan **Camera Mode** yang dipilih.

**A. Jika Mode \=** 

**Prompt Injection:**  
"Shot on iPhone 15 Pro Main Camera. Crisp 4K quality. NO GRAIN. Bright 'Influencer' lighting (Ring Light). Ultra-realistic skin texture (visible pores, makeup texture). Handheld selfie composition. Product must react to ring-light highlights."  
**Negative Prompt:** "Cinematic lighting, movie set, bokeh, 3d render, plastic skin, smooth skin."

**B. Jika Mode \=** 

**Prompt Injection:**  
"Cinematic 35mm lens, shallow depth of field (Bokeh). Soft professional studio lighting. High-end commercial photography quality."

**C. Reference Injection Strategy:**  
Untuk menjaga konsistensi, setiap kali AI men-generate gambar baru (misal: Scene 2), backend mengirimkan **2 Gambar Referensi**:

1. Gambar Model Asli (Uploaded).  
2. Gambar Produk Asli (Uploaded).  
   Ini memaksa model difusi untuk "melihat" sumber asli setiap saat, bukan hanya mengandalkan deskripsi teks.

### **Tahap 3: Flow Labs Export Logic**

Fitur ini menjembatani Zwapp.id dengan tool Video AI eksternal.

**Logic:**  
AI menyusun "Meta-Prompt" yang dioptimalkan untuk tool seperti Runway Gen-3 atau Google Veo.

* Mengambil deskripsi visual dari *Star Frame*.  
* Mengambil deskripsi visual dari *End Frame*.  
* Menambahkan instruksi interpolasi.

**Contoh Output Prompt:**

"UGC commercial video. \[Deskripsi Star Frame\] transitioning to \[Deskripsi End Frame\]. Action: Model applying serum to cheek. Cinematic lighting. Camera movement: Slow push in."  
---

## **4\. Alur Data (Data Flow Diagram)**

1. **User Input:** Upload Foto \+ Pilih Mode \-\> **Frontend**.  
2. **Request:** Dikirim ke **Backend Service** (generateUGCPlan).  
3. **Vision Processing (Gemini Vision):**  
   * Input: Gambar Base64.  
   * Output: JSON Plan (Scene, Dialog, Visual Prompts).  
4.   
5. **Rendering (Gemini Imagen/Flash):**  
   * Input: Prompt Spesifik \+ Ref Image 1 (Model) \+ Ref Image 2 (Produk).  
   * Output: Base64 Image (Star/End Frames).  
6.   
7. **Distribution:**  
   * User mengunduh aset gambar.  
   * User meng-copy prompt JSON untuk animasi video.  
   * Aset disimpan ke **Supabase Storage** (Gallery).  
8. 

1\. Prioritas Fitur Baru yaitu UGC dalam workspace, lo harus menyiapkan default workflow UGC untuk menu Workspace.

alurnya ; User upload foto model karakter, User Upload Foto Produk, User isi field text Nama Produk, Deskripsi ringkas Produk, dan memilih field dropdown;

1\. Berikut adalah daftar lengkap pilihan Latar Belakang (Background) harus disusun rapi berdasarkan kategori :

1\. Vibe Dasar (Style Umum)

Kategori ini mencakup gaya visual umum yang menentukan suasana keseluruhan gambar.

Minimalist Chic

Urban Street

Cozy Home

Boho Natural

Fitness Active

Corporate Sleek

Outdoor Adventure

2\. Varian Realistis (Lifestyle & Lingkungan)

Pilihan latar belakang yang meniru lokasi dunia nyata untuk memberikan konteks penggunaan produk.

Luxury Hotel (Mewah & Elegan)

Modern Cafe (Lifestyle & Santai)

Beach Resort (Liburan & Tropis)

Industrial Loft (Edgy & Estetik)

Scandinavian Living (Bersih & Rapi)

Garden Party (Segar & Outdoor)

Workspace Studio (Profesional & Kreatif)

Kitchen Culinary (Hangat & Lezat)

Sunset Rooftop (Dramatis & Mewah)

Serene Spa (Tenang & Perawatan)

3\. Studio & Spesifik (Profesional & Detail)

Latar belakang yang lebih fokus pada fotografi produk, detail tekstur, atau pencahayaan studio.

Professional Photo Studio (Latar Polos)

Minimalist Podium (Podium Geometris)

Abstract Pastel Studio (Warna Lembut)

Neon City Night (Bokeh Lampu Kota)

Luxury Marble Bathroom (Kamar Mandi Mewah)

Botanical Greenhouse (Rumah Kaca)

Rustic Wooden Table (Tekstur Kayu)

Modern Gym (Pusat Kebugaran)

Classic Library (Rak Buku)

Art Gallery (Ruang Putih)

4\. Nuansa Indonesia (Lokal & Budaya)

Latar belakang khusus yang mengangkat kekayaan budaya dan alam Indonesia secara elegan dan ada kategori yang berlatarbelakang kondisi asli lingkungan indonesia kelas bawah.

Latar belakang khas indonesia khusus elegan:

Balinese Private Villa (Nuansa Bali)

Javanese Joglo House (Rumah Jawa)

Ubud Rice Fields (Sawah Terasering)

Traditional Batik Workshop (Latar Batik)

Bamboo Eco-Lodge (Arsitektur Bambu)

Phinisi Boat Deck (Kapal Kayu)

Borobudur Stone Stupa (Candi Batu)

Tropical Coffee Estate (Perkebunan Kopi)

Traditional Tenun Ikat (Latar Tenun)

Balinese Temple Gate (Candi Bentar)

Latar belakang khas indonesia khusus kalangan kelas bawah;

Di Dalam Angkot

Di Halaman Rumah (dengan environment tambahan Jemuran Baju yang terlihat)

Warkop kaki lima

Warteg Bahari

Kamar Kos Mahasiswa yang berantakan tapi masih rapi normal

Dapur kontrakan

Kamar Mandi Kontrakan

