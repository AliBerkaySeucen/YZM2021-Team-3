# Backend (Render) Deploy Adımları

## 1. Render'a Backend Deploy

1. [render.com](https://render.com) hesabı oluşturun
2. "New +" → "Web Service"
3. GitHub repository'nizi bağlayın
4. Ayarlar:
   - **Name**: memolink-backend
   - **Region**: Frankfurt (veya size en yakın)
   - **Branch**: main
   - **Root Directory**: backend
   - **Environment**: Python 3
   - **Build Command**: `pip install -r app/requirements.txt`
   - **Start Command**: `cd app && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

5. Environment Variables ekleyin:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   JWT_SECRET_KEY=your_jwt_secret
   DATABASE_URL=your_database_url (opsiyonel)
   ```

6. "Create Web Service" tıklayın

7. Deploy URL'ini kopyalayın (örn: `https://memolink-backend.onrender.com`)

---

# Frontend (Vercel) Deploy Adımları

## 1. Vercel'a Frontend Deploy

1. [vercel.com](https://vercel.com) hesabı oluşturun
2. "Add New..." → "Project"
3. GitHub repository'nizi import edin
4. Ayarlar:
   - **Framework Preset**: Create React App
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: build
   - **Install Command**: `npm install`

5. Environment Variables ekleyin:
   ```
   REACT_APP_API_URL=https://memolink-backend.onrender.com
   ```

6. "Deploy" tıklayın

7. Deploy tamamlandığında URL'iniz hazır (örn: `https://memolink.vercel.app`)

---

## Önemli Notlar

### Backend (Render)
- ✅ Free plan otomatik uyur (inactivity sonrası)
- ✅ İlk istek ~30 saniye sürebilir (cold start)
- ✅ Health check endpoint olmalı: `/health`
- ⚠️ `.env` dosyası GitHub'a pushlanmamalı

### Frontend (Vercel)
- ✅ Otomatik her commit'te deploy olur
- ✅ CDN ile hızlı yükleme
- ✅ HTTPS otomatik
- ⚠️ API URL'ini environment variable olarak ekleyin

### CORS Ayarı
Backend'inizde CORS ayarlarını güncelleyin:
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://memolink.vercel.app",  # Vercel URL'iniz
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Hızlı Deploy (CLI)

### Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Render
Render otomatik GitHub integration kullanır, CLI gereksiz.
