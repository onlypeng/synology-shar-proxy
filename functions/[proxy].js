export async function onRequestGet(context) {
  const { proxy } = context.params;
  if (!proxy) {
    return new Response("无代理目标URL", { status: 400 });
  }

  // 解码传入的 URL
  let targetUrl;
  try {
    targetUrl = decodeURIComponent(proxy);
    // 简单验证URL格式
    if (!/^https?:\/\//.test(targetUrl)) {
      throw new Error("非法URL");
    }
  } catch (e) {
    return new Response("无效的URL参数", { status: 400 });
  }

  try {
    // 发起代理请求
    const res = await fetch(targetUrl);
    if (!res.ok) {
      return new Response("目标资源不可访问", { status: res.status });
    }

    // 判断内容类型
    const contentType = res.headers.get("Content-Type") || "";

    if (contentType.startsWith("video/")) {
      // 视频，返回内嵌自动播放页面
      const videoHtml = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8" />
          <title>视频播放</title>
          <style>body,html{margin:0;height:100%;background:#000;}video{width:100%;height:100%;}</style>
        </head>
        <body>
          <video controls autoplay muted playsinline>
            <source src="${targetUrl}" type="${contentType}">
            您的浏览器不支持视频播放。
          </video>
        </body>
        </html>
      `;
      return new Response(videoHtml, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    } else if (contentType.startsWith("image/")) {
      // 图片，返回幻灯片页面，支持多张图片可扩展
      const imageHtml = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8" />
          <title>图片幻灯片</title>
          <style>
            body,html{margin:0;padding:0;background:#111;color:#eee;display:flex;justify-content:center;align-items:center;height:100vh;}
            img{max-width:90vw;max-height:90vh;object-fit:contain;border-radius:8px;box-shadow:0 0 20px rgba(0,0,0,0.7);}
          </style>
        </head>
        <body>
          <img src="${targetUrl}" alt="共享图片" />
        </body>
        </html>
      `;
      return new Response(imageHtml, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    } else {
      // 其他类型或无内容，显示无内容页面
      const noContentHtml = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head><meta charset="UTF-8" /><title>无内容</title></head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#222;color:#ccc;font-size:24px;">
          无可显示的内容
        </body>
        </html>
      `;
      return new Response(noContentHtml, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }
  } catch (e) {
    return new Response("代理请求出错: " + e.message, { status: 500 });
  }
}
