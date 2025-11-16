// src/pdf-worker.js
// This sets a LOCAL pdf.js worker to avoid browser fetch errors.

import { GlobalWorkerOptions } from "pdfjs-dist/build/pdf";

// Use the worker we downloaded to public/pdf.worker.min.js
GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
