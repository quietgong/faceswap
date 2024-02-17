const video = document.querySelector("#videoElement");

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (error) {
      console.log(error.message);
    });
}

function flipVideo() {
  if (video) {
    video.style.transform = "scaleX(-1)";
  }
}

video.addEventListener("loadedmetadata", function () {
  flipVideo();
});

let uploadedImageUrl = ""; // 업로드된 이미지 URL을 저장할 변수

document.querySelectorAll(".target-img").forEach((img) => {
  img.addEventListener("click", function () {
    document
      .querySelectorAll(".target-img")
      .forEach((i) => i.classList.remove("selected"));
    this.classList.add("selected");
  });
});

document.getElementById("capture").addEventListener("click", () => {
  const captureBtn = document.getElementById("capture");
  captureBtn.style.display = "none";
  const webcamVideo = document.getElementById("videoElement");
  const canvas = document.getElementById("snapshot");
  const context = canvas.getContext("2d");
  canvas.width = webcamVideo.videoWidth;
  canvas.height = webcamVideo.videoHeight;
  // 캔버스에 그리기 전에 좌우 반전을 적용
  context.save(); // 현재 상태를 저장
  context.scale(-1, 1); // x축 방향으로 반전
  context.drawImage(
    webcamVideo,
    -webcamVideo.videoWidth,
    0,
    webcamVideo.videoWidth,
    webcamVideo.videoHeight
  );
  context.restore(); // 저장된 상태로 복구하여 다른 그리기 작업에 영향을 주지 않음
  webcamVideo.hidden = true;
  canvas.hidden = false;

  // Canvas에서 이미지를 Base64 형식으로 변환하고 ImgBB에 업로드
  const imageDataUrl = canvas.toDataURL("image/png").split(",")[1];
  uploadImageToImgBB(imageDataUrl);
});

// ImgBB API를 사용하여 이미지 업로드
function uploadImageToImgBB(imageBase64) {
  const formData = new FormData();
  formData.append("image", imageBase64);
  formData.append("key", "5b069150e7abdb7a510a8e34e92d8823");

  fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.data && data.data.url) {
        uploadedImageUrl = data.data.url; // 업로드된 이미지 URL 저장
        document.getElementById("swap-face").hidden = false; // 페이스 스왑 버튼 표시
      } else {
        throw new Error("Failed to upload image to ImgBB");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    });
}

// 페이스 스왑 API 호출
document.getElementById("swap-face").addEventListener("click", () => {
  if (uploadedImageUrl) {
    performFaceSwap(uploadedImageUrl);
  } else {
    alert("먼저 사진을 촬영하고 업로드해주세요.");
  }
});

function performFaceSwap(sourceImageUrl) {
  const selectedImage = document.querySelector(".target-img.selected").src;

  const body = {
    TargetImageUrl: selectedImage,
    SourceImageUrl: sourceImageUrl,
  };

  showLoadingIndicator(true);

  fetch(
    "https://3oj4pwllli.execute-api.ap-northeast-2.amazonaws.com/v1/faceswap",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  )
    .then((response) => response.json())
    .then((data) => {
      showLoadingIndicator(false);
      if (data.statusCode === 200 && data.body.Success) {
        const resultImage = data.body.ResultImageUrl;
        // 결과 이미지를 표시
        // 결과 이미지를 새 창으로 열기
        window.open(resultImage, "_blank");
      } else {
        alert("페이스 스왑에 실패했습니다: " + data.body.Message);
      }
    })
    .catch((error) => {
      showLoadingIndicator(false);
      console.error("Error:", error);
      alert("페이스 스왑 요청 중 오류가 발생했습니다.");
    });
}

// 로딩 인디케이터 표시를 위한 함수
function showLoadingIndicator(show) {
  const loadingIndicator = document.getElementById("loading-indicator");
  if (show) {
    loadingIndicator.style.display = "block";
  } else {
    loadingIndicator.style.display = "none";
  }
}
