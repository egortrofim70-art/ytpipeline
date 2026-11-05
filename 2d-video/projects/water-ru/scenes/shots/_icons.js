// _icons.js — extra flat icons for the hunger video. Food is always drawn in its own colours (reads better than line-art);
// diagram icons use colour c. Every icon fits a ±75 box around 0,0. Returns false for an unknown name.
import { rr, seg, circle, ring, poly, text, alpha, shade, FONTS } from '/engine/core.js';

const BUN = '#d8923e', CRUMB = '#f2d6a2', CRUST = '#b8732e';
export function extraIcon(g, name, c, t = 0) {
  const st = (w = 6, col = c) => { g.strokeStyle = col; g.lineWidth = w; };
  switch (name) {
    case 'burger':
      g.fillStyle = BUN; g.beginPath(); g.ellipse(0, -14, 70, 44, 0, Math.PI, Math.PI * 2); g.fill();
      for (const [x, y] of [[-30, -36], [0, -44], [28, -34], [-12, -28], [16, -26]]) { g.fillStyle = '#fbeacc'; g.beginPath(); g.ellipse(x, y, 5, 3, 0.4, 0, 7); g.fill(); }
      g.fillStyle = '#5ab04a'; g.beginPath(); g.moveTo(-74, -10); for (let i = 0; i <= 8; i++) g.lineTo(-74 + i * 18.5, -10 + (i % 2 ? 10 : 0)); g.lineTo(74, 0); g.lineTo(-74, 0); g.fill();
      rr(g, -72, -2, 144, 16, 6); g.fillStyle = '#f2c24a'; g.fill();
      rr(g, -70, 10, 140, 26, 12); g.fillStyle = '#6a3a22'; g.fill();
      rr(g, -68, 34, 136, 24, 12); g.fillStyle = BUN; g.fill(); return true;
    case 'pizza':
      poly(g, [[-62, -54], [62, -54], [0, 70]], '#f2c14e'); rr(g, -70, -70, 140, 22, 11); g.fillStyle = CRUST; g.fill();
      for (const [x, y] of [[-24, -24], [18, -30], [0, 12], [-6, -44]]) circle(g, x, y, 11, '#d8443a'); return true;
    case 'drumstick':
      g.save(); g.rotate(-0.6); g.fillStyle = '#b8642e'; g.beginPath(); g.ellipse(-14, 0, 50, 36, 0, 0, 7); g.fill();
      g.fillStyle = alpha('#ffd9a0', 0.5); g.beginPath(); g.ellipse(-26, -12, 20, 10, -0.3, 0, 7); g.fill();
      rr(g, 30, -9, 40, 18, 9); g.fillStyle = '#f4efe2'; g.fill(); circle(g, 72, -11, 11, '#f4efe2'); circle(g, 72, 11, 11, '#f4efe2'); g.restore(); return true;
    case 'cake':
      poly(g, [[-66, 50], [66, 50], [66, -10], [-20, -40], [-66, -10]], '#f6e0c0');
      for (const y of [6, 28]) { g.fillStyle = '#e0607a'; g.fillRect(-66, y, 132, 9); }
      poly(g, [[-66, -10], [-20, -40], [66, -10], [66, -2], [-20, -32], [-66, -2]], '#ffffff'); circle(g, -14, -50, 13, '#d8263a'); seg(g, [[-14, -62], [-6, -76]], 3, '#4a8a3a'); return true;
    case 'bread':
      g.fillStyle = CRUST; g.beginPath(); g.moveTo(-58, 60); g.lineTo(-58, -10); g.arc(-30, -18, 36, Math.PI, Math.PI * 1.9); g.arc(30, -18, 36, Math.PI * 1.1, 0); g.lineTo(58, 60); g.closePath(); g.fill();
      g.fillStyle = CRUMB; g.beginPath(); g.moveTo(-48, 52); g.lineTo(-48, -8); g.arc(-28, -16, 26, Math.PI, Math.PI * 1.9); g.arc(28, -16, 26, Math.PI * 1.1, 0); g.lineTo(48, 52); g.closePath(); g.fill();
      for (const [x, y] of [[-20, 6], [14, 18], [-4, 34], [24, -6]]) circle(g, x, y, 4, alpha(CRUST, 0.5)); return true;
    case 'breadThin':   // a thin grey ration slice
      g.fillStyle = '#6a5a48'; rr(g, -64, -34, 128, 68, 16); g.fill(); g.fillStyle = '#8a7a66'; rr(g, -56, -26, 112, 52, 12); g.fill();
      for (const [x, y] of [[-30, -6], [10, 8], [30, -10], [-8, 12]]) circle(g, x, y, 4, '#5a4a3a'); return true;
    case 'apple':
      circle(g, -18, 6, 46, '#d8343a'); circle(g, 18, 6, 46, '#d8343a'); seg(g, [[0, -38], [6, -64]], 6, '#5a3a22');
      g.fillStyle = '#4aa04a'; g.beginPath(); g.ellipse(26, -58, 22, 10, -0.5, 0, 7); g.fill(); g.fillStyle = alpha('#ffffff', 0.35); g.beginPath(); g.ellipse(-30, -12, 10, 18, 0.4, 0, 7); g.fill(); return true;
    case 'lemon':
      g.fillStyle = '#f2d23a'; g.beginPath(); g.ellipse(0, 0, 66, 46, -0.2, 0, 7); g.fill(); circle(g, -66, 14, 9, '#f2d23a'); circle(g, 66, -14, 9, '#f2d23a');
      g.fillStyle = alpha('#ffffff', 0.35); g.beginPath(); g.ellipse(-18, -18, 22, 8, -0.3, 0, 7); g.fill(); return true;
    case 'orange':
      circle(g, 0, 6, 60, '#f28a1e'); g.fillStyle = '#4aa04a'; g.beginPath(); g.ellipse(18, -58, 20, 9, -0.4, 0, 7); g.fill();
      for (const [x, y] of [[-20, -10], [10, 20], [24, -12], [-6, 30]]) circle(g, x, y, 3, alpha('#b85a10', 0.6)); return true;
    case 'plate':
      g.fillStyle = '#e8ecf2'; g.beginPath(); g.ellipse(0, 10, 76, 40, 0, 0, 7); g.fill(); g.strokeStyle = '#b8c0cc'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 8, 50, 25, 0, 0, 7); g.stroke(); return true;
    case 'fork':
      st(7); seg(g, [[0, -20], [0, 70]], 9, c); for (const x of [-16, 0, 16]) seg(g, [[x, -70], [x, -30]], 6, c); g.beginPath(); g.moveTo(-16, -30); g.quadraticCurveTo(0, -6, 16, -30); g.stroke(); return true;
    case 'cookbook':
      rr(g, -56, -70, 112, 140, 8); g.fillStyle = '#c0503a'; g.fill(); g.fillStyle = '#f4efe2'; g.fillRect(48, -64, 8, 128);
      g.save(); g.translate(0, -8); g.scale(0.5, 0.5); extraIcon(g, 'cake', c, t); g.restore(); rr(g, -36, 40, 72, 10, 4); g.fillStyle = '#f4efe2'; g.fill(); return true;
    case 'gum':
      for (let i = 0; i < 4; i++) { rr(g, -64 + i * 8, -44 + i * 22, 120, 18, 5); g.fillStyle = i % 2 ? '#ff8ab0' : '#f06a98'; g.fill(); } return true;
    case 'tea': case 'coffee': case 'water': {
      const liq = name === 'tea' ? '#b8642e' : name === 'coffee' ? '#4a2a1a' : '#6ab8ff';
      if (name === 'water') { g.fillStyle = alpha('#dff2ff', 0.35); g.beginPath(); g.moveTo(-40, -60); g.lineTo(40, -60); g.lineTo(32, 64); g.lineTo(-32, 64); g.closePath(); g.fill(); g.fillStyle = alpha(liq, 0.85); g.beginPath(); g.moveTo(-36, -20); g.lineTo(36, -20); g.lineTo(32, 64); g.lineTo(-32, 64); g.closePath(); g.fill(); st(4, '#e8f4ff'); g.beginPath(); g.moveTo(-40, -60); g.lineTo(-32, 64); g.lineTo(32, 64); g.lineTo(40, -60); g.stroke(); return true; }
      rr(g, -48, -30, 96, 90, 18); g.fillStyle = '#f4efe8'; g.fill(); g.fillStyle = liq; g.beginPath(); g.ellipse(0, -28, 44, 10, 0, 0, 7); g.fill();
      st(10, '#f4efe8'); g.beginPath(); g.arc(52, 12, 20, -1.2, 1.2); g.stroke();
      st(5, alpha('#ffffff', 0.6)); for (const x of [-18, 6]) { g.beginPath(); g.moveTo(x, -44); g.quadraticCurveTo(x + 14 * Math.sin(t * 3 + x), -60, x, -80); g.stroke(); } return true; }
    case 'droplet': g.fillStyle = c; g.beginPath(); g.moveTo(0, -70); g.quadraticCurveTo(50, 0, 46, 24); g.arc(0, 24, 46, 0, Math.PI); g.quadraticCurveTo(-50, 0, 0, -70); g.fill(); return true;
    case 'fat': g.fillStyle = '#f2d06a'; g.beginPath(); g.moveTo(0, -70); g.quadraticCurveTo(50, 0, 46, 24); g.arc(0, 24, 46, 0, Math.PI); g.quadraticCurveTo(-50, 0, 0, -70); g.fill(); g.fillStyle = alpha('#ffffff', 0.4); g.beginPath(); g.ellipse(-16, 10, 10, 18, 0.3, 0, 7); g.fill(); return true;
    case 'sugar': for (const [x, y] of [[-30, 20], [30, 20], [0, -30]]) { rr(g, x - 30, y - 30, 60, 60, 8); g.fillStyle = '#f4f4f8'; g.fill(); g.strokeStyle = '#c8ccd8'; g.lineWidth = 3; g.stroke(); } return true;
    case 'ketone': st(6); g.beginPath(); for (let i = 0; i <= 6; i++) { const a = i * Math.PI / 3; g.lineTo(Math.cos(a) * 46, Math.sin(a) * 46); } g.stroke(); seg(g, [[46, 0], [74, -20]], 6, c); circle(g, 78, -24, 9, c); return true;
    case 'muscle':
      g.fillStyle = c; g.beginPath(); g.moveTo(-70, 40); g.quadraticCurveTo(-60, -10, -20, -20); g.quadraticCurveTo(-10, -70, 20, -66); g.quadraticCurveTo(40, -60, 30, -40); g.quadraticCurveTo(10, -36, 6, -20);
      g.quadraticCurveTo(60, -30, 70, 20); g.quadraticCurveTo(50, 50, -70, 56); g.closePath(); g.fill(); return true;
    case 'liver': g.fillStyle = c; g.beginPath(); g.moveTo(-70, -20); g.quadraticCurveTo(-40, -60, 30, -50); g.quadraticCurveTo(80, -40, 70, -10); g.quadraticCurveTo(40, 30, -10, 50); g.quadraticCurveTo(-70, 40, -70, -20); g.fill(); return true;
    case 'kidney': for (const s of [-1, 1]) { g.save(); g.translate(s * 34, 0); g.scale(s, 1); g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, 28, 50, 0, 0, 7); g.fill(); g.fillStyle = '#0b1324'; g.beginPath(); g.ellipse(-24, 0, 12, 16, 0, 0, 7); g.fill(); g.restore(); } return true;
    case 'tooth': g.fillStyle = c; g.beginPath(); g.moveTo(-44, -50); g.quadraticCurveTo(0, -70, 44, -50); g.quadraticCurveTo(56, -10, 34, 20); g.lineTo(24, 66); g.lineTo(6, 30); g.lineTo(-6, 30); g.lineTo(-24, 66); g.lineTo(-34, 20); g.quadraticCurveTo(-56, -10, -44, -50); g.fill(); return true;
    case 'blood': g.fillStyle = '#e0303a'; g.beginPath(); g.moveTo(0, -70); g.quadraticCurveTo(50, 0, 46, 24); g.arc(0, 24, 46, 0, Math.PI); g.quadraticCurveTo(-50, 0, 0, -70); g.fill(); return true;
    case 'bandage': g.save(); g.rotate(-0.6); rr(g, -76, -24, 152, 48, 22); g.fillStyle = '#f0c8a0'; g.fill(); rr(g, -26, -24, 52, 48, 6); g.fillStyle = '#f8e4cc'; g.fill(); for (const [x, y] of [[-10, -8], [10, -8], [-10, 8], [10, 8]]) circle(g, x, y, 3, '#c8a080'); g.restore(); return true;
    case 'medal': seg(g, [[-30, -70], [0, -10]], 22, '#3a6ac8'); seg(g, [[30, -70], [0, -10]], 22, '#c83a3a'); circle(g, 0, 22, 46, '#f2c23a'); ring(g, 0, 22, 34, 5, '#c8901a'); return true;
    case 'gavel': g.save(); g.rotate(-0.5); rr(g, -60, -30, 70, 40, 8); g.fillStyle = '#8a5a32'; g.fill(); seg(g, [[-24, 8], [-24, 80]], 12, '#6a4022'); g.restore(); rr(g, -10, 52, 80, 18, 6); g.fillStyle = '#6a4022'; g.fill(); return true;
    case 'book': rr(g, -54, -70, 108, 140, 8); g.fillStyle = '#d8a82a'; g.fill(); g.fillStyle = '#8a6a10'; g.fillRect(-54, -70, 14, 140); ring(g, 8, -6, 26, 5, '#8a6a10'); circle(g, 8, -6, 8, '#8a6a10'); return true;
    case 'calendar': rr(g, -60, -56, 120, 120, 10); g.fillStyle = '#f4efe6'; g.fill(); rr(g, -60, -56, 120, 34, 10); g.fillStyle = '#e04a3a'; g.fill(); for (let i = 0; i < 9; i++) circle(g, -34 + (i % 3) * 34, -2 + Math.floor(i / 3) * 22, 6, '#9a9aaa'); return true;
    case 'hair': st(5); for (let k = 0; k < 3; k++) { const y0 = -60 + ((t * 40 + k * 40) % 120); g.beginPath(); g.moveTo(-40 + k * 40, y0); g.quadraticCurveTo(-24 + k * 40, y0 + 20, -40 + k * 40, y0 + 40); g.quadraticCurveTo(-56 + k * 40, y0 + 60, -40 + k * 40, y0 + 80); g.stroke(); } return true;
    case 'bulb': circle(g, 0, -14, 46, c); rr(g, -22, 30, 44, 34, 6); g.fillStyle = shade(c, -0.4); g.fill(); return true;
    case 'thermo': rr(g, -14, -70, 28, 110, 14); g.strokeStyle = c; g.lineWidth = 6; g.stroke(); circle(g, 0, 48, 24, c); g.fillStyle = c; g.fillRect(-6, -10, 12, 50); return true;
    case 'snow': st(6); for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; seg(g, [[Math.cos(a) * -64, Math.sin(a) * -64], [Math.cos(a) * 64, Math.sin(a) * 64]], 6, c); } return true;

    case 'cube': rr(g, -46, -46, 92, 92, 10); g.fillStyle = '#f6f6fa'; g.fill(); g.strokeStyle = '#c8ccd8'; g.lineWidth = 4; g.stroke(); for (const [x, y] of [[-20, -18], [16, -6], [-6, 20], [22, 22]]) circle(g, x, y, 3, '#d8dce6'); return true;
    case 'donut': circle(g, 0, 0, 66, '#d8923e'); g.fillStyle = '#ff7ab0'; g.beginPath(); g.arc(0, 0, 60, Math.PI * 1.05, Math.PI * 2.95); g.arc(0, 0, 24, Math.PI * 2.95, Math.PI * 1.05, true); g.fill(); circle(g, 0, 0, 22, '#0b1324');
      for (let i = 0; i < 10; i++) { const a = i * 0.63, r = 42; seg(g, [[Math.cos(a) * r - 6, Math.sin(a) * r], [Math.cos(a) * r + 6, Math.sin(a) * r + 3]], 5, ['#ffe24a', '#6ad0ff', '#ffffff'][i % 3]); } return true;
    case 'chocolate': rr(g, -56, -70, 112, 140, 8); g.fillStyle = '#5a3420'; g.fill(); g.strokeStyle = '#3a2010'; g.lineWidth = 4; for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(-56 + i * 37, -70); g.lineTo(-56 + i * 37, 70); g.stroke(); } for (let j = 1; j < 4; j++) { g.beginPath(); g.moveTo(-56, -70 + j * 35); g.lineTo(56, -70 + j * 35); g.stroke(); }
      poly(g, [[-60, 10], [60, -10], [60, 74], [-60, 74]], '#c8302a'); text(g, 'CHOCO', 0, 46, { size: 26, font: FONTS.ui, weight: 900, color: '#fff' }); return true;
    case 'soda': rr(g, -40, -72, 80, 144, 16); g.fillStyle = '#d8262a'; g.fill(); rr(g, -34, -80, 68, 14, 6); g.fillStyle = '#c8ccd4'; g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.beginPath(); g.moveTo(-40, 0); g.quadraticCurveTo(0, -30, 40, 10); g.stroke(); g.fillStyle = alpha('#ffffff', 0.3); g.fillRect(-30, -60, 10, 120); return true;
    case 'candy': g.fillStyle = '#ff5a8a'; g.beginPath(); g.ellipse(0, 0, 40, 30, 0, 0, Math.PI * 2); g.fill(); poly(g, [[-38, 0], [-76, -26], [-76, 26]], '#ff8ab0'); poly(g, [[38, 0], [76, -26], [76, 26]], '#ff8ab0'); seg(g, [[-16, -22], [10, 24]], 6, '#ffffff'); return true;
    case 'strawberry': g.fillStyle = '#e0283a'; g.beginPath(); g.moveTo(0, 70); g.quadraticCurveTo(-70, 10, -50, -30); g.quadraticCurveTo(0, -60, 50, -30); g.quadraticCurveTo(70, 10, 0, 70); g.fill(); for (const [x, y] of [[-20, -10], [10, -16], [-6, 16], [20, 10], [0, 40], [-26, 20]]) circle(g, x, y, 3.5, '#ffe28a');
      poly(g, [[-40, -36], [0, -50], [40, -36], [14, -30], [0, -66], [-14, -30]], '#4aa04a'); return true;
    case 'ketchup': rr(g, -34, -50, 68, 120, 18); g.fillStyle = '#d8262a'; g.fill(); rr(g, -16, -76, 32, 30, 6); g.fillStyle = '#f4f4f4'; g.fill(); rr(g, -26, -10, 52, 40, 6); g.fillStyle = '#f4f0e0'; g.fill(); return true;
    case 'cereal': rr(g, -52, -72, 104, 144, 6); g.fillStyle = '#f2b830'; g.fill(); rr(g, -40, -50, 80, 34, 6); g.fillStyle = '#3a7ad8'; g.fill(); text(g, 'INTEGRAL', 0, -32, { size: 15, font: FONTS.ui, weight: 900, color: '#fff' }); for (const [x, y] of [[-20, 20], [10, 30], [24, 6], [-6, 48]]) circle(g, x, y, 11, '#c87a20'); return true;
    case 'yogurt': g.fillStyle = '#f4f2ee'; g.beginPath(); g.moveTo(-50, -50); g.lineTo(50, -50); g.lineTo(40, 66); g.lineTo(-40, 66); g.closePath(); g.fill(); rr(g, -56, -64, 112, 18, 6); g.fillStyle = '#e0607a'; g.fill(); extraIcon(g, 'strawberry', c, t); return true;
    case 'breadBag': rr(g, -60, -56, 120, 120, 30); g.fillStyle = alpha('#e8f0ff', 0.85); g.fill(); rr(g, -50, -40, 100, 96, 24); g.fillStyle = '#e8b878'; g.fill(); rr(g, -12, -70, 24, 18, 4); g.fillStyle = '#3a7ad8'; g.fill(); return true;
    case 'cane': for (const dx of [-30, 0, 30]) { seg(g, [[dx, 70], [dx + 6, -70]], 12, '#8ab04a'); for (let k = -50; k < 70; k += 28) seg(g, [[dx - 7, k], [dx + 7, k]], 4, '#5a7a2a'); poly(g, [[dx + 6, -70], [dx + 40, -40], [dx + 10, -50]], '#5aa04a'); } return true;
    case 'octagon': { g.fillStyle = '#0a0a0a'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; g.lineTo(Math.cos(a) * 70, Math.sin(a) * 70); } g.closePath(); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.stroke();
      text(g, 'ALTO EN', 0, -18, { size: 22, font: FONTS.ui, weight: 900, color: '#fff' }); text(g, 'AZÚCARES', 0, 10, { size: 22, font: FONTS.ui, weight: 900, color: '#fff' }); text(g, 'MINISTERIO', 0, 40, { size: 11, font: FONTS.ui, weight: 800, color: '#ccc' }); return true; }
    case 'peso': circle(g, 0, 0, 60, '#c8a040'); ring(g, 0, 0, 48, 5, '#8a6a20'); text(g, '$1', 0, 4, { size: 48, font: FONTS.ui, weight: 900, color: '#5a4010' }); return true;
    case 'pudding': g.fillStyle = '#d8a050'; g.beginPath(); g.moveTo(-60, 50); g.lineTo(-40, -30); g.quadraticCurveTo(0, -50, 40, -30); g.lineTo(60, 50); g.closePath(); g.fill(); g.fillStyle = '#6a3a1a'; g.beginPath(); g.moveTo(-40, -30); g.quadraticCurveTo(0, -56, 40, -30); g.quadraticCurveTo(20, -10, 0, -20); g.quadraticCurveTo(-20, -6, -40, -30); g.fill(); rr(g, -74, 46, 148, 14, 7); g.fillStyle = '#e8ecf2'; g.fill(); return true;
    case 'coffeeBlack': return extraIcon(g, 'coffee', c, t);
    case 'cake2': rr(g, -66, -20, 132, 80, 10); g.fillStyle = '#f6e0c0'; g.fill(); rr(g, -66, -30, 132, 24, 10); g.fillStyle = '#ff8ab0'; g.fill(); for (const x of [-36, 0, 36]) { rr(g, x - 5, -64, 10, 34, 3); g.fillStyle = '#6ad0ff'; g.fill(); circle(g, x, -70, 7, '#ffd24a'); } return true;
    case 'syringeFree': return false;
    case 'rat': g.fillStyle = c; g.beginPath(); g.ellipse(0, 10, 56, 32, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(40, -6); g.quadraticCurveTo(90, 6, 76, 22); g.quadraticCurveTo(50, 30, 40, 26); g.fill(); circle(g, 40, -16, 14, c); circle(g, 68, 8, 4, '#0b1324');
      g.strokeStyle = c; g.lineWidth = 5; g.beginPath(); g.moveTo(-54, 14); g.quadraticCurveTo(-100, 10, -90, -30); g.stroke(); return true;
    case 'virusShield': return false;
    case 'people': for (const [x, s] of [[-30, 1], [30, 0.9]]) { circle(g, x, -30 * s, 24 * s, c); g.fillStyle = c; g.beginPath(); g.ellipse(x, 40, 36 * s, 34 * s, 0, Math.PI, Math.PI * 2); g.fill(); } return true;
    case 'girl': circle(g, 0, -30, 28, c); circle(g, -20, -58, 16, c); g.fillStyle = c; g.beginPath(); g.moveTo(-40, 66); g.lineTo(0, 6); g.lineTo(40, 66); g.closePath(); g.fill(); return true;
    case 'vitC': case 'vitD': case 'vitB': { const col = { vitC: '#f28a1e', vitD: '#f2c23a', vitB: '#e0607a' }[name]; circle(g, 0, 0, 56, col); text(g, name.slice(3) + (name === 'vitB' ? '12' : ''), 0, 4, { size: name === 'vitB' ? 46 : 64, font: FONTS.ui, weight: 900, color: '#ffffff' }); return true; }
    case 'potassium': circle(g, 0, 0, 56, '#9a6ad8'); text(g, 'K', 0, 4, { size: 64, font: FONTS.ui, weight: 900, color: '#ffffff' }); return true;
    case 'yeast': rr(g, -40, -46, 80, 110, 12); g.fillStyle = '#f2e2b8'; g.fill(); rr(g, -46, -64, 92, 26, 8); g.fillStyle = '#c8a040'; g.fill(); for (const [x, y] of [[-14, 0], [12, 14], [-6, 30], [16, -14]]) circle(g, x, y, 7, '#d8b870'); return true;
    case 'toilet': rr(g, -30, -70, 60, 40, 8); g.fillStyle = c; g.fill(); g.fillStyle = c; g.beginPath(); g.ellipse(0, -10, 56, 22, 0, 0, 7); g.fill(); poly(g, [[-40, -6], [40, -6], [24, 60], [-24, 60]], c); return true;
    case 'stairs': g.fillStyle = c; g.beginPath(); g.moveTo(-70, 66); for (let i = 0; i < 4; i++) { g.lineTo(-70 + i * 35, 66 - (i + 1) * 32); g.lineTo(-35 + i * 35, 66 - (i + 1) * 32); } g.lineTo(70, 66); g.closePath(); g.fill(); return true;
    case 'scaleW': rr(g, -66, -20, 132, 86, 18); g.fillStyle = c; g.fill(); rr(g, -34, -6, 68, 26, 6); g.fillStyle = '#0b1324'; g.fill(); return true;
    case 'globeI': ring(g, 0, 0, 60, 6, c); g.strokeStyle = c; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, 26, 60, 0, 0, 7); g.stroke(); seg(g, [[-60, 0], [60, 0]], 4, c); return true;
    case 'lungs': for (const s of [-1, 1]) { g.fillStyle = c; g.beginPath(); g.ellipse(s * 30, 10, 26, 52, s * 0.15, 0, 7); g.fill(); } seg(g, [[0, -70], [0, -20]], 8, c); return true;
  }
  return false;
}
