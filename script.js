const video = document.querySelector("#videoElement");
const webcamLoadingText = document.getElementById("webcam-loading"); // 웹캠 로딩 텍스트 요소

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
      video.onloadedmetadata = function (e) {
        video.play();
        // 웹캠 스트림이 로드되면 로딩 텍스트를 숨깁니다.
        webcamLoadingText.style.display = "none";
      };
    })
    .catch(function (error) {
      console.log(error.message);
      webcamLoadingText.textContent = "웹캠을 불러오는 데 실패했습니다."; // 에러 메시지 업데이트
    });
} else {
  webcamLoadingText.textContent = "웹캠을 지원하지 않는 브라우저입니다.";
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
        document.body.innerHTML = "";
        const resultImage = new Image();
        resultImage.src = data.body.ResultImageUrl;
        resultImage.alt = "페이스 스왑 결과";
        resultImage.style.display = "block";
        resultImage.style.margin = "auto";
        resultImage.style.cursor = "pointer"; // 커서를 포인터로 변경하여 클릭 가능함을 나타냅니다.
        resultImage.addEventListener("click", () => {
          // 페이지를 다시 로드하여 원래 상태로 돌아갑니다.
          window.location.reload();
        });
        // 안내 문구를 생성합니다.
        const restartText = document.createElement("p");
        restartText.textContent = "이미지를 클릭하면 새로 시작할 수 있습니다.";
        restartText.style.textAlign = "center";
        restartText.style.marginTop = "20px";
        restartText.style.fontSize = "18px";
        restartText.style.color = "#FFFFFF";
        restartText.style.fontFamily = "Arial, sans-serif";

        // 결과 이미지와 안내 문구를 body에 추가합니다.
        document.body.appendChild(resultImage);
        document.body.appendChild(restartText);
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
    loadingIndicator.style.display = "flex";
  } else {
    loadingIndicator.style.display = "none";
  }
}
