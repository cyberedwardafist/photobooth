/* Format berkas frame (JSON) buatan AI. Satu sumber untuk peramban (admin) dan server (api/ + server.js). */
(function (root, make) { if (typeof module === 'object' && module.exports) module.exports = make(); else root.FrameSpec = make(); })(this, function () {
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const RGBA = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/;
  const PATS = ['none', 'dots', 'stripes', 'checker', 'film', 'hearts', 'stars'];
  const int = (v, min, max, name) => {
    if (v === undefined) return undefined;
    if (!Number.isFinite(v)) throw new Error(`${name} harus angka`);
    return Math.min(max, Math.max(min, Math.round(v)));
  };
  const color = (v, name) => {
    if (typeof v !== 'string' || !(HEX.test(v.trim()) || RGBA.test(v.trim()))) throw new Error(`${name} harus #RRGGBB atau rgba(...)`);
    return v.trim();
  };
  const hex = (v, name) => {
    if (typeof v !== 'string' || !HEX.test(v.trim())) throw new Error(`${name} harus berformat #RRGGBB`);
    return v.trim();
  };

  // Satu objek -> frame bersih, atau melempar Error berisi alasan.
  function one(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('bukan objek frame');
    const name = typeof o.name === 'string' ? o.name.trim() : '';
    if (!name || name.length > 30) throw new Error('name wajib diisi, maksimal 30 huruf');
    const f = { name };
    f.bg = Array.isArray(o.bg)
      ? (o.bg.length === 2 ? [hex(o.bg[0], 'bg[0]'), hex(o.bg[1], 'bg[1]')] : (() => { throw new Error('bg gradasi harus berisi dua warna'); })())
      : hex(o.bg, 'bg');
    f.ink = hex(o.ink, 'ink');
    if (o.pat !== undefined) {
      if (!PATS.includes(o.pat)) throw new Error('pat harus salah satu dari: ' + PATS.join(', '));
      if (o.pat !== 'none') { f.pat = o.pat; f.pc = o.pc === undefined ? 'rgba(255,255,255,.5)' : color(o.pc, 'pc'); }
    }
    for (const [k, min, max] of [['g', 10, 80], ['r', 0, 40], ['bw', 0, 12]]) { const v = int(o[k], min, max, k); if (v !== undefined) f[k] = v; }
    if (f.bw) f.bc = o.bc === undefined ? '#FFFFFF' : hex(o.bc, 'bc');
    if (o.sh !== undefined) f.sh = o.sh ? 1 : 0;
    if (o.ob !== undefined && o.ob !== null) {
      if (typeof o.ob !== 'object') throw new Error('ob harus berupa {w, c}');
      const w = int(o.ob.w, 1, 12, 'ob.w'); if (w) f.ob = { w, c: hex(o.ob.c, 'ob.c') };
    }
    if (o.cat !== undefined && o.cat !== null && o.cat !== '') {
      const c = String(o.cat).trim().slice(0, 24); if (c && c !== '__new__') f.cat = c;
    }
    return f;
  }

  // Teks JSON -> [{ok} | {error}] per frame (untuk pratinjau di admin).
  function parse(text) {
    let j;
    try { j = JSON.parse(text); } catch { throw new Error('Isi berkas bukan JSON yang valid'); }
    const list = Array.isArray(j) ? j : j && Array.isArray(j.frames) ? j.frames : [j];
    if (!list.length || list.length > 30) throw new Error('Berkas harus berisi 1 sampai 30 frame');
    return list.map((o, i) => { try { return { ok: one(o) }; } catch (e) { return { error: `Frame ${i + 1}: ${e.message}` }; } });
  }

  // Daftar objek -> daftar frame bersih; kalau ada yang salah, melempar Error pertama.
  function clean(list) {
    if (!Array.isArray(list) || !list.length || list.length > 30) throw new Error('Kirim 1 sampai 30 frame');
    return list.map((o, i) => { try { return one(o); } catch (e) { throw new Error(`Frame ${i + 1}: ${e.message}`); } });
  }

  return { one, parse, clean, PATS };
});
