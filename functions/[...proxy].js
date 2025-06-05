export async function onRequest(context) {
  const urlPath = context.params.proxy?.join("/") || "";
  const fullURL = decodeURIComponent(urlPath);

  if (!/^https?:\/\/.+/.test(fullURL)) {
    return new Response("Invalid URL", { status: 400 });
  }

  try {
    const res = await fetch(fullURL);
    const text = await res.text();

    const fileUrls = Array.from(text.matchAll(/href="([^"]+\.(mp4|webm|jpg|jpeg|png|gif))"/gi)).map(m => {
      const rel = m[1];
      return new URL(rel, fullURL).href;
    });

    if (fileUrls.length === 0) {
      return new Response(renderNoContent(), { headers: { "Content-Type": "text/html" } });
    }

    const videoFiles = fileUrls.filter(url => /\.(mp4|webm)$/i.test(url));
    const imageFiles = fileUrls.filter(url => /\.(jpg|jpeg|png|gif)$/i.test(url));

    if (videoFiles.length > 0) {
      return new Response(renderVideoPlayer(videoFiles[0]), {
        headers: { "Content-Type": "text/html" },
      });
    } else if (imageFiles.length > 0) {
      return new Response(renderSlideshow(imageFiles), {
        headers: { "Content-Type": "text/html" },
      });
    } else {
      return new Response(renderNoContent(), { headers: { "Content-Type": "text/html" } });
    }
  } catch (err) {
    return new Response("Error fetching content: " + err.message, { status: 500 });
  }
}

function renderVideoPlayer(videoUrl) {
  return `<!DOCTYPE html>
<html><body style="margin:0;background:#000;">
  <video src="${videoUrl}" autoplay controls style="width:100%;height:100vh;object-fit:contain;"></video>
</body></html>`;
}

function renderSlideshow(images) {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin:0; background:#000; display:flex; align-items:center; justify-content:center; height:100vh; }
    img { max-width: 100%; max-height: 100vh; object-fit: contain; display: none; }
    img.active { display: block; }
  </style>
</head>
<body>
  ${images.map((src, i) => `<img src="${src}" class="${i === 0 ? "active" : ""}">`).join("")}
  <script>
    const images = document.querySelectorAll("img");
    let idx = 0;
    setInterval(() => {
      images[idx].classList.remove("active");
      idx = (idx + 1) % images.length;
      images[idx].classList.add("active");
    }, 3000);
  </script>
</body>
</html>`;
}

function renderNoContent() {
  return `<!DOCTYPE html>
<html><body style="background:#111;color:#fff;font-family:sans-serif;text-align:center;padding:2rem;">
  <h1>无内容</h1>
  <p>未检测到图片或视频文件</p>
</body></html>`;
}
