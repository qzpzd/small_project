const $ = (sel) => document.querySelector(sel);

async function loadDefaults() {
  try {
    const r = await fetch("/api/defaults");
    const d = await r.json();
    $("#ul_model").value = d.ultralytics_model || "yolo26n.pt";
    $("#rust_model").value = d.rust_model || "";
    $("#ul_device").value = d.ultralytics_device || "0";
    $("#rust_device").value = d.rust_device || "tensorrt:0";
    $("#conf").value = d.conf ?? 0.25;
    $("#imgsz").value = d.imgsz ?? 640;
    $("#warmup").value = d.warmup ?? 1;
  } catch (_) {
    /* ignore */
  }
}

function setStatus(text, isErr = false) {
  const el = $("#status");
  el.textContent = text;
  el.classList.toggle("err", isErr);
}

function renderBars(container, speed, maxE2e) {
  const stages = [
    ["pre", "preprocess_ms"],
    ["infer", "inference_ms"],
    ["post", "postprocess_ms"],
    ["e2e", "e2e_ms"],
  ];
  container.innerHTML = "";
  const scale = Math.max(maxE2e, speed.e2e_ms || 1, 1);
  for (const [label, key] of stages) {
    const v = Number(speed[key] || 0);
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <span>${label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:0%"></div></div>
      <span class="bar-val">${v.toFixed(2)} ms</span>`;
    container.appendChild(row);
    requestAnimationFrame(() => {
      row.querySelector(".bar-fill").style.width = `${Math.min(100, (v / scale) * 100)}%`;
    });
  }
}

function showEngine(prefix, data, maxE2e) {
  if (!data) {
    $(`#${prefix}-meta`).textContent = "未运行";
    $(`#${prefix}-bars`).innerHTML = "";
    $(`#${prefix}-img`).removeAttribute("src");
    return;
  }
  const s = data.speed || {};
  $(`#${prefix}-meta`).textContent =
    `${data.model || ""} · device=${data.device_used} · dets=${data.count ?? "—"} · ` +
    `e2e ${s.e2e_ms} ms · ${s.fps} FPS` +
    (data.note ? ` · ${data.note}` : "");
  renderBars($(`#${prefix}-bars`), s, maxE2e);
  if (data.image_b64) {
    $(`#${prefix}-img`).src = `data:image/jpeg;base64,${data.image_b64}`;
  } else {
    $(`#${prefix}-img`).removeAttribute("src");
  }
}

function renderComparison(cmp) {
  const tbody = $("#cmp-table tbody");
  tbody.innerHTML = "";
  if (!cmp) {
    $("#analysis").classList.add("hidden");
    return;
  }
  $("#analysis").classList.remove("hidden");
  const labels = {
    preprocess_ms: "预处理 preprocess",
    inference_ms: "纯推理 inference",
    postprocess_ms: "后处理 postprocess",
    e2e_ms: "端到端 e2e",
  };
  for (const [k, label] of Object.entries(labels)) {
    const row = cmp.metrics[k];
    const tr = document.createElement("tr");
    const sp = row.speedup_vs_python;
    tr.innerHTML = `
      <td>${label}</td>
      <td>${Number(row.ultralytics).toFixed(3)}</td>
      <td>${Number(row.rust).toFixed(3)}</td>
      <td>${sp == null ? "—" : sp.toFixed(3) + "×"}</td>`;
    tbody.appendChild(tr);
  }
  const faster = cmp.faster_e2e;
  const e2e = cmp.metrics.e2e_ms;
  const sp = e2e.speedup_vs_python;
  if (faster === "rust") {
    $("#verdict").textContent =
      `端到端更快：Rust（ultralytics-inference），相对 Python 约 ${sp}×。`;
  } else {
    $("#verdict").textContent =
      `端到端更快：Ultralytics Python` +
      (sp ? `（Rust 为 Python 的 ${(1 / sp).toFixed(2)}× 耗时）` : "") +
      "。";
  }
}

$("#form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = $("#file").files[0];
  if (!file) {
    setStatus("请先选择图片", true);
    return;
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("ul_model", $("#ul_model").value.trim());
  fd.append("rust_model", $("#rust_model").value.trim());
  fd.append("ul_device", $("#ul_device").value.trim());
  fd.append("rust_device", $("#rust_device").value.trim());
  fd.append("conf", $("#conf").value);
  fd.append("imgsz", $("#imgsz").value);
  fd.append("warmup", $("#warmup").value);
  fd.append("engines", $("#engines").value);

  const btn = $("#run");
  btn.disabled = true;
  setStatus("推理中（含 warmup，首次 TensorRT 可能较慢）…");

  try {
    const res = await fetch("/api/compare", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || JSON.stringify(data));
    }

    const ul = data.ultralytics;
    const rust = data.rust;
    const maxE2e = Math.max(
      ul?.speed?.e2e_ms || 0,
      rust?.speed?.e2e_ms || 0,
      1
    );

    $("#results").classList.remove("hidden");
    showEngine("ul", ul, maxE2e);
    showEngine("rust", rust, maxE2e);
    renderComparison(data.comparison);
    setStatus("完成");
  } catch (err) {
    setStatus(String(err.message || err), true);
  } finally {
    btn.disabled = false;
  }
});

loadDefaults();
