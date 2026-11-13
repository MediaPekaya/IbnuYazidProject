/* Pintu bunyi menyesuai: mengikuti paras bunyi latar yang mendatar (kipas, hujan, dengung) dan hanya terbuka apabila suara naik jauh di atasnya. */
class GsGate extends AudioWorkletProcessor {
  constructor() { super(); this.floor = 0.01; this.gain = 0; this.hold = 0; this.env = 0; this.learn = 0.3 * sampleRate / 128; this.port.onmessage = () => { this.learn = 0.3 * sampleRate / 128; this.floor = 0.01; }; }
  process(inputs, outputs) {
    const i = inputs[0], o = outputs[0];
    if (!i || !i[0] || !o || !o[0]) return true;
    const x = i[0], y = o[0], len = x.length;
    let s = 0; for (let k = 0; k < len; k++) s += x[k] * x[k];
    const rms = Math.sqrt(s / len);
    // anggaran paras bunyi latar: turun segera, naik sangat perlahan (bunyi mendatar diikuti, suara yang pendek tidak)
    if (this.learn > 0) { this.learn -= 1; this.floor += (rms - this.floor) * 0.15; this.hold = 0; }
    else if (rms < this.floor) this.floor += (rms - this.floor) * 0.05; else this.floor += (rms - this.floor) * 0.0006;
    this.floor = Math.max(this.floor, 0.0003);
    const open = Math.max(0.0035, this.floor * 4.5), close = Math.max(0.0022, this.floor * 2.6);   // paras minimum mutlak kira-kira -49 dB / -53 dB
    this.env += (rms - this.env) * 0.35;
    if (this.learn > 0) { /* belajar paras bunyi latar: senyap seketika */ }
    else if (this.env > open) this.hold = 0.28 * sampleRate / len;
    else if (this.env > close && this.hold > 0) this.hold -= 0.25;
    else this.hold -= 1;
    const target = this.hold > 0 ? 1 : 0;
    const a = target > this.gain ? 0.25 : 0.04;
    for (let k = 0; k < len; k++) { this.gain += (target - this.gain) * (a / len * 8); y[k] = x[k] * this.gain; }
    if (this.gain < 0.0008 && target === 0) { this.gain = 0; for (let k = 0; k < len; k++) y[k] = 0; }
    return true;
  }
}
registerProcessor('gs-gate', GsGate);
