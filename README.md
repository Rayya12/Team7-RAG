
# `Chatbot AI RAG dengan Knowledge Base`

**Description**  
Proyek ini adalah implementasi chatbot berbasis Retrieval-Augmented Generation (RAG) yang memungkinkan AI menjawab pertanyaan menggunakan basis pengetahuan (knowledge base) yang dapat ditambahkan secara dinamis. Fitur utamanya adalah kemampuan untuk menambahkan dokumen baru ke dalam database vektor, yang kemudian akan digunakan AI sebagai referensi untuk memberikan jawaban yang relevan dan akurat.
---

## 🧑‍💻 Team


| **Name**                    | **Role**       |
|-----------------------------|----------------|
| Rafly Zulfikar AlKautsar    | UI/UX          |
| Rayya Syauqi Alulu'i        | Project Manager|
| Zidane Surya Nugraha        | Promt Engineer |
| Ukasyah                     | BackendEngineer|


---

## 🚀 Features
- **🤖 Dynamic Knowledge Base Storage**: Memungkinkan pengguna menambahkan potongan informasi atau dokumen baru (sebagai "resource") ke dalam database melalui antarmuka chatbot.
- **📧 Automatic Embedding Generation**: Setiap kali dokumen baru ditambahkan, sistem akan secara otomatis memecahnya menjadi "chunks" dan mengubahnya menjadi vektor embedding.
- **⚙️ Semantic Vector Search**: AI dapat mencari dan mengambil informasi yang paling relevan dari database vektor berdasarkan kesamaan semantik, bukan hanya kata kunci.
- **✅ Retrieval-Augmented Generation (RAG) Integration**: Menggabungkan kemampuan model bahasa besar (LLM) seperti GPT-4o dengan informasi yang diambil dari database vektor untuk menghasilkan jawaban yang lebih informatif dan akurat.
- **🔐 Fallback Response**: Jika tidak ada informasi relevan yang ditemukan dari knowledge base, AI akan memberikan respons yang sopan (contoh: "Sorry, I don't know the answer").


## 🛠 Tech Stack

**Frontend:**
- Next.js
- Tailwind CSS
- Shadcn UI

**Backend:**
- Next.js
- Postgre SQL
---

## 🚀 How to Run the Project
note: dont forget to create .env with your Gemini API Key in the folder

### Step 1. Clone the Repository
```bash
git clone https://github.com/Rayya12/Team7-Webinar1.git
cd TEAM7-RAG
```

### Step 2. Instal Dependensi
```bash
npm install
```

### Step 3 Konfigurasi .env.local
```bash
DATABASE_URL=postgres://postgres:password@localhost:5432/dbName
GOOGLE_GENERATIVE_AI_API_KEY=YOURAPIKEY

### Step 4 Jalankan Server
```bash
npm run dev
```

## 📋 Requirements (optional)
- Node.js versi 18.18
- Gemini API
- Gmail API
- Vercel AI SDK

