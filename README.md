# History of Now

## Development

To run the project locally for development:

```bash
npm install
npm run dev
```

This will start a local development server. Your site will be available at http://localhost:8080.

## Building for Production

To build the project for production:

```bash
npm install
npm run build
```

This will:
1. Create a `dist` directory
2. Copy all necessary files to the `dist` directory
3. Process the HTML files to ensure all paths are correct for production
4. Copy Antikythera library files to the vendor directory

The build script does NOT minify the code as per your requirement, making debugging in production easier.

## Deployment

After building, you can deploy the contents of the `dist` directory to your production server.

For a quick test of the production build:

```bash
cd dist
npx http-server
```

## Project Structure

- `index.html` - Main entry point of the application
- `*.js` - JavaScript files
- `*.css` - CSS stylesheets
- `assets/` - Contains images and other assets
- `fonts/` - Contains font files
- `data.json` - Main data file for the application
- `vendor/` - Third-party libraries 