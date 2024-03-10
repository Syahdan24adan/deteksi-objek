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
    width: 1920,
    height: 1020,
    facingMode: 'user',
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

      const scaleWidth = 0.8;
      const scaleHeight = 0.8;

      const filteredDetection = detection.filter((result) => result.score >= minScore);

      if (filteredDetection.length > 0) {
        filteredDetection.forEach((result) => {
          const scaledWidth = result.bbox[2] * scaleWidth;
          const scaledHeight = result.bbox[3] * scaleHeight;

          const newLeft = result.bbox[0] + (result.bbox[2] - scaledWidth) / 2;
          const newTop = result.bbox[1] + (result.bbox[3] - scaledHeight) / 2;

          context.beginPath();
          context.rect(newLeft, newTop, scaledWidth, scaledHeight);
          context.lineWidth = 2;
          context.strokeStyle = 'white';
          context.fillStyle = 'white';
          context.stroke();
          context.fillText(
            `${result.class} (${(result.score * 100).toFixed(2)}%)`,
            newLeft,
            newTop + 10
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
    <div>
      <h1>ML WITH JESSY</h1>
      <Webcam
        id="videoSource"
        audio={false}
        height={720}
        ref={null}
        screenshotFormat="image/jpeg"
        width={1360}
        videoConstraints={{ ...videoOptions, facingMode: 'user' }}
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
            border: '2px solid orange',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ margin: 0, padding: 5, color: 'orange' }}>
            {result.class} ({(result.score * 100).toFixed(2)}%)
          </p>
        </div>
      ))}
    </div>
  );
}

export default App;
