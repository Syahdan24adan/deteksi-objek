import React, { useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as cocoModel from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import './App.css';

function App() {
  const [model, setModel] = useState(null);
  const [detections, setDetections] = useState([]);
  const [canvas, setCanvas] = useState(null);

  const minScore = 0.5; // Ganti nilai sesuai kebutuhan

  async function loadModel() {
    try {
      const loadedModel = await cocoModel.load();
      setModel(loadedModel);
      console.log('Model Loaded...');
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    tf.ready().then(() => {
      loadModel();
    });
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      predict();
    }, 1000);

    return () => clearInterval(intervalId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const videoOptions = {
    width: 1280,
    height: 720,
    facingMode: 'environtment',
  };

  async function predict() {
    const webcamElement = document.getElementById('videoSource');

    // Pastikan model telah dimuat sebelum melakukan prediksi
    if (model && webcamElement && webcamElement.videoWidth && webcamElement.videoHeight) {
      const detection = await model.detect(webcamElement);

      const newCanvas = document.createElement('canvas');
      newCanvas.width = webcamElement.videoWidth;
      newCanvas.height = webcamElement.videoHeight;
      const context = newCanvas.getContext('2d');

      const filteredDetection = detection.filter((result) => result.score >= minScore);

      if (filteredDetection.length > 0) {
        filteredDetection.forEach((result) => {
          const objX = result.bbox[0]; // Koordinat x pojok kiri atas objek
          const objY = result.bbox[1]; // Koordinat y pojok kiri atas objek
          const objWidth = result.bbox[2]; // Lebar objek
          const objHeight = result.bbox[3]; // Tinggi objek

          context.beginPath();
          context.rect(objX, objY, objWidth, objHeight);
          context.lineWidth = 2;
          context.strokeStyle = 'white';
          context.stroke();
          context.fillText(
            `${result.class} (${(result.score * 100).toFixed(2)}%)`,
            objX,
            objY + 10
          );
        });

        setDetections(filteredDetection);
        setCanvas(newCanvas);
      } else {
        // Tidak ada objek yang terdeteksi
        context.font = '30px Arial';
        context.fillStyle = 'red';
        context.fillText('Tidak ada objek yang terdeteksi', 50, 50);

        setDetections([]);
        setCanvas(newCanvas);
      }
    }
  }

  return (
    <div className='App'>
      <h1 className='h-App'>DETEKSI OBJEK</h1>
      <Webcam
        id="videoSource"
        audio={false}
        height={720}
        ref={null}
        screenshotFormat="image/jpeg"
        width={1360}
        videoConstraints={{ ...videoOptions, facingMode: 'environment' }}
        className='webcam'
      />
      {canvas && <img />}
      {detections.map((result, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: result.bbox[0],
            top: result.bbox[1],
            width: result.bbox[2],
            height: result.bbox[3],
            border: '2px solid green',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ margin: 0, padding: 5, color: 'green' }}>
            {result.class} ({(result.score * 100).toFixed(2)}%)
          </p>
        </div>
      ))}
    </div>
  );
}

export default App;
