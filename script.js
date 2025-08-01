
const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");
const statusElement = document.getElementById("status");

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });
  videoElement.srcObject = stream;
  await new Promise((resolve) => {
    videoElement.onloadedmetadata = () => {
      resolve(videoElement);
    };
  });
}

const pose = new Pose.Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

pose.onResults(onResults);

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.poseLandmarks) {
    const leftShoulder = results.poseLandmarks[11];
    const rightShoulder = results.poseLandmarks[12];
    const leftEar = results.poseLandmarks[7];
    const rightEar = results.poseLandmarks[8];

    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const avgEarY = (leftEar.y + rightEar.y) / 2;

    const ratio = avgEarY - avgShoulderY;

    if (ratio > 0.1) {
      statusElement.textContent = "Posture: Membungkuk!";
      statusElement.className = "warning";
    } else {
      statusElement.textContent = "Posture: Normal";
      statusElement.className = "ok";
    }
  }
  canvasCtx.restore();
}

setupCamera().then(() => {
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await pose.send({ image: videoElement });
    },
    width: 640,
    height: 480,
  });
  camera.start();
});
