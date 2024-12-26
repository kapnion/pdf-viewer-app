import { useEffect, useRef, useState } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import Head from 'next/head';
import { makeStyles, Button, shorthands } from '@fluentui/react-components';
import { bundleIcon, CalendarMonthFilled, CalendarMonthRegular, ZoomInRegular, ZoomOutRegular, DocumentPrintRegular } from '@fluentui/react-icons';

const CalendarMonth = bundleIcon(CalendarMonthFilled, CalendarMonthRegular);

const useStyles = makeStyles({
  wrapper: {
    columnGap: '15px',
    display: 'flex',
    padding: '10px',
    backgroundColor: '#f3f2f1',
    borderBottom: '1px solid #e1dfdd',
    ...shorthands.borderRadius('4px'),
  },
  ribbonBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    ...shorthands.borderRadius('4px'),
  },
  hideOnPrint: {
    '@media print': {
      display: 'none',
    },
  },
  viewerContainer: {
    display: 'flex',
    position: 'relative',
    width: '800px', // Fixed width
    height: '600px', // Fixed height
    overflow: 'hidden', // Hide overflow to keep the preview fixed
    border: '1px solid #e1dfdd',
    ...shorthands.borderRadius('4px'),
  },
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginRight: '10px',
    overflowY: 'auto',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '150px', // Fixed width for preview
    backgroundColor: '#f3f2f1',
    zIndex: 1,
  },
  documentContainerWithPreview: {
    position: 'relative',
    width: 'calc(100% - 160px)', // Adjust width to account for preview
    height: '100%',
    marginLeft: '160px', // Adjust margin to account for preview
    overflow: 'auto', // Enable scroll bars for document
  },
  documentContainerWithoutPreview: {
    position: 'relative',
    width: '100%', // Full width when preview is hidden
    height: '100%',
    marginLeft: '0', // No margin when preview is hidden
    overflow: 'auto', // Enable scroll bars for document
  },
  pageContainer: {
    position: 'relative',
    marginBottom: '10px', // Space between pages
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
});

import styles from '../styles/Home.module.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function Home() {
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [rectangles, setRectangles] = useState([]);
  const canvasRefs = useRef([]);
  const isDrawing = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [pagePreviews, setPagePreviews] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);

  const buttonStyles = useStyles();

  useEffect(() => {
    // Fetch existing rectangles from the server
    fetch('/api/rectangles')
      .then(response => {
        if (!response.ok) {
          console.error('Network response was not ok');
          return [];
        }
        return response.json();
      })
      .then(data => setRectangles(data))
      .catch(error => {
        console.error('Error fetching rectangles:', error);
        // Optionally, set an empty array or handle the error state
        setRectangles([]);
      });
  }, []);

  useEffect(() => {
    // Load rectangles from Local Storage
    const storedRectangles = JSON.parse(localStorage.getItem('rectangles')) || [];
    setRectangles(storedRectangles);
  }, []);

  useEffect(() => {
    // Save rectangles to Local Storage whenever they change
    localStorage.setItem('rectangles', JSON.stringify(rectangles));
  }, [rectangles]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const loadPagePreviews = async () => {
      const pdf = await pdfjs.getDocument('/EXTENDED_Rechnungskorrektur.pdf').promise;
      const previews = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        previews.push(canvas.toDataURL());
      }
      setPagePreviews(previews);
    };

    loadPagePreviews();
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading document:', error);
  };

  const handleMouseDown = (event, pageIndex) => {
    if (isCtrlPressed) {
      isDrawing.current = true;
      const rect = canvasRefs.current[pageIndex].getBoundingClientRect();
      startX.current = (event.clientX - rect.left) / scale;
      startY.current = (event.clientY - rect.top) / scale;
    }
  };

  const handleMouseUp = (event, pageIndex) => {
    if (isDrawing.current) {
      isDrawing.current = false;
      const rect = canvasRefs.current[pageIndex].getBoundingClientRect();
      const endX = (event.clientX - rect.left) / scale;
      const endY = (event.clientY - rect.top) / scale;
      const newRectangle = {
        page: pageIndex + 1,
        originalX: startX.current,
        originalY: startY.current,
        originalWidth: endX - startX.current,
        originalHeight: endY - startY.current,
        color: 'green',
      };
      setRectangles([...rectangles, newRectangle]);
      // Save rectangles to Local Storage
      localStorage.setItem('rectangles', JSON.stringify([...rectangles, newRectangle]));
    }
  };

  const handleMouseMove = (event, pageIndex) => {
    if (isDrawing.current) {
      const rect = canvasRefs.current[pageIndex].getBoundingClientRect();
      const ctx = canvasRefs.current[pageIndex].getContext('2d');
      const endX = (event.clientX - rect.left) / scale;
      const endY = (event.clientY - rect.top) / scale;
      ctx.clearRect(0, 0, canvasRefs.current[pageIndex].width, canvasRefs.current[pageIndex].height);
      
      // Redraw existing rectangles for the current page
      rectangles.filter(rect => rect.page === pageIndex + 1).forEach(rect => {
        ctx.strokeStyle = rect.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.originalX * scale, rect.originalY * scale, rect.originalWidth * scale, rect.originalHeight * scale);
      });

      // Draw the red rectangle being drawn
      ctx.strokeStyle = 'red'; // Draw in red while drawing
      ctx.lineWidth = 2;
      ctx.strokeRect(startX.current * scale, startY.current * scale, (endX - startX.current) * scale, (endY - startY.current) * scale);
    }
  };

  useEffect(() => {
    canvasRefs.current.forEach((canvas, pageIndex) => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Redraw existing rectangles for the current page
      rectangles.filter(rect => rect.page === pageIndex + 1).forEach(rect => {
        ctx.strokeStyle = rect.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.originalX * scale, rect.originalY * scale, rect.originalWidth * scale, rect.originalHeight * scale);
      });
    });
  }, [numPages, scale, rectangles]);

  const zoomIn = () => {
    setScale(scale + 0.1);
  };

  const zoomOut = () => {
    setScale(scale - 0.1);
  };

  const printDocument = async () => {
    const pdf = await pdfjs.getDocument('/EXTENDED_Rechnungskorrektur.pdf').promise;
    const printContainer = document.createElement('div');
    document.body.appendChild(printContainer);

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;
      const imageDataUrl = canvas.toDataURL('image/png');
      const image = document.createElement('img');
      image.src = imageDataUrl;

      const container = document.createElement('div');
      container.classList.add('page-container');
      container.appendChild(image);

      printContainer.appendChild(container);
    }

    window.print();
    document.body.removeChild(printContainer);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>PDF Viewer App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div className={`${buttonStyles.ribbonBar} ${buttonStyles.hideOnPrint}`}>
          <div className={buttonStyles.wrapper}>
            <Button icon={<ZoomInRegular />} onClick={zoomIn}>Zoom In</Button>
            <Button appearance="primary" icon={<ZoomOutRegular />} onClick={zoomOut}>Zoom Out</Button>
            <Button appearance="transparent" icon={<DocumentPrintRegular />} onClick={printDocument}>Print</Button>
            <Button appearance="transparent" onClick={togglePreview}>
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>
        </div>
        {console.log('Loading PDF from:', '/EXTENDED_Rechnungskorrektur.pdf')}
        <div className={buttonStyles.viewerContainer}>
          {showPreview && (
            <div className={buttonStyles.previewContainer}>
              {pagePreviews.map((preview, index) => (
                <img
                  key={index}
                  src={preview}
                  alt={`Page ${index + 1}`}
                  style={{ cursor: 'pointer', border: pageNumber === index + 1 ? '2px solid blue' : 'none' }}
                  onClick={() => setPageNumber(index + 1)}
                />
              ))}
            </div>
          )}
          <div className={showPreview ? buttonStyles.documentContainerWithPreview : buttonStyles.documentContainerWithoutPreview}>
            <Document
              file="/EXTENDED_Rechnungskorrektur.pdf"
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <div key={`page_${index + 1}`} className={buttonStyles.pageContainer}>
                  <Page pageNumber={index + 1} scale={scale} />
                  <canvas
                    ref={el => canvasRefs.current[index] = el}
                    width={600 * scale}
                    height={800 * scale}
                    onMouseDown={event => handleMouseDown(event, index)}
                    onMouseUp={event => handleMouseUp(event, index)}
                    onMouseMove={event => handleMouseMove(event, index)}
                    className={buttonStyles.canvas}
                  />
                </div>
              ))}
            </Document>
          </div>
        </div>
      </main>

      {/* Footer is not included in print */}
      <footer className={`${buttonStyles.hideOnPrint}`}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel" className={styles.logo} />
        </a>
      </footer>

      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .controls {
          margin-bottom: 1rem;
        }
        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        footer img {
          margin-left: 0.5rem;
        }
        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }
        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family:
            Menlo,
            Monaco,
            Lucida Console,
            Liberation Mono,
            DejaVu Sans Mono,
            Bitstream Vera Sans Mono,
            Courier New,
            monospace;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            Segoe UI,
            Roboto,
            Oxygen,
            Ubuntu,
            Cantarell,
            Fira Sans,
            Droid Sans,
            Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
