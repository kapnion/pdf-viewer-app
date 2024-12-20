import { useEffect, useRef, useState } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function Home() {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [rectangles, setRectangles] = useState([]);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    // Fetch existing rectangles from the server
    fetch('/api/rectangles')
      .then(response => response.json())
      .then(data => setRectangles(data));
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleMouseDown = (event) => {
    if (event.ctrlKey) {
      isDrawing.current = true;
      const rect = canvasRef.current.getBoundingClientRect();
      startX.current = event.clientX - rect.left;
      startY.current = event.clientY - rect.top;
    }
  };

  const handleMouseUp = (event) => {
    if (isDrawing.current) {
      isDrawing.current = false;
      const rect = canvasRef.current.getBoundingClientRect();
      const endX = event.clientX - rect.left;
      const endY = event.clientY - rect.top;
      const newRectangle = {
        x: startX.current,
        y: startY.current,
        width: endX - startX.current,
        height: endY - startY.current,
      };
      setRectangles([...rectangles, newRectangle]);
      // Save the new rectangle to the server
      fetch('/api/rectangles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRectangle),
      });
    }
  };

  const handleMouseMove = (event) => {
    if (isDrawing.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const ctx = canvasRef.current.getContext('2d');
      const endX = event.clientX - rect.left;
      const endY = event.clientY - rect.top;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.strokeRect(startX.current, startY.current, endX - startX.current, endY - startY.current);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>PDF Viewer App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Document file="/example.pdf" onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={pageNumber} />
        </Document>
        <canvas
          ref={canvasRef}
          width={600}
          height={800}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
        {rectangles.map((rect, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              border: '2px solid red',
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
            }}
          />
        ))}
      </main>

      <footer>
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
