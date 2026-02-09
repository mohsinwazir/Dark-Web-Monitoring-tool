# Dark Web Threat Intelligence System

An advanced platform for monitoring, analyzing, and reporting on dark web threats using Scrapy, FastAPI, and React.

## 🚀 Features

- **Deep Web Crawling**: Automated Scrapy spiders targeting hidden services (Tor) and clearnet sites.
- **Real-time Threat Intelligence**: Dashboards visualizing threat metrics and MITRE ATT&CK patterns.
- **AI-Powered Analysis**: Integrated LLM for generating executive summaries and threat reports.
- **Forensics Tools**: Steganography detection and YARA rule generation.
- **Secure Architecture**: JWT-based authentication with Role-Based Access Control (RBAC).

## 📂 Project Structure

- **`api/`**: FastAPI backend service handling authentication, database operations, and AI integration.
- **`crawler/`**: Scrapy project configuration and spiders.
- **`frontend/`**: React-based administrative dashboard and visualization interface.

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 16+
- Tor Browser/Service (for dark web crawling) should be running on port 9050.

### 1. Backend Setup

```bash
cd api
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python init_database.py  # Initialize SQLite DB
python start_server.py   # Start API server on port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev              # Start dev server on port 5173
```

### 3. Crawler Configuration

Ensure Tor is running locally. The crawler connects via SOCKS5 proxy at `127.0.0.1:9050`.

```bash
cd crawler
scrapy crawl darkweb_spider
```


## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
