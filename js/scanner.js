const CardScanner = {
  html5Qr: null,
  running: false,
  onCard: null,

  async open(callback) {
    this.onCard = callback;
    const modal = document.getElementById("scanner-modal");
    const resultEl = document.getElementById("scanner-result");
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    resultEl.textContent = "Kamera startet …";

    if (typeof Html5Qrcode === "undefined") {
      resultEl.textContent = "Scanner-Bibliothek nicht geladen.";
      return;
    }

    if (!this.html5Qr) {
      const formats = [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.QR_CODE,
      ];
      this.html5Qr = new Html5Qrcode("scanner-view", { formatsToSupport: formats });
    }

    const config = { fps: 8, qrbox: { width: 260, height: 120 }, aspectRatio: 1.5 };
    const cameras = await Html5Qrcode.getCameras().catch(() => []);
    let cameraId = { facingMode: "user" };
    const front = cameras.find(
      (c) => /front|user|selfie/i.test(c.label) || /vorder/i.test(c.label)
    );
    if (front) cameraId = front.id;

    if (this.running) await this.html5Qr.stop().catch(() => {});

    await this.html5Qr.start(
      cameraId,
      config,
      (text) => this.handleScan(text),
      () => {}
    );
    this.running = true;
    resultEl.textContent = "Barcode in den Rahmen halten …";
  },

  handleScan(text) {
    const id = text.trim();
    const card = GameData.getCard(id);
    const resultEl = document.getElementById("scanner-result");
    if (!card) {
      resultEl.textContent = `Unbekannte Karte: ${id}`;
      return;
    }
    resultEl.textContent = `Erkannt: ${card.name}`;
    if (this.onCard) this.onCard(card);
    this.close();
  },

  async close() {
    const modal = document.getElementById("scanner-modal");
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    if (this.html5Qr && this.running) {
      await this.html5Qr.stop().catch(() => {});
      this.running = false;
    }
  },
};

document.getElementById("btn-close-scan").addEventListener("click", () => CardScanner.close());

window.CardScanner = CardScanner;
