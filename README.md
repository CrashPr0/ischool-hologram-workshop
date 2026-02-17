# Spectre Hologram Workshop

A beginner-friendly web application for creating hologram-ready content for Spectre Hologram displays. Styled for the **SJSU School of Information** brand.

## Deploying to GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Select the branch (e.g. `main`) and folder **/ (root)**.
5. Save. The site will be available at `https://<username>.github.io/ischool-hologram-workshop/`.

All asset paths are relative (`css/styles.css`, `js/app.js`), so they work correctly on GitHub Pages without any base URL configuration.

## What is Spectre Hologram?

The Spectre device is a plastic pyramid prism that sits on top of your phone screen. It uses the **Pepper's Ghost effect** - a reflection-based optical illusion - to create stunning 3D floating holograms!

## Features

- 📤 **Easy Upload**: Drag and drop or click to upload videos and images
- 🎨 **Automatic Formatting**: Converts your content into the 4-face format required for hologram display
- 👁️ **Live Preview**: See how your content will appear before downloading
- 🎭 **Viewer Mode**: Experience a simulated hologram effect in your browser
- ⬇️ **Download**: Get your formatted content ready for your phone

## How to Use

1. **Upload Your Content**: Drag and drop a video or image file
2. **Wait for Processing**: The app will format it into a 4-face layout
3. **Preview**: See how it looks in the preview section
4. **Viewer Mode**: Click "Viewer Mode" to see a simulated hologram effect
5. **Download**: Get your formatted file
6. **Use on Phone**: 
   - Transfer to your phone
   - Open in fullscreen mode
   - Place the pyramid prism on your screen
   - Enjoy your hologram!

## Technical Details

- Built with vanilla JavaScript
- Uses Canvas API for image/video processing
- CSS 3D transforms for viewer mode simulation
- Responsive design with Tailwind CSS

## Browser Support

Works best in modern browsers that support:
- Canvas API
- FileReader API
- CSS 3D Transforms
- ES6+ JavaScript

## File Structure

```
ischool-hologram-workshop/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # Custom styles
├── js/
│   ├── app.js             # Main application logic
│   ├── image-processor.js # Image formatting
│   ├── video-processor.js # Video formatting
│   ├── preview.js         # Preview functionality
│   └── viewer.js          # Viewer mode
└── README.md              # This file
```

## Usage Tips

- **Best Results**: Use videos/images with transparent or dark backgrounds
- **Phone Settings**: Maximum brightness, dark room
- **Viewing**: Look at the pyramid from the sides, not from above
- **Content**: Animated content works best for impressive effects

## License

Created for the School of Information at SJSU workshop.
