import QRCode from "qrcode";

export function createQrDataUrl(url: string, width: number) {
  return QRCode.toDataURL(url, {
    width,
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#f8fafc",
    },
  });
}

export function downloadQrDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
