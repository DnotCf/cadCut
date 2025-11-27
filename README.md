# CAD Cropper Pro

A professional tool to crop CAD files using WKT geometry strings, powered by Google Gemini for geometry validation and React for the frontend.

## Prerequisites

- **Node.js**: v18 or higher
- **Docker** (optional, for containerized deployment)
- **Google Gemini API Key**: Required for WKT validation features.

## Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment**
   Create a `.env` file in the root directory:
   ```env
   API_KEY=your_google_gemini_api_key_here
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## Production Build

To build the application for production (optimizes code and generates static files):

1. **Run Build Command**
   ```bash
   npm run build
   ```
   This will create a `dist/` directory containing the compiled HTML, CSS, and JavaScript.

2. **Preview Production Build**
   ```bash
   npm run preview
   ```

## Docker Deployment

To containerize the application for deployment on a server:

1. **Build the Docker Image**
   ```bash
   docker build -t cad-cropper .
   ```

2. **Run the Container**
   Map port 80 of the container to port 80 (or any other port) on your host.
   
   *Using an .env file:*
   ```bash
   docker run -d -p 80:80 --env-file .env cad-cropper
   ```

   *Passing API Key directly:*
   ```bash
   docker run -d -p 80:80 -e API_KEY=your_key_here cad-cropper
   ```

## Project Structure

- **src/components**: UI Components (FileUpload, WktInput, ProgressBar)
- **src/services**: Logic for DXF processing and Gemini API interaction
- **dist/**: Production artifacts (created after build)
