# CSV Comparison Tool

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)  [![React](https://img.shields.io/badge/react-18.3.1-blue.svg)](https://reactjs.org/)  [![TypeScript](https://img.shields.io/badge/typescript-5.5.3-blue.svg)](https://www.typescriptlang.org/)  [![Vite](https://img.shields.io/badge/vite-5.4.2-blue.svg)](https://vitejs.dev/)  [![Tailwind CSS](https://img.shields.io/badge/tailwindcss-3.4.1-blue.svg)](https://tailwindcss.com/)  [![PRs](https://img.shields.io/badge/PRs-not%20accepting-red.svg)](CONTRIBUTING.md)

A modern, user-friendly web application for comparing two CSV files and identifying differences between them. Built with React, TypeScript, and Tailwind CSS.

## Features

- Compare two CSV files side by side
- Identify differences in content and structure
- Fully responsive design for mobile and desktop
- Fast, client-side processing
- No data uploaded to servers - all processing done locally
- Beautiful, modern UI with smooth transitions
- Detailed and summary views of differences
- Real-time validation and error handling

![CSV File1](public/images/csv1.png)

![CSV File2](public/images/csv2.png)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Click "Select CSV" to upload your first CSV file
2. Upload a second CSV file for comparison
3. Click "Compare Files" to see the differences
4. Toggle between summary and detailed views
5. Review differences highlighted in red/green

## Technical Details

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **CSV Parsing**: Papa Parse
- **Icons**: Lucide React
- **Build Tool**: Vite


## Creator

Ed Bates (TECHBLIP LLC)

## Acknowledgments

Some sections of this code were generated with the assistance of AI tools.   These contributions were reviewed and integrated by the project creator(s).

## License

Apache-2.0 license - see the [LICENSE](LICENSE) file for details